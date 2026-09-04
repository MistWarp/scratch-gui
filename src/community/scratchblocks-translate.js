import {parseFractch} from 'fractch/browser';

const BOOLEAN_OPS = new Set([
    'operator_equals', 'operator_lt', 'operator_gt', 'operator_and', 'operator_or', 'operator_not',
    'operator_contains', 'sensing_touchingobject', 'sensing_touchingcolor', 'sensing_coloristouchingcolor',
    'sensing_keypressed', 'sensing_mousedown', 'data_listcontainsitem'
]);

const CORE_OPCODE_PREFIXES = new Set([
    'motion', 'looks', 'sound', 'event', 'control', 'sensing', 'operator', 'data', 'pen', 'procedures'
]);

const MENU_SHADOWS = new Set([
    'looks_costume', 'looks_backdrops', 'sound_sounds_menu', 'event_broadcast_menu'
]);

const MENU_CLEANUPS = {
    _edge_: 'edge', _myself_: 'myself', _mouse_: 'mouse-pointer', _random_: 'random position', _stage_: 'Stage'
};

const escapeText = value => String(value ?? '').replace(/([\]\\])/g, '\\$1');

const cleanMenuValue = value => {
    const text = String(value ?? '').trim();
    if (MENU_CLEANUPS[text]) return MENU_CLEANUPS[text];
    return text.replace(/^_+|_+$/g, '');
};

const unwrapCall = value => {
    let node = value;
    while (node && node.type === 'call' && node.value && node.value !== node) node = node.value;
    return node;
};

const argValue = (node, key) => (node.args || []).find(arg => arg.key === key)?.value;

const calleeName = node => node?.callee?.name || node?.callee?.method || '';

const opcodeOf = node => {
    if (node?.callee?.type === 'opcode') return node.callee.name || '';
    if (node?.callee?.type === 'identOrMethod') {
        return `${node.callee.ident || ''}_${node.callee.method || ''}`;
    }
    return '';
};

const isMenuCall = node => {
    const name = calleeName(node);
    return MENU_SHADOWS.has(name) || name.endsWith('menu') || name.endsWith('menus') || name.startsWith('menu_');
};

const translateMenuValue = value => {
    if (typeof value === 'string') return cleanMenuValue(value);
    const node = unwrapCall(value);
    if (!node || typeof node !== 'object') return '';
    if (node.type === 'call') {
        const inner = node.callee ? node : node.value;
        if (isMenuCall(inner)) {
            const positional = (inner.args || []).find(arg => (
                typeof arg.value === 'object' || typeof arg.value === 'string'
            ));
            const raw = typeof positional?.value === 'string' ?
                positional.value : positional?.value?.value ?? positional?.value?.name ?? '';
            return cleanMenuValue(raw);
        }
        return '';
    }
    if (typeof node.value === 'string') return cleanMenuValue(node.value);
    if (Array.isArray(node.value)) return cleanMenuValue(node.value[0]);
    if (typeof node.name === 'string') return cleanMenuValue(node.name);
    return '';
};

export const translateValue = value => {
    const node = unwrapCall(value);
    if (!node || typeof node !== 'object') return '()';
    switch (node.type) {
    case 'number':
        return `(${node.raw ?? node.value})`;
    case 'string':
        return `[${escapeText(node.value)}]`;
    case 'array':
        return `[${node.value[0]}]`;
    case 'broadcast':
        return `[${node.name}]`;
    case 'var':
    case 'list':
    case 'arg':
    case 'ident':
        return `(${node.name})`;
    case 'call': {
        const inner = node.callee ? node : node.value;
        if (isMenuCall(inner)) return `[${translateMenuValue(inner)} v]`;
        if (!inner || inner.type !== 'call' || !inner.callee) return '()';
        // Mutual recursion with translateCall; safe at runtime after module evaluation.
        // eslint-disable-next-line no-use-before-define
        const text = translateCall(inner);
        if (BOOLEAN_OPS.has(inner.callee.name)) {
            return text.startsWith('<') && text.endsWith('>') ? text : `<${text}>`;
        }
        return text.startsWith('(') && text.endsWith(')') ? text : `(${text})`;
    }
    default:
        if (typeof node.name === 'string') return `[${node.name}]`;
        if (typeof node.value === 'string') return `(${node.value})`;
        if (typeof node.value === 'number') return `(${node.value})`;
        return '(…)';
    }
};

const menuOf = (node, key) => {
    const text = translateMenuValue(argValue(node, key));
    return text ? `[${text} v]` : '[]';
};

