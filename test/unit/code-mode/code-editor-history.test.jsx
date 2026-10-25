import React from 'react';
import {mount} from 'enzyme';
import {undoDepth} from '@codemirror/commands';

import CodeEditor from '../../../src/components/extension-dev/code-editor.jsx';

if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [];
    Range.prototype.getBoundingClientRect = () => ({left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0});
}

const mountEditor = (historyKey, onReady, value = 'say [hi]') => mount(<CodeEditor
    documentKey={`history-${historyKey}`}
    historyKey={historyKey}
    stateKey="history-test"
    value={value}
    onChange={() => {}}
    onReady={onReady}
/>);

test('a tab reopened after an apply elsewhere does not bring back typing from before the apply', () => {
    let view = null;
    let wrapper = mountEditor('applied:a', ready => {
        view = ready;
    });
    view.dispatch({changes: {from: 0, insert: 'x'}});
    const typed = view.state.doc.toString();
    expect(undoDepth(view.state)).toBe(1);
    wrapper.unmount();

    wrapper = mountEditor('applied:a', ready => {
        view = ready;
    }, typed);
    expect(undoDepth(view.state)).toBe(1);
    wrapper.unmount();

    wrapper = mountEditor('applied:b', ready => {
        view = ready;
    }, typed);
    expect(view.state.doc.toString()).toBe(typed);
    expect(undoDepth(view.state)).toBe(0);
    wrapper.unmount();
});
