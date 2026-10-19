import {embedUrl} from '../../src/community/api.js';

test('project embeds use the shared cached platform loader', () => {
    const url = new URL(embedUrl({
        id: 'project-1',
        projectJsonUrl: 'https://api.example/project.json',
        assetsBase: 'https://api.example/assets'
    }), window.location.origin);
    expect(url.searchParams.get('platform_project')).toBe('project-1');
    expect(url.searchParams.get('project_url')).toBe('https://api.example/project.json');
    expect(url.searchParams.get('mw_assets')).toBe('https://api.example/assets');
    expect(url.searchParams.get('mw_bridge')).toBe('1');
});

test('project embeds never carry a trusted extension list in the URL', () => {
    const url = new URL(embedUrl({
        id: 'project-1',
        projectJsonUrl: 'https://api.example/project.json',
        assetsBase: 'https://api.example/assets',
        trustedExtensions: ['hash-1']
    }), window.location.origin);
    expect(url.searchParams.has('mw_te')).toBe(false);
});
