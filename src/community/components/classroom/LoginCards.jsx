import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';

import {joinUrl, pictureLabel} from '../../classroom.js';
import {useCommunityIntl} from '../../i18n.jsx';
import PictureIcon from './PictureIcon.jsx';
import styles from './LoginCards.module.css';

const LoginCards = ({classTitle, code, loginMode, students}) => {
    const {text: communityText} = useCommunityIntl();
    const [host, setHost] = useState(null);
    useEffect(() => {
        const element = document.createElement('div');
        element.className = styles.host;
        document.body.appendChild(element);
        setHost(element);
        return () => {
            element.remove();
        };
    }, []);
    const link = joinUrl(code).replace(/^https?:\/\//, '');
    const cards = (
        <section className={styles.sheet} aria-label={communityText('Login cards')}>
            {students.map(student => (
                <article key={student.id} className={styles.card}>
                    <p className={styles.classLabel}>{classTitle}</p>
                    <p className={styles.name}>{student.displayName}</p>
                    <p className={styles.step}>{communityText('Go to {value1}.', {value1: link})}</p>
                    <p className={styles.code}>{code}</p>
                    <p className={styles.small}>{communityText('Class code: {value1}', {value1: code})}</p>
                    {loginMode === 'picture' ? (
                        <React.Fragment>
                            <p className={styles.step}>
                                {communityText('Tap your name, then tap these three pictures in order.')}
                            </p>
                            <div className={styles.pictures}>
                                {(student.credentials.pictures || []).map((picture, index) => (
                                    <span key={`${picture}-${index}`} className={styles.pictureCell}>
                                        <PictureIcon name={picture} size={52} className={styles.picture} />
                                        <span className={styles.pictureName}>
                                            {communityText(pictureLabel(picture))}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <p className={styles.step}>{communityText('Tap your name, then type this password.')}</p>
                            <p className={styles.password}>{student.credentials.password}</p>
                        </React.Fragment>
                    )}
                </article>
            ))}
        </section>
    );
    return host ? createPortal(cards, host) : null;
};

LoginCards.propTypes = {
    classTitle: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    loginMode: PropTypes.oneOf(['password', 'picture']).isRequired,
    students: PropTypes.arrayOf(PropTypes.shape({
        credentials: PropTypes.shape({
            password: PropTypes.string,
            pictures: PropTypes.arrayOf(PropTypes.string)
        }).isRequired,
        displayName: PropTypes.string.isRequired,
        id: PropTypes.string.isRequired
    })).isRequired
};

export default LoginCards;
