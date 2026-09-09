import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {AdminActionDialog, ErrorManager} from '../../src/community/pages/Admin.jsx';
import api from '../../src/community/api.js';
import copyText from '../../src/community/copy-text.js';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));
jest.mock('../../src/community/copy-text.js', () => jest.fn());

const response = {
    ok: true,
    errors: [
        {_id: 'first', message: 'First error', resolved: false},
        {_id: 'second', message: 'Second error', resolved: true}
    ],
    openCount: 1,
    extra: {preserved: true}
};

const renderErrors = async () => {
    let wrapper;
    await act(async () => { wrapper = mount(<ErrorManager />); });
    wrapper.update();
    return wrapper;
};
const button = (wrapper, label) => wrapper.find('button').filterWhere(node => node.text() === label);

describe('admin error bulk actions', () => {
    beforeEach(() => {
        jest.spyOn(api.admin, 'siteErrors').mockResolvedValue(response);
        jest.spyOn(api.admin, 'deleteAllSiteErrors').mockResolvedValue({ok: true, deleted: 250});
        copyText.mockResolvedValue();
    });
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    test('copies the full response even when search hides errors', async () => {
        const wrapper = await renderErrors();
        wrapper.find('input[type="search"]').simulate('change', {target: {value: 'First'}});
        await act(async () => { button(wrapper, 'Copy response JSON').simulate('click'); });
        wrapper.update();
        expect(copyText).toHaveBeenCalledWith(JSON.stringify(response, null, 2));
        expect(button(wrapper, 'Copied JSON')).toHaveLength(1);
        wrapper.unmount();
    });

    test('requires confirmation, prevents duplicate deletion, and refreshes counts', async () => {
        let finish;
        api.admin.deleteAllSiteErrors.mockReturnValue(new Promise(resolve => { finish = resolve; }));
        const wrapper = await renderErrors();
        button(wrapper, 'Delete all errors').simulate('click');
        expect(api.admin.deleteAllSiteErrors).not.toHaveBeenCalled();
        const confirm = wrapper.find(AdminActionDialog).prop('onConfirm');
        let deleting;
        act(() => { deleting = confirm(); confirm(); });
        wrapper.update();
        expect(api.admin.deleteAllSiteErrors).toHaveBeenCalledTimes(1);
        expect(wrapper.find(AdminActionDialog).prop('busy')).toBe(true);
        api.admin.siteErrors.mockResolvedValue({ok: true, errors: [], openCount: 0});
        await act(async () => { finish({ok: true, deleted: 250}); await deleting; });
        wrapper.update();
        expect(wrapper.text()).toContain('Open (0)');
        expect(wrapper.text()).toContain('No errors here.');
        expect(wrapper.find(AdminActionDialog).prop('dialog')).toBeNull();
        wrapper.unmount();
    });

    test('keeps errors visible when deletion fails and reports clipboard failures', async () => {
        api.admin.deleteAllSiteErrors.mockRejectedValue(new Error('Deletion failed'));
        copyText.mockRejectedValue(new Error('Clipboard unavailable'));
        const wrapper = await renderErrors();
        button(wrapper, 'Delete all errors').simulate('click');
        await act(async () => { await wrapper.find(AdminActionDialog).prop('onConfirm')(); });
        wrapper.update();
        expect(wrapper.find(AdminActionDialog).prop('error')).toBe('Deletion failed');
        expect(wrapper.text()).toContain('First error');
        act(() => { wrapper.find(AdminActionDialog).prop('onCancel')(); });
        wrapper.update();
        await act(async () => { button(wrapper, 'Copy response JSON').simulate('click'); });
        wrapper.update();
        expect(wrapper.text()).toContain('Clipboard unavailable');
        wrapper.unmount();
    });
});