const referenceNameOf = (node, key, fallback = 'variable') => {
    const value = unwrapCall(argValue(node, key));
    if (!value || typeof value !== 'object') return fallback;
    if (Array.isArray(value.value)) return value.value[0];
    if (typeof value.name === 'string') return value.name;
    if (typeof value.value === 'string') return value.value;
    return fallback;
};

const refOf = (node, key, fallback = 'variable') =>
    `[${escapeText(referenceNameOf(node, key, fallback))} v]`;

const inputOf = (node, key, fallback = '0') => {
    const value = argValue(node, key);
    if (value === null || typeof value === 'undefined') return `(${fallback})`;
    return translateValue(value);
};

const booleanInputOf = (node, key) => {
    const value = unwrapCall(argValue(node, key));
    if (!value || value.type === 'null') return '<>';
    return translateValue(value);
};

const extensionColor = (text, color) => `${text} :: ${color}`;

const translateKnownExtension = node => {
    switch (opcodeOf(node)) {
    case 'mistwarpData_load': return extensionColor('load my save', '#277a59');
    case 'mistwarpData_get': return extensionColor(`saved ${inputOf(node, 'KEY', 'key')}`, '#277a59');
    case 'mistwarpData_set': return extensionColor(
        `set saved ${inputOf(node, 'KEY', 'key')} to ${inputOf(node, 'VALUE', 'value')}`,
        '#277a59'
    );
    case 'mistwarpData_save': return extensionColor('save now', '#277a59');
    case 'mistwarpData_status': return extensionColor('save status', '#277a59');
    case 'mistwarpData_all': return extensionColor('all saved data as JSON', '#277a59');
    default: return null;
    }
};

