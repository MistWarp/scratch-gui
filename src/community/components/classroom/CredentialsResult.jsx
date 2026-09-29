import PropTypes from 'prop-types';
import React from 'react';
import {Printer} from 'lucide-react';

import {pictureLabel} from '../../classroom.js';
import {useCommunityIntl} from '../../i18n.jsx';
import Button from '../ui/Button.jsx';
import Notice from '../ui/Notice.jsx';
import LoginCards from './LoginCards.jsx';
import PictureIcon from './PictureIcon.jsx';
import styles from './CredentialsResult.module.css';

const CredentialsResult = ({classTitle, code, doneLabel, loginMode, onDone, students}) => {
    const {text: communityText} = useCommunityIntl();
    const print = () => window.print();
    return (
        <div className={styles.result}>
            <Notice variant="success">
                {loginMode === 'picture' ?
                    communityText('Print or write these down now. Picture sequences are not shown again.') :
                    communityText('Print or write these down now. Passwords are not shown again.')}
            </Notice>
            <ul className={styles.list}>
                {students.map(student => (
                    <li key={student.id} className={styles.row}>
                        <span className={styles.who}>
                            <strong className={styles.name}>{student.displayName}</strong>
                            <span className={styles.username}>{student.username}</span>
                        </span>
                        {loginMode === 'picture' ? (
                            <span className={styles.pictures} aria-label={communityText('Picture sequence')}>
                                {(student.credentials.pictures || []).map((picture, index) => (
                                    <span key={`${picture}-${index}`} className={styles.pictureCell}>
                                        <PictureIcon name={picture} size={40} />
                                        <span className={styles.pictureName}>
                                            {communityText(pictureLabel(picture))}
                                        </span>
                                    </span>
                                ))}
                            </span>
                        ) : (
                            <code className={styles.password}>{student.credentials.password}</code>
                        )}
                    </li>
                ))}
            </ul>
            <div className={styles.actions}>
                <Button onClick={onDone}>{doneLabel || communityText('Done')}</Button>
                <Button variant="primary" onClick={print}>
                    <Printer size={16} aria-hidden="true" />
                    {communityText('Print login cards')}
                </Button>
            </div>
            <LoginCards classTitle={classTitle} code={code} loginMode={loginMode} students={students} />
        </div>
    );
};

CredentialsResult.propTypes = {
    classTitle: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    doneLabel: PropTypes.node,
    loginMode: PropTypes.oneOf(['password', 'picture']).isRequired,
    onDone: PropTypes.func.isRequired,
    students: PropTypes.arrayOf(PropTypes.shape({
        credentials: PropTypes.shape({
            password: PropTypes.string,
            pictures: PropTypes.arrayOf(PropTypes.string)
        }).isRequired,
        displayName: PropTypes.string.isRequired,
        id: PropTypes.string.isRequired,
        username: PropTypes.string
    })).isRequired
};

export default CredentialsResult;
