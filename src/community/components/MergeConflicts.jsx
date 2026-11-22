import PropTypes from 'prop-types';
import React from 'react';
import {GitMerge} from 'lucide-react';
import Button from './ui/Button.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import styles from './MergeConflicts.module.css';

const MergeConflicts = ({
    actions,
    binaryConflicts,
    busy,
    busyLabel,
    conflicts,
    keepLabel,
    lead,
    onChoose,
    onSubmit,
    onTextChange,
    submitLabel,
    title,
    useLabel
}) => (
    <section className={styles.conflicts}>
        <SectionHeading
            as="h3"
            icon={GitMerge}
            title={title}
            lead={lead}
        />
        {conflicts.map(file => (
            <label key={file.path}>
                <span>{file.path}</span>
                <textarea
                    value={file.content}
                    disabled={busy}
                    onChange={event => onTextChange(file.path, event.target.value)}
                />
            </label>
        ))}
        {binaryConflicts.map(file => (
            <div className={styles.binaryConflict} key={file.path}>
                <span>{file.path}</span>
                <button
                    type="button"
                    aria-pressed={file.choice === 'target'}
                    className={file.choice === 'target' ? styles.choiceActive : ''}
                    onClick={() => onChoose(file.path, 'target')}
                >
                    {keepLabel}
                </button>
                <button
                    type="button"
                    aria-pressed={file.choice === 'source'}
                    className={file.choice === 'source' ? styles.choiceActive : ''}
                    onClick={() => onChoose(file.path, 'source')}
                >
                    {useLabel}
                </button>
            </div>
        ))}
        <div className={styles.actions}>
            <Button variant="primary" busy={busy} busyLabel={busyLabel} onClick={onSubmit}>
                <GitMerge size={16} />
                {submitLabel}
            </Button>
            {actions}
        </div>
    </section>
);

MergeConflicts.propTypes = {
    actions: PropTypes.node,
    binaryConflicts: PropTypes.arrayOf(PropTypes.shape({
        path: PropTypes.string,
        choice: PropTypes.string
    })).isRequired,
    busy: PropTypes.bool,
    busyLabel: PropTypes.node,
    conflicts: PropTypes.arrayOf(PropTypes.shape({
        path: PropTypes.string,
        content: PropTypes.string
    })).isRequired,
    keepLabel: PropTypes.node.isRequired,
    lead: PropTypes.node,
    onChoose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onTextChange: PropTypes.func.isRequired,
    submitLabel: PropTypes.node.isRequired,
    title: PropTypes.node.isRequired,
    useLabel: PropTypes.node.isRequired
};

export default MergeConflicts;
