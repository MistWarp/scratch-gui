import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import MousePos from './mouse-pos.jsx';
import CloneCounter from './clone-counter.jsx';
import VolumeSlider from './volume-slider.jsx';
import styles from './stage-controls.css';

// Native stage extras rendered after the stop button, in the same order the
// old addons used: volume slider, mouse position, clone counter.
const StageExtras = ({vm}) => {
    if (!vm) {
        return null;
    }
    return (
        <div className={styles.extras}>
            <VolumeSlider vm={vm} />
            <MousePos vm={vm} />
            <CloneCounter vm={vm} />
        </div>
    );
};

StageExtras.propTypes = {
    vm: PropTypes.instanceOf(VM)
};

export default StageExtras;
