import PropTypes from 'prop-types';
import classNames from 'classnames';
import React from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';
import Box from '../box/box.jsx';
import styles from './blocks.css';

const loadingMessages = defineMessages({
    clearing: {id: 'gui.blocks.loading.clearing', defaultMessage: 'Clearing previous scripts'},
    building: {id: 'gui.blocks.loading.building', defaultMessage: 'Building script blocks'},
    drawing: {id: 'gui.blocks.loading.drawing', defaultMessage: 'Drawing script blocks'},
    layout: {id: 'gui.blocks.loading.layout', defaultMessage: 'Positioning script blocks'},
    finishing: {id: 'gui.blocks.loading.finishing', defaultMessage: 'Finishing script'},
    paused: {id: 'gui.blocks.loading.paused', defaultMessage: 'Script loading paused while editing'},
    error: {id: 'gui.blocks.loading.error', defaultMessage: 'Some script blocks could not be loaded'}
});

const BlocksComponent = props => {
    const {
        containerRef,
        scriptLoadProgress,
        dragOver,
        gridVisible,
        paletteResizingEnabled,
        onPaletteResizePointerDown,
        paletteWidth,
        style,
        ...componentProps
    } = props;
    return (
        <Box
            className={classNames(styles.blocks, {
                [styles.dragOver]: dragOver,
                [styles['hide-grid']]: gridVisible === false
            })}
            style={{
                ...(style || null),
                ...(typeof paletteWidth === 'number' ? {'--blocks-palette-width': `${paletteWidth}px`} : null)
            }}
            {...componentProps}
            componentRef={containerRef}
        >
            {scriptLoadProgress && loadingMessages[scriptLoadProgress.phase] ? (
                <div className={styles.scriptLoadProgress}>
                    <div
                        role="status"
                        aria-live="polite"
                    >
                        <FormattedMessage {...loadingMessages[scriptLoadProgress.phase]} />
                    </div>
                    {scriptLoadProgress.total > 0 && scriptLoadProgress.phase !== 'paused' ? (
                        <React.Fragment>
                            <progress
                                aria-label="Script loading progress"
                                max={scriptLoadProgress.total}
                                value={scriptLoadProgress.completed}
                            />
                            <FormattedMessage
                                id="gui.blocks.loading.count"
                                defaultMessage="{completed, number} of {total, number} blocks"
                                values={{completed: scriptLoadProgress.completed, total: scriptLoadProgress.total}}
                            />
                        </React.Fragment>
                    ) : null}
                </div>
            ) : null}
            {paletteResizingEnabled ? (
                <div
                    className={styles.paletteResizer}
                    onPointerDown={onPaletteResizePointerDown}
                    onMouseDown={onPaletteResizePointerDown}
                />
            ) : null}
        </Box>
    );
};
BlocksComponent.propTypes = {
    containerRef: PropTypes.func,
    scriptLoadProgress: PropTypes.shape({
        phase: PropTypes.string,
        completed: PropTypes.number,
        total: PropTypes.number
    }),
    dragOver: PropTypes.bool,
    gridVisible: PropTypes.bool,
    paletteResizingEnabled: PropTypes.bool,
    onPaletteResizePointerDown: PropTypes.func,
    paletteWidth: PropTypes.number,
    style: PropTypes.object
};
export default BlocksComponent;
