import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Library, Mic, Volume2} from 'lucide-react';
import styles from './sound-empty-state.css';

const SoundEmptyState = ({isStage, onChooseSound, onRecordSound}) => (
    <div className={styles.container}>
        <Volume2
            className={styles.icon}
            size={40}
            strokeWidth={1.5}
            aria-hidden="true"
        />
        <h2 className={styles.heading}>
            {isStage ? (
                <FormattedMessage
                    defaultMessage="The stage has no sounds yet"
                    description="Heading in the sounds tab when the stage has no sounds"
                    id="mw.soundEmptyState.stageHeading"
                />
            ) : (
                <FormattedMessage
                    defaultMessage="This sprite has no sounds yet"
                    description="Heading in the sounds tab when the selected sprite has no sounds"
                    id="mw.soundEmptyState.spriteHeading"
                />
            )}
        </h2>
        <p className={styles.text}>
            <FormattedMessage
                defaultMessage="Choose one from the library or record your own."
                description="Hint in the sounds tab when the selected sprite or stage has no sounds"
                id="mw.soundEmptyState.hint"
            />
        </p>
        <div className={styles.actions}>
            <button
                type="button"
                className={styles.primary}
                onClick={onChooseSound}
            >
                <Library
                    size={16}
                    aria-hidden="true"
                />
                <FormattedMessage
                    defaultMessage="Choose a Sound"
                    description="Button in the empty sounds tab that opens the sound library"
                    id="mw.soundEmptyState.choose"
                />
            </button>
            {onRecordSound ? (
                <button
                    type="button"
                    className={styles.secondary}
                    onClick={onRecordSound}
                >
                    <Mic
                        size={16}
                        aria-hidden="true"
                    />
                    <FormattedMessage
                        defaultMessage="Record"
                        description="Button in the empty sounds tab that opens the sound recorder"
                        id="mw.soundEmptyState.record"
                    />
                </button>
            ) : null}
        </div>
    </div>
);

SoundEmptyState.propTypes = {
    isStage: PropTypes.bool,
    onChooseSound: PropTypes.func.isRequired,
    onRecordSound: PropTypes.func
};

export default SoundEmptyState;
