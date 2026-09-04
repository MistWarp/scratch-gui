import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Blocks, Eye, EyeOff, Image, Layers, Move, Puzzle, Variable, Volume2} from 'lucide-react';
import {classifyAssetFile, formatAssetSize} from '../asset-media.js';
import {cancelMovedAssets, filterCoveredDiffLines, isEmptySummary, summarizeFractchChange} from '../fractch-summary.js';
import {changedScripts} from '../scratchblocks-translate.js';
import {builtinExtensionMeta, resolveExtensionMetas} from '../extension-meta.js';
import BlocksCompare from './BlocksCompare.jsx';
import {groupFilesBySprite, spriteLabel, spriteOfPath} from './SpriteList.jsx';
import styles from './DiffView.module.css';

const DIFF_HEADER = /^diff --(?:mwp|git) a\/(.+?) b\/(.+)$/;

const CATEGORIES = [
    {key: 'code', label: 'Code'},
    {key: 'costumes', label: 'Costumes'},
    {key: 'sounds', label: 'Sounds'}
];

const MAX_BLOCK_SCRIPTS = 6;

const truncatedScriptsLabel = count => `And ${count} more changed script${count === 1 ? '' : 's'}.`;

const defaultTabForFiles = files => {
    for (const category of CATEGORIES) {
        if (files.some(file => classifyAssetFile(file.path) === category.key)) return category.key;
    }
    return 'code';
};

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

const FileSummary = ({file, additions, deletions, onOpenFile}) => (
    <React.Fragment>
        <span className={styles.chevron} aria-hidden="true" />
        <span className={styles.path}>{file.path}</span>
        <span className={styles.status}>{file.status}</span>
        <OpenFileButton file={file} onOpenFile={onOpenFile} />
        <span className={styles.fileStats}>
            {(additions ?? file.additions) ? (
                <span className={styles.addCount}>+{additions ?? file.additions}</span>
            ) : null}
            {(deletions ?? file.deletions) ? (
                <span className={styles.delCount}>-{deletions ?? file.deletions}</span>
            ) : null}
        </span>
    </React.Fragment>
);

const AssetPane = ({label, side, onRetry}) => {
    let body = null;
    if (side.status === 'loading') {
        body = <p className={styles.assetState}>Loading {label.toLowerCase()} version…</p>;
    } else if (side.status === 'error') {
        body = (
            <p className={styles.assetState}>
                {side.message || 'Could not load this preview.'}
                <button type="button" onClick={onRetry}>Try again</button>
            </p>
        );
    } else if (side.status === 'empty') {
        body = <p className={styles.assetState}>{side.message}</p>;
    } else if (side.mediaType.startsWith('image/')) {
        body = (
            <div className={styles.assetPreview}>
                <img src={side.url} alt={`${label} version preview`} />
            </div>
        );
    } else if (side.mediaType.startsWith('audio/')) {
        body = (
            <div className={styles.assetAudio}>
                <audio controls src={side.url}><track kind="captions" /></audio>
            </div>
        );
    } else if (side.mediaType.startsWith('video/')) {
        body = (
            <div className={styles.assetPreview}>
                <video controls src={side.url}><track kind="captions" /></video>
            </div>
        );
    } else {
        body = <p className={styles.assetState}>Preview is not available for this file.</p>;
    }
    return (
        <div className={styles.assetPane}>
            <div className={styles.assetLabelRow}>
                <span className={styles.assetLabel}>{label}</span>
                {typeof side.size === 'number' ?
                    <span className={styles.assetSize}>{formatAssetSize(side.size)}</span> : null}
            </div>
            {body}
        </div>
    );
};

const SUMMARY_SECTIONS = [
    {key: 'variables', title: 'Variables', icon: Variable},
    {key: 'scripts', title: 'Scripts', icon: Layers},
    {key: 'assets', title: 'Costumes & sounds', icon: Blocks},
    {key: 'watchers', title: 'Watchers', icon: Eye},
    {key: 'extensions', title: 'Extensions', icon: Puzzle}
];

const summaryIconFor = item => {
    if (item.type === 'asset') return item.asset === 'sound' ? Volume2 : Image;
    if (item.type === 'sprite') return Move;
    if (item.type === 'watcher') return item.shown === false ? EyeOff : Eye;
    const section = SUMMARY_SECTIONS.find(entry => entry.key === `${item.type}s` || entry.key === item.type);
    return section ? section.icon : Blocks;
};

