import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape, defineMessages} from 'react-intl';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import {getSpriteLibrary} from '../lib/libraries/tw-async-libraries';
import randomizeSpritePosition from '../lib/utils/randomize-sprite-position';
import spriteTags from '../lib/libraries/sprite-tags';

import LibraryComponent from '../components/library/library.jsx';
import {showStandardAlert} from '../reducers/alerts';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Sprite',
        description: 'Heading for the sprite library',
        id: 'gui.spriteLibrary.chooseASprite'
    }
});

class SpriteLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect'
        ]);
        this.state = {
            data: getSpriteLibrary()
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
        // Randomize position of library sprite
        randomizeSpritePosition(item);
        return this.props.vm.addSprite(JSON.stringify(item))
            .then(() => this.props.onActivateBlocksTab())
            .catch(this.props.onShowImportError);
    }
    render () {
        return (
            <LibraryComponent
                data={this.state.data.then ? null : this.state.data}
                id="spriteLibrary"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                removedTrademarks
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

SpriteLibrary.propTypes = {
    intl: intlShape.isRequired,
    onActivateBlocksTab: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func,
    onShowImportError: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapDispatchToProps = dispatch => ({
    onShowImportError: () => dispatch(showStandardAlert('assetImportError'))
});

export default injectIntl(connect(null, mapDispatchToProps)(SpriteLibrary));

export {SpriteLibrary};
