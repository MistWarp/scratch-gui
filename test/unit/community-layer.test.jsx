import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import Modal from '../../src/community/components/ui/Modal.jsx';
import Dropdown, {DropdownItem} from '../../src/community/components/ui/Dropdown.jsx';
import {LayerScopeContext} from '../../src/community/components/ui/Layer.jsx';

const setNarrow = narrow => {
    window.matchMedia = jest.fn(() => ({matches: narrow}));
};

describe('community layers', () => {
    let host;
    beforeEach(() => {
        host = document.createElement('div');
        host.style.transform = 'translateY(10px)';
        document.body.appendChild(host);
    });
    afterEach(() => {
        host.remove();
        delete window.matchMedia;
    });

    test('modals render on the page body, outside transformed lists', () => {
        const wrapper = mount(<Modal
            title="Hello"
            onClose={jest.fn()}
        >{'Body'}</Modal>, {attachTo: host});
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).not.toBeNull();
        expect(host.contains(dialog)).toBe(false);
        expect(dialog.parentElement.parentElement).toBe(document.body);
        wrapper.detach();
    });

    test('a layer scope class wraps portalled content', () => {
        const wrapper = mount(
            <LayerScopeContext.Provider value="editor-scope">
                <Modal
                    title="Hello"
                    onClose={jest.fn()}
                >{'Body'}</Modal>
            </LayerScopeContext.Provider>,
            {attachTo: host}
        );
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog.closest('.editor-scope').parentElement).toBe(document.body);
        wrapper.detach();
    });

    test('dropdowns stay in place unless they ask for a portal', () => {
        setNarrow(true);
        const wrapper = mount(
            <Dropdown
                width={320}
                renderTrigger={({toggle}) => (<button
                    type="button"
                    onClick={toggle}
                >{'More'}</button>)}
            >
                {() => <DropdownItem>{'Pick'}</DropdownItem>}
            </Dropdown>,
            {attachTo: host}
        );
        act(() => {
            wrapper.find('button').first()
                .simulate('click');
        });
        expect(host.querySelector('[role="menu"]')).not.toBeNull();
        expect(host.querySelector('[role="menu"]').style.width).toBe('');
        wrapper.detach();
    });

    test('portal dropdowns open in place on wide screens and as a body sheet on narrow ones', () => {
        const onPick = jest.fn();
        const render = () => mount(
            <Dropdown
                portal
                renderTrigger={({toggle}) => (<button
                    type="button"
                    onClick={toggle}
                >{'More'}</button>)}
            >
                {() => <DropdownItem onClick={onPick}>{'Pick'}</DropdownItem>}
            </Dropdown>,
            {attachTo: host}
        );
        setNarrow(false);
        let wrapper = render();
        act(() => {
            wrapper.find('button').first()
                .simulate('click');
        });
        expect(host.querySelector('[role="menu"]')).not.toBeNull();
        wrapper.detach();

        setNarrow(true);
        wrapper = render();
        act(() => {
            wrapper.find('button').first()
                .simulate('click');
        });
        const menu = document.querySelector('[role="menu"]');
        expect(host.contains(menu)).toBe(false);
        act(() => {
            menu.querySelector('button').dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
        });
        wrapper.update();
        expect(document.querySelector('[role="menu"]')).not.toBeNull();
        wrapper.find(DropdownItem).simulate('click');
        expect(onPick).toHaveBeenCalled();
        wrapper.detach();
    });

    test('a portal sheet closes when focus leaves it', () => {
        setNarrow(true);
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        const wrapper = mount(
            <Dropdown
                portal
                renderTrigger={({toggle}) => (<button
                    type="button"
                    onClick={toggle}
                >{'More'}</button>)}
            >
                {() => <DropdownItem>{'Pick'}</DropdownItem>}
            </Dropdown>,
            {attachTo: host}
        );
        act(() => {
            wrapper.find('button').first()
                .simulate('click');
        });
        expect(document.querySelector('[role="menu"]').className).toContain('layered');
        wrapper.update();
        act(() => {
            wrapper.find('[role="menu"]').simulate('blur', {relatedTarget: outside});
        });
        wrapper.update();
        expect(document.querySelector('[role="menu"]')).toBeNull();
        outside.remove();
        wrapper.detach();
    });
});
