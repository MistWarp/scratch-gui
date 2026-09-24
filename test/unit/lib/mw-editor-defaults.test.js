class LocalStorageShim {
    constructor () {
        this.storage = Object.create(null);
    }
    getItem (key) {
        return Object.prototype.hasOwnProperty.call(this.storage, key) ? this.storage[key] : null;
    }
    setItem (key, value) {
        this.storage[key] = value.toString();
    }
}

let defaults;

beforeEach(() => {
    Object.defineProperty(global, 'localStorage', {
        value: new LocalStorageShim(),
        writable: true,
        configurable: true
    });
    jest.isolateModules(() => {
        defaults = require('../../../src/lib/mw-editor-defaults');
    });
});

test('settings are off by default', () => {
    expect(defaults.getDisableCompiler()).toBe(false);
    expect(defaults.getDisableCloudVariables()).toBe(false);
});

test('settings persist to localStorage', () => {
    defaults.setDisableCompiler(true);
    defaults.setDisableCloudVariables(true);
    expect(localStorage.getItem('mw:disable-compiler')).toBe('true');
    expect(localStorage.getItem('mw:disable-cloud-variables')).toBe('true');
    expect(defaults.getDisableCompiler()).toBe(true);
    expect(defaults.getDisableCloudVariables()).toBe(true);
    defaults.setDisableCompiler(false);
    expect(defaults.getDisableCompiler()).toBe(false);
});

test('enabled legacy addons migrate into the native settings', () => {
    localStorage.setItem('tw:addons', JSON.stringify({
        _: 5,
        'tw-disable-compiler': {enabled: true},
        'tw-disable-cloud-variables': {enabled: false}
    }));
    expect(defaults.getDisableCompiler()).toBe(true);
    expect(defaults.getDisableCloudVariables()).toBe(false);
    expect(localStorage.getItem('mw:disable-compiler')).toBe('true');
    expect(localStorage.getItem('mw:disable-cloud-variables')).toBe(null);
});

test('an explicit native value wins over the legacy addon', () => {
    localStorage.setItem('tw:addons', JSON.stringify({
        'tw-disable-compiler': {enabled: true}
    }));
    localStorage.setItem('mw:disable-compiler', 'false');
    expect(defaults.getDisableCompiler()).toBe(false);
});

test('malformed legacy settings are ignored', () => {
    localStorage.setItem('tw:addons', '{not json');
    expect(defaults.getDisableCompiler()).toBe(false);
});
