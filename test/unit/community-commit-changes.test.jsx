import React from 'react';
import {mount} from 'enzyme';

import ChangesView from '../../src/community/components/ChangesView.jsx';
import {
    analyseChanges,
    describeTarget,
    loadSpriteTexts,
    assetFileOf,
    formatStateValue,
    groupChangedFiles,
    isChangesResponse,
    plainScriptTitle,
    sidebarFilesFor,
    targetName
} from '../../src/community/commit-changes.js';
import {scriptChangeDiff} from '../../src/community/scratchblocks-translate.js';
import {usableChanges} from '../../src/community/pages/Commit.jsx';
import {shouldLoadPullDiff} from '../../src/community/pages/PullRequest.jsx';

const sectionFor = (wrapper, name) => wrapper.find('section')
    .filterWhere(node => node.children('header').find('h3')
        .someWhere(heading => heading.text() === name));

const target = (path, extra = {}) => ({
    path,
    status: 'modified',
    files: [`${path}/main.fractch`],
    scripts: [],
    items: [],
    state: [],
    ...extra
});

const RESPONSE = {
    ok: true,
    sha: 'b'.repeat(40),
    parent: 'a'.repeat(40),
    legacy: false,
    commit: {message: 'Add typing'},
    targets: [
        target('Mouse', {
            state: [{kind: 'sprite', name: 'Mouse', field: 'layer', before: '9', after: '8'}]
        }),
        target('Main', {
            scripts: [
                {
                    change: 'changed',
                    kind: 'when',
                    head: 'when flag',
                    file: 'Main/main.fractch',
                    before: 'when flag {\n  say "hi";\n}',
                    after: 'when flag {\n  say "hi";\n  hide;\n}'
                },
                {
                    change: 'changed',
                    kind: 'when',
                    head: 'when clicked',
                    file: 'Main/main.fractch',
                    before: 'when clicked {\n  wait_until mouseDown();\n}',
                    after: 'when clicked {\n  waitUntil mouseDown();\n}'
                },
                {
                    change: 'moved',
                    kind: 'when',
                    head: 'when key space',
                    file: 'Main/input.fractch',
                    beforeFile: 'Main/main.fractch'
                }
            ],
            items: [{change: 'added', kind: 'costume', name: 'happy', after: 'costume "happy" file "assets/happy.svg"'}],
            state: [
                {kind: 'sprite', name: 'Main Sprite', field: 'position', before: '17,-62', after: '172.79180789045552,156'},
                {kind: 'variable', name: 'score', field: 'value', before: '1', after: '2'}
            ]
        }),
        target('Stage', {
            items: [{change: 'added', kind: 'use', name: 'iframePlus', after: 'use "iframePlus";'}]
        })
    ],
    files: [
        {path: 'Main/assets/happy.svg', status: 'added', oldOid: null, newOid: 'c'.repeat(40)},
        {path: 'README.md', status: 'modified', oldOid: 'd'.repeat(40), newOid: 'e'.repeat(40)}
    ],
    totals: {
        scripts: {added: 0, removed: 0, changed: 2, moved: 1},
        items: 2,
        state: 3,
        assets: {added: 1, removed: 0, modified: 0},
        files: 1,
        stateOnly: false
    }
};

