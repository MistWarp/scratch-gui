import React from 'react';
import ReactDOM from 'react-dom';
import PostToClawModal from '../../community/components/PostToClawModal.jsx';
import {LayerScopeContext} from '../../community/components/ui/Layer.jsx';
import {CommunityIntlProvider} from '../../community/i18n.jsx';
import {sitePostUrl} from '../../community/claw-links.js';
import {getState as getIdentity, restore as restoreIdentity} from '../rotur/identity.js';
import scopeStyles from './community-scope.css';

let container = null;

const closeClawPost = () => {
    if (!container) return;
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
};

const openClawPost = async project => {
    const identity = getIdentity();
    const user = (identity && identity.user) || await restoreIdentity();
    if (!user || !user.username) return false;
    closeClawPost();
    container = document.createElement('div');
    document.body.appendChild(container);
    ReactDOM.render(React.createElement(
        CommunityIntlProvider,
        null,
        React.createElement(
            LayerScopeContext.Provider,
            {value: scopeStyles.scope},
            React.createElement(PostToClawModal, {
                project,
                user,
                onClose: closeClawPost,
                onViewPost: id => {
                    window.open(sitePostUrl(id), '_blank', 'noopener');
                    closeClawPost();
                }
            })
        )
    ), container);
    return true;
};

export {closeClawPost};
export default openClawPost;
