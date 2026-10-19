import {StreamLanguage} from '@codemirror/language';

const KEYWORDS = new Set([
    'when', 'script', 'def', 'if', 'else', 'repeat', 'forever', 'until', 'while', 'for', 'of', 'in', 'every',
    'return', 'returns', 'break', 'switch', 'case', 'default', 'wait', 'stop', 'warp', 'at', 'id', 'import',
    'region', 'keep', 'locked', 'var', 'cloud', 'local', 'list', 'watch', 'comment', 'size', 'minimized',
    'and', 'or', 'not', 'shadow', 'field', 'raw', 'js'
]);

const ATOMS = new Set(['true', 'false', 'null']);

const readString = (stream, state) => {
    let escaped = false;
    let ch = stream.next();
    while (typeof ch !== 'undefined') {
        if (ch === state.quote && !escaped) {
            state.quote = null;
            return;
        }
        escaped = !escaped && ch === '\\';
        ch = stream.next();
    }
};

const fractchStream = {
    name: 'fractch',
    startState: () => ({quote: null, blockComment: false}),
    token (stream, state) {
        if (state.blockComment) {
            if (stream.skipTo('*/')) {
                stream.next();
                stream.next();
                state.blockComment = false;
            } else {
                stream.skipToEnd();
            }
            return 'comment';
        }
        if (state.quote) {
            readString(stream, state);
            return 'string';
        }
        if (stream.eatSpace()) return null;
        if (stream.match('//')) {
            stream.skipToEnd();
            return 'comment';
        }
        if (stream.match('/*')) {
            state.blockComment = true;
            return 'comment';
        }
        const ch = stream.peek();
        if (ch === '"' || ch === '\'' || ch === '`') {
            state.quote = stream.next();
            readString(stream, state);
            return 'string';
        }
        if (stream.match(/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i)) return 'number';
        if (stream.match(/^@[\w$]+/)) return 'variableName.function';
        if (stream.match(/^[A-Za-z_$][\w$]*/)) {
            const word = stream.current();
            if (ATOMS.has(word)) return 'atom';
            if (KEYWORDS.has(word)) return 'keyword';
            if (stream.peek() === '.') return 'namespace';
            if (stream.match(/^\s*\(/, false)) return 'variableName.function';
            return 'variableName';
        }
        if (stream.match(/^\.[A-Za-z_$][\w$]*/)) {
            return stream.match(/^\s*\(/, false) ? 'propertyName.function' : 'propertyName';
        }
        if (stream.match(/^(?:\+\+|--|[+\-*/%]=?|==|!=|<=|>=|&&|\|\||[<>=!])/)) return 'operator';
        stream.next();
        return null;
    },
    languageData: {
        commentTokens: {line: '//', block: {open: '/*', close: '*/'}},
        closeBrackets: {brackets: ['(', '[', '{', '"']}
    }
};

const fractchLanguage = StreamLanguage.define(fractchStream);

export {fractchLanguage, fractchStream};
