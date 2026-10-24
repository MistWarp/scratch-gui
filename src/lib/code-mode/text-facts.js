import {parseFractch} from 'fractch/browser';

const CLOUD_PREFIX = '☁ ';

const plainName = name => (String(name).startsWith(CLOUD_PREFIX) ?
    String(name).slice(CLOUD_PREFIX.length) :
    String(name));

const walkScript = calls => {
    const names = new Set();
    const locals = new Set();
    const pending = [calls];
    while (pending.length) {
        const node = pending.pop();
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node)) {
            for (const item of node) pending.push(item);
            continue;
        }
        if (node.type === 'ident' || node.type === 'var' || node.type === 'list') {
            if (typeof node.name === 'string') names.add(node.name);
        }
        if (node.type === 'localDecl' && typeof node.name === 'string') locals.add(node.name);
        if (node.type === 'procDef') {
            for (const param of node.params || []) {
                if (param && typeof param.ident === 'string') locals.add(param.ident);
            }
        }
        const spec = node.listIteration;
        if (spec && typeof spec === 'object') {
            if (typeof spec.listName === 'string') names.add(spec.listName);
            if (typeof spec.valueName === 'string') locals.add(spec.valueName);
            if (typeof spec.indexName === 'string') locals.add(spec.indexName);
        }
        for (const key of Object.keys(node)) {
            if (key === 'span') continue;
            const value = node[key];
            if (value && typeof value === 'object') pending.push(value);
        }
    }
    for (const name of locals) names.delete(name);
    return names;
};

const textFacts = text => {
    let parsed;
    try {
        parsed = parseFractch(String(text || ''));
    } catch (error) {
        return {references: [], declared: [], failed: true};
    }
    const declared = (parsed.varDecls || []).map(decl => ({
        name: plainName(decl.name),
        list: decl.isList === true,
        cloud: Boolean(decl.cloud)
    }));
    const own = new Set(declared.map(decl => decl.name));
    const references = new Set();
    for (const script of parsed.scripts || []) {
        for (const name of walkScript(script.calls || [])) {
            if (!own.has(plainName(name))) references.add(plainName(name));
        }
    }
    return {references: Array.from(references), declared};
};

export {plainName, textFacts};
