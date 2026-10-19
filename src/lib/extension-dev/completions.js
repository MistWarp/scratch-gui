import {autocompletion, completeFromList, ifNotIn} from '@codemirror/autocomplete';
import {syntaxTree} from '@codemirror/language';
import {localCompletionSource, snippets as javascriptSnippets} from '@codemirror/lang-javascript';
import {hoverTooltip} from '@codemirror/view';
import {memberDocs, keyDocs, suppressionDocs, findMemberDoc, findKeyDoc} from './api-docs.js';
import {snippets} from './templates.js';

const COMMENT_NODES = ['LineComment', 'BlockComment'];
const NO_COMPLETE = ['String', 'TemplateString', 'LineComment', 'BlockComment', 'RegExp'];
const ALIASES = {
    'vm': 'Scratch.vm',
    'runtime': 'Scratch.vm.runtime',
    'this.runtime': 'Scratch.vm.runtime',
    'this.vm': 'Scratch.vm',
    'Scratch.vm.runtime': 'Scratch.vm.runtime',
    'vm.runtime': 'Scratch.vm.runtime',
    'renderer': 'Scratch.renderer',
    'Scratch.vm.renderer': 'Scratch.renderer',
    'BlockType': 'Scratch.BlockType',
    'ArgumentType': 'Scratch.ArgumentType',
    'TargetType': 'Scratch.TargetType',
    'BlockShape': 'Scratch.BlockShape',
    'ReturnType': 'Scratch.ReturnType',
    'Cast': 'Scratch.Cast'
};
const SUPPRESSION_MARKER = /mw-ext-disable(?:-next-line)?(?![\w-])/g;
const COMPLETION_TYPES = {
    function: 'function',
    property: 'property',
    constant: 'constant',
    class: 'class',
    key: 'property'
};
const SCRATCH_ENTRY = {
    detail: 'Scratch',
    info: 'The extension API object.',
    docsPath: 'building-extensions/apis/scratch-api'
};

const resolvePath = path => {
    if (memberDocs[path]) return path;
    if (ALIASES[path]) return ALIASES[path];
    for (const prefix of ['window.', 'globalThis.', 'self.']) {
        if (path.startsWith(prefix) && memberDocs[path.slice(prefix.length)]) return path.slice(prefix.length);
    }
    return null;
};

const toCompletion = entry => ({
    label: entry.label,
    type: COMPLETION_TYPES[entry.type] || 'property',
    detail: entry.detail,
    info: entry.unsandboxedOnly ? `${entry.info} Unsandboxed only.` : entry.info
});

const CONTROL_WORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with']);
const IDENTIFIER_END = /([A-Za-z_$][\w$]*)\s*$/;
const KEY_END = /(?:([A-Za-z_$][\w$]*)|"([^"\n]*)"|'([^'\n]*)')\s*$/;

const previousIndex = (text, index) => {
    let at = index - 1;
    while (at >= 0 && /\s/.test(text[at])) at--;
    return at;
};

const keyBefore = (text, colon) => {
    const match = KEY_END.exec(text.slice(Math.max(0, colon - 100), colon));
    return match ? match[1] || match[2] || match[3] : null;
};

const parenLabel = (text, index, lastParen) => {
    const prev = previousIndex(text, index);
    if (text[prev] === '>' && text[prev - 1] === '=') {
        return {arrowKey: lastParen && (lastParen.key || lastParen.word)};
    }
    const head = text.slice(Math.max(0, index - 100), index);
    const word = (IDENTIFIER_END.exec(head) || [])[1] || null;
    const keyMatch = /([A-Za-z_$][\w$]*)\s*[:=]\s*(?:async\s+)?(?:function\s*\*?\s*[\w$]*\s*)?$/.exec(head);
    return {word, key: keyMatch ? keyMatch[1] : null};
};

