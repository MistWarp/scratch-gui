import {defineMessages} from 'react-intl';

const messages = defineMessages({
    mistwarpGames: {
        id: 'mw.extensionTags.mistwarpGames',
        defaultMessage: 'MistWarp Games',
        description: 'Extension library filter and section for MistWarp game extensions'
    },
    scratch: {
        id: 'mw.extensionTags.scratch',
        defaultMessage: 'Scratch',
        description: 'Extension library filter and section for extensions that come from Scratch'
    },
    turbowarp: {
        id: 'mw.extensionTags.turbowarp',
        defaultMessage: 'TurboWarp',
        description: 'Extension library filter and section for extensions from TurboWarp and its gallery'
    },
    mistium: {
        id: 'mw.extensionTags.mistium',
        defaultMessage: 'Mistium',
        description: 'Extension library filter and section for extensions made by Mistium'
    },
    rotur: {
        id: 'mw.extensionTags.rotur',
        defaultMessage: 'Rotur',
        description: 'Extension library filter and section for extensions that use Rotur accounts'
    }
});

export default [
    {tag: 'mistwarp-games', intlLabel: messages.mistwarpGames},
    {tag: 'scratch', intlLabel: messages.scratch},
    {tag: 'tw', intlLabel: messages.turbowarp},
    {tag: 'mistium', intlLabel: messages.mistium},
    {tag: 'rotur', intlLabel: messages.rotur}
];
