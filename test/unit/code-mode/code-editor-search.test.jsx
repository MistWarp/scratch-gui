import React from 'react';
import {mount} from 'enzyme';
import {openSearchPanel} from '@codemirror/search';

import CodeEditor from '../../../src/components/extension-dev/code-editor.jsx';

test('the code editor search panel uses the app chrome', () => {
    let view = null;
    const wrapper = mount(<CodeEditor
        documentKey="code-editor-search"
        value="const answer = 42;"
        onChange={() => {}}
        onReady={ready => {
            view = ready;
        }}
    />);
    try {
        openSearchPanel(view);
        const panel = wrapper.getDOMNode().querySelector('.cm-search');
        expect(panel).not.toBeNull();
        const input = panel.querySelector('.cm-textfield');
        const button = panel.querySelector('.cm-button');
        const close = panel.querySelector('[name=close]');
        expect(getComputedStyle(input).borderRadius).toBe('6px');
        expect(getComputedStyle(button).borderRadius).toBe('6px');
        expect(getComputedStyle(close).position).toBe('static');
    } finally {
        wrapper.unmount();
    }
});
