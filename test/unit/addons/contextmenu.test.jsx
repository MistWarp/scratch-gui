import React from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';
import SpriteSelectorItem from '../../../src/components/sprite-selector-item/sprite-selector-item.jsx';
import {findPortalledMenu} from '../../../src/addons/contextmenu.js';

const tab = {
    traps: {
        getInternalKey: element => Object.keys(element).find(key => key.startsWith('__reactInternalInstance$'))
    }
};

describe('addon context menu lookup', () => {
    let container;

    const render = node => {
        ReactDOM.render(<IntlProvider locale="en">{node}</IntlProvider>, container);
    };

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(container);
        container.remove();
    });

    test('finds the body-level menu that belongs to each sprite selector item', () => {
        render(
            <div>
                <SpriteSelectorItem
                    name="first"
                    selected={false}
                    onDuplicateButtonClick={jest.fn()}
                />
                <SpriteSelectorItem
                    name="second"
                    selected={false}
                    onDuplicateButtonClick={jest.fn()}
                    onExportButtonClick={jest.fn()}
                />
            </div>
        );

        const triggers = container.querySelectorAll('.react-contextmenu-wrapper');
        expect(triggers).toHaveLength(2);
        expect(container.querySelector('nav.react-contextmenu')).toBeNull();

        const firstMenu = findPortalledMenu(tab, triggers[0]);
        const secondMenu = findPortalledMenu(tab, triggers[1]);
        expect(firstMenu.parentElement).toBe(document.body);
        expect(secondMenu.parentElement).toBe(document.body);
        expect(firstMenu).not.toBe(secondMenu);
        expect(firstMenu.textContent).not.toContain('export');
        expect(secondMenu.textContent).toContain('export');

        ReactDOM.unmountComponentAtNode(container);
        expect(document.body.querySelector('nav.react-contextmenu')).toBeNull();
    });

    test('returns null for an element that is not a context menu trigger', () => {
        render(<button>plain</button>);
        expect(findPortalledMenu(tab, container.querySelector('button'))).toBeNull();
    });
});
