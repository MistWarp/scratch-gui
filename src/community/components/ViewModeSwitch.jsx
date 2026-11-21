import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {Blocks, Code} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {plainClick, setDeveloperMode} from '../developer-mode.js';
import Button from './ui/Button.jsx';
import IconButton from './ui/IconButton.jsx';

const ViewModeSwitch = ({mode, projectHref, developerHref, className}) => {
    const {text: communityText} = useCommunityText();
    if (mode === 'project') {
        return (
            <IconButton
                as={Link}
                variant="secondary"
                className={className}
                to={developerHref}
                label={communityText('Developer view')}
                title={communityText('Developer view')}
                onClick={event => {
                    if (plainClick(event)) setDeveloperMode(true);
                }}
            >
                <Code size={18} aria-hidden="true" />
            </IconButton>
        );
    }
    return (
        <Button
            as={Link}
            variant="secondary"
            className={className}
            to={projectHref}
            onClick={event => {
                if (plainClick(event)) setDeveloperMode(false);
            }}
        >
            <Blocks size={16} aria-hidden="true" />
            {communityText('Project view')}
        </Button>
    );
};

ViewModeSwitch.propTypes = {
    className: PropTypes.string,
    developerHref: PropTypes.string.isRequired,
    mode: PropTypes.oneOf(['project', 'developer']).isRequired,
    projectHref: PropTypes.string.isRequired
};

export default ViewModeSwitch;
