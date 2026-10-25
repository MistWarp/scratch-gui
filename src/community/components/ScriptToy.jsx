import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Flag} from 'lucide-react';
import fog from '../../lib/default-project/fog.svg';
import {useCommunityIntl} from '../i18n.jsx';
import styles from './ScriptToy.module.css';

const NOTCH = 'c 2,0 3,1 4,2 l 4,4 c 1,1 2,2 4,2 h 12 c 2,0 3,-1 4,-2 l 4,-4 c 1,-1 2,-2 4,-2';
const TAB = 'c -2,0 -3,1 -4,2 l -4,4 c -1,1 -2,2 -4,2 h -12 c -2,0 -3,-1 -4,-2 l -4,-4 c -1,-1 -2,-2 -4,-2';

const bottom = (x, y, width) => [
    `H ${x + width - 4} a 4,4 0 0 1 4,4 V ${y - 4} a 4,4 0 0 1 -4,4`,
    `H ${x + 48} ${TAB} H ${x + 4} a 4,4 0 0 1 -4,-4`
].join(' ');

const stackPath = (x, y, width, height) => (
    `M ${x} ${y + 4} a 4,4 0 0 1 4,-4 H ${x + 12} ${NOTCH} ${bottom(x, y + height, width)} Z`
);

const hatPath = (x, y, width, height) => (
    `M ${x} ${y + 20} c 25,-22 71,-22 96,0 ${bottom(x, y + 20 + height, width)} Z`
);

const cPath = (x, y, width, inner) => {
    const innerTop = y + 48;
    const innerBottom = innerTop + inner;
    return [
        `M ${x} ${y + 4} a 4,4 0 0 1 4,-4 H ${x + 12} ${NOTCH}`,
        `H ${x + width - 4} a 4,4 0 0 1 4,4 V ${innerTop - 4} a 4,4 0 0 1 -4,4`,
        `H ${x + 64} ${TAB} H ${x + 20} a 4,4 0 0 0 -4,4 V ${innerBottom - 4} a 4,4 0 0 0 4,4`,
        `H ${x + 28} ${NOTCH}`,
        `${bottom(x, innerBottom + 32, width)} Z`
    ].join(' ');
};

const Label = ({x, y, width}) => (
    <rect
        className={styles.label}
        x={x}
        y={y}
        width={width}
        height={8}
        rx={4}
    />
);

Label.propTypes = {
    width: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number
};

const Input = ({x, y}) => (
    <g>
        <rect
            className={styles.input}
            x={x}
            y={y}
            width={36}
            height={24}
            rx={12}
        />
        <rect
            className={styles.inputValue}
            x={x + 11}
            y={y + 9}
            width={14}
            height={6}
            rx={3}
        />
    </g>
);

Input.propTypes = {
    x: PropTypes.number,
    y: PropTypes.number
};

const Block = ({children, d, step, tone}) => (
    <g
        className={styles.block}
        style={{'--tone': tone, '--step': step}}
    >
        <path d={d} />
        {children}
    </g>
);

Block.propTypes = {
    children: PropTypes.node,
    d: PropTypes.string,
    step: PropTypes.number,
    tone: PropTypes.string
};

const ScriptToy = ({className}) => {
    const {text} = useCommunityIntl();
    const [run, setRun] = useState(0);
    const [running, setRunning] = useState(false);
    useEffect(() => {
        if (!run) return () => {};
        setRunning(true);
        const timer = setTimeout(() => setRunning(false), 2200);
        return () => clearTimeout(timer);
    }, [run]);
    return (
        <button
            type="button"
            className={`${styles.toy} ${running ? styles.running : ''} ${className || ''}`}
            onClick={() => setRun(value => value + 1)}
        >
            <span
                key={run}
                className={styles.scene}
                aria-hidden="true"
            >
                <svg
                    className={styles.script}
                    viewBox="-4 -4 228 312"
                >
                    <Block
                        d={hatPath(0, 0, 176, 48)}
                        step={0}
                        tone="var(--block-events)"
                    >
                        <Label
                            x={12}
                            y={40}
                            width={40}
                        />
                        <Flag
                            x={60}
                            y={34}
                            size={20}
                            className={styles.flag}
                        />
                        <Label
                            x={90}
                            y={40}
                            width={44}
                        />
                    </Block>
                    <Block
                        d={stackPath(0, 68, 196, 48)}
                        step={1}
                        tone="var(--block-motion)"
                    >
                        <Label
                            x={12}
                            y={88}
                            width={36}
                        />
                        <Input
                            x={56}
                            y={80}
                        />
                        <Label
                            x={100}
                            y={88}
                            width={40}
                        />
                    </Block>
                    <Block
                        d={cPath(0, 116, 216, 96)}
                        step={2}
                        tone="var(--block-control)"
                    >
                        <Label
                            x={12}
                            y={136}
                            width={44}
                        />
                        <Input
                            x={64}
                            y={128}
                        />
                    </Block>
                    <Block
                        d={stackPath(16, 164, 184, 48)}
                        step={3}
                        tone="var(--block-looks)"
                    >
                        <Label
                            x={28}
                            y={184}
                            width={52}
                        />
                        <Input
                            x={88}
                            y={176}
                        />
                    </Block>
                    <Block
                        d={stackPath(16, 212, 168, 48)}
                        step={4}
                        tone="var(--block-sound)"
                    >
                        <Label
                            x={28}
                            y={232}
                            width={44}
                        />
                        <Label
                            x={80}
                            y={232}
                            width={56}
                        />
                    </Block>
                </svg>
                <img
                    className={styles.sprite}
                    src={fog}
                    alt=""
                    draggable={false}
                />
            </span>
            <span className={styles.hint}>{text('Click the script to run it.')}</span>
        </button>
    );
};

ScriptToy.propTypes = {
    className: PropTypes.string
};

export default ScriptToy;