describe('commit changes helpers', () => {
    test('recognises the structured response and rejects legacy or file-level ones', () => {
        expect(isChangesResponse(RESPONSE)).toBe(true);
        expect(isChangesResponse({...RESPONSE, legacy: true})).toBe(false);
        expect(isChangesResponse({ok: true, files: []})).toBe(false);
        expect(isChangesResponse({ok: false, targets: []})).toBe(false);
        expect(isChangesResponse(null)).toBe(false);
    });

    test('names targets from the server, their sprite state, or their folder', () => {
        expect(targetName(RESPONSE.targets[1])).toBe('Main Sprite');
        expect(targetName(target('Loading_bar', {name: 'Loading bar'}))).toBe('Loading bar');
        expect(targetName(RESPONSE.targets[2])).toBe('Stage');
        expect(targetName(target('Some_folder'))).toBe('Some_folder');
    });

    test('splits asset files by sprite and leaves other files apart', () => {
        const {assets, others} = groupChangedFiles(RESPONSE);
        expect(assets.Main).toEqual([expect.objectContaining({path: 'Main/assets/happy.svg', status: 'Added'})]);
        expect(others).toEqual([expect.objectContaining({path: 'README.md', status: 'Modified'})]);
    });

    test('puts sprites with only saved state last', () => {
        expect(analyseChanges(RESPONSE).targets.map(entry => entry.dir)).toEqual(['Main', 'Stage', 'Mouse']);
    });

    test('counts spelling-only rewrites apart from real script changes', () => {
        const analysis = analyseChanges(RESPONSE);
        expect(analysis.summary).toEqual(expect.objectContaining({
            sprites: 2,
            scriptsChanged: 1,
            rewritten: 1,
            scriptsMoved: 1,
            files: 1,
            stateSprites: 2,
            stateOnly: false
        }));
        const main = analysis.targets[0];
        expect(main.scripts.map(entry => entry.script.head)).toEqual(['when flag', 'when key space']);
        expect(main.count).toBe(3);
    });

    test('does not count a sprite whose only change is a rewrite', () => {
        const rewriteOnly = {
            ...RESPONSE,
            targets: [target('Taskbar', {scripts: [RESPONSE.targets[1].scripts[1]]})],
            files: []
        };
        const [entry] = analyseChanges(rewriteOnly).targets;
        expect(entry.authored).toBe(false);
        expect(entry.rewritten).toBe(1);
    });

    test('turns script heads into plain titles', () => {
        expect(plainScriptTitle('when [any v] key pressed')).toBe('when any key pressed');
        expect(plainScriptTitle('isVisible [iframe1] :: extension')).toBe('isVisible iframe1');
        expect(plainScriptTitle('Define "Typing system %s"')).toBe('Define "Typing system %s"');
    });

    test('rounds long decimals in saved values', () => {
        expect(formatStateValue('172.79180789045552,156')).toBe('172.79, 156');
        expect(formatStateValue('56.00000000000001')).toBe('56');
        expect(formatStateValue('"hello"')).toBe('"hello"');
        expect(formatStateValue('0.5')).toBe('0.5');
    });

    test('reads the asset file of a costume statement', () => {
        expect(assetFileOf('costume "a" file "assets/a.svg" center 1,2')).toBe('assets/a.svg');
        expect(assetFileOf('var x = 1')).toBe('');
    });

    test('gives the sidebar one fractch file and the assets of every target', () => {
        expect(sidebarFilesFor(analyseChanges(RESPONSE)).map(file => file.path)).toEqual([
            'Main/main.fractch',
            'Main/assets/happy.svg',
            'Stage/main.fractch',
            'Mouse/main.fractch'
        ]);
    });

    test('leaves deleted costumes out of the sidebar so thumbnails never load them', () => {
        const withDeleted = {
            ...RESPONSE,
            files: [...RESPONSE.files, {path: 'Main/assets/sad.svg', status: 'removed'}]
        };
        expect(sidebarFilesFor(analyseChanges(withDeleted)).map(file => file.path)).not.toContain('Main/assets/sad.svg');
    });

    test('gives asset changes without a fractch change their own sprite', () => {
        const assetOnly = {
            ...RESPONSE,
            targets: [],
            files: [{path: 'Cat/assets/idle.svg', status: 'modified', oldOid: 'a', newOid: 'b'}]
        };
        const analysis = analyseChanges(assetOnly);
        expect(analysis.targets).toEqual([expect.objectContaining({dir: 'Cat', authored: true, count: 1})]);
        expect(analysis.summary.stateOnly).toBe(false);
    });

    test('leaves fractch.json out of other files', () => {
        const withOrder = {...RESPONSE, files: [...RESPONSE.files, {path: 'fractch.json', status: 'modified'}]};
        expect(analyseChanges(withOrder).others.map(file => file.path)).toEqual(['README.md']);
    });

    test('describes too large, state-only and rewrite-only sprites', () => {
        const text = (message, values) => message.replace('{value1}', values?.value1);
        const label = source => describeTarget(
            analyseChanges({...RESPONSE, targets: [source], files: []}).targets[0],
            text
        );
        expect(label(target('Big', {tooLarge: true}))).toBe('Too large to compare');
        expect(label(RESPONSE.targets[0])).toBe('Saved state only');
        expect(label(target('Taskbar', {scripts: [RESPONSE.targets[1].scripts[1]]}))).toBe('No block changes');
        expect(label(RESPONSE.targets[1])).toBe('3 changes');
    });

    test('loads sprite texts a few at a time and skips the ones that fail', async () => {
        let running = 0;
        let peak = 0;
        const many = {
            ...RESPONSE,
            files: [],
            targets: Array.from({length: 20}, (_, index) => target(`S${index}`, {
                files: [`S${index}/main.fractch`, `S${index}/extra.fractch`],
                items: [{change: 'added', kind: 'variable', name: 'v'}]
            })).concat([RESPONSE.targets[0]])
        };
        const texts = await loadSpriteTexts(analyseChanges(many), async path => {
            running++;
            peak = Math.max(peak, running);
            await new Promise(resolve => setTimeout(resolve, 1));
            running--;
            if (path === 'S3/main.fractch') throw new Error('gone');
            return `text of ${path}`;
        });
        expect(peak).toBeLessThanOrEqual(6);
        expect(Object.keys(texts)).toHaveLength(20);
        expect(texts['S0/main.fractch']).toEqual({before: '', after: 'text of S0/main.fractch'});
        expect(texts['S3/main.fractch']).toBeUndefined();
        expect(texts['Mouse/main.fractch']).toEqual({before: '', after: 'text of Mouse/main.fractch'});
    });

    test('loads the pull diff only when the structured view is missing or the file diff is asked for', () => {
        const pull = {index: 1};
        expect(shouldLoadPullDiff({tab: 'files', pull, diff: null, diffError: '', changes: RESPONSE})).toBe(false);
        expect(shouldLoadPullDiff({tab: 'files', pull, diff: null, diffError: '', changes: RESPONSE, fileDiff: true}))
            .toBe(true);
        expect(shouldLoadPullDiff({tab: 'files', pull, diff: null, diffError: '', changes: null})).toBe(true);
    });

    test('falls back to the old view for an empty remix bootstrap commit', () => {
        const empty = {...RESPONSE, targets: [], files: []};
        expect(usableChanges(empty, {enabled: true})).toBeNull();
        expect(usableChanges(empty, {enabled: false})).toBe(empty);
        expect(usableChanges({...RESPONSE, legacy: true}, null)).toBeNull();
    });
});

