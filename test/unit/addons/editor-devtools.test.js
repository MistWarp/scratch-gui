import DevTools from '../../../src/addons/addons/editor-devtools/DevTools';

test('editor devtools waits for both tabs before reading the costumes tab ID', () => {
    const devtools = new DevTools({tab: {traps: {vm: {}}}}, () => '', () => '');
    const tabs = document.createElement('ul');
    tabs.appendChild(document.createElement('li'));
    expect(() => devtools.initInner(tabs)).not.toThrow();
    expect(devtools.costTab).toBeNull();
});
