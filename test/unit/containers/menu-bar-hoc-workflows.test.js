import {shouldConfirmProjectReplacement} from '../../../src/containers/menu-bar-hoc.jsx';

describe('project replacement warning', () => {
    test('warns when the project has changes', () => {
        expect(shouldConfirmProjectReplacement({
            projectChanged: true
        })).toBe(true);
    });

    test('does not warn when the project has no changes', () => {
        expect(shouldConfirmProjectReplacement({
            projectChanged: false
        })).toBe(false);
    });
});
