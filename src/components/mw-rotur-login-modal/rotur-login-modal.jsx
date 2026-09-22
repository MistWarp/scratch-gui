import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {
    Activity,
    ArrowUpRight,
    AtSign,
    CircleAlert,
    CloudUpload,
    Globe,
    LogIn,
    Lock,
    Palette,
    Trophy,
    Users
} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import Avatar from '../mw-avatar/avatar.jsx';
import Button from '../button/button.jsx';
import communityEnabled from '../../lib/community/enabled.js';
import {getRoturSessionApi} from '../../lib/rotur/session-api.js';
import styles from './rotur-login-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Sign in with Rotur',
        description: 'Title of Rotur login modal',
        id: 'mw.roturLogin.title'
    },
    infoTitle: {
        defaultMessage: 'Rotur in MistWarp',
        description: 'Title of Rotur info modal when signed in',
        id: 'mw.roturLogin.infoTitle'
    }
});

const feature = (id, icon, title, description) => ({id, icon, title, description});

const FRIENDS_FEATURE = feature(
    'friends',
    Users,
    <FormattedMessage
        defaultMessage="Edit live with friends"
        description="Rotur login feature title"
        id="mw.roturLogin.feature.friends.title"
    />,
    <FormattedMessage
        defaultMessage="See which friends are online and invite them to edit with you."
        description="Rotur login feature description"
        id="mw.roturLogin.feature.friends.description"
    />
);

const COMMUNITY_FEATURES = [
    feature(
        'save',
        CloudUpload,
        <FormattedMessage
            defaultMessage="Save to MistWarp"
            description="Rotur login feature title"
            id="mw.roturLogin.feature.save.title"
        />,
        <FormattedMessage
            defaultMessage="Save from the File menu and restore old versions later."
            description="Rotur login feature description"
            id="mw.roturLogin.feature.save.description"
        />
    ),
    feature(
        'publish',
        Globe,
        <FormattedMessage
            defaultMessage="Publish and remix"
            description="Rotur login feature title"
            id="mw.roturLogin.feature.publish.title"
        />,
        <FormattedMessage
            defaultMessage="Share projects, comment, react, and follow creators."
            description="Rotur login feature description"
            id="mw.roturLogin.feature.publish.description"
        />
    ),
    feature(
        'spaces',
        Trophy,
        <FormattedMessage
            defaultMessage="Spaces and challenges"
            description="Rotur login feature title"
            id="mw.roturLogin.feature.spaces.title"
        />,
        <FormattedMessage
            defaultMessage="Join studios and challenges, submit entries, and vote."
            description="Rotur login feature description"
            id="mw.roturLogin.feature.spaces.description"
        />
    )
];

const ACCOUNT_FEATURES = [
    feature(
        'sync',
        Palette,
        <FormattedMessage
            defaultMessage="Themes and settings sync"
            description="Rotur login feature title"
            id="mw.roturLogin.feature.sync.title"
        />,
        <FormattedMessage
            defaultMessage="Your theme and settings follow you to every device."
            description="Rotur login feature description"
            id="mw.roturLogin.feature.sync.description"
        />
    ),
    feature(
        'activity',
        Activity,
        <FormattedMessage
            defaultMessage="Show what you're editing"
            description="Rotur login feature title"
            id="mw.roturLogin.feature.activity.title"
        />,
        <FormattedMessage
            defaultMessage="Share MistWarp activity on your Rotur profile."
            description="Rotur login feature description"
            id="mw.roturLogin.feature.activity.desc"
        />
    )
];

const STANDALONE_FEATURES = [
    feature(
        'name',
        AtSign,
        <FormattedMessage
            defaultMessage="Your name in projects"
            description="Rotur login feature title"
            id="mw.roturLogin.feature.name.title"
        />,
        <FormattedMessage
            defaultMessage="The username block and cloud variables use your Rotur name."
            description="Rotur login feature description"
            id="mw.roturLogin.feature.name.description"
        />
    )
];

