import {snippetCompletion} from '@codemirror/autocomplete';
import {hoverTooltip} from '@codemirror/view';
import {languageReference} from 'fractch/browser';
import opcodeTable from 'scratch-vm/src/engine/opcodes.generated.json';

import {extensionBlocks, extensionCompletionSource} from './extension-completion.js';
import {symbolAt} from './definition.js';

const IDENT = /^[A-Za-z_][\w]*$/;
const SKIPPED_NAMESPACES = new Set(['argument', 'procedures']);
const CLOUD_PREFIX = '☁ ';
const LIST_FUNCTIONS = 'append|delete|insert|replace|set|clear|showList|hideList|get|item|indexOf|hasItem';
const LIST_BEFORE = new RegExp(`\\b(?:${LIST_FUNCTIONS})\\(\\s*$`);
const IMAGE_GLYPHS = [['rotate-left', '↺'], ['rotate-right', '↻'], ['green-flag', '⚑']];

const STRING_CONTEXTS = [
    [/\b(?:costume|switchCostume)\s*\(?\s*"[^"]*$/, ['costumes']],
    [/\b(?:backdrop|backdropAndWait|when\s+backdrop)\s*\(?\s*"[^"]*$/, ['backdrops']],
    [/\b(?:playSound|playSoundUntilDone|sound)\s*\(?\s*"[^"]*$/, ['sounds']],
    [/\b(?:broadcast|broadcastWait|when\s+broadcast)\s+"[^"]*$/, ['broadcasts']],
    [/\b(?:clone|pointTowards|goto|to|touching|distanceTo)\s*\(?\s*"[^"]*$/, ['sprites']]
];
const STRING_KINDS = ['costumes', 'backdrops', 'sounds', 'broadcasts', 'sprites'];
const KIND_LABELS = {
    costumes: 'costume',
    backdrops: 'backdrop',
    sounds: 'sound',
    broadcasts: 'broadcast',
    sprites: 'sprite',
    variables: 'variable',
    lists: 'list'
};

let referenceCache = null;
const reference = () => {
    if (!referenceCache) referenceCache = languageReference();
    return referenceCache;
};

const namespaceOf = opcode => opcode.slice(0, opcode.indexOf('_'));
const rawLabel = opcode => opcode.replace('_', '.');

const scratchBlocks = () => (typeof window === 'undefined' ? null : window.ScratchBlocks || null);

const recordDefinition = opcode => {
    const blocks = scratchBlocks();
    const definition = blocks && blocks.Blocks && blocks.Blocks[opcode];
    if (!definition || typeof definition.init !== 'function') return null;
    let json = null;
    try {
        definition.init.call({jsonInit: data => {
            json = data;
        }});
    } catch (e) {
        return json;
    }
    return json;
};

const shapeOf = json => {
    const extensions = json.extensions || [];
    if (extensions.includes('shape_hat')) return 'hat';
    if (extensions.includes('output_boolean') || json.output === 'Boolean') return 'boolean';
    if (extensions.some(name => name.startsWith('output_')) || 'output' in json) return 'reporter';
    if (extensions.some(name => /^shape_(statement|end)$/.test(name)) ||
        'previousStatement' in json || 'nextStatement' in json) return 'statement';
    return null;
};

const colorOf = json => {
    if (json.colour) return json.colour;
    const blocks = scratchBlocks();
    const extension = (json.extensions || []).find(name => name.startsWith('colours_'));
    const colours = extension && blocks && blocks.Colours ? blocks.Colours[extension.slice(8)] : null;
    return colours ? colours.primary : null;
};

const argText = arg => {
    if (!arg) return '';
    if (arg.type === 'field_image') {
        const glyph = IMAGE_GLYPHS.find(([name]) => String(arg.src || '').includes(name));
        return glyph ? glyph[1] : '';
    }
    if (arg.type === 'input_statement' || arg.type === 'field_vertical_separator') return '';
    if (arg.type === 'input_value') return `(${arg.name})`;
    return `[${arg.name || ''}]`;
};

const textOf = json => {
    const parts = [];
    for (let index = 0; typeof json[`message${index}`] === 'string'; index++) {
        const args = json[`args${index}`] || [];
        parts.push(json[`message${index}`].replace(/%(\d+)/g, (match, n) => argText(args[Number(n) - 1])));
    }
    return parts.join(' ').replace(/\s+/g, ' ')
        .trim();
};

