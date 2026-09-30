import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import {BookOpen, CircleHelp, Keyboard, MessageSquare, Search} from 'lucide-react';

import ChevronDown from './ChevronDown.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import MenuLabel from './tw-menu-label.jsx';
import {MenuItem, MenuSection} from '../menu/menu.jsx';
import {openHelp, openShortcutManagerModal} from '../../reducers/modals.js';
import {openHelpMenu, closeHelpMenu, helpMenuOpen} from '../../reducers/menus.js';
import {DOCS_BASE} from '../../lib/help/index.js';
import {FEEDBACK_URL} from '../../lib/constants/brand.js';
import {getCommandPaletteKey, openCommandPalette} from '../../lib/shortcuts/command-palette.js';

import styles from './menu-bar.css';

const messages = defineMessages({
    help: {
        defaultMessage: 'Help',
        description: 'Text for the help dropdown menu in the menu bar',
        id: 'mw.menuBar.helpMenu'
    }
});

const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
};

class HelpMenu extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickHelp',
            'handleClickDocs',
            'handleClickShortcuts',
            'handleClickCommandPalette',
            'handleClickFeedback'
        ]);
    }
    handleClickHelp () {
        this.props.onRequestClose();
        this.props.onOpenHelp();
    }
    handleClickDocs () {
        this.props.onRequestClose();
        openInNewTab(`${DOCS_BASE}/`);
    }
    handleClickShortcuts () {
        this.props.onRequestClose();
        this.props.onOpenShortcuts();
    }
    handleClickCommandPalette () {
        this.props.onRequestClose();
        openCommandPalette();
    }
    handleClickFeedback () {
        this.props.onRequestClose();
        openInNewTab(FEEDBACK_URL);
    }
    render () {
        const label = this.props.intl.formatMessage(messages.help);
        return (
            <MenuLabel
                ariaLabel={label}
                dataItem="help"
                open={this.props.open}
                onOpen={this.props.onRequestOpen}
                onClose={this.props.onRequestClose}
            >
                <CircleHelp size={20} />
                <span className={styles.collapsibleLabel}>
                    {label}
                </span>
                <ChevronDown size={8} />
                <MenuBarMenu
                    className={classNames(styles.menuBarMenu)}
                    mobileBack
                    mobileTitle={label}
                    onMobileClose={this.props.onRequestClose}
                    open={this.props.open}
                    place={this.props.isRtl ? 'left' : 'right'}
                >
                    <MenuSection>
                        <MenuItem onClick={this.handleClickHelp}>
                            <CircleHelp />
                            <FormattedMessage
                                defaultMessage="Open help"
                                description="Help menu item that opens the help window inside the editor"
                                id="mw.menuBar.openHelp"
                            />
                        </MenuItem>
                        <MenuItem onClick={this.handleClickDocs}>
                            <BookOpen />
                            <FormattedMessage
                                defaultMessage="Documentation"
                                description="Help menu item that opens the MistWarp documentation in a new tab"
                                id="mw.menuBar.documentation"
                            />
                        </MenuItem>
                    </MenuSection>
                    <MenuSection>
                        <MenuItem onClick={this.handleClickShortcuts}>
                            <Keyboard />
                            <FormattedMessage
                                defaultMessage="Keyboard shortcuts"
                                description="Help menu item that opens the keyboard shortcuts page in settings"
                                id="mw.menuBar.keyboardShortcuts"
                            />
                        </MenuItem>
                        <MenuItem
                            onClick={this.handleClickCommandPalette}
                            shortcut={getCommandPaletteKey()}
                        >
                            <Search />
                            <FormattedMessage
                                defaultMessage="Command palette"
                                description="Help menu item that opens the command palette for searching every command"
                                id="mw.menuBar.commandPalette"
                            />
                        </MenuItem>
                    </MenuSection>
                    {this.props.isStudent ? null : (
                        <MenuSection>
                            <MenuItem onClick={this.handleClickFeedback}>
                                <MessageSquare />
                                <FormattedMessage
                                    defaultMessage="Send feedback"
                                    description="Help menu item that opens the MistWarp roadmap and feedback page"
                                    id="mw.menuBar.sendFeedback"
                                />
                            </MenuItem>
                        </MenuSection>
                    )}
                </MenuBarMenu>
            </MenuLabel>
        );
    }
}

HelpMenu.propTypes = {
    intl: intlShape.isRequired,
    isRtl: PropTypes.bool,
    isStudent: PropTypes.bool,
    open: PropTypes.bool,
    onOpenHelp: PropTypes.func.isRequired,
    onOpenShortcuts: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    onRequestOpen: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    isStudent: Boolean(state.scratchGui.rotur && state.scratchGui.rotur.isStudent),
    open: helpMenuOpen(state)
});

const mapDispatchToProps = dispatch => ({
    onOpenHelp: () => dispatch(openHelp()),
    onOpenShortcuts: () => dispatch(openShortcutManagerModal()),
    onRequestClose: () => dispatch(closeHelpMenu()),
    onRequestOpen: () => dispatch(openHelpMenu())
});

const IntlHelpMenu = injectIntl(HelpMenu);

export {IntlHelpMenu as HelpMenu};
export default connect(mapStateToProps, mapDispatchToProps)(IntlHelpMenu);
