import {parse} from '@babel/parser';
import {readHeaderMetadata, childKeys, isNode, keyName} from './source-locate.js';

const INPUT_EVENTS = new Set([
    'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'mousemove', 'click', 'dblclick',
    'contextmenu', 'wheel', 'pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchend',
    'touchmove', 'paste'
]);
const STORAGE_GLOBALS = new Set(['localStorage', 'sessionStorage', 'indexedDB']);
const GLOBAL_OBJECTS = new Set(['window', 'self', 'globalThis']);
const UNSANDBOXED_KEYS = new Set(['vm', 'renderer', 'gui']);
const TARGET_KEYS = new Set(['targets', 'executableTargets', '_editingTarget', '_stageTarget']);
const PATCHABLE_KINDS = new Set([
    'vm', 'runtime', 'gui', 'blockly', 'prototype', 'prototype-member',
    'vm-internal', 'vm-exports', 'runtime-internal', 'gui-internal', 'blockly-internal'
]);
const FUNCTION_TYPES = new Set([
    'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ClassMethod',
    'ClassPrivateMethod', 'ObjectMethod'
]);
const SCOPE_BLOCKS = new Set(['ForStatement', 'ForInStatement', 'ForOfStatement', 'SwitchStatement',
    'CatchClause', 'StaticBlock']);
const PROPERTY_TYPES = new Set(['ObjectProperty', 'ClassProperty', 'ClassPrivateProperty']);
const WINDOW_PROPERTIES = new Set(['Scratch', 'ScratchExtensions', 'location', 'name', 'status', 'opener',
    'origin', 'title', 'closed', 'defaultStatus']);
const BRANCHING_TYPES = new Set(['LogicalExpression', 'ConditionalExpression', 'SequenceExpression']);
const FILE_LEVEL_CODES = new Set(['no-register', 'missing-metadata']);
const TYPE_HINT = /@returns?\s*\{\s*Scratch\.Info\s*\}/;
const MODULE_MARKER = /^[ \t]*\/\/ (\S+\.(?:[cm]?[jt]sx?|json))[ \t]*$/gm;
const NEXT_LINE_MARKER = /^[\s*]*mw-ext-disable-next-line(?![\w-])(.*)$/s;
const FILE_MARKER = /^[\s*]*mw-ext-disable(?![\w-])(.*)$/s;

const isMember = node => Boolean(node) &&
    (node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression');
const isCall = node => Boolean(node) &&
    (node.type === 'CallExpression' || node.type === 'OptionalCallExpression');
const isFunction = node => Boolean(node) && FUNCTION_TYPES.has(node.type);

const propName = node => {
    if (!isMember(node)) return null;
    if (!node.computed && node.property.type === 'Identifier') return node.property.name;
    if (node.property.type === 'StringLiteral') return node.property.value;
    return null;
};

const memberPath = node => {
    const parts = [];
    while (isMember(node)) {
        const name = propName(node);
        if (name === null) return null;
        parts.unshift(name);
        node = node.object;
    }
    if (node.type === 'Identifier') parts.unshift(node.name);
    else if (node.type === 'ThisExpression') parts.unshift('this');
    else return null;
    return parts;
};

const traverse = (root, rootState, enter, exit) => {
    const nodes = [root];
    const states = [rootState];
    const parents = [null];
    const leaving = [false];
    while (nodes.length) {
        const node = nodes.pop();
        const state = states.pop();
        const parent = parents.pop();
        if (leaving.pop()) {
            exit(node, state);
            continue;
        }
        const childState = enter(node, state, parent);
        if (exit && isCall(node)) {
            nodes.push(node);
            states.push(state);
            parents.push(parent);
            leaving.push(true);
        }
        const keys = childKeys(node);
        for (let i = keys.length - 1; i >= 0; i--) {
            const value = node[keys[i]];
            if (!value) continue;
            if (Array.isArray(value)) {
                for (let j = value.length - 1; j >= 0; j--) {
                    if (isNode(value[j])) {
                        nodes.push(value[j]);
                        states.push(childState);
                        parents.push(node);
                        leaving.push(false);
                    }
                }
            } else if (typeof value.type === 'string') {
                nodes.push(value);
                states.push(childState);
                parents.push(node);
                leaving.push(false);
            }
        }
    }
};

const LINE_TERMINATOR = /\r\n?|[\n\u2028\u2029]/g;

const lineStarts = source => {
    const starts = [0];
    LINE_TERMINATOR.lastIndex = 0;
    let match;
    while ((match = LINE_TERMINATOR.exec(source))) starts.push(match.index + match[0].length);
    return starts;
};

const positionOf = (starts, offset) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (starts[mid] <= offset) low = mid;
        else high = mid - 1;
    }
    return {line: low + 1, column: offset - starts[low] + 1};
};

const nodeModuleRegions = source => {
    const regions = [];
    let open = null;
    MODULE_MARKER.lastIndex = 0;
    let match;
    while ((match = MODULE_MARKER.exec(source))) {
        const inModules = match[1].startsWith('node_modules/') || match[1].includes('/node_modules/');
        if (inModules && open === null) open = match.index;
        if (!inModules && open !== null) {
            regions.push([open, match.index]);
            open = null;
        }
    }
    if (open !== null) regions.push([open, source.length]);
    return regions;
};

const bindingNames = (pattern, out) => {
    if (!pattern) return out;
    switch (pattern.type) {
    case 'Identifier':
        out.push(pattern);
        break;
    case 'ObjectPattern':
        for (const prop of pattern.properties) {
            bindingNames(prop.type === 'RestElement' ? prop.argument : prop.value, out);
        }
        break;
    case 'ArrayPattern':
        for (const element of pattern.elements) bindingNames(element, out);
        break;
    case 'AssignmentPattern':
        bindingNames(pattern.left, out);
        break;
    case 'RestElement':
        bindingNames(pattern.argument, out);
        break;
    }
    return out;
};

