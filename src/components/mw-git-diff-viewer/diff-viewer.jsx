import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import styles from './diff-viewer.css';

const DiffHunk = ({hunk}) => (
    <div className={styles.hunk}>
        <div className={styles.hunkHeader}>
            {`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`}
        </div>
        {hunk.changes.map((change, i) => (
            <div
                key={i}
                className={
                    change.type === 'add' ? styles.lineAdd :
                        (change.type === 'remove' ? styles.lineRemove : styles.lineSame)
                }
            >
                <span className={styles.gutter}>
                    {change.type === 'add' ? '+' : (change.type === 'remove' ? '-' : ' ')}
                </span>
                <span className={styles.lineContent}>{change.content === '' ? ' ' : change.content}</span>
            </div>
        ))}
    </div>
);

DiffHunk.propTypes = {
    hunk: PropTypes.shape({
        oldStart: PropTypes.number,
        oldLines: PropTypes.number,
        newStart: PropTypes.number,
        newLines: PropTypes.number,
        changes: PropTypes.arrayOf(PropTypes.object)
    }).isRequired
};

const DiffViewer = ({diff, loading, filepath, emptyLabel}) => {
    if (loading) {
        return (
            <div className={styles.placeholder}>
                <FormattedMessage
                    defaultMessage="Computing diff…"
                    description="Shown while a diff is being computed"
                    id="mw.git.diff.computing"
                />
            </div>
        );
    }

    if (!diff) {
        return (
            <div className={styles.placeholder}>
                {emptyLabel || (
                    <FormattedMessage
                        defaultMessage="Select a file to view its changes."
                        description="Diff viewer empty state"
                        id="mw.git.diff.empty"
                    />
                )}
            </div>
        );
    }

    const hunks = Array.isArray(diff.hunks) ? diff.hunks : [];

    return (
        <div className={styles.viewer}>
            {filepath && (
                <div className={styles.fileHeader}>
                    <span className={styles.filePath}>{filepath}</span>
                    <span className={styles.stats}>
                        <span className={styles.additions}>{`+${diff.totalAdditions || 0}`}</span>
                        <span className={styles.deletions}>{`-${diff.totalDeletions || 0}`}</span>
                    </span>
                </div>
            )}
            {hunks.length === 0 ? (
                <div className={styles.placeholder}>
                    <FormattedMessage
                        defaultMessage="No changes in this file."
                        description="Shown when a file has no differences"
                        id="mw.git.diff.noChanges"
                    />
                </div>
            ) : (
                <div className={styles.code}>
                    {hunks.map((hunk, i) => (
                        <DiffHunk
                            key={i}
                            hunk={hunk}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

DiffViewer.propTypes = {
    diff: PropTypes.shape({
        hunks: PropTypes.array,
        totalAdditions: PropTypes.number,
        totalDeletions: PropTypes.number
    }),
    loading: PropTypes.bool,
    filepath: PropTypes.string,
    emptyLabel: PropTypes.node
};

export default DiffViewer;
