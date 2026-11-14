import React from 'react';
import {mount} from 'enzyme';
import {SoundDropWatcher} from '../../../src/containers/sound-drop-watcher';
import DragConstants from '../../../src/lib/constants/drag-constants';

describe('Sound drop watcher', () => {
    let handlers;
    const idle = {dragging: false, currentOffset: null, dragType: null, index: null};
    const drag = (x, extra = {}) => ({
        dragging: true,
        currentOffset: {x, y: 10},
        dragType: DragConstants.SOUND,
        index: 2,
        ...extra
    });
    const mountWatcher = () => mount(
        <SoundDropWatcher
            dragInfo={idle}
            soundIndex={0}
            {...handlers}
        />
    );

    beforeEach(() => {
        handlers = {
            onDropSound: jest.fn(),
            onHover: jest.fn(),
            sampleAtPoint: jest.fn(x => (x >= 100 ? x - 100 : null))
        };
    });

    test('reports the sample under a dragged sound and drops it there', () => {
        const wrapper = mountWatcher();
        wrapper.setProps({dragInfo: drag(50)});
        expect(handlers.onHover).not.toHaveBeenCalled();
        wrapper.setProps({dragInfo: drag(150)});
        expect(handlers.onHover).toHaveBeenLastCalledWith(50);
        wrapper.setProps({dragInfo: drag(170)});
        expect(handlers.onHover).toHaveBeenLastCalledWith(70);
        wrapper.setProps({dragInfo: idle});
        expect(handlers.onHover).toHaveBeenLastCalledWith(null);
        expect(handlers.onDropSound).toHaveBeenCalledWith(2, 70);
    });

    test('does nothing when the drop is outside the waveform', () => {
        const wrapper = mountWatcher();
        wrapper.setProps({dragInfo: drag(150)});
        wrapper.setProps({dragInfo: drag(20)});
        expect(handlers.onHover).toHaveBeenLastCalledWith(null);
        wrapper.setProps({dragInfo: idle});
        expect(handlers.onDropSound).not.toHaveBeenCalled();
    });

    test('ignores other drags and the sound being edited', () => {
        const wrapper = mountWatcher();
        wrapper.setProps({dragInfo: drag(150, {dragType: DragConstants.COSTUME})});
        wrapper.setProps({dragInfo: drag(150, {index: 0})});
        wrapper.setProps({dragInfo: idle});
        expect(handlers.sampleAtPoint).not.toHaveBeenCalled();
        expect(handlers.onDropSound).not.toHaveBeenCalled();
    });
});
