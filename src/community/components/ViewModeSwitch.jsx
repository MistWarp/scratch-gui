import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {Blocks, Code} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {plainClick, setDeveloperMode} from '../developer-mode.js';
import styles from './ViewModeSwitch.module.css';

const ViewModeSwitch = ({mode, projectHref, developerHref, className}) => {
    const {text: communityText} = useCommunityText();
    const item = (key, to, Icon, label, developer) => (
        <Link
            className={mode === key ? `${styles.item} ${styles.active}` : styles.item}
            to={to}
            aria-current={mode === key ? 'page' : null}
            onClick={event => {
                if (plainClick(event)) setDeveloperMode(developer);
            }}
        >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
        </Link>
    );
    return (
        <nav
            className={className ? `${styles.switch} ${className}` : styles.switch}
            aria-label={communityText('Project view mode')}
        >
            {item('project', projectHref, Blocks, communityText('Project'), false)}
            {item('developer', developerHref, Code, communityText('Developer'), true)}
        </nav>
    );
};

ViewModeSwitch.propTypes = {
    className: PropTypes.string,
    developerHref: PropTypes.string.isRequired,
    mode: PropTypes.oneOf(['project', 'developer']).isRequired,
    projectHref: PropTypes.string.isRequired
};

export default ViewModeSwitch;
