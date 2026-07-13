import React from 'react';
import {shallow} from 'enzyme';
import DefaultMonitor from '../../../src/components/monitor/default-monitor';
import Monitor from '../../../src/components/monitor/monitor';
import {Theme, BLOCKS_DARK, BLOCKS_HIGH_CONTRAST} from '../../../src/lib/themes';

const renderMonitor = theme => {
    const noop = () => {};

    return shallow(<Monitor
        category="motion"
        // eslint-disable-next-line react/jsx-no-bind
        componentRef={noop}
        draggable={false}
        label="My label"
        mode="default"
        // eslint-disable-next-line react/jsx-no-bind
        onDragEnd={noop}
        // eslint-disable-next-line react/jsx-no-bind
        onNextMode={noop}
        theme={theme}
    />);
};

const expectedCategoryColor = theme => {
    const colors = theme.getStageBlockColors();
    return {
        background: colors.motion.primary,
        text: colors.text
    };
};

describe('Monitor Component', () => {
    test('it selects the correct colors based on default theme', () => {
        const theme = Theme.defaults.light;
        const defaultMonitor = renderMonitor(theme).find(DefaultMonitor);

        expect(defaultMonitor.props().categoryColor).toEqual(expectedCategoryColor(theme));
    });

    test('it selects the correct colors based on dark mode theme', () => {
        const theme = Theme.defaults.dark;
        const defaultMonitor = renderMonitor(theme).find(DefaultMonitor);

        expect(defaultMonitor.props().categoryColor).toEqual(expectedCategoryColor(theme));
    });

    test('a blocks theme marked useForStage changes the monitor colors', () => {
        const highContrast = Theme.defaults.light.set('blocks', BLOCKS_HIGH_CONTRAST);
        const light = renderMonitor(Theme.defaults.light).find(DefaultMonitor);
        const contrast = renderMonitor(highContrast).find(DefaultMonitor);

        expect(contrast.props().categoryColor).not.toEqual(light.props().categoryColor);
    });

    test('the dark blocks theme keeps the default stage colors', () => {
        const darkBlocks = Theme.defaults.light.set('blocks', BLOCKS_DARK);
        const light = renderMonitor(Theme.defaults.light).find(DefaultMonitor);
        const dark = renderMonitor(darkBlocks).find(DefaultMonitor);

        expect(dark.props().categoryColor).toEqual(light.props().categoryColor);
    });
});
