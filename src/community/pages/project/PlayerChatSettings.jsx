/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Check, MessagesSquare} from 'lucide-react';
import api from '../../api';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import Button from '../../components/ui/Button.jsx';
import Notice from '../../components/ui/Notice.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import {SwitchRow} from '../../components/ui/Switch.jsx';
import {PLAYER_CONTACT_TERMS_VERSION, PlayerChatRules, formatServiceNames} from '../../components/PlayerChat.jsx';
import {isMinorAccount} from '../../../lib/minor-account.js';
import styles from '../ManageProject.module.css';

const PlayerChatSettings = ({project, onSaved}) => {
    const {text: communityText} = useCommunityText();
    const chat = project.playerContact || {};
    const [enabled, setEnabled] = useState(Boolean(chat.declared || chat.required));
    const [contact, setContact] = useState(chat.contact || '');
    const [agreed, setAgreed] = useState(Boolean(chat.declared && chat.termsCurrent));
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        setEnabled(Boolean(chat.declared || chat.required));
        setContact(chat.contact || '');
        setAgreed(Boolean(chat.declared && chat.termsCurrent));
    }, [project.id, chat.declared, chat.required, chat.contact, chat.termsCurrent]);

    const services = formatServiceNames(chat.services, communityText);
    const owner = !project.myRole || project.myRole === 'owner';
    const minor = isMinorAccount();

    const save = async () => {
        if (busy) return;
        if (enabled && contact.trim().length < 3) {
            setStatus(communityText('Add a contact for chat.'));
            return;
        }
        if (enabled && !agreed) {
            setStatus(communityText('Agree to the chat rules to continue.'));
            return;
        }
        setBusy(true);
        setStatus('');
        try {
            const data = await api.setPlayerContact(project.id, enabled ? {
                declared: true,
                contact: contact.trim(),
                termsVersion: PLAYER_CONTACT_TERMS_VERSION
            } : {declared: false});
            setStatus(communityText('Chat details saved.'));
            if (data && data.project) onSaved(data.project);
        } catch (e) {
            setStatus(e.message || communityText('Could not save the chat details.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={styles.card} id="player-chat">
            <SectionHeading
                as="h3"
                icon={MessagesSquare}
                title={communityText('Player chat')}
                lead={communityText('If players can send each other messages in this project, you are responsible for moderating them.')}
            />
            {owner ? null : (
                <p className={styles.cardHint}>
                    {chat.declared ?
                        communityText('@{value1} moderates chat in this project. Only the owner can change the chat details.', {value1: project.owner}) :
                        communityText('Only the owner, @{value1}, can add chat details and take responsibility for chat in this project.', {value1: project.owner})}
                </p>
            )}
            {owner ? <div className={styles.form}>
                {chat.required ? (
                    <Notice variant={chat.missing ? 'warning' : 'info'}>
                        {chat.missing ?
                            communityText('This project uses {value1}, which lets players talk to each other. Add chat details to share it. Until you do, it is left out of lists.', {value1: services}) :
                            communityText('This project uses {value1}, which lets players talk to each other.', {value1: services})}
                    </Notice>
                ) : null}
                <div className={styles.switches}>
                    <SwitchRow
                        checked={enabled}
                        disabled={busy || Boolean(chat.required)}
                        label={communityText('Players can talk to each other in this project')}
                        description={chat.required ?
                            communityText('Always on while the project uses an extension that connects players.') :
                            communityText('Turn this on if players can send each other messages in any way, including through your own server.')}
                        onChange={setEnabled}
                    />
                </div>
                {enabled ? (
                    <React.Fragment>
                        <label className={styles.field}>
                            <span>{communityText('Contact for chat')}</span>
                            <input
                                value={contact}
                                maxLength={200}
                                disabled={busy}
                                placeholder={minor ? communityText('A website link') : communityText('A website or email address')}
                                onChange={e => setContact(e.target.value)}
                            />
                            <small>
                                {minor ?
                                    communityText('Shown on the project page so players can reach you about chat. Use a website link, never your email address or real name.') :
                                    communityText('Shown on the project page so players can reach you about chat. Use a contact you are happy for anyone to see.')}
                            </small>
                        </label>
                        <div className={styles.field}>
                            <span>{communityText('Chat rules')}</span>
                            <PlayerChatRules className={styles.chatRules} />
                        </div>
                        <label className={styles.agree}>
                            <input
                                type="checkbox"
                                checked={agreed}
                                disabled={busy}
                                onChange={e => setAgreed(e.target.checked)}
                            />
                            <span>{communityText('I will moderate chat in this project by these rules.')}</span>
                        </label>
                    </React.Fragment>
                ) : null}
                <div className={styles.formActions}>
                    <span className={styles.formStatus} role="status" aria-live="polite">{status}</span>
                    <Button
                        variant="primary"
                        busy={busy}
                        busyLabel={communityText('Saving…')}
                        onClick={save}
                    >
                        <Check size={16} />{communityText('Save chat details')}</Button>
                </div>
            </div> : null}
        </div>
    );
};

PlayerChatSettings.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.string,
        myRole: PropTypes.string,
        owner: PropTypes.string,
        playerContact: PropTypes.object
    }).isRequired,
    onSaved: PropTypes.func.isRequired
};

export default PlayerChatSettings;