const FEATURES = communityEnabled ?
    [COMMUNITY_FEATURES[0], FRIENDS_FEATURE, ...COMMUNITY_FEATURES.slice(1), ...ACCOUNT_FEATURES] :
    [FRIENDS_FEATURE, ...ACCOUNT_FEATURES, ...STANDALONE_FEATURES];

const WINDOW_HEIGHTS = communityEnabled ?
    {signedIn: 470, signedOut: 495} :
    {signedIn: 480, signedOut: 530};

const FeatureRow = ({icon: Icon, title, description}) => (
    <li className={styles.feature}>
        <span className={styles.featureIcon}>
            <Icon
                aria-hidden="true"
                size={16}
            />
        </span>
        <span className={styles.featureText}>
            <span className={styles.featureTitle}>{title}</span>
            <span className={styles.featureDesc}>{description}</span>
        </span>
    </li>
);

FeatureRow.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.node.isRequired,
    description: PropTypes.node.isRequired
};

class RoturLoginModal extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            busy: false,
            localError: null
        };
        this.loginInFlight = false;
        this.handleLogin = this.handleLogin.bind(this);
        this.handleRequestClose = this.handleRequestClose.bind(this);
        this.releaseLogin = this.releaseLogin.bind(this);
    }

    handleRequestClose () {
        if (this.loginInFlight || this.state.busy || this.props.status === 'logging-in') return;
        this.props.onRequestClose();
    }

    releaseLogin () {
        this.loginInFlight = false;
    }

    async handleLogin () {
        if (this.loginInFlight || this.state.busy || this.props.status === 'logging-in') return;
        this.loginInFlight = true;
        this.setState({busy: true, localError: null});
        try {
            const api = getRoturSessionApi();
            if (!api || typeof api.login !== 'function') {
                throw new Error('Rotur session is not ready yet. Try again in a moment.');
            }
            await api.login();
        } catch (error) {
            const message = error && error.message ? error.message : String(error);
            this.setState({localError: message});
        } finally {
            this.releaseLogin();
            this.setState({busy: false});
        }
    }

    render () {
        const error = this.state.localError || this.props.error;
        const busy = this.state.busy || this.props.status === 'logging-in';
        const loggedIn = Boolean(this.props.username);

        return (
            <Modal
                className={styles.modalContent}
                contentLabel={this.props.intl.formatMessage(loggedIn ? messages.infoTitle : messages.title)}
                id="roturLoginModal"
                onRequestClose={this.handleRequestClose}
                resizable
                maximizable={false}
                width={communityEnabled ? 580 : 440}
                height={WINDOW_HEIGHTS[loggedIn ? 'signedIn' : 'signedOut']}
                minHeight={320}
                minWidth={340}
            >
                <div className={styles.root}>
                    <div className={styles.body}>
                        <div className={styles.hero}>
                            {loggedIn ? (
                                <Avatar
                                    className={styles.heroAvatar}
                                    username={this.props.username}
                                    size={52}
                                />
                            ) : (
                                <img
                                    alt=""
                                    className={styles.logo}
                                    draggable={false}
                                    src="https://rotur.dev/Rotur%20Logo.png"
                                />
                            )}
                            <div className={styles.heroText}>
                                <h2 className={styles.title}>
                                    {loggedIn ? (
                                        <FormattedMessage
                                            defaultMessage="Signed in as {username}"
                                            description="Headline in Rotur info modal when signed in"
                                            id="mw.roturLogin.signedInAs"
                                            values={{username: this.props.username}}
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Connect MistWarp to Rotur"
                                            description="Headline in Rotur login modal"
                                            id="mw.roturLogin.headline"
                                        />
                                    )}
                                </h2>
                                <p className={styles.subtitle}>
                                    {loggedIn ? (
                                        <FormattedMessage
                                            defaultMessage="Your Rotur account turns these on across MistWarp."
                                            description="Subtitle in Rotur info modal when signed in"
                                            id="mw.roturLogin.signedInIntro"
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="One Rotur account turns these on across MistWarp."
                                            description="Subtitle in Rotur login modal"
                                            id="mw.roturLogin.accountIntro"
                                        />
                                    )}
                                </p>
                            </div>
                        </div>

                        <ul className={styles.featureList}>
                            {FEATURES.map(item => (
                                <FeatureRow
                                    key={item.id}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </ul>

                        {error ? (
                            <div
                                className={styles.error}
                                role="alert"
                            >
                                <CircleAlert
                                    aria-hidden="true"
                                    className={styles.errorIcon}
                                    size={16}
                                />
                                <div className={styles.errorText}>
                                    <p className={styles.errorMessage}>{error}</p>
                                    <a
                                        className={styles.link}
                                        href="https://rotur.dev/me"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        <FormattedMessage
                                            defaultMessage="Check your account standing on rotur.dev"
                                            description="Link shown under a Rotur sign-in error"
                                            id="mw.roturLogin.checkStanding"
                                        />
                                        <ArrowUpRight
                                            aria-hidden="true"
                                            size={14}
                                        />
                                    </a>
                                </div>
                            </div>
                        ) : null}

                        {loggedIn ? null : (
                            <p className={styles.footnote}>
                                <Lock
                                    aria-hidden="true"
                                    size={13}
                                />
                                <span>
                                    <FormattedMessage
                                        defaultMessage="You sign in on {link}, so MistWarp never sees your password."
                                        description="Privacy note under the Rotur login features"
                                        id="mw.roturLogin.privacy"
                                        values={{
                                            link: (
                                                <a
                                                    className={styles.link}
                                                    href="https://rotur.dev"
                                                    rel="noopener noreferrer"
                                                    target="_blank"
                                                >
                                                    {'rotur.dev'}
                                                </a>
                                            )
                                        }}
                                    />
                                </span>
                            </p>
                        )}
                    </div>

                    <div className={styles.footer}>
                        {loggedIn ? (
                            <React.Fragment>
                                <Button
                                    href="https://rotur.dev/me"
                                    iconElem={ArrowUpRight}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    variant="secondary"
                                >
                                    <FormattedMessage
                                        defaultMessage="Manage account"
                                        description="Link to the Rotur account page from the Rotur info modal"
                                        id="mw.roturLogin.manage"
                                    />
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={this.handleRequestClose}
                                >
                                    <FormattedMessage
                                        defaultMessage="Close"
                                        description="Close button on Rotur info modal"
                                        id="mw.roturLogin.close"
                                    />
                                </Button>
                            </React.Fragment>
                        ) : (
                            <React.Fragment>
                                <Button
                                    variant="secondary"
                                    onClick={this.handleRequestClose}
                                    disabled={busy}
                                >
                                    <FormattedMessage
                                        defaultMessage="Not now"
                                        description="Cancel button on Rotur login modal"
                                        id="mw.roturLogin.notNow"
                                    />
                                </Button>
                                <Button
                                    className={styles.continue}
                                    iconElem={busy ? null : LogIn}
                                    variant="primary"
                                    disabled={busy}
                                    onClick={this.handleLogin}
                                >
                                    {busy ? (
                                        <React.Fragment>
                                            <span
                                                aria-hidden="true"
                                                className={styles.spinner}
                                            />
                                            <FormattedMessage
                                                defaultMessage="Waiting for Rotur..."
                                                description="Loading state for Rotur login button"
                                                id="mw.roturLogin.waiting"
                                            />
                                        </React.Fragment>
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Continue with Rotur"
                                            description="Primary button to start Rotur OAuth login"
                                            id="mw.roturLogin.continue"
                                        />
                                    )}
                                </Button>
                            </React.Fragment>
                        )}
                    </div>
                </div>
            </Modal>
        );
    }
}

RoturLoginModal.propTypes = {
    error: PropTypes.string,
    intl: intlShape,
    onRequestClose: PropTypes.func.isRequired,
    status: PropTypes.string,
    username: PropTypes.string
};

const mapStateToProps = state => ({
    error: state.scratchGui.rotur.error,
    status: state.scratchGui.rotur.status,
    username: state.scratchGui.rotur.username
});

export {RoturLoginModal};
export default injectIntl(connect(mapStateToProps)(RoturLoginModal));