const SummaryRows = ({rows, extensionMetas}) => (
    <ul>
        {rows.map((item, index) => {
            const meta = item.type === 'extension' ? extensionMetas[item.id] : null;
            const RowIcon = summaryIconFor(item);
            const changeClass = item.change === 'added' ? styles.summaryAdd :
                item.change === 'removed' ? styles.summaryRemove : styles.summaryChange;
            const text = item.type === 'extension' ?
                `Extension "${meta?.name || item.id}" ${item.change === 'added' ? 'added' : 'removed'}` :
                item.text;
            return (
                <li key={index} className={changeClass}>
                    {meta?.iconUrl ? (
                        <img className={styles.summaryIcon} src={meta.iconUrl} alt="" draggable={false} />
                    ) : <RowIcon size={13} />}
                    <span>{text}</span>
                </li>
            );
        })}
    </ul>
);

const SummarySections = ({summary, assetsTitle, extensionMetas}) => (
    <div className={styles.summary}>
        {(summary.sprite || []).length ? <SummaryRows rows={summary.sprite} extensionMetas={extensionMetas} /> : null}
        {SUMMARY_SECTIONS.map(section => {
            const rows = summary[section.key] || [];
            if (!rows.length) return null;
            const Icon = section.icon;
            const title = section.key === 'assets' && assetsTitle ? assetsTitle : section.title;
            return (
                <section key={section.key}>
                    <header><Icon size={13} />{title}</header>
                    <SummaryRows rows={rows} extensionMetas={extensionMetas} />
                </section>
            );
        })}
    </div>
);

export const summaryForTab = (summary, tab) => {
    if (!summary) return null;
    if (tab === 'code') {
        const sub = {
            variables: summary.variables || [],
            sprite: summary.sprite || [],
            scripts: summary.scripts || [],
            assets: [],
            watchers: summary.watchers || [],
            extensions: summary.extensions || []
        };
        return isEmptySummary(sub) ? null : sub;
    }
    const kind = tab === 'sounds' ? 'sound' : 'costume';
    const rows = (summary.assets || []).filter(item => (item.asset || 'costume') === kind);
    if (!rows.length) return null;
    return {variables: [], sprite: [], scripts: [], assets: rows, watchers: [], extensions: []};
};

const sideForStatus = (side, status) => {
    if (side === 'old' && status === 'Added') return {status: 'empty', message: 'New in this commit.'};
    if (side === 'new' && status === 'Deleted') return {status: 'empty', message: 'Removed in this commit.'};
    return {status: 'loading'};
};

export const AssetCompare = ({file, loadAsset}) => {
    const [sides, setSides] = useState(() => ({
        old: sideForStatus('old', file.status),
        new: sideForStatus('new', file.status)
    }));
    const [attempt, setAttempt] = useState(0);
    const urlsRef = useRef([]);
    useEffect(() => () => {
        urlsRef.current.forEach(url => URL.revokeObjectURL(url));
        urlsRef.current = [];
    }, []);

    useEffect(() => {
        let active = true;
        urlsRef.current.forEach(url => URL.revokeObjectURL(url));
        urlsRef.current = [];
        setSides({
            old: sideForStatus('old', file.status),
            new: sideForStatus('new', file.status)
        });
        const pending = [];
        if (file.status !== 'Added') pending.push('old');
        if (file.status !== 'Deleted') pending.push('new');
        pending.forEach(side => {
            loadAsset(side, file.path).then(result => {
                if (!active) return;
                if (!result || !result.bytes || !result.bytes.length) {
                    setSides(current => ({
                        ...current,
                        [side]: {
                            status: 'empty',
                            message: side === 'old' ?
                                'No previous version found.' :
                                'No updated version found.'
                        }
                    }));
                    return;
                }
                const url = URL.createObjectURL(
                    new Blob([result.bytes], {type: result.mediaType || 'application/octet-stream'})
                );
                if (!active) {
                    URL.revokeObjectURL(url);
                    return;
                }
                urlsRef.current.push(url);
                setSides(current => ({
                    ...current,
                    [side]: {status: 'ready', url, mediaType: result.mediaType || '', size: result.bytes.length}
                }));
            }).catch(error => {
                if (active) {
                    setSides(current => ({
                        ...current,
                        [side]: {status: 'error', message: error.message || 'Could not load this preview.'}
                    }));
                }
            });
        });
        return () => {
            active = false;
        };
    }, [file.path, file.status, loadAsset, attempt]);

    const retry = () => setAttempt(value => value + 1);
    return (
        <div className={styles.assetCompare}>
            <AssetPane label="Before" side={sides.old} onRetry={retry} />
            <AssetPane label="After" side={sides.new} onRetry={retry} />
        </div>
    );
};

