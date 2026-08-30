import React from 'react';
import styles from './DiffView.module.css';

const DIFF_HEADER = /^diff --(?:mwp|git) a\/(.+?) b\/(.+)$/;

const classifyLine = line => {
    if (line.startsWith('+') && !line.startsWith('+++')) return 'add';
    if (line.startsWith('-') && !line.startsWith('---')) return 'del';
    if (line.startsWith('@@')) return 'hunk';
    if (line.startsWith('index ') || line.startsWith('+++') || line.startsWith('---')) return 'meta';
    return 'ctx';
};

export const parseDiff = diff => {
    const files = [];
    let file = null;
    let oldLine = 0;
    let newLine = 0;
    for (const line of String(diff || '').split('\n')) {
        const header = line.match(DIFF_HEADER);
        if (header) {
            file = {
                path: header[2],
                oldPath: header[1],
                lines: [],
                additions: 0,
                deletions: 0,
                binary: false,
                status: 'Modified'
            };
            files.push(file);
            oldLine = 0;
            newLine = 0;
            continue;
        }
        if (!file) continue;
        if (line === 'Binary file changed' || line.startsWith('Binary files ')) {
            file.binary = true;
            continue;
        }
        if (line === '--- /dev/null') file.status = 'Added';
        if (line === '+++ /dev/null') file.status = 'Deleted';
        const type = classifyLine(line);
        if (type === 'hunk') {
            const range = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (range) {
                oldLine = Number(range[1]);
                newLine = Number(range[2]);
            }
        }
        if (type === 'add') file.additions++;
        if (type === 'del') file.deletions++;
        if (type !== 'meta') {
            const oldNumber = type === 'add' || type === 'hunk' ? null : oldLine++;
            const newNumber = type === 'del' || type === 'hunk' ? null : newLine++;
            file.lines.push({type, content: line, oldNumber, newNumber});
        }
    }
    return files;
};

const DiffLine = ({line}) => {
    if (line.type === 'hunk') {
        return <div className={styles.hunk}>{line.content}</div>;
    }
    const changed = line.type === 'add' || line.type === 'del';
    const marker = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';
    const content = changed ? line.content.slice(1) : line.content.replace(/^ /, '');
    return (
        <div className={styles[line.type]}>
            <span className={styles.lineNumber} aria-hidden="true">{line.oldNumber || ''}</span>
            <span className={styles.lineNumber} aria-hidden="true">{line.newNumber || ''}</span>
            <span className={styles.marker} aria-hidden="true">{marker}</span>
            <code>{content || ' '}</code>
        </div>
    );
};

export const OpenFileButton = ({file, onOpenFile}) => (
    onOpenFile && file.status !== 'Deleted' ? (
        <button
            type="button"
            className={styles.openFile}
            onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                onOpenFile(file.path);
            }}
        >Open file</button>
    ) : null
);

const FileSummary = ({file, onOpenFile}) => (
    <React.Fragment>
        <span className={styles.chevron} aria-hidden="true" />
        <span className={styles.path}>{file.path}</span>
        <span className={styles.status}>{file.status}</span>
        <OpenFileButton file={file} onOpenFile={onOpenFile} />
        <span className={styles.fileStats}>
            {file.additions ? <span className={styles.addCount}>+{file.additions}</span> : null}
            {file.deletions ? <span className={styles.delCount}>-{file.deletions}</span> : null}
        </span>
    </React.Fragment>
);

const DiffView = ({diff, selectedPath = '', onOpenFile = null}) => {
    if (diff === null || typeof diff === 'undefined') {
        return <p className={styles.empty}>Loading diff…</p>;
    }
    if (!diff || diff === 'No textual changes.') {
        return <p className={styles.empty}>No changes.</p>;
    }
    const files = parseDiff(diff);
    if (!files.length) {
        return <p className={styles.empty}>{diff}</p>;
    }
    const additions = files.reduce((total, file) => total + file.additions, 0);
    const deletions = files.reduce((total, file) => total + file.deletions, 0);
    const visibleFiles = selectedPath ? files.filter(file => file.path === selectedPath) : files;
    return (
        <div className={styles.diff}>
            <header className={styles.overview}>
                <strong>{files.length} {files.length === 1 ? 'file' : 'files'} changed</strong>
                <span>
                    {additions ? <span className={styles.addCount}>+{additions}</span> : null}
                    {deletions ? <span className={styles.delCount}>-{deletions}</span> : null}
                </span>
            </header>
            <div className={styles.files}>
                {visibleFiles.map((file, index) => (file.binary ? (
                    <section className={styles.binaryFile} key={`${file.path}-${index}`}>
                        <div className={styles.fileHeader}>
                            <span className={styles.binaryDot} aria-hidden="true" />
                            <span className={styles.path}>{file.path}</span>
                            <span className={styles.status}>Asset changed</span>
                            <OpenFileButton file={file} onOpenFile={onOpenFile} />
                        </div>
                    </section>
                ) : (
                    <details className={styles.file} key={`${file.path}-${index}`} open>
                        <summary className={styles.fileHeader}>
                            <FileSummary file={file} onOpenFile={onOpenFile} />
                        </summary>
                        <div className={styles.lines}>
                            {file.lines.length ? file.lines.map((line, lineIndex) => (
                                <DiffLine key={lineIndex} line={line} />
                            )) : <p className={styles.noLines}>No line changes to show.</p>}
                        </div>
                    </details>
                )))}
            </div>
        </div>
    );
};

export default DiffView;
