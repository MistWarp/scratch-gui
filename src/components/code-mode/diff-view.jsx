/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {GitCompare, X} from 'lucide-react';

import styles from './workbench.css';

const MAX_CELLS = 4000000;

const lineDiff = (before, after) => {
    const a = String(before || '').split('\n');
    const b = String(after || '').split('\n');
    if (a.length * b.length > MAX_CELLS) {
        return a.map(text => ({type: 'removed', text})).concat(b.map(text => ({type: 'added', text})));
    }
    const table = Array.from({length: a.length + 1}, () => new Uint32Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
        }
    }
    const rows = [];
    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] === b[j]) {
            rows.push({type: 'same', text: a[i]});
            i++;
            j++;
        } else if (j < b.length && (i === a.length || table[i][j + 1] >= table[i + 1][j])) {
            rows.push({type: 'added', text: b[j]});
            j++;
        } else {
            rows.push({type: 'removed', text: a[i]});
            i++;
        }
    }
    return rows;
};

const DiffView = ({beforeLabel, afterLabel, onClose, sections, title, closeLabel}) => (
    <div
        className={styles.diffView}
        role="region"
        aria-label={title}
    >
        <div className={styles.diffHeader}>
            <GitCompare size={14} />
            <h3 className={styles.diffTitle}>{title}</h3>
            <span className={styles.diffLegend}>
                <span className={styles.diffLegendRemoved}>{beforeLabel}</span>
                <span className={styles.diffLegendAdded}>{afterLabel}</span>
            </span>
            {onClose ? (
                <button
                    aria-label={closeLabel}
                    className={styles.iconButton}
                    title={closeLabel}
                    type="button"
                    onClick={onClose}
                >
                    <X size={14} />
                </button>
            ) : null}
        </div>
        <div className={styles.diffBody}>
            {sections.map(section => (
                <section
                    className={styles.diffSection}
                    key={section.key}
                >
                    {section.label ? <div className={styles.diffSectionLabel}>{section.label}</div> : null}
                    <pre className={styles.diffLines}>
                        {lineDiff(section.before, section.after).map((row, index) => (
                            <div
                                className={classNames(styles.diffLine, {
                                    [styles.diffAdded]: row.type === 'added',
                                    [styles.diffRemoved]: row.type === 'removed'
                                })}
                                key={index}
                            >
                                <span className={styles.diffMark}>
                                    {row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' '}
                                </span>
                                {row.text}
                            </div>
                        ))}
                    </pre>
                    {section.actions && section.actions.length ? (
                        <div className={styles.diffActions}>
                            {section.actions.map(action => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        className={action.primary ? styles.primaryButton : styles.secondaryButton}
                                        key={action.label}
                                        type="button"
                                        onClick={() => action.onClick()}
                                    >
                                        {Icon ? <Icon size={14} /> : null}
                                        <span>{action.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </section>
            ))}
        </div>
    </div>
);

DiffView.propTypes = {
    afterLabel: PropTypes.string.isRequired,
    beforeLabel: PropTypes.string.isRequired,
    closeLabel: PropTypes.string,
    sections: PropTypes.arrayOf(PropTypes.shape({
        actions: PropTypes.arrayOf(PropTypes.shape({
            icon: PropTypes.elementType,
            label: PropTypes.string.isRequired,
            onClick: PropTypes.func.isRequired,
            primary: PropTypes.bool
        })),
        after: PropTypes.string,
        before: PropTypes.string,
        key: PropTypes.string.isRequired,
        label: PropTypes.string
    })).isRequired,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func
};

export {lineDiff};
export default DiffView;
