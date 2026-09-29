import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {Archive, ArrowUpCircle, Building2, ClipboardList, CreditCard, GraduationCap, Images, KeyRound, LogIn, Plus, School, Users} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {formatBytes, formatDate} from '../format.js';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import UsageMeter from '../components/classroom/UsageMeter.jsx';
import StudentHome from '../components/classroom/StudentHome.jsx';
import styles from './Classroom.module.css';

const TIER_LABELS = {
    classroom: {label: 'Classroom plan'},
    school: {label: 'School plan'},
    trial: {label: 'Trial plan'}
};

const tierLabel = tier => (TIER_LABELS[tier] ? TIER_LABELS[tier].label : 'Classroom plan');

const LOGIN_MODES = [
    {key: 'password', label: 'Password', Icon: KeyRound, description: 'Each student types a short password made of words.'},
    {key: 'picture', label: 'Pictures', Icon: Images, description: 'Each student taps three pictures in order, which suits younger children.'}
];

const sortClasses = classes => [...classes].sort((a, b) => {
    if (Boolean(a.archived) !== Boolean(b.archived)) return a.archived ? 1 : -1;
    return String(a.name).localeCompare(String(b.name));
});

const notEnabled = error => Boolean(error) && [402, 403, 404].includes(error.status);

const SEAT_PACK_CHOICES = [1, 2, 3, 5, 10];

