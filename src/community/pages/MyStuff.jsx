import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState, useCallback, useRef} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {CheckCircle2, HeartHandshake, Image, Package, Plus, Trash2, Upload} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {formatDate} from '../format';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import SelectMenu from '../components/ui/SelectMenu.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import Toast from '../components/ui/Toast.jsx';
import CollectionSaveModal from '../components/CollectionSaveModal.jsx';
import MyStuffLibrary from '../components/MyStuffLibrary.jsx';
import MyStuffOverview from '../components/MyStuffOverview.jsx';
import MyStuffProjects, {getProjectShow, getProjectSort} from '../components/MyStuffProjects.jsx';
import MyStuffSpaces from '../components/MyStuffSpaces.jsx';
import MyStuffStorage, {StorageWarning, storageFull} from '../components/MyStuffStorage.jsx';
import MyStuffThemes from '../components/MyStuffThemes.jsx';
import MyStuffTrash from '../components/MyStuffTrash.jsx';
import SharedProjects from '../components/SharedProjects.jsx';
import Markdown from '../components/Markdown.jsx';
import useLatest from '../use-latest.js';
import styles from './MyStuff.module.css';

const uploadErrorTarget = (agreementAccepted, error) => {
    const message = error && error.message;
    return agreementAccepted ? {
        actionError: message || 'Could not upload that project.',
        agreementError: ''
    } : {
        actionError: '',
        agreementError: message || 'Could not accept agreement.'
    };
};

const uploadProgressLabel = (loaded, total) => {
    if (!(total > 0)) return 'Uploading…';
    const percent = Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
    return percent >= 100 ? 'Processing on server…' : `Uploading ${percent}%`;
};

const shouldRefreshProjectsAfterUploadError = error =>
    Boolean(error && error.code === 'upload_processing_timeout');

const replaceProjectById = (projects, replacement) =>
    (projects || []).map(project => (project.id === replacement.id ? replacement : project));
const removeProjectById = (projects, id) =>
    (projects || []).filter(project => project.id !== id);
const trashPurgeConfirmation = project => ({
    title: 'Delete forever?',
    body: `Permanently delete "${project.title}"? This cannot be undone.`,
    action: 'Delete forever'
});

const Inventory = ({items, error, onRetry}) => {
    const {text: communityText} = useCommunityText();
    let body;
    if (error) {
        body = <StatusMessage compact error onRetry={onRetry}>{communityText('Could not load your inventory.')}</StatusMessage>;
    } else if (items === null) {
        body = (
            <div className={styles.inventoryGrid} role="status" aria-label={communityText('Loading inventory…')}>
                {[0, 1, 2, 3, 4].map(index => <span key={index} className={styles.inventorySkeleton} />)}
            </div>
        );
    } else if (items.length) {
        body = (
            <ul className={styles.inventoryGrid}>
                {items.map(item => (
                    <li key={item.id}>
                        <Link
                            to={projectUrl(item.originProjectId)}
                            className={styles.inventoryItem}
                            aria-label={communityText('{value1}, from {value2}, quantity {value3}', {value1: item.name, value2: item.originProjectTitle, value3: item.quantity})}
                        >
                            <span className={styles.inventoryArt}>
                                {item.visual && item.visual.url ? (
                                    <img src={item.visual.url} alt="" loading="lazy" />
                                ) : (
                                    <Image size={28} aria-hidden="true" />
                                )}
                            </span>
                            <span className={styles.inventoryName}>
                                <strong>{item.name}</strong>
                                <span>×{item.quantity}</span>
                            </span>
                            <small>{communityText('From {value1}', {value1: item.originProjectTitle})}</small>
                        </Link>
                    </li>
                ))}
            </ul>
        );
    } else {
        body = (
            <EmptyState
                icon={Package}
                title={communityText('Your inventory is empty')}
                action={<Button as={Link} to="/explore?tag=games">{communityText('Find games to play')}</Button>}
            >
                {communityText('Items you collect in MistWarp games will appear here.')}
            </EmptyState>
        );
    }
    return (
        <section>
            <SectionHeading
                title={communityText('Inventory')}
                lead={communityText('Items collected across MistWarp games.')}
                actions={items && items.length ? (
                    <span className={styles.count}>
                        {items.length === 1 ? communityText('1 item type') : communityText('{value1} item types', {value1: items.length})}
                    </span>
                ) : null}
            />
            {body}
        </section>
    );
};

const AgreementTab = () => {
    const {text: communityText} = useCommunityText();
    const [agreement, setAgreement] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let stale = false;
        setAgreement(null);
        setLoadError(false);
        api.agreement()
            .then(data => {
                if (!stale) setAgreement(data.agreement);
            })
            .catch(() => {
                if (!stale) setLoadError(true);
            });
        return () => {
            stale = true;
        };
    }, [attempt]);

    const handleAccept = async () => {
        setBusy(true);
        setError('');
        try {
            await api.acceptAgreement();
            setAgreement(prev => ({...prev, accepted: true, acceptedNow: true}));
        } catch (e) {
            setError(e.message || 'Could not accept agreement.');
        } finally {
            setBusy(false);
        }
    };

    let body;
    if (loadError) {
        body = (
            <StatusMessage compact error onRetry={() => setAttempt(value => value + 1)}>
                {communityText('Could not load the agreement.')}
            </StatusMessage>
        );
    } else if (!agreement) {
        body = <StatusMessage compact>{communityText('Loading agreement…')}</StatusMessage>;
    } else if (!agreement.text && agreement.version === 0) {
        body = (
            <EmptyState icon={HeartHandshake} title={communityText('No agreement yet')}>
                {communityText('No agreement has been set yet.')}
            </EmptyState>
        );
    } else {
        body = (
            <React.Fragment>
                <div className={styles.agreementFooter}>
                    {agreement.accepted === true ? (
                        <p className={styles.agreementAccepted}>
                            <CheckCircle2 size={16} aria-hidden="true" />
                            {communityText('You have accepted version {value1} (updated {value2}).', {value1: agreement.version, value2: formatDate(agreement.updatedAt, 'date unavailable')})}
                        </p>
                    ) : (
                        <React.Fragment>
                            <p className={styles.agreementPrompt}>{communityText('To continue using the platform, please accept this agreement.')}</p>
                            {error ? <Notice variant="error">{error}</Notice> : null}
                            <Button
                                variant="primary"
                                className={styles.agreementAcceptBtn}
                                onClick={handleAccept}
                                busy={busy}
                                busyLabel={communityText('Accepting…')}
                            >
                                {communityText('Accept v{value1}', {value1: agreement.version})}
                            </Button>
                        </React.Fragment>
                    )}
                </div>
                <Markdown className={styles.agreementText}>{agreement.text}</Markdown>
            </React.Fragment>
        );
    }
    return (
        <section className={styles.agreement}>
            <SectionHeading
                title={communityText('Upload agreement')}
                lead={communityText('What you agree to when you upload or share a project.')}
            />
            {body}
        </section>
    );
};

