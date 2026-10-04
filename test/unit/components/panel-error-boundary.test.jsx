import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import PanelErrorBoundary from '../../../src/components/panel-error-boundary/panel-error-boundary.jsx';

jest.mock('../../../src/lib/error-reporter.js', () => ({reportSiteError: jest.fn()}));
jest.mock('../../../src/lib/utils/log.js', () => ({error: jest.fn()}));

let shouldCrash = true;
const Panel = () => {
    if (shouldCrash) throw new Error('panel crashed');
    return <div className="panel">{'panel'}</div>;
};

const findButton = (wrapper, text) => wrapper.find('button').filterWhere(button => button.text() === text);

describe('PanelErrorBoundary', () => {
    let consoleError;
    beforeEach(() => {
        shouldCrash = true;
        // React logs caught render errors to the console.
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        consoleError.mockRestore();
    });

    test('shows a message instead of the crashed panel, and Try again renders it again', () => {
        const wrapper = mountWithIntl(
            <div>
                <PanelErrorBoundary name="test"><Panel /></PanelErrorBoundary>
                <div className="workspace" />
            </div>
        );
        expect(wrapper.find('[role="alert"]').text()).toContain('This panel ran into a problem');
        expect(wrapper.find('.workspace')).toHaveLength(1);

        shouldCrash = false;
        findButton(wrapper, 'Try again').simulate('click');
        expect(wrapper.find('[role="alert"]')).toHaveLength(0);
        expect(wrapper.find('.panel')).toHaveLength(1);
    });

    test('Close calls onClose and resets the boundary', () => {
        const onClose = jest.fn(() => {
            shouldCrash = false;
        });
        const wrapper = mountWithIntl(
            <PanelErrorBoundary
                name="test"
                onClose={onClose}
            >
                <Panel />
            </PanelErrorBoundary>
        );
        findButton(wrapper, 'Close').simulate('click');
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(wrapper.find('[role="alert"]')).toHaveLength(0);
        expect(wrapper.find('.panel')).toHaveLength(1);
    });

    test('a panel that keeps crashing after Close stays hidden', () => {
        const onClose = jest.fn();
        const wrapper = mountWithIntl(
            <PanelErrorBoundary
                name="test"
                onClose={onClose}
            >
                <Panel />
            </PanelErrorBoundary>
        );
        findButton(wrapper, 'Close').simulate('click');
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(wrapper.find('[role="alert"]')).toHaveLength(0);
        expect(wrapper.find('.panel')).toHaveLength(0);
    });

    test('regions that cannot close only offer Try again', () => {
        const wrapper = mountWithIntl(
            <PanelErrorBoundary
                closable={false}
                name="test"
                variant="inline"
            >
                <Panel />
            </PanelErrorBoundary>
        );
        expect(findButton(wrapper, 'Try again')).toHaveLength(1);
        expect(findButton(wrapper, 'Close')).toHaveLength(0);
    });
});