export const translateCall = node => {
    if (!node || node.type !== 'call' || !node.callee) return '';
    if (node.callee.type === 'procedureCall') {
        const args = (node.args || []).map(arg => translateValue(arg.value ?? arg)).join(' ');
        return `${String(node.callee.name).replace(/_/g, ' ')}${args ? ` ${args}` : ''}`;
    }
    const extension = translateKnownExtension(node);
    if (extension) return extension;
    if (node.callee.type === 'identOrMethod') {
        const name = String(node.callee.method || node.callee.ident || 'extension block').replace(/_/g, ' ');
        const inputs = (node.args || [])
            .filter(arg => arg.value !== null && typeof arg.value !== 'undefined')
            .map(arg => translateValue(arg.value))
            .join(' ');
        return `${name}${inputs ? ` ${inputs}` : ''} :: extension`;
    }
    if (node.callee.type !== 'opcode') return '';
    const opcode = node.callee.name;
    switch (opcode) {
    case 'motion_movesteps': return `move ${inputOf(node, 'STEPS', '10')} steps`;
    case 'motion_turnright': return `turn right ${inputOf(node, 'DEGREES', '15')} degrees`;
    case 'motion_turnleft': return `turn left ${inputOf(node, 'DEGREES', '15')} degrees`;
    case 'motion_pointindirection': return `point in direction ${inputOf(node, 'DIRECTION', '90')}`;
    case 'motion_pointtowards': return `point towards ${menuOf(node, 'TOWARDS')}`;
    case 'motion_gotoxy': return `go to x: ${inputOf(node, 'X')} y: ${inputOf(node, 'Y')}`;
    case 'motion_goto': return `go to ${menuOf(node, 'TO')}`;
    case 'motion_glidesecstoxy': {
        const secs = inputOf(node, 'SECS', '1');
        return `glide ${secs} secs to x: ${inputOf(node, 'X')} y: ${inputOf(node, 'Y')}`;
    }
    case 'motion_glideto': return `glide ${inputOf(node, 'SECS', '1')} secs to ${menuOf(node, 'TO')}`;
    case 'motion_changexby': return `change x by ${inputOf(node, 'DX', '10')}`;
    case 'motion_setx': return `set x to ${inputOf(node, 'X')}`;
    case 'motion_changeyby': return `change y by ${inputOf(node, 'DY', '10')}`;
    case 'motion_sety': return `set y to ${inputOf(node, 'Y')}`;
    case 'motion_ifonedgebounce': return 'if on edge, bounce';
    case 'motion_setrotationstyle': return `set rotation style ${menuOf(node, 'STYLE')}`;
    case 'motion_xposition': return 'x position';
    case 'motion_yposition': return 'y position';
    case 'motion_direction': return 'direction';
    case 'looks_sayforsecs': {
        const message = inputOf(node, 'MESSAGE', 'Hello!');
        return `say ${message} for ${inputOf(node, 'SECS', '2')} seconds`;
    }
    case 'looks_say': return `say ${inputOf(node, 'MESSAGE', 'Hello!')}`;
    case 'looks_thinkforsecs': {
        const message = inputOf(node, 'MESSAGE', 'Hmm...');
        return `think ${message} for ${inputOf(node, 'SECS', '2')} seconds`;
    }
    case 'looks_think': return `think ${inputOf(node, 'MESSAGE', 'Hmm...')}`;
    case 'looks_show': return 'show';
    case 'looks_hide': return 'hide';
    case 'looks_switchcostumeto': return `switch costume to ${menuOf(node, 'COSTUME')}`;
    case 'looks_nextcostume': return 'next costume';
    case 'looks_switchbackdropto': return `switch backdrop to ${menuOf(node, 'BACKDROP')}`;
    case 'looks_switchbackdroptoandwait': return `switch backdrop to ${menuOf(node, 'BACKDROP')} and wait`;
    case 'looks_nextbackdrop': return 'next backdrop';
    case 'looks_setsizeto': return `set size to ${inputOf(node, 'SIZE', '100')} %`;
    case 'looks_changesizeby': return `change size by ${inputOf(node, 'CHANGE', '10')}`;
    case 'looks_seteffectto': return `set ${menuOf(node, 'EFFECT')} effect to ${inputOf(node, 'VALUE')}`;
    case 'looks_changeeffectby': return `change ${menuOf(node, 'EFFECT')} effect by ${inputOf(node, 'CHANGE', '25')}`;
    case 'looks_cleargraphiceffects': return 'clear graphic effects';
    case 'looks_gotofrontback': return `go to ${menuOf(node, 'FRONT_BACK')} layer`;
    case 'looks_goforwardbackwardlayers': {
        const direction = menuOf(node, 'FORWARD_BACKWARD');
        return `go ${direction} ${inputOf(node, 'NUM', '1')} layers`;
    }
    case 'looks_costumenumbername': return 'costume [number v]';
    case 'looks_backdropnumbername': return 'backdrop [number v]';
    case 'looks_size': return 'size';
    case 'sound_play': return `play sound ${menuOf(node, 'SOUND_MENU')}`;
    case 'sound_playuntildone': return `play sound ${menuOf(node, 'SOUND_MENU')} until done`;
    case 'sound_stopallsounds': return 'stop all sounds';
    case 'sound_setvolumeto': return `set volume to ${inputOf(node, 'VOLUME', '100')} %`;
    case 'sound_changevolumeby': return `change volume by ${inputOf(node, 'VOLUME', '-10')}`;
    case 'sound_volume': return 'volume';
    case 'sound_seteffectto': return `set ${menuOf(node, 'EFFECT')} effect to ${inputOf(node, 'VALUE')}`;
    case 'sound_changeeffectby': return `change ${menuOf(node, 'EFFECT')} effect by ${inputOf(node, 'CHANGE')}`;
    case 'sound_cleareffects': return 'clear sound effects';
    case 'event_broadcast': return `broadcast ${refOf(node, 'BROADCAST_INPUT', 'message1')}`;
    case 'event_broadcastandwait': return `broadcast ${refOf(node, 'BROADCAST_INPUT', 'message1')} and wait`;
    case 'control_wait': return `wait ${inputOf(node, 'DURATION', '1')} seconds`;
    case 'control_stop': return `stop ${menuOf(node, 'STOP_OPTION')}`;
    case 'control_create_clone_of': return `create clone of ${menuOf(node, 'CLONE_OPTION')}`;
    case 'control_delete_this_clone': return 'delete this clone';
    case 'control_get_counter': return 'counter';
    case 'control_incr_counter': return 'increment counter';
    case 'control_clear_counter': return 'clear counter';
    case 'sensing_touchingobject': return `touching ${menuOf(node, 'TOUCHINGOBJECTMENU')}?`;
    case 'sensing_touchingcolor': return `touching color ${inputOf(node, 'COLOR', '#ff0000')}?`;
    case 'sensing_coloristouchingcolor': {
        const first = inputOf(node, 'COLOR');
        return `color ${first} is touching ${inputOf(node, 'COLOR2')}?`;
    }
    case 'sensing_distanceto': return `distance to ${menuOf(node, 'DISTANCETO')}`;
    case 'sensing_askandwait': return `ask ${inputOf(node, 'QUESTION', "What's your name?")} and wait`;
    case 'sensing_answer': return 'answer';
    case 'sensing_keypressed': return `key ${menuOf(node, 'KEY_OPTION')} pressed?`;
    case 'sensing_mousedown': return 'mouse down?';
    case 'sensing_mousex': return 'mouse x';
    case 'sensing_mousey': return 'mouse y';
    case 'sensing_loudness': return 'loudness';
    case 'sensing_timer': return 'timer';
    case 'sensing_resettimer': return 'reset timer';
    case 'sensing_of': {
        const property = translateMenuValue(argValue(node, 'PROPERTY'));
        return `[${property} v] of ${inputOf(node, 'OBJECT', 'Sprite1')}`;
    }
    case 'sensing_current': return `current ${menuOf(node, 'CURRENTMENU')}`;
    case 'sensing_dayssince2000': return 'days since 2000';
    case 'sensing_dayofweek': return 'day of week';
    case 'sensing_username': return 'username';
    case 'sensing_setdragmode': return `set drag mode ${menuOf(node, 'DRAG_MODE')}`;
    case 'operator_add': return `(${inputOf(node, 'NUM1')} + ${inputOf(node, 'NUM2')})`;
    case 'operator_subtract': return `(${inputOf(node, 'NUM1')} - ${inputOf(node, 'NUM2')})`;
    case 'operator_multiply': return `(${inputOf(node, 'NUM1')} * ${inputOf(node, 'NUM2')})`;
    case 'operator_divide': return `(${inputOf(node, 'NUM1')} / ${inputOf(node, 'NUM2')})`;
    case 'operator_random': return `(pick random ${inputOf(node, 'FROM', '1')} to ${inputOf(node, 'TO', '10')})`;
    case 'operator_lt': return `<${inputOf(node, 'OPERAND1')} < ${inputOf(node, 'OPERAND2')}>`;
    case 'operator_equals': return `<${inputOf(node, 'OPERAND1')} = ${inputOf(node, 'OPERAND2')}>`;
    case 'operator_gt': return `<${inputOf(node, 'OPERAND1')} > ${inputOf(node, 'OPERAND2')}>`;
    case 'operator_and': return `<${inputOf(node, 'OPERAND1')} and ${inputOf(node, 'OPERAND2')}>`;
    case 'operator_or': return `<${inputOf(node, 'OPERAND1')} or ${inputOf(node, 'OPERAND2')}>`;
    case 'operator_not': return `<not ${booleanInputOf(node, 'OPERAND')}>`;
    case 'operator_join': return `(join ${inputOf(node, 'STRING1', 'apple')} ${inputOf(node, 'STRING2', 'banana')})`;
    case 'operator_letter_of': return `(letter ${inputOf(node, 'LETTER', '1')} of ${inputOf(node, 'STRING', 'apple')})`;
    case 'operator_length': return `(length of ${inputOf(node, 'STRING', 'apple')})`;
    case 'operator_contains': {
        const text = inputOf(node, 'STRING1', 'apple');
        return `<${text} contains ${inputOf(node, 'STRING2', 'a')}?>`;
    }
    case 'operator_mod': return `(${inputOf(node, 'NUM1')} mod ${inputOf(node, 'NUM2')})`;
    case 'operator_round': return `(round ${inputOf(node, 'NUM')})`;
    case 'operator_mathop': return `(${menuOf(node, 'OPERATOR')} of ${inputOf(node, 'NUM', '9')})`;
    case 'data_setvariableto': return `set ${refOf(node, 'VARIABLE', 'my variable')} to ${inputOf(node, 'VALUE')}`;
    case 'data_changevariableby': {
        const variable = refOf(node, 'VARIABLE', 'my variable');
        return `change ${variable} by ${inputOf(node, 'VALUE', '1')}`;
    }
    case 'data_showvariable': return `show variable ${refOf(node, 'VARIABLE', 'my variable')}`;
    case 'data_hidevariable': return `hide variable ${refOf(node, 'VARIABLE', 'my variable')}`;
    case 'data_variable': return `(${escapeText(referenceNameOf(node, 'VARIABLE', 'my variable'))})`;
    case 'data_addtolist': return `add ${inputOf(node, 'ITEM', 'thing')} to ${refOf(node, 'LIST', 'list')}`;
    case 'data_deleteoflist': return `delete ${inputOf(node, 'INDEX', '1')} of ${refOf(node, 'LIST', 'list')}`;
    case 'data_deletealloflist': return `delete all of ${refOf(node, 'LIST', 'list')}`;
    case 'data_insertatlist': {
        const item = inputOf(node, 'ITEM', 'thing');
        return `insert ${item} at ${inputOf(node, 'INDEX', '1')} of ${refOf(node, 'LIST', 'list')}`;
    }
    case 'data_replaceitemoflist': {
        const index = inputOf(node, 'INDEX', '1');
        const list = refOf(node, 'LIST', 'list');
        return `replace item ${index} of ${list} with ${inputOf(node, 'ITEM', 'thing')}`;
    }
    case 'data_itemoflist': return `(item ${inputOf(node, 'INDEX', '1')} of ${refOf(node, 'LIST', 'list')})`;
    case 'data_itemnumoflist': return `(item # of ${inputOf(node, 'ITEM', 'thing')} in ${refOf(node, 'LIST', 'list')})`;
    case 'data_lengthoflist': return `(length of ${refOf(node, 'LIST', 'list')})`;
    case 'data_listcontainsitem': return `<${refOf(node, 'LIST', 'list')} contains ${inputOf(node, 'ITEM', 'thing')}?>`;
    case 'data_listcontents': return `(${escapeText(referenceNameOf(node, 'LIST', 'list'))})`;
    case 'pen_clear': return 'erase all';
    case 'pen_stamp': return 'stamp';
    case 'pen_penUp': return 'pen up';
    case 'pen_penDown': return 'pen down';
    case 'pen_setPenSizeTo': return `set pen size to ${inputOf(node, 'SIZE', '1')}`;
    case 'pen_changePenSizeBy': return `change pen size by ${inputOf(node, 'SIZE', '1')}`;
    case 'pen_setPenColorToColor': return `set pen color to ${inputOf(node, 'COLOR', '#ff0000')}`;
    case 'pen_setPenShadeToNumber': return `set pen shade to ${inputOf(node, 'SHADE', '50')}`;
    case 'pen_changePenShadeBy': return `change pen shade by ${inputOf(node, 'SHADE', '10')}`;
    case 'pen_setPenHueToNumber': return `set pen color to ${inputOf(node, 'HUE', '50')}`;
    case 'pen_changePenHueBy': return `change pen color by ${inputOf(node, 'HUE', '10')}`;
    default: {
        const pretty = opcode.includes('_') ? opcode.slice(opcode.indexOf('_') + 1).replace(/_/g, ' ') : opcode;
        const inputs = (node.args || [])
            .filter(arg => arg.key && arg.value !== null && typeof arg.value !== 'undefined')
            .map(arg => translateValue(arg.value))
            .join(' ');
        const text = inputs ? `${pretty} ${inputs}` : pretty;
        const prefix = opcode.split('_')[0];
        return !CORE_OPCODE_PREFIXES.has(prefix) ? `${text} :: extension` : text;
    }
    }
};

