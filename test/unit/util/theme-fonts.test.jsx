import React from 'react';
import {mount} from 'enzyme';

import CodeEditor from '../../../src/components/extension-dev/code-editor.jsx';
import {applyThemeFonts, removeThemeFonts} from '../../../src/lib/themes/fonts.js';

test('theme fonts leave the code editor on its monospace stack', async () => {
    await applyThemeFonts({google: [], system: ['Comic Sans MS']});
    const style = document.getElementById('theme-fonts');
    expect(style.textContent).toContain(':not(.cm-editor)');

    const wrapper = mount(<CodeEditor
        documentKey="theme-font-code-editor"
        value="const answer = 42;"
        onChange={() => {}}
    />);
    try {
        const scroller = wrapper.getDOMNode().querySelector('.cm-scroller');
        expect(getComputedStyle(scroller).fontFamily).toContain('monospace');
    } finally {
        wrapper.unmount();
        removeThemeFonts();
    }
});