const useExtensionMetas = summaries => {
    const items = useMemo(() => {
        const seen = new Map();
        for (const summary of Object.values(summaries || {})) {
            for (const item of summary.extensions || []) {
                const key = `${item.id}\n${item.url || ''}`;
                if (!seen.has(key)) seen.set(key, item);
            }
        }
        return [...seen.values()];
    }, [summaries]);
    const [metas, setMetas] = useState(() => {
        const initial = {};
        for (const item of items) {
            const builtin = builtinExtensionMeta(item.id);
            if (builtin) initial[item.id] = builtin;
        }
        return initial;
    });
    const itemsKey = items.map(item => `${item.id}\n${item.url || ''}`).join('|');
    useEffect(() => {
        let active = true;
        resolveExtensionMetas(items).then(map => {
            if (active) setMetas(current => ({...current, ...map}));
        });
        return () => {
            active = false;
        };
    }, [itemsKey]);
    return metas;
};

const DiffView = ({diff, spriteFilter = '', onOpenFile = null, loadAsset = null, fileTexts = {}}) => {
    const files = useMemo(() => parseDiff(diff), [diff]);
    const [activeTab, setActiveTab] = useState(() => defaultTabForFiles(files));
    useEffect(() => {
        setActiveTab(defaultTabForFiles(parseDiff(diff)));
    }, [diff]);
    const spriteFiles = useMemo(() => (
        spriteFilter ? files.filter(file => spriteOfPath(file.path) === spriteFilter) : files
    ), [files, spriteFilter]);
    const {summaries, coveredFiles} = useMemo(() => {
        const map = {};
        const covered = new Set();
        for (const file of spriteFiles) {
            if (classifyAssetFile(file.path) !== 'code' || !/\.fractch$/i.test(file.path)) continue;
            const group = spriteOfPath(file.path);
            const texts = fileTexts[file.path];
            if (!texts) continue;
            const summary = summarizeFractchChange(texts.before, texts.after, {global: group === 'Stage'});
            if (isEmptySummary(summary)) continue;
            if (!map[group]) map[group] = summary;
            if (filterCoveredDiffLines(file.lines, summary).fullyCovered) covered.add(file.path);
        }
        cancelMovedAssets(map);
        return {summaries: map, coveredFiles: covered};
    }, [spriteFiles, fileTexts]);
    const extensionMetas = useExtensionMetas(summaries);
    const {blockScripts, blockDiffFiles} = useMemo(() => {
        const map = {};
        const paths = new Set();
        for (const file of spriteFiles) {
            if (!/\.fractch$/i.test(file.path)) continue;
            const group = spriteOfPath(file.path);
            const texts = fileTexts[file.path];
            if (!texts) continue;
            const scripts = changedScripts(texts.before, texts.after);
            if (scripts.length) {
                map[group] = [...(map[group] || []), ...scripts];
                paths.add(file.path);
            }
        }
        return {blockScripts: map, blockDiffFiles: paths};
    }, [spriteFiles, fileTexts]);

    if (diff === null || typeof diff === 'undefined') {
        return <p className={styles.empty}>Loading diff…</p>;
    }
    if (!diff || diff === 'No textual changes.') {
        return <p className={styles.empty}>No changes.</p>;
    }
    if (!files.length) {
        return <p className={styles.empty}>{diff}</p>;
    }
    const additions = spriteFiles.reduce((total, file) => total + file.additions, 0);
    const deletions = spriteFiles.reduce((total, file) => total + file.deletions, 0);
    const counts = {};
    for (const category of CATEGORIES) {
        counts[category.key] = spriteFiles.filter(file => classifyAssetFile(file.path) === category.key).length;
    }
    for (const summary of Object.values(summaries)) {
        for (const item of summary.assets || []) {
            const key = (item.asset || 'costume') === 'sound' ? 'sounds' : 'costumes';
            counts[key] += 1;
        }
    }
    const tabFiles = spriteFiles.filter(file => classifyAssetFile(file.path) === activeTab);
    const groups = useMemo(() => {
        const all = groupFilesBySprite(tabFiles);
        const names = new Set(all.map(group => group.name));
        for (const name of Object.keys(summaries)) {
            if (!names.has(name) && summaryForTab(summaries[name], activeTab)) {
                all.push({name, files: []});
                names.add(name);
            }
        }
        const tabSummary = group => summaryForTab(summaries[group.name], activeTab);
        const summaryOnly = all.filter(
            group => tabSummary(group) && !group.files.some(file => !coveredFiles.has(file.path))
        );
        if (!summaryOnly.length) return all;
        const rest = all.filter(
            group => !(tabSummary(group) && !group.files.some(file => !coveredFiles.has(file.path)))
        );
        return [...summaryOnly, ...rest];
    }, [tabFiles, summaries, coveredFiles, activeTab]);
    const emptyLabel = `No ${activeTab} changes${spriteFilter ? ` for ${spriteFilter}` : ''} found.`;
    return (
        <div className={styles.diff}>
            <header className={styles.overview}>
                <div className={styles.overviewTop}>
                    <strong>{spriteFiles.length} {spriteFiles.length === 1 ? 'file' : 'files'} changed</strong>
                    <div className={styles.diffTabs} role="tablist" aria-label="Change categories">
                        {CATEGORIES.map(category => (
                            <button
                                key={category.key}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === category.key}
                                className={activeTab === category.key ? styles.diffTabActive : styles.diffTab}
                                onClick={() => setActiveTab(category.key)}
                            >{category.label} <span>{counts[category.key]}</span></button>
                        ))}
                    </div>
                    <span>
                        {additions ? <span className={styles.addCount}>+{additions}</span> : null}
                        {deletions ? <span className={styles.delCount}>-{deletions}</span> : null}
                    </span>
                </div>
            </header>
            <div className={styles.files}>
                {groups.length ? groups.map(group => {
                    const tabSummary = summaryForTab(summaries[group.name], activeTab);
                    const assetsTitle = activeTab === 'sounds' ? 'Sounds' :
                        activeTab === 'costumes' ? 'Costumes' : null;
                    return (
                        <section className={styles.spriteGroup} key={group.name || 'other'}>
                            <header className={styles.spriteHeading}>
                                <strong>{spriteLabel(group.name)}</strong>
                                <span>{group.files.length} changed file{group.files.length === 1 ? '' : 's'}</span>
                            </header>
                            {tabSummary ? (
                                <SummarySections
                                    summary={tabSummary}
                                    assetsTitle={assetsTitle}
                                    extensionMetas={extensionMetas}
                                />
                            ) : null}
                            {activeTab === 'code' && (blockScripts[group.name] || []).length ? (
                                <section className={styles.blocksSection} aria-label="Changed scripts as blocks">
                                    {blockScripts[group.name].slice(0, MAX_BLOCK_SCRIPTS).map(script => (
                                        <div className={styles.blockScript} key={script.key}>
                                            <span className={styles.blockDesc}>{script.desc}</span>
                                            <BlocksCompare source={script.diff} />
                                        </div>
                                    ))}
                                    {blockScripts[group.name].length > MAX_BLOCK_SCRIPTS ? (
                                        <p className={styles.blockTruncated}>
                                            {truncatedScriptsLabel(blockScripts[group.name].length - MAX_BLOCK_SCRIPTS)}
                                        </p>
                                    ) : null}
                                </section>
                            ) : null}
                            {group.files.map((file, index) => {
                                if (activeTab === 'code' && blockDiffFiles.has(file.path)) return null;
                                const isAsset = classifyAssetFile(file.path) !== 'code';
                                if (isAsset && loadAsset) {
                                    return (
                                        <section
                                            className={styles.assetFile}
                                            key={`${file.path}-${index}`}
                                        >
                                            <div className={styles.fileHeader}>
                                                <span className={styles.binaryDot} aria-hidden="true" />
                                                <span className={styles.path}>{file.path}</span>
                                                <span className={styles.status}>{file.status}</span>
                                                <OpenFileButton file={file} onOpenFile={onOpenFile} />
                                            </div>
                                            <AssetCompare file={file} loadAsset={loadAsset} />
                                        </section>
                                    );
                                }
                                if (file.binary) {
                                    return (
                                        <section
                                            className={styles.binaryFile}
                                            key={`${file.path}-${index}`}
                                        >
                                            <div className={styles.fileHeader}>
                                                <span className={styles.binaryDot} aria-hidden="true" />
                                                <span className={styles.path}>{file.path}</span>
                                                <span className={styles.status}>Asset changed</span>
                                                <OpenFileButton file={file} onOpenFile={onOpenFile} />
                                            </div>
                                        </section>
                                    );
                                }
                                const groupSummary = summaries[group.name];
                                const filtered = groupSummary ?
                                    filterCoveredDiffLines(file.lines, groupSummary) :
                                    {lines: file.lines, fullyCovered: false};
                                if (filtered.fullyCovered) return null;
                                const visibleAdds = filtered.lines.filter(line => line.type === 'add').length;
                                const visibleDels = filtered.lines.filter(line => line.type === 'del').length;
                                return (
                                    <details
                                        className={styles.file}
                                        key={`${file.path}-${index}`}
                                        open
                                    >
                                        <summary className={styles.fileHeader}>
                                            <FileSummary
                                                file={file}
                                                additions={visibleAdds}
                                                deletions={visibleDels}
                                                onOpenFile={onOpenFile}
                                            />
                                        </summary>
                                        <div className={styles.lines}>
                                            {filtered.lines.length ? filtered.lines.map((line, lineIndex) => (
                                                <DiffLine key={lineIndex} line={line} />
                                            )) : <p className={styles.noLines}>No line changes to show.</p>}
                                        </div>
                                    </details>
                                );
                            })}
                        </section>
                    );
                }) : <p className={styles.empty}>{emptyLabel}</p>}
            </div>
        </div>
    );
};

export default DiffView;
