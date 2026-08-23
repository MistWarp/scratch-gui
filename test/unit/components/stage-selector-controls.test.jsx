import React from 'react';
import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';

import StageSelector from '../../../src/components/stage-selector/stage-selector.jsx';

describe('stage selector controls', () => {
    test('keeps stage selection separate from backdrop actions', () => {
        const onClick = jest.fn();
        const wrapper = shallowWithIntl(
            <StageSelector
                backdropCount={2}
                raised={false}
                receivedBlocks={false}
                selected
                onClick={onClick}
                onNewBackdropClick={() => {}}
            />
        ).dive();
        const selectStage = wrapper.find('button[aria-pressed=true]');

        expect(selectStage.prop('type')).toBe('button');
        selectStage.simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
