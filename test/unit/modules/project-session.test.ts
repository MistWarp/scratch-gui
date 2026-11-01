import {describe, expect, jest, test} from '@jest/globals';
import {
    projectSession,
    resetProjectSession,
    setLoadHandoff,
    takeLoadHandoff
} from '../../../src/modules/project-session';

describe('projectSession', () => {
    test('starts with the values an untouched VM had', () => {
        expect(projectSession({})).toEqual({
            pendingDiskOverwrite: false,
            requireExplicitPush: false,
            approvedRemotes: new Set(),
            historyHydration: null,
            canTrustProject: false,
            historyBootstrapError: null
        });
    });

    test('returns the same record for the same VM', () => {
        const vm = {};
        projectSession(vm).pendingDiskOverwrite = true;
        expect(projectSession(vm)).toBe(projectSession(vm));
        expect(projectSession(vm).pendingDiskOverwrite).toBe(true);
    });

    test('keeps two VMs apart', () => {
        const first = {};
        const second = {};
        projectSession(first).requireExplicitPush = true;
        projectSession(first).approvedRemotes.add('https://example.com/first.git');
        expect(projectSession(second).requireExplicitPush).toBe(false);
        expect(projectSession(second).approvedRemotes.size).toBe(0);
        expect(projectSession(first).approvedRemotes).not.toBe(projectSession(second).approvedRemotes);
    });
});

describe('resetProjectSession', () => {
    test('detaches the workspace and keeps what the last load decided', () => {
        const vm = {};
        const session = projectSession(vm);
        const remotes = session.approvedRemotes;
        const bootstrapError = new Error('No history');
        Object.assign(session, {
            pendingDiskOverwrite: true,
            historyHydration: {key: 'p1', ready: true, manifest: null, promise: null},
            canTrustProject: true,
            historyBootstrapError: bootstrapError
        });
        remotes.add('https://example.com/imported.git');

        expect(resetProjectSession(vm)).toBe(session);
        expect(session).toEqual({
            pendingDiskOverwrite: false,
            requireExplicitPush: true,
            approvedRemotes: new Set(),
            historyHydration: null,
            canTrustProject: true,
            historyBootstrapError: bootstrapError
        });
        expect(session.approvedRemotes).not.toBe(remotes);
    });

    test('only touches the VM it is given', () => {
        const other = {};
        projectSession(other).pendingDiskOverwrite = true;
        resetProjectSession({});
        expect(projectSession(other).pendingDiskOverwrite).toBe(true);
        expect(projectSession(other).requireExplicitPush).toBe(false);
    });
});

describe('load handoff', () => {
    test('is empty when nothing was handed off', () => {
        expect(takeLoadHandoff({})).toEqual({});
    });

    test('hands the callbacks over once', () => {
        const vm = {};
        const release = jest.fn();
        const handoff = {prepareHistory: jest.fn(() => Promise.resolve()), release};
        setLoadHandoff(vm, handoff);
        expect(takeLoadHandoff(vm)).toBe(handoff);
        expect(takeLoadHandoff(vm)).toEqual({});
    });

    test('replaces an earlier handoff and keeps VMs apart', () => {
        const first = {};
        const second = {};
        const earlier = {release: jest.fn()};
        const later = {release: jest.fn()};
        setLoadHandoff(first, earlier);
        setLoadHandoff(first, later);
        setLoadHandoff(second, earlier);
        expect(takeLoadHandoff(first)).toBe(later);
        expect(takeLoadHandoff(second)).toBe(earlier);
    });
});
