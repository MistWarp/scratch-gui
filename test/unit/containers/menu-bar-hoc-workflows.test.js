import {shouldConfirmProjectReplacement} from '../../../src/containers/menu-bar-hoc.jsx';

describe('project replacement warning', () => {
    test('warns when changed work cannot be saved', () => {
        expect(shouldConfirmProjectReplacement({
            canCreateNew: true,
            canSave: false,
            projectChanged: true
        })).toBe(true);
    });

    test('does not warn when changed work will be saved before replacement', () => {
        expect(shouldConfirmProjectReplacement({
            canCreateNew: true,
            canSave: true,
            projectChanged: true
        })).toBe(false);
    });

    test('does not warn when the project has no changes', () => {
        expect(shouldConfirmProjectReplacement({
            canCreateNew: false,
            canSave: false,
            projectChanged: false
        })).toBe(false);
    });
});
