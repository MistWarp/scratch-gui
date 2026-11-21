import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {ListChecks} from 'lucide-react';
import {
    assetFileOf,
    formatStateValue,
    itemLines,
    plainScriptTitle,
    scriptWasMoved,
    summarizeEntries
} from '../commit-changes.js';
import BlocksCompare from './BlocksCompare.jsx';
import {AssetCompare, OpenFileButton} from './DiffView.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import Notice from './ui/Notice.jsx';
import {spriteLabel} from './SpriteList.jsx';
import styles from './ChangesView.module.css';

const SCRIPTS_SHOWN = 8;
const VARIABLE_KINDS = new Set(['variable', 'list', 'cloud']);
const ASSET_KINDS = new Set(['costume', 'backdrop', 'sound']);

const kindLabelsFor = text => ({
    variable: text('Variable'),
    list: text('List'),
    cloud: text('Cloud variable'),
    costume: text('Costume'),
    backdrop: text('Backdrop'),
    sound: text('Sound'),
    use: text('Extension'),
    comment: text('Comment'),
    monitor: text('Monitor'),
    platform: text('Platform'),
    sprite: text('Sprite'),
    stage: text('Stage'),
    script: text('Script')
});

const fieldLabelsFor = text => ({
    position: text('Position'),
    size: text('Size'),
    direction: text('Direction'),
    visible: text('Shown'),
    layer: text('Layer'),
    costume: text('Costume'),
    volume: text('Volume'),
    tempo: text('Tempo'),
    video: text('Video'),
    transparency: text('Video transparency'),
    tts: text('Text to speech'),
    value: text('Value'),
    display: text('Monitor'),
    shown: text('Monitor added'),
    removed: text('Monitor removed'),
    current: text('Current'),
    layout: text('Layout')
});

const scriptChangeLabelsFor = text => ({
    added: text('Added'),
    removed: text('Removed'),
    changed: text('Changed'),
    moved: text('Moved')
});

const itemSentence = (item, text) => {
    const kinds = kindLabelsFor(text);
    const kind = kinds[item.kind] || item.kind;
    if (item.change === 'reordered') {
        return item.kind === 'sound' ? text('Sounds reordered') : text('Costumes reordered');
    }
    if (item.change === 'renamed') {
        return text('{value1} "{value2}" renamed to "{value3}"', {value1: kind, value2: item.before, value3: item.after});
    }
    if (item.change === 'added') return text('{value1} "{value2}" added', {value1: kind, value2: item.name});
    if (item.change === 'removed') return text('{value1} "{value2}" removed', {value1: kind, value2: item.name});
    if (item.change === 'edited') return text('{value1} "{value2}" edited', {value1: kind, value2: item.name});
    return text('{value1} "{value2}" changed', {value1: kind, value2: item.name});
};

const summarySentences = (summary, text) => {
    const items = summary.items;
    const sentences = [];
    const add = (count, one, many) => {
        if (count) sentences.push(count === 1 ? one : many);
    };
    if (summary.stateOnly) sentences.push(text('Only saved state changed. No scripts, costumes or sounds were edited.'));
    const n = count => ({value1: count});
    add(summary.scriptsChanged, text('1 script changed.'), text('{value1} scripts changed.', n(summary.scriptsChanged)));
    add(summary.scriptsAdded, text('1 script added.'), text('{value1} scripts added.', n(summary.scriptsAdded)));
    add(summary.scriptsRemoved, text('1 script removed.'), text('{value1} scripts removed.', n(summary.scriptsRemoved)));
    add(
        summary.scriptsMoved,
        text('1 script moved to another file.'),
        text('{value1} scripts moved to another file.', n(summary.scriptsMoved))
    );
    const variables = items.filter(item => VARIABLE_KINDS.has(item.kind)).length;
    const assets = items.filter(item => ASSET_KINDS.has(item.kind)).length;
    const extensions = items.filter(item => item.kind === 'use').length;
    const other = items.length - variables - assets - extensions;
    add(variables, text('1 variable or list changed.'), text('{value1} variables and lists changed.', n(variables)));
    add(assets, text('1 costume or sound changed.'), text('{value1} costumes and sounds changed.', n(assets)));
    add(extensions, text('1 extension changed.'), text('{value1} extensions changed.', n(extensions)));
    add(other, text('1 other change.'), text('{value1} other changes.', n(other)));
    add(summary.files, text('1 other file changed.'), text('{value1} other files changed.', n(summary.files)));
    add(
        summary.rewritten,
        text('1 script was rewritten without changing its blocks.'),
        text('{value1} scripts were rewritten without changing their blocks.', n(summary.rewritten))
    );
    add(
        summary.stateSprites,
        text('Saved state changed in 1 sprite.'),
        text('Saved state changed in {value1} sprites.', n(summary.stateSprites))
    );
    if (!sentences.length) sentences.push(text('Nothing in this commit changes how the project runs.'));
    return sentences;
};