const SECTIONS = [
    {key: 'overview', label: 'Overview'},
    {key: 'projects', label: 'My projects', group: 'Projects'},
    {key: 'shared', label: 'Shared with you', group: 'Projects'},
    {key: 'library', label: 'Library', group: 'Projects'},
    {key: 'collections', label: 'Collections', group: 'Projects'},
    {key: 'spaces', label: 'Spaces', group: 'Projects'},
    {key: 'themes', label: 'Themes', group: 'Assets'},
    {key: 'inventory', label: 'Inventory', group: 'Assets'},
    {key: 'uploads', label: 'Storage', group: 'Account'},
    {key: 'trash', label: 'Trash', group: 'Account'},
    {key: 'agreement', label: 'Agreement', group: 'Account'}
];
const getMyStuffSection = value => {
    if (value === 'playtime') return 'library';
    if (SECTIONS.some(section => section.key === value)) return value;
    return 'overview';
};
const normalizeMyStuffParams = params => {
    const next = new URLSearchParams(params);
    let section = getMyStuffSection(next.get('section'));
    if (section === 'collections' && next.get('collectionView') === 'library') section = 'library';
    if (section === 'overview') next.delete('section');
    else next.set('section', section);
    if (section !== 'themes' || next.get('themeView') !== 'published') next.delete('themeView');
    if (section !== 'projects' || getProjectShow(next.get('show')) === 'all') next.delete('show');
    if (section !== 'projects' || getProjectSort(next.get('sort')) === 'edited') next.delete('sort');
    next.delete('collectionView');
    return next;
};
const sectionUrl = key => (key === 'overview' ? '/mystuff' : `/mystuff?section=${key}`);

