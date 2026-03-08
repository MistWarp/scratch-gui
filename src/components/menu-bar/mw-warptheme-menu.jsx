import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';
import {MenuItem} from '../menu/menu.jsx';
import {openWarpThemeModal} from '../../reducers/modals';
import {openCustomThemes, closeSettingsMenu} from '../../reducers/menus';

import {Store} from 'lucide-react';

class WarpThemeMenu extends React.Component {
    handleClick () {
        this.props.onOpenWarpTheme();
        this.props.onRequestClose();
    }

    render () {
        return (
            <MenuItem
                onClick={() => this.handleClick()}
            >
                <Store size={16} />
                <FormattedMessage
                    defaultMessage="WarpTheme Marketplace"
                    description="Menu item to open WarpTheme marketplace"
                    id="mw.menu.warptheme"
                />
            </MenuItem>
        );
    }
}

WarpThemeMenu.propTypes = {
    onOpenWarpTheme: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => ({
    onOpenWarpTheme: () => {
        dispatch(openWarpThemeModal());
    },
    onRequestClose: () => dispatch(closeSettingsMenu())
});

export default connect(
    null,
    mapDispatchToProps
)(WarpThemeMenu);
