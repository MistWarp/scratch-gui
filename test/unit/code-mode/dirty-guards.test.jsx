import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import {mount} from 'enzyme';
import VM from 'scratch-vm';

import projectSaverHOC from '../../../src/lib/components/project-saver-hoc.jsx';
import {shouldConfirmProjectReplacement} from '../../../src/containers/menu-bar-hoc.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import {clearTexts, hasUnappliedCode, setText, unappliedFileCount} from '../../../src/lib/code-mode/text-store.js';

const dirtyState = () => ({
    status: 'ready',
    doc: 'when flag {\n  say "edited";\n}\n',
    baseline: {text: 'when flag {\n  say "hi";\n}\n', sourceMap: {}},
    units: {}
});

describe('unapplied code guards', () => {
    beforeEach(() => clearTexts());

    test('a dirty script tab or a read only draft counts as unapplied work', () => {
        expect(hasUnappliedCode()).toBe(false);
        setText('a', dirtyState());
        expect(hasUnappliedCode()).toBe(true);
        setText('b', {...dirtyState(), doc: dirtyState().baseline.text, draft: {kind: 'stale', text: 'x'}});
        expect(unappliedFileCount()).toBe(2);
        setText('a', {...dirtyState(), doc: dirtyState().baseline.text});
        setText('b', null);
        expect(hasUnappliedCode()).toBe(false);
    });

    test('replacing the project asks first when only code text is unapplied', () => {
        expect(shouldConfirmProjectReplacement({projectChanged: false})).toBe(false);
        setText('a', dirtyState());
        expect(shouldConfirmProjectReplacement({projectChanged: false})).toBe(true);
    });

    test('leaving the page prompts when code text is unapplied', () => {
        const store = configureStore()({
            scratchGui: {projectChanged: false, projectState: {}, projectTitle: 'P', timeout: {autoSaveTimeoutId: null}},
            locales: {locale: 'en'}
        });
        const WrappedComponent = projectSaverHOC(() => <div />);
        const mounted = mount(
            <WrappedComponent
                isShowingWithId
                canSave={false}
                isShowingSaveable={false}
                isUpdating={false}
                loadingState={LoadingState.SHOWING_WITH_ID}
                store={store}
                vm={new VM()}
            />
        );
        const clean = {preventDefault: jest.fn()};
        expect(window.onbeforeunload(clean)).toBeUndefined();
        setText('a', dirtyState());
        const dirty = {preventDefault: jest.fn()};
        expect(window.onbeforeunload(dirty)).toBe(true);
        expect(dirty.returnValue).toBe(true);
        mounted.unmount();
    });
});
