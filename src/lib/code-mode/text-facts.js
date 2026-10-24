import {parseFractch} from 'fractch/browser';

const CLOUD_PREFIX = '☁ ';

const plainName = name => (String(name).startsWith(CLOUD_PREFIX) ?
    String(name).slice(CLOUD_PREFIX.length) :
    String(name));

const KIND_ORDER = ['var', 'list', 'any'];

const fieldKind = node => {
    if (node.kind !== 'keyed' || node.sep !== 'field' || !node.value) return null;
    if (node.key === 'VARIABLE' && node.value.type === 'ident') return 'var';
    if (node.key === 'LIST' && (node.value.type === 'ident' || node.value.type === 'list')) return 'list';
    return null;
};

const walkScript = calls => {
    const uses = new Map();
    const locals = new Set();
    const handled = new WeakSet();
    const use = (name, kind) => {
        if (typeof name !== 'string') return;
        if (!uses.has(name)) uses.set(name, new Set());
        uses.get(name).add(kind);
    };
    const pending = [calls];
    while (pending.length) {
        const node = pending.pop();
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node)) {
            for (const item of node) pending.push(item);
            continue;
        }
        const field = fieldKind(node);
        if (field) {
            use(node.value.name, field);
            handled.add(node.value);
        }
        if (!handled.has(node)) {
            if (node.type === 'var') use(node.name, 'var');
            if (node.type === 'list') use(node.name, 'list');
            if (node.type === 'ident') use(node.name, 'any');
            if (node.type === 'identOrMethod') use(node.ident, 'any');
        }
        if (node.type === 'localDecl' && typeof node.name === 'string') locals.add(node.name);
        if (node.type === 'procDef') {
            for (const param of node.params || []) {
                if (param && typeof param.ident === 'string') locals.add(param.ident);
            }
        }
        const spec = node.listIteration;
        if (spec && typeof spec === 'object') {
            use(spec.listName, 'list');
            if (typeof spec.valueName === 'string') locals.add(spec.valueName);
            if (typeof spec.indexName === 'string') locals.add(spec.indexName);
        }
        for (const key of Object.keys(node)) {
            if (key === 'span') continue;
            const value = node[key];
            if (value && typeof value === 'object') pending.push(value);
        }
    }
    for (const name of locals) uses.delete(name);
    return uses;
};

const textFacts = text => {
    let parsed;
    try {
        parsed = parseFractch(String(text || ''));
    } catch (error) {
        return {references: [], uses: [], declared: [], failed: true};
    }
    const declared = (parsed.varDecls || []).map(decl => ({
        name: plainName(decl.name),
        list: decl.isList === true,
        cloud: Boolean(decl.cloud)
    }));
    const own = new Set(declared.map(decl => decl.name));
    const uses = new Map();
    for (const script of parsed.scripts || []) {
        for (const [name, kinds] of walkScript(script.calls || [])) {
            const plain = plainName(name);
            if (own.has(plain)) continue;
            if (!uses.has(plain)) uses.set(plain, new Set());
            for (const kind of kinds) uses.get(plain).add(kind);
        }
    }
    return {
        references: Array.from(uses.keys()),
        uses: Array.from(uses, ([name, kinds]) => ({
            name,
            kinds: KIND_ORDER.filter(kind => kinds.has(kind))
        })),
        declared
    };
};

const usesAs = (facts, name, kind, {otherKindDeclared = false} = {}) => {
    const entry = ((facts && facts.uses) || []).find(item => item.name === name);
    if (!entry) return false;
    if (entry.kinds.includes(kind)) return true;
    return entry.kinds.includes('any') && !otherKindDeclared;
};

export {plainName, textFacts, usesAs};
