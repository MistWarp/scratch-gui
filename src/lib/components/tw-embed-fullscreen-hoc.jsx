import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {setFullScreen} from '../../reducers/mode';
import {setIsWindowFullScreen} from '../../reducers/tw';
import FullscreenAPI from '../api/fullscreen';

const TWFullScreenHOC = function (WrappedComponent) {
    class FullScreenComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'handleFullScreenChange'
            ]);
        }
        componentDidMount () {
            this.mounted = true;
            document.addEventListener('fullscreenchange', this.handleFullScreenChange);
            document.addEventListener('webkitfullscreenchange', this.handleFullScreenChange);
        }
        componentDidUpdate (previousProps) {
            if (this.props.isFullScreen === previousProps.isFullScreen) return;
            if (FullscreenAPI.available()) {
                let operation;
                if (this.props.isFullScreen) {
                    operation = FullscreenAPI.request();
                } else if (FullscreenAPI.enabled()) {
                    operation = FullscreenAPI.exit();
                }
                if (operation && typeof operation.catch === 'function') {
                    operation.catch(() => {
                        if (this.mounted) this.handleFullScreenChange();
                    });
                }
            }
        }
        componentWillUnmount () {
            this.mounted = false;
            document.removeEventListener('fullscreenchange', this.handleFullScreenChange);
            document.removeEventListener('webkitfullscreenchange', this.handleFullScreenChange);
        }
        handleFullScreenChange () {
            const isFullScreen = FullscreenAPI.enabled();
            this.props.onSetWindowIsFullScreen(isFullScreen);
            this.props.onSetIsFullScreen(isFullScreen);
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                isFullScreen,
                onSetIsFullScreen,
                onSetWindowIsFullScreen,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return (
                <WrappedComponent
                    {...props}
                />
            );
        }
    }
    FullScreenComponent.propTypes = {
        isFullScreen: PropTypes.bool,
        onSetIsFullScreen: PropTypes.func,
        onSetWindowIsFullScreen: PropTypes.func
    };
    const mapStateToProps = state => ({
        isFullScreen: state.scratchGui.mode.isFullScreen
    });
    const mapDispatchToProps = dispatch => ({
        onSetIsFullScreen: isFullScreen => dispatch(setFullScreen(isFullScreen)),
        onSetWindowIsFullScreen: isFullScreen => dispatch(setIsWindowFullScreen(isFullScreen))
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(FullScreenComponent);
};

export {
    TWFullScreenHOC as default
};
