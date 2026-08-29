import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Gamepad2, Keyboard} from 'lucide-react';
import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import {dispatchMobileKeyboardEvent, getMobileGamepadKeys} from '../../lib/mobile-keyboard.js';

import styles from './mobile-stage-controls.css';

const KEY_LABELS = {
    'ArrowLeft': '←',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowRight': '→',
    'Enter': 'Enter',
    ' ': 'Space'
};

const friendlyKey = key => KEY_LABELS[key] || key.toUpperCase();
const normalizeNativeKey = key => {
    if (key === 'Spacebar') return ' ';
    if (!key || key === 'Dead' || key === 'Process' || key === 'Unidentified') return '';
    return key.length === 1 ? key.toLowerCase() : key;
};

const MobileStageControls = ({vm}) => {
    const [mode, setMode] = useState('gamepad');
    const heldKeys = useRef(new Set());
    const nativeInput = useRef(null);
    const gamepadKeys = useMemo(() => getMobileGamepadKeys(vm), [vm]);

    const releaseAllKeys = useCallback(() => {
        for (const key of heldKeys.current) dispatchMobileKeyboardEvent(key, false);
        heldKeys.current.clear();
    }, []);

    useEffect(() => () => releaseAllKeys(), [releaseAllKeys]);
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) releaseAllKeys();
        };
        window.addEventListener('blur', releaseAllKeys);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('blur', releaseAllKeys);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [releaseAllKeys]);

    const selectGamepad = useCallback(() => {
        releaseAllKeys();
        setMode('gamepad');
    }, [releaseAllKeys]);
    const selectKeyboard = useCallback(() => {
        releaseAllKeys();
        setMode('keyboard');
    }, [releaseAllKeys]);

    useEffect(() => {
        if (mode === 'keyboard' && nativeInput.current) nativeInput.current.focus();
    }, [mode]);

    const handleKeyDown = useCallback(event => {
        event.preventDefault();
        event.currentTarget.classList.add(styles.pressed);
        event.currentTarget.setAttribute('aria-pressed', 'true');
        const key = event.currentTarget.dataset.key;
        if (!key || heldKeys.current.has(key)) return;
        if (typeof event.currentTarget.setPointerCapture === 'function') {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        heldKeys.current.add(key);
        dispatchMobileKeyboardEvent(key, true);
    }, []);
    const handleKeyUp = useCallback(event => {
        event.preventDefault();
        event.currentTarget.classList.remove(styles.pressed);
        event.currentTarget.setAttribute('aria-pressed', 'false');
        const key = event.currentTarget.dataset.key;
        if (!key || !heldKeys.current.has(key)) return;
        heldKeys.current.delete(key);
        dispatchMobileKeyboardEvent(key, false);
    }, []);
    const preventContextMenu = useCallback(event => event.preventDefault(), []);

    const handleNativeKeyDown = useCallback(event => {
        event.stopPropagation();
        const key = normalizeNativeKey(event.key);
        if (!key || heldKeys.current.has(key)) return;
        heldKeys.current.add(key);
        dispatchMobileKeyboardEvent(key, true);
    }, []);
    const handleNativeKeyUp = useCallback(event => {
        event.stopPropagation();
        const key = normalizeNativeKey(event.key);
        if (!key || !heldKeys.current.has(key)) return;
        heldKeys.current.delete(key);
        dispatchMobileKeyboardEvent(key, false);
    }, []);
    const handleNativeBeforeInput = useCallback(event => {
        const nativeEvent = event.nativeEvent;
        if (nativeEvent.inputType === 'deleteContentBackward') {
            dispatchMobileKeyboardEvent('Backspace', true);
            dispatchMobileKeyboardEvent('Backspace', false);
            return;
        }
        if (!nativeEvent.data) return;
        for (const character of nativeEvent.data) {
            const key = normalizeNativeKey(character);
            if (!key || heldKeys.current.has(key)) continue;
            dispatchMobileKeyboardEvent(key, true);
            dispatchMobileKeyboardEvent(key, false);
        }
    }, []);
    const clearNativeInput = useCallback(event => {
        event.currentTarget.value = '';
    }, []);

    const renderKey = useCallback((key, extraClassName) => (
        <button
            type="button"
            className={classNames(styles.key, extraClassName)}
            data-key={key}
            aria-label={friendlyKey(key)}
            aria-pressed={false}
            key={key}
            onContextMenu={preventContextMenu}
            onPointerDown={handleKeyDown}
            onPointerUp={handleKeyUp}
            onPointerCancel={handleKeyUp}
            onLostPointerCapture={handleKeyUp}
        >
            {friendlyKey(key)}
        </button>
    ), [handleKeyDown, handleKeyUp, preventContextMenu]);

    return (
        <Box className={styles.wrapper}>
            <Box
                className={styles.modeBar}
                role="tablist"
                aria-label="Stage controls"
            >
                <button
                    type="button"
                    className={classNames(styles.modeButton, {[styles.selected]: mode === 'gamepad'})}
                    role="tab"
                    aria-selected={mode === 'gamepad'}
                    onClick={selectGamepad}
                >
                    <Gamepad2 size={18} />
                    <span>{'Gamepad'}</span>
                </button>
                <button
                    type="button"
                    className={classNames(styles.modeButton, {[styles.selected]: mode === 'keyboard'})}
                    role="tab"
                    aria-selected={mode === 'keyboard'}
                    onClick={selectKeyboard}
                >
                    <Keyboard size={18} />
                    <span>{'Keyboard'}</span>
                </button>
            </Box>
            {mode === 'gamepad' ? (
                <Box
                    className={styles.gamepad}
                    aria-label="On-screen gamepad"
                >
                    <Box className={styles.dpad}>
                        {renderKey(gamepadKeys.directions.up, styles.dpadUp)}
                        {renderKey(gamepadKeys.directions.left, styles.dpadLeft)}
                        {renderKey(gamepadKeys.directions.right, styles.dpadRight)}
                        {renderKey(gamepadKeys.directions.down, styles.dpadDown)}
                    </Box>
                    <Box className={styles.actions}>
                        {gamepadKeys.actions.map((key, index) => (
                            <button
                                type="button"
                                className={classNames(styles.key, styles.actionKey)}
                                data-key={key}
                                aria-label={`Action ${index + 1}: ${friendlyKey(key)}`}
                                aria-pressed={false}
                                key={`${key}-${index}`}
                                onContextMenu={preventContextMenu}
                                onPointerDown={handleKeyDown}
                                onPointerUp={handleKeyUp}
                                onPointerCancel={handleKeyUp}
                                onLostPointerCapture={handleKeyUp}
                            >
                                <strong>{String.fromCharCode(65 + index)}</strong>
                                <small>{friendlyKey(key)}</small>
                            </button>
                        ))}
                    </Box>
                </Box>
            ) : null}
            {mode === 'keyboard' ? (
                <Box
                    className={styles.nativeKeyboard}
                    aria-label="Mobile keyboard input"
                >
                    <label
                        className={styles.nativeKeyboardLabel}
                        htmlFor="mobile-stage-keyboard-input"
                    >
                        {'Type with your phone keyboard'}
                    </label>
                    <input
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        className={styles.nativeKeyboardInput}
                        id="mobile-stage-keyboard-input"
                        inputMode="text"
                        placeholder="Tap to open keyboard"
                        ref={nativeInput}
                        spellCheck={false}
                        type="text"
                        onBeforeInput={handleNativeBeforeInput}
                        onBlur={releaseAllKeys}
                        onInput={clearNativeInput}
                        onKeyDown={handleNativeKeyDown}
                        onKeyUp={handleNativeKeyUp}
                    />
                    <Box className={styles.specialKeys}>
                        {renderKey('ArrowLeft')}
                        {renderKey('ArrowUp')}
                        {renderKey('ArrowDown')}
                        {renderKey('ArrowRight')}
                    </Box>
                </Box>
            ) : null}
        </Box>
    );
};

MobileStageControls.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default MobileStageControls;