const CodeLines = ({before, after}) => (
    <div className={styles.code}>
        {itemLines(before).map((line, index) => (
            <div className={styles.del} key={`del-${index}`}>
                <span aria-hidden="true">{'-'}</span><code>{line}</code>
            </div>
        ))}
        {itemLines(after).map((line, index) => (
            <div className={styles.add} key={`add-${index}`}>
                <span aria-hidden="true">{'+'}</span><code>{line}</code>
            </div>
        ))}
    </div>
);

CodeLines.propTypes = {
    before: PropTypes.string,
    after: PropTypes.string
};

const ScriptChange = ({script, rendered}) => {
    const {text: communityText} = useCommunityText();
    const labels = scriptChangeLabelsFor(communityText);
    const title = plainScriptTitle(rendered?.desc || script.head);
    return (
        <li className={styles.script}>
            <div className={styles.scriptHead}>
                <span className={styles[`change_${script.change}`] || styles.change_changed}>
                    {labels[script.change] || labels.changed}
                </span>
                <span className={styles.scriptTitle}>{title}</span>
            </div>
            {scriptWasMoved(script) ? (
                <p className={styles.note}>
                    {communityText('Moved from {value1} to {value2}.', {value1: script.beforeFile, value2: script.file})}
                </p>
            ) : rendered ? (
                <BlocksCompare source={rendered.diff} />
            ) : (
                <CodeLines before={script.before} after={script.after} />
            )}
        </li>
    );
};

ScriptChange.propTypes = {
    script: PropTypes.object.isRequired,
    rendered: PropTypes.object
};

const TargetScripts = ({scripts}) => {
    const {text: communityText} = useCommunityText();
    const [expanded, setExpanded] = useState(false);
    const list = expanded ? scripts : scripts.slice(0, SCRIPTS_SHOWN);
    const hidden = scripts.length - list.length;
    return (
        <section className={styles.block}>
            <h4>{communityText('Scripts')}</h4>
            <ul className={styles.scripts}>
                {list.map(({script, rendered}, index) => (
                    <ScriptChange key={`${script.change}-${script.head}-${index}`} script={script} rendered={rendered} />
                ))}
            </ul>
            {hidden > 0 ? (
                <Button className={styles.more} onClick={() => setExpanded(true)}>
                    {hidden === 1 ?
                        communityText('Show 1 more script') :
                        communityText('Show {value1} more scripts', {value1: hidden})}
                </Button>
            ) : null}
        </section>
    );
};

TargetScripts.propTypes = {
    scripts: PropTypes.array.isRequired
};

const ItemRow = ({item}) => {
    const {text: communityText} = useCommunityText();
    const sentence = itemSentence(item, communityText);
    const detail = item.change === 'changed' && (item.before || item.after) &&
        String(item.before).length + String(item.after).length < 4000;
    const tone = item.change === 'added' ? styles.itemAdd : item.change === 'removed' ? styles.itemRemove : styles.item;
    if (!detail) return <li className={tone}>{sentence}</li>;
    return (
        <li className={tone}>
            <details>
                <summary>{sentence}</summary>
                <CodeLines before={item.before} after={item.after} />
            </details>
        </li>
    );
};

