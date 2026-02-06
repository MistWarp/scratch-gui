import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import log from '../utils/log';
import {getIsShowingProject} from '../../reducers/project-state';
import windowManager from '../../addons/window-system/window-manager';

const PACKAGER_URL = 'https://packager.warp.mistium.com';
const PACKAGER_ORIGIN = PACKAGER_URL;

let packagerWindow = null;

const PackagerIntegrationHOC = function (WrappedComponent) {
    class PackagerIntegrationComponent extends React.Component {
        constructor (props) {
            super(props);
            this.handleClickPackager = this.handleClickPackager.bind(this);
            this.handleMessage = this.handleMessage.bind(this);
        }
        componentDidMount () {
            window.addEventListener('message', this.handleMessage);
        }
        componentWillUnmount () {
            window.removeEventListener('message', this.handleMessage);
        }
        handleClickPackager () {
            if (!this.props.canOpenPackager) {
                return;
            }

            if (packagerWindow && packagerWindow.isVisible) {
                packagerWindow.bringToFront();
                return;
            }

            packagerWindow = windowManager.createWindow({
                title: 'Packager',
                width: 700,
                height: 700,
                minWidth: 600,
                minHeight: 400,
                x: Math.max(50, (window.innerWidth - 700) / 2),
                y: Math.max(50, (window.innerHeight - 700) / 2),
                onClose: () => {
                    packagerWindow = null;
                }
            });

            const container = packagerWindow.getContentElement();
            container.style.padding = '0';
            container.style.overflow = 'hidden';

            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '0 0 8px 8px';
            iframe.src = `${PACKAGER_URL}/?import_from=${location.origin}`;

            container.appendChild(iframe);
            packagerWindow.show();
        }
        handleMessage (e) {
            if (e.origin !== PACKAGER_ORIGIN) {
                return;
            }

            if (!this.props.canOpenPackager) {
                return;
            }

            const packagerData = e.data.p4;
            if (packagerData.type !== 'ready-for-import') {
                return;
            }

            // The packager needs to know that we will be importing something so it can display a loading screen
            e.source.postMessage({
                p4: {
                    type: 'start-import'
                }
            }, e.origin);

            this.props.vm.saveProjectSb3('arraybuffer')
                .then(buffer => {
                    const name = `${this.props.reduxProjectTitle}.sb3`;
                    e.source.postMessage({
                        p4: {
                            type: 'finish-import',
                            data: buffer,
                            name
                        }
                    }, e.origin, [buffer]);
                })
                .catch(err => {
                    log.error(err);
                    e.source.postMessage({
                        p4: {
                            type: 'cancel-import'
                        }
                    }, e.origin);
                });
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                canOpenPackager,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return (
                <WrappedComponent
                    onClickPackager={this.handleClickPackager}
                    {...props}
                />
            );
        }
    }
    PackagerIntegrationComponent.propTypes = {
        canOpenPackager: PropTypes.bool,
        reduxProjectTitle: PropTypes.string,
        vm: PropTypes.shape({
            saveProjectSb3: PropTypes.func
        })
    };
    const mapStateToProps = state => ({
        canOpenPackager: getIsShowingProject(state.scratchGui.projectState.loadingState),
        reduxProjectTitle: state.scratchGui.projectTitle,
        vm: state.scratchGui.vm
    });
    const mapDispatchToProps = () => ({});
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(PackagerIntegrationComponent);
};

export {
    PackagerIntegrationHOC as default
};
