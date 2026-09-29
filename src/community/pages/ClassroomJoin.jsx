import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ArrowRight, Eraser, GraduationCap, LogIn} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {PICTURE_COUNT, normalizeClassCode, pictureLabel} from '../classroom.js';
import Button from '../components/ui/Button.jsx';
import Notice from '../components/ui/Notice.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import PictureIcon from '../components/classroom/PictureIcon.jsx';
import styles from './ClassroomJoin.module.css';

const GRID_COLUMNS = 4;

const PictureGrid = ({disabled, onPick, pictures}) => {
    const {text: communityText} = useCommunityText();
    const gridRef = useRef(null);
    const moveFocus = (event, index) => {
        const buttons = gridRef.current ? Array.from(gridRef.current.querySelectorAll('button')) : [];
        if (!buttons.length) return;
        let next = -1;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === 'ArrowDown') next = Math.min(buttons.length - 1, index + GRID_COLUMNS);
        else if (event.key === 'ArrowUp') next = Math.max(0, index - GRID_COLUMNS);
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        if (next < 0) return;
        event.preventDefault();
        buttons[next].focus();
    };
    return (
        <div className={styles.pictureGrid} ref={gridRef} role="group" aria-label={communityText('Pictures')}>
            {pictures.map((picture, index) => (
                <button
                    key={picture}
                    type="button"
                    className={styles.pictureButton}
                    disabled={disabled}
                    aria-label={communityText(pictureLabel(picture))}
                    onClick={() => onPick(picture)}
                    onKeyDown={event => moveFocus(event, index)}
                >
                    <PictureIcon name={picture} size={64} className={styles.pictureIcon} />
                </button>
            ))}
        </div>
    );
};

PictureGrid.propTypes = {
    disabled: PropTypes.bool,
    onPick: PropTypes.func.isRequired,
    pictures: PropTypes.arrayOf(PropTypes.string).isRequired
};

PictureGrid.defaultProps = {
    disabled: false
};