ItemRow.propTypes = {
    item: PropTypes.object.isRequired
};

const AssetFiles = ({files, loadAsset, onOpenFile}) => {
    const {text: communityText} = useCommunityText();
    const statusLabels = {Added: communityText('Added'), Deleted: communityText('Deleted'), Modified: communityText('Modified')};
    return (
        <section className={styles.block}>
            <h4>{communityText('Costumes and sounds')}</h4>
            {files.map(file => (
                <div className={styles.asset} key={file.path}>
                    <div className={styles.assetHead}>
                        <span className={styles.path}>{file.path.split('/').slice(1).join('/')}</span>
                        <span className={styles.status}>{statusLabels[file.status] || file.status}</span>
                        <OpenFileButton file={file} onOpenFile={onOpenFile} />
                    </div>
                    {loadAsset ? <AssetCompare file={file} loadAsset={loadAsset} /> : null}
                </div>
            ))}
        </section>
    );
};

AssetFiles.propTypes = {
    files: PropTypes.array.isRequired,
    loadAsset: PropTypes.func,
    onOpenFile: PropTypes.func
};

const TargetSection = ({entry, headingId, loadAsset, onOpenFile, onShowLines}) => {
    const {text: communityText} = useCommunityText();
    const assetNames = new Set(entry.items.filter(item => ASSET_KINDS.has(item.kind)).map(item => assetFileOf(item.after || item.before)));
    const orderedAssets = [...entry.assets].sort((a, b) => {
        const named = file => (assetNames.has(file.path.split('/').slice(1).join('/')) ? 0 : 1);
        return named(a) - named(b);
    });
    return (
        <section className={styles.target} aria-labelledby={headingId}>
            <header className={styles.targetHead}>
                <h3 id={headingId}>{spriteLabel(entry.name)}</h3>
                {entry.count ? (
                    <span>
                        {entry.count === 1 ?
                            communityText('1 change') :
                            communityText('{value1} changes', {value1: entry.count})}
                    </span>
                ) : null}
            </header>
            {entry.target.tooLarge ? (
                <Notice
                    variant="info"
                    action={onShowLines ? <Button onClick={onShowLines}>{communityText('Show line diff')}</Button> : null}
                >
                    {communityText('This sprite is too large to compare here.')}
                </Notice>
            ) : null}
            {entry.scripts.length ? <TargetScripts scripts={entry.scripts} /> : null}
            {entry.items.length ? (
                <section className={styles.block}>
                    <h4>{communityText('Other changes')}</h4>
                    <ul className={styles.items}>
                        {entry.items.map((item, index) => <ItemRow key={`${item.kind}-${item.name}-${index}`} item={item} />)}
                    </ul>
                </section>
            ) : null}
            {orderedAssets.length ? (
                <AssetFiles files={orderedAssets} loadAsset={loadAsset} onOpenFile={onOpenFile} />
            ) : null}
        </section>
    );
};

TargetSection.propTypes = {
    entry: PropTypes.object.isRequired,
    headingId: PropTypes.string.isRequired,
    loadAsset: PropTypes.func,
    onOpenFile: PropTypes.func,
    onShowLines: PropTypes.func
};

const stateRowName = (entry, text) => {
    if (entry.kind === 'sprite' || entry.kind === 'stage') return '';
    const kinds = kindLabelsFor(text);
    return text('{value1} "{value2}"', {value1: kinds[entry.kind] || entry.kind, value2: entry.name});
};

