import {defineMessages} from 'react-intl';

const labels = defineMessages({
    'file': {defaultMessage: 'File', id: 'mw.settings.menuBar.item.file'},
    'view': {defaultMessage: 'Settings', id: 'mw.settings.menuBar.item.settings'},
    'bookmarks': {defaultMessage: 'Bookmarks', id: 'mw.settings.menuBar.item.bookmarks'},
    'edit': {defaultMessage: 'Edit', id: 'mw.settings.menuBar.item.edit'},
    'tools': {defaultMessage: 'Tools', id: 'mw.settings.menuBar.item.tools'},
    'mode': {defaultMessage: 'Mode', id: 'mw.settings.menuBar.item.mode'},
    'block-count': {defaultMessage: 'Block count', id: 'mw.settings.menuBar.item.blockCount'},
    'save-status': {defaultMessage: 'Save status', id: 'mw.settings.menuBar.item.saveStatus'},
    'about': {defaultMessage: 'About', id: 'mw.settings.menuBar.item.about'},
    'project-title': {defaultMessage: 'Project title', id: 'mw.settings.menuBar.item.projectTitle'},
    'community': {defaultMessage: 'Project page', id: 'mw.settings.menuBar.item.projectPage'},
    'rotur-account': {defaultMessage: 'Rotur profile', id: 'mw.settings.menuBar.item.roturProfile'},
    'feedback': {defaultMessage: 'Feedback', id: 'mw.settings.menuBar.item.feedback'},
    'collab-presence': {defaultMessage: 'Collaboration', id: 'mw.settings.menuBar.item.collaboration'},
    'share': {defaultMessage: 'Share', id: 'mw.settings.menuBar.item.share'},
    'remix': {defaultMessage: 'Remix', id: 'mw.settings.menuBar.item.remix'}
});

const humanizeId = id => {
    const text = id.replace(/[-_]+/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const getMenuBarItemLabel = (intl, id) => {
    if (labels[id]) return intl.formatMessage(labels[id]);
    return humanizeId(id);
};

export {getMenuBarItemLabel};
