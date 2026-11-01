import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import FloatingStage from '../floating-stage/floating-stage.jsx';
import LoadingSpinner from '../tw-loading-spinner/spinner.jsx';
import {isRendererSupported} from '../../lib/utils/tw-environment-support-prober.js';
import styles from './gui.css';
import {getGuiComponents} from './gui-components';

const CodeWorkbenchSlot = ({floatingStage, isHidden, vm}) => {
    const {CodeWorkbench} = getGuiComponents();
    return (
        <div
            className={classNames(styles.codeWorkbenchSlot, {
                [styles.mobileEditorContentHidden]: isHidden
            })}
        >
            <React.Suspense fallback={<LoadingSpinner />}>
                <CodeWorkbench spritePaneVisible={!floatingStage} />
            </React.Suspense>
            {floatingStage ? (
                <FloatingStage
                    isRendererSupported={isRendererSupported()}
                    vm={vm}
                />
            ) : null}
        </div>
    );
};

CodeWorkbenchSlot.propTypes = {
    floatingStage: PropTypes.bool,
    isHidden: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default CodeWorkbenchSlot;
