import {
    getMyStuffSection,
    normalizeMyStuffParams,
    removeProjectById,
    replaceProjectById,
    shouldRefreshProjectsAfterUploadError,
    trashPurgeConfirmation,
    uploadErrorTarget,
    uploadProgressLabel
} from '../../src/community/pages/MyStuff.jsx';

describe('My Stuff upload feedback', () => {
    test('updates individual project rows without reloading the full list', () => {
        const projects = [{id: 'one', shared: false}, {id: 'two', shared: false}];
        expect(replaceProjectById(projects, {id: 'two', shared: true})).toEqual([
            {id: 'one', shared: false},
            {id: 'two', shared: true}
        ]);
        expect(removeProjectById(projects, 'one')).toEqual([{id: 'two', shared: false}]);
    });

    test('normalizes URL-backed sections', () => {
        expect(getMyStuffSection('projects')).toBe('projects');
        expect(getMyStuffSection('themes')).toBe('themes');
        expect(getMyStuffSection('trash')).toBe('trash');
        expect(getMyStuffSection('unknown')).toBe('overview');
        expect(getMyStuffSection(null)).toBe('overview');
        expect(normalizeMyStuffParams(new URLSearchParams('section=unknown&keep=value')).toString())
            .toBe('keep=value');
        expect(normalizeMyStuffParams(new URLSearchParams('section=projects&themeView=published')).toString())
            .toBe('section=projects');
        expect(normalizeMyStuffParams(new URLSearchParams('section=themes&themeView=published')).toString())
            .toBe('section=themes&themeView=published');
        expect(normalizeMyStuffParams(new URLSearchParams('section=collections&collectionView=library')).toString())
            .toBe('section=collections&collectionView=library');
        expect(normalizeMyStuffParams(new URLSearchParams('section=spaces&collectionView=library')).toString())
            .toBe('section=spaces');
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

    test('makes permanent Trash deletion explicit', () => {
        expect(trashPurgeConfirmation({title: 'Old draft'})).toEqual({
            title: 'Delete forever?',
            body: 'Permanently delete "Old draft"? This cannot be undone.',
            action: 'Delete forever'
        });
    });
});
