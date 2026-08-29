const SCRATCH_KEY_NAMES = {
    'right arrow': 'ArrowRight',
    'up arrow': 'ArrowUp',
    'left arrow': 'ArrowLeft',
    'down arrow': 'ArrowDown',
    'enter': 'Enter',
    'space': ' '
};

const KEY_CODES = {
    'ArrowLeft': 37,
    'ArrowUp': 38,
    'ArrowRight': 39,
    'ArrowDown': 40,
    'Backspace': 8,
    'Enter': 13,
    ' ': 32
};

const scratchKeyToKeyboardKey = key => {
    if (typeof key !== 'string') return '';
    return SCRATCH_KEY_NAMES[key] || key.toLowerCase().charAt(0);
};

const getProjectKeyboardKeys = vm => {
    const result = new Set();
    if (!vm || !vm.runtime) return result;

    const targets = [vm.runtime.getTargetForStage(), ...vm.runtime.targets]
        .filter(target => target && target.isOriginal && target.blocks);
    for (const target of targets) {
        const blocks = target.blocks._blocks || {};
        for (const block of Object.values(blocks)) {
            if (block.opcode !== 'event_whenkeypressed' && block.opcode !== 'sensing_keyoptions') continue;
            if (block.opcode === 'sensing_keyoptions' && !block.parent) continue;
            const field = block.fields && block.fields.KEY_OPTION;
            const key = scratchKeyToKeyboardKey(field && field.value);
            if (key) result.add(key);
        }
    }
    return result;
};

const getMobileGamepadKeys = vm => {
    const usedKeys = getProjectKeyboardKeys(vm);
    const usesWASD = (usedKeys.has('w') && usedKeys.has('s')) ||
        (usedKeys.has('a') && usedKeys.has('d'));
    const directions = usesWASD ? {
        up: 'w',
        down: 's',
        left: 'a',
        right: 'd'
    } : {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
    };

    const directionalKeys = new Set(Object.values(directions));
    const preferredActions = [' ', 'Enter', 'e', 'f', 'z', 'x', 'c'];
    const projectActions = [...usedKeys].filter(key =>
        !directionalKeys.has(key) && !['p', 'q', 'r'].includes(key)
    );
    const actions = [...new Set([
        ...preferredActions.filter(key => usedKeys.has(key)),
        ...projectActions,
        ' ',
        'Enter',
        'z',
        'x'
    ])].slice(0, 4);

    while (actions.length < 4) actions.push(actions[actions.length % Math.max(actions.length, 1)] || ' ');
    return {directions, actions};
};

const getKeyCode = key => {
    if (KEY_CODES[key]) return KEY_CODES[key];
    if (key.length === 1) return key.toUpperCase().charCodeAt(0);
    return 0;
};

const getCode = key => {
    if (key === ' ') return 'Space';
    if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
    if (/^[0-9]$/.test(key)) return `Digit${key}`;
    return key;
};

const dispatchMobileKeyboardEvent = (key, isDown) => {
    if (!key || typeof document === 'undefined') return;
    const keyCode = getKeyCode(key);
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
        key,
        code: getCode(key),
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
};

export {
    dispatchMobileKeyboardEvent,
    getMobileGamepadKeys,
    getProjectKeyboardKeys,
    scratchKeyToKeyboardKey
};
