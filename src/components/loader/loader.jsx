import React from 'react';
import {FormattedMessage, injectIntl, intlShape, defineMessages} from 'react-intl';
import {connect} from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {PackageOpen, FileJson, ShieldCheck, Blocks, Cat, Palette, Github} from 'lucide-react';
import {getLoaderSettings} from '../../lib/mw/loader-settings';
import styles from './loader.css';
import {getIsFetchingWithId, getIsLoadingWithId} from '../../reducers/project-state';
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
    downloadingFiles: {
        defaultMessage: 'Downloading files ({complete}/{total}) …',
        description: 'Appears while downloading the unique asset files used by a remote project',
        id: 'mw.loader.downloadingFiles'
    },
    loadingFiles: {
        defaultMessage: 'Reading asset files ({complete}/{total}) …',
        description: 'Appears while reading the unique asset files in a local project',
        id: 'mw.loader.loadingFiles'
    },
    preparingAssets: {
        defaultMessage: 'Preparing assets ({complete}/{total}) …',
        description: 'Appears while decoding and attaching each costume and sound reference',
        id: 'mw.loader.preparingAssets'
    },
    preparingProject: {
        defaultMessage: 'Preparing project … (large projects may take a moment)',
        description: 'Appears after assets are loaded while the project data is being processed',
        id: 'tw.loader.preparingProject'
    },
    unzipping: {
        defaultMessage: 'Unzipping project …',
        description: 'Appears while the project file is being decompressed',
        id: 'mw.loader.unzipping'
    },
    parsing: {
        defaultMessage: 'Parsing project data …',
        description: 'Appears while the project json is being parsed',
        id: 'mw.loader.parsing'
    },
    checking: {
        defaultMessage: 'Checking project …',
        description: 'Appears while the project is being validated',
        id: 'mw.loader.checking'
    },
    building: {
        defaultMessage: 'Building blocks …',
        description: 'Appears while the project data is being turned into blocks and sprites',
        id: 'mw.loader.building'
    },
    installing: {
        defaultMessage: 'Adding sprites …',
        description: 'Appears while the sprites are being added to the project',
        id: 'mw.loader.installing'
    }
});

const STAGE_ICONS = {
    unzipping: PackageOpen,
    parsing: FileJson,
    checking: ShieldCheck,
    building: Blocks,
    installing: Cat,
    assets: Palette
};

const STAGE_PROGRESS = {
    unzipping: [0, 20],
    parsing: [20, 75],
    checking: [75, 80],
    building: [80, 85],
    assets: [85, 97],
    installing: [97, 100]
};