const shapeCache = new Map();

const blockShape = opcode => {
    if (shapeCache.has(opcode)) return shapeCache.get(opcode);
    const json = recordDefinition(opcode);
    const entry = opcodeTable.opcodes[opcode];
    let shape = json ? shapeOf(json) : null;
    if (!shape && entry && entry.hat) shape = 'hat';
    if (!shape && namespaceOf(opcode) === 'operator') shape = 'reporter';
    if (json) shapeCache.set(opcode, shape);
    return shape;
};

const blockInfo = opcode => {
    const json = recordDefinition(opcode);
    if (!json) return null;
    return {text: textOf(json), color: colorOf(json), shape: shapeOf(json)};
};

const coreBlocks = () => {
    const blocks = [];
    for (const [opcode, entry] of Object.entries(opcodeTable.opcodes)) {
        if (!(entry.primitive || entry.hat) || opcode.indexOf('_') === -1) continue;
        if (SKIPPED_NAMESPACES.has(namespaceOf(opcode))) continue;
        const fields = new Set(entry.fields || []);
        const args = [...(entry.inputs || []), ...(entry.fields || [])].map(name => ({
            name,
            kind: fields.has(name) ? 'field' : 'input'
        }));
        blocks.push({opcode, label: rawLabel(opcode), namespace: namespaceOf(opcode), hat: entry.hat, args});
    }
    return blocks;
};

let coreCache = null;
const allCoreBlocks = () => {
    if (!coreCache) coreCache = coreBlocks();
    return coreCache;
};

const coreTemplate = block => {
    const branches = block.args.filter(arg => /^SUBSTACK\d*$/.test(arg.name));
    const args = block.args.filter(arg => !/^SUBSTACK\d*$/.test(arg.name))
        .map(arg => `${arg.kind === 'field' ? 'field ' : ''}${arg.name}: \${${arg.name}}`);
    const call = `${block.label}(${args.join(', ')})`;
    const shape = blockShape(block.opcode);
    if (branches.length || shape === 'hat') return `${call} {\n\t\${}\n}`;
    return shape === 'statement' ? `${call};` : call;
};

const aliasTemplate = entry => {
    if (entry.kind === 'reporter') return `${entry.name}(${entry.args.map(arg => `\${${arg}}`).join(', ')})`;
    if (!entry.args.length) return `${entry.name};`;
    if (entry.args[0] === 'list') return `${entry.name}(${entry.args.map(arg => `\${${arg}}`).join(', ')});`;
    return `${entry.name} ${entry.args.map(arg => `\${${arg}}`).join(', ')};`;
};

const visibleName = name => (name.startsWith(CLOUD_PREFIX) ? name.slice(CLOUD_PREFIX.length) : name);

const projectNames = (vm, targetId) => {
    const runtime = vm && vm.runtime;
    const names = {variables: [], lists: [], broadcasts: [], costumes: [], backdrops: [], sounds: [], sprites: []};
    if (!runtime) return names;
    const stage = runtime.getTargetForStage();
    const target = runtime.getTargetById(targetId) || stage;
    const scope = target && stage && target !== stage ? [target, stage] : [target || stage].filter(Boolean);
    for (const owner of scope) {
        for (const variable of Object.values(owner.variables)) {
            if (variable.name.startsWith('!')) continue;
            if (variable.type === '') names.variables.push(visibleName(variable.name));
            else if (variable.type === 'list') names.lists.push(variable.name);
            else if (variable.type === 'broadcast_msg') names.broadcasts.push(variable.name);
        }
    }
    if (target) {
        names.costumes = target.getCostumes().map(costume => costume.name);
        names.sounds = target.getSounds().map(sound => sound.name);
    }
    if (stage) names.backdrops = stage.getCostumes().map(costume => costume.name);
    names.sprites = runtime.targets.filter(each => each.isOriginal && !each.isStage).map(each => each.getName());
    return names;
};