// The ways into My Stuff down the side, like Explore's filters: plain links
// under quiet group names. Phones get one menu instead.
const MyStuffNav = ({active, onFollow, onNavigate}) => {
    const {text: communityText} = useCommunityText();
    const groups = [];
    for (const section of SECTIONS) {
        const last = groups[groups.length - 1];
        if (last && last.name === (section.group || '')) last.sections.push(section);
        else groups.push({name: section.group || '', sections: [section]});
    }
    return (
        <React.Fragment>
            <nav className={styles.nav} aria-label={communityText('My stuff sections')}>
                {groups.map(group => (
                    <div key={group.name || 'top'} className={styles.navGroup}>
                        {group.name ? <h2 id={`mystuff-nav-${group.name}`}>{communityText(group.name)}</h2> : null}
                        <ul aria-labelledby={group.name ? `mystuff-nav-${group.name}` : null}>
                            {group.sections.map(section => (
                                <li key={section.key}>
                                    <Link
                                        to={sectionUrl(section.key)}
                                        className={section.key === active ? styles.navActive : styles.navLink}
                                        aria-current={section.key === active ? 'page' : null}
                                        onClick={onFollow}
                                    >{communityText(section.label)}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
            <div className={styles.compactNav}>
                <SelectMenu
                    ariaLabel={communityText('My stuff sections')}
                    value={active}
                    onChange={onNavigate}
                    options={SECTIONS.map(section => ({value: section.key, label: communityText(section.label)}))}
                />
            </div>
        </React.Fragment>
    );
};

const MyStuff = () => {
    const {text: communityText} = useCommunityText();
    const {user, loading, login} = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = getMyStuffSection(searchParams.get('section'));
    const projectShow = getProjectShow(searchParams.get('show'));
    const projectSort = getProjectSort(searchParams.get('sort'));
    const [projects, setProjects] = useState(null);
    const [projectTotal, setProjectTotal] = useState(0);
    const [projectOffset, setProjectOffset] = useState(0);
    const [projectsMoreBusy, setProjectsMoreBusy] = useState(false);
    const [projectsMoreFailed, setProjectsMoreFailed] = useState(false);
    const [allProjectsLoading, setAllProjectsLoading] = useState(false);
    const [featuredProject, setFeaturedProject] = useState(user ? user.featuredProject : '');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [actionError, setActionError] = useState('');
    const [toast, setToast] = useState(null);
    const [failed, setFailed] = useState(false);
    const [collectionProject, setCollectionProject] = useState(null);
    const [quota, setQuota] = useState(null);
    const [quotaFailed, setQuotaFailed] = useState(false);
    const [usageAttempt, setUsageAttempt] = useState(0);
    const [perks, setPerks] = useState(null);
    const [stats, setStats] = useState(null);
    const [statsFailed, setStatsFailed] = useState(false);
    const [inventoryItems, setInventoryItems] = useState(null);
    const [inventoryFailed, setInventoryFailed] = useState(false);
    const [pendingUploadFile, setPendingUploadFile] = useState(null);
    const [showAgreeModal, setShowAgreeModal] = useState(false);
    const [agreeData, setAgreeData] = useState(null);
    const [agreeBusy, setAgreeBusy] = useState(false);
    const [agreeError, setAgreeError] = useState('');
    const [mySpaces, setMySpaces] = useState(null);
    const [libraryProjects, setLibraryProjects] = useState(null);
    const [libraryTotal, setLibraryTotal] = useState(0);
    const [libraryOffset, setLibraryOffset] = useState(0);
    const [libraryBusy, setLibraryBusy] = useState(false);
    const [libraryVisibilityBusy, setLibraryVisibilityBusy] = useState('');
    const [libraryVisibilityError, setLibraryVisibilityError] = useState('');
    const [spacesFailed, setSpacesFailed] = useState(false);
    const [libraryFailed, setLibraryFailed] = useState(false);
    const [directoriesLoading, setDirectoriesLoading] = useState(false);
    const [busyProjects, setBusyProjects] = useState(() => new Set());
    const [trashedProjects, setTrashedProjects] = useState(null);
    const [trashBusy, setTrashBusy] = useState('');
    const [trashFailed, setTrashFailed] = useState(false);
    const [purgeConfirmProject, setPurgeConfirmProject] = useState(null);
    const [purgeError, setPurgeError] = useState('');
    const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);
    const [emptyTrashError, setEmptyTrashError] = useState('');
    const uploadInput = useRef(null);
    const allProjectsRequest = useRef(false);
    const beginProjectLoad = useLatest();
    const beginDirectoryLoad = useLatest();
    const beginStatsLoad = useLatest();
    const beginTrashLoad = useLatest();
    const username = user ? user.username : '';
    const accountContextRef = useRef(username);
    accountContextRef.current = username;
    const actionLocks = useRef(new Set());

    const beginAccountAction = name => {
        const key = `${accountContextRef.current}\u0000${name}`;
        if (actionLocks.current.has(key)) return null;
        actionLocks.current.add(key);
        return key;
    };
    const releaseAccountAction = key => actionLocks.current.delete(key);
    const setTab = (nextTab, {preserveError = false} = {}) => {
        const next = new URLSearchParams(searchParams);
        if (nextTab === 'overview') next.delete('section');
        else next.set('section', nextTab);
        if (nextTab !== 'themes') next.delete('themeView');
        if (nextTab !== 'projects') {
            next.delete('show');
            next.delete('sort');
        }
        next.delete('collectionView');
        if (!preserveError) setActionError('');
        setSearchParams(next);
    };
    const setProjectParam = (key, value, fallback) => {
        const next = new URLSearchParams(searchParams);
        if (value === fallback) next.delete(key);
        else next.set(key, value);
        setSearchParams(next, {replace: true});
    };
    const say = useCallback((message, action) => setToast({message, ...action, id: Date.now()}), []);
    const dismissToast = useCallback(() => setToast(null), []);
    const markBusy = (ids, on) => setBusyProjects(current => {
        const next = new Set(current);
        for (const id of ids) {
            if (on) next.add(id);
            else next.delete(id);
        }
        return next;
    });

    useEffect(() => {
        const normalized = normalizeMyStuffParams(searchParams);
        if (normalized.toString() !== searchParams.toString()) {
            setSearchParams(normalized, {replace: true});
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        beginDirectoryLoad();
        setMySpaces(null);
        setLibraryProjects(null);
        setLibraryTotal(0);
        setLibraryOffset(0);
        setLibraryBusy(false);
        setLibraryVisibilityBusy('');
        setLibraryVisibilityError('');
        setSpacesFailed(false);
        setLibraryFailed(false);
        setDirectoriesLoading(false);
        setBusyProjects(new Set());
        setTrashedProjects(null);
        setTrashBusy('');
        setTrashFailed(false);
        setPurgeConfirmProject(null);
        setPurgeError('');
        setEmptyTrashConfirm(false);
        setUploading(false);
        setUploadStatus('');
        setPendingUploadFile(null);
        setShowAgreeModal(false);
        setAgreeData(null);
        setAgreeBusy(false);
        setAgreeError('');
        setCollectionProject(null);
        setActionError('');
        setToast(null);
        setInventoryItems(null);
        setInventoryFailed(false);
    }, [beginDirectoryLoad, beginStatsLoad, beginTrashLoad, username]);

    useEffect(() => {
        if (!user) {
            setQuota(null);
            setQuotaFailed(false);
            setPerks(null);
            return;
        }
        let stale = false;
        setQuota(null);
        setQuotaFailed(false);
        setPerks(null);
        Promise.allSettled([api.quota(), api.perks()]).then(([quotaResult, perksResult]) => {
            if (stale) return;
            if (quotaResult.status === 'fulfilled') setQuota(quotaResult.value);
            else setQuotaFailed(true);
            if (perksResult.status === 'fulfilled') setPerks(perksResult.value.current || null);
        });
        return () => {
            stale = true;
        };
    }, [usageAttempt, user]);

    useEffect(() => {
        setFeaturedProject(user ? user.featuredProject : '');
    }, [user]);

    const loadStats = useCallback(() => {
        if (!username) {
            setStats(null);
            setStatsFailed(false);
            return;
        }
        const context = accountContextRef.current;
        const fresh = beginStatsLoad();
        setStats(null);
        setStatsFailed(false);
        api.stats()
            .then(fresh(data => {
                if (accountContextRef.current !== context) return;
                if (data && data.stats) setStats(data.stats);
                else setStatsFailed(true);
            }))
            .catch(fresh(() => {
                if (accountContextRef.current === context) setStatsFailed(true);
            }));
    }, [beginStatsLoad, username]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const load = useCallback(() => {
        const fresh = beginProjectLoad();
        allProjectsRequest.current = false;
        setAllProjectsLoading(false);
        if (!user || tab !== 'projects') {
            return;
        }
        setProjects(null);
        setProjectTotal(0);
        setProjectOffset(0);
        setProjectsMoreBusy(false);
        setProjectsMoreFailed(false);
        setFailed(false);
        api.myProjectPage(user.username)
            .then(fresh(data => {
                const page = data.projects || [];
                setProjects(page);
                setProjectTotal(Number.isFinite(data.total) ? data.total : page.length);
                setProjectOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : page.length);
            }))
            .catch(fresh(() => setFailed(true)));
    }, [beginProjectLoad, user, tab]);

    useEffect(() => {
        load();
    }, [load]);

    // Filtering, sorting and searching cover every project, so fetch the
    // rest of the list once instead of page by page.
    const loadAllProjects = useCallback(() => {
        if (!user || allProjectsRequest.current) return;
        const context = accountContextRef.current;
        allProjectsRequest.current = true;
        setAllProjectsLoading(true);
        api.myProjects(user.username)
            .then(data => {
                if (accountContextRef.current !== context || !allProjectsRequest.current) return;
                const all = data.projects || [];
                setProjects(all);
                setProjectTotal(all.length);
                setProjectOffset(all.length);
            })
            .catch(() => {
                if (accountContextRef.current === context) setProjectsMoreFailed(true);
            })
            .finally(() => {
                if (accountContextRef.current === context) setAllProjectsLoading(false);
            });
    }, [user]);

    const loadInventory = useCallback(() => {
        if (!user || tab !== 'inventory') return;
        const context = accountContextRef.current;
        setInventoryItems(null);
        setInventoryFailed(false);
        api.gameInventory()
            .then(result => {
                if (accountContextRef.current === context) {
                    setInventoryItems((result.inventory && result.inventory.items) || []);
                }
            })
            .catch(() => {
                if (accountContextRef.current === context) setInventoryFailed(true);
            });
    }, [tab, user]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const loadTrash = useCallback(() => {
        if (!user || tab !== 'trash') return;
        const fresh = beginTrashLoad();
        setTrashedProjects(null);
        setTrashFailed(false);
        api.trash()
            .then(fresh(data => setTrashedProjects(data.projects || [])))
            .catch(fresh(() => setTrashFailed(true)));
    }, [beginTrashLoad, tab, user]);

    useEffect(() => {
        if (tab === 'trash') loadTrash();
        else beginTrashLoad();
    }, [beginTrashLoad, loadTrash, tab]);

    const refreshUsage = useCallback(() => {
        if (!user) return;
        const context = accountContextRef.current;
        api.quota()
            .then(data => {
                if (accountContextRef.current === context) {
                    setQuota(data);
                    setQuotaFailed(false);
                }
            })
            .catch(() => {
                if (accountContextRef.current === context) setQuotaFailed(true);
            });
        api.stats()
            .then(data => {
                if (accountContextRef.current === context) setStats(data.stats || null);
            })
            .catch(() => {});
    }, [user]);

    const restoreProjects = async (list, {fromTrash = false} = {}) => {
        const context = accountContextRef.current;
        const actionKey = beginAccountAction('restore');
        if (!actionKey) return;
        const restored = [];
        if (fromTrash) setTrashBusy(`restore:${list[0].id}`);
        setActionError('');
        try {
            for (const project of list) {
                try {
                    await api.restoreProject(project.id);
                    restored.push(project);
                } catch (e) {
                    if (accountContextRef.current === context) {
                        setActionError(e.message || 'Could not restore this project.');
                    }
                }
                if (accountContextRef.current !== context) return;
            }
            if (!restored.length) return;
            const ids = new Set(restored.map(project => project.id));
            setTrashedProjects(current => (current ? current.filter(project => !ids.has(project.id)) : current));
            if (tab === 'projects') load();
            refreshUsage();
            say(restored.length === 1 ?
                communityText('Restored “{value1}”.', {value1: restored[0].title}) :
                communityText('Restored {value1} projects.', {value1: restored.length}));
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context && fromTrash) setTrashBusy('');
        }
    };

    const purgeTrashedProject = async project => {
        const context = accountContextRef.current;
        const actionKey = beginAccountAction(`trash:purge:${project.id}`);
        if (!actionKey) return;
        setTrashBusy(`purge:${project.id}`);
        setPurgeError('');
        try {
            await api.purgeProject(project.id);
            if (accountContextRef.current === context) {
                setTrashedProjects(current => removeProjectById(current, project.id));
                setPurgeConfirmProject(null);
                refreshUsage();
                say(communityText('Deleted “{value1}” forever.', {value1: project.title}));
            }
        } catch (e) {
            if (accountContextRef.current === context) {
                setPurgeError(e.message || 'Could not permanently delete this project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) setTrashBusy('');
        }
    };

    const emptyTrash = async () => {
        const context = accountContextRef.current;
        const actionKey = beginAccountAction('trash:empty');
        if (!actionKey) return;
        const list = trashedProjects || [];
        setTrashBusy('empty');
        setEmptyTrashError('');
        let deleted = 0;
        try {
            for (const project of list) {
                try {
                    await api.purgeProject(project.id);
                    deleted += 1;
                    if (accountContextRef.current !== context) return;
                    setTrashedProjects(current => removeProjectById(current, project.id));
                } catch (e) {
                    if (accountContextRef.current === context) {
                        setEmptyTrashError(e.message || 'Could not permanently delete this project.');
                    }
                    return;
                }
            }
            setEmptyTrashConfirm(false);
            say(communityText('Deleted {value1} projects forever.', {value1: deleted}));
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) {
                setTrashBusy('');
                if (deleted) refreshUsage();
            }
        }
    };

    const loadMoreProjects = async () => {
        if (!user || projectsMoreBusy || projectOffset >= projectTotal) return;
        const context = accountContextRef.current;
        setProjectsMoreBusy(true);
        setProjectsMoreFailed(false);
        try {
            const data = await api.myProjectPage(user.username, {offset: projectOffset, limit: 24});
            if (accountContextRef.current !== context) return;
            setProjects(current => {
                const byId = new Map((current || []).map(project => [project.id, project]));
                for (const project of data.projects || []) byId.set(project.id, project);
                return Array.from(byId.values());
            });
            setProjectTotal(Number.isFinite(data.total) ? data.total : projectTotal);
            setProjectOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : projectOffset + 24);
        } catch (e) {
            if (accountContextRef.current === context) setProjectsMoreFailed(true);
        } finally {
            if (accountContextRef.current === context) setProjectsMoreBusy(false);
        }
    };

    const loadDirectories = useCallback(() => {
        const fresh = beginDirectoryLoad();
        setDirectoriesLoading(true);
        setSpacesFailed(false);
        api.mySpaces().then(fresh(spacesResult => {
            setMySpaces(spacesResult.spaces || []);
            setDirectoriesLoading(false);
        })).catch(fresh(() => {
            setSpacesFailed(true);
            setDirectoriesLoading(false);
        }));
    }, [beginDirectoryLoad]);

    const loadLibrary = useCallback(() => {
        if (!user || tab !== 'library') return;
        const context = accountContextRef.current;
        setLibraryProjects(null);
        setLibraryFailed(false);
        api.library().then(data => {
            if (accountContextRef.current !== context) return;
            const items = data.projects || [];
            setLibraryProjects(items);
            setLibraryTotal(Number.isFinite(data.total) ? data.total : items.length);
            setLibraryOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : items.length);
        }).catch(() => {
            if (accountContextRef.current === context) setLibraryFailed(true);
        });
    }, [tab, user]);

    useEffect(() => {
        loadLibrary();
    }, [loadLibrary]);

    useEffect(() => {
        if (!user || !['collections', 'spaces'].includes(tab)) return;
        if (directoriesLoading || spacesFailed || mySpaces !== null) return;
        loadDirectories();
    }, [directoriesLoading, loadDirectories, mySpaces, spacesFailed, tab, user]);

    const retryDirectories = () => {
        setMySpaces(null);
        loadDirectories();
    };

    const retryLibrary = () => {
        setLibraryProjects(null);
        setLibraryTotal(0);
        setLibraryOffset(0);
        loadLibrary();
    };

    const loadMoreLibrary = async () => {
        if (libraryBusy || libraryOffset >= libraryTotal) return;
        const context = accountContextRef.current;
        setLibraryBusy(true);
        setLibraryVisibilityError('');
        try {
            const data = await api.library({offset: libraryOffset, limit: 24});
            if (accountContextRef.current !== context) return;
            setLibraryProjects(current => {
                const byId = new Map((current || []).map(project => [project.id, project]));
                for (const project of data.projects || []) byId.set(project.id, project);
                return Array.from(byId.values());
            });
            setLibraryTotal(Number.isFinite(data.total) ? data.total : libraryTotal);
            setLibraryOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : libraryOffset + 24);
        } catch (e) {
            if (accountContextRef.current === context) {
                setLibraryVisibilityError(e.message || 'Could not load more library games.');
            }
        } finally {
            if (accountContextRef.current === context) setLibraryBusy(false);
        }
    };

    const changeLibraryProjectVisibility = async project => {
        const actionKey = beginAccountAction(`library-visibility:${project.id}`);
        if (!actionKey) return;
        const context = accountContextRef.current;
        const nextPublic = project.libraryPublic === false;
        setLibraryVisibilityBusy(project.id);
        setLibraryVisibilityError('');
        try {
            const result = await api.setLibraryProjectVisibility(project.id, nextPublic);
            if (accountContextRef.current !== context) return;
            const libraryPublic = result.public !== false;
            const updateVisibility = item => {
                if (item.id !== project.id) return item;
                return {...item, libraryPublic};
            };
            setLibraryProjects(current => (current || []).map(updateVisibility));
            say(libraryPublic ?
                communityText('“{value1}” shows in your public library again.', {value1: project.title}) :
                communityText('“{value1}” is hidden from your public library.', {value1: project.title}), {
                handleAction: () => changeLibraryProjectVisibility({...project, libraryPublic})
            });
        } catch (e) {
            if (accountContextRef.current === context) {
                setLibraryVisibilityError(e.message || 'Could not update this library item.');
            }
        } finally {
            if (accountContextRef.current === context) setLibraryVisibilityBusy('');
            releaseAccountAction(actionKey);
        }
    };

    const removeLibraryProject = async project => {
        const actionKey = beginAccountAction(`library-remove:${project.id}`);
        if (!actionKey) return;
        const context = accountContextRef.current;
        setLibraryVisibilityBusy(project.id);
        setLibraryVisibilityError('');
        try {
            await api.unsaveProject(project.id);
            if (accountContextRef.current !== context) return;
            setLibraryProjects(current => (current || []).filter(item => item.id !== project.id));
            setLibraryTotal(total => Math.max(0, total - 1));
            setLibraryOffset(offset => Math.max(0, offset - 1));
            say(communityText('Removed “{value1}” from your library.', {value1: project.title}), {
                handleAction: () => {
                    setToast(null);
                    api.saveProject(project.id)
                        .then(() => {
                            if (accountContextRef.current !== context) return;
                            loadLibrary();
                            say(communityText('Put “{value1}” back in your library.', {value1: project.title}));
                        })
                        .catch(e => {
                            if (accountContextRef.current === context) {
                                setLibraryVisibilityError(e.message || 'Could not save this game to your library.');
                            }
                        });
                }
            });
        } catch (e) {
            if (accountContextRef.current === context) {
                setLibraryVisibilityError(e.message || 'Could not remove this game from your library.');
            }
        } finally {
            if (accountContextRef.current === context) setLibraryVisibilityBusy('');
            releaseAccountAction(actionKey);
        }
    };

    // Share or unshare, then say so with a way back.
    const toggleShared = async project => {
        const actionKey = beginAccountAction(`visibility:${project.id}`);
        if (!actionKey) return;
        const context = accountContextRef.current;
        const sharing = !project.shared;
        markBusy([project.id], true);
        setActionError('');
        try {
            const data = sharing ? await api.publish(project.id) : await api.unpublish(project.id);
            if (accountContextRef.current !== context) return;
            const updated = data.project || {...project, shared: sharing, visibility: sharing ? 'public' : 'private'};
            setProjects(current => replaceProjectById(current, updated));
            if (!sharing && featuredProject === project.id) setFeaturedProject('');
            refreshUsage();
            say(sharing ?
                communityText('Shared “{value1}”. Anyone can find and play it now.', {value1: project.title}) :
                communityText('Unshared “{value1}”. It is a draft again.', {value1: project.title}), {
                handleAction: () => {
                    setToast(null);
                    toggleShared(updated);
                }
            });
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || (sharing ? 'Could not share this project.' : 'Could not unshare this project.'));
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) markBusy([project.id], false);
        }
    };

    // Trash is recoverable, so this acts at once and offers the way back
    // rather than asking first.
    const trashProjects = async list => {
        const actionKey = beginAccountAction('trash');
        if (!actionKey) return;
        const context = accountContextRef.current;
        const moved = [];
        let lastError = null;
        markBusy(list.map(project => project.id), true);
        setActionError('');
        try {
            for (const project of list) {
                try {
                    await api.deleteProject(project.id);
                    if (accountContextRef.current !== context) return;
                    moved.push(project);
                    setProjects(current => removeProjectById(current, project.id));
                    setProjectTotal(total => Math.max(0, total - 1));
                    setProjectOffset(offset => Math.max(0, offset - 1));
                    if (featuredProject === project.id) setFeaturedProject('');
                } catch (e) {
                    lastError = e;
                }
            }
            if (moved.length) refreshUsage();
            if (lastError) {
                setActionError(moved.length ?
                    communityText('Moved {value1} of {value2} projects to Trash. {value3}', {
                        value1: moved.length,
                        value2: list.length,
                        value3: lastError.message || ''
                    }) :
                    lastError.message || 'Could not move this project to Trash.');
            }
            if (!moved.length) return;
            say(moved.length === 1 ?
                communityText('Moved “{value1}” to Trash.', {value1: moved[0].title}) :
                communityText('Moved {value1} projects to Trash.', {value1: moved.length}), {
                handleAction: () => {
                    setToast(null);
                    restoreProjects(moved);
                }
            });
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) markBusy(list.map(project => project.id), false);
        }
    };

    const toggleFeatured = async project => {
        const id = project.id;
        const actionKey = beginAccountAction('feature');
        if (!actionKey) return;
        const context = accountContextRef.current;
        const previous = featuredProject;
        const next = featuredProject === id ? '' : id;
        markBusy([id], true);
        try {
            setActionError('');
            await api.updateProfile({featuredProject: next});
            if (accountContextRef.current !== context) return;
            setFeaturedProject(next);
            say(next ?
                communityText('“{value1}” is featured on your profile.', {value1: project.title}) :
                communityText('“{value1}” is no longer featured on your profile.', {value1: project.title}), {
                handleAction: () => {
                    setToast(null);
                    api.updateProfile({featuredProject: previous})
                        .then(() => {
                            if (accountContextRef.current === context) setFeaturedProject(previous);
                        })
                        .catch(e => {
                            if (accountContextRef.current === context) {
                                setActionError(e.message || 'Could not update the featured project.');
                            }
                        });
                }
            });
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || 'Could not update the featured project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) markBusy([id], false);
        }
    };

    const createFromSb3 = useCallback(async (file, onUploadProgress) => {
        let created;
        try {
            created = await api.createProject({title: file.name.replace(/\.sb3$/i, '') || 'Untitled'});
            let uploadFile = file;
            try {
                uploadFile = await api.prepareSparseProjectUpload(created.id, file);
            } catch (e) {
                // The server can still validate and store the original archive if sparse preparation fails.
            }
            await api.uploadProject(created.id, uploadFile, null, onUploadProgress);
            return created;
        } catch (e) {
            if (created && e.code !== 'upload_processing_timeout') {
                await api.deleteProject(created.id).catch(() => {});
            }
            throw e;
        }
    }, []);

    const sayUploaded = (file, created) => {
        const title = (created && created.title) || file.name.replace(/\.sb3$/i, '');
        say(communityText('Uploaded “{value1}”. It stays a draft until you share it.', {value1: title}), created && created.id ? {
            actionLabel: communityText('Open in editor'),
            handleAction: () => window.location.assign(editorUrl({platformProject: created.id}))
        } : null);
    };

    const uploadSb3 = async event => {
        const file = event.target.files[0];
        const context = accountContextRef.current;
        event.target.value = '';
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.sb3')) {
            setActionError('Choose a Scratch .sb3 project file.');
            return;
        }
        if (storageFull(quota)) {
            setActionError(quota.shared ?
                'Your Rotur storage is full. Delete projects or backpack items you no longer need and empty the trash, or get more storage with a Rotur membership at rotur.dev/membership.' :
                'Your storage is full. Delete projects you no longer need and empty them from the trash before uploading.');
            return;
        }
        const actionKey = beginAccountAction('upload');
        if (!actionKey) return;

        setActionError('');
        setUploading(true);
        setUploadStatus('Uploading…');

        // Check agreement acceptance before allowing upload, show modal if needed
        try {
            const agreementData = await api.agreement();
            if (accountContextRef.current !== context) {
                releaseAccountAction(actionKey);
                return;
            }
            const ag = agreementData.agreement;
            if (ag.version > 0 && !ag.accepted) {
                setAgreeData(ag);
                setPendingUploadFile(file);
                setShowAgreeModal(true);
                setUploading(false);
                setUploadStatus('');
                releaseAccountAction(actionKey);
                return;
            }
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError('Could not check the community agreement. Try the upload again.');
                setUploading(false);
                setUploadStatus('');
            }
            releaseAccountAction(actionKey);
            return;
        }

        try {
            const created = await createFromSb3(file, (loaded, total) => {
                if (accountContextRef.current === context) {
                    setUploadStatus(uploadProgressLabel(loaded, total));
                }
            });
            if (accountContextRef.current !== context) return;
            setTab('projects');
            load();
            sayUploaded(file, created);
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || 'Could not upload that project.');
                if (shouldRefreshProjectsAfterUploadError(e)) {
                    setTab('projects', {preserveError: true});
                    load();
                }
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) {
                setUploading(false);
                setUploadStatus('');
            }
        }
    };

    const confirmAgreeAndUpload = useCallback(async () => {
        const actionKey = beginAccountAction('upload');
        if (!actionKey) return;
        const context = accountContextRef.current;
        setAgreeBusy(true);
        setAgreeError('');
        let agreementAccepted = false;
        try {
            await api.acceptAgreement();
            if (accountContextRef.current !== context) return;
            agreementAccepted = true;
            // Now proceed with the stored upload
            const file = pendingUploadFile;
            setPendingUploadFile(null);
            setShowAgreeModal(false);
            setAgreeData(null);
            // Run the upload
            setActionError('');
            setUploading(true);
            setUploadStatus('Uploading…');
            if (!file) throw new Error('Choose the project file again.');
            const created = await createFromSb3(file, (loaded, total) => {
                if (accountContextRef.current === context) {
                    setUploadStatus(uploadProgressLabel(loaded, total));
                }
            });
            if (accountContextRef.current !== context) return;
            setTab('projects');
            load();
            sayUploaded(file, created);
        } catch (e) {
            if (accountContextRef.current === context) {
                const target = uploadErrorTarget(agreementAccepted, e);
                if (target.actionError) setActionError(target.actionError);
                if (target.agreementError) setAgreeError(target.agreementError);
                if (agreementAccepted && shouldRefreshProjectsAfterUploadError(e)) {
                    setTab('projects', {preserveError: true});
                    load();
                }
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) {
                setAgreeBusy(false);
                setUploading(false);
                setUploadStatus('');
            }
        }
    }, [pendingUploadFile, load, createFromSb3]);

    const cancelAgreeModal = useCallback(() => {
        setPendingUploadFile(null);
        setShowAgreeModal(false);
        setAgreeData(null);
        setAgreeError('');
    }, []);
    const purgeBusy = purgeConfirmProject && trashBusy === `purge:${purgeConfirmProject.id}`;
    const purgeDetails = purgeConfirmProject ? trashPurgeConfirmation(purgeConfirmProject) : null;
    const dismissPurgeConfirm = useCallback(() => {
        if (!trashBusy) {
            setPurgeConfirmProject(null);
            setPurgeError('');
        }
    }, [trashBusy]);
    const chooseUpload = () => uploadInput.current && uploadInput.current.click();

    if (loading) {
        return <main className={styles.page}><StatusMessage /></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <SignInPrompt onSignIn={login}>{communityText('Sign in to see your projects.')}</SignInPrompt>
            </main>
        );
    }

    let content;
    if (tab === 'overview') {
        content = (
            <MyStuffOverview
                stats={stats}
                statsFailed={statsFailed}
                quota={quota}
                username={username}
                onRetryStats={loadStats}
            />
        );
    } else if (tab === 'shared') {
        content = <SharedProjects key={username} />;
    } else if (tab === 'library') {
        content = (
            <MyStuffLibrary
                projects={libraryProjects || []}
                total={libraryTotal}
                loading={libraryProjects === null && !libraryFailed}
                error={libraryFailed}
                hasMore={libraryOffset < libraryTotal}
                moreBusy={libraryBusy}
                actionBusy={libraryVisibilityBusy}
                actionError={libraryVisibilityError}
                onRetry={retryLibrary}
                onLoadMore={loadMoreLibrary}
                onChangeVisibility={changeLibraryProjectVisibility}
                onRemove={removeLibraryProject}
            />
        );
    } else if (tab === 'uploads') {
        content = (
            <MyStuffStorage
                error={quotaFailed}
                quota={quota}
                perks={perks}
                onRetry={() => setUsageAttempt(value => value + 1)}
            />
        );
    } else if (tab === 'agreement') {
        content = <AgreementTab key={username} />;
    } else if (tab === 'themes') {
        content = <MyStuffThemes username={username} />;
    } else if (tab === 'inventory') {
        content = <Inventory items={inventoryItems} error={inventoryFailed} onRetry={loadInventory} />;
    } else if (tab === 'trash') {
        content = (
            <MyStuffTrash
                projects={trashedProjects}
                failed={trashFailed}
                busy={trashBusy}
                onRetry={loadTrash}
                onRestore={project => restoreProjects([project], {fromTrash: true})}
                onPurge={project => {
                    setPurgeError('');
                    setPurgeConfirmProject(project);
                }}
                onEmpty={() => {
                    setEmptyTrashError('');
                    setEmptyTrashConfirm(true);
                }}
            />
        );
    } else if (tab === 'collections' || tab === 'spaces') {
        content = (
            <MyStuffSpaces
                key={tab}
                mode={tab}
                spaces={mySpaces}
                error={spacesFailed}
                onRetry={retryDirectories}
            />
        );
    } else {
        content = (
            <section>
                <SectionHeading
                    title={communityText('My projects')}
                    actions={projectTotal ? (
                        <span className={styles.count}>
                            {projectTotal === 1 ? communityText('1 project') : communityText('{value1} projects', {value1: projectTotal})}
                        </span>
                    ) : null}
                />
                <MyStuffProjects
                    projects={projects}
                    failed={failed}
                    hasMore={projectOffset < projectTotal}
                    moreBusy={projectsMoreBusy}
                    moreFailed={projectsMoreFailed}
                    allLoading={allProjectsLoading}
                    busyIds={busyProjects}
                    featuredProject={featuredProject}
                    show={projectShow}
                    sort={projectSort}
                    onShowChange={value => setProjectParam('show', value, 'all')}
                    onSortChange={value => setProjectParam('sort', value, 'edited')}
                    onRetry={load}
                    onLoadMore={loadMoreProjects}
                    onNeedAll={loadAllProjects}
                    onShare={toggleShared}
                    onFeature={toggleFeatured}
                    onTrash={trashProjects}
                    onCollection={setCollectionProject}
                    onUpload={chooseUpload}
                />
            </section>
        );
    }

    return (
        <main className={styles.page}>
            <PageHeader
                compact
                className={styles.header}
                title={communityText('My stuff')}
                actions={(
                    <React.Fragment>
                        <input
                            ref={uploadInput}
                            className={styles.hiddenInput}
                            type="file"
                            accept=".sb3,application/x.scratch.sb3"
                            onChange={uploadSb3}
                        />
                        <Button
                            busy={uploading}
                            busyLabel={uploadStatus || communityText('Uploading…')}
                            onClick={chooseUpload}
                            title={communityText('Upload .sb3')}
                        >
                            <Upload size={16} aria-hidden="true" />
                            <span className={styles.uploadLabel}>{communityText('Upload .sb3')}</span>
                        </Button>
                        <Button as="a" variant="primary" href={editorUrl()}>
                            <Plus size={16} />{communityText('New project')}</Button>
                    </React.Fragment>
                )}
            />

            {showAgreeModal && agreeData ? (
                <Modal
                    className={styles.agreeModal}
                    title={communityText('Upload agreement v{value1}', {value1: agreeData.version})}
                    onClose={cancelAgreeModal}
                    dismissDisabled={agreeBusy}
                    actions={(
                        <React.Fragment>
                            <Button
                                onClick={cancelAgreeModal}
                                disabled={agreeBusy}
                            >{communityText('Cancel')}</Button>
                            <Button
                                variant="primary"
                                onClick={confirmAgreeAndUpload}
                                busy={agreeBusy}
                                busyLabel={communityText('Accepting…')}
                            >
                                {communityText('Accept v{value1} & upload', {value1: agreeData.version})}
                            </Button>
                        </React.Fragment>
                    )}
                >
                    <div className={styles.agreeModalBody}>
                        <Markdown className={styles.agreementText}>{agreeData.text}</Markdown>
                    </div>
                    {agreeError ? <Notice variant="error">{agreeError}</Notice> : null}
                    <p className={styles.agreementPrompt}>{communityText('You must accept this agreement before you can upload projects.')}</p>
                </Modal>
            ) : null}

            {purgeConfirmProject ? (
                <ConfirmModal
                    destructive
                    icon={Trash2}
                    title={purgeDetails.title}
                    confirmLabel={purgeDetails.action}
                    busy={Boolean(purgeBusy)}
                    busyLabel={communityText('Deleting…')}
                    error={purgeError}
                    onConfirm={() => purgeTrashedProject(purgeConfirmProject)}
                    onCancel={dismissPurgeConfirm}
                >
                    {purgeDetails.body}
                </ConfirmModal>
            ) : null}

            {emptyTrashConfirm ? (
                <ConfirmModal
                    destructive
                    icon={Trash2}
                    title={communityText('Empty Trash?')}
                    confirmLabel={communityText('Delete forever')}
                    busy={trashBusy === 'empty'}
                    busyLabel={communityText('Deleting…')}
                    error={emptyTrashError}
                    onConfirm={emptyTrash}
                    onCancel={() => {
                        if (!trashBusy) setEmptyTrashConfirm(false);
                    }}
                >
                    {communityText('Permanently delete {value1} projects in the trash? This cannot be undone.', {value1: (trashedProjects || []).length})}
                </ConfirmModal>
            ) : null}

            <div className={styles.layout}>
                <MyStuffNav
                    active={tab}
                    onFollow={() => setActionError('')}
                    onNavigate={key => {
                        if (key !== tab) setTab(key);
                    }}
                />
                <div className={styles.content}>
                    {actionError ? (
                        <Notice variant="error" className={styles.pageNotice} onDismiss={() => setActionError('')}>{actionError}</Notice>
                    ) : null}
                    {tab === 'overview' || tab === 'projects' ? (
                        <StorageWarning quota={quota} className={styles.pageNotice} />
                    ) : null}
                    {content}
                </div>
            </div>
            {collectionProject ? (
                <CollectionSaveModal
                    project={collectionProject}
                    onClose={() => setCollectionProject(null)}
                />
            ) : null}
            {toast ? (
                <Toast
                    key={toast.id}
                    actionLabel={toast.actionLabel}
                    onAction={toast.handleAction}
                    onDismiss={dismissToast}
                >{toast.message}</Toast>
            ) : null}
        </main>
    );
};

export {
    getMyStuffSection,
    normalizeMyStuffParams,
    removeProjectById,
    replaceProjectById,
    shouldRefreshProjectsAfterUploadError,
    trashPurgeConfirmation,
    uploadErrorTarget,
    uploadProgressLabel
};
export default MyStuff;
