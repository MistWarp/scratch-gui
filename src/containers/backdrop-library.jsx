import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import {getBackdropLibrary} from '../lib/libraries/tw-async-libraries';
import backdropTags from '../lib/libraries/backdrop-tags';
import LibraryComponent from '../components/library/library.jsx';
import {showStandardAlert} from '../reducers/alerts';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Backdrop',
        description: 'Heading for the backdrop library',
        id: 'gui.costumeLibrary.chooseABackdrop'
    }
});


class BackdropLibrary extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect'
        ]);
        this.state = {
            data: getBackdropLibrary()
        };
        this._isMounted = false;
    }
    componentDidMount () {
        this._isMounted = true;
        if (this.state.data.then) {
            this.state.data.then(data => {
                if (this._isMounted) this.setState({data});
            }).catch(error => {
                if (this._isMounted) this.props.onShowImportError(error);
            });
        }
    }
    componentWillUnmount () {
        this._isMounted = false;
    }
    handleItemSelect (item) {
        const vmBackdrop = {
            name: item.name,
            rotationCenterX: item.rotationCenterX,
            rotationCenterY: item.rotationCenterY,
            bitmapResolution: item.bitmapResolution,
            skinId: null
        };
        // Do not switch to stage, just add the backdrop
        return this.props.vm.addBackdrop(item.md5ext, vmBackdrop)
            .catch(this.props.onShowImportError);
    }
    render () {
        return (
            <LibraryComponent
                data={this.state.data.then ? null : this.state.data}
                id="backdropLibrary"
                tags={backdropTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

BackdropLibrary.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func,
    onShowImportError: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapDispatchToProps = dispatch => ({
    onShowImportError: () => dispatch(showStandardAlert('assetImportError'))
});

export default injectIntl(connect(null, mapDispatchToProps)(BackdropLibrary));

export {BackdropLibrary};