const isHatOpcode = name =>
    typeof name === 'string' && (name.startsWith('event_') || name === 'control_start_as_clone');

const isHatCall = node => node?.type === 'call' && node.callee?.type === 'opcode' && isHatOpcode(node.callee.name);

const translateHat = node => {
    if (!node || node.type !== 'call' || node.callee?.type !== 'opcode') {
        if (node?.type === 'call' && node.callee?.type === 'procedureCall') return null;
        return null;
    }
    switch (node.callee.name) {
    case 'event_whenflagclicked': return 'when green flag clicked';
    case 'event_whenkeypressed': return `when ${menuOf(node, 'KEY_OPTION')} key pressed`;
    case 'event_whenthisspriteclicked': return 'when this sprite clicked';
    case 'event_whenstageclicked': return 'when stage clicked';
    case 'event_whenbroadcastreceived': return `when I receive ${refOf(node, 'BROADCAST_OPTION', 'message1')}`;
    case 'event_whenbackdropswitchesto':
        return `when backdrop switches to ${menuOf(node, 'BACKDROP')}`;
    case 'event_whengreaterthan': {
        const menu = translateMenuValue(argValue(node, 'WHENGREATERTHANMENU')).toLowerCase() || 'timer';
        return `when [${menu} v] > ${inputOf(node, 'VALUE', '10')}`;
    }
    case 'control_start_as_clone': return 'when I start as a clone';
    default: return null;
    }
};

