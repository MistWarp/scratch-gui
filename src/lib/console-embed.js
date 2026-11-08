const MENU_BUTTONS = [9, 16];

const isConsoleEmbed = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        return window.parent !== window && params.get('mw_console') === '1' && params.get('mw_bridge') === '1';
    } catch (e) {
        return false;
    }
};

const startConsoleEmbed = ({setPaused}) => {
    const send = action => window.parent.postMessage({type: 'mw:console', action}, '*');

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !event.repeat) send('menu');
    }, true);

    let held = false;
    let polling = false;
    const poll = () => {
        const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
        const down = pads.some(pad => pad.mapping === 'standard' &&
            MENU_BUTTONS.some(index => pad.buttons[index] && pad.buttons[index].pressed));
        if (down && !held) send('menu');
        held = down;
        if (pads.length) {
            requestAnimationFrame(poll);
        } else {
            polling = false;
        }
    };
    window.addEventListener('gamepadconnected', () => {
        if (polling) return;
        polling = true;
        requestAnimationFrame(poll);
    });

    window.addEventListener('message', event => {
        if (event.source !== window.parent) return;
        const data = event.data;
        if (!data || data.type !== 'mw:console') return;
        if (data.action === 'pause') setPaused(true);
        if (data.action === 'resume') setPaused(false);
    });
};

export {isConsoleEmbed, startConsoleEmbed};
