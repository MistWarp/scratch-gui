import {defineMessages} from 'react-intl';

const editorTabMessages = defineMessages({
    code: {defaultMessage: 'Code', description: 'Button to get to the code panel', id: 'gui.gui.codeTab'},
    costumes: {
        defaultMessage: 'Costumes',
        description: 'Button to get to the costumes panel',
        id: 'gui.gui.costumesTab'
    },
    backdrops: {
        defaultMessage: 'Backdrops',
        description: 'Button to get to the backdrops panel',
        id: 'gui.gui.backdropsTab'
    },
    sounds: {defaultMessage: 'Sounds', description: 'Button to get to the sounds panel', id: 'gui.gui.soundsTab'}
});

const getEditorTabLabels = (intl, targetIsStage) => ({
    code: intl.formatMessage(editorTabMessages.code),
    costumes: intl.formatMessage(targetIsStage ? editorTabMessages.backdrops : editorTabMessages.costumes),
    sounds: intl.formatMessage(editorTabMessages.sounds)
});

export {editorTabMessages, getEditorTabLabels};
