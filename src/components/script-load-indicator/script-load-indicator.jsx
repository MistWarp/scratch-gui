import PropTypes from 'prop-types';
import React, {useLayoutEffect, useRef, useState} from 'react';
import classNames from 'classnames';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import styles from './script-load-indicator.css';

const messages = defineMessages({
    count: {
        id: 'gui.scriptLoadIndicator.count',
        defaultMessage: '{completed, number} of {total, number} blocks',
        description: 'Counter shown in the code tab row while the scripts of a project are loading'
    },
    loading: {
        id: 'gui.scriptLoadIndicator.loading',
        defaultMessage: 'Loading scripts',
        description: 'Shown in the code tab row while scripts load and the block count is not known yet'
    },
    paused: {
        id: 'gui.scriptLoadIndicator.paused',
        defaultMessage: 'Script loading is paused while you edit',
        description: 'Tooltip on the script loading counter while loading waits for an edit to finish'
    },
    error: {
        id: 'gui.scriptLoadIndicator.error',
        defaultMessage: 'Some script blocks could not be loaded',
        description: 'Shown in the code tab row when part of a project could not be drawn'
    }
});

const STAGE_HEADER_SELECTOR = '[class*="stage-header_stage-header-wrapper"]';
const CLEARANCE = 12;

const useStageHeaderClearance = (ref, stageSize, visible) => {
    const [clearance, setClearance] = useState(0);
    useLayoutEffect(() => {
        const update = () => {
            const element = ref.current;
            const header = document.querySelector(STAGE_HEADER_SELECTOR);
            if (!element || !element.parentElement || !header) {
                setClearance(0);
                return;
            }
            const row = element.parentElement.getBoundingClientRect();
            const bar = header.getBoundingClientRect();
            const rtl = getComputedStyle(element).direction === 'rtl';
            const overlap = rtl ? bar.right - row.left : row.right - bar.left;
            setClearance(overlap > 0 && bar.width > 0 ? Math.ceil(overlap) + CLEARANCE : 0);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [ref, stageSize, visible]);
    return clearance;
};

const ScriptLoadIndicator = ({intl, progress, stageSize}) => {
    const ref = useRef(null);
    const clearance = useStageHeaderClearance(ref, stageSize, Boolean(progress));
    if (!progress) return null;
    const {phase, completed, total} = progress;
    const error = phase === 'error';
    const paused = phase === 'paused';
    let label;
    if (error) {
        label = <FormattedMessage {...messages.error} />;
    } else if (total > 0) {
        label = (
            <FormattedMessage
                {...messages.count}
                values={{completed, total}}
            />
        );
    } else {
        label = <FormattedMessage {...messages.loading} />;
    }
    return (
        <div
            ref={ref}
            role="presentation"
            className={classNames(styles.indicator, {
                [styles.error]: error,
                [styles.paused]: paused
            })}
            style={clearance ? {paddingInlineEnd: `${clearance}px`} : null}
            title={paused ? intl.formatMessage(messages.paused) : null}
        >
            <span
                role="status"
                aria-live="polite"
                className={styles.count}
            >
                {label}
            </span>
            {error ? null : (
                <span
                    aria-hidden="true"
                    className={styles.line}
                >
                    <span className={styles.sweep} />
                </span>
            )}
        </div>
    );
};

ScriptLoadIndicator.propTypes = {
    intl: intlShape.isRequired,
    progress: PropTypes.shape({
        phase: PropTypes.string,
        completed: PropTypes.number,
        total: PropTypes.number
    }),
    stageSize: PropTypes.string
};

const mapStateToProps = state => ({
    progress: state.scratchGui.scriptLoadProgress,
    stageSize: state.scratchGui.stageSize.stageSize
});

export default injectIntl(connect(mapStateToProps)(ScriptLoadIndicator));
