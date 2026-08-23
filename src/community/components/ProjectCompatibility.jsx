import React from 'react';
import {Smartphone, Keyboard, Gamepad2} from 'lucide-react';
import styles from './ProjectCompatibility.module.css';

export const CONTROL_TYPES = [
    {key: 'mobile', label: 'Touch', detail: 'Works on phones and tablets', Icon: Smartphone},
    {key: 'keyboard', label: 'Keyboard', detail: 'Uses keyboard controls', Icon: Keyboard},
    {key: 'controller', label: 'Gamepad', detail: 'Supports a game controller', Icon: Gamepad2}
];

const supportedControls = compatibility => CONTROL_TYPES.filter(control => compatibility && compatibility[control.key]);

const ProjectCompatibility = ({compatibility, compact = false}) => {
    const controls = supportedControls(compatibility);
    if (!controls.length) return null;

    if (compact) {
        return (
            <div className={styles.compact} aria-label="Supported controls">
                {controls.map(({key, label, detail, Icon}) => (
                    <span key={key} className={styles.compactIcon} title={`${label}: ${detail}`}>
                        <Icon size={16} />
                        <span className={styles.screenReaderOnly}>{label}</span>
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {controls.map(({key, label, detail, Icon}) => (
                <div key={key} className={styles.card}>
                    <Icon size={20} />
                    <span><strong>{label}</strong><small>{detail}</small></span>
                </div>
            ))}
        </div>
    );
};

export default ProjectCompatibility;