const SavedState = ({targets}) => {
    const {text: communityText} = useCommunityText();
    const fields = fieldLabelsFor(communityText);
    const withState = targets.filter(entry => entry.state.length);
    const total = withState.reduce((sum, entry) => sum + entry.state.length, 0);
    if (!total) return null;
    return (
        <details className={styles.state}>
            <summary>
                <strong>{communityText('Saved state')}</strong>
                <span>
                    {total === 1 ?
                        communityText('1 saved value changed. These are runtime values, not edits.') :
                        communityText('{value1} saved values changed. These are runtime values, not edits.', {
                            value1: total
                        })}
                </span>
            </summary>
            <div className={styles.stateBody}>
                {withState.map(target => (
                    <section key={target.dir}>
                        <h4>{spriteLabel(target.name)}</h4>
                        <dl>
                            {target.state.map((entry, index) => (
                                <div key={`${entry.kind}-${entry.name}-${entry.field}-${index}`}>
                                    <dt>
                                        {stateRowName(entry, communityText) ? (
                                            <span className={styles.stateName}>{stateRowName(entry, communityText)}</span>
                                        ) : null}
                                        <span>{fields[entry.field] || entry.field}</span>
                                    </dt>
                                    <dd>
                                        <code className={styles.before}>{formatStateValue(entry.before) || communityText('Nothing')}</code>
                                        <span aria-hidden="true">{'→'}</span>
                                        <code>{formatStateValue(entry.after) || communityText('Nothing')}</code>
                                        {entry.truncated ? <span className={styles.truncated}>{communityText('Shortened')}</span> : null}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
            </div>
        </details>
    );
};

SavedState.propTypes = {
    targets: PropTypes.array.isRequired
};

const OtherFiles = ({files, onOpenFile}) => {
    const {text: communityText} = useCommunityText();
    const statusLabels = {Added: communityText('Added'), Deleted: communityText('Deleted'), Modified: communityText('Modified')};
    return (
        <section className={styles.target} aria-labelledby="commit-changes-other-files">
            <header className={styles.targetHead}>
                <h3 id="commit-changes-other-files">{communityText('Other files')}</h3>
            </header>
            <ul className={styles.files}>
                {files.map(file => (
                    <li key={file.path}>
                        <span className={styles.path}>{file.path}</span>
                        <span className={styles.status}>{statusLabels[file.status] || file.status}</span>
                        <OpenFileButton file={file} onOpenFile={onOpenFile} />
                    </li>
                ))}
            </ul>
        </section>
    );
};

OtherFiles.propTypes = {
    files: PropTypes.array.isRequired,
    onOpenFile: PropTypes.func
};

const ChangesView = ({analysis, spriteFilter, loadAsset, onOpenFile, onShowLines}) => {
    const {text: communityText} = useCommunityText();
    const targets = analysis.targets.filter(entry => !spriteFilter || entry.dir === spriteFilter);
    const others = spriteFilter ? [] : analysis.others;
    const summary = spriteFilter ? summarizeEntries(targets, others) : analysis.summary;
    const sentences = summarySentences(summary, communityText);
    const authored = targets.filter(entry => entry.authored);
    if (!analysis.targets.length && !analysis.others.length) {
        return (
            <EmptyState compact title={communityText('No changes')}>
                {communityText('This version did not change any files.')}
            </EmptyState>
        );
    }
    return (
        <div className={styles.view}>
            <section className={styles.summary} aria-labelledby="commit-changes-summary">
                <h2 id="commit-changes-summary"><ListChecks size={16} aria-hidden="true" />{communityText('What changed')}</h2>
                <p>{sentences.join(' ')}</p>
            </section>
            {authored.map((entry, index) => (
                <TargetSection
                    key={entry.dir}
                    entry={entry}
                    headingId={`commit-changes-target-${index}`}
                    loadAsset={loadAsset}
                    onOpenFile={onOpenFile}
                    onShowLines={onShowLines}
                />
            ))}
            {spriteFilter && !authored.length ? (
                <p className={styles.note}>{communityText('This sprite has no changes to its blocks, costumes or sounds.')}</p>
            ) : null}
            {others.length ? <OtherFiles files={others} onOpenFile={onOpenFile} /> : null}
            <SavedState targets={targets} />
        </div>
    );
};

ChangesView.propTypes = {
    analysis: PropTypes.object.isRequired,
    spriteFilter: PropTypes.string,
    loadAsset: PropTypes.func,
    onOpenFile: PropTypes.func,
    onShowLines: PropTypes.func
};

ChangesView.defaultProps = {
    spriteFilter: '',
    loadAsset: null,
    onOpenFile: null,
    onShowLines: null
};

export default ChangesView;
