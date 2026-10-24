import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {ChevronDown, ChevronRight, Eye, EyeClosed} from 'lucide-react';

import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Input from '../forms/input.jsx';
import DirectionPicker from '../../containers/direction-picker.jsx';

import styles from './workbench.css';

const messages = defineMessages({
    heading: {
        id: 'mw.codeMode.properties',
        defaultMessage: 'Properties',
        description: 'Heading of the sprite properties section under the file tree in Code mode'
    },
    name: {
        id: 'mw.codeMode.properties.name',
        defaultMessage: 'Name',
        description: 'Label of the sprite name field in the Code mode properties section'
    },
    size: {
        id: 'mw.codeMode.properties.size',
        defaultMessage: 'Size',
        description: 'Label of the sprite size field in the Code mode properties section'
    },
    show: {
        id: 'mw.codeMode.properties.show',
        defaultMessage: 'Show sprite',
        description: 'Button in the Code mode properties section that makes the sprite visible'
    },
    hide: {
        id: 'mw.codeMode.properties.hide',
        defaultMessage: 'Hide sprite',
        description: 'Button in the Code mode properties section that hides the sprite'
    }
});

const OPEN_KEY = 'mw:code-mode:properties-open';

const readOpen = () => {
    try {
        return window.localStorage.getItem(OPEN_KEY) !== 'false';
    } catch (e) {
        return true;
    }
};

const BufferedInput = BufferedInputHOC(Input);

const SpriteProperties = ({intl, sprite, vm}) => {
    const [open, setOpen] = useState(readOpen);

    const handleToggle = useCallback(() => {
        setOpen(previous => {
            try {
                window.localStorage.setItem(OPEN_KEY, String(!previous));
            } catch (e) {
                return !previous;
            }
            return !previous;
        });
    }, []);
    const post = useCallback(info => vm.postSpriteInfo(info), [vm]);
    const handleName = useCallback(name => {
        if (String(name).trim()) vm.renameSprite(sprite.id, name);
    }, [sprite.id, vm]);
    const handleX = useCallback(x => post({x}), [post]);
    const handleY = useCallback(y => post({y}), [post]);
    const handleSize = useCallback(size => post({size}), [post]);
    const handleDirection = useCallback(direction => post({direction}), [post]);
    const handleRotationStyle = useCallback(rotationStyle => post({rotationStyle}), [post]);
    const handleShow = useCallback(() => post({visible: true}), [post]);
    const handleHide = useCallback(() => post({visible: false}), [post]);

    const headingId = `mw-code-properties-${sprite.id}`;

    return (
        <section
            aria-labelledby={headingId}
            className={styles.properties}
        >
            <div className={styles.propertiesHeader}>
                <button
                    aria-expanded={open}
                    className={styles.propertiesToggle}
                    type="button"
                    onClick={handleToggle}
                >
                    {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    <h2
                        className={styles.explorerHeading}
                        id={headingId}
                    >
                        {intl.formatMessage(messages.heading)}
                    </h2>
                </button>
            </div>
            {open ? (
                <div className={styles.propertiesBody}>
                    <label className={styles.propertyWide}>
                        <span className={styles.propertyLabel}>{intl.formatMessage(messages.name)}</span>
                        <BufferedInput
                            className={styles.propertyInput}
                            type="text"
                            value={sprite.name}
                            onSubmit={handleName}
                        />
                    </label>
                    <label className={styles.property}>
                        <span className={styles.propertyLabel}>{'x'}</span>
                        <BufferedInput
                            className={styles.propertyInput}
                            type="number"
                            value={Math.round(sprite.x)}
                            onSubmit={handleX}
                        />
                    </label>
                    <label className={styles.property}>
                        <span className={styles.propertyLabel}>{'y'}</span>
                        <BufferedInput
                            className={styles.propertyInput}
                            type="number"
                            value={Math.round(sprite.y)}
                            onSubmit={handleY}
                        />
                    </label>
                    <label className={styles.property}>
                        <span className={styles.propertyLabel}>{intl.formatMessage(messages.size)}</span>
                        <BufferedInput
                            className={styles.propertyInput}
                            type="number"
                            value={Math.round(sprite.size)}
                            onSubmit={handleSize}
                        />
                    </label>
                    <div className={styles.propertyDirection}>
                        <DirectionPicker
                            labelAbove
                            disabled={false}
                            direction={Math.round(sprite.direction)}
                            rotationStyle={sprite.rotationStyle}
                            onChangeDirection={handleDirection}
                            onChangeRotationStyle={handleRotationStyle}
                        />
                    </div>
                    <div
                        className={styles.visibilityToggle}
                        role="group"
                    >
                        <button
                            aria-pressed={sprite.visible}
                            className={styles.iconButton}
                            title={intl.formatMessage(messages.show)}
                            aria-label={intl.formatMessage(messages.show)}
                            type="button"
                            onClick={handleShow}
                        >
                            <Eye size={15} />
                        </button>
                        <button
                            aria-pressed={!sprite.visible}
                            className={styles.iconButton}
                            title={intl.formatMessage(messages.hide)}
                            aria-label={intl.formatMessage(messages.hide)}
                            type="button"
                            onClick={handleHide}
                        >
                            <EyeClosed size={15} />
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

SpriteProperties.propTypes = {
    intl: intlShape,
    sprite: PropTypes.shape({
        direction: PropTypes.number,
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        rotationStyle: PropTypes.string,
        size: PropTypes.number,
        visible: PropTypes.bool,
        x: PropTypes.number,
        y: PropTypes.number
    }).isRequired,
    vm: PropTypes.shape({
        postSpriteInfo: PropTypes.func.isRequired,
        renameSprite: PropTypes.func.isRequired
    }).isRequired
};

export default injectIntl(SpriteProperties);
