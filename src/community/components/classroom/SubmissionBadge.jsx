import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {submissionLabel, submissionState} from '../../classroom.js';
import {useCommunityIntl} from '../../i18n.jsx';
import styles from './SubmissionBadge.module.css';

const SubmissionBadge = ({className, large, submission}) => {
    const {text: communityText} = useCommunityIntl();
    const state = submissionState(submission);
    return (
        <span className={classNames(styles.badge, styles[state], {[styles.large]: large}, className)}>
            {communityText(submissionLabel(state))}
        </span>
    );
};

SubmissionBadge.propTypes = {
    className: PropTypes.string,
    large: PropTypes.bool,
    submission: PropTypes.shape({
        late: PropTypes.bool,
        state: PropTypes.string
    })
};

SubmissionBadge.defaultProps = {
    large: false,
    submission: null
};

export default SubmissionBadge;
