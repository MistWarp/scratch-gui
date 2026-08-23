import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import {getCostumeLibrary} from '../lib/libraries/tw-async-libraries';
import spriteTags from '../lib/libraries/sprite-tags';
import LibraryComponent from '../components/library/library.jsx';
import {showStandardAlert} from '../reducers/alerts';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Costume',
        description: 'Heading for the costume library',
        id: 'gui.costumeLibrary.chooseACostume'
    }
});


class CostumeLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelected'
        ]);
        this.state = {
            data: getCostumeLibrary()
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
    handleItemSelected (item) {
        const vmCostume = {
            name: item.name,
            rotationCenterX: item.rotationCenterX,
            rotationCenterY: item.rotationCenterY,
            bitmapResolution: item.bitmapResolution,
            skinId: null
        };
        return this.props.vm.addCostumeFromLibrary(item.md5ext, vmCostume)
            .catch(this.props.onShowImportError);
    }
    render () {
        return (
            <LibraryComponent
                data={this.state.data.then ? null : this.state.data}
                id="costumeLibrary"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                removedTrademarks
                onItemSelected={this.handleItemSelected}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

CostumeLibrary.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func,
    onShowImportError: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapDispatchToProps = dispatch => ({
    onShowImportError: () => dispatch(showStandardAlert('assetImportError'))
});

export default injectIntl(connect(null, mapDispatchToProps)(CostumeLibrary));

export {CostumeLibrary};
