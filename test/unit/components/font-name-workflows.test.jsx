import {FontName} from '../../../src/components/tw-fonts-modal/font-name';

const makeFontName = () => {
    const picker = new FontName({
        fontManager: {
            getUnusedCustomFont: jest.fn(name => name),
            getUnusedSystemFont: jest.fn(name => name)
        },
        isCustom: false,
        name: '',
        onChange: jest.fn()
    });
    picker.setState = jest.fn(update => {
        picker.state = {...picker.state, ...update};
    });
    return picker;
};

describe('local font suggestions', () => {
    let originalQueryLocalFonts;

    beforeEach(() => {
        originalQueryLocalFonts = global.queryLocalFonts;
    });

    afterEach(() => {
        global.queryLocalFonts = originalQueryLocalFonts;
    });

    test('ignores a permission failure because manual entry still works', async () => {
        global.queryLocalFonts = jest.fn(() => Promise.reject(new Error('permission denied')));
        const picker = makeFontName();

        picker.componentDidMount();
        await Promise.resolve();
        await Promise.resolve();

        expect(picker.setState).not.toHaveBeenCalled();
        picker.componentWillUnmount();
    });

    test('ignores font results that arrive after the modal closes', async () => {
        let finishQuery;
        global.queryLocalFonts = jest.fn(() => new Promise(resolve => {
            finishQuery = resolve;
        }));
        const picker = makeFontName();

        picker.componentDidMount();
        picker.componentWillUnmount();
        finishQuery([{family: 'Inter'}]);
        await Promise.resolve();

        expect(picker.setState).not.toHaveBeenCalled();
    });
});