const CONTROL_BLOCKS = new Set([
    'control_if', 'control_if_else', 'control_repeat', 'control_forever', 'control_repeat_until', 'control_while'
]);

const branchBodies = node => (node.args || []).filter(arg => Array.isArray(arg?.body));

const branchBody = (node, key) => {
    const bodies = branchBodies(node);
    if (typeof key === 'undefined') return bodies[0]?.body || [];
    return bodies.find(arg => String(arg.key || '').toLowerCase() === String(key).toLowerCase())?.body || [];
};

const translateStatements = (calls, indent, marks) => {
    const lines = [];
    const pad = '  '.repeat(indent);
    const markOf = node => {
        if (marks?.added?.has(node)) return '+';
        if (marks?.removed?.has(node)) return '-';
        return '';
    };
    for (const node of calls || []) {
        if (!node || typeof node !== 'object') continue;
        if (node.type === 'procDef' || node.type === 'whenScript' || node.type === 'chainScript') continue;
        if (node.type !== 'call' || !node.callee) continue;
        const mark = markOf(node);
        const prefix = mark ? `${mark} ` : '';
        if (node.callee.type === 'opcode' && CONTROL_BLOCKS.has(node.callee.name)) {
            const cond = node.callee.name === 'control_repeat' ?
                `repeat ${inputOf(node, 'TIMES', '10')}` :
                node.callee.name === 'control_forever' ? 'forever' :
                    node.callee.name === 'control_repeat_until' ?
                        // eslint-disable-next-line no-use-before-define
                        `repeat until ${conditionOf(node, 'CONDITION')}` :
                        node.callee.name === 'control_while' ?
                            // eslint-disable-next-line no-use-before-define
                            `while ${conditionOf(node, 'CONDITION')}` :
                            // eslint-disable-next-line no-use-before-define
                            `if ${conditionOf(node, 'CONDITION')} then`;
            lines.push(`${prefix}${pad}${cond}`);
            lines.push(...translateStatements(branchBodies(node)[0]?.body || [], indent + 1, marks));
            const elseBody = branchBody(node, 'else');
            if (elseBody.length) {
                lines.push(`${pad}else`);
                lines.push(...translateStatements(elseBody, indent + 1, marks));
            }
            lines.push(`${pad}end`);
            continue;
        }
        const text = translateCall(node);
        if (text) lines.push(`${prefix}${pad}${text}`);
    }
    return lines;
};

