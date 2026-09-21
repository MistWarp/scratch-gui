import {TWSecurityManagerComponent} from '../../../src/containers/tw-security-manager.jsx';

jest.mock('../../../src/lib/editor-sandbox/protocol.js', () => ({
    ...jest.requireActual('../../../src/lib/editor-sandbox/protocol.js'),
    isIsolatedEditor: () => true
}));

const makeComponent = (answer, runtime = {}) => {
    const component = new TWSecurityManagerComponent({vm: {runtime}, securityManager: {}});
    const showModal = jest.fn(async () => answer);
    component.acquireModalLock = async () => ({showModal});
    return {component, showModal};
};

test('the isolated editor runs extensions unsandboxed', async () => {
    const {component} = makeComponent(true);
    await expect(component.getSandboxMode('https://example.com/extension.js')).resolves.toBe('unsandboxed');
});

test('the isolated editor asks before loading a project extension', async () => {
    const {component, showModal} = makeComponent(false);
    await expect(component.canLoadExtensionFromProject('https://example.com/extension.js')).resolves.toBe(false);
    expect(showModal).toHaveBeenCalledWith(expect.anything(), {
        url: 'https://example.com/extension.js', unsandboxed: true, isolated: true
    });
});

test('an accepted prompt loads the extension', async () => {
    const {component} = makeComponent(true);
    await expect(component.canLoadExtensionFromProject('https://example.com/extension.js')).resolves.toBe(true);
});

test('dangerous extensions keep their own warning', async () => {
    const {component, showModal} = makeComponent(false);
    await component.canLoadExtensionFromProject('https://example.com/EvalPlus.js');
    expect(showModal.mock.calls[0][1]).toMatchObject({dangerousJs: 'EvalPlus', unsandboxed: true});
});

test('a project the user already trusted loads without asking again', async () => {
    const {component, showModal} = makeComponent(false, {_mwProjectTrusted: true});
    await expect(component.canLoadExtensionFromProject('https://example.com/extension.js')).resolves.toBe(true);
    expect(showModal).not.toHaveBeenCalled();
});
