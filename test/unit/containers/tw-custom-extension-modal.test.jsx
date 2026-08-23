import {CustomExtensionModal} from '../../../src/containers/tw-custom-extension-modal.jsx';
import {isTrustedExtension} from '../../../src/containers/tw-security-manager.jsx';

test.each(['file', 'text'])('%s extensions load unsandboxed', async type => {
    const url = `data:application/javascript,${type}`;
    const loadExtensionURL = jest.fn();
    const modal = new CustomExtensionModal({
        onClose: jest.fn(),
        vm: {extensionManager: {loadExtensionURL}}
    });
    modal.setState = state => {
        modal.state = {...modal.state, ...state};
    };
    modal.state.type = type;
    if (type === 'file') {
        modal.state.files = {length: 1};
    } else {
        modal.state.text = 'extension source';
    }
    modal.getExtensionURLs = () => Promise.resolve([url]);

    await modal.handleLoadExtension();

    expect(isTrustedExtension(url)).toBe(true);
    expect(loadExtensionURL).toHaveBeenCalledWith(url);
    expect(modal.props.onClose).toHaveBeenCalledTimes(1);
});

test('keeps the modal open with its input when loading fails', async () => {
    const onClose = jest.fn();
    const modal = new CustomExtensionModal({
        onClose,
        vm: {
            extensionManager: {
                loadExtensionURL: jest.fn(() => Promise.reject(new Error('Network unavailable')))
            }
        }
    });
    modal.setState = state => {
        modal.state = {...modal.state, ...state};
    };
    modal.state.url = 'https://example.com/extension.js';

    await expect(modal.handleLoadExtension()).resolves.toBe(false);

    expect(onClose).not.toHaveBeenCalled();
    expect(modal.state.loading).toBe(false);
    expect(modal.state.error).toBe('Network unavailable');
    expect(modal.state.url).toBe('https://example.com/extension.js');
});

test('ignores repeated load actions while one is in progress', async () => {
    let finishLoading;
    const loadExtensionURL = jest.fn(() => new Promise(resolve => {
        finishLoading = resolve;
    }));
    const modal = new CustomExtensionModal({
        onClose: jest.fn(),
        vm: {extensionManager: {loadExtensionURL}}
    });
    modal.setState = state => {
        modal.state = {...modal.state, ...state};
    };
    modal.state.url = 'https://example.com/extension.js';

    const firstLoad = modal.handleLoadExtension();
    const secondLoad = modal.handleLoadExtension();
    expect(firstLoad).toBe(secondLoad);
    await Promise.resolve();
    expect(loadExtensionURL).toHaveBeenCalledTimes(1);

    finishLoading();
    await expect(firstLoad).resolves.toBe(true);
});

test('does not close while an extension is still loading', async () => {
    let finishLoading;
    const onClose = jest.fn();
    const modal = new CustomExtensionModal({
        onClose,
        vm: {
            extensionManager: {
                loadExtensionURL: jest.fn(() => new Promise(resolve => {
                    finishLoading = resolve;
                }))
            }
        }
    });
    modal.setState = state => {
        modal.state = {...modal.state, ...state};
    };
    modal.state.url = 'https://example.com/extension.js';

    const loading = modal.handleLoadExtension();
    await Promise.resolve();
    modal.handleClose();
    expect(onClose).not.toHaveBeenCalled();

    finishLoading();
    await loading;
    expect(onClose).toHaveBeenCalledTimes(1);
});
