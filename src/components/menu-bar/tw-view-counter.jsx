import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';

import log from '../../lib/utils/log';

const ENDPOINT_BASE = 'https://windchimes.turbowarp.org/api/scratch/';
const cache = new Map();

const messages = defineMessages({
    viewsLabel: {
        id: 'tw.viewCounter.viewsLabel',
        defaultMessage: 'Views',
        description: 'Label for project view counter'
    }
});

class TWViewCounter extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            total: null
        };
        this._abortController = null;
    }

    componentDidMount () {
        this.fetchIfNeeded();
    }

    componentDidUpdate (prevProps) {
        if (prevProps.projectId !== this.props.projectId) {
            this.fetchIfNeeded();
        }
    }

    componentWillUnmount () {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
    }

    fetchIfNeeded () {
        const {projectId} = this.props;
        if (!projectId || projectId === '0') {
            if (this.state.total !== null) {
                this.setState({total: null});
            }
            return;
        }

        if (cache.has(projectId)) {
            const total = cache.get(projectId);
            if (this.state.total !== total) {
                this.setState({total});
            }
            return;
        }

        if (this._abortController) {
            this._abortController.abort();
        }
        this._abortController = new AbortController();

        fetch(`${ENDPOINT_BASE}${encodeURIComponent(projectId)}`, {
            signal: this._abortController.signal
        })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 404) {
                        return {total: 0};
                    }
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                if (typeof data !== 'object' || data === null) {
                    throw new Error('Invalid response');
                }
                const total = Number(data.total);
                if (!Number.isFinite(total)) {
                    throw new Error('Invalid total');
                }
                cache.set(projectId, total);
                this.setState({total});
            })
            .catch(err => {
                if (err && err.name === 'AbortError') {
                    return;
                }
                log.error('Failed to fetch view counter', err);
            });
    }

    render () {
        const {total} = this.state;
        if (total === null) {
            return null;
        }

        const viewsLabel = this.props.intl.formatMessage(messages.viewsLabel);
        return (
            <span
                title={viewsLabel}
                aria-label={viewsLabel}
            >
                <FormattedMessage
                    id="tw.viewCounter.views"
                    defaultMessage="{count, number} {count, plural, one {view} other {views}}"
                    description="Project view count"
                    values={{count: total}}
                />
            </span>
        );
    }
}

TWViewCounter.propTypes = {
    intl: intlShape.isRequired,
    projectId: PropTypes.string
};

export default injectIntl(TWViewCounter);