const braceLabel = (text, index, lastParen) => {
    const prev = previousIndex(text, index);
    const char = text[prev];
    if (char === ':') return {key: keyBefore(text, prev)};
    if (char === ')') return {body: lastParen};
    if (char === '>' && text[prev - 1] === '=') return {body: {key: lastParen && (lastParen.key || lastParen.word)}};
    if (char === '(') return {paren: true};
    if (/return$/.test(text.slice(Math.max(0, prev - 5), prev + 1))) return {ret: true};
    if (char === ',' || char === '[' || char === '{') return {element: true};
    return {};
};

const skipQuoted = (text, start, end) => {
    const quote = text[start];
    for (let i = start + 1; i < end; i++) {
        const char = text[i];
        if (char === '\\') i++;
        else if (char === quote) return i + 1;
        else if (char === '\n' && quote !== '`') return i + 1;
    }
    return -1;
};

const skipTemplate = (text, start, end) => {
    const modes = [{template: true}];
    let i = start + 1;
    while (i < end) {
        const char = text[i];
        const mode = modes[modes.length - 1];
        if (mode.template) {
            if (char === '\\') {
                i += 2;
            } else if (char === '`') {
                modes.pop();
                i++;
                if (!modes.length) return i;
            } else if (char === '$' && text[i + 1] === '{') {
                modes.push({template: false, depth: 0});
                i += 2;
            } else {
                i++;
            }
            continue;
        }
        if (char === '"' || char === '\'') {
            const next = skipQuoted(text, i, end);
            if (next === -1) return -1;
            i = next;
            continue;
        }
        if (char === '`') {
            modes.push({template: true});
        } else if (char === '{') {
            mode.depth++;
        } else if (char === '}') {
            if (mode.depth === 0) modes.pop();
            else mode.depth--;
        }
        i++;
    }
    return -1;
};

const REGEX_BEFORE = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<',
    '>', '~', '^']);
const REGEX_WORDS = /(?:^|[^\w$])(?:return|typeof|case|in|of|new|delete|void|throw|yield|await)$/;

const regexEnd = (text, start, end) => {
    const prev = previousIndex(text, start);
    if (prev >= 0 && !REGEX_BEFORE.has(text[prev]) &&
        !REGEX_WORDS.test(text.slice(Math.max(0, prev - 10), prev + 1))) {
        return -1;
    }
    let inClass = false;
    for (let i = start + 1; i < end; i++) {
        const char = text[i];
        if (char === '\\') i++;
        else if (char === '\n') return -1;
        else if (char === '[') inClass = true;
        else if (char === ']') inClass = false;
        else if (char === '/' && !inClass) {
            let after = i + 1;
            while (after < end && /[a-z]/i.test(text[after])) after++;
            return after;
        }
    }
    return -1;
};

const scanStack = (text, pos, startAt = 0) => {
    const stack = [];
    let lastParen = null;
    let i = startAt;
    while (i < pos) {
        const char = text[i];
        if (char === '/' && text[i + 1] === '/') {
            const end = text.indexOf('\n', i);
            if (end === -1 || end >= pos) return null;
            i = end + 1;
            continue;
        }
        if (char === '/' && text[i + 1] === '*') {
            const end = text.indexOf('*/', i + 2);
            if (end === -1 || end + 2 > pos) return null;
            i = end + 2;
            continue;
        }
        if (char === '"' || char === '\'' || char === '`') {
            const end = char === '`' ? skipTemplate(text, i, pos) : skipQuoted(text, i, pos);
            if (end === -1) return null;
            i = end;
            continue;
        }
        if (char === '/') {
            const end = regexEnd(text, i, pos);
            if (end !== -1) {
                i = end;
                continue;
            }
        }
        if (char === '(') stack.push({char, label: parenLabel(text, i, lastParen)});
        else if (char === '{' || char === '[') stack.push({char, label: braceLabel(text, i, lastParen)});
        else if (char === ')' || char === '}' || char === ']') {
            const top = stack.pop();
            if (char === ')') lastParen = top ? top.label : null;
        }
        i++;
    }
    return stack;
};