const formatBytes = bytes => {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// How often the quote at the bottom changes, in ms.
const QUOTE_INTERVAL = 5000;

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
            'handleLoadProgress',
            'handleProjectLoaded',
            'rotateQuote',
            'barInnerRef',
            'messageRef',
            'detailRef',
            'quoteRef'
        ]);
        this.barInnerEl = null;
        this.messageEl = null;
        this.detailEl = null;
        this.quoteEl = null;
        this.overallProgress = 0;
        this.ignoreProgress = false;
        this.quoteTimer = null;
        // Shuffle so a session does not repeat quotes until it has run out.
        this.quotes = randomMessages
            .map(text => ({text, order: Math.random()}))
            .sort((a, b) => a.order - b.order)
            .map(entry => entry.text);
        this.settings = getLoaderSettings();
        if (this.settings.customQuotes.length) {
            this.quotes = this.settings.customQuotes
                .map(text => ({text, order: Math.random()}))
                .sort((a, b) => a.order - b.order)
                .map(entry => entry.text);
        }
        this.quoteIndex = 0;
        this.randomMessage = this.quotes[0];
        this.state = {stage: null};
    }
    componentDidMount () {
        this.handleAssetProgress(
            this.props.vm.runtime.finishedAssetRequests,
            this.props.vm.runtime.totalAssetRequests
        );
        this.props.vm.on('ASSET_PROGRESS', this.handleAssetProgress);
        this.props.vm.on('LOAD_PROGRESS', this.handleLoadProgress);
        this.props.vm.runtime.on('PROJECT_LOADED', this.handleProjectLoaded);
        if (this.settings.showQuotes) {
            this.quoteTimer = setInterval(this.rotateQuote, QUOTE_INTERVAL);
        }
    }
    componentWillUnmount () {
        this.props.vm.off('ASSET_PROGRESS', this.handleAssetProgress);
        this.props.vm.off('LOAD_PROGRESS', this.handleLoadProgress);
        this.props.vm.runtime.off('PROJECT_LOADED', this.handleProjectLoaded);
        clearInterval(this.quoteTimer);
    }
    setStage (stage) {
        if (this.state.stage !== stage) {
            this.setState({stage});
        }
    }
    setOverallProgress (progress) {
        if (!this.barInnerEl) {
            return;
        }
        this.overallProgress = Math.max(this.overallProgress, Math.min(100, progress));
        this.barInnerEl.style.width = `${this.overallProgress}%`;
    }
    rotateQuote () {
        if (!this.quoteEl) {
            return;
        }
        this.quoteIndex = (this.quoteIndex + 1) % this.quotes.length;
        const next = this.quotes[this.quoteIndex];
        this.quoteEl.classList.add(styles.quoteLeaving);
        setTimeout(() => {
            if (!this.quoteEl) {
                return;
            }
            this.quoteEl.textContent = next;
            this.quoteEl.classList.remove(styles.quoteLeaving);
        }, 400);
    }
    // What the VM is doing right now: unzipping, parsing, and so on. These all
    // happen before any asset request, so they cannot fight over the message.
    handleLoadProgress ({stage, loaded, total}) {
        if (this.ignoreProgress || !this.messageEl) {
            return;
        }
        const message = messages[stage];
        if (!message) {
            return;
        }
        this.setStage(stage);
        this.messageEl.textContent = this.props.intl.formatMessage(message);
        const range = STAGE_PROGRESS[stage];
        if (range) {
            const fraction = loaded && total ? Math.min(1, loaded / total) : 0;
            this.setOverallProgress(range[0] + ((range[1] - range[0]) * fraction));
        }

        if (!this.detailEl) {
            return;
        }
        if (stage === 'unzipping' && total) {
            this.detailEl.textContent = `${formatBytes(loaded)} of ${formatBytes(total)}`;
        } else if (total) {
            this.detailEl.textContent = formatBytes(total);
        } else {
            this.detailEl.textContent = '';
        }
    }
    handleAssetProgress (finished, total, detail) {
        if (this.ignoreProgress || !this.barInnerEl || !this.messageEl) {
            return;
        }

        if (total === 0) {
            // Started loading a new project.
            if (this.overallProgress === 0) {
                this.setOverallProgress(0);
                this.messageEl.textContent = this.props.intl.formatMessage(messages.projectData);
                if (this.detailEl) {
                    this.detailEl.textContent = '';
                }
            }
        } else if (finished >= total) {
            this.setOverallProgress(STAGE_PROGRESS.assets[1]);
            this.messageEl.textContent = this.props.intl.formatMessage(messages.preparingProject);
            if (this.detailEl) {
                this.detailEl.textContent = '';
            }
        } else {
            this.setStage('assets');
            const range = STAGE_PROGRESS.assets;
            this.setOverallProgress(range[0] + ((range[1] - range[0]) * (finished / total)));
            let message;
            let complete = finished;
            let phaseTotal = total;
            if (detail && detail.phase === 'prepare') {
                message = messages.preparingAssets;
                complete = detail.completed;
                phaseTotal = detail.total;
            } else if (detail && detail.phase === 'download') {
                message = this.props.isRemote ? messages.downloadingFiles : messages.loadingFiles;
                complete = detail.completed;
                phaseTotal = detail.total;
            } else {
                message = this.props.isRemote ? messages.downloadingFiles : messages.loadingFiles;
            }
            this.messageEl.textContent = this.props.intl.formatMessage(message, {
                complete,
                total: phaseTotal
            });
            if (this.detailEl) {
                this.detailEl.textContent = '';
            }
        }
    }
    handleProjectLoaded () {
        if (this.ignoreProgress || !this.barInnerEl || !this.messageEl) {
            return;
        }

        this.setOverallProgress(100);
        this.ignoreProgress = true;
        this.props.vm.runtime.resetProgress();
    }
    barInnerRef (barInner) {
        this.barInnerEl = barInner;
    }
    messageRef (message) {
        this.messageEl = message;
    }
    detailRef (detail) {
        this.detailEl = detail;
    }
    quoteRef (quote) {
        this.quoteEl = quote;
    }
    render () {
        const StageIcon = STAGE_ICONS[this.state.stage];
        const settings = this.settings;
        return (
            <div
                className={classNames(styles.background, {
                    [styles.fullscreen]: this.props.isFullScreen
                })}
            >
                <div className={styles.container}>
                    {settings.showAnimation ? (
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
                    ) : null}

                    {settings.showTitle ? (
                        <div className={styles.title}>
                            {mainMessages[this.props.messageId]}
                        </div>
                    ) : null}

                    <div
                        className={styles.status}
                        hidden={!settings.showStatus}
                    >
                        {StageIcon ? (
                            <StageIcon
                                className={styles.stageIcon}
                                size={18}
                                strokeWidth={2.25}
                            />
                        ) : null}
                        <div
                            className={styles.message}
                            ref={this.messageRef}
                        />
                    </div>

                    <div
                        className={styles.barOuter}
                        hidden={!settings.showProgress}
                    >
                        <div
                            className={classNames(styles.barInner, {
                                [styles.indeterminate]: this.props.isFetching
                            })}
                            ref={this.barInnerRef}
                        />
                    </div>

                    <div
                        className={styles.detail}
                        hidden={!settings.showDetail}
                        ref={this.detailRef}
                    />

                    {settings.showQuotes ? (
                        <div
                            className={styles.randomMessage}
                            ref={this.quoteRef}
                        >
                            {this.randomMessage}
                        </div>
                    ) : null}

                    {settings.showGithub ? (
                        <a
                            className={styles.githubCta}
                            href="https://github.com/mistwarp"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <Github size={14} />
                            <FormattedMessage
                                defaultMessage="Follow MistWarp on GitHub"
                                description="Link on the loading screen to the MistWarp GitHub organisation"
                                id="mw.loader.github"
                            />
                        </a>
                    ) : null}
                </div>
            </div>
        );
    }
}

export {LoaderComponent};

LoaderComponent.propTypes = {
    intl: intlShape,
    isFetching: PropTypes.bool,
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

const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        isFetching: getIsFetchingWithId(loadingState),
        isRemote: getIsLoadingWithId(loadingState),
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = () => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(injectIntl(LoaderComponent));
