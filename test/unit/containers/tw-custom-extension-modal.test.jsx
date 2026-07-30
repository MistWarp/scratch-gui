import {CustomExtensionModal} from '../../../src/containers/tw-custom-extension-modal.jsx';
import {isTrustedExtension} from '../../../src/containers/tw-security-manager.jsx';

test.each(['file', 'text'])('%s extensions load unsandboxed', async type => {
    const url = `data:application/javascript,${type}`;
    const loadExtensionURL = jest.fn();
    const modal = new CustomExtensionModal({
        onClose: jest.fn(),
        vm: {extensionManager: {loadExtensionURL}}
    });
    modal.state.type = type;
    modal.getExtensionURLs = () => Promise.resolve([url]);

    await modal.handleLoadExtension();

    expect(isTrustedExtension(url)).toBe(true);
    expect(loadExtensionURL).toHaveBeenCalledWith(url);
});
