import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import ts from 'typescript';

const EM_DASH = '\u2014';
const SOURCE_FILE = /\.(js|jsx|mjs|cjs|ts|tsx)$/;
const TEXT_FILE = /\.(js|jsx|mjs|cjs|ts|tsx|json|md|css|html|yml|yaml|txt)$/;
const SKIPPED_PATHS = [
    /^src\/generated\//,
    /^src\/addons\/(addons|libraries|api-libraries|generated|ScratchAddons)\//,
    /^src\/packager\//,
    /^src\/examples\//,
    /^static\//,
    /^test\/fixtures\//,
    /^src\/community\/translations\/(?!en\.json$)/,
    /^src\/lib\/tw-translations\/(?!default-messages\.json$)/,
    /(^|\/)pnpm-lock\.yaml$/
];
const DIRECTIVE = /^(\/\/|\/\*)\s*(eslint[\s-]|global\s|@ts-|istanbul\s|prettier-ignore|\/\s*<reference)/;

const options = process.argv.slice(2);
const staged = options.includes('--staged');
const base = (options.find(option => option.startsWith('--base=')) || '--base=origin/develop').slice('--base='.length);

const git = (...args) => execFileSync('git', args, {encoding: 'utf8', maxBuffer: 1 << 30});

const diffArgs = staged ?
    ['diff', '--cached'] :
    ['diff', git('merge-base', base, 'HEAD').trim()];

const parseDiff = text => {
    const files = new Map();
    const removed = new Set();
    let current = null;
    let line = 0;
    for (const row of text.split('\n')) {
        if (row.startsWith('+++ ')) {
            const path = row.slice(4).replace(/^b\//, '');
            current = path === '/dev/null' ? null : path;
            if (current && !files.has(current)) files.set(current, new Map());
        } else if (row.startsWith('@@')) {
            const match = /\+(\d+)/.exec(row);
            line = match ? Number(match[1]) : 0;
        } else if (row.startsWith('+') && current) {
            files.get(current).set(line, row.slice(1));
            line += 1;
        } else if (row.startsWith('-') && !row.startsWith('---')) {
            removed.add(row.slice(1).trim());
        }
    }
    return {files, removed};
};

const lineStarts = text => {
    const starts = [0];
    for (let index = 0; index < text.length; index++) {
        if (text[index] === '\n') starts.push(index + 1);
    }
    return starts;
};

const lineOf = (starts, position) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (starts[middle] <= position) low = middle;
        else high = middle - 1;
    }
    return low + 1;
};

const commentRanges = (path, text) => {
    const kind = /\.tsx$/.test(path) ? ts.ScriptKind.TSX :
        /\.ts$/.test(path) ? ts.ScriptKind.TS :
            /\.jsx$/.test(path) ? ts.ScriptKind.JSX : ts.ScriptKind.JS;
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind);
    const seen = new Map();
    const collect = ranges => {
        for (const range of ranges || []) seen.set(range.pos, range);
    };
    const visit = node => {
        if (node.kind >= ts.SyntaxKind.FirstToken && node.kind <= ts.SyntaxKind.LastToken) {
            collect(ts.getLeadingCommentRanges(text, node.pos));
            collect(ts.getTrailingCommentRanges(text, node.end));
            return;
        }
        if (node.kind === ts.SyntaxKind.JsxText) return;
        collect(ts.getLeadingCommentRanges(text, node.pos));
        node.getChildren(source).forEach(visit);
    };
    visit(source);
    collect(ts.getLeadingCommentRanges(text, source.endOfFileToken.pos));
    return [...seen.values()];
};

const problems = [];
const {files, removed} = parseDiff(git(...diffArgs, '--unified=0', '--no-color', '--diff-filter=ACMR'));

for (const [path, added] of files) {
    if (SKIPPED_PATHS.some(pattern => pattern.test(path)) || !TEXT_FILE.test(path)) continue;
    for (const [line, content] of added) {
        if (content.includes(EM_DASH)) problems.push(`${path}:${line}  em dash: use a comma, parentheses or "to"`);
    }
    if (!SOURCE_FILE.test(path)) continue;
    const text = staged ? git('show', `:${path}`) : fs.readFileSync(path, 'utf8');
    const starts = lineStarts(text);
    for (const range of commentRanges(path, text)) {
        const comment = text.slice(range.pos, range.end);
        if (DIRECTIVE.test(comment)) continue;
        const first = lineOf(starts, range.pos);
        const last = lineOf(starts, range.end - 1);
        for (let line = first; line <= last; line++) {
            const content = added.get(line);
            if (typeof content !== 'string' || removed.has(content.trim())) continue;
            problems.push(`${path}:${line}  code comment: name things so the code explains itself`);
            break;
        }
    }
}

if (problems.length) {
    console.error(problems.join('\n'));
    console.error(`\n${problems.length} convention problem${problems.length === 1 ? '' : 's'} in the changed lines.`);
    process.exitCode = 1;
} else {
    console.log('conventions ok');
}
