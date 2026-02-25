import React from 'react';
import {FormattedMessage, injectIntl, intlShape, defineMessages} from 'react-intl';
import {connect} from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import styles from './loader.css';
import {getIsLoadingWithId} from '../../reducers/project-state';
import topBlock from './top-block.svg';
import middleBlock from './middle-block.svg';
import bottomBlock from './bottom-block.svg';

const mainMessages = {
    'gui.loader.headline': (
        <FormattedMessage
            defaultMessage="Loading Project"
            description="Main loading message"
            id="gui.loader.headline"
        />
    ),
    'gui.loader.creating': (
        <FormattedMessage
            defaultMessage="Creating Project"
            description="Main creating message"
            id="gui.loader.creating"
        />
    )
};

const messages = defineMessages({
    projectData: {
        defaultMessage: 'Loading project …',
        description: 'Appears when loading project data, but not assets yet',
        id: 'tw.loader.projectData'
    },
    downloadingAssets: {
        defaultMessage: 'Downloading assets ({complete}/{total}) …',
        description: 'Appears when loading project assets from a project on a remote website',
        id: 'tw.loader.downloadingAssets'
    },
    loadingAssets: {
        defaultMessage: 'Loading assets ({complete}/{total}) …',
        description: 'Appears when loading project assets from a project file on the user\'s computer',
        id: 'tw.loader.loadingAssets'
    }
});

// Array of random loading messages
const randomMessages = [
    "MistWarp's anniversary is less than a year away! - Nameless",
    'ur gay - Flufi',
    'that is making my braincells consider dying as their next action - JustNoone',
    'i moved the addons tab to edit because i like it :yum: - Mistium',
    'OH MY FLIPPERS - roturBOT',
    'we have more themes than TurboWarp, which makes MistWarp better - Mistium',
    'Femboys can be not gray - JustNoone',
    'Penguinmod cringe fr fr ong no cap (real) (not gone wrong) (mistwarp better real) - Flufi',
    'Fences are always gray - Nameless',
    'Dont try, dont try to hide it - Flufi',
    'CSS is my passion - Nameless',
    'CSS is a turing complete scripting language - Mistium',
    'I want to be Poland - Andrew',
    'Programer socks are part of the official MistWarp uniform - Nameless',
    'Wear thigh highs or die :3 - Flufi',
    'This mod has no swears, pg family friendly - Mistium',
    'Grah - Flufi',
    'I am a professional MistWarp user - Nameless',
    'Next person to be confused by this quote is gay - Flufi',
    'Look under there',
    'do not the mistwarp - Flufi',
    'how sign in to mistwarp - Andrew',
    'if only mistwarp was less mist and more warp - Mistium',
    'i just laughed so hard i died - Flufi',
    'I just laughed so hard that I just laughed so hard - ViMi',
    'i own turbowarp and penguinmod - Andrew',
    'evil is bad, but good evil is bad good - volxten_'
];

// Because progress events are fired so often during the very performance-critical loading
// process and React updates are very slow, we bypass React for updating the progress bar.

class LoaderComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAssetProgress',
            'handleProjectLoaded',
            'barInnerRef',
            'messageRef'
        ]);
        this.barInnerEl = null;
        this.messageEl = null;
        this.ignoreProgress = false;
        // Select a random message when the component is created
        this.randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    }
    componentDidMount () {
        this.handleAssetProgress(
            this.props.vm.runtime.finishedAssetRequests,
            this.props.vm.runtime.totalAssetRequests
        );
        this.props.vm.on('ASSET_PROGRESS', this.handleAssetProgress);
        this.props.vm.runtime.on('PROJECT_LOADED', this.handleProjectLoaded);
    }
    componentWillUnmount () {
        this.props.vm.off('ASSET_PROGRESS', this.handleAssetProgress);
        this.props.vm.runtime.off('PROJECT_LOADED', this.handleProjectLoaded);
    }
    handleAssetProgress (finished, total) {
        if (this.ignoreProgress || !this.barInnerEl || !this.messageEl) {
            return;
        }

        if (total === 0) {
            // Started loading a new project.
            this.barInnerEl.style.width = '0';
            this.messageEl.textContent = this.props.intl.formatMessage(messages.projectData);
        } else {
            this.barInnerEl.style.width = `${finished / total * 100}%`;
            const message = this.props.isRemote ? messages.downloadingAssets : messages.loadingAssets;
            this.messageEl.textContent = this.props.intl.formatMessage(message, {
                complete: finished,
                total
            });
        }
    }
    handleProjectLoaded () {
        if (this.ignoreProgress || !this.barInnerEl || !this.messageEl) {
            return;
        }

        this.ignoreProgress = true;
        this.props.vm.runtime.resetProgress();
    }
    barInnerRef (barInner) {
        this.barInnerEl = barInner;
    }
    messageRef (message) {
        this.messageEl = message;
    }
    render () {
        return (
            <div
                className={classNames(styles.background, {
                    [styles.fullscreen]: this.props.isFullScreen
                })}
            >
                <div className={styles.container}>
                    <div className={styles.blockAnimation}>
                        <img
                            className={styles.topBlock}
                            src={topBlock}
                            draggable={false}
                        />
                        <img
                            className={styles.middleBlock}
                            src={middleBlock}
                            draggable={false}
                        />
                        <img
                            className={styles.bottomBlock}
                            src={bottomBlock}
                            draggable={false}
                        />
                    </div>

                    <div className={styles.title}>
                        {mainMessages[this.props.messageId]}
                    </div>

                    <div
                        className={styles.message}
                        ref={this.messageRef}
                    />

                    <div className={styles.barOuter}>
                        <div
                            className={styles.barInner}
                            ref={this.barInnerRef}
                        />
                    </div>
                    
                    <div className={styles.randomMessage}>
                        {this.randomMessage}
                    </div>
                </div>
            </div>
        );
    }
}

LoaderComponent.propTypes = {
    intl: intlShape,
    isFullScreen: PropTypes.bool,
    isRemote: PropTypes.bool,
    messageId: PropTypes.string,
    vm: PropTypes.shape({
        on: PropTypes.func,
        off: PropTypes.func,
        runtime: PropTypes.shape({
            totalAssetRequests: PropTypes.number,
            finishedAssetRequests: PropTypes.number,
            resetProgress: PropTypes.func,
            on: PropTypes.func,
            off: PropTypes.func
        })
    })
};
LoaderComponent.defaultProps = {
    isFullScreen: false,
    messageId: 'gui.loader.headline'
};

const mapStateToProps = state => ({
    isRemote: getIsLoadingWithId(state.scratchGui.projectState.loadingState),
    vm: state.scratchGui.vm
});

const mapDispatchToProps = () => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(injectIntl(LoaderComponent));