const procedureNames = text => Array.from(String(text || '').matchAll(/\bdef\s+@([A-Za-z_]\w*)\s*\(([^)]*)\)/g))
    .map(match => ({
        name: match[1],
        params: match[2].split(',').map(param => param.trim().replace(/\(.*$/, ''))
            .filter(Boolean)
    }));

const nameInsert = (kind, name) => {
    if (IDENT.test(name)) return name;
    if (kind === 'lists') return `lists[${JSON.stringify(name)}]`;
    if (kind === 'broadcasts') return JSON.stringify(name);
    return `vars[${JSON.stringify(name)}]`;
};

const nameOptions = (names, kinds, insert) => {
    const options = [];
    for (const kind of kinds) {
        for (const name of new Set(names[kind])) {
            options.push({label: name, detail: KIND_LABELS[kind], type: 'variable', apply: insert(kind, name)});
        }
    }
    return options;
};

const stringCompletions = (context, names) => {
    const line = context.state.doc.lineAt(context.pos);
    const before = line.text.slice(0, context.pos - line.from);
    const quotes = (before.replace(/\\./g, '').match(/"/g) || []).length;
    if (quotes % 2 === 0) return null;
    const match = STRING_CONTEXTS.find(([pattern]) => pattern.test(before));
    const kinds = match ? match[1] : STRING_KINDS;
    const from = line.from + before.lastIndexOf('"') + 1;
    const options = nameOptions(names, kinds, (kind, name) => JSON.stringify(name).slice(1, -1));
    return options.length ? {from, validFor: /^[^"]*$/, options} : null;
};

const memberCompletions = word => {
    const [namespace] = word.text.split('.');
    const blocks = allCoreBlocks().filter(block => block.namespace === namespace.toLowerCase());
    if (!blocks.length) return [];
    return blocks.map(block => snippetCompletion(coreTemplate(block), {
        label: block.label,
        detail: `(${block.args.map(arg => arg.name).join(', ')})`,
        info: () => {
            const info = blockInfo(block.opcode);
            return info && info.text ? info.text : null;
        },
        type: 'function'
    }));
};

const identifierCompletions = (context, word, names) => {
    const line = context.state.doc.lineAt(context.pos);
    const before = line.text.slice(0, word.from - line.from);
    if (/@$/.test(before)) {
        return procedureNames(context.state.doc.toString()).map(proc => snippetCompletion(
            `${proc.name}(${proc.params.map(param => `\${${param}}`).join(', ')})`,
            {label: proc.name, detail: `(${proc.params.join(', ')})`, type: 'function'}
        ));
    }
    if (/\b(?:broadcast|broadcastWait|when\s+broadcast)\s+$/.test(before)) {
        return nameOptions(names, ['broadcasts'], nameInsert);
    }
    const kinds = LIST_BEFORE.test(before) ? ['lists'] : ['variables', 'lists'];
    const options = nameOptions(names, kinds, nameInsert);
    if (kinds.length === 1) return options;
    for (const entry of reference()) {
        if (entry.kind === 'property') continue;
        if (entry.kind === 'keyword') {
            options.push({label: entry.name, detail: entry.example, type: 'keyword'});
            continue;
        }
        options.push(snippetCompletion(aliasTemplate(entry), {
            label: entry.name,
            detail: entry.args.length ? `(${entry.args.join(', ')})` : '',
            info: entry.kind,
            type: 'function'
        }));
    }
    for (const namespace of new Set(allCoreBlocks().map(block => block.namespace))) {
        options.push({label: namespace, type: 'namespace', detail: 'blocks'});
    }
    return options;
};

const fractchCompletionSource = (getVm, getTargetId) => {
    const extensionSource = extensionCompletionSource(getVm);
    return context => {
        const vm = getVm();
        const names = projectNames(vm, getTargetId());
        const inString = stringCompletions(context, names);
        if (inString) return inString;
        const word = context.matchBefore(/[A-Za-z_][\w]*(?:\.[\w$]*)?/);
        if (!word || (word.from === word.to && !context.explicit)) return null;
        const options = word.text.includes('.') ? memberCompletions(word) :
            identifierCompletions(context, word, names);
        const extensions = extensionSource(context);
        if (extensions) options.push(...extensions.options);
        if (!options.length) return null;
        return {from: word.from, validFor: /^[A-Za-z_][\w]*(?:\.[\w$]*)?$/, options};
    };
};

const identifierAt = (line, column) => {
    for (const match of line.matchAll(/[A-Za-z_]\w*/g)) {
        if (column < match.index || column > match.index + match[0].length) continue;
        return /[\w.@$]/.test(line.charAt(match.index - 1)) ? null : match;
    }
    return null;
};

const wordAt = (line, column, pattern) => {
    for (const match of line.matchAll(pattern)) {
        if (column >= match.index && column <= match.index + match[0].length) return match;
    }
    return null;
};

const hoveredOpcodes = (vm, text, column) => {
    const member = wordAt(text, column, /\b([A-Za-z][A-Za-z0-9]*)\.([A-Za-z_$][\w$]*)/g);
    if (member) {
        const opcode = `${member[1]}_${member[2]}`;
        const signature = extensionBlocks(vm).find(each => each.opcode === opcode);
        if (opcodeTable.opcodes[opcode] || signature) {
            return {from: member.index, to: member.index + member[0].length, opcodes: [opcode], entries: []};
        }
        return null;
    }
    const word = identifierAt(text, column);
    if (!word) return null;
    const entries = reference().filter(entry => entry.kind !== 'property' &&
        (entry.name === word[0] || entry.parseNames.includes(word[0])));
    if (!entries.length) return null;
    const opcodes = new Set();
    for (const entry of entries) {
        for (const opcode of entry.opcode.split(' / ')) {
            if (opcodeTable.opcodes[opcode.trim()]) opcodes.add(opcode.trim());
        }
    }
    return {from: word.index, to: word.index + word[0].length, opcodes: Array.from(opcodes), entries};
};

const usageOf = entry => entry.example || aliasTemplate(entry).replace(/\$\{([^}]*)\}/g, '$1');

const renderHover = (found, classes) => {
    const dom = document.createElement('div');
    dom.className = classes.hover || '';
    for (const opcode of found.opcodes.slice(0, 2)) {
        const info = blockInfo(opcode);
        const row = document.createElement('div');
        row.className = classes.hoverBlock || '';
        const swatch = document.createElement('span');
        swatch.className = classes.hoverSwatch || '';
        if (info && info.color) swatch.style.background = info.color;
        const label = document.createElement('span');
        label.textContent = info && info.text ? info.text : rawLabel(opcode);
        row.append(swatch, label);
        dom.append(row);
    }
    const docs = new Set(found.entries.map(usageOf));
    if (!found.entries.length) {
        for (const block of allCoreBlocks().filter(each => found.opcodes.includes(each.opcode))) {
            docs.add(coreTemplate(block).replace(/\$\{([^}]*)\}/g, '$1')
                .replace(/\s*\{[\s\S]*$/, ' { }'));
        }
        for (const entry of reference().filter(each => found.opcodes.includes(each.opcode))) docs.add(usageOf(entry));
    }
    for (const usage of docs) {
        const code = document.createElement('code');
        code.className = classes.hoverDoc || '';
        code.textContent = usage;
        dom.append(code);
    }
    const opcodes = document.createElement('div');
    opcodes.className = classes.hoverOpcode || '';
    opcodes.textContent = found.opcodes.join(', ');
    dom.append(opcodes);
    return dom;
};

const fractchHover = (getVm, classes = {}) => hoverTooltip((view, pos) => {
    const line = view.state.doc.lineAt(pos);
    const found = hoveredOpcodes(getVm(), line.text, pos - line.from);
    if (!found || !found.opcodes.length) return null;
    return {
        pos: line.from + found.from,
        end: line.from + found.to,
        above: true,
        create: () => ({dom: renderHover(found, classes)})
    };
});

const lookupVariable = (vm, targetId, name, type) => {
    const target = vm.runtime.getTargetById(targetId) || vm.runtime.getTargetForStage();
    if (!target) return null;
    return target.lookupVariableByNameAndType(name, type) ||
        target.lookupVariableByNameAndType(`${CLOUD_PREFIX}${name}`, type) || null;
};

const lookupBroadcast = (vm, name) => {
    const stage = vm.runtime.getTargetForStage();
    const wanted = String(name).toLowerCase();
    return stage ? Object.values(stage.variables).find(variable => variable.type === 'broadcast_msg' &&
        variable.name.toLowerCase() === wanted) || null : null;
};

const parseQuoted = raw => {
    try {
        return JSON.parse(raw);
    } catch (e) {
        return raw.slice(1, -1);
    }
};

const variableSymbol = (kind, variable) => (variable ? {kind, name: variable.name, id: variable.id} : null);

const editableSymbol = (vm, targetId, text, offset) => {
    const doc = String(text || '');
    const lineStart = doc.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
    const lineEnd = doc.indexOf('\n', offset);
    const line = doc.slice(lineStart, lineEnd === -1 ? doc.length : lineEnd);
    const column = offset - lineStart;
    const keyed = wordAt(line, column, /\b(vars|lists)\[("(?:[^"\\]|\\.)*")\]/g);
    if (keyed) {
        const kind = keyed[1] === 'lists' ? 'list' : 'variable';
        return variableSymbol(kind, lookupVariable(vm, targetId, parseQuoted(keyed[2]), kind === 'list' ? 'list' : ''));
    }
    const base = symbolAt(doc, offset);
    if (base && base.kind === 'broadcast') {
        const broadcast = lookupBroadcast(vm, base.name);
        return broadcast ? {kind: 'broadcast', name: broadcast.name, id: broadcast.id} : null;
    }
    if (base && base.kind === 'procedure') return base;
    const word = identifierAt(line, column);
    if (!word) return null;
    const before = line.slice(0, word.index);
    const after = line.slice(word.index + word[0].length);
    const list = lookupVariable(vm, targetId, word[0], 'list');
    const scalar = lookupVariable(vm, targetId, word[0], '');
    const listShaped = /^\s*\.length\b/.test(after) || LIST_BEFORE.test(before) ||
        (/\bvar\s+$/.test(before) && /^\s*=\s*\[/.test(after));
    if (listShaped && list) return variableSymbol('list', list);
    if (scalar) return variableSymbol('variable', scalar);
    return list ? variableSymbol('list', list) : null;
};

const blockOwner = block => (block.shadow && block.parent ? block.parent : block.id);

const findReferences = (vm, targetId, symbol, text) => {
    if (!symbol) return [];
    if (symbol.kind === 'procedure') {
        const pattern = new RegExp(`@${symbol.name.replace(/[$]/g, '\\$')}(?![\\w$])`, 'g');
        return Array.from(String(text || '').matchAll(pattern)).map(match => ({
            targetId,
            from: match.index,
            to: match.index + match[0].length
        }));
    }
    const field = {variable: 'VARIABLE', list: 'LIST', broadcast: 'BROADCAST_OPTION'}[symbol.kind];
    if (!field) return [];
    const stage = vm.runtime.getTargetForStage();
    const global = symbol.kind === 'broadcast' || (stage && stage.variables[symbol.id]);
    const targets = vm.runtime.targets.filter(target => target.isOriginal &&
        (global || target.id === targetId));
    const references = [];
    for (const target of targets) {
        for (const block of Object.values(target.blocks._blocks)) {
            const value = block.fields && block.fields[field];
            if (value && value.id === symbol.id) references.push({targetId: target.id, blockId: blockOwner(block)});
        }
    }
    return references;
};

const procedureRenameChanges = (text, oldName, newName) => {
    const doc = String(text || '');
    const changes = findReferences(null, null, {kind: 'procedure', name: oldName}, doc)
        .map(ref => ({from: ref.from, to: ref.to, insert: `@${newName}`}));
    const def = new RegExp(`\\bdef\\s+@${oldName.replace(/[$]/g, '\\$')}\\s*\\([^)]*\\)\\s*"((?:[^"\\\\]|\\\\.)*)"`)
        .exec(doc);
    if (def) {
        const label = def[1];
        const head = label.indexOf('%') === -1 ? label : label.slice(0, label.indexOf('%'));
        const from = def.index + def[0].length - 1 - label.length;
        const kept = head.trimEnd().length < head.length ? ' ' : '';
        changes.push({from, to: from + head.length, insert: `${newName}${kept}`});
    }
    return changes.sort((a, b) => a.from - b.from);
};

export {
    blockInfo,
    coreBlocks,
    coreTemplate,
    editableSymbol,
    findReferences,
    fractchCompletionSource,
    fractchHover,
    hoveredOpcodes,
    procedureRenameChanges,
    projectNames
};
