import React from 'react';
import VM from 'scratch-vm';

import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import Button from '../../../src/components/button/button.jsx';
import {getEditorTabLabels} from '../../../src/components/gui/editor-tab-labels.js';
import {StageHeaderComponent} from '../../../src/components/stage-header/stage-header.jsx';
import {STAGE_SIZE_MODES} from '../../../src/lib/constants/layout-constants';

describe('editor control accessibility', () => {
    test('editor tabs keep accessible names when their visible labels are hidden', () => {
        const intl = {formatMessage: message => message.defaultMessage};
        expect(getEditorTabLabels(intl, false)).toEqual({
            code: 'Code',
            costumes: 'Costumes',
            sounds: 'Sounds'
        });
        expect(getEditorTabLabels(intl, true).costumes).toBe('Backdrops');
    });

    test('fullscreen control labels the button instead of its icon', () => {
        const header = shallowWithIntl(
            <StageHeaderComponent
                customStageSize={{height: 360, width: 480}}
                isEmbedded={false}
                isFullScreen={false}
                isPlayerOnly={false}
                onKeyPress={jest.fn()}
                onOpenSettings={jest.fn()}
                onSetStageFull={jest.fn()}
                onSetStageFullScreen={jest.fn()}
                onSetStageHidden={jest.fn()}
                onSetStageLarge={jest.fn()}
                onSetStageSmall={jest.fn()}
                onSetStageUnFullScreen={jest.fn()}
                showFixedLargeSize={false}
                stageSize="large"
                stageSizeMode={STAGE_SIZE_MODES.full}
                vm={new VM()}
            />
        );

        expect(header.find(Button).filterWhere(button => (
            button.prop('aria-label') === 'Enter full screen mode'
        ))).toHaveLength(1);
    });

    test('mobile stage view can omit the redundant fullscreen control', () => {
        const header = shallowWithIntl(
            <StageHeaderComponent
                hideFullscreenButton
                customStageSize={{height: 360, width: 480}}
                isEmbedded={false}
                isFullScreen={false}
                isPlayerOnly={false}
                onKeyPress={jest.fn()}
                onOpenSettings={jest.fn()}
                onSetStageFull={jest.fn()}
                onSetStageFullScreen={jest.fn()}
                onSetStageHidden={jest.fn()}
                onSetStageLarge={jest.fn()}
                onSetStageSmall={jest.fn()}
                onSetStageUnFullScreen={jest.fn()}
                showFixedLargeSize={false}
                stageSize="large"
                stageSizeMode={STAGE_SIZE_MODES.full}
                vm={new VM()}
            />
        );

        expect(header.find(Button).filterWhere(button => (
            button.prop('aria-label') === 'Enter full screen mode'
        ))).toHaveLength(0);
    });
});