describe('scriptChangeDiff', () => {
    test('marks the blocks that changed', () => {
        const result = scriptChangeDiff('when flag {\n  say "hi";\n}', 'when flag {\n  say "hi";\n  hide;\n}');
        expect(result.desc).toBe('when green flag clicked');
        expect(result.diff).toContain('+ hide');
    });

    test('shows no marked lines when only the spelling changed', () => {
        const result = scriptChangeDiff(
            'when clicked {\n  wait_until mouseDown();\n}',
            'when clicked {\n  waitUntil mouseDown();\n}'
        );
        expect(result.diff.split('\n').some(line => /^[+-]\s/.test(line))).toBe(false);
    });

    test('marks every block of an added script', () => {
        const result = scriptChangeDiff('', 'when flag {\n  hide;\n}');
        expect(result.diff.split('\n').every(line => line.startsWith('+ '))).toBe(true);
    });

    test('returns null for text that does not parse', () => {
        expect(scriptChangeDiff('when flag {', 'when flag { hide; }')).toBeNull();
    });
});

describe('ChangesView', () => {
    beforeEach(() => {
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = jest.fn();
    });

    test('summarises the commit and folds saved state into one row', () => {
        const loadAsset = jest.fn(() => new Promise(() => {}));
        const wrapper = mount(<ChangesView
            analysis={analyseChanges(RESPONSE)}
            loadAsset={loadAsset}
        />);
        const summary = wrapper.find('section[aria-labelledby="commit-changes-summary"]').text();
        expect(summary).toContain('1 script changed.');
        expect(summary).toContain('1 script was rewritten without changing its blocks.');
        expect(summary).toContain('1 script moved to another file.');
        expect(summary).toContain('1 costume or sound changed.');
        expect(summary).toContain('1 extension changed.');
        expect(summary).toContain('Saved state changed in 2 sprites.');
        const state = wrapper.find('details').last();
        expect(state.prop('open')).toBeUndefined();
        expect(state.text()).toContain('3 saved values changed.');
        expect(state.text()).toContain('172.79, 156');
        expect(wrapper.find('h3').map(node => node.text())).not.toContain('Mouse');
    });

    test('lists moved scripts, spelling-only rewrites and items in sentences', () => {
        const wrapper = mount(<ChangesView
            analysis={analyseChanges(RESPONSE)}
            loadAsset={jest.fn(() => new Promise(() => {}))}
        />);
        const main = sectionFor(wrapper, 'Main Sprite').first()
            .text();
        expect(main).toContain('Moved from Main/main.fractch to Main/input.fractch.');
        expect(main).toContain('when green flag clicked');
        expect(main).not.toContain('when this sprite clicked');
        expect(main).toContain('Costume "happy" added');
        expect(main).toContain('3 changes');
        expect(sectionFor(wrapper, 'Global').text()).toContain('Extension "iframePlus" added');
        expect(sectionFor(wrapper, 'Other files').text()).toContain('README.md');
    });

    test('shows only the selected sprite', () => {
        const wrapper = mount(
            <ChangesView
                analysis={analyseChanges(RESPONSE)}
                spriteFilter="Stage"
                loadAsset={jest.fn(() => new Promise(() => {}))}
            />
        );
        expect(sectionFor(wrapper, 'Main Sprite').exists()).toBe(false);
        expect(sectionFor(wrapper, 'Global').exists()).toBe(true);
        expect(sectionFor(wrapper, 'Other files').exists()).toBe(false);
    });

    test('summarises only the selected sprite', () => {
        const wrapper = mount(<ChangesView
            analysis={analyseChanges(RESPONSE)}
            spriteFilter="Stage"
        />);
        const summary = wrapper.find('section[aria-labelledby="commit-changes-summary"]').text();
        expect(summary).toContain('1 extension changed.');
        expect(summary).not.toContain('script');
    });

    test('says when only saved state changed', () => {
        const stateOnly = {
            ...RESPONSE,
            targets: [RESPONSE.targets[0]],
            files: [],
            totals: {...RESPONSE.totals, scripts: {}, items: 0, assets: {}, files: 0, stateOnly: true}
        };
        const wrapper = mount(<ChangesView analysis={analyseChanges(stateOnly)} />);
        expect(wrapper.text()).toContain('Only saved state changed. No scripts, costumes or sounds were edited.');
    });
});
