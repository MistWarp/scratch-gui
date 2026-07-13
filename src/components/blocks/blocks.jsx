import PropTypes from 'prop-types';
import classNames from 'classnames';
import React from 'react';
import Box from '../box/box.jsx';
import styles from './blocks.css';

const BlocksComponent = props => {
    const {
        containerRef,
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
    dragOver: PropTypes.bool,
    gridVisible: PropTypes.bool,
    paletteResizingEnabled: PropTypes.bool,
    onPaletteResizePointerDown: PropTypes.func,
    paletteWidth: PropTypes.number,
    style: PropTypes.object
};
export default BlocksComponent;