const isGetInfoObject = (stack, index) => {
    const label = stack[index].label;
    if (label.paren) {
        const paren = stack[index - 1];
        return Boolean(paren && paren.label.arrowKey === 'getInfo');
    }
    if (!label.ret) return false;
    for (let i = index - 1; i >= 0; i--) {
        const body = stack[i].char === '{' && stack[i].label.body;
        if (!body) continue;
        if (CONTROL_WORDS.has(body.word)) continue;
        return body.word === 'getInfo' || body.key === 'getInfo';
    }
    return false;
};

const objectScope = (stack, index) => {
    const entry = stack[index];
    if (!entry || entry.char !== '{') return null;
    if (isGetInfoObject(stack, index)) return 'info';
    const parent = stack[index - 1];
    if (!parent) return null;
    if (parent.char === '[' && parent.label.key === 'blocks' && entry.label.element) return 'block';
    if (parent.char === '{' && entry.label.key) {
        if (parent.label.key === 'arguments') return 'argument';
        if (parent.label.key === 'menus') return 'menu';
    }
    return null;
};

const SCAN_WINDOW = 50000;
const SCAN_ANCHORS = new Set(['ClassDeclaration', 'MethodDeclaration', 'FunctionDeclaration', 'ExpressionStatement',
    'VariableDeclaration', 'ReturnStatement']);

const scanStart = (state, pos) => {
    let start = -1;
    for (let node = syntaxTree(state).resolveInner(pos, -1); node; node = node.parent) {
        if (node.from < pos - SCAN_WINDOW) break;
        if (SCAN_ANCHORS.has(node.name) && node.from < pos) start = node.from;
    }
    if (start >= 0) return start;
    if (pos <= SCAN_WINDOW) return 0;
    const line = state.doc.lineAt(pos - SCAN_WINDOW);
    return Math.min(line.to + 1, pos);
};

const stackAt = (state, pos) => {
    const start = scanStart(state, pos);
    const base = Math.max(0, start - 200);
    return scanStack(state.sliceDoc(base, pos), pos - base, start - base);
};

const keyContext = (state, pos) => {
    const stack = stackAt(state, pos);
    if (!stack || !stack.length) return null;
    const top = stack[stack.length - 1];
    if (top.char === '[' && top.label.key === 'blocks') return {list: 'blocks'};
    const scope = objectScope(stack, stack.length - 1);
    if (scope) return {scope};
    if (top.char === '{' && top.label.key === 'menus') return {list: 'menus'};
    return null;
};