const conditionOf = (node, key) => {
    const rawValue = argValue(node, key);
    const value = unwrapCall(rawValue);
    if (!value || value.type === 'null') return '<>';
    const text = translateValue(rawValue);
    return text.startsWith('<') && text.endsWith('>') ? text : `<${text}>`;
};

export const translateScript = (script, marks = null) => {
    const lines = [];
    const calls = script?.calls || [];
    const head = calls.find(node => node?.type === 'procDef') ||
        calls.find(isHatCall) ||
        null;
    if (head?.type === 'procDef') {
        const name = head.proccode || head.ident || 'custom block';
        const params = (head.params || []).map(param => `(${param.name || param.ident || 'arg'})`).join(' ');
        lines.push(`define ${name}${params ? ` ${params}` : ''}`);
        lines.push(...translateStatements(head.body || [], 0, marks));
    } else {
        const hat = head ? translateHat(head) : null;
        if (hat) lines.push(hat);
        else if (head?.type === 'call' && head.callee?.type === 'procedureCall') {
            lines.push(String(head.callee.name).replace(/_/g, ' '));
        }
        const body = head ? calls.slice(calls.indexOf(head) + 1) : calls;
        lines.push(...translateStatements(body, 0, marks));
    }
    return lines.filter(line => line.trim()).join('\n');
};

const stripLines = value => {
    if (Array.isArray(value)) return value.map(stripLines);
    if (value && typeof value === 'object') {
        const out = {};
        for (const [key, entry] of Object.entries(value)) {
            if (key === 'line') continue;
            out[key] = stripLines(entry);
        }
        return out;
    }
    return value;
};

const stripBranches = value => {
    if (Array.isArray(value)) return value.map(stripBranches);
    if (value && typeof value === 'object') {
        const out = {};
        for (const [key, entry] of Object.entries(value)) {
            if (key === 'line' || key === 'body') continue;
            out[key] = stripBranches(entry);
        }
        return out;
    }
    return value;
};

const flattenScriptCalls = calls => {
    const items = [];
    const visit = (nodes, ancestors) => {
        for (const node of nodes || []) {
            if (!node || typeof node !== 'object') continue;
            if (node.type === 'call' && opcodeOf(node)) {
                items.push({node, ancestors: [...ancestors]});
            }
            for (const arg of node.args || []) {
                if (arg?.body) visit(arg.body, [...ancestors, node]);
                else if (arg?.value) visit([arg.value], ancestors);
            }
            if (node.body) visit(node.body, [...ancestors, node]);
        }
    };
    visit(calls.filter(node => node?.type === 'call'), []);
    return items;
};

