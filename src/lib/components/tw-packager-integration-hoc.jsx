/* eslint-disable react/jsx-no-bind */
import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {getIsShowingProject} from '../../reducers/project-state';
import {openSimpleDialog} from '../../reducers/modals';
import PackagerWindow from '../../containers/packager.jsx';
import windowManager from '../../addons/window-system/window-manager';

const PackagerIntegrationHOC = WrappedComponent => {
    class PackagerIntegrationComponent extends React.Component {
        state = {open: false};

        handleClickPackager = () => {
            if (!this.props.canOpenPackager) return;
            const existing = windowManager.getWindow('mw-packager');
            if (existing) {
                existing.show();
                existing.bringToFront();
            }
            this.setState({open: true});
        };

        render () {
            const {canOpenPackager, confirm, reduxProjectTitle, locale, vm, ...props} = this.props;
            return (<React.Fragment>
                <WrappedComponent
                    {...props}
                    vm={vm}
                    onClickPackager={this.handleClickPackager}
                />
                {this.state.open && <PackagerWindow
                    key={this.props.projectId || 'local'}
                    vm={vm}
                    projectTitle={reduxProjectTitle}
                    locale={locale}
                    confirm={confirm}
                    onClose={() => this.setState({open: false})}
                />}
            </React.Fragment>);
        }
    }
    PackagerIntegrationComponent.propTypes = {
        canOpenPackager: PropTypes.bool,
        confirm: PropTypes.func.isRequired,
        reduxProjectTitle: PropTypes.string,
        locale: PropTypes.string,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        vm: PropTypes.object
    };
    return connect(state => ({
        canOpenPackager: getIsShowingProject(state.scratchGui.projectState.loadingState),
        reduxProjectTitle: state.scratchGui.projectTitle,
        projectId: state.scratchGui.projectState.projectId,
        locale: state.locales.locale,
        vm: state.scratchGui.vm
    }), dispatch => ({
        confirm: (title, message) => new Promise(resolve => dispatch(openSimpleDialog({
            type: 'confirm',
            title,
            message,
            onOk: () => resolve(true),
            onCancel: () => resolve(false)
        })))
    }))(PackagerIntegrationComponent);
};

export default PackagerIntegrationHOC;
