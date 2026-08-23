import {Monitor} from '../../../src/containers/monitor.jsx';
import importCSV from '../../../src/lib/utils/import-csv.js';
import {setVariableValue} from '../../../src/lib/utils/variables';

jest.mock('../../../src/lib/utils/import-csv.js', () => jest.fn());
jest.mock('../../../src/lib/utils/variables', () => ({
    getVariable: jest.fn(),
    setVariableValue: jest.fn()
}));

const makeMonitor = () => {
    const monitor = new Monitor({
        id: 'list',
        intl: {formatMessage: jest.fn(message => message.defaultMessage)},
        onShowImportError: jest.fn(),
        openSimpleDialog: jest.fn(),
        targetId: 'target',
        vm: {}
    });
    return monitor;
};

describe('list monitor imports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('does not replace the list when the column prompt is cancelled', async () => {
        importCSV.mockResolvedValue({rows: [['a', 'b']], text: 'a,b'});
        const monitor = makeMonitor();
        monitor.props.openSimpleDialog.mockImplementation(config => config.onCancel());

        await expect(monitor.handleImport()).resolves.toBe(false);
        expect(setVariableValue).not.toHaveBeenCalled();
        expect(monitor.props.onShowImportError).not.toHaveBeenCalled();
    });

    test('rejects an out-of-range column without emptying the list', async () => {
        importCSV.mockResolvedValue({rows: [['a', 'b']], text: 'a,b'});
        const monitor = makeMonitor();
        monitor.props.openSimpleDialog.mockImplementation(config => config.onOk('3'));

        await expect(monitor.handleImport()).resolves.toBe(false);
        expect(setVariableValue).not.toHaveBeenCalled();
        expect(monitor.props.onShowImportError).toHaveBeenCalledTimes(1);
    });

    test('imports the selected column', async () => {
        importCSV.mockResolvedValue({
            rows: [['a', 'b'], ['c', 'd']],
            text: 'a,b\nc,d'
        });
        const monitor = makeMonitor();
        monitor.props.openSimpleDialog.mockImplementation(config => config.onOk('2'));

        await expect(monitor.handleImport()).resolves.toBe(true);
        expect(setVariableValue).toHaveBeenCalledWith({}, 'target', 'list', ['b', 'd']);
    });

    test('does not update a removed monitor after the file picker resolves', async () => {
        let finishImport;
        importCSV.mockReturnValue(new Promise(resolve => {
            finishImport = resolve;
        }));
        const monitor = makeMonitor();
        const importRequest = monitor.handleImport();

        monitor.unmounted = true;
        finishImport({rows: [['a']], text: 'a'});

        await expect(importRequest).resolves.toBe(false);
        expect(setVariableValue).not.toHaveBeenCalled();
    });
});
