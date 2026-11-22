import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import {GitMerge} from 'lucide-react';
import Button from './ui/Button.jsx';
import Notice from './ui/Notice.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import styles from './MergeConflicts.module.css';

const MergeConflicts = ({
    actions,
    binaryConflicts,
    busy,
    busyLabel,
    conflicts,
    error,
    focusOnMount,
    headingLevel,
    keepLabel,
    lead,
    onChoose,
    onSubmit,
    onTextChange,
    submitLabel,
    title,
    useLabel
}) => {
    const sectionRef = useRef(null);
    useEffect(() => {
        if (focusOnMount && sectionRef.current) sectionRef.current.focus();
    }, []);
    const submit = (
        <Button variant="primary" busy={busy} busyLabel={busyLabel} onClick={onSubmit}>
            <GitMerge size={16} />
            {submitLabel}
        </Button>
    );
    return (
        <section
            ref={sectionRef}
            className={styles.conflicts}
            tabIndex={focusOnMount ? -1 : null}
            aria-label={typeof title === 'string' ? title : null}
        >
            <SectionHeading
                as={headingLevel || 'h3'}
                icon={GitMerge}
                title={title}
                lead={lead}
            />
            {conflicts.map(file => (
                <label key={file.path}>
                    <span className={styles.path}>{file.path}</span>
                    <textarea
                        className="monospace"
                        spellCheck={false}
                        value={file.content}
                        disabled={busy}
                        onChange={event => onTextChange(file.path, event.target.value)}
                    />
                </label>
            ))}
            {binaryConflicts.map(file => (
                <div
                    className={styles.binaryConflict}
                    key={file.path}
                    role="group"
                    aria-label={file.path}
                >
                    <span className={styles.path}>{file.path}</span>
                    <button
                        type="button"
                        aria-pressed={file.choice === 'target'}
                        className={file.choice === 'target' ? styles.choiceActive : ''}
                        disabled={busy}
                        onClick={() => onChoose(file.path, 'target')}
                    >
                        {keepLabel}
                    </button>
                    <button
                        type="button"
                        aria-pressed={file.choice === 'source'}
                        className={file.choice === 'source' ? styles.choiceActive : ''}
                        disabled={busy}
                        onClick={() => onChoose(file.path, 'source')}
                    >
                        {useLabel}
                    </button>
                </div>
            ))}
            {error ? <Notice variant="error">{error}</Notice> : null}
            {actions ? (
                <div className={styles.actions}>
                    {submit}
                    {actions}
                </div>
            ) : submit}
        </section>
    );
};

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
    error: PropTypes.node,
    focusOnMount: PropTypes.bool,
    headingLevel: PropTypes.oneOf(['h2', 'h3']),
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
