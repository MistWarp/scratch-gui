import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount, shallow} from 'enzyme';
import {
    contributionPayload,
    HistoryList,
    PullList,
    releasePayload,
    ReviewPanel,
    reviewPayload
} from '../../src/community/pages/Project.jsx';
import GitGraph from '../../src/community/components/GitGraph.jsx';
import Modal from '../../src/community/components/ui/Modal.jsx';
import api from '../../src/community/api.js';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    CustomTheme: {},
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Project content action payloads', () => {
    test('trims review, release, and contribution fields', () => {
        expect(reviewPayload(4, '  Helpful  ')).toEqual({rating: 4, message: 'Helpful'});
        expect(releasePayload({version: ' 1.2.0 ', channel: 'stable', notes: ' Fixes '})).toEqual({
            version: '1.2.0',
            channel: 'stable',
            notes: 'Fixes'
        });
        expect(contributionPayload(' fork-id ', ' Change ', ' Details ')).toEqual({
            remixProjectId: 'fork-id',
            title: 'Change',
            body: 'Details'
        });
    });

    test('opens an in-app confirmation before restoring a version', () => {
        const commit = {sha: 'abcdef123456', message: 'Added level two'};
        const wrapper = shallow(
            <HistoryList
                canRestore
                history={{
                    branch: 'main',
                    commits: [commit],
                    graph: {nodes: [commit]}
                }}
                id="project-1"
                onChange={jest.fn()}
            />
        );

        wrapper.find(GitGraph).prop('onRestore')(commit);
        wrapper.update();

        const confirmation = wrapper.find(Modal);
        expect(confirmation.prop('title')).toBe('Restore this version?');
        expect(shallow(<div>{confirmation.prop('children')}</div>).text()).toContain('Added level two');
    });

    test('reloads review ownership when the signed-in account changes', async () => {
        const reviews = jest.spyOn(api, 'reviews').mockResolvedValue({
            reviews: [],
            average: 0,
            count: 0,
            myReview: null
        });
        const wrapper = mount(
            <ReviewPanel
                id="project-1"
                user={{username: 'Sophie'}}
                login={jest.fn()}
                ownsProject={false}
            />
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        wrapper.setProps({user: {username: 'Alex'}});
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(reviews).toHaveBeenCalledTimes(2);
        wrapper.unmount();
        reviews.mockRestore();
    });

    test('closes an open pull request when navigating to another project', async () => {
        const pulls = jest.spyOn(api, 'pulls').mockResolvedValue({
            pulls: [{index: 1, title: 'Old project pull', user: 'Alex', state: 'open'}]
        });
        const pullDiff = jest.spyOn(api, 'pullDiff').mockImplementation(() => new Promise(() => {}));
        const wrapper = mount(
            <PullList
                id="project-1"
                canMerge
                onChange={jest.fn()}
            />
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        wrapper.find('button').filterWhere(button => button.text().includes('Old project pull')).simulate('click');
        wrapper.update();
        expect(wrapper.text()).toContain('Old project pull');

        wrapper.setProps({id: 'project-2'});
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(pulls).toHaveBeenCalledWith('project-2');
        expect(wrapper.find('.backLink')).toHaveLength(0);
        wrapper.unmount();
        pulls.mockRestore();
        pullDiff.mockRestore();
    });
});
