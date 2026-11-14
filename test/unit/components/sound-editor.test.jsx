import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import SoundEditor from '../../../src/components/sound-editor/sound-editor';
import PlaybackMonitor from '../../../src/lib/audio/playback-monitor';

jest.mock('../../../src/components/sound-editor/sound-timeline.jsx', () => {
    const mockReact = require('react');
    const SoundTimeline = props => mockReact.createElement('div', null, props.overviewActions, props.footer);
    return SoundTimeline;
});

describe('Sound Editor Component', () => {
    let props;
    beforeEach(() => {
        props = {
            activeGroup: 'volume',
            activeTool: 'gain',
            busy: false,
            canPaste: false,
            canRedo: false,
            canRemove: true,
            canUndo: true,
            canZoomIn: true,
            canZoomOut: false,
            clip: {channels: [new Float32Array(100)], sampleRate: 100},
            clipVersion: 0,
            cursor: 0,
            duration: 1,
            isStereo: false,
            loop: false,
            markers: [],
            monitor: new PlaybackMonitor(),
            mixSource: '',
            mixSources: [],
            name: 'sound name',
            peak: 0.5,
            playhead: null,
            playing: false,
            previewing: false,
            sampleRate: 100,
            selection: {start: 20, end: 80},
            size: 10507,
            toolParams: {db: 3},
            viewLength: 100,
            viewStart: 0,
            onApply: jest.fn(),
            onChangeMixSource: jest.fn(),
            onChangeName: jest.fn(),
            onChangeOption: jest.fn(),
            onCopy: jest.fn(),
            onCopyToNew: jest.fn(),
            onCut: jest.fn(),
            onDelete: jest.fn(),
            onNudgeParam: jest.fn(),
            onPaste: jest.fn(),
            onPause: jest.fn(),
            onPlay: jest.fn(),
            onPreview: jest.fn(),
            onRedo: jest.fn(),
            onSeek: jest.fn(),
            onSelect: jest.fn(),
            onSelectGroup: jest.fn(),
            onSelectTool: jest.fn(),
            onStop: jest.fn(),
            onSubmitEnd: jest.fn(),
            onSubmitParam: jest.fn(),
            onSubmitStart: jest.fn(),
            onToStart: jest.fn(),
            onToggleLoop: jest.fn(),
            onTrim: jest.fn(),
            onUndo: jest.fn(),
            onView: jest.fn(),
            onZoomAround: jest.fn(),
            onZoomFit: jest.fn(),
            onZoomIn: jest.fn(),
            onZoomOut: jest.fn()
        };
    });

    const button = (wrapper, title) => wrapper.find(`button[title="${title}"]`);
    const labelled = (wrapper, text) => wrapper.find('button').filterWhere(node => node.text() === text)
        .last();

    test('shows the sound details', () => {
        const wrapper = mountWithIntl(<SoundEditor {...props} />);
        const text = wrapper.text();
        expect(text).toContain('Mono');
        expect(text).toContain('0:01.000');
        expect(text).toContain('Peak -6.0 dB');
    });

    test('the play button pauses while playing', () => {
        const wrapper = mountWithIntl(<SoundEditor {...props} />);
        wrapper.find('button[aria-label="Play"]').simulate('click');
        expect(props.onPlay).toHaveBeenCalled();
        wrapper.setProps({playing: true});
        wrapper.find('button[aria-label="Pause"]').simulate('click');
        expect(props.onPause).toHaveBeenCalled();
    });

    test('edit buttons call their callbacks and follow what is allowed', () => {
        const wrapper = mountWithIntl(<SoundEditor {...props} />);
        button(wrapper, 'Delete').simulate('click');
        button(wrapper, 'Copy').simulate('click');
        button(wrapper, 'Undo').simulate('click');
        expect(props.onDelete).toHaveBeenCalled();
        expect(props.onCopy).toHaveBeenCalled();
        expect(props.onUndo).toHaveBeenCalled();
        expect(button(wrapper, 'Redo').prop('disabled')).toBe(true);
        expect(button(wrapper, 'Paste').prop('disabled')).toBe(true);
        wrapper.setProps({canRemove: false});
        expect(button(wrapper, 'Delete').prop('disabled')).toBe(true);
        expect(button(wrapper, 'Trim to selection').prop('disabled')).toBe(true);
    });

    test('the loop button shows whether it is on', () => {
        const wrapper = mountWithIntl(<SoundEditor {...props} />);
        const loop = () => wrapper.find('button[aria-pressed]').filterWhere(node => node.prop('title') === 'Loop playback');
        expect(loop().prop('aria-pressed')).toBe(false);
        loop().simulate('click');
        expect(props.onToggleLoop).toHaveBeenCalled();
        wrapper.setProps({loop: true});
        expect(loop().prop('aria-pressed')).toBe(true);
    });

    test('shows the tools of the active group', () => {
        const wrapper = mountWithIntl(<SoundEditor {...props} />);
        const tools = wrapper.find('button[data-tool]').map(node => node.prop('data-tool'));
        expect(tools).toEqual(['gain', 'normalize', 'fadeIn', 'fadeOut', 'silence']);
        wrapper.find('button[data-group="effects"]').simulate('click');
        expect(props.onSelectGroup).toHaveBeenCalled();
        wrapper.find('button[data-tool="normalize"]').simulate('click');
        expect(props.onSelectTool).toHaveBeenCalled();
    });

    test('tool parameters, preview and apply call their callbacks', () => {
        const wrapper = mountWithIntl(<SoundEditor {...props} />);
        expect(wrapper.find('input[data-param="db"]').prop('value')).toBe('+3.0 dB');
        button(wrapper, 'Increase Amount').simulate('click');
        expect(props.onNudgeParam).toHaveBeenLastCalledWith('db', 1);
        button(wrapper, 'Decrease Amount').simulate('click');
        expect(props.onNudgeParam).toHaveBeenLastCalledWith('db', -1);
        labelled(wrapper, 'Preview').simulate('click');
        expect(props.onPreview).toHaveBeenCalled();
        labelled(wrapper, 'Apply').simulate('click');
        expect(props.onApply).toHaveBeenCalled();
        wrapper.setProps({previewing: true});
        labelled(wrapper, 'Stop').simulate('click');
        expect(props.onStop).toHaveBeenCalled();
    });

    test('a typed parameter value is submitted with its key', () => {
        const wrapper = mountWithIntl(<SoundEditor {...props} />);
        const field = wrapper.find('input[data-param="db"]');
        field.simulate('change', {target: {value: '-4.5'}});
        field.simulate('blur');
        expect(props.onSubmitParam).toHaveBeenCalledWith('db', '-4.5');
    });

    test('the arrow keys step a parameter while its field has focus', () => {
        const wrapper = mountWithIntl(<SoundEditor {...props} />);
        const field = wrapper.find('input[data-param="db"]');
        const preventDefault = jest.fn();
        field.simulate('keydown', {key: 'ArrowUp', preventDefault});
        expect(props.onNudgeParam).toHaveBeenLastCalledWith('db', 1);
        field.simulate('keydown', {key: 'ArrowDown', preventDefault});
        expect(props.onNudgeParam).toHaveBeenLastCalledWith('db', -1);
        field.simulate('keydown', {key: 'a', preventDefault});
        expect(props.onNudgeParam).toHaveBeenCalledTimes(2);
        expect(preventDefault).toHaveBeenCalledTimes(2);
    });

    test('holding a step button repeats until it is released', () => {
        jest.useFakeTimers();
        try {
            const wrapper = mountWithIntl(<SoundEditor {...props} />);
            const plus = button(wrapper, 'Increase Amount');
            plus.simulate('pointerdown', {button: 0});
            expect(props.onNudgeParam).toHaveBeenCalledTimes(1);
            jest.advanceTimersByTime(400);
            expect(props.onNudgeParam).toHaveBeenCalledTimes(2);
            jest.advanceTimersByTime(180);
            expect(props.onNudgeParam).toHaveBeenCalledTimes(4);
            plus.simulate('pointerup');
            plus.simulate('click', {detail: 1});
            jest.advanceTimersByTime(1000);
            expect(props.onNudgeParam).toHaveBeenCalledTimes(4);
            plus.simulate('pointerdown', {button: 2});
            expect(props.onNudgeParam).toHaveBeenCalledTimes(4);
        } finally {
            jest.useRealTimers();
        }
    });

    test('a held step button stops at the limit', () => {
        jest.useFakeTimers();
        try {
            const wrapper = mountWithIntl(<SoundEditor {...props} />);
            button(wrapper, 'Increase Amount').simulate('pointerdown', {button: 0});
            wrapper.setProps({toolParams: {db: 24}});
            expect(button(wrapper, 'Increase Amount').prop('disabled')).toBe(true);
            jest.advanceTimersByTime(2000);
            expect(props.onNudgeParam).toHaveBeenCalledTimes(1);
        } finally {
            jest.useRealTimers();
        }
    });

    test('zoom controls sit in the timeline next to the overview', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                canZoomIn
            />
        );
        const timeline = wrapper.find('SoundTimeline');
        timeline.find('button[aria-label="Zoom in"]').simulate('click');
        expect(props.onZoomIn).toHaveBeenCalled();
        expect(timeline.find('button[aria-label="Zoom out"]').prop('disabled')).toBe(true);
    });

    test('the compact layout swaps the toolbars for an Edit tab of labelled tiles', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                activeGroup="edit"
                activeTool={null}
                compact
            />
        );
        expect(wrapper.find('button[data-group]').map(node => node.prop('data-group')))
            .toEqual(['edit', 'volume', 'time', 'effects', 'mix']);
        expect(wrapper.find('button[data-action]').map(node => node.prop('data-action'))).toEqual([
            'cut', 'copy', 'paste', 'trim', 'delete', 'copyToNew', 'snap', 'previousMarker', 'marker', 'nextMarker'
        ]);
        expect(wrapper.find('button[data-action="trim"]').text()).toBe('Trim');
        expect(button(wrapper, 'Cut')).toHaveLength(1);
        button(wrapper, 'Cut').simulate('click');
        expect(props.onCut).toHaveBeenCalled();
        expect(wrapper.find('button[data-action="paste"]').prop('disabled')).toBe(true);
        expect(wrapper.find('button[data-action="snap"]').prop('aria-pressed')).toBe(false);
        expect(button(wrapper, 'Stop')).toHaveLength(0);
        expect(labelled(wrapper, 'Apply')).toHaveLength(0);
        expect(wrapper.find('button[data-tool]')).toHaveLength(0);
    });

    test('the compact layout shows the selection and peak as cells in the timeline', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                activeGroup="edit"
                activeTool={null}
                compact
            />
        );
        const timeline = wrapper.find('SoundTimeline');
        expect(timeline.text()).toBe('StartEndLength0:00.600Peak-6.0 dB');
        const start = timeline.find('input').first();
        expect(start.prop('value')).toBe('0:00.200');
        start.simulate('change', {target: {value: '0.3'}});
        start.simulate('blur');
        expect(props.onSubmitStart).toHaveBeenCalledWith('0.3');
        wrapper.setProps({peak: 1.5});
        expect(wrapper.find('SoundTimeline').text()).toContain('Too loud');
        expect(wrapper.text()).toContain('Mono');
    });

    test('the compact layout keeps the tool tabs working', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                compact
            />
        );
        expect(wrapper.find('button[data-tool]').map(node => node.prop('data-tool')))
            .toEqual(['gain', 'normalize', 'fadeIn', 'fadeOut', 'silence']);
        expect(wrapper.find('button[data-action]')).toHaveLength(0);
        labelled(wrapper, 'Apply').simulate('click');
        expect(props.onApply).toHaveBeenCalled();
    });

    test('the Edit tab only exists in the compact layout', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                activeGroup="edit"
                activeTool={null}
            />
        );
        expect(wrapper.find('button[data-group]').map(node => node.prop('data-group')))
            .toEqual(['volume', 'time', 'effects', 'mix']);
        expect(wrapper.find('button[data-group="volume"]').prop('aria-pressed')).toBe(true);
        expect(wrapper.find('button[data-tool]')).toHaveLength(5);
    });

    test('mixing explains when there is nothing to mix in', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                activeGroup="mix"
                activeTool="mix"
                toolParams={{db: 0}}
            />
        );
        expect(wrapper.find('select').exists()).toBe(false);
        expect(labelled(wrapper, 'Apply').prop('disabled')).toBe(true);
        wrapper.setProps({mixSources: [{id: 'b', index: 1, name: 'other'}], mixSource: 'b'});
        expect(wrapper.find('select').prop('value')).toBe('b');
        expect(wrapper.find('option').prop('value')).toBe('b');
    });

    test('the clock and meter follow playback without new props', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                playing
            />
        );
        expect(wrapper.text()).toContain('0:00.200');
        props.monitor.update({sample: 50, levels: [1]});
        wrapper.update();
        expect(wrapper.text()).toContain('0:00.500');
        expect(wrapper.find('[role="meter"]').find('div')
            .last()
            .prop('style').width).toBe('100%');
        props.monitor.update({recordingSeconds: 3});
        wrapper.update();
        expect(wrapper.text()).toContain('0:03.000');
    });

    test('recording turns the record button into a stop button', () => {
        const onRecord = jest.fn();
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                onRecord={onRecord}
            />
        );
        button(wrapper, 'Record at the cursor').simulate('click');
        expect(onRecord).toHaveBeenCalled();
        wrapper.setProps({recording: 'recording', busy: true});
        expect(wrapper.find('button[aria-label="Play"]').prop('disabled')).toBe(true);
        button(wrapper, 'Stop recording').first()
            .simulate('click');
        expect(props.onStop).toHaveBeenCalled();
        expect(wrapper.text()).toContain('Recording.');
    });

    test('marker and snap buttons reflect their state', () => {
        const onToggleMarker = jest.fn();
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                canNextMarker
                markers={[20, 90]}
                snap
                onToggleMarker={onToggleMarker}
            />
        );
        expect(button(wrapper, 'Remove this marker').prop('aria-pressed')).toBe(true);
        button(wrapper, 'Remove this marker').simulate('click');
        expect(onToggleMarker).toHaveBeenCalled();
        expect(button(wrapper, 'Go to the previous marker').prop('disabled')).toBe(true);
        expect(button(wrapper, 'Go to the next marker').prop('disabled')).toBe(false);
        expect(wrapper.find('button[aria-pressed=true]').filterWhere(node => /zero crossings/.test(node.prop('title')))
            .exists()).toBe(true);
    });

    test('warns when the sound is too large', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                size={11 * 1000 * 1000}
            />
        );
        expect(wrapper.text()).toContain('too large');
    });
});
