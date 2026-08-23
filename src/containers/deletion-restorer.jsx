import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert} from '../reducers/alerts';
import log from '../lib/utils/log';

/**
 * DeletionRestorer component passes a restoreDeletion function to its child.
 * It expects this child to be a function with the signature
 *     function (restoreDeletion, props) {}
 * The component can then be used to attach deletion restoring functionality
 * to any other component:
 *
 * <DeletionRestorer>{(restoreDeletion, props) => (
 *     <MyCoolComponent
 *         onClick={restoreDeletion}
 *         {...props}
 *     />
 * )}</DeletionRestorer>
 */
export class DeletionRestorer extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            restoring: false
        };
        this.restorePromise = null;
        bindAll(this, [
            'restoreDeletion'
        ]);
    }
    restoreDeletion () {
        if (this.restorePromise || typeof this.props.restore !== 'function') return this.restorePromise;

        this.setState({restoring: true});
        this.restorePromise = Promise.resolve()
            .then(() => this.props.restore())
            .then(() => {
                this.props.dispatchUpdateRestore({restoreFun: null, deletedItem: ''});
                this.restorePromise = null;
                this.setState({restoring: false});
                return true;
            })
            .catch(error => {
                log.error(error);
                this.restorePromise = null;
                this.setState({restoring: false});
                this.props.onShowRestoreError();
                return false;
            });
        return this.restorePromise;
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            children,
            dispatchUpdateRestore,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        const restorable = typeof this.props.restore === 'function' && !this.state.restoring;
        return this.props.children(this.restoreDeletion, {
            ...props,
            restorable
        });
    }
}

DeletionRestorer.propTypes = {
    children: PropTypes.func,
    deletedItem: PropTypes.string,
    dispatchUpdateRestore: PropTypes.func,
    onShowRestoreError: PropTypes.func.isRequired,
    restore: PropTypes.func
};

const mapStateToProps = state => ({
    deletedItem: state.scratchGui.restoreDeletion.deletedItem,
    restore: state.scratchGui.restoreDeletion.restoreFun
});
const mapDispatchToProps = dispatch => ({
    dispatchUpdateRestore: updatedState => {
        dispatch(setRestore(updatedState));
    },
    onShowRestoreError: () => dispatch(showStandardAlert('assetRestoreError'))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DeletionRestorer);
