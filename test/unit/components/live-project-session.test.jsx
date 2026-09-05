import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import LiveProjectSession from '../../../src/community/components/LiveProjectSession.jsx';
import api from '../../../src/community/api.js';

jest.mock('../../../src/community/api.js', () => ({
    __esModule: true,
    default: {request: jest.fn()},
    editorUrl: ({platformProject}) => `/editor#mw-${platformProject}`
}));

const renderPresence = async response => {
    api.request.mockResolvedValue(response);
    let wrapper;
    await act(async () => {
        wrapper = mount(<LiveProjectSession project={{id: 'p1', myRole: 'editor'}} />);
    });
    wrapper.update();
    return wrapper;
};

test('project pages discover independent editors on other branches without joining', async () => {
    const wrapper = await renderPresence({session: {}, editors: [{username: 'Alex', branch: 'feature'}]});
    expect(wrapper.text()).toContain('Alex on feature');
    expect(wrapper.find('a[href="/editor?branches=1#mw-p1"]').text()).toBe('Open branches…');
    expect(api.request).toHaveBeenCalledWith('/projects/p1/live', expect.objectContaining({
        body: {action: 'list', allBranches: true}
    }));
    expect(wrapper.text()).not.toContain('View live session');
    wrapper.unmount();
});

test('a public session offers its options without claiming the visitor has joined', async () => {
    const wrapper = await renderPresence({session: {id: 's1', host: 'Alex', branch: 'main', public: true}});
    expect(wrapper.text()).toContain('Alex has opened a live session');
    expect(wrapper.find('a').text()).toBe('View live session');
    wrapper.unmount();
});

test('failed discovery shows unavailable status instead of silently hiding activity', async () => {
    api.request.mockRejectedValue(new Error('offline'));
    let wrapper;
    await act(async () => {
        wrapper = mount(<LiveProjectSession project={{id: 'p1', myRole: 'editor'}} />);
    });
    wrapper.update();
    expect(wrapper.find('[role="status"]').text()).toContain('Could not check who is online');
    wrapper.unmount();
});