const scriptSignature = script => JSON.stringify(stripLines(
    (script.calls || []).filter(node => node?.type === 'call')
));

export const matchScripts = (beforeParse, afterParse) => {
    const keyOf = script => {
        const head = (script.calls || [])[0];
        if (script.kind === 'def') return `def:${head?.ident || head?.proccode || ''}`;
        if (isHatCall(head)) {
            const fields = (head.args || [])
                .filter(arg => arg.kind === 'keyed' && arg.sep === 'field')
                .map(arg => `${arg.key}=${JSON.stringify(arg.value?.name ?? arg.value?.value ?? '')}`);
            return `hat:${head.callee.name}:${fields.join(',')}`;
        }
        return `stack:${flattenScriptCalls(script.calls).map(item => opcodeOf(item.node)).sort().join('|')}`;
    };
    const keyed = scripts => {
        const counts = new Map();
        return (scripts || []).map(script => {
            const base = keyOf(script);
            if (!base) return null;
            const seen = counts.get(base) || 0;
            counts.set(base, seen + 1);
            return {script, key: seen ? `${base}#${seen}` : base};
        }).filter(Boolean);
    };
    const oldByKey = new Map(keyed(beforeParse?.scripts).map(entry => [entry.key, entry.script]));
    const newByKey = new Map(keyed(afterParse?.scripts).map(entry => [entry.key, entry.script]));
    const matches = [];
    for (const [key, afterScript] of newByKey) {
        const beforeScript = oldByKey.get(key);
        if (!beforeScript) {
            matches.push({key, before: null, after: afterScript, changed: true});
            continue;
        }
        const changed = scriptSignature(beforeScript) !== scriptSignature(afterScript);
        matches.push({key, before: beforeScript, after: afterScript, changed});
    }
    for (const [key, beforeScript] of oldByKey) {
        if (!newByKey.has(key)) matches.push({key, before: beforeScript, after: null, changed: true});
    }
    return matches;
};

export const diffScriptCalls = (beforeScript, afterScript) => {
    const countBy = list => {
        const counts = new Map();
        for (const item of list) {
            const sig = JSON.stringify(stripBranches(item.node));
            counts.set(sig, (counts.get(sig) || 0) + 1);
        }
        return counts;
    };
    const mark = (items, counts, reported) => {
        const seen = new Map();
        for (const item of items) {
            const sig = JSON.stringify(stripBranches(item.node));
            seen.set(sig, (seen.get(sig) || 0) + 1);
            if (seen.get(sig) > (counts.get(sig) || 0) &&
                !item.ancestors.some(parent => reported.has(parent))) {
                reported.add(item.node);
            }
        }
    };
    const added = new Set();
    const removed = new Set();
    if (beforeScript && afterScript) {
        const oldFlat = flattenScriptCalls(beforeScript.calls);
        const newFlat = flattenScriptCalls(afterScript.calls);
        mark(newFlat, countBy(oldFlat), added);
        mark(oldFlat, countBy(newFlat), removed);
    } else {
        const flat = flattenScriptCalls((beforeScript || afterScript).calls);
        for (const item of flat) (beforeScript ? removed : added).add(item.node);
    }
    return {added, removed};
};

const markDiffLine = (line, marker) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'end' || trimmed === 'else') return line;
    return `${marker} ${line}`;
};

export const mergeScriptDiff = (beforeText, afterText) => {
    const before = beforeText ? beforeText.split('\n') : [];
    const after = afterText ? afterText.split('\n') : [];
    const lengths = Array.from({length: before.length + 1}, () => new Uint16Array(after.length + 1));
    for (let oldIndex = before.length - 1; oldIndex >= 0; oldIndex--) {
        for (let newIndex = after.length - 1; newIndex >= 0; newIndex--) {
            lengths[oldIndex][newIndex] = before[oldIndex] === after[newIndex] ?
                lengths[oldIndex + 1][newIndex + 1] + 1 :
                Math.max(lengths[oldIndex + 1][newIndex], lengths[oldIndex][newIndex + 1]);
        }
    }
    const lines = [];
    let oldIndex = 0;
    let newIndex = 0;
    while (oldIndex < before.length || newIndex < after.length) {
        if (oldIndex < before.length && newIndex < after.length && before[oldIndex] === after[newIndex]) {
            lines.push(before[oldIndex]);
            oldIndex++;
            newIndex++;
        } else if (oldIndex < before.length && (
            newIndex >= after.length || lengths[oldIndex + 1][newIndex] >= lengths[oldIndex][newIndex + 1]
        )) {
            lines.push(markDiffLine(before[oldIndex], '-'));
            oldIndex++;
        } else {
            lines.push(markDiffLine(after[newIndex], '+'));
            newIndex++;
        }
    }
    return lines.join('\n');
};

