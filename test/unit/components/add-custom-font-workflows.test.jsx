import {
    AddCustomFont,
    formatFontName,
    getDataFormat
} from '../../../src/components/tw-fonts-modal/add-custom-font';

const makeFontEditor = overrides => {
    const editor = new AddCustomFont({
        fontManager: {
            addCustomFont: jest.fn(),
            runtime: {
                storage: {
                    AssetType: {Font: 'Font'},
                    createAsset: jest.fn(() => ({id: 'font'}))
                }
            }
        },
        intl: {
            formatMessage: (message, values) => `Failed to read font file: ${values.error}`
        },
        onClose: jest.fn(),
        ...overrides
    });
    editor.setState = update => {
        const nextState = typeof update === 'function' ? update(editor.state, editor.props) : update;
        editor.state = {...editor.state, ...nextState};
    };
    editor.componentDidMount();
    return editor;
};

describe('custom font workflow', () => {
    let OriginalFileReader;

    beforeEach(() => {
        OriginalFileReader = global.FileReader;
    });

    afterEach(() => {
        global.FileReader = OriginalFileReader;
    });

    test('keeps dotted names and accepts uppercase extensions', () => {
        expect(formatFontName('My.Font.Bold.TTF')).toBe('My.Font.Bold');
        expect(getDataFormat('My.Font.Bold.TTF')).toBe('ttf');
    });

    test('shows the FileReader failure inside the modal and permits retrying', () => {
        global.FileReader = class {
            readAsArrayBuffer () {
                this.error = new Error('permission denied');
                this.onerror();
            }
        };
        const editor = makeFontEditor();
        editor.state.file = {name: 'Font.ttf'};

        editor.handleFinish();

        expect(editor.state.loading).toBe(false);
        expect(editor.state.error).toBe('Failed to read font file: permission denied');
        expect(editor.props.onClose).not.toHaveBeenCalled();
    });

    test('catches font registration failures instead of leaving the modal busy', () => {
        global.FileReader = class {
            readAsArrayBuffer () {
                this.result = new ArrayBuffer(2);
                this.onload();
            }
        };
        const fontManager = {
            addCustomFont: jest.fn(() => {
                throw new Error('invalid font');
            }),
            runtime: {
                storage: {
                    AssetType: {Font: 'Font'},
                    createAsset: jest.fn(() => ({id: 'font'}))
                }
            }
        };
        const editor = makeFontEditor({fontManager});
        editor.state.file = {name: 'Font.ttf'};
        editor.state.format = 'ttf';

        editor.handleFinish();

        expect(editor.state.loading).toBe(false);
        expect(editor.state.error).toBe('Failed to read font file: invalid font');
        expect(editor.props.onClose).not.toHaveBeenCalled();
    });

    test('adds the font with the values submitted before the read finishes', () => {
        let reader;
        global.FileReader = class {
            constructor () {
                reader = this;
            }
            readAsArrayBuffer () {}
        };
        const editor = makeFontEditor();
        editor.state = {
            ...editor.state,
            file: {name: 'Font.ttf'},
            fallback: 'serif',
            format: 'ttf',
            name: 'Original name'
        };

        editor.handleFinish();
        editor.state.name = 'Changed too late';
        editor.state.fallback = 'sans-serif';
        reader.result = new ArrayBuffer(2);
        reader.onload();

        expect(editor.props.fontManager.addCustomFont).toHaveBeenCalledWith(
            'Original name',
            'serif',
            {id: 'font'}
        );
        expect(editor.props.onClose).toHaveBeenCalledTimes(1);
    });
});
