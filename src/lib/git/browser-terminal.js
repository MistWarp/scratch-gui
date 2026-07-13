import {Bash, defineCommand} from 'just-bash';

import {
    REPO_DIR,
    deleteWorktreeFile,
    getDefaultAuthor,
    getFs,
    git,
    listWorktreeFiles,
    readWorktreeFile,
    writeWorktreeFile
} from './browser-git';
import {formatStatusRows} from './status-format';

const bytesEqual = (a, b) => {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

const safeGitPath = value => {
    const path = String(value || '').replace(/^\.\//, '');
    const parts = path.split('/');
    if (!path || path.startsWith('/') || parts.some(part => !part || part === '.' || part === '..') ||
        parts[0] === '.git') {
        throw new Error(`invalid path: ${value}`);
    }
    return path;
};

const readWorkspace = async () => {
    const files = {};
    for (const filepath of await listWorktreeFiles()) {
        files[`${REPO_DIR}/${filepath}`] = await readWorktreeFile(filepath);
    }
    return files;
};

const readBashWorkspace = async bash => {
    const files = {};
    const walk = async directory => {
        for (const entry of await bash.fs.readdir(directory)) {
            const fullPath = `${directory}/${entry}`;
            const stat = await bash.fs.stat(fullPath);
            if (stat.isDirectory) {
                await walk(fullPath);
            } else if (stat.isFile) {
                files[fullPath] = await bash.fs.readFileBuffer(fullPath);
            }
        }
    };
    await walk(REPO_DIR);
    return files;
};

const syncWorkspace = async (before, bash) => {
    const after = await readBashWorkspace(bash);
    let changed = false;

    for (const fullPath of Object.keys(before)) {
        if (!after[fullPath]) {
            await deleteWorktreeFile(fullPath.slice(REPO_DIR.length + 1));
            changed = true;
        }
    }
    for (const [fullPath, contents] of Object.entries(after)) {
        if (!bytesEqual(before[fullPath], contents)) {
            await writeWorktreeFile(fullPath.slice(REPO_DIR.length + 1), contents);
            changed = true;
        }
    }
    return changed;
};

const statusLines = async () => {
    const matrix = await git.statusMatrix({fs: getFs(), dir: REPO_DIR});
    return formatStatusRows(matrix);
};

const stagePaths = async args => {
    const fs = getFs();
    const matrix = await git.statusMatrix({fs, dir: REPO_DIR});
    const requested = args.length === 0 || args.includes('.') || args.includes('-A') ?
        null : new Set(args.filter(arg => !arg.startsWith('-')).map(safeGitPath));
    let count = 0;
    for (const [filepath, , workdir] of matrix) {
        if (requested && !requested.has(filepath)) continue;
        if (workdir === 0) {
            await git.remove({fs, dir: REPO_DIR, filepath});
        } else {
            await git.add({fs, dir: REPO_DIR, filepath});
        }
        count += 1;
    }
    return count;
};

const SHELL_HELP = `MistWarp Fractch shell

  files      cat cp file find head ln ls mkdir mv rm rmdir stat tail touch tree wc
  text       awk column comm cut diff expand fold grep join nl od paste rev rg sed sort
             split strings tac tee tr uniq xargs
  data       base64 gzip jq md5sum
  shell      alias bash clear date du echo env expr history hostname printf pwd readlink
             seq sleep timeout which whoami
  project    git (see: git help)

Not available in the browser: curl, python3, sqlite3, tar and other host-only tools.
`;

const gitHelp = `Supported git commands:
  status, add, rm, commit, log, branch, checkout, diff --name-only,
  config, remote, rev-parse
Use MistWarp's Version Control window for clone, pull, push, and merges.\n`;

const createGitCommand = state => defineCommand('git', async args => {
    const fs = getFs();
    const subcommand = args.shift() || 'help';
    state.usedGit = true;
    try {
        switch (subcommand) {
        case 'help':
        case '--help':
            return {stdout: gitHelp, stderr: '', exitCode: 0};
        case 'init':
            return {stdout: 'Repository already initialized in /repo\n', stderr: '', exitCode: 0};
        case 'status': { // eslint-disable-line no-case-declarations
            const branch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
            const lines = await statusLines();
            const summary = lines.length ? `${lines.join('\n')}\n` : 'nothing to commit, working tree clean\n';
            return {
                stdout: `On branch ${branch || '(detached)'}\n${summary}`,
                stderr: '',
                exitCode: 0
            };
        }
        case 'add': { // eslint-disable-line no-case-declarations
            const count = await stagePaths(args);
            return {stdout: `staged ${count} file${count === 1 ? '' : 's'}\n`, stderr: '', exitCode: 0};
        }
        case 'rm': { // eslint-disable-line no-case-declarations
            for (const value of args.filter(arg => !arg.startsWith('-'))) {
                const filepath = safeGitPath(value);
                await deleteWorktreeFile(filepath);
                await git.remove({fs, dir: REPO_DIR, filepath});
            }
            state.worktreeChanged = true;
            return {stdout: '', stderr: '', exitCode: 0};
        }
        case 'commit': { // eslint-disable-line no-case-declarations
            const messageIndex = args.indexOf('-m');
            const message = messageIndex === -1 ? '' : args[messageIndex + 1];
            if (!message) throw new Error('usage: git commit -m "message"');
            const oid = await git.commit({
                fs,
                dir: REPO_DIR,
                message,
                author: getDefaultAuthor()
            });
            return {stdout: `[${oid.slice(0, 7)}] ${message}\n`, stderr: '', exitCode: 0};
        }
        case 'log': { // eslint-disable-line no-case-declarations
            const commits = await git.log({fs, dir: REPO_DIR, depth: 20});
            const oneline = args.includes('--oneline');
            const output = commits.map(({oid, commit}) => {
                if (oneline) return `${oid.slice(0, 7)} ${commit.message.split('\n')[0]}`;
                return `commit ${oid}\nAuthor: ${commit.author.name} <${commit.author.email}>\n\n    ${commit.message}`;
            }).join('\n');
            return {stdout: `${output}\n`, stderr: '', exitCode: 0};
        }
        case 'branch': { // eslint-disable-line no-case-declarations
            const current = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
            if (args[0] === '-d' && args[1]) {
                await git.deleteBranch({fs, dir: REPO_DIR, ref: args[1]});
                return {stdout: `Deleted branch ${args[1]}\n`, stderr: '', exitCode: 0};
            }
            if (args[0]) {
                await git.branch({fs, dir: REPO_DIR, ref: args[0]});
                return {stdout: '', stderr: '', exitCode: 0};
            }
            const branches = await git.listBranches({fs, dir: REPO_DIR});
            return {
                stdout: `${branches.map(branch => `${branch === current ? '*' : ' '} ${branch}`).join('\n')}\n`,
                stderr: '',
                exitCode: 0
            };
        }
        case 'checkout': { // eslint-disable-line no-case-declarations
            if (!args[0]) throw new Error('usage: git checkout <branch>');
            await git.checkout({fs, dir: REPO_DIR, ref: args[0], force: true});
            state.worktreeChanged = true;
            return {stdout: `Switched to ${args[0]}\n`, stderr: '', exitCode: 0};
        }
        case 'diff': { // eslint-disable-line no-case-declarations
            const lines = await statusLines();
            const output = args.includes('--name-only') ? lines.map(line => line.slice(3)) : lines;
            return {stdout: `${output.join('\n')}${output.length ? '\n' : ''}`, stderr: '', exitCode: 0};
        }
        case 'config': { // eslint-disable-line no-case-declarations
            const path = args.filter(arg => !arg.startsWith('-'))[0];
            const value = args.filter(arg => !arg.startsWith('-'))[1];
            if (!path) throw new Error('usage: git config <key> [value]');
            if (typeof value === 'string') {
                await git.setConfig({fs, dir: REPO_DIR, path, value});
                return {stdout: '', stderr: '', exitCode: 0};
            }
            const result = await git.getConfig({fs, dir: REPO_DIR, path});
            return {stdout: result ? `${result}\n` : '', stderr: '', exitCode: result ? 0 : 1};
        }
        case 'remote': { // eslint-disable-line no-case-declarations
            const remotes = await git.listRemotes({fs, dir: REPO_DIR});
            const verbose = args.includes('-v');
            const lines = remotes.map(({remote, url}) => {
                if (verbose) return `${remote}\t${url} (fetch)\n${remote}\t${url} (push)`;
                return remote;
            });
            return {stdout: `${lines.join('\n')}${lines.length ? '\n' : ''}`, stderr: '', exitCode: 0};
        }
        case 'rev-parse': { // eslint-disable-line no-case-declarations
            if (args.includes('--abbrev-ref') && args.includes('HEAD')) {
                const branch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
                return {stdout: `${branch || 'HEAD'}\n`, stderr: '', exitCode: 0};
            }
            const oid = await git.resolveRef({fs, dir: REPO_DIR, ref: args[0] || 'HEAD'});
            return {stdout: `${oid}\n`, stderr: '', exitCode: 0};
        }
        default:
            return {stdout: '', stderr: `git: '${subcommand}' is not supported here\n${gitHelp}`, exitCode: 1};
        }
    } catch (error) {
        return {stdout: '', stderr: `git: ${error.message || error}\n`, exitCode: 1};
    }
});

const runBrowserCommand = async command => {
    // just-bash's builtin help lists bash builtins it does not implement, and it wins over
    // customCommands, so answer help ourselves before the line reaches the shell.
    if (/^help\s*$/.test(String(command).trim())) {
        return {stdout: SHELL_HELP, stderr: '', exitCode: 0, worktreeChanged: false};
    }
    const files = await readWorkspace();
    const state = {usedGit: false, worktreeChanged: false};
    const bash = new Bash({
        cwd: REPO_DIR,
        files,
        customCommands: [createGitCommand(state)]
    });
    const result = await bash.exec(command);
    const changed = state.usedGit ? state.worktreeChanged : await syncWorkspace(files, bash);
    return {...result, worktreeChanged: changed};
};

export {runBrowserCommand};
