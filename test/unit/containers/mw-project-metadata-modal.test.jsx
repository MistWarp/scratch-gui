import {buildSizeReport, formatSize, LIMITS} from '../../../src/containers/mw-project-metadata-modal.jsx';

const asset = (id, format, size) => ({
    assetId: id,
    dataFormat: format,
    data: new Uint8Array(size)
});

test('reads project sizes directly from the VM', () => {
    const costume = asset('costume', 'png', 10);
    const sound = asset('sound', 'wav', 6);
    const custom = asset('custom', 'bin', 4);
    const font = asset('font', 'ttf', 3);
    const vm = {
        runtime: {
            targets: [{
                id: 'sprite',
                isOriginal: true,
                isStage: false,
                getName: () => 'Sprite',
                getCostumes: () => [{name: 'Costume', asset: costume}],
                getSounds: () => [{name: 'Sound', asset: sound}],
                blocks: {_blocks: {one: {}, two: {}}},
                variables: {
                    rom: {id: 'rom', name: 'ROM', value: ['abcd', 'ef']}
                }
            }],
            assetManager: {assets: [{name: 'rom.bin', asset: custom}]},
            fontManager: {fonts: [{family: 'Font', asset: font}]}
        },
        extensionManager: {_loadedExtensions: new Map([['pen', {}]])}
    };

    const report = buildSizeReport(vm);

    expect(report.localEstimate).toBe(32);
    expect(report.localAssetSize).toBe(23);
    expect(report.variableDataSize).toBe(9);
    expect(report.contents).toEqual({
        sprites: 1,
        costumes: 1,
        sounds: 1,
        blocks: 2,
        extensions: ['pen']
    });
    expect(report.categories.map(category => [category.name, category.size])).toEqual([
        ['Costumes', 10],
        ['Variables and lists', 9],
        ['Sounds', 6],
        ['Custom assets', 4],
        ['Fonts', 3]
    ]);
    expect(report.largest[0].label).toBe('Sprite: Costume');
    expect(LIMITS.storedJson).toBe(20 * 1024 * 1024);
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.00 GB');
});
