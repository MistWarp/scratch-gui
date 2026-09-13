import Packager from '../../src/packager/packager/packager';

jest.mock('../../src/packager/packager/large-assets', () => ({}));
jest.mock('virtual:packager-runtime', () => ({buildId: 'test'}), {virtual: true});

test('embedded runtime preserves JavaScript and escapes HTML script terminators', async () => {
    const packager = new Packager();
    packager.project = {analysis: {usesMusic: false}};
    const source = 'globalThis.runtimeFixture = ["</script>", `</ScRiPt>`, "$&"];';
    packager.fetchLargeAsset = jest.fn().mockResolvedValue(source);
    packager.getAddonOptions = () => ({});
    await packager.loadResources();
    expect(packager.script).not.toMatch(/<\/script/i);
    // Execute the embedded result to check that escaping preserves string values.
    const run = new Function('globalThis', packager.script); // eslint-disable-line no-new-func
    const globals = {};
    run(globals);
    expect(globals.runtimeFixture).toEqual(['</script>', '</ScRiPt>', '$&']);
});
