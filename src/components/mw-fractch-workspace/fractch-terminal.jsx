import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';

import '@xterm/xterm/css/xterm.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '!!style-loader!css-loader!./code-font.css';

import {runBrowserCommand, setShellUser} from '../../lib/git/browser-terminal';

const TERMINAL_FONT_FAMILY = '"JetBrains Mono"';
const CODE_FONT = `${TERMINAL_FONT_FAMILY}, ui-monospace, Menlo, Consolas, monospace`;

const errorMessage = error => (error && error.message ? error.message : String(error));

const resolveCssColor = (value, fallback) => {
    const context = document.createElement('canvas').getContext('2d');
    context.fillStyle = fallback;
    context.fillStyle = value.trim() || fallback;
    return context.fillStyle;
};

const terminalTheme = () => {
    const computed = getComputedStyle(document.documentElement);
    const background = resolveCssColor(computed.getPropertyValue('--ui-white'), '#ffffff');
    const foreground = resolveCssColor(computed.getPropertyValue('--text-primary'), '#575e75');
    return {
        background,
        cursor: foreground,
        cursorAccent: background,
        foreground,
        selectionBackground: resolveCssColor(computed.getPropertyValue('--ui-black-transparent'), '#00000026')
    };
};

const FractchTerminal = ({className, onWorktreeChanged, style, themeId, vm}) => {
    const element = useRef(null);
    const terminal = useRef(null);
    const commandBusy = useRef(false);
    const commandLine = useRef('');
    const commandHistory = useRef([]);
    const commandHistoryIndex = useRef(0);
    const worktreeChanged = useRef(onWorktreeChanged);
    worktreeChanged.current = onWorktreeChanged;

    useEffect(() => {
        if (vm) setShellUser({local: vm.runtime.ioDevices.userData.getUsername()});
    }, [vm]);

    useEffect(() => {
        let disposed = false;
        let dispose = null;

        const start = () => {
            if (disposed || !element.current) return;
            const xterm = new Terminal({
                convertEol: true,
                cursorBlink: true,
                fontFamily: CODE_FONT,
                fontSize: 12,
                lineHeight: 1,
                theme: terminalTheme()
            });
            const fit = new FitAddon();
            xterm.loadAddon(fit);
            xterm.open(element.current);
            terminal.current = xterm;

            const prompt = () => xterm.write('\x1b[36m/repo\x1b[0m $ ');
            const replaceCommandLine = value => {
                while (commandLine.current.length) {
                    xterm.write('\b \b');
                    commandLine.current = commandLine.current.slice(0, -1);
                }
                commandLine.current = value;
                xterm.write(value);
            };
            const execute = async () => {
                const command = commandLine.current.trim();
                commandLine.current = '';
                xterm.write('\r\n');
                if (!command) {
                    prompt();
                    return;
                }
                commandHistory.current.push(command);
                commandHistoryIndex.current = commandHistory.current.length;
                commandBusy.current = true;
                try {
                    const result = await runBrowserCommand(command);
                    if (result.stdout) xterm.write(result.stdout);
                    if (result.stderr) xterm.write(`\x1b[31m${result.stderr}\x1b[0m`);
                    if (result.worktreeChanged && worktreeChanged.current) {
                        await worktreeChanged.current();
                    }
                } catch (e) {
                    xterm.write(`\x1b[31m${errorMessage(e)}\x1b[0m\r\n`);
                } finally {
                    commandBusy.current = false;
                    prompt();
                }
            };
            const inputListener = xterm.onData(data => {
                if (commandBusy.current) return;
                if (data === '\r') {
                    execute();
                } else if (data === '\u007f') {
                    if (commandLine.current) {
                        commandLine.current = commandLine.current.slice(0, -1);
                        xterm.write('\b \b');
                    }
                } else if (data === '\u0003') {
                    commandLine.current = '';
                    xterm.write('^C\r\n');
                    prompt();
                } else if (data === '\x1b[A') {
                    commandHistoryIndex.current = Math.max(0, commandHistoryIndex.current - 1);
                    replaceCommandLine(commandHistory.current[commandHistoryIndex.current] || '');
                } else if (data === '\x1b[B') {
                    commandHistoryIndex.current = Math.min(
                        commandHistory.current.length,
                        commandHistoryIndex.current + 1
                    );
                    replaceCommandLine(commandHistory.current[commandHistoryIndex.current] || '');
                } else if (!data.startsWith('\x1b') && data >= ' ') {
                    commandLine.current += data;
                    xterm.write(data);
                }
            });

            const resizeObserver = new ResizeObserver(entries => {
                const {height, width} = entries[0].contentRect;
                if (height > 0 && width > 0) fit.fit();
            });
            resizeObserver.observe(element.current);

            xterm.writeln('\x1b[1mMistWarp Fractch shell\x1b[0m - type help or git help');
            prompt();

            dispose = () => {
                resizeObserver.disconnect();
                inputListener.dispose();
                xterm.dispose();
                terminal.current = null;
            };
        };

        document.fonts.load(`12px ${TERMINAL_FONT_FAMILY}`).then(start, start);

        return () => {
            disposed = true;
            if (dispose) dispose();
        };
    }, []);

    useEffect(() => {
        if (terminal.current) terminal.current.options.theme = terminalTheme();
    }, [themeId]);

    return (
        <div
            className={className}
            ref={element}
            style={style}
        />
    );
};

FractchTerminal.propTypes = {
    className: PropTypes.string,
    onWorktreeChanged: PropTypes.func,
    style: PropTypes.object,
    themeId: PropTypes.number,
    vm: PropTypes.shape({
        runtime: PropTypes.object
    })
};

export {CODE_FONT, TERMINAL_FONT_FAMILY, terminalTheme};
export default FractchTerminal;
