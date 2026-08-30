import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Search, X} from 'lucide-react';
import {findGifs, gifUrl} from '../gifs.js';
import styles from './GifPicker.module.css';

const GifPicker = ({onClose, onSelect}) => {
    const [query, setQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setLoading(true);
            setError('');
            findGifs(query, controller.signal).then(setGifs).catch(cause => {
                if (controller.signal.aborted) return;
                setGifs([]);
                setError(cause.message || 'Could not load GIFs.');
            }).finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        }, query.trim() ? 250 : 0);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return (
        <section className={styles.picker} aria-label="Choose a GIF">
            <div className={styles.head}>
                <label className={styles.search}>
                    <Search size={16} />
                    <input
                        ref={inputRef}
                        type="search"
                        value={query}
                        placeholder="Search GIFs"
                        aria-label="Search GIFs"
                        onChange={event => setQuery(event.target.value)}
                    />
                </label>
                <button type="button" onClick={onClose} aria-label="Close GIF picker"><X size={16} /></button>
            </div>
            <div className={styles.label}>{query.trim() ? 'Results' : 'Popular GIFs'}</div>
            {loading && !gifs.length ? <div className={styles.status}>Loading GIFs…</div> : null}
            {error ? <div className={styles.error} role="alert">{error}</div> : null}
            {!loading && !error && !gifs.length ? <div className={styles.status}>No GIFs found.</div> : null}
            {gifs.length ? (
                <div className={styles.grid}>
                    {gifs.map(gif => {
                        const url = gifUrl(gif.url);
                        return (
                            <button
                                type="button"
                                key={gif.id}
                                title={gif.title || 'GIF'}
                                onClick={() => onSelect(url)}
                            >
                                <img src={url} alt={gif.title || 'GIF'} loading="lazy" />
                            </button>
                        );
                    })}
                </div>
            ) : null}
            <a className={styles.credit} href="https://gifs.originchats.com" target="_blank" rel="noreferrer">
                GIFs from originChats
            </a>
        </section>
    );
};

GifPicker.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default GifPicker;
