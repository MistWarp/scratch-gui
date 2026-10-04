/* eslint-disable max-len */
import React, {useState} from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {Eye} from 'lucide-react';
import api, {embedUrl} from '../../api';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {formatDateTime} from '../../format';
import styles from '../Admin.module.css';

const EvidenceDetails = ({data}) => {
    const {text: communityText} = useCommunityText();
    const config = data.config || {};
    const buyers = config.buyers || [];
    const visibility = config.visibility || (config.shared ? 'public' : 'private');
    return (
        <div className={styles.evidenceBody}>
            <ul className={styles.evidenceMeta}>
                <li><strong>{communityText('Title:')}</strong> {` ${config.title || ''}`}</li>
                <li><strong>{communityText('Owner:')}</strong> {` @${config.owner || ''}`}</li>
                <li><strong>{communityText('Price:')}</strong> {communityText(' {value1} credits', {value1: config.price || 0})}</li>
                <li><strong>{communityText('Visibility:')}</strong> {` ${visibility}`}</li>
                {config.revenue ? <li><strong>{communityText('Revenue:')}</strong> {communityText(' {value1} credits', {value1: config.revenue})}</li> : null}
                {buyers.length ? <li><strong>{communityText('Buyers:')}</strong> {` ${buyers.length}`}</li> : null}
                {config.snapshotAt ? (
                    <li><strong>{communityText('Captured:')}</strong> {` ${formatDateTime(config.snapshotAt, 'Date unavailable')}`}</li>
                ) : null}
            </ul>
            {config.description ? <p className={styles.evidenceText}>{config.description}</p> : null}
            {config.instructions ? <p className={styles.evidenceText}>{config.instructions}</p> : null}
            <iframe
                className={styles.evidenceStage}
                src={embedUrl({projectJsonUrl: data.projectJsonUrl, assetsBase: data.assetsBase})}
                title={communityText('Reported project copy')}
                sandbox="allow-scripts allow-pointer-lock"
            />
        </div>
    );
};

const EvidencePanel = ({target}) => {
    const {text: communityText} = useCommunityText();
    const [open, setOpen] = useState(false);
    const [state, setState] = useState({status: 'idle', data: null});
    const toggle = async () => {
        setOpen(value => !value);
        if (state.status !== 'idle') return;
        setState({status: 'loading', data: null});
        try {
            const result = await api.admin.reportEvidence(target);
            setState(result.exists ? {status: 'ready', data: result} : {status: 'none', data: null});
        } catch (e) {
            setState({status: 'none', data: null});
        }
    };
    return (
        <div className={styles.evidence}>
            <Button onClick={toggle}>
                {open ? communityText('Hide reported copy') : communityText('View reported copy')}
            </Button>
            {open && state.status === 'loading' ? (
                <StatusMessage compact />
            ) : null}
            {open && state.status === 'none' ? (
                <EmptyState compact icon={Eye} title={communityText('No preserved copy')}>
                    {communityText('No copy of this project was kept for this report.')}
                </EmptyState>
            ) : null}
            {open && state.status === 'ready' ? (
                <EvidenceDetails data={state.data} />
            ) : null}
        </div>
    );
};

export default EvidencePanel;
