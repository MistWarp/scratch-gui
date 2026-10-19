import {parse} from '@babel/parser';

const HEADER_KEYS = {
    name: 'name',
    id: 'id',
    description: 'description',
    license: 'license',
    author: 'author',
    by: 'author',
    version: 'version'
};

const HEADER_LINE = /^[\s/*!]*(@?)([a-z]+)\b(\s*:)?\s*(.*?)\s*(?:\*\/)?\s*$/i;

const WHITESPACE = /\s*/y;
const LINE_BREAK = /\r\n?|[\n\u2028\u2029]/;
const LINE_END = /[\r\n\u2028\u2029]/g;

const lineEnd = (source, pos) => {
    LINE_END.lastIndex = pos;
    const match = LINE_END.exec(source);
    return match ? match.index : source.length;
};

const leadingCommentText = source => {
    const lines = [];
    let pos = source.charCodeAt(0) === 0xFEFF ? 1 : 0;
    if (source.startsWith('#!', pos)) pos = lineEnd(source, pos);
    while (pos < source.length) {
        WHITESPACE.lastIndex = pos;
        WHITESPACE.exec(source);
        pos = WHITESPACE.lastIndex;
        if (source.startsWith('//', pos)) {
            const stop = lineEnd(source, pos);
            lines.push(source.slice(pos, stop));
            pos = stop;
        } else if (source.startsWith('/*', pos)) {
            const end = source.indexOf('*/', pos + 2);
            const stop = end === -1 ? source.length : end + 2;
            lines.push(...source.slice(pos, stop).split(LINE_BREAK));
            pos = stop;
        } else {
            break;
        }
    }
    return lines;
};

const readHeaderMetadata = source => {
    const result = {name: '', id: '', description: '', license: '', author: '', version: ''};
    for (const line of leadingCommentText(String(source || ''))) {
        const match = HEADER_LINE.exec(line);
        if (!match) continue;
        const [, at, rawKey, colon, value] = match;
        const key = HEADER_KEYS[rawKey.toLowerCase()];
        if (!key || (!at && !colon) || !value || result[key]) continue;
        result[key] = value;
    }
    return result;
};

const SKIP_KEYS = new Set(['type', 'start', 'end', 'loc', 'leadingComments', 'trailingComments',
    'innerComments', 'extra', 'range']);

const isNode = value => Boolean(value) && typeof value.type === 'string';

const childKeyCache = new Map();

const childKeys = node => {
    let keys = childKeyCache.get(node.type);
    if (!keys) {
        keys = Object.keys(node).filter(key => !SKIP_KEYS.has(key) && (node[key] === null ||
            typeof node[key] === 'object'));
        childKeyCache.set(node.type, keys);
    }
    return keys;
};

const forEachChild = (node, callback) => {
    const keys = childKeys(node);
    for (let i = 0; i < keys.length; i++) {
        const value = node[keys[i]];
        if (!value) continue;
        if (Array.isArray(value)) {
            for (let j = 0; j < value.length; j++) {
                if (isNode(value[j])) callback(value[j]);
            }
        } else if (typeof value.type === 'string') {
            callback(value);
        }
    }
};

const walk = (root, visit) => {
    const ancestors = [];
    const stack = [[root, 0]];
    while (stack.length) {
        const [node, depth] = stack.pop();
        ancestors.length = depth;
        if (visit(node, ancestors) === false) continue;
        ancestors.push(node);
        const children = [];
        forEachChild(node, child => children.push(child));
        for (let i = children.length - 1; i >= 0; i--) stack.push([children[i], depth + 1]);
    }
};

const keyName = node => {
    if (!node) return null;
    const key = node.key;
    if (!key) return null;
    if (!node.computed && key.type === 'Identifier') return key.name;
    if (key.type === 'StringLiteral') return key.value;
    return null;
};

const parseLoose = source => {
    try {
        return parse(source, {sourceType: 'script', errorRecovery: true});
    } catch (e) {
        return null;
    }
};

const literalSearch = (source, opcode) => {
    for (const quote of ['"', '\'', '`']) {
        const index = source.indexOf(`${quote}${opcode}${quote}`);
        if (index !== -1) return {from: index, to: index + opcode.length + 2};
    }
    return null;
};

const CLASS_TYPES = new Set(['ClassDeclaration', 'ClassExpression']);

const locateInAst = (ast, opcode) => {
    let definition = null;
    const methods = [];
    let literal = null;
    const getInfos = [];
    walk(ast.program, (node, ancestors) => {
        if (node.type === 'ObjectExpression' && !definition) {
            let op = null;
            let func = null;
            for (const prop of node.properties) {
                if (prop.type !== 'ObjectProperty' || !prop.value) continue;
                const name = keyName(prop);
                if (name === 'opcode' && prop.value.type === 'StringLiteral') op = prop.value.value;
                if (name === 'func' && prop.value.type === 'StringLiteral') func = prop.value.value;
            }
            if (op === opcode) {
                const owner = [...ancestors].reverse().find(each => CLASS_TYPES.has(each.type)) || null;
                definition = {name: func || opcode, owner};
            }
        } else if (node.type === 'ClassMethod' || node.type === 'ObjectMethod') {
            const name = keyName(node);
            if (!name) return;
            const owner = node.type === 'ClassMethod' ? ancestors[ancestors.length - 2] : null;
            const range = {from: node.key.start, to: node.key.end};
            if (name === 'getInfo') getInfos.push({owner, range});
            methods.push({name, owner, range});
        } else if (node.type === 'StringLiteral' && !literal && node.value === opcode) {
            literal = {from: node.start, to: node.end};
        }
    });
    const name = definition ? definition.name : opcode;
    const owner = definition && definition.owner;
    const method = (owner && methods.find(each => each.name === name && each.owner === owner)) ||
        methods.find(each => each.name === name);
    if (method) return method.range;
    if (literal) return literal;
    const info = (owner && getInfos.find(each => each.owner === owner)) || getInfos[0];
    return info ? info.range : null;
};

const findOpcodeDefinition = (source, opcode) => {
    source = String(source || '');
    if (!opcode) return null;
    try {
        const ast = parseLoose(source);
        return ast ? locateInAst(ast, opcode) : literalSearch(source, opcode);
    } catch (error) {
        return literalSearch(source, opcode);
    }
};

export {
    findOpcodeDefinition,
    readHeaderMetadata,
    walk,
    forEachChild,
    childKeys,
    keyName,
    isNode
};
