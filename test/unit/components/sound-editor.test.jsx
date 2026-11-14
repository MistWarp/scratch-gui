import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import SoundEditor from '../../../src/components/sound-editor/sound-editor';

jest.mock('../../../src/components/sound-editor/sound-timeline.jsx', () => () => null);

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
            levels: [],
            loop: false,
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
            onChangeParam: jest.fn(),
            onCopy: jest.fn(),
            onCopyToNew: jest.fn(),
            onCut: jest.fn(),
            onDelete: jest.fn(),
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
        const slider = wrapper.find('input[data-param="db"]');
        expect(slider.prop('value')).toBe(3);
        expect(wrapper.text()).toContain('+3.0 dB');
        slider.simulate('change', {target: {value: '6'}});
        expect(props.onChangeParam).toHaveBeenCalled();
        labelled(wrapper, 'Preview').simulate('click');
        expect(props.onPreview).toHaveBeenCalled();
        labelled(wrapper, 'Apply').simulate('click');
        expect(props.onApply).toHaveBeenCalled();
        wrapper.setProps({previewing: true});
        labelled(wrapper, 'Stop').simulate('click');
        expect(props.onStop).toHaveBeenCalled();
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
        wrapper.setProps({mixSources: [{index: '1', name: 'other'}], mixSource: '1'});
        expect(wrapper.find('select').prop('value')).toBe('1');
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
