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
  project    git (see: git help), info, whoami

Not available in the browser: curl, python3, sqlite3, tar and other host-only tools.
`;

const LOGO = [
    '++++++++++++++++++++++++++++++++++++',
    '++++++++++++++++++++++++++++++++++++',
    '++++++++++++++++++++++++++++++++++++',
    '++++++++++==--::-=-      -=+++++++++',
    '+++++++=                    -+++++++',
    '++++++-    :-===: :+++++=    -++++++',
    '+++++=   :++++=+++++---=++:   =+++++',
    '+++++=   =++-:  +++  --=++:   =+++++',
    '++++++    -+++   =+   ++=    -++++++',
    '+++++++    -++ :  =   ++=    -++++++',
    '++++++    :++= :+   : =+++:   =+++++',
    '+++++=   =++-    -  :   ++=   -+++++',
    '+++++=   -+++++++++==++++=    =+++++',
    '++++++:    :--:   -++=:      +++++++',
    '+++++++=                  :=++++++++',
    '++++++++++=---===-:  :-=++++++++++++',
    '++++++++++++++++++++++++++++++++++++',
    '++++++++++++++++++++++++++++++++++++',
    '++++++++++++++++++++++++++++++++++++'
];

const LOGO_WIDTH = Math.max(...LOGO.map(line => line.length));

// The lavender accent's menu bar gradient, converted from oklab to rgb.
const LAVENDER_STOPS = [
    [191, 133, 249],
    [193, 150, 248],
    [200, 167, 234],
    [225, 168, 214],
    [250, 169, 193],
    [255, 184, 175]
];

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const gradientAt = position => {
    const scaled = Math.max(0, Math.min(1, position)) * (LAVENDER_STOPS.length - 1);
    const index = Math.min(LAVENDER_STOPS.length - 2, Math.floor(scaled));
    const ratio = scaled - index;
    const [r, g, b] = LAVENDER_STOPS[index].map(
        (channel, i) => Math.round(channel + ((LAVENDER_STOPS[index + 1][i] - channel) * ratio))
    );
    return `\x1b[38;2;${r};${g};${b}m`;
};

const gradientLine = (text, row, rows) => {
    let out = '';
    for (let column = 0; column < text.length; column++) {
        // Diagonal sweep, so the gradient runs across the logo rather than down it.
        const position = ((column / Math.max(1, text.length - 1)) + (row / Math.max(1, rows - 1))) / 2;
        out += `${gradientAt(position)}${text[column]}`;
    }
    return `${out}${RESET}`;
};

const formatSize = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const BROWSER_RULES = [
    [/Edg\/(\d+)/, 'Edge'],
    [/OPR\/(\d+)/, 'Opera'],
    [/Firefox\/(\d+)/, 'Firefox'],
    [/Chrome\/(\d+)/, 'Chrome'],
    [/Version\/(\d+).*Safari/, 'Safari']
];

const browserName = () => {
    const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    for (const [pattern, name] of BROWSER_RULES) {
        const match = agent.match(pattern);
        if (match) return `${name} ${match[1]}`;
    }
    return 'unknown';
};

// performance.now() is already milliseconds since the page loaded, which is the session uptime.
const formatUptime = () => {
    const total = Math.floor((typeof performance === 'undefined' ? 0 : performance.now()) / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return `${hours}hrs, ${minutes}mins, ${total % 60}secs`;
};

const osName = () => {
    const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    if (/Windows NT 10/.test(agent)) return 'Windows 10/11';
    if (/Windows/.test(agent)) return 'Windows';
    if (/Mac OS X/.test(agent)) return 'macOS';
    if (/CrOS/.test(agent)) return 'ChromeOS';
    if (/Android/.test(agent)) return 'Android';
    if (/iPhone|iPad/.test(agent)) return 'iOS';
    if (/Linux/.test(agent)) return 'Linux';
    return 'unknown';
};

// The rotur handle wins over whatever username the VM was given for the cloud/username block.
let shellUser = {local: null, rotur: null};

const setShellUser = patch => {
    shellUser = {...shellUser, ...patch};
};

const currentUser = () => shellUser.rotur || shellUser.local || 'player';

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

const createInfoCommand = () => defineCommand('info', async () => {
    const fs = getFs();
    const files = await listWorktreeFiles();
    let bytes = 0;
    for (const filepath of files) {
        bytes += (await readWorktreeFile(filepath)).length;
    }

    let branch = '(none)';
    let commits = 0;
    try {
        branch = (await git.currentBranch({fs, dir: REPO_DIR, fullname: false})) || '(detached)';
        commits = (await git.log({fs, dir: REPO_DIR, depth: 1000})).length;
    } catch (e) {
        // A repo with no commits yet still deserves an info screen.
    }

    const fractch = files.filter(filepath => /\.fractch$/i.test(filepath)).length;
    const assets = files.filter(filepath => /\.(svg|png|jpe?g|gif|wav|mp3)$/i.test(filepath)).length;
    const targets = new Set(
        files.filter(filepath => filepath.includes('/')).map(filepath => filepath.split('/')[0])
    );
    const dirs = new Set(
        files.filter(filepath => filepath.includes('/'))
            .map(filepath => filepath.slice(0, filepath.lastIndexOf('/')))
    );

    let head = '(none)';
    try {
        head = (await git.resolveRef({fs, dir: REPO_DIR, ref: 'HEAD'})).slice(0, 7);
    } catch (e) {
        // No commits yet.
    }

    const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio;
    const screen = typeof window === 'undefined' ?
        'unknown' :
        `${window.screen.width}x${window.screen.height}@${ratio}x`;
    const host = typeof location === 'undefined' ? 'unknown' : location.host;

    const fields = [
        ['User', `${currentUser()}@mistwarp`],
        ['Host', host],
        ['Uptime', formatUptime()],
        ['Shell', 'just-bash (browser)'],
        ['OS', osName()],
        ['Browser', browserName()],
        ['Screen', screen],
        ['Branch', branch],
        ['HEAD', head],
        ['Commits', String(commits)],
        ['Targets', String(targets.size)],
        ['Folders', String(dirs.size)],
        ['Files', String(files.length)],
        ['Fractch', String(fractch)],
        ['Assets', String(assets)],
        ['Worktree', formatSize(bytes)]
    ];
    const labelWidth = Math.max(...fields.map(([label]) => label.length));
    const user = currentUser();
    const rows = [
        `${BOLD}${gradientLine(`${user}@mistwarp`, 0, 1)}`,
        gradientLine('-'.repeat(user.length + 9), 0, 1),
        ...fields.map(([label, value]) => (
            `${gradientAt(0.25)}${label.padEnd(labelWidth)}${RESET}  ${gradientAt(0.75)}|${RESET}  ${value}`
        ))
    ];

    const height = Math.max(LOGO.length, rows.length);
    const top = Math.max(0, Math.floor((LOGO.length - rows.length) / 2));
    const lines = [];
    for (let i = 0; i < height; i++) {
        const art = LOGO[i] ?
            gradientLine(LOGO[i], i, LOGO.length) :
            ' '.repeat(LOGO_WIDTH);
        lines.push(`${art}   ${rows[i - top] || ''}`.trimEnd());
    }
    return {stdout: `${lines.join('\n')}\n`, stderr: '', exitCode: 0};
});

const runBrowserCommand = async (command, cwd = REPO_DIR) => {
    // just-bash's builtin help lists bash builtins it does not implement, and it wins over
    // customCommands, so answer help ourselves before the line reaches the shell.
    if (/^help\s*$/.test(String(command).trim())) {
        return {stdout: SHELL_HELP, stderr: '', exitCode: 0, worktreeChanged: false, cwd};
    }
    // just-bash's builtin whoami answers with its own sandbox user and wins over customCommands.
    if (/^whoami\s*$/.test(String(command).trim())) {
        return {stdout: `${currentUser()}\n`, stderr: '', exitCode: 0, worktreeChanged: false, cwd};
    }
    const files = await readWorkspace();
    const state = {usedGit: false, worktreeChanged: false};
    const bash = new Bash({
        cwd,
        files,
        customCommands: [createGitCommand(state), createInfoCommand()]
    });
    const result = await bash.exec(command);
    const changed = state.usedGit ? state.worktreeChanged : await syncWorkspace(files, bash);
    return {...result, worktreeChanged: changed, cwd: result.env.PWD || cwd};
};

export {runBrowserCommand, setShellUser};
