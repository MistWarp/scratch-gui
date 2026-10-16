/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {injectIntl, intlShape} from 'react-intl';
import {AudioWaveform, Blocks as BlocksIcon, FileCode2, Image as ImageIcon, Search} from 'lucide-react';

import {matchFiles} from '../../lib/code-mode/files.js';
import messages from './messages.js';
import styles from './workbench.css';

const KIND_ICONS = {
    script: FileCode2,
    costume: ImageIcon,
    sound: AudioWaveform,
    extension: BlocksIcon
};

const MAX_RESULTS = 200;

const QuickOpen = ({files, intl, onClose, onPick}) => {
    const [query, setQuery] = useState('');
    const [index, setIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const results = useMemo(() => matchFiles(files, query).slice(0, MAX_RESULTS), [files, query]);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        setIndex(0);
    }, [query]);

    useEffect(() => {
        const node = listRef.current && listRef.current.children[index];
        if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({block: 'nearest'});
    }, [index]);

    const handleKeyDown = event => {
        event.stopPropagation();
        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIndex(value => Math.min(results.length - 1, value + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setIndex(value => Math.max(0, value - 1));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (results[index]) onPick(results[index]);
        }
    };

    const title = intl.formatMessage(messages.quickOpen);
    return ReactDOM.createPortal(
        <div
            className={styles.quickOpenOverlay}
            onPointerDown={event => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                aria-label={title}
                aria-modal="true"
                className={styles.quickOpen}
                role="dialog"
            >
                <div className={styles.quickOpenSearch}>
                    <Search size={15} />
                    <input
                        aria-label={title}
                        className={styles.quickOpenInput}
                        placeholder={intl.formatMessage(messages.quickOpenPlaceholder)}
                        ref={inputRef}
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {results.length ? (
                    <ul
                        className={styles.quickOpenList}
                        ref={listRef}
                        role="listbox"
                    >
                        {results.map((file, i) => {
                            const Icon = KIND_ICONS[file.kind] || FileCode2;
                            return (
                                <li
                                    aria-selected={i === index}
                                    className={classNames(styles.quickOpenItem, {
                                        [styles.quickOpenItemActive]: i === index
                                    })}
                                    key={file.tab.key}
                                    role="option"
                                    onClick={() => onPick(file)}
                                    onMouseMove={() => setIndex(i)}
                                >
                                    <Icon size={14} />
                                    <span className={styles.rowLabel}>{file.title}</span>
                                    {file.detail ? <span className={styles.rowMeta}>{file.detail}</span> : null}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className={styles.panelEmpty}>{intl.formatMessage(messages.noMatches)}</p>
                )}
            </div>
        </div>,
        document.body
    );
};

QuickOpen.propTypes = {
    files: PropTypes.arrayOf(PropTypes.object).isRequired,
    intl: intlShape,
    onClose: PropTypes.func.isRequired,
    onPick: PropTypes.func.isRequired
};

export default injectIntl(QuickOpen);
