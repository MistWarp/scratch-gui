import React from 'react';

import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {PermissionsPage} from '../../../src/components/tw-settings-modal/permissions-page.jsx';
import {
    blockProjectPrompts,
    clearBlockedProjectPrompts,
    isProjectPromptBlocked
} from '../../../src/lib/project-prompt-blocking.js';

describe('project permission settings', () => {
    beforeEach(() => {
        clearBlockedProjectPrompts();
    });

    test('allows prompts from a blocked project again', () => {
        blockProjectPrompts({id: 'project-1', name: 'My project'});
        const page = mountWithIntl(<PermissionsPage />);

        expect(page.text()).toContain('My project');
        page.find('button').simulate('click');

        expect(isProjectPromptBlocked({id: 'project-1'})).toBe(false);
        expect(page.text()).toContain('No projects are blocked from asking for permission.');
        page.unmount();
    });
});