const scratchCompletionSource = context => {
    const {state, pos} = context;
    const inner = syntaxTree(state).resolveInner(pos, -1);
    if (NO_COMPLETE.includes(inner.name)) return null;
    const member = context.matchBefore(/(?:[A-Za-z_$][\w$]*\??\.)+[\w$]*$/);
    if (member) {
        const dot = member.text.lastIndexOf('.');
        const path = resolvePath(member.text.slice(0, dot).replace(/\?$/, '')
            .replace(/\?\./g, '.'));
        if (!path) return null;
        return {
            from: member.from + dot + 1,
            options: memberDocs[path].map(toCompletion),
            validFor: /^[\w$]*$/
        };
    }
    const word = context.matchBefore(/[\w$]*$/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    const before = state.sliceDoc(Math.max(0, word.from - 200), word.from).replace(/\s+$/, '');
    const last = before[before.length - 1];
    if (last !== '[' && last !== ',' && last !== '{') return null;
    const where = keyContext(state, pos);
    if (!where) return null;
    if (where.list === 'blocks' && (last === '[' || last === ',')) {
        return {from: word.from, options: snippets.filter(each => each.label !== 'menu'), validFor: /^[\w$ ]*$/};
    }
    if (where.list === 'menus' && (last === '{' || last === ',')) {
        return {from: word.from, options: snippets.filter(each => each.label === 'menu'), validFor: /^[\w$]*$/};
    }
    if (where.scope && (last === '{' || last === ',')) {
        const after = state.sliceDoc(pos, pos + 200);
        const hasColon = /^[\w$]*\s*:/.test(after);
        return {
            from: word.from,
            options: keyDocs[where.scope].map(entry => ({...toCompletion(entry),
                apply: hasColon ? entry.label : `${entry.label}: `})),
            validFor: /^[\w$]*$/
        };
    }
    return null;
};

const hoverDom = entry => {
    const dom = document.createElement('div');
    dom.className = 'mw-ext-hover';
    if (entry.docsPath) dom.dataset.docsPath = entry.docsPath;
    const detail = document.createElement('code');
    detail.className = 'mw-ext-hover-detail';
    detail.textContent = entry.detail;
    const info = document.createElement('div');
    info.className = 'mw-ext-hover-info';
    info.textContent = entry.info;
    dom.append(detail, info);
    if (entry.unsandboxedOnly) {
        const note = document.createElement('div');
        note.className = 'mw-ext-hover-unsandboxed';
        note.textContent = 'Unsandboxed only.';
        dom.append(note);
    }
    return dom;
};

const scratchHoverSource = (view, pos, side) => {
    const {state} = view;
    const line = state.doc.lineAt(pos);
    const offset = pos - line.from;
    const text = line.text;
    const marker = [...text.matchAll(SUPPRESSION_MARKER)]
        .find(match => offset >= match.index && offset <= match.index + match[0].length);
    const nodeName = syntaxTree(state).resolveInner(pos, side < 0 ? -1 : 1).name;
    if (marker && COMMENT_NODES.includes(nodeName)) {
        const doc = suppressionDocs.find(each => each.label === marker[0]);
        return {
            pos: line.from + marker.index,
            end: line.from + marker.index + marker[0].length,
            above: true,
            create: () => ({dom: hoverDom(doc)})
        };
    }
    if (NO_COMPLETE.includes(nodeName)) return null;
    let start = offset;
    let end = offset;
    while (start > 0 && /[\w$]/.test(text[start - 1])) start--;
    while (end < text.length && /[\w$]/.test(text[end])) end++;
    if (start === end || (start === offset && side < 0) || (end === offset && side > 0)) return null;
    const word = text.slice(start, end);
    let chainStart = start;
    while (chainStart > 0 && /[\w$.?]/.test(text[chainStart - 1])) chainStart--;
    const chain = text.slice(chainStart, end).replace(/\?\./g, '.')
        .replace(/^[.?]+/, '');
    let entry = null;
    const dot = chain.lastIndexOf('.');
    if (dot !== -1) {
        const path = resolvePath(chain.slice(0, dot));
        entry = path ? findMemberDoc(`${path}.${word}`) : null;
    } else if (word === 'Scratch') {
        entry = SCRATCH_ENTRY;
    } else if (/^\s*:/.test(text.slice(end)) &&
        ['PropertyDefinition', 'PropertyName'].includes(syntaxTree(state).resolveInner(line.from + start, 1).name)) {
        const stack = stackAt(state, line.from + start);
        const scope = stack && objectScope(stack, stack.length - 1);
        entry = scope ? findKeyDoc(word, scope) : null;
    }
    if (!entry) return null;
    return {
        pos: line.from + start,
        end: line.from + end,
        above: true,
        create: () => ({dom: hoverDom(entry)})
    };
};

const scratchHoverTooltip = hoverTooltip(scratchHoverSource);

const scratchAutocomplete = () => autocompletion({
    override: [
        scratchCompletionSource,
        localCompletionSource,
        ifNotIn(NO_COMPLETE, completeFromList(javascriptSnippets))
    ]
});

export {
    scratchCompletionSource,
    scratchHoverSource,
    scratchHoverTooltip,
    scratchAutocomplete
};
