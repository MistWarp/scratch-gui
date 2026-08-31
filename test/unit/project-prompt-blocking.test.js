import {
    BLOCKED_PROJECT_PROMPTS_KEY,
    blockProjectPrompts,
    isProjectPromptBlocked,
    projectPromptKey
} from '../../src/lib/project-prompt-blocking.js';

describe('project prompt blocking', () => {
    beforeEach(() => {
        localStorage.removeItem(BLOCKED_PROJECT_PROMPTS_KEY);
        sessionStorage.removeItem('mw:mistwarp-current-project');
    });

    test('persists a block by project id', () => {
        expect(blockProjectPrompts({id: 'project-1'})).toBe('id:project-1');
        expect(isProjectPromptBlocked({id: 'project-1'})).toBe(true);
        expect(isProjectPromptBlocked({id: 'project-2'})).toBe(false);
    });

    test('uses the trusted platform project id before a project-supplied name', () => {
        sessionStorage.setItem('mw:mistwarp-current-project', JSON.stringify({id: 'platform-project'}));
        expect(projectPromptKey({name: 'Fake name'})).toBe('id:platform-project');

        blockProjectPrompts({name: 'Fake name'});
        expect(isProjectPromptBlocked({name: 'A different fake name'})).toBe(true);
    });

    test('falls back to the project name when no id is available', () => {
        blockProjectPrompts({name: 'Local project'});
        expect(isProjectPromptBlocked({name: 'Local project'})).toBe(true);
        expect(isProjectPromptBlocked({name: 'Other project'})).toBe(false);
    });
});
