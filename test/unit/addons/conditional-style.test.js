import {addResource, updateAll} from '../../../src/addons/conditional-style';

const stylesFor = addon => Array.from(document.querySelectorAll('style'))
    .filter(element => (element.dataset.addons || '').split(',').includes(addon));

test('Vite inline CSS is installed intact and responds to addon enablement', () => {
    const css = '.u-dropdown-searchbar { width: 100%; background-color: transparent; }';
    let enabled = true;
    addResource(css, 'dropdown/userscript.css', 'dropdown', 100, () => enabled);
    expect(stylesFor('dropdown').map(element => element.textContent)).toEqual([css]);
    updateAll();
    expect(stylesFor('dropdown')).toHaveLength(1);
    enabled = false;
    updateAll();
    expect(stylesFor('dropdown')).toHaveLength(0);
    enabled = true;
    updateAll();
    expect(stylesFor('dropdown')[0].textContent).toBe(css);
});

test('addons with the same CSS filename keep separate Vite styles', () => {
    addResource('.first {}', 'first/userscript.css', 'first', 200, () => true);
    addResource('.second {}', 'second/userscript.css', 'second', 300, () => true);
    expect(stylesFor('first')[0].textContent).toBe('.first {}');
    expect(stylesFor('second')[0].textContent).toBe('.second {}');
});

test('webpack CSS module tuples still support shared styles', () => {
    const resource = [[123, '.shared {}', '']];
    addResource(resource, 'unused', 'webpack-first', 400, () => true);
    addResource(resource, 'unused', 'webpack-second', 500, () => true);
    updateAll();
    expect(stylesFor('webpack-first')).toHaveLength(1);
    expect(stylesFor('webpack-first')[0]).toBe(stylesFor('webpack-second')[0]);
    expect(stylesFor('webpack-first')[0].textContent).toBe('.shared {}');
});