const lineContent = line => line.replace(/^[+-]\s/, '');

const isControlLine = line => /^(?:forever|repeat\b|repeat until\b|while\b|if\b)/.test(lineContent(line).trim());

const omissionLine = omittedLines => {
    const indents = omittedLines
        .map(line => lineContent(line))
        .filter(line => line.trim() && line.trim() !== 'end' && line.trim() !== 'else')
        .map(line => line.match(/^\s*/)[0].length);
    const indent = indents.length ? Math.min(...indents) : 0;
    return `${' '.repeat(indent)}. . .`;
};

export const compactScriptDiff = source => {
    const lines = source.split('\n');
    const changed = lines.map((line, index) => (/^[+-]\s/.test(line) ? index : -1)).filter(index => index >= 0);
    if (!changed.length) return source;
    const include = new Set([0, ...changed]);
    const ancestors = [];
    const stack = [];
    const endByControl = new Map();
    const controlByEnd = new Map();
    for (let index = 0; index < lines.length; index++) {
        const trimmed = lineContent(lines[index]).trim();
        if (trimmed === 'end') {
            const control = stack.pop();
            if (typeof control === 'number') {
                endByControl.set(control, index);
                controlByEnd.set(index, control);
            }
            ancestors[index] = [...stack];
            continue;
        }
        ancestors[index] = [...stack];
        if (isControlLine(lines[index])) stack.push(index);
    }
    const contextRadius = 2;
    for (const index of changed) {
        for (let nearby = Math.max(0, index - contextRadius);
            nearby <= Math.min(lines.length - 1, index + contextRadius); nearby++) {
            include.add(nearby);
        }
    }
    for (const index of [...include]) {
        if (controlByEnd.has(index)) include.add(controlByEnd.get(index));
    }
    for (const index of [...include]) {
        for (const ancestor of ancestors[index] || []) include.add(ancestor);
        if (isControlLine(lines[index]) && endByControl.has(index)) include.add(endByControl.get(index));
    }
    for (const index of [...include]) {
        if (isControlLine(lines[index]) && endByControl.has(index)) include.add(endByControl.get(index));
    }
    const compacted = [];
    let omitted = [];
    for (let index = 0; index < lines.length; index++) {
        if (!include.has(index)) {
            omitted.push(lines[index]);
            continue;
        }
        if (omitted.length) {
            compacted.push(omissionLine(omitted));
            omitted = [];
        }
        compacted.push(lines[index]);
    }
    if (omitted.length) compacted.push(omissionLine(omitted));
    return compacted.join('\n');
};

export const changedScripts = (beforeText, afterText) => {
    let before;
    let after;
    try {
        before = parseFractch(beforeText || '');
        after = parseFractch(afterText || '');
    } catch (error) {
        return [];
    }
    const out = [];
    for (const match of matchScripts(before, after)) {
        if (!match.changed) continue;
        const {added, removed} = diffScriptCalls(match.before, match.after);
        const beforeSource = match.before ? translateScript(match.before) : '';
        const afterSource = match.after ? translateScript(match.after) : '';
        out.push({
            key: match.key,
            // eslint-disable-next-line no-use-before-define
            desc: describeScriptHead(match.after || match.before),
            before: match.before ? translateScript(match.before, {added: new Set(), removed}) : null,
            after: match.after ? translateScript(match.after, {added, removed: new Set()}) : null,
            diff: compactScriptDiff(mergeScriptDiff(beforeSource, afterSource))
        });
    }
    return out;
};

const describeScriptHead = script => {
    const calls = script?.calls || [];
    const hat = calls.find(isHatCall);
    if (hat) {
        const text = translateHat(hat);
        if (text) return text;
    }
    const def = calls.find(node => node?.type === 'procDef');
    if (def) return `Define "${def.proccode || def.ident || 'custom block'}"`;
    const first = calls.find(node => node?.type === 'call');
    if (first) {
        const text = translateCall(first);
        if (text) return text.length > 60 ? `${text.slice(0, 60)}…` : text;
    }
    return 'Script';
};
