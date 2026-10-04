import {friendlyError, request} from '../../src/lib/community/api.js';

const response = (status, data = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
});

const failure = promise => promise.then(() => {
    throw new Error('Expected the request to fail');
}, error => error);

describe('community api errors', () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test.each([
        [401, 'Sign in to continue'],
        [403, 'You don\'t have permission to do that.'],
        [404, 'We couldn\'t find that.'],
        [429, 'Too many requests – try again in a moment.'],
        [400, 'Something went wrong.']
    ])('a %i without a server sentence gets a friendly message', async (status, message) => {
        global.fetch.mockResolvedValue(response(status, {error: 'Not Found', code: 'some_code'}));
        const error = await failure(request('/things/1', {method: 'POST'}));
        expect(error.message).toBe(message);
        expect(error.status).toBe(status);
        expect(error.code).toBe('some_code');
        expect(friendlyError(error)).toBe(message);
    });

    test('a server sentence is kept for conflicts and validation problems', async () => {
        global.fetch.mockResolvedValue(response(409, {error: 'That username is already taken.', code: 'taken'}));
        const error = await failure(request('/spaces/s1', {method: 'PUT', body: {}}));
        expect(error.message).toBe('That username is already taken.');
        expect(error.serverMessage).toBe('That username is already taken.');
        expect(error.code).toBe('taken');
    });

    test('server errors never show their internal text', async () => {
        global.fetch.mockResolvedValue(response(500, {error: 'Cannot read properties of undefined (reading x)'}));
        const error = await failure(request('/spaces/s1', {method: 'PUT', body: {}}));
        expect(error.message).toBe('MistWarp is having trouble right now. Try again in a moment.');
        expect(error.status).toBe(500);
    });

    test('a dropped connection says so instead of "Failed to fetch"', async () => {
        global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
        const error = await failure(request('/spaces/s1/follow', {method: 'POST'}));
        expect(error.message).toBe('Can\'t reach MistWarp. Check your connection.');
        expect(error.code).toBe('network');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('friendlyError maps errors from outside the API layer', () => {
        expect(friendlyError(new TypeError('Failed to fetch'))).toBe('Can\'t reach MistWarp. Check your connection.');
        expect(friendlyError(Object.assign(new Error('Request failed (503)'), {status: 503})))
            .toBe('MistWarp is having trouble right now. Try again in a moment.');
        expect(friendlyError(new Error('empty'), 'Could not load this.')).toBe('Could not load this.');
        expect(friendlyError(new Error('Choose a smaller image.'))).toBe('Choose a smaller image.');
        expect(friendlyError(null)).toBe('Something went wrong.');
    });

    test('GETs give up after the default deadline', async () => {
        jest.useFakeTimers();
        global.fetch.mockImplementation((url, {signal}) => new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), {name: 'AbortError'})));
        }));
        const pending = failure(request('/projects/slow'));
        jest.advanceTimersByTime(15000);
        const error = await pending;
        expect(error.code).toBe('timeout');
        expect(error.message).toBe('This is taking too long. Try again.');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('mutations and uploads have no default deadline', async () => {
        global.fetch.mockResolvedValue(response(200, {ok: true}));
        await request('/projects/abc/thumbnail', {method: 'POST', body: new FormData()});
        await request('/projects/abc/react', {method: 'POST', body: {type: 'heart'}});
        expect(global.fetch.mock.calls.every(call => !call[1].signal)).toBe(true);
        await request('/projects/abc');
        expect(global.fetch.mock.calls[2][1].signal).toBeTruthy();
    });

    test('a GET retries once after a dropped connection', async () => {
        global.fetch
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(response(200, {ok: true, value: 'second'}));
        await expect(request('/projects/retry')).resolves.toMatchObject({value: 'second'});
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('a GET retries once after a server error, then reports it', async () => {
        global.fetch.mockResolvedValue(response(502, {}));
        const error = await failure(request('/projects/down'));
        expect(error.status).toBe(502);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('a GET does not retry a client error', async () => {
        global.fetch.mockResolvedValue(response(404, {error: 'Project not found'}));
        const error = await failure(request('/projects/missing'));
        expect(error.status).toBe(404);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('a mutation is never retried', async () => {
        global.fetch.mockResolvedValue(response(503, {}));
        await failure(request('/projects/abc/react', {method: 'POST', body: {type: 'heart'}}));
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});
