import React from 'react';
import PropTypes from 'prop-types';
import {mount} from 'enzyme';
import {act} from 'react-dom/test-utils';

import useStagePanelLayout from '../../../src/components/gui/use-stage-panel-layout.js';

const rect = ({left = 0, width = 0, height = 0}) => ({
    left,
    right: left + width,
    top: 0,
    bottom: height,
    width,
    height,
    x: left,
    y: 0
});

const LAYOUT = {
    container: {width: 1280, height: 700},
    editor: {left: 0, width: 780, height: 700},
    panel: {left: 780, width: 500, height: 700}
};

const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

beforeEach(() => {
    Element.prototype.getBoundingClientRect = function () {
        const box = LAYOUT[this.className];
        return box ? rect(box) : originalGetBoundingClientRect.call(this);
    };
});

afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
});

let layout = null;

const Harness = ({customStageSize, isFullScreen, onSetStageSize, stageSizeMode, stageSizeRequestId}) => {
    layout = useStagePanelLayout({customStageSize, isFullScreen, onSetStageSize, stageSizeMode, stageSizeRequestId});
    return (
        <div className="container">
            <div
                className="editor"
                ref={layout.editorWrapperRef}
            />
            <div
                className="resizer"
                tabIndex={0}
                onKeyDown={layout.handleStagePanelResizeKeyDown}
                // eslint-disable-next-line react/no-unknown-property
                onPointerDown={layout.handleStagePanelResizePointerDown}
            />
            <div
                className="panel"
                ref={layout.stageAndTargetWrapperRef}
            />
        </div>
    );
};

Harness.propTypes = {
    customStageSize: PropTypes.shape({width: PropTypes.number, height: PropTypes.number}),
    isFullScreen: PropTypes.bool,
    onSetStageSize: PropTypes.func,
    stageSizeMode: PropTypes.string,
    stageSizeRequestId: PropTypes.number
};

const defaultProps = () => ({
    customStageSize: {width: 480, height: 360},
    isFullScreen: false,
    onSetStageSize: jest.fn(),
    stageSizeMode: 'full',
    stageSizeRequestId: 0
});

const flushFrames = () => new Promise(resolve => setTimeout(resolve, 50));

describe('useStagePanelLayout', () => {
    let wrapper = null;

    afterEach(() => {
        if (wrapper) wrapper.unmount();
        wrapper = null;
        layout = null;
    });

    test('a stage size request lays the panel out at the fixed width for that mode', async () => {
        const props = defaultProps();
        wrapper = mount(<Harness {...props} />);
        await act(flushFrames);

        act(() => {
            wrapper.setProps({stageSizeMode: 'large', stageSizeRequestId: 1});
        });
        await act(flushFrames);

        expect(layout.stagePanelWidth).toBe(484);
        expect(layout.stageContainerWidth).toBe(482);
        expect(props.onSetStageSize).not.toHaveBeenCalled();
    });

    test('a stage hidden by the user is reported as hidden', () => {
        wrapper = mount(<Harness
            {...defaultProps()}
            stageSizeMode="hidden"
        />);
        expect(layout.isStageHidden).toBe(true);
        act(() => {
            wrapper.setProps({isFullScreen: true});
        });
        expect(layout.isStageHidden).toBe(false);
    });

    test('keyboard resizing narrows the panel and switches the stage to small mode', async () => {
        const props = defaultProps();
        wrapper = mount(<Harness {...props} />);
        await act(flushFrames);

        act(() => {
            wrapper.find('.resizer').simulate('keydown', {key: 'ArrowLeft'});
        });
        await act(flushFrames);

        expect(layout.stagePanelWidth).toBe(258);
        expect(layout.stageContainerWidth).toBe(240);
        expect(props.onSetStageSize).toHaveBeenCalledWith('small');
    });

    test('Home resets the panel to its natural width', async () => {
        const props = defaultProps();
        wrapper = mount(<Harness {...props} />);
        await act(flushFrames);
        act(() => {
            wrapper.find('.resizer').simulate('keydown', {key: 'ArrowRight', shiftKey: true});
        });
        expect(layout.stagePanelWidth).toBe(338);
        act(() => {
            wrapper.find('.resizer').simulate('keydown', {key: 'Home'});
        });
        expect(layout.stagePanelWidth).toBeNull();
    });
});

describe('useStagePanelDrag through useStagePanelLayout', () => {
    let wrapper = null;
    let originalFrame = null;
    let originalCancelFrame = null;
    let frames = [];

    const flushQueuedFrames = () => {
        const queued = frames;
        frames = [];
        act(() => {
            queued.forEach(callback => callback && callback());
        });
    };

    const startDrag = props => {
        if (!wrapper) {
            wrapper = mount(<Harness {...props} />, {attachTo: document.body.appendChild(document.createElement('div'))});
            flushQueuedFrames();
        }
        act(() => {
            wrapper.find('.resizer').simulate('pointerdown', {clientX: 780, button: 0});
        });
    };

    const moveTo = clientX => {
        act(() => {
            window.dispatchEvent(new MouseEvent('pointermove', {clientX}));
        });
        flushQueuedFrames();
    };

    const release = () => {
        act(() => {
            window.dispatchEvent(new MouseEvent('pointerup'));
        });
    };

    beforeEach(() => {
        originalFrame = window.requestAnimationFrame;
        originalCancelFrame = window.cancelAnimationFrame;
        frames = [];
        window.requestAnimationFrame = callback => {
            frames.push(callback);
            return frames.length;
        };
        window.cancelAnimationFrame = id => {
            frames[id - 1] = null;
        };
    });

    afterEach(() => {
        window.requestAnimationFrame = originalFrame;
        window.cancelAnimationFrame = originalCancelFrame;
        if (wrapper) {
            const node = wrapper.getDOMNode().parentNode;
            wrapper.detach();
            node.remove();
        }
        wrapper = null;
        layout = null;
    });

    test('dragging the handle towards the editor widens the stage panel within its limits', () => {
        const props = defaultProps();
        startDrag(props);
        moveTo(760);
        release();

        expect(layout.stagePanelWidth).toBe(520);
        expect(layout.stageContainerWidth).toBe(518);
        expect(props.onSetStageSize).not.toHaveBeenCalledWith('hidden');

        startDrag(props);
        moveTo(0);
        release();
        expect(layout.stagePanelWidth).toBe(580);
    });

    test('dragging well past the minimum hides the stage, and dragging back shows it small', () => {
        const props = defaultProps();
        startDrag(props);
        moveTo(1100);
        expect(props.onSetStageSize).not.toHaveBeenCalledWith('hidden');

        moveTo(1200);
        expect(props.onSetStageSize).toHaveBeenLastCalledWith('hidden');

        moveTo(800);
        release();
        expect(props.onSetStageSize).toHaveBeenLastCalledWith('small');
        expect(layout.stagePanelWidth).toBe(480);
        expect(layout.stageContainerWidth).toBe(478);
    });
});
