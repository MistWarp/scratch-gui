import {
    getMyStuffSection,
    shouldRefreshProjectsAfterUploadError,
    uploadErrorTarget,
    uploadProgressLabel
} from '../../src/community/pages/MyStuff.jsx';

describe('My Stuff upload feedback', () => {
    test('normalizes URL-backed sections', () => {
        expect(getMyStuffSection('projects')).toBe('projects');
        expect(getMyStuffSection('unknown')).toBe('overview');
        expect(getMyStuffSection(null)).toBe('overview');
    });

    test('keeps agreement failures in the open agreement dialog', () => {
        expect(uploadErrorTarget(false, new Error('Acceptance failed'))).toEqual({
            actionError: '',
            agreementError: 'Acceptance failed'
        });
    });

    test('moves post-acceptance upload failures to the visible page error', () => {
        expect(uploadErrorTarget(true, new Error('Upload failed'))).toEqual({
            actionError: 'Upload failed',
            agreementError: ''
        });
    });

    test('shows transfer progress and names server processing after 100%', () => {
        expect(uploadProgressLabel(25, 100)).toBe('Uploading 25%');
        expect(uploadProgressLabel(100, 100)).toBe('Processing on server…');
        expect(uploadProgressLabel(0, 0)).toBe('Uploading…');
    });

    test('refreshes My Stuff when server processing outlives the request', () => {
        expect(shouldRefreshProjectsAfterUploadError({code: 'upload_processing_timeout'})).toBe(true);
        expect(shouldRefreshProjectsAfterUploadError({code: 'upload_stalled'})).toBe(false);
    });
});
