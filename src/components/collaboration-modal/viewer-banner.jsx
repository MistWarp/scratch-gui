import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Eye, LocateFixed} from 'lucide-react';

import styles from './viewer-banner.css';

const BODY_CLASS = 'mw-presentation-viewer';

class ViewerBanner extends React.Component {
    componentDidMount () {
        document.body.classList.add(BODY_CLASS);
    }

    componentWillUnmount () {
        document.body.classList.remove(BODY_CLASS);
    }

    render () {
        const {presenter, following, onFollow} = this.props;
        return (
            <div
                className={styles.banner}
                role="status"
            >
                <Eye
                    size={16}
                    aria-hidden="true"
                />
                <span className={styles.text}>
                    <FormattedMessage
                        defaultMessage="Watching {presenter}"
                        description="Banner shown to a read-only viewer of a classroom presentation"
                        id="mw.presentation.watching"
                        values={{presenter: presenter || '…'}}
                    />
                </span>
                {following ? (
                    <span className={styles.following}>
                        <FormattedMessage
                            defaultMessage="Following their view"
                            description="Banner state when the viewer follows the presenter's scrolling"
                            id="mw.presentation.following"
                        />
                    </span>
                ) : (
                    <button
                        type="button"
                        className={styles.follow}
                        onClick={onFollow}
                    >
                        <LocateFixed
                            size={14}
                            aria-hidden="true"
                        />
                        <FormattedMessage
                            defaultMessage="Follow presenter"
                            description="Button that snaps a viewer back to the presenter's view"
                            id="mw.presentation.follow"
                        />
                    </button>
                )}
            </div>
        );
    }
}

ViewerBanner.propTypes = {
    following: PropTypes.bool,
    onFollow: PropTypes.func.isRequired,
    presenter: PropTypes.string
};

ViewerBanner.defaultProps = {
    following: true,
    presenter: ''
};

export default ViewerBanner;
