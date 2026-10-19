/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useMemo, useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {
    AlertTriangle,
    BookOpen,
    ChevronDown,
    ChevronUp,
    CircleHelp,
    CircleX,
    Eraser,
    Eye,
    FileCode2,
    Info,
    ListTree,
    Search,
    SquareArrowOutUpRight,
    Terminal
} from 'lucide-react';

import messages from './messages.js';
import WatchPanel from './watch-panel.jsx';
import styles from './workbench.css';

const severityIcon = severity => {
    if (severity === 'error') {
        return (<CircleX
            className={styles.iconError}
            size={14}
        />);
    }
    if (severity === 'warning') {
        return (<AlertTriangle
            className={styles.iconWarning}
            size={14}
        />);
    }
    return (<Info
        className={styles.iconInfo}
        size={14}
    />);
};

const formatTime = time => new Date(time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

const matchesQuery = (item, query) => !query || item.name.toLowerCase().includes(query) ||
    (item.opcode && item.opcode.toLowerCase().includes(query));

const Reference = ({intl, groups, onInsert}) => {
    const [query, setQuery] = useState('');
    const text = query.trim().toLowerCase();
    const visible = useMemo(() => groups
        .map(group => ({...group, items: group.items.filter(item => matchesQuery(item, text))}))
        .filter(group => group.items.length), [groups, text]);
    return (
        <div className={styles.reference}>
            <label className={styles.referenceSearch}>
                <Search size={13} />
                <input
                    aria-label={intl.formatMessage(messages.referenceSearch)}
                    placeholder={intl.formatMessage(messages.referenceSearch)}
                    type="search"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                />
            </label>
            {visible.length ? visible.map(group => (
                <div
                    className={styles.referenceGroup}
                    key={group.kind}
                >
                    <div className={styles.referenceKind}>{group.kind}</div>
                    <ul className={styles.problemList}>
                        {group.items.map(item => (
                            <li key={`${group.kind}:${item.name}:${item.opcode}`}>
                                <button
                                    className={styles.problemRow}
                                    title={intl.formatMessage(messages.referenceInsert, {name: item.name})}
                                    type="button"
                                    onClick={() => onInsert(item)}
                                >
                                    <code className={styles.referenceName}>{item.detail}</code>
                                    <span className={styles.rowMeta}>{item.opcode}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )) : <p className={styles.panelEmpty}>{intl.formatMessage(messages.referenceEmpty)}</p>}
        </div>
    );
};

Reference.propTypes = {
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    intl: intlShape,
    onInsert: PropTypes.func.isRequired
};

const Panel = props => {
    const {groups, intl, open, output, tab} = props;
    const total = groups.reduce((sum, group) => sum + group.problems.length, 0);
    const errors = groups.reduce((sum, group) =>
        sum + group.problems.filter(item => item.severity === 'error').length, 0);
    const toggleLabel = intl.formatMessage(open ? messages.hidePanel : messages.showPanel);
    return (
        <div
            className={classNames(styles.panel, {[styles.panelClosed]: !open})}
            data-mw-region="panel"
        >
            <div
                className={styles.panelTabs}
                role="tablist"
            >
                <button
                    aria-selected={tab === 'problems'}
                    className={classNames(styles.panelTab, {[styles.panelTabActive]: open && tab === 'problems'})}
                    role="tab"
                    type="button"
                    onClick={() => props.onTab('problems')}
                >
                    <ListTree size={14} />
                    {intl.formatMessage(messages.problems)}
                    {total ? (
                        <span className={classNames(styles.problemBadge, {[styles.problemBadgeError]: errors})}>
                            {total}
                        </span>
                    ) : null}
                </button>
                <button
                    aria-selected={tab === 'output'}
                    className={classNames(styles.panelTab, {[styles.panelTabActive]: open && tab === 'output'})}
                    role="tab"
                    type="button"
                    onClick={() => props.onTab('output')}
                >
                    <Terminal size={14} />
                    {intl.formatMessage(messages.output)}
                </button>
                <button
                    aria-selected={tab === 'reference'}
                    className={classNames(styles.panelTab, {[styles.panelTabActive]: open && tab === 'reference'})}
                    role="tab"
                    type="button"
                    onClick={() => props.onTab('reference')}
                >
                    <BookOpen size={14} />
                    {intl.formatMessage(messages.reference)}
                </button>
                {props.watch ? (
                    <button
                        aria-selected={tab === 'watch'}
                        className={classNames(styles.panelTab, {[styles.panelTabActive]: open && tab === 'watch'})}
                        role="tab"
                        type="button"
                        onClick={() => props.onTab('watch')}
                    >
                        <Eye size={14} />
                        {intl.formatMessage(messages.watch)}
                    </button>
                ) : null}
                <span className={styles.flexSpacer} />
                {open && tab === 'reference' ? (
                    <button
                        className={styles.panelAction}
                        type="button"
                        onClick={props.onOpenReferenceTab}
                    >
                        <SquareArrowOutUpRight size={13} />
                        {intl.formatMessage(messages.openReferenceTab)}
                    </button>
                ) : null}
                {open && tab === 'output' ? (
                    <React.Fragment>
                        <button
                            className={styles.panelAction}
                            type="button"
                            onClick={props.onOpenHelp}
                        >
                            <CircleHelp size={13} />
                            {intl.formatMessage(messages.debuggingHelp)}
                        </button>
                        <button
                            aria-label={intl.formatMessage(messages.clearOutput)}
                            className={styles.iconButton}
                            disabled={!output.length}
                            title={intl.formatMessage(messages.clearOutput)}
                            type="button"
                            onClick={props.onClearOutput}
                        >
                            <Eraser size={14} />
                        </button>
                    </React.Fragment>
                ) : null}
                <button
                    aria-expanded={open}
                    aria-label={toggleLabel}
                    className={styles.iconButton}
                    title={toggleLabel}
                    type="button"
                    onClick={props.onToggle}
                >
                    {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
            </div>
            {open ? (
                <div
                    className={styles.panelBody}
                    role="tabpanel"
                >
                    {tab === 'problems' ? (
                        total === 0 ? (
                            <p className={styles.panelEmpty}>{intl.formatMessage(messages.noProblems)}</p>
                        ) : groups.map(group => (
                            <div
                                className={styles.problemGroup}
                                key={group.key}
                            >
                                <button
                                    className={styles.problemFile}
                                    type="button"
                                    onClick={() => props.onOpenFile(group)}
                                >
                                    <FileCode2 size={13} />
                                    <span className={styles.problemFileName}>{group.title}</span>
                                    {group.detail ? <span className={styles.rowMeta}>{group.detail}</span> : null}
                                    <span className={styles.problemBadge}>{group.problems.length}</span>
                                </button>
                                <ul className={styles.problemList}>
                                    {group.problems.map((problem, index) => (
                                        <li key={problem.key || `${group.key}-${index}`}>
                                            <button
                                                className={styles.problemRow}
                                                type="button"
                                                onClick={() => props.onJump(group, problem)}
                                            >
                                                {severityIcon(problem.severity)}
                                                <span className={styles.problemMessage}>{problem.message}</span>
                                                {problem.line ? (
                                                    <span className={styles.rowMeta}>
                                                        {intl.formatMessage(messages.lineColumn, {
                                                            line: problem.line,
                                                            column: problem.column || 1
                                                        })}
                                                    </span>
                                                ) : null}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : tab === 'watch' && props.watch ? (
                        <WatchPanel {...props.watch} />
                    ) : tab === 'reference' ? (
                        <Reference
                            groups={props.reference}
                            intl={intl}
                            onInsert={props.onInsertReference}
                        />
                    ) : (
                        output.length === 0 ? (
                            <p className={styles.panelEmpty}>{intl.formatMessage(messages.noOutput)}</p>
                        ) : (
                            <ul className={styles.outputList}>
                                {output.map(entry => {
                                    const location = props.outputLocation(entry);
                                    return (
                                        <li key={entry.id}>
                                            <button
                                                className={styles.outputRow}
                                                disabled={!location}
                                                type="button"
                                                onClick={() => props.onOutputJump(entry)}
                                            >
                                                <span className={styles.outputTime}>{formatTime(entry.time)}</span>
                                                {severityIcon(entry.level)}
                                                <span className={styles.problemMessage}>{entry.text}</span>
                                                {location ? (
                                                    <span className={styles.rowMeta}>{location}</span>
                                                ) : null}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )
                    )}
                </div>
            ) : null}
        </div>
    );
};

Panel.propTypes = {
    groups: PropTypes.arrayOf(PropTypes.shape({
        detail: PropTypes.string,
        key: PropTypes.string.isRequired,
        problems: PropTypes.arrayOf(PropTypes.object).isRequired,
        title: PropTypes.string.isRequired
    })).isRequired,
    intl: intlShape,
    open: PropTypes.bool.isRequired,
    output: PropTypes.arrayOf(PropTypes.object).isRequired,
    outputLocation: PropTypes.func,
    reference: PropTypes.arrayOf(PropTypes.object),
    tab: PropTypes.oneOf(['problems', 'output', 'reference', 'watch']).isRequired,
    watch: PropTypes.object,
    onClearOutput: PropTypes.func,
    onInsertReference: PropTypes.func,
    onJump: PropTypes.func.isRequired,
    onOpenHelp: PropTypes.func,
    onOpenReferenceTab: PropTypes.func,
    onOutputJump: PropTypes.func,
    onOpenFile: PropTypes.func.isRequired,
    onTab: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired
};

Panel.defaultProps = {
    outputLocation: () => null,
    reference: [],
    onClearOutput: () => {},
    onInsertReference: () => {},
    onOpenHelp: () => {},
    onOpenReferenceTab: () => {},
    onOutputJump: () => {}
};

const ReferenceView = injectIntl(Reference);

export {ReferenceView};
export default injectIntl(Panel);
