import {LoaderComponent} from '../../src/components/loader/loader.jsx';

const makeLoader = isRemote => {
    const intl = {
        formatMessage: (message, values = {}) => message.defaultMessage
            .replace('{complete}', values.complete)
            .replace('{total}', values.total)
    };
    const loader = new LoaderComponent({
        intl,
        isRemote,
        vm: {
            on: jest.fn(),
            off: jest.fn(),
            runtime: {on: jest.fn(), off: jest.fn(), resetProgress: jest.fn()}
        }
    });
    loader.barInnerEl = {style: {}};
    loader.messageEl = {textContent: ''};
    loader.detailEl = {textContent: ''};
    loader.setStage = stage => {
        loader.state.stage = stage;
    };
    return loader;
};

describe('loader asset phases', () => {
    test('labels network and CPU-side work separately without moving backward', () => {
        const loader = makeLoader(true);

        loader.handleAssetProgress(4, 104, {
            phase: 'download',
            completed: 4,
            total: 4,
            overallCompleted: 4,
            overallTotal: 104
        });
        expect(loader.messageEl.textContent).toBe('Downloading files (4/4) …');
        const afterDownload = Number.parseFloat(loader.barInnerEl.style.width);

        loader.handleAssetProgress(54, 104, {
            phase: 'prepare',
            completed: 50,
            total: 100,
            overallCompleted: 54,
            overallTotal: 104
        });
        expect(loader.messageEl.textContent).toBe('Preparing assets (50/100) …');
        expect(Number.parseFloat(loader.barInnerEl.style.width)).toBeGreaterThanOrEqual(afterDownload);
    });
});
