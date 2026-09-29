import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {ClipboardList, Save} from 'lucide-react';
import api from '../../api';
import {fromLocalInputs, toLocalInputs} from '../../classroom.js';
import {useUser} from '../../UserContext.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Notice from '../ui/Notice.jsx';
import SelectMenu from '../ui/SelectMenu.jsx';
import styles from '../../pages/Classroom.module.css';

const assignmentPayload = form => ({
    title: form.title.trim(),
    instructions: form.instructions.trim(),
    dueAt: fromLocalInputs(form.dueDate, form.dueTime),
    starterProjectId: form.starterProjectId || ''
});

const AssignmentModal = ({assignment, classId, onClose, onSaved}) => {
    const {text: communityText} = useCommunityText();
    const {user} = useUser();
    const due = toLocalInputs(assignment ? assignment.dueAt : 0);
    const [form, setForm] = useState({
        title: assignment ? assignment.title : '',
        instructions: assignment ? assignment.instructions || '' : '',
        dueDate: due.date,
        dueTime: due.time,
        starterProjectId: assignment ? assignment.starterProjectId || '' : ''
    });
    const [projects, setProjects] = useState(null);
    const [projectsError, setProjectsError] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const username = (user && user.username) || '';
    const update = (field, value) => setForm(current => ({...current, [field]: value}));

    useEffect(() => {
        if (!username) return () => {};
        let active = true;
        api.myProjectPage(username, {offset: 0, limit: 100})
            .then(data => {
                if (active) setProjects(data.projects || []);
            })
            .catch(() => {
                if (active) {
                    setProjects([]);
                    setProjectsError(true);
                }
            });
        return () => {
            active = false;
        };
    }, [username]);

    const submit = async event => {
        event.preventDefault();
        const payload = assignmentPayload(form);
        if (!payload.title || busy) return;
        setBusy(true);
        setError('');
        try {
            const data = assignment ?
                await api.classroom.updateAssignment(classId, assignment.id, payload) :
                await api.classroom.createAssignment(classId, payload);
            onSaved(data.assignment || data);
        } catch (e) {
            setError(e.message || communityText('Could not save the assignment.'));
            setBusy(false);
        }
    };

    const starterOptions = [
        {value: '', label: communityText('No starter project')},
        ...(projects || []).map(project => ({value: project.id, label: project.title || project.id}))
    ];
    const knownStarter = starterOptions.some(option => option.value === form.starterProjectId);

    return (
        <Modal
            title={assignment ? communityText('Edit assignment') : communityText('New assignment')}
            icon={ClipboardList}
            onClose={onClose}
            dismissDisabled={busy}
            className={styles.wideModal}
        >
            <form className={styles.form} onSubmit={submit}>
                <label className={styles.field}>
                    <span>{communityText('Title')}</span>
                    <input value={form.title} maxLength={120} autoFocus onChange={event => update('title', event.target.value)} />
                </label>
                <label className={styles.field}>
                    <span>{communityText('Instructions')}</span>
                    <textarea value={form.instructions} rows={5} maxLength={4000} onChange={event => update('instructions', event.target.value)} />
                </label>
                <fieldset className={styles.fieldGroup}>
                    <legend>{communityText('Due date (optional)')}</legend>
                    <div className={styles.fieldRow}>
                        <label className={styles.field}>
                            <span>{communityText('Date')}</span>
                            <input type="date" value={form.dueDate} onChange={event => update('dueDate', event.target.value)} />
                        </label>
                        <label className={styles.field}>
                            <span>{communityText('Time')}</span>
                            <input type="time" value={form.dueTime} disabled={!form.dueDate} onChange={event => update('dueTime', event.target.value)} />
                        </label>
                    </div>
                </fieldset>
                <div className={styles.field}>
                    <span>{communityText('Starter project')}</span>
                    <SelectMenu
                        ariaLabel={communityText('Starter project')}
                        value={knownStarter ? form.starterProjectId : ''}
                        onChange={value => update('starterProjectId', value)}
                        options={starterOptions}
                        disabled={projects === null}
                    />
                    <small className={styles.hint}>
                        {projectsError ?
                            communityText('Your projects could not be loaded, so no starter can be chosen right now.') :
                            communityText('Students start from a copy of one of your projects. Leave this empty to let them start from a blank project.')}
                    </small>
                </div>
                {error ? <Notice variant="error">{error}</Notice> : null}
                <div className={styles.formActions}>
                    <Button onClick={onClose} disabled={busy}>{communityText('Cancel')}</Button>
                    <Button type="submit" variant="primary" disabled={!form.title.trim()} busy={busy} busyLabel={communityText('Saving…')}>
                        <Save size={16} aria-hidden="true" />
                        {assignment ? communityText('Save changes') : communityText('Create assignment')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

AssignmentModal.propTypes = {
    assignment: PropTypes.shape({
        dueAt: PropTypes.number,
        id: PropTypes.string.isRequired,
        instructions: PropTypes.string,
        starterProjectId: PropTypes.string,
        title: PropTypes.string
    }),
    classId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired
};

AssignmentModal.defaultProps = {
    assignment: null
};

export {assignmentPayload};
export default AssignmentModal;
