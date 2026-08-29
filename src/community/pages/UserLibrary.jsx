import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ArrowLeft, Gamepad2} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import api from '../api';
import PlaytimeLibrary from '../components/PlaytimeLibrary.jsx';
import {useUser} from '../UserContext.jsx';
import setPageMeta from '../page-meta.js';
import styles from './UserLibrary.module.css';

const UserLibrary = () => {
    const {name} = useParams();
    const {user} = useUser();
    const self = Boolean(user && user.username.toLowerCase() === name.toLowerCase());
    const [projects, setProjects] = useState([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [visible, setVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [moreBusy, setMoreBusy] = useState(false);
    const context = useRef(name);
    context.current = name;

    const load = useCallback(() => {
        const requestedName = name;
        setLoading(true);
        setError(false);
        api.userPlaytimeLibrary(name)
            .then(data => {
                if (context.current !== requestedName) return;
                const items = data.projects || [];
                setProjects(items);
                setTotal(Number.isFinite(data.total) ? data.total : items.length);
                setOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : items.length);
                setVisible(data.visible !== false);
            })
            .catch(() => {
                if (context.current === requestedName) setError(true);
            })
            .finally(() => {
                if (context.current === requestedName) setLoading(false);
            });
    }, [name]);

    useEffect(() => {
        setProjects([]);
        setTotal(0);
        setOffset(0);
        setVisible(true);
        load();
    }, [load]);

    useEffect(() => setPageMeta({title: `${name}'s game library`}), [name]);

    const loadMore = async () => {
        if (moreBusy || offset >= total) return;
        const requestedName = name;
        setMoreBusy(true);
        try {
            const data = await api.userPlaytimeLibrary(name, {offset});
            if (context.current !== requestedName) return;
            setProjects(current => [...current, ...(data.projects || [])]);
            setOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : offset + (data.projects || []).length);
            setTotal(Number.isFinite(data.total) ? data.total : total);
        } catch (e) {
            if (context.current === requestedName) setError(true);
        } finally {
            if (context.current === requestedName) setMoreBusy(false);
        }
    };

    return (
        <main className={styles.page}>
            <Link className={styles.back} to={`/users/${name}`}><ArrowLeft size={15} /> Back to profile</Link>
            <header className={styles.head}>
                <span className={styles.icon}><Gamepad2 size={24} /></span>
                <div>
                    <h1>{self ? 'Your game library' : `${name}'s game library`}</h1>
                    <p>Games ranked by total playtime.</p>
                </div>
            </header>
            <PlaytimeLibrary
                projects={projects}
                total={total}
                visible={visible}
                self={self}
                loading={loading}
                error={error}
                hasMore={offset < total}
                moreBusy={moreBusy}
                onRetry={load}
                onLoadMore={loadMore}
            />
        </main>
    );
};

export default UserLibrary;