const ClassroomJoin = () => {
    const {text: communityText} = useCommunityText();
    const {code: codeParam} = useParams();
    const navigate = useNavigate();
    const {loginStudent} = useUser();
    const code = normalizeClassCode(codeParam);
    const [codeInput, setCodeInput] = useState(code);
    const [roster, setRoster] = useState(null);
    const [rosterError, setRosterError] = useState('');
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [pictures, setPictures] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setStudentId('');
        setPassword('');
        setPictures([]);
        setError('');
        if (!code) {
            setRoster(null);
            setRosterError('');
            return () => {};
        }
        let active = true;
        setLoadingRoster(true);
        setRosterError('');
        api.classroom.join(code)
            .then(data => {
                if (active) setRoster(data);
            })
            .catch(e => {
                if (!active) return;
                setRoster(null);
                setRosterError((e && e.message) || communityText('That class code was not found.'));
            })
            .finally(() => {
                if (active) setLoadingRoster(false);
            });
        return () => {
            active = false;
        };
    }, [code]);

    const submitCode = event => {
        event.preventDefault();
        const next = normalizeClassCode(codeInput);
        if (!next) return;
        if (next === code) {
            setRosterError('');
            setLoadingRoster(true);
            api.classroom.join(next)
                .then(setRoster)
                .catch(e => setRosterError((e && e.message) || communityText('That class code was not found.')))
                .finally(() => setLoadingRoster(false));
            return;
        }
        navigate(`/classroom/join/${next}`);
    };

    const student = roster ? (roster.students || []).find(item => item.id === studentId) : null;
    const pictureMode = roster && roster.class && roster.class.loginMode === 'picture';

    const signIn = async event => {
        if (event) event.preventDefault();
        if (busy || !student) return;
        if (pictureMode ? pictures.length !== PICTURE_COUNT : !password) return;
        setBusy(true);
        setError('');
        try {
            const data = await api.classroom.login(pictureMode ?
                {code, studentId, pictures} :
                {code, studentId, password});
            loginStudent({token: data.token, username: data.username, displayName: data.displayName});
            navigate('/classroom');
        } catch (e) {
            setError((e && e.message) || communityText('That sign-in did not match. Check with your teacher and try again.'));
            setPictures([]);
            setPassword('');
            setBusy(false);
        }
    };

    const pickAnotherName = () => {
        setStudentId('');
        setPictures([]);
        setPassword('');
        setError('');
    };

    const pick = picture => {
        setError('');
        setPictures(current => (current.length >= PICTURE_COUNT ? current : [...current, picture]));
    };

    return (
        <main className={styles.page}>
            <div className={styles.brand}>
                <GraduationCap size={28} aria-hidden="true" />
                <span>{communityText('MistWarp Classroom')}</span>
            </div>
            {!code || rosterError ? (
                <form className={styles.card} onSubmit={submitCode}>
                    <h1 className={styles.title}>{communityText('Enter your class code')}</h1>
                    <p className={styles.lead}>{communityText('It is on your login card. Ask your teacher if you do not have one.')}</p>
                    <label className={styles.codeField}>
                        <span>{communityText('Class code')}</span>
                        <input
                            value={codeInput}
                            autoFocus
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            inputMode="text"
                            maxLength={12}
                            onChange={event => setCodeInput(normalizeClassCode(event.target.value))}
                        />
                    </label>
                    {rosterError ? <Notice variant="error">{rosterError}</Notice> : null}
                    <Button type="submit" variant="primary" className={styles.bigButton} disabled={!codeInput} busy={loadingRoster} busyLabel={communityText('Checking…')}>
                        {communityText('Next')}
                        <ArrowRight size={20} aria-hidden="true" />
                    </Button>
                </form>
            ) : null}
            {code && !rosterError && (loadingRoster || !roster) ? (
                <div className={styles.card}><StatusMessage>{communityText('Finding your class…')}</StatusMessage></div>
            ) : null}
            {roster && !rosterError && !student ? (
                <section className={styles.card} aria-labelledby="classroom-join-who">
                    <p className={styles.className}>{roster.class.name}</p>
                    <h1 className={styles.title} id="classroom-join-who">{communityText('Who are you?')}</h1>
                    <div className={styles.nameGrid}>
                        {(roster.students || []).map(item => (
                            <button key={item.id} type="button" className={styles.nameButton} onClick={() => setStudentId(item.id)}>
                                {item.displayName}
                            </button>
                        ))}
                    </div>
                    {(roster.students || []).length ? null : (
                        <Notice>{communityText('There is nobody in this class yet. Ask your teacher to add you.')}</Notice>
                    )}
                    <Link to="/classroom/join" className={styles.backLink}>{communityText('Not your class? Enter a different code.')}</Link>
                </section>
            ) : null}
            {student ? (
                <form className={styles.card} onSubmit={signIn} aria-labelledby="classroom-join-secret">
                    <p className={styles.className}>{roster.class.name}</p>
                    <h1 className={styles.title} id="classroom-join-secret">{communityText('Hi, {value1}!', {value1: student.displayName})}</h1>
                    {pictureMode ? (
                        <React.Fragment>
                            <p className={styles.lead}>{communityText('Tap your three pictures in order.')}</p>
                            <div className={styles.slots} aria-live="polite" aria-label={communityText('Chosen pictures')}>
                                {Array.from({length: PICTURE_COUNT}).map((ignored, index) => (
                                    pictures[index] ?
                                        <PictureIcon key={index} name={pictures[index]} size={64} className={styles.slotFilled} /> :
                                        <span key={index} className={styles.slotEmpty} aria-hidden="true">{index + 1}</span>
                                ))}
                                {pictures.length ? (
                                    <Button className={styles.clearButton} onClick={() => setPictures([])} disabled={busy}>
                                        <Eraser size={18} aria-hidden="true" />
                                        {communityText('Clear')}
                                    </Button>
                                ) : null}
                            </div>
                            <PictureGrid pictures={roster.pictures || []} disabled={busy || pictures.length >= PICTURE_COUNT} onPick={pick} />
                        </React.Fragment>
                    ) : (
                        <label className={styles.codeField}>
                            <span>{communityText('Password')}</span>
                            <input
                                type="password"
                                value={password}
                                autoFocus
                                autoComplete="current-password"
                                onChange={event => setPassword(event.target.value)}
                            />
                        </label>
                    )}
                    <div aria-live="assertive">
                        {error ? <Notice variant="error">{error}</Notice> : null}
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        className={styles.bigButton}
                        disabled={pictureMode ? pictures.length !== PICTURE_COUNT : !password}
                        busy={busy}
                        busyLabel={communityText('Signing in…')}
                    >
                        <LogIn size={20} aria-hidden="true" />
                        {communityText('Sign in')}
                    </Button>
                    <button type="button" className={styles.backLink} onClick={pickAnotherName}>
                        {communityText('Not you? Pick another name.')}
                    </button>
                </form>
            ) : null}
        </main>
    );
};

export {PictureGrid};
export default ClassroomJoin;
