import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, ClipboardCheck, MonitorPlay, ShieldCheck} from 'lucide-react';
import ShareWithTeacher from './ShareWithTeacher.jsx';
import styles from './ClassroomPromo.module.css';

const pointsCopy = communityText => [
    {icon: ShieldCheck, body: communityText('Your teacher makes your account, so you need no email, and nobody outside the class can see your work.')},
    {icon: ClipboardCheck, body: communityText('Your teacher sets projects, you turn them in, and you get feedback in MistWarp.')},
    {icon: MonitorPlay, body: communityText('Build group projects together live, and follow along when your teacher presents.')}
];

const ClassroomPromo = () => {
    const {text: communityText} = useCommunityText();
    return (
        <div className={styles.promo}>
            <div className={styles.copy}>
                <p className={styles.lead}>{communityText('Want to use MistWarp at school? MistWarp Classroom gives your class its own private space, run by your teacher.')}</p>
                <ul className={styles.points}>
                    {pointsCopy(communityText).map(({icon: Icon, body}) => (
                        <li key={body}>
                            <Icon size={16} aria-hidden="true" />
                            <span>{body}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className={styles.actions}>
                <ShareWithTeacher variant="primary" />
                <Link to="/classroom/about" className={styles.link}>
                    {communityText('See what teachers get')}
                    <ArrowRight size={14} aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
};

export default ClassroomPromo;
