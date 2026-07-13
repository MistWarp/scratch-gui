import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import CollaborationSpriteIndicator from '../components/collaboration-sprite-indicator.jsx';
import {usersOnTab} from '../lib/collaboration/presence-selectors.js';

/**
 * The avatars on an editor tab: who is off in Costumes or Sounds while you
 * are in Code. Your own tab shows nothing — you can already see who is there.
 */
const CollaborationTabIndicator = connect(
    (state, {tab}) => ({
        users: tab === state.scratchGui.editorTab.activeTabIndex ?
            [] :
            usersOnTab(state.scratchGui.collaboration.activity, tab),
        verb: 'is on this tab',
        inline: true
    })
)(CollaborationSpriteIndicator);

CollaborationTabIndicator.propTypes = {
    tab: PropTypes.number.isRequired
};

export default CollaborationTabIndicator;