const UpgradeModal = ({billing, onClose}) => {
    const {text: communityText} = useCommunityText();
    const [packs, setPacks] = useState(1);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const packSize = Number(billing.seatPackSize) || 10;
    const checkout = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            const data = await api.classroom.billingCheckout(packs);
            if (!data.url) throw new Error(communityText('Checkout could not be started.'));
            window.location.href = data.url;
        } catch (e) {
            setError(e.message || communityText('Checkout could not be started.'));
            setBusy(false);
        }
    };
    return (
        <Modal
            title={communityText('Upgrade to Classroom')}
            icon={ArrowUpCircle}
            onClose={onClose}
            dismissDisabled={busy}
            actions={(
                <React.Fragment>
                    <Button onClick={onClose} disabled={busy}>{communityText('Cancel')}</Button>
                    <Button variant="primary" onClick={checkout} busy={busy} busyLabel={communityText('Opening checkout…')}>
                        <CreditCard size={16} aria-hidden="true" />
                        {communityText('Continue to checkout')}
                    </Button>
                </React.Fragment>
            )}
        >
            <p className={styles.hint}>{communityText('Seats come in packs of {value1}. Pick how many packs your classes need. You can change this later from Manage billing.', {value1: packSize})}</p>
            <fieldset className={styles.choices}>
                <legend>{communityText('Seat packs')}</legend>
                <div className={styles.packChoices}>
                    {SEAT_PACK_CHOICES.map(count => (
                        <label key={count} className={packs === count ? styles.choiceActive : styles.choice}>
                            <input type="radio" name="seatPacks" value={count} checked={packs === count} onChange={() => setPacks(count)} />
                            <span>
                                <strong>{communityText('{value1, plural, one {# pack} other {# packs}}', {value1: count})}</strong>
                                <small>{communityText('{value1, plural, one {# seat} other {# seats}}', {value1: count * packSize})}</small>
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>
            {error ? <Notice variant="error">{error}</Notice> : null}
        </Modal>
    );
};

const BillingActions = ({billing, school}) => {
    const {text: communityText} = useCommunityText();
    const [upgrading, setUpgrading] = useState(false);
    const [portalBusy, setPortalBusy] = useState(false);
    const [error, setError] = useState('');
    const openPortal = async () => {
        if (portalBusy) return;
        setPortalBusy(true);
        setError('');
        try {
            const data = await api.classroom.billingPortal();
            if (!data.url) throw new Error(communityText('Billing could not be opened.'));
            window.location.href = data.url;
        } catch (e) {
            setError(e.message || communityText('Billing could not be opened.'));
            setPortalBusy(false);
        }
    };
    if (school) {
        return (
            <p className={styles.planManaged}>
                <Building2 size={15} aria-hidden="true" />
                {communityText('Managed by {value1}.', {value1: school.name})}
            </p>
        );
    }
    if (!billing) return null;
    return (
        <div className={styles.planActions}>
            {billing.canManage ? (
                <Button onClick={openPortal} busy={portalBusy} busyLabel={communityText('Opening…')}>
                    <CreditCard size={15} aria-hidden="true" />
                    {communityText('Manage billing')}
                </Button>
            ) : null}
            {!billing.canManage && billing.available ? (
                <Button variant="primary" onClick={() => setUpgrading(true)}>
                    <ArrowUpCircle size={15} aria-hidden="true" />
                    {communityText('Upgrade')}
                </Button>
            ) : null}
            {!billing.canManage && !billing.available ? (
                <Notice className={styles.planNotice}>
                    {communityText('Plan changes are handled by our team.')}
                    {' '}
                    <Link to="/support">{communityText('Contact support to add seats or upgrade.')}</Link>
                </Notice>
            ) : null}
            {error ? <Notice variant="error">{error}</Notice> : null}
            {upgrading ? <UpgradeModal billing={billing} onClose={() => setUpgrading(false)} /> : null}
        </div>
    );
};

const NewClassModal = ({onClose, onCreated}) => {
    const {text: communityText} = useCommunityText();
    const [name, setName] = useState('');
    const [loginMode, setLoginMode] = useState('password');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const submit = async event => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed || busy) return;
        setBusy(true);
        setError('');
        try {
            const data = await api.classroom.createClass({name: trimmed, loginMode});
            onCreated(data.class);
        } catch (e) {
            setError(e.message || communityText('Could not create the class.'));
            setBusy(false);
        }
    };
    return (
        <Modal title={communityText('New class')} icon={School} onClose={onClose} dismissDisabled={busy}>
            <form className={styles.form} onSubmit={submit}>
                <label className={styles.field}>
                    <span>{communityText('Class name')}</span>
                    <input
                        value={name}
                        maxLength={80}
                        autoFocus
                        placeholder={communityText('Year 5 Coding Club')}
                        onChange={event => setName(event.target.value)}
                    />
                </label>
                <fieldset className={styles.choices}>
                    <legend>{communityText('Sign-in method')}</legend>
                    <div>
                        {LOGIN_MODES.map(mode => (
                            <label key={mode.key} className={loginMode === mode.key ? styles.choiceActive : styles.choice}>
                                <input
                                    type="radio"
                                    name="loginMode"
                                    value={mode.key}
                                    checked={loginMode === mode.key}
                                    onChange={() => setLoginMode(mode.key)}
                                />
                                <mode.Icon size={18} aria-hidden="true" />
                                <span>
                                    <strong>{communityText(mode.label)}</strong>
                                    <small>{communityText(mode.description)}</small>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                {error ? <Notice variant="error">{error}</Notice> : null}
                <div className={styles.formActions}>
                    <Button onClick={onClose} disabled={busy}>{communityText('Cancel')}</Button>
                    <Button type="submit" variant="primary" disabled={!name.trim()} busy={busy} busyLabel={communityText('Creating…')}>
                        <Plus size={16} aria-hidden="true" />
                        {communityText('Create class')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const ClassCard = ({item}) => {
    const {text: communityText} = useCommunityText();
    const Mode = item.loginMode === 'picture' ? Images : KeyRound;
    return (
        <Link to={`/classroom/${item.id}`} className={item.archived ? styles.classCardArchived : styles.classCard}>
            <span className={styles.classCardTop}>
                <span className={styles.classIcon}><School size={20} aria-hidden="true" /></span>
                <span className={styles.classChips}>
                    {item.isOwner ? null : <span className={styles.chip}>{communityText('Co-teacher')}</span>}
                    {item.archived ? <span className={styles.chip}><Archive size={12} aria-hidden="true" />{communityText('Archived')}</span> : null}
                </span>
            </span>
            <strong className={styles.classTitle}>{item.name}</strong>
            <span className={styles.classMeta}>
                <span><Users size={14} aria-hidden="true" />{communityText('{value1, plural, one {# student} other {# students}}', {value1: item.studentCount || 0})}</span>
                <span><ClipboardList size={14} aria-hidden="true" />{communityText('{value1, plural, one {# assignment} other {# assignments}}', {value1: item.assignmentCount || 0})}</span>
                <span><Mode size={14} aria-hidden="true" />{item.loginMode === 'picture' ? communityText('Picture sign-in') : communityText('Password sign-in')}</span>
            </span>
        </Link>
    );
};

const TeacherDashboard = ({billingOutcome, data, onDismissBilling, onReload}) => {
    const {text: communityText} = useCommunityText();
    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);
    const plan = data.plan || {};
    const usage = data.usage || {};
    const school = data.school || null;
    const classes = sortClasses(data.classes || []);
    const classLimitReached = Number(plan.maxClasses) > 0 && Number(usage.classes || classes.length) >= Number(plan.maxClasses);
    const newClassButton = (
        <Button variant="primary" onClick={() => setCreating(true)} disabled={classLimitReached}>
            <Plus size={16} aria-hidden="true" />
            {communityText('New class')}
        </Button>
    );
    return (
        <main className={styles.page}>
            <PageHeader
                icon={GraduationCap}
                title={communityText('Classroom')}
                lead={communityText('Create classes, add students, and set assignments.')}
                actions={newClassButton}
            />
            {billingOutcome === 'success' ? (
                <Notice variant="success" className={styles.noticeBefore} onDismiss={onDismissBilling}>
                    {communityText('Thanks, your plan is updated. New seats can take a minute to show up.')}
                </Notice>
            ) : null}
            {billingOutcome === 'cancelled' ? (
                <Notice className={styles.noticeBefore} onDismiss={onDismissBilling}>
                    {communityText('Checkout was cancelled and nothing was charged.')}
                </Notice>
            ) : null}
            <section className={styles.planCard} aria-label={communityText('Plan summary')}>
                <div className={styles.planTier}>
                    <span className={styles.planTierName}>{communityText(tierLabel(plan.tier))}</span>
                    {plan.expiresAt ? <span className={styles.planTierMeta}>{communityText('Renews on {value1}.', {value1: formatDate(plan.expiresAt)})}</span> : null}
                    {school && school.isAdmin ? (
                        <Link to="/classroom/school" className={styles.inlineLink}>
                            <Building2 size={14} aria-hidden="true" />
                            {communityText('Manage the school')}
                        </Link>
                    ) : null}
                    <BillingActions billing={data.billing} school={school} />
                </div>
                <div className={styles.planMeters}>
                    <UsageMeter
                        label={communityText('Seats')}
                        used={Number(usage.seats) || 0}
                        total={Number(plan.seats) || 0}
                        valueLabel={communityText('{value1} of {value2}', {value1: Number(usage.seats) || 0, value2: Number(plan.seats) || 0})}
                    />
                    <UsageMeter
                        label={communityText('Storage')}
                        used={Number(usage.storageBytes) || 0}
                        total={Number(plan.storageBytes) || 0}
                        valueLabel={communityText('{value1} of {value2}', {value1: formatBytes(usage.storageBytes), value2: formatBytes(plan.storageBytes)})}
                    />
                    <UsageMeter
                        label={communityText('Classes')}
                        used={Number(usage.classes) || classes.length}
                        total={Number(plan.maxClasses) || 0}
                        valueLabel={communityText('{value1} of {value2}', {value1: Number(usage.classes) || classes.length, value2: Number(plan.maxClasses) || 0})}
                    />
                </div>
            </section>
            <SectionHeading icon={School} title={communityText('Classes')} count={classes.length} />
            {classes.length ? (
                <CardGrid min={260}>
                    {classes.map(item => <ClassCard key={item.id} item={item} />)}
                </CardGrid>
            ) : (
                <EmptyState icon={School} title={communityText('No classes yet')} action={newClassButton}>
                    {communityText('Create your first class to add students and print their login cards.')}
                </EmptyState>
            )}
            {classLimitReached ? (
                <Notice className={styles.noticeAfter}>
                    {communityText('Your plan allows {value1, plural, one {# class} other {# classes}}. Archive or delete a class to make room for another.', {value1: Number(plan.maxClasses) || 0})}
                </Notice>
            ) : null}
            {creating ? (
                <NewClassModal
                    onClose={() => setCreating(false)}
                    onCreated={created => {
                        setCreating(false);
                        onReload();
                        navigate(`/classroom/${created.id}`);
                    }}
                />
            ) : null}
        </main>
    );
};

const Classroom = () => {
    const {text: communityText} = useCommunityText();
    const {user, loading, login} = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const [billingOutcome, setBillingOutcome] = useState(() => (
        ['success', 'cancelled'].includes(searchParams.get('billing')) ? searchParams.get('billing') : ''
    ));
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const reload = useCallback(() => setAttempt(n => n + 1), []);
    const username = (user && user.username) || '';

    useEffect(() => {
        if (!searchParams.has('billing')) return;
        const params = new URLSearchParams(searchParams);
        params.delete('billing');
        setSearchParams(params, {replace: true});
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (!username) {
            setData(null);
            setError(null);
            return () => {};
        }
        let active = true;
        setError(null);
        api.classroom.overview()
            .then(result => {
                if (active) setData(result);
            })
            .catch(e => {
                if (active) setError(e);
            });
        return () => {
            active = false;
        };
    }, [username, attempt]);

    if (!user) {
        if (loading) return <main className={styles.page}><StatusMessage /></main>;
        return (
            <main className={styles.page}>
                <PageHeader icon={GraduationCap} title={communityText('Classroom')} />
                <SignInPrompt title={communityText('Teachers sign in with Rotur to manage their classes.')} onSignIn={login} />
                <EmptyState
                    icon={LogIn}
                    title={communityText('Students sign in with a class code.')}
                    action={(
                        <Button as={Link} to="/classroom/join" variant="primary">
                            <LogIn size={16} aria-hidden="true" />
                            {communityText('Student sign-in')}
                        </Button>
                    )}
                >
                    {communityText('Ask your teacher for the class code on your login card.')}
                </EmptyState>
            </main>
        );
    }
    if (error && !notEnabled(error)) {
        return (
            <main className={styles.page}>
                <PageHeader icon={GraduationCap} title={communityText('Classroom')} />
                <StatusMessage error onRetry={reload}>{communityText('Could not load Classroom.')}</StatusMessage>
            </main>
        );
    }
    if (!data && !error) return <main className={styles.page}><StatusMessage /></main>;
    if (data && data.role === 'student') return <StudentHome data={data} onReload={reload} />;
    if (data && data.role === 'teacher') {
        return (
            <TeacherDashboard
                data={data}
                billingOutcome={billingOutcome}
                onDismissBilling={() => setBillingOutcome('')}
                onReload={reload}
            />
        );
    }
    return (
        <main className={styles.page}>
            <PageHeader icon={GraduationCap} title={communityText('Classroom')} />
            <EmptyState
                icon={School}
                title={communityText('Classroom is not enabled for this account.')}
                action={<Button as={Link} to="/support">{communityText('Contact support')}</Button>}
            >
                {communityText('Classroom is licensed to schools. Ask your school to add you to its plan, or contact support to set one up.')}
            </EmptyState>
        </main>
    );
};

export {BillingActions, LOGIN_MODES, SEAT_PACK_CHOICES, UpgradeModal, notEnabled, sortClasses, tierLabel};
export default Classroom;