const iifeCallee = call => {
    if (!isCall(call)) return null;
    let callee = call.callee;
    let offset = 0;
    if (isMember(callee) && propName(callee) === 'call') {
        callee = callee.object;
        offset = 1;
    } else if (isMember(callee) && propName(callee) === 'apply') {
        return null;
    }
    if (callee.type !== 'FunctionExpression' && callee.type !== 'ArrowFunctionExpression') return null;
    return {callee, offset};
};

const findIIFE = program => {
    for (const statement of program.body) {
        if (statement.type !== 'ExpressionStatement') continue;
        let expression = statement.expression;
        if (expression.type === 'UnaryExpression') expression = expression.argument;
        const found = iifeCallee(expression);
        if (found && found.callee.body.type === 'BlockStatement') {
            return {statement, callee: found.callee, body: found.callee.body};
        }
    }
    return null;
};

const scratchDeclaration = statements => statements.find(statement =>
    (statement.type === 'VariableDeclaration' && statement.declarations.some(declarator =>
        bindingNames(declarator.id, []).some(id => id.name === 'Scratch'))) ||
    ((statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') &&
        statement.id && statement.id.name === 'Scratch')) || null;

const indentAt = (source, offset) => {
    const lineStart = source.lastIndexOf('\n', offset - 1) + 1;
    return /^[ \t]*/.exec(source.slice(lineStart, offset))[0];
};

const bodyIndent = (source, body) => {
    const first = (body.directives && body.directives[0]) || body.body[0];
    return first ? indentAt(source, first.start) : '  ';
};

const indentLines = (text, indent) => text.split('\n').map(line => (line ? indent + line : line))
    .join('\n');

const isFeatureDetect = (node, parent) => {
    if (!parent) return false;
    switch (parent.type) {
    case 'IfStatement':
    case 'ConditionalExpression':
    case 'WhileStatement':
        return parent.test === node;
    case 'UnaryExpression':
        return parent.operator === '!' || parent.operator === 'typeof';
    case 'LogicalExpression':
        return true;
    case 'BinaryExpression':
        return ['===', '!==', '==', '!='].includes(parent.operator);
    case 'OptionalMemberExpression':
    case 'OptionalCallExpression':
        return parent.object === node && parent.optional;
    default:
        return false;
    }
};

const isRawSplice = (node, argsName, helpersName) => {
    if (isCall(node)) {
        const path = memberPath(node.callee);
        if (!path) return false;
        const [object, method] = path.slice(-2);
        return (object === 'input' && method === 'raw') || (object === 'cast' && method === 'toRaw');
    }
    if (!isMember(node)) return false;
    const path = memberPath(node);
    if (!path) return false;
    if (argsName && path.length >= 3 && path[0] === argsName && path[path.length - 1] === 'value') return true;
    if (path[0] === 'mutation' && path.length >= 2) return true;
    return Boolean(helpersName) && path[0] === helpersName && path[1] === 'mutation' && path.length >= 3;
};

const isStringy = node => {
    for (let current = node; current;) {
        if (current.type === 'StringLiteral' || current.type === 'TemplateLiteral') return true;
        if (current.type !== 'BinaryExpression' || current.operator !== '+') return false;
        if (isStringy(current.right)) return true;
        current = current.left;
    }
    return false;
};

const patternMembers = (pattern, out) => {
    if (!pattern) return out;
    if (isMember(pattern)) {
        out.push(pattern);
    } else if (pattern.type === 'ObjectPattern') {
        for (const prop of pattern.properties) {
            patternMembers(prop.type === 'RestElement' ? prop.argument : prop.value, out);
        }
    } else if (pattern.type === 'ArrayPattern') {
        for (const element of pattern.elements) patternMembers(element, out);
    } else if (pattern.type === 'AssignmentPattern') {
        patternMembers(pattern.left, out);
    } else if (pattern.type === 'RestElement') {
        patternMembers(pattern.argument, out);
    }
    return out;
};

const sliceText = (source, node, max = 60) => {
    const text = source.slice(node.start, Math.min(node.end, node.start + (max * 2))).replace(/\s+/g, ' ');
    return text.length > max || node.end - node.start > max * 2 ? `${text.slice(0, max - 3)}...` : text;
};

const step = (kind, name) => {
    switch (kind) {
    case 'global':
        if (name === 'Scratch') return 'Scratch';
        if (name === 'ScratchBlocks') return 'blockly';
        return null;
    case 'Scratch':
        if (name === 'vm' || name === 'renderer' || name === 'gui' || name === 'extensions') return name;
        return 'scratch-member';
    case 'vm':
        if (name === 'runtime' || name === 'renderer') return name;
        if (name === 'editingTarget') return 'target';
        if (name === 'exports') return 'vm-exports';
        return 'vm-internal';
    case 'runtime':
        if (name === 'renderer') return 'renderer';
        if (name === 'extensionStorage') return 'extension-storage';
        if (TARGET_KEYS.has(name)) return 'target';
        return 'runtime-internal';
    case 'target':
    case 'vm-exports':
    case 'extension-storage':
    case 'vm-internal':
    case 'runtime-internal':
        return kind;
    case 'renderer':
    case 'renderer-internal':
        return 'renderer-internal';
    case 'gui':
    case 'gui-internal':
        return 'gui-internal';
    case 'blockly':
    case 'blockly-internal':
        return 'blockly-internal';
    case 'prototype':
    case 'prototype-member':
        return 'prototype-member';
    case 'extensions':
        if (name === 'unsandboxed') return 'unsandboxed-flag';
        if (name === 'register') return 'register-fn';
        return 'extensions-member';
    default:
        return null;
    }
};

const INHERIT = Symbol('inherit');

const newScope = (parent, isFunctionScope, thisOwner = INHERIT) => ({
    parent,
    isFunctionScope,
    thisOwner,
    bindings: new Map()
});

const thisOwnerOf = scope => {
    while (scope && scope.thisOwner === INHERIT) scope = scope.parent;
    return scope ? scope.thisOwner : null;
};

const functionScope = scope => {
    while (!scope.isFunctionScope) scope = scope.parent;
    return scope;
};

const thisIds = new WeakMap();
let nextThisId = 1;
const thisKey = (owner, name) => {
    if (!owner) return `0:${name}`;
    if (!thisIds.has(owner)) thisIds.set(owner, nextThisId++);
    return `${thisIds.get(owner)}:${name}`;
};

const resolve = (name, scope) => {
    for (; scope; scope = scope.parent) {
        const binding = scope.bindings.get(name);
        if (binding) return binding;
    }
    return null;
};

const declare = (scope, name, extra) => {
    let binding = scope.bindings.get(name);
    if (!binding) {
        binding = {name, inits: [], classLike: false, classNode: null, scope};
        scope.bindings.set(name, binding);
    }
    if (extra) {
        if (extra.classLike) binding.classLike = true;
        if (extra.classNode && !binding.classNode) binding.classNode = extra.classNode;
    }
    return binding;
};

const returnsInfo = method => {
    const fn = PROPERTY_TYPES.has(method.type) ? method.value : method;
    if (!fn || !fn.body) return false;
    const hasInfoKeys = object => object && object.type === 'ObjectExpression' &&
        object.properties.some(prop => ['id', 'blocks'].includes(keyName(prop)));
    if (fn.body.type !== 'BlockStatement') return hasInfoKeys(fn.body);
    return fn.body.body.some(statement => statement.type === 'ReturnStatement' && hasInfoKeys(statement.argument));
};

const analyze = program => {
    const programScope = newScope(null, true, null);
    const scopes = new Map([[program, programScope]]);
    const pendingAssigns = [];
    const thisAssigns = new Map();
    const globals = new Map();
    const classes = [];
    const getInfos = [];
    const compFuncNames = new Set();
    const compFuncNodes = new Set();
    const methodsByName = new Map();

    const addMethod = (name, node) => {
        if (!methodsByName.has(name)) methodsByName.set(name, []);
        methodsByName.get(name).push(node);
    };

    const recordMembers = (owner, members) => {
        for (const member of members) {
            const name = keyName(member);
            if (!name) continue;
            const fn = PROPERTY_TYPES.has(member.type) ? member.value : member;
            if (!isFunction(fn)) continue;
            addMethod(name, fn);
            if (name === 'getInfo') getInfos.push({node: member, fn, owner});
        }
    };

    const classScopes = new Map();
    const classOfBody = new Map();
    const thisOwnerFor = (node, parent) => {
        if (node.type === 'ArrowFunctionExpression') return INHERIT;
        if (node.type === 'ClassMethod' || node.type === 'ClassPrivateMethod') return classOfBody.get(parent) || node;
        return node;
    };

    const enter = (node, scope, parent) => {
        let inner = scope;
        switch (node.type) {
        case 'VariableDeclaration': {
            const target = node.kind === 'var' ? functionScope(scope) : scope;
            for (const declarator of node.declarations) {
                const init = declarator.init;
                const classLike = Boolean(init) && (isFunction(init) || init.type === 'ClassExpression');
                for (const id of bindingNames(declarator.id, [])) {
                    declare(target, id.name, declarator.id === id ? {
                        classLike,
                        classNode: init && init.type === 'ClassExpression' ? init : null
                    } : null);
                }
                if (!init) continue;
                if (declarator.id.type === 'Identifier') {
                    target.bindings.get(declarator.id.name).inits.push({expr: init, scope});
                } else if (declarator.id.type === 'ObjectPattern') {
                    const patterns = [[declarator.id, []]];
                    while (patterns.length) {
                        const [pattern, props] = patterns.pop();
                        for (const prop of pattern.properties) {
                            if (prop.type !== 'ObjectProperty') continue;
                            const value = prop.value.type === 'AssignmentPattern' ? prop.value.left : prop.value;
                            const name = keyName(prop);
                            if (!name) continue;
                            if (value.type === 'Identifier') {
                                target.bindings.get(value.name).inits
                                    .push({expr: init, scope, props: [...props, name]});
                            } else if (value.type === 'ObjectPattern') {
                                patterns.push([value, [...props, name]]);
                            }
                        }
                    }
                }
            }
            break;
        }
        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'ClassMethod':
        case 'ClassPrivateMethod':
        case 'ObjectMethod':
            if (node.type === 'FunctionDeclaration' && node.id) declare(scope, node.id.name, {classLike: true});
            inner = newScope(scope, true, thisOwnerFor(node, parent));
            if (node.type === 'FunctionExpression' && node.id) declare(inner, node.id.name, {classLike: true});
            for (const param of node.params) {
                for (const id of bindingNames(param, [])) declare(inner, id.name);
            }
            if (node.type === 'ClassMethod' && node.kind === 'constructor') {
                for (const param of node.params) {
                    if (param.type === 'Identifier' && param.name === 'runtime') {
                        inner.bindings.get('runtime').convention = 'runtime';
                    }
                }
            }
            break;
        case 'ClassDeclaration':
        case 'ClassExpression':
            if (node.type === 'ClassDeclaration' && node.id) {
                declare(scope, node.id.name, {classLike: true, classNode: node});
            }
            classes.push(node);
            classScopes.set(node, scope);
            classOfBody.set(node.body, node);
            recordMembers(node, node.body.body);
            break;
        case 'ObjectExpression':
            recordMembers(node, node.properties);
            for (const prop of node.properties) {
                if (prop.type !== 'ObjectProperty' || keyName(prop) !== 'compFunc') continue;
                const value = prop.value;
                if (value.type === 'StringLiteral') compFuncNames.add(value.value);
                else if (isMember(value) && value.object.type === 'ThisExpression' && propName(value)) {
                    compFuncNames.add(propName(value));
                } else if (isFunction(value)) {
                    compFuncNodes.add(value);
                }
            }
            break;
        case 'BlockStatement':
            if (!(isFunction(parent) && parent.body === node)) inner = newScope(scope, false);
            break;
        case 'ClassBody':
            inner = newScope(scope, false, classOfBody.get(node));
            break;
        case 'AssignmentExpression':
            if (node.operator !== '=') break;
            if (node.left.type === 'Identifier') {
                pendingAssigns.push({name: node.left.name, scope, expr: node.right});
            } else if (isMember(node.left) && node.left.object.type === 'ThisExpression' && propName(node.left)) {
                const key = thisKey(thisOwnerOf(scope), propName(node.left));
                if (!thisAssigns.has(key)) thisAssigns.set(key, []);
                thisAssigns.get(key).push({expr: node.right, scope});
            }
            break;
        case 'CallExpression':
        case 'OptionalCallExpression': {
            const path = memberPath(node.callee);
            if (path && path.length >= 2 && path[path.length - 1] === 'register' &&
                path[path.length - 2] === 'compiler') {
                const blocks = node.arguments[1];
                if (blocks && blocks.type === 'ObjectExpression') {
                    for (const entry of blocks.properties) {
                        if (entry.type !== 'ObjectProperty' || entry.value.type !== 'ObjectExpression') continue;
                        for (const field of entry.value.properties) {
                            if (keyName(field) !== 'compile') continue;
                            if (field.type === 'ObjectMethod') compFuncNodes.add(field);
                            else if (isFunction(field.value)) compFuncNodes.add(field.value);
                        }
                    }
                }
            }
            break;
        }
        default:
            if (SCOPE_BLOCKS.has(node.type)) {
                inner = newScope(scope, false);
                if (node.type === 'CatchClause') {
                    for (const id of bindingNames(node.param, [])) declare(inner, id.name);
                }
            }
        }
        if (inner !== scope) scopes.set(node, inner);
        return inner;
    };
    const exit = (node, scope) => {
        const iife = iifeCallee(node);
        if (iife) {
            const fnScope = scopes.get(iife.callee);
            iife.callee.params.forEach((param, index) => {
                const arg = node.arguments[index + iife.offset];
                if (param.type === 'Identifier' && arg && arg.type !== 'SpreadElement') {
                    fnScope.bindings.get(param.name).inits.push({expr: arg, scope});
                }
            });
        }
        const callee = node.callee;
        const callback = node.arguments[0];
        if (isMember(callee) && propName(callee) === 'then' && callback && isFunction(callback) &&
            callback.params[0] && callback.params[0].type === 'Identifier') {
            const fnScope = scopes.get(callback);
            fnScope.bindings.get(callback.params[0].name).inits.push({expr: callee.object, scope, awaited: true});
        }
    };
    traverse(program, programScope, enter, exit);

    for (const {name, scope, expr} of pendingAssigns) {
        const binding = resolve(name, scope);
        if (binding) {
            binding.inits.push({expr, scope});
        } else {
            if (!globals.has(name)) globals.set(name, {name, inits: [], classLike: false, classNode: null});
            globals.get(name).inits.push({expr, scope});
        }
    }
    for (const name of compFuncNames) {
        for (const method of methodsByName.get(name) || []) compFuncNodes.add(method);
    }

    const nodeKinds = new Map();
    const thisKinds = new Map();
    const kinds = {};

    const bindingKind = binding => {
        if ('kind' in binding) return binding.kind;
        binding.kind = null;
        let result = null;
        for (const init of binding.inits) {
            let kind = kinds.expr(init.expr, init.scope);
            if (init.awaited) kind = kind === 'blockly-promise' ? 'blockly' : null;
            for (const prop of init.props || []) kind = kind ? step(kind, prop) : null;
            if (kind) {
                result = kind;
                break;
            }
        }
        binding.kind = result || binding.convention || null;
        return binding.kind;
    };

    const nameKind = (name, scope) => {
        const binding = resolve(name, scope) || globals.get(name);
        const kind = binding && bindingKind(binding);
        if (kind) return kind;
        if (name === 'Scratch') return 'Scratch';
        if (name === 'Blockly' || name === 'ScratchBlocks') return 'blockly';
        if (!binding && GLOBAL_OBJECTS.has(name)) return 'global';
        return null;
    };

    const thisKind = (scope, name) => {
        const key = thisKey(thisOwnerOf(scope), name);
        if (thisKinds.has(key)) return thisKinds.get(key);
        thisKinds.set(key, null);
        const inits = thisAssigns.get(key) || [];
        let result = null;
        for (const init of inits) {
            result = kinds.expr(init.expr, init.scope);
            if (result) break;
        }
        if (!result && inits.length === 0 && (name === 'runtime' || name === 'vm')) result = name;
        thisKinds.set(key, result);
        return result;
    };

    const memberKind = (node, objectKind, scope) => {
        const name = propName(node);
        if (name === null) return null;
        if (objectKind === 'this') return thisKind(scope, name);
        if (name === 'prototype') {
            if (objectKind) return PATCHABLE_KINDS.has(objectKind) ? 'prototype' : null;
            if (node.object.type !== 'Identifier') return null;
            return resolve(node.object.name, scope) || globals.has(node.object.name) ? null : 'prototype';
        }
        return objectKind ? step(objectKind, name) : null;
    };

    const leafKind = (node, scope) => {
        switch (node.type) {
        case 'Identifier':
            return nameKind(node.name, scope);
        case 'ThisExpression':
            return 'this';
        case 'AwaitExpression': {
            const kind = kinds.expr(node.argument, scope);
            return kind === 'blockly-promise' ? 'blockly' : kind;
        }
        case 'CallExpression':
        case 'OptionalCallExpression': {
            const name = propName(node.callee);
            if (name === null) return null;
            const objectKind = kinds.expr(node.callee.object, scope);
            if (objectKind === 'vm-exports') return 'vm-exports';
            if (name !== 'getBlockly' && name !== 'getBlocklyEagerly') return null;
            return objectKind === 'gui' ? 'blockly-promise' : null;
        }
        case 'MemberExpression':
        case 'OptionalMemberExpression': {
            const chain = [];
            let base = node;
            while (isMember(base) && !nodeKinds.has(base)) {
                chain.push(base);
                base = base.object;
            }
            let kind = isMember(base) ? nodeKinds.get(base) : kinds.expr(base, scope);
            for (let i = chain.length - 1; i >= 0; i--) {
                kind = memberKind(chain[i], kind, scope);
                nodeKinds.set(chain[i], kind);
            }
            return kind;
        }
        default:
            return null;
        }
    };

    kinds.expr = (node, scope) => {
        if (!node) return null;
        if (nodeKinds.has(node)) return nodeKinds.get(node);
        if (!BRANCHING_TYPES.has(node.type)) {
            const leaf = leafKind(node, scope);
            nodeKinds.set(node, leaf);
            return leaf;
        }
        const pending = [node];
        let kind = null;
        while (pending.length && !kind) {
            const current = pending.pop();
            if (current.type === 'LogicalExpression') {
                pending.push(current.right, current.left);
            } else if (current.type === 'ConditionalExpression') {
                pending.push(current.alternate, current.consequent);
            } else if (current.type === 'SequenceExpression') {
                pending.push(current.expressions[current.expressions.length - 1]);
            } else if (current !== node && nodeKinds.has(current)) {
                kind = nodeKinds.get(current);
            } else {
                kind = leafKind(current, scope);
            }
        }
        nodeKinds.set(node, kind);
        return kind;
    };

    return {
        programScope, scopes, classScopes, globals, classes, getInfos, compFuncNodes, exprKind: kinds.expr, nameKind
    };
};

const ownerOf = (expr, scope, seen = new Set()) => {
    if (!expr || seen.has(expr)) return null;
    seen.add(expr);
    if (expr.type === 'ObjectExpression' || expr.type === 'ClassExpression') return expr;
    if (expr.type === 'NewExpression') {
        if (expr.callee.type === 'ClassExpression') return expr.callee;
        if (expr.callee.type !== 'Identifier') return null;
        const binding = resolve(expr.callee.name, scope);
        return binding ? binding.classNode : null;
    }
    if (expr.type === 'Identifier') {
        const binding = resolve(expr.name, scope);
        if (!binding) return null;
        for (const init of binding.inits) {
            const owner = ownerOf(init.expr, init.scope, seen);
            if (owner) return owner;
        }
    }
    return null;
};

const redirectFix = (source, node) => ({
    label: 'Use Scratch.redirect',
    changes: [{
        from: node.start,
        to: node.end,
        insert: `Scratch.redirect(${source.slice(node.right.start, node.right.end)})`}]
});


const positionLineEnd = source => {
    const match = /[\r\n\u2028\u2029]/.exec(source);
    return match ? match.index : source.length;
};

const lintAst = (source, ast, options) => {
    const program = ast.program;
    const results = [];
    const report = (severity, code, node, message, fix) => {
        results.push({severity, code, message, from: node.start, to: node.end, fix});
    };
    const {programScope, scopes, classScopes, globals, classes, getInfos, compFuncNodes, exprKind, nameKind} =
        analyze(program);
    const header = readHeaderMetadata(source);
    const iife = findIIFE(program);
    const firstLine = {start: 0, end: positionLineEnd(source)};

    let registered = false;
    let guarded = false;
    let unsandboxedUse = null;
    let usesCanFetch = false;
    const registerCalls = [];
    const leaks = [];
    const implicitNames = [];
    const rawFetch = [];

    for (const statement of program.body) {
        if (statement.type === 'VariableDeclaration') {
            for (const declarator of statement.declarations) {
                for (const id of bindingNames(declarator.id, [])) leaks.push(id);
            }
        } else if ((statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') &&
            statement.id) {
            leaks.push(statement.id);
        }
    }

    const noteUnsandboxed = node => {
        if (!unsandboxedUse || node.start < unsandboxedUse.start) unsandboxedUse = node;
    };
    const isGlobalName = (name, scope) => !resolve(name, scope);
    const isGlobalHost = (name, scope) => (GLOBAL_OBJECTS.has(name) || name === 'document') &&
        isGlobalName(name, scope);
    const isGlobalObject = (node, scope) => node.type === 'Identifier' && GLOBAL_OBJECTS.has(node.name) &&
        isGlobalName(node.name, scope);

    const checkPatch = (target, scope) => {
        const objectKind = exprKind(target.object, scope);
        const name = propName(target);
        if (!objectKind || !PATCHABLE_KINDS.has(objectKind) ||
            (objectKind === 'runtime' && name && name.startsWith('ext_'))) {
            return;
        }
        report('warning', 'patches-internals', target,
            `Assigning to ${sliceText(source, target)} changes MistWarp internals. The change stays until the page ` +
            'reloads, so reload the page to apply edits to this code.');
    };

    const splices = new Set();
    const checkSplice = (expression, fn) => {
        const [first, second] = fn.params;
        const argsName = first && first.type === 'Identifier' ? first.name : null;
        const helpersName = second && second.type === 'Identifier' ? second.name : null;
        if (splices.has(expression) || !isRawSplice(expression, argsName, helpersName)) return;
        splices.add(expression);
        report('warning', 'compfunc-raw-source', expression,
            `${sliceText(source, expression, 40)} puts project text into the generated JavaScript, so a project ` +
            'could run any code. Use args.NAME directly or a cast helper such as cast.toString(args.NAME).');
    };

    const enter = (node, state, parent) => {
        const scope = scopes.get(node) || state.scope;
        const fnDepth = state.fnDepth + (isFunction(node) ? 1 : 0);
        const compFn = compFuncNodes.has(node) ? node : state.compFn;
        switch (node.type) {
        case 'MemberExpression':
        case 'OptionalMemberExpression': {
            const name = propName(node);
            if (name === null) break;
            const objectKind = exprKind(node.object, scope);
            if (name === 'unsandboxed' && objectKind === 'extensions') guarded = true;
            if (name === 'register') {
                const object = node.object;
                const legacy = (object.type === 'Identifier' && object.name === 'ScratchExtensions' &&
                    isGlobalName('ScratchExtensions', scope)) ||
                    (propName(object) === 'ScratchExtensions' && isGlobalObject(object.object, scope));
                if (objectKind === 'extensions' || legacy || propName(object) === 'extensions' ||
                    (object.type === 'Identifier' && object.name === 'extensions')) {
                    registered = true;
                    if (isCall(parent) && parent.callee === node) {
                        registerCalls.push({call: parent, scope, index: legacy ? 2 : 0});
                    }
                }
            }
            if (name === 'canFetch') usesCanFetch = true;
            if (objectKind === 'Scratch' && UNSANDBOXED_KEYS.has(name)) {
                if (name === 'vm' && isFeatureDetect(node, parent)) guarded = true;
                else noteUnsandboxed(node);
            }
            if (objectKind === 'global' && STORAGE_GLOBALS.has(name)) noteUnsandboxed(node);
            break;
        }
        case 'Identifier': {
            if (isMember(parent) && parent.property === node && !parent.computed) break;
            if (parent.type === 'PrivateName' || ((parent.type === 'LabeledStatement' ||
                parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && parent.label === node)) {
                break;
            }
            if ((parent.type === 'ObjectProperty' || parent.type === 'ClassMethod' || parent.type === 'ObjectMethod' ||
                parent.type === 'ClassProperty') && parent.key === node && !parent.computed &&
                !(parent.type === 'ObjectProperty' && parent.shorthand)) {
                break;
            }
            if (isFeatureDetect(node, parent) && nameKind(node.name, scope) === 'vm') guarded = true;
            if (nameKind(node.name, scope) === 'unsandboxed-flag') guarded = true;
            if (STORAGE_GLOBALS.has(node.name) && isGlobalName(node.name, scope)) noteUnsandboxed(node);
            break;
        }
        case 'VariableDeclarator':
            if (node.id.type === 'ObjectPattern' && node.init && exprKind(node.init, scope) === 'Scratch') {
                for (const prop of node.id.properties) {
                    if (prop.type === 'ObjectProperty' && UNSANDBOXED_KEYS.has(keyName(prop))) noteUnsandboxed(prop);
                }
            }
            break;
        case 'CallExpression':
        case 'OptionalCallExpression': {
            const callee = node.callee;
            if (callee.type === 'Identifier' && nameKind(callee.name, scope) === 'register-fn') {
                registered = true;
                registerCalls.push({call: node, scope, index: 0});
            }
            if (node.arguments.some(arg => exprKind(arg, scope) === 'extensions')) registered = true;
            const name = isMember(callee) ? propName(callee) : null;
            if (name === 'addEventListener' && callee.object.type === 'Identifier' &&
                ['document', 'window'].includes(callee.object.name) && isGlobalName(callee.object.name, scope) &&
                node.arguments[0] && node.arguments[0].type === 'StringLiteral' &&
                INPUT_EVENTS.has(node.arguments[0].value)) {
                noteUnsandboxed(callee);
            }
            if (!options.unsandboxed) break;
            const globalCall = (callee.type === 'Identifier' && isGlobalName(callee.name, scope)) ||
                (isMember(callee) && isGlobalObject(callee.object, scope));
            const calleeName = callee.type === 'Identifier' ? callee.name : name;
            if (globalCall && calleeName === 'fetch') {
                rawFetch.push([callee, 'Use Scratch.fetch instead of fetch so the request follows the user\'s ' +
                    'network permissions.', {label: 'Use Scratch.fetch',
                    changes: [{from: callee.start, to: callee.end, insert: 'Scratch.fetch'}]}]);
            }
            if (isMember(callee) && isGlobalObject(callee.object, scope) && name === 'open') {
                rawFetch.push([callee, 'Use Scratch.openWindow instead of window.open so the user is asked first.',
                    parent.type === 'ExpressionStatement' && node.arguments.length === 1 ? {
                        label: 'Use Scratch.openWindow',
                        changes: [{from: callee.start, to: callee.end, insert: 'Scratch.openWindow'}]} : null]);
            }
            if (name === 'assign') {
                const path = memberPath(callee);
                if (path && ((path.length === 2 && path[0] === 'location' && isGlobalName('location', scope)) ||
                    (path.length === 3 && path[1] === 'location' &&
                        isGlobalHost(path[0], scope)))) {
                    rawFetch.push([callee,
                        'Use Scratch.redirect instead of location.assign so the user is asked first.', null]);
                }
            }
            break;
        }
        case 'NewExpression':
            if (!options.unsandboxed || node.callee.type !== 'Identifier' ||
                !isGlobalName(node.callee.name, scope)) {
                break;
            }
            if (node.callee.name === 'XMLHttpRequest') {
                rawFetch.push([node.callee, 'Use Scratch.fetch instead of XMLHttpRequest so the request follows ' +
                    'the user\'s network permissions.', null]);
            } else if (node.callee.name === 'WebSocket') {
                rawFetch.push([node.callee, 'Check await Scratch.canFetch(url) before opening a WebSocket so the ' +
                    'user\'s network permissions apply.', null, 'websocket']);
            }
            break;
        case 'UpdateExpression':
            if (isMember(node.argument)) checkPatch(node.argument, scope);
            break;
        case 'UnaryExpression':
            if (node.operator === 'delete' && isMember(node.argument)) checkPatch(node.argument, scope);
            break;
        case 'ForInStatement':
        case 'ForOfStatement':
            if (node.left.type !== 'VariableDeclaration') {
                for (const target of patternMembers(node.left, [])) checkPatch(target, scope);
            }
            break;
        case 'AssignmentExpression': {
            const left = node.left;
            if (left.type === 'Identifier') {
                if (fnDepth === 0 && !WINDOW_PROPERTIES.has(left.name) && !/^on[a-z]+$/.test(left.name) &&
                    isGlobalName(left.name, scope) &&
                    !implicitNames.includes(left.name)) {
                    implicitNames.push(left.name);
                    leaks.push(left);
                }
                if (options.unsandboxed && node.operator === '=' && left.name === 'location' &&
                    isGlobalName('location', scope)) {
                    rawFetch.push([left, 'Use Scratch.redirect instead of setting location so the user is asked ' +
                        'first.', redirectFix(source, node)]);
                }
                break;
            }
            if (!isMember(left)) {
                for (const target of patternMembers(left, [])) checkPatch(target, scope);
                break;
            }
            const name = propName(left);
            if (name && /^on/.test(name) && INPUT_EVENTS.has(name.slice(2)) && left.object.type === 'Identifier' &&
                ['document', 'window'].includes(left.object.name) && isGlobalName(left.object.name, scope)) {
                noteUnsandboxed(left);
            }
            checkPatch(left, scope);
            if (options.unsandboxed && node.operator === '=') {
                const path = memberPath(left);
                const tail = path && path[path.length - 1] === 'href' ? path.slice(0, -1) : path;
                if (tail && ((tail.length === 1 && tail[0] === 'location' && isGlobalName('location', scope)) ||
                    (tail.length === 2 && tail[1] === 'location' &&
                        isGlobalHost(tail[0], scope)))) {
                    rawFetch.push([left, 'Use Scratch.redirect instead of setting location so the user is asked ' +
                        'first.', redirectFix(source, node)]);
                }
            }
            break;
        }
        case 'TemplateLiteral':
            if (compFn) {
                for (const expression of node.expressions) checkSplice(expression, compFn);
            }
            break;
        case 'BinaryExpression':
            if (compFn && node.operator === '+' && (isStringy(node.left) || isStringy(node.right))) {
                checkSplice(node.left, compFn);
                checkSplice(node.right, compFn);
            }
            break;
        }
        return scope === state.scope && fnDepth === state.fnDepth && compFn === state.compFn ? state :
            {scope, fnDepth, compFn};
    };

    traverse(program, {scope: programScope, fnDepth: 0, compFn: null}, enter, null);

    for (const [node, message, fix, kind] of rawFetch) {
        if (kind === 'websocket' && usesCanFetch) continue;
        report('info', 'raw-fetch', node, message, fix);
    }

    const registeredOwners = new Set();
    for (const {call, scope, index} of registerCalls) {
        const owner = ownerOf(call.arguments[index], scope);
        if (owner) registeredOwners.add(owner);
    }
    const infoOwners = new Set();
    const ownsInfo = new Set(getInfos.map(info => info.owner));
    for (const owner of registeredOwners) {
        const seen = new Set();
        let current = owner;
        while (current && !seen.has(current) && !ownsInfo.has(current)) {
            seen.add(current);
            const parentClass = current.superClass;
            const binding = parentClass && parentClass.type === 'Identifier' &&
                resolve(parentClass.name, classScopes.get(current));
            current = binding ? binding.classNode : null;
        }
        infoOwners.add(current && ownsInfo.has(current) ? current : owner);
    }
    for (const {node, fn, owner} of getInfos) {
        if (!infoOwners.has(owner)) continue;
        if (fn.async || fn.generator) {
            report('error', 'async-getinfo', node.key,
                'getInfo must return the extension info directly. An async getInfo returns a Promise, ' +
                'which the extension manager cannot read.');
        }
    }
    const hintable = getInfos.filter(({node, owner}) => node.type === 'ClassMethod' &&
        (infoOwners.size ? infoOwners.has(owner) : returnsInfo(node)));
    for (const {node} of hintable) {
        const comments = node.leadingComments || [];
        if (comments.some(comment => TYPE_HINT.test(comment.value))) continue;
        const indent = indentAt(source, node.start);
        report('info', 'getinfo-type-hint', node.key,
            'Add a /** @returns {Scratch.Info} */ comment above getInfo to get completions for blocks, ' +
            'arguments, and menus.',
            {
                label: 'Add type hint',
                changes: [{from: node.start, to: node.start, insert: `/** @returns {Scratch.Info} */\n${indent}`}]
            });
    }

    if (leaks.length) {
        const scratchBound = programScope.bindings.has('Scratch') || globals.has('Scratch');
        const first = program.directives[0] || program.body[0];
        const start = first ? first.start : source.length;
        const end = source.replace(/\s+$/, '').length;
        const names = implicitNames.filter(name => name !== 'Scratch');
        const declarations = names.length ? `let ${names.join(', ')};\n` : '';
        const open = scratchBound ? '(function () {\n' : '(function (Scratch) {\n';
        const close = scratchBound ? '\n}).call(this);' : '\n}).call(this, Scratch);';
        const directiveEnd = program.directives.length ?
            program.directives[program.directives.length - 1].end : null;
        const changes = directiveEnd === null ?
            [{from: start, to: start, insert: `${open}${declarations}`}] :
            [
                {from: start, to: start, insert: open},
                {from: directiveEnd, to: directiveEnd, insert: declarations ? `\n${declarations}` : ''}
            ];
        changes.push({from: end, to: end, insert: close});
        const fix = {label: 'Wrap the file in a function', changes: changes.filter(change => change.insert)};
        for (const id of leaks) {
            report('warning', 'global-leak', id,
                implicitNames.includes(id.name) && !programScope.bindings.has(id.name) ?
                    `${id.name} is assigned without a declaration, so it becomes a global shared with the page ` +
                    'and every other extension.' :
                    `${id.name} is declared at the top level, so it becomes a global shared with the page ` +
                    'and every other extension. Wrap the file in a function to keep it private.',
                fix);
        }
    }

    if (unsandboxedUse && !guarded) {
        const registeredClass = classes.find(each => registeredOwners.has(each) && each.id);
        const name = header.name || (registeredClass && registeredClass.id.name) || 'This extension';
        const guard = `if (!Scratch.extensions.unsandboxed) {\n  throw new Error(${
            JSON.stringify(`${name} must run unsandboxed`)});\n}`;
        let change;
        const iifeDeclaration = iife && scratchDeclaration(iife.body.body);
        const programDeclaration = scratchDeclaration(program.body);
        if (iife && !iife.callee.async && !iife.callee.generator) {
            const indent = bodyIndent(source, iife.body);
            const directives = iife.body.directives || [];
            const last = iifeDeclaration || directives[directives.length - 1];
            change = last ?
                {from: last.end, to: last.end, insert: `\n\n${indentLines(guard, indent)}`} :
                {from: iife.body.start + 1, to: iife.body.start + 1, insert: `\n${indentLines(guard, indent)}\n`};
        } else if (iife && !(programDeclaration && programDeclaration.start < iife.statement.start)) {
            const at = iife.statement.start;
            const indent = indentAt(source, at);
            change = {from: at, to: at, insert: `${indentLines(guard, indent).slice(indent.length)}\n\n${indent}`};
        } else {
            const last = programDeclaration || program.directives[program.directives.length - 1];
            const first = program.body[0];
            if (last) change = {from: last.end, to: last.end, insert: `\n\n${guard}`};
            else if (first) change = {from: first.start, to: first.start, insert: `${guard}\n\n`};
            else change = {from: source.length, to: source.length, insert: `\n${guard}\n`};
        }
        report('warning', 'unsandboxed-guard', unsandboxedUse,
            `${sliceText(source, unsandboxedUse, 40)} only works when the extension runs without the sandbox. ` +
            'Check Scratch.extensions.unsandboxed first so a sandboxed load fails with a clear error.',
            {label: 'Add unsandboxed check', changes: [change]});
    }

    if (!registered) {
        const targetScope = iife ? scopes.get(iife.callee) : programScope;
        const candidate = classes.find(each => each.id && each.type === 'ClassDeclaration' &&
            getInfos.some(info => info.owner === each && returnsInfo(info.node)) &&
            (resolve(each.id.name, targetScope) || {}).classNode === each);
        let fix;
        if (candidate) {
            const insert = `Scratch.extensions.register(new ${candidate.id.name}());`;
            if (iife) {
                const at = iife.body.end - 1;
                fix = {from: at, to: at, insert: `${bodyIndent(source, iife.body)}${insert}\n`};
            } else {
                const at = source.replace(/\s+$/, '').length;
                fix = {from: at, to: at, insert: `\n\n${insert}\n`};
            }
            fix = {label: `Register ${candidate.id.name}`, changes: [fix]};
        }
        report('error', 'no-register', firstLine,
            'This file never calls Scratch.extensions.register, so no extension loads. Call it with an instance ' +
            'of your extension class. For a helper file, add // mw-ext-disable no-register at the top.', fix);
    }

    const missing = [];
    if (!header.name) missing.push('Name');
    if (!header.description) missing.push('Description');
    if (!header.license) missing.push('License');
    if (missing.length) {
        report('info', 'missing-metadata', firstLine,
            `The header comment is missing ${missing.join(', ')}. Add lines such as ` +
            '// Name: My Extension at the top of the file so the editor can describe the extension.');
    }

    return results;
};


const codeSet = text => {
    const codes = new Set(text.split(/\s--(?:\s|$)/)[0].split(/[\s,]+/)
        .filter(token => token && !/^\*+\/?$/.test(token)));
    if (codes.size === 0) codes.add('*');
    return codes;
};

const firstCommentLine = comment => comment.value.split(/\r\n?|[\n\u2028\u2029]/)[0];

const suppressions = (comments, source) => {
    const nextLine = new Map();
    const fromHere = [];
    const firstLine = new Set();
    for (const comment of comments || []) {
        const text = firstCommentLine(comment);
        const next = NEXT_LINE_MARKER.exec(text);
        if (next) {
            const line = comment.loc.end.line + 1;
            if (!nextLine.has(line)) nextLine.set(line, new Set());
            for (const code of codeSet(next[1])) {
                nextLine.get(line).add(code);
                if (comment.loc.start.line === 1) firstLine.add(code);
            }
            continue;
        }
        const whole = FILE_MARKER.exec(text);
        const lineStart = comment.start - comment.loc.start.column;
        if (whole && /^\s*$/.test(source.slice(lineStart, comment.start))) {
            fromHere.push({from: comment.start, codes: codeSet(whole[1])});
        }
    }
    const has = (set, code) => Boolean(set) && (set.has('*') || set.has(code));
    return diagnostic => has(nextLine.get(diagnostic.line), diagnostic.code) ||
        fromHere.some(directive => has(directive.codes, diagnostic.code) &&
            (directive.from <= diagnostic.from || FILE_LEVEL_CODES.has(diagnostic.code))) ||
        (diagnostic.line === 1 && FILE_LEVEL_CODES.has(diagnostic.code) && has(firstLine, diagnostic.code));
};

const tooDeep = source => [{
    severity: 'info',
    code: 'nesting',
    message: 'This file is nested too deeply to check.',
    from: 0,
    to: positionLineEnd(source),
    line: 1,
    column: 1
}];

const isNestingFailure = error => error instanceof RangeError || !error || typeof error.pos !== 'number';

const lintExtension = (source, options = {}) => {
    source = String(source || '');
    const starts = lineStarts(source);
    let ast;
    try {
        ast = parse(source, {sourceType: 'script'});
    } catch (error) {
        if (isNestingFailure(error)) return tooDeep(source);
        const from = Math.min(error.pos, source.length);
        const message = String(error.message || 'Syntax error').replace(/\s*\(\d+:\d+\)\s*$/, '');
        return [{
            severity: 'error',
            code: 'syntax',
            message: /[.!?]$/.test(message) ? message : `${message}.`,
            from,
            to: Math.min(from + 1, source.length),
            ...positionOf(starts, from)
        }];
    }
    let diagnostics;
    try {
        diagnostics = lintAst(source, ast, options);
    } catch (error) {
        if (error instanceof RangeError) return tooDeep(source);
        throw error;
    }
    const regions = nodeModuleRegions(source);
    const suppressed = suppressions(ast.comments, source);
    const patched = new Set();
    return diagnostics
        .map(diagnostic => {
            const result = {...diagnostic, ...positionOf(starts, diagnostic.from)};
            if (!result.fix) delete result.fix;
            return result;
        })
        .filter(diagnostic => !regions.some(([start, end]) => diagnostic.from >= start && diagnostic.from < end) &&
            !suppressed(diagnostic))
        .sort((a, b) => a.from - b.from)
        .filter(diagnostic => {
            if (diagnostic.code !== 'patches-internals') return true;
            if (patched.has(diagnostic.message)) return false;
            patched.add(diagnostic.message);
            return true;
        });
};

export {lintExtension};
