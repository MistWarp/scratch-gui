import {payLink, payWithRotur} from '../../src/lib/rotur/payment-window.js';

const fakePopup = () => ({
    closed: false,
    location: {href: ''},
    close () {
        this.closed = true;
    }
});

const intent = {key: 'mwbuy_1', requestId: 'pr_1', approveUrl: 'https://rotur.dev/pay/approve/pr_1'};

const fromRotur = (data, origin = 'https://rotur.dev') =>
    window.dispatchEvent(new MessageEvent('message', {data, origin}));

const notPaidYet = () => Object.assign(new Error('payment not received yet'), {status: 402, data: {pending: true}});

let popup;
beforeEach(() => {
    jest.useFakeTimers();
    popup = fakePopup();
    jest.spyOn(window, 'open').mockImplementation(() => popup);
});
afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test('opens Rotur\'s approve page and confirms once Rotur says it was paid', async () => {
    const start = jest.fn(() => Promise.resolve(intent));
    const confirm = jest.fn(() => Promise.resolve({ok: true, project: {id: 'p1'}}));
    const paying = payWithRotur({start, confirm});
    // The window opens before anything is awaited, while the click still counts.
    expect(window.open).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(0);
    expect(start).toHaveBeenCalledWith('http://localhost/');
    expect(popup.location.href).toBe(intent.approveUrl);

    // Messages from anywhere else, or about another request, are ignored.
    fromRotur({type: 'rotur:payment', id: 'pr_1', status: 'paid'}, 'https://evil.example');
    fromRotur({type: 'rotur:payment', id: 'pr_2', status: 'paid'});
    await jest.advanceTimersByTimeAsync(1000);
    expect(confirm).not.toHaveBeenCalled();

    fromRotur({type: 'rotur:payment', id: 'pr_1', status: 'paid'});
    await expect(paying).resolves.toEqual({intent, result: {ok: true, project: {id: 'p1'}}});
    expect(confirm).toHaveBeenCalledWith(intent);
});

test('keeps confirming for a moment after a payment Rotur says went through', async () => {
    const confirm = jest.fn()
        .mockRejectedValueOnce(notPaidYet())
        .mockResolvedValueOnce({ok: true});
    const paying = payWithRotur({start: () => Promise.resolve(intent), confirm});
    await jest.advanceTimersByTimeAsync(0);
    fromRotur({type: 'rotur:payment', id: 'pr_1', status: 'paid'});
    await jest.advanceTimersByTimeAsync(2000);
    await expect(paying).resolves.toEqual({intent, result: {ok: true}});
    expect(confirm).toHaveBeenCalledTimes(2);
});

test('a closed window still counts if mistwarp-api finds the payment', async () => {
    const confirm = jest.fn(() => Promise.resolve({ok: true}));
    const paying = payWithRotur({start: () => Promise.resolve(intent), confirm});
    await jest.advanceTimersByTimeAsync(0);
    popup.close();
    await jest.advanceTimersByTimeAsync(500);
    await expect(paying).resolves.toEqual({intent, result: {ok: true}});
});

test('closing the window without paying, or declining, cancels', async () => {
    const confirm = jest.fn(() => Promise.reject(notPaidYet()));
    const closed = payWithRotur({start: () => Promise.resolve(intent), confirm});
    const caught = closed.catch(e => e);
    await jest.advanceTimersByTimeAsync(0);
    popup.close();
    await jest.advanceTimersByTimeAsync(3000);
    await expect(caught).resolves.toMatchObject({cancelled: true});
    expect(confirm).toHaveBeenCalledTimes(2);

    popup = fakePopup();
    confirm.mockClear();
    const declined = payWithRotur({start: () => Promise.resolve(intent), confirm});
    await jest.advanceTimersByTimeAsync(0);
    fromRotur({type: 'rotur:payment', id: 'pr_1', status: 'declined'});
    await expect(declined).rejects.toMatchObject({cancelled: true});
    expect(confirm).not.toHaveBeenCalled();
});

test('closes the window when there is nothing to pay or the intent fails', async () => {
    await expect(payWithRotur({
        start: () => Promise.resolve({already: true, project: {id: 'p1'}}),
        confirm: jest.fn()
    })).resolves.toEqual({intent: {already: true, project: {id: 'p1'}}});
    expect(popup.closed).toBe(true);

    popup = fakePopup();
    await expect(payWithRotur({
        start: () => Promise.reject(new Error('this project is not for sale')),
        confirm: jest.fn()
    })).rejects.toThrow('this project is not for sale');
    expect(popup.closed).toBe(true);
});

test('says so when the browser blocks the window', async () => {
    window.open.mockImplementation(() => null);
    const start = jest.fn();
    await expect(payWithRotur({start, confirm: jest.fn()})).rejects.toMatchObject({popupBlocked: true});
    expect(start).not.toHaveBeenCalled();
});

test('builds Rotur pay links', () => {
    expect(payLink('sky racer', {note: 'Support for Sky'})).toBe('https://rotur.dev/pay/sky%20racer?note=Support+for+Sky');
    expect(payLink('alice', {amount: 5})).toBe('https://rotur.dev/pay/alice?amount=5');
    expect(payLink('alice')).toBe('https://rotur.dev/pay/alice');
});
