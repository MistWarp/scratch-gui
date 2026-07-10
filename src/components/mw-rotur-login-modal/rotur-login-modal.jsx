import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {Activity, Cloud, GitBranch, Users} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
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

const FEATURES = [
    {
        icon: Activity,
        title: (
            <FormattedMessage
                defaultMessage="Show what you're editing"
                description="Rotur login feature title"
                id="mw.roturLogin.feature.activity.title"
            />
        ),
        description: (
            <FormattedMessage
                defaultMessage="Share MistWarp activity on your Rotur profile."
                description="Rotur login feature description"
                id="mw.roturLogin.feature.activity.desc"
            />
        )
    },
    {
        icon: Cloud,
        title: (
            <FormattedMessage
                defaultMessage="Cloud themes and settings"
                description="Rotur login feature title"
                id="mw.roturLogin.feature.cloud.title"
            />
        ),
        description: (
            <FormattedMessage
                defaultMessage="Sync themes and settings across devices when signed in."
                description="Rotur login feature description"
                id="mw.roturLogin.feature.cloud.desc"
            />
        )
    },
    {
        icon: GitBranch,
        title: (
            <FormattedMessage
                defaultMessage="Rotur Git in the Git window"
                description="Rotur login feature title"
                id="mw.roturLogin.feature.git.title"
            />
        ),
        description: (
            <FormattedMessage
                defaultMessage="Create repos on git.rotur.dev, push your project, and clone others."
                description="Rotur login feature description"
                id="mw.roturLogin.feature.git.desc"
            />
        )
    }
];

const COMING_SOON = [
    {
        icon: Users,
        title: (
            <FormattedMessage
                defaultMessage="Friends and collab invites"
                description="Upcoming Rotur feature title"
                id="mw.roturLogin.coming.friends.title"
            />
        ),
        description: (
            <FormattedMessage
                defaultMessage="See online friends on MistWarp and invite them to collab."
                description="Upcoming Rotur feature description"
                id="mw.roturLogin.coming.friends.desc"
            />
        )
    }
];

const FeatureRow = ({icon: Icon, title, description, comingSoon}) => (
    <li className={comingSoon ? styles.featureComing : styles.feature}>
        <div className={styles.featureIcon}>
            <Icon />
        </div>
        <div className={styles.featureText}>
            <p className={styles.featureTitle}>{title}</p>
            <p className={styles.featureDesc}>{description}</p>
        </div>
    </li>
);

FeatureRow.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.node.isRequired,
    description: PropTypes.node.isRequired,
    comingSoon: PropTypes.bool
};

class RoturLoginModal extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            busy: false,
            localError: null
        };
        this.handleLogin = this.handleLogin.bind(this);
    }

    async handleLogin () {
        if (this.state.busy) return;
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
                headerClassName={styles.header}
                id="roturLoginModal"
                onRequestClose={this.props.onRequestClose}
                resizable
                maximizable={false}
                width={440}
                height={480}
                minHeight={320}
                minWidth={320}
            >
                <Box className={styles.body}>
                    <div className={styles.hero}>
                        <img
                            alt=""
                            className={styles.logo}
                            draggable={false}
                            src="https://rotur.dev/Rotur%20Logo.png"
                        />
                        <div className={styles.heroText}>
                            <h2 className={styles.title}>
                                {loggedIn ? (
                                    <FormattedMessage
                                        defaultMessage="Rotur in MistWarp"
                                        description="Headline in Rotur info modal when signed in"
                                        id="mw.roturLogin.infoHeadline"
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
                                        // eslint-disable-next-line max-len
                                        defaultMessage="You're signed in as {username}. Here's what your account enables."
                                        description="Subtitle in Rotur info modal when signed in"
                                        id="mw.roturLogin.infoSubtitle"
                                        values={{username: this.props.username}}
                                    />
                                ) : (
                                    <FormattedMessage
                                        // eslint-disable-next-line max-len
                                        defaultMessage="Sign in for presence, your profile picture, and cloud sync of themes and settings."
                                        description="Subtitle in Rotur login modal"
                                        id="mw.roturLogin.subtitle"
                                    />
                                )}
                            </p>
                        </div>
                    </div>

                    <p className={styles.sectionLabel}>
                        <FormattedMessage
                            defaultMessage="What you unlock"
                            description="Section label listing Rotur login benefits"
                            id="mw.roturLogin.unlocks"
                        />
                    </p>

                    <ul className={styles.featureList}>
                        {FEATURES.map((feature, index) => (
                            <FeatureRow
                                key={`feature-${index}`}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                            />
                        ))}
                    </ul>

                    <p className={styles.sectionLabel}>
                        <FormattedMessage
                            defaultMessage="Coming soon"
                            description="Section label for planned Rotur features"
                            id="mw.roturLogin.comingSoon"
                        />
                    </p>

                    <ul className={styles.featureList}>
                        {COMING_SOON.map((feature, index) => (
                            <FeatureRow
                                key={`coming-${index}`}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                comingSoon
                            />
                        ))}
                    </ul>

                    {error ? (
                        <p className={styles.error}>{error}</p>
                    ) : null}

                    <div className={styles.actions}>
                        {loggedIn ? (
                            <button
                                className={`${styles.button} ${styles.primary}`}
                                onClick={this.props.onRequestClose}
                                type="button"
                            >
                                <FormattedMessage
                                    defaultMessage="Close"
                                    description="Close button on Rotur info modal"
                                    id="mw.roturLogin.close"
                                />
                            </button>
                        ) : (
                            <React.Fragment>
                                <button
                                    className={`${styles.button} ${styles.secondary}`}
                                    onClick={this.props.onRequestClose}
                                    type="button"
                                >
                                    <FormattedMessage
                                        defaultMessage="Not now"
                                        description="Cancel button on Rotur login modal"
                                        id="mw.roturLogin.notNow"
                                    />
                                </button>
                                <button
                                    className={`${styles.button} ${styles.primary}`}
                                    disabled={busy}
                                    onClick={this.handleLogin}
                                    type="button"
                                >
                                    {busy ? (
                                        <FormattedMessage
                                            defaultMessage="Opening Rotur..."
                                            description="Loading state for Rotur login button"
                                            id="mw.roturLogin.opening"
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Continue with Rotur"
                                            description="Primary button to start Rotur OAuth login"
                                            id="mw.roturLogin.continue"
                                        />
                                    )}
                                </button>
                            </React.Fragment>
                        )}
                    </div>

                    <p className={styles.footnote}>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="Secure sign-in on {link}. Your account powers presence, cloud sync, and Rotur Git."
                            description="Privacy footnote under Rotur login"
                            id="mw.roturLogin.footnote"
                            values={{
                                link: (
                                    <a
                                        href="https://rotur.dev"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        rotur.dev
                                    </a>
                                )
                            }}
                        />
                    </p>
                </Box>
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

export default injectIntl(connect(mapStateToProps)(RoturLoginModal));
