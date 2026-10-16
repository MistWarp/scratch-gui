import {snippetCompletion} from '@codemirror/autocomplete';
import {languageReference, normalizeSignatures} from 'fractch/browser';
import {getExtensionSignatures} from 'scratch-vm/src/serialization/fractch-context';

const STATEMENTS = new Set(['command', 'conditional', 'loop']);
const VALUES = new Set(['reporter', 'Boolean', 'boolean']);

const extensionBlocks = vm => {
    if (!vm || !vm.runtime) return [];
    const manager = vm.extensionManager;
    const {byOpcode} = normalizeSignatures(getExtensionSignatures(vm.runtime));
    const blocks = [];
    for (const signature of byOpcode.values()) {
        if (signature.menu) continue;
        if (manager && manager.isCoreExtension && manager.isCoreExtension(signature.extension)) continue;
        blocks.push(signature);
    }
    return blocks;
};

const argumentList = signature => signature.args.map(arg => arg.name).join(', ');

const blockTemplate = signature => {
    const call = `${signature.label}(${signature.args.map(arg => `\${${arg.name}}`).join(', ')})`;
    if (signature.branches) return `${call} {\n\t\${}\n}`;
    return STATEMENTS.has(signature.blockType) ? `${call};` : call;
};

const blockKind = signature => {
    if (VALUES.has(signature.blockType)) return 'reporter';
    if (STATEMENTS.has(signature.blockType)) return 'statement';
    return signature.blockType;
};

const extensionCompletionSource = getVm => context => {
    const word = context.matchBefore(/[A-Za-z][A-Za-z0-9]*(?:\.[\w$]*)?/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    const namespace = word.text.split('.')[0].toLowerCase();
    const blocks = extensionBlocks(getVm()).filter(signature =>
        signature.extension.toLowerCase().startsWith(namespace));
    if (!blocks.length) return null;
    return {
        from: word.from,
        validFor: /^[A-Za-z0-9]*(?:\.[\w$]*)?$/,
        options: blocks.map(signature => snippetCompletion(blockTemplate(signature), {
            label: signature.label,
            detail: `(${argumentList(signature)})`,
            info: blockKind(signature),
            type: 'function'
        }))
    };
};

const referenceGroups = vm => {
    const groups = new Map();
    const add = (kind, item) => {
        if (!groups.has(kind)) groups.set(kind, []);
        groups.get(kind).push(item);
    };
    for (const entry of languageReference()) {
        add(entry.kind, {
            name: entry.name,
            kind: entry.kind,
            insert: entry.example || entry.name,
            detail: entry.example || (entry.args.length ? `${entry.name}(${entry.args.join(', ')})` : entry.name),
            opcode: entry.opcode
        });
    }
    for (const signature of extensionBlocks(vm)) {
        add(signature.extension, {
            name: signature.label,
            kind: blockKind(signature),
            insert: blockTemplate(signature).replace(/\$\{([^}]*)\}/g, '$1'),
            detail: `${signature.label}(${argumentList(signature)})`,
            opcode: signature.opcode
        });
    }
    return Array.from(groups.entries()).map(([kind, items]) => ({kind, items}));
};

export {blockTemplate, extensionBlocks, extensionCompletionSource, referenceGroups};
