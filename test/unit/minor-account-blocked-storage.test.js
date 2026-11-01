import {isMinorAccount, setMinorAccount} from '../../src/lib/minor-account.js';

const blocked = () => {
    throw new DOMException('blocked', 'SecurityError');
};

beforeEach(() => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);
    Object.defineProperty(window.navigator, 'cookieEnabled', {configurable: true, get: () => false});
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('a minor stays a minor when storage and cookies are blocked', () => {
    setMinorAccount(true);
    expect(isMinorAccount()).toBe(true);
    setMinorAccount(false);
    expect(isMinorAccount()).toBe(false);
});
