/**
 * @jest-environment jsdom
 */

let columns;

beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
    document.body.innerHTML = '';
    jest.isolateModules(() => {
        columns = require('../../../src/lib/mw-two-column-categories');
    });
});

test('off by default', () => {
    expect(columns.getTwoColumnCategories()).toBe(false);
});

test('migrates the enabled columns addon', () => {
    localStorage.setItem('tw:addons', JSON.stringify({columns: {enabled: true}}));
    expect(columns.getTwoColumnCategories()).toBe(true);
    expect(localStorage.getItem('mw:two-column-categories')).toBe('true');
});

test('a saved choice wins over the old addon setting', () => {
    localStorage.setItem('tw:addons', JSON.stringify({columns: {enabled: true}}));
    localStorage.setItem('mw:two-column-categories', 'false');
    expect(columns.getTwoColumnCategories()).toBe(false);
});

test('changing the setting persists it and notifies the editor', () => {
    const listener = jest.fn();
    window.addEventListener(columns.TWO_COLUMN_CATEGORIES_CHANGED, listener);
    columns.setTwoColumnCategories(true);
    expect(localStorage.getItem('mw:two-column-categories')).toBe('true');
    expect(columns.getTwoColumnCategories()).toBe(true);
    document.body.classList.add('mw-two-column-categories');
    columns.setTwoColumnCategories(false);
    expect(columns.getTwoColumnCategories()).toBe(false);
    expect(document.body.classList.contains('mw-two-column-categories')).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener(columns.TWO_COLUMN_CATEGORIES_CHANGED, listener);
});

// Just enough of scratch-blocks' category menu to run the patched populate.
const makeScratchBlocks = () => {
    class Category {
        constructor (menu, row, node) {
            this.id_ = node.getAttribute('id');
            row.textContent = this.id_;
        }
    }
    class CategoryMenu {
        constructor (parent, parentHtml) {
            this.parent_ = parent;
            this.parentHtml_ = parentHtml;
            this.categories_ = [];
            this.createDom();
        }
        createDom () {
            this.table = document.createElement('div');
            this.table.className = 'scratchCategoryMenu';
            this.parentHtml_.appendChild(this.table);
        }
        populate (domTree) {
            this.dispose();
            this.createDom();
            for (const child of Array.from(domTree.childNodes)) {
                if (!child.tagName || child.tagName.toUpperCase() !== 'CATEGORY') continue;
                const row = document.createElement('div');
                row.className = 'scratchCategoryMenuRow';
                this.table.appendChild(row);
                this.categories_.push(new Category(this, row, child));
            }
        }
        dispose () {
            this.categories_ = [];
            if (this.table) {
                this.table.remove();
                this.table = null;
            }
        }
    }
    class Toolbox {
        position () {}
        dispose () {}
    }
    Toolbox.CategoryMenu = CategoryMenu;
    Toolbox.Category = Category;
    class Flyout {
        getWidth () {
            return 250;
        }
    }
    class VerticalFlyout extends Flyout {
        position () {}
    }
    return {Toolbox, Flyout, VerticalFlyout};
};

const toolboxXML = ids => new DOMParser().parseFromString(
    `<xml>${ids.map(id => `<category id="${id}"></category>`).join('')}</xml>`,
    'text/xml'
).documentElement;

test('built-in categories share the grid and extensions go underneath', () => {
    const ScratchBlocks = makeScratchBlocks();
    columns.installTwoColumnCategories(ScratchBlocks);
    columns.setTwoColumnCategories(true);

    const div = document.createElement('div');
    document.body.appendChild(div);
    const menu = new ScratchBlocks.Toolbox.CategoryMenu({horizontalLayout_: false}, div);
    menu.populate(toolboxXML(['motion', 'assets', 'pen', 'mwStrings', 'myBlocks', 'addons']));

    expect(div.classList.contains('mwTwoColumnCategories')).toBe(true);
    expect(menu.table.textContent).toBe('motionassetsmwStringsmyBlocks');
    expect(menu.extensionTable.textContent).toBe('penaddons');
    expect(menu.categories_.map(category => category.id_))
        .toEqual(['motion', 'assets', 'mwStrings', 'myBlocks', 'pen', 'addons']);

    const flyout = new ScratchBlocks.VerticalFlyout();
    flyout.parentToolbox_ = menu.parent_;
    expect(flyout.getWidth()).toBe(310);
    expect(columns.getResizableFlyoutWidth(flyout)).toBe(250);

    columns.setTwoColumnCategories(false);
    menu.populate(toolboxXML(['motion', 'pen']));
    expect(div.classList.contains('mwTwoColumnCategories')).toBe(false);
    expect(menu.extensionTable).toBeFalsy();
    expect(div.querySelectorAll('.scratchCategoryMenu')).toHaveLength(1);
    expect(flyout.getWidth()).toBe(250);
});
