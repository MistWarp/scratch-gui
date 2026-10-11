import React from 'react';
import {mount} from 'enzyme';
import DOMElementRenderer from '../../../src/containers/dom-element-renderer.jsx';

describe('DOMElementRenderer', () => {
    test('unmounts after its element has been moved elsewhere', () => {
        const canvas = document.createElement('canvas');
        const wrapper = mount(<DOMElementRenderer domElement={canvas} />);
        const elsewhere = document.createElement('div');
        elsewhere.appendChild(canvas);
        expect(() => wrapper.unmount()).not.toThrow();
        expect(canvas.parentNode).toBe(elsewhere);
    });

    test('removes its element when it still owns it', () => {
        const canvas = document.createElement('canvas');
        const wrapper = mount(<DOMElementRenderer domElement={canvas} />);
        expect(canvas.parentNode).not.toBeNull();
        wrapper.unmount();
        expect(canvas.parentNode).toBeNull();
    });
});
