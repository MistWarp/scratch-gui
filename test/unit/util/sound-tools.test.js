import {fromSamples, clipLength} from '../../../src/lib/audio/sound-data';
import {
    TOOLS,
    TOOL_GROUPS,
    affectedRange,
    applyTool,
    defaultParams,
    getTool,
    resolveParams
} from '../../../src/lib/audio/sound-tools';
import {renderEffect} from '../../../src/lib/audio/effect-render';

jest.mock('../../../src/lib/audio/effect-render', () => ({
    renderEffect: jest.fn()
}));

const mono = values => fromSamples(new Float32Array(values), 10);
const values = clip => Array.from(clip.channels[0]).map(value => Math.round(value * 1000) / 1000);

describe('sound tools', () => {
    beforeEach(() => {
        renderEffect.mockReset();
    });

    test('every tool belongs to a known group', () => {
        for (const tool of TOOLS) {
            expect(TOOL_GROUPS).toContain(tool.group);
        }
        expect(getTool('missing')).toBeNull();
        expect(defaultParams('missing')).toEqual({});
    });

    test('clamps parameters and falls back to defaults', () => {
        expect(defaultParams('gain')).toEqual({db: 3});
        expect(resolveParams('gain', {db: 100})).toEqual({db: 24});
        expect(resolveParams('gain', {db: 'loud'})).toEqual({db: 3});
        expect(resolveParams('fadeIn', {shape: 'wobbly'})).toEqual({shape: 'smooth'});
        expect(resolveParams('echo')).toEqual({delay: 250, feedback: 30});
    });

    test('applies gain to the selection and keeps it selected', async () => {
        const result = await applyTool('gain', mono([0.1, 0.1, 0.1]), {
            selection: {start: 1, end: 2},
            params: {db: 6}
        });
        expect(values(result.clip)).toEqual([0.1, 0.2, 0.1]);
        expect(result.selection).toEqual({start: 1, end: 2});
    });

    test('applies to the whole sound when nothing is selected', async () => {
        const result = await applyTool('reverse', mono([1, 2, 3]), {selection: null, params: {}});
        expect(values(result.clip)).toEqual([3, 2, 1]);
        expect(result.selection).toBeNull();
    });

    test('inserts silence at the cursor and selects it', async () => {
        const result = await applyTool('insertSilence', mono([1, 1]), {
            selection: null,
            cursor: 1,
            params: {seconds: 0.2}
        });
        expect(values(result.clip)).toEqual([1, 0, 0, 1]);
        expect(result.selection).toEqual({start: 1, end: 3});
    });

    test('mixes a source in at the cursor', async () => {
        const result = await applyTool('mix', mono([1, 1, 1]), {
            cursor: 2,
            params: {db: 0},
            source: mono([1, 1])
        });
        expect(values(result.clip)).toEqual([1, 1, 2, 1]);
        expect(result.selection).toEqual({start: 2, end: 4});
        await expect(applyTool('mix', mono([1]), {params: {}})).rejects.toThrow();
        await expect(applyTool('mix', mono([1]), {params: {}, source: fromSamples([1], 20)})).rejects.toThrow();
    });

    test('splices rendered effects back into the sound', async () => {
        renderEffect.mockResolvedValue({clip: mono([5]), bodyLength: 1});
        const result = await applyTool('speed', mono([1, 1, 1, 1]), {
            selection: {start: 1, end: 3},
            params: {percent: 200}
        });
        expect(renderEffect).toHaveBeenCalledWith(expect.anything(), 'speed', {rate: 2});
        expect(values(result.clip)).toEqual([1, 5, 1]);
        expect(result.selection).toEqual({start: 1, end: 2});
    });

    test('previews include the tail an effect adds', async () => {
        renderEffect.mockResolvedValue({clip: mono([2, 2, 0.5, 0.5]), bodyLength: 2});
        const clip = mono([1, 1, 1, 1, 1, 1]);
        const selection = {start: 1, end: 3};
        const result = await applyTool('echo', clip, {selection, params: {}});
        expect(affectedRange('echo', clip, selection, 0, result)).toEqual([1, 5]);
    });

    test('converts effect parameters to the renderer units', async () => {
        renderEffect.mockImplementation(clip => Promise.resolve({clip, bodyLength: clipLength(clip)}));
        await applyTool('echo', mono([1]), {params: {delay: 500, feedback: 50}});
        expect(renderEffect).toHaveBeenLastCalledWith(expect.anything(), 'echo', {delay: 0.5, feedback: 0.5, mix: 0.75});
        await applyTool('reverb', mono([1]), {params: {size: 2, mix: 40}});
        expect(renderEffect).toHaveBeenLastCalledWith(expect.anything(), 'reverb', {size: 2, mix: 0.4});
        await applyTool('lowpass', mono([1]), {params: {frequency: 800}});
        expect(renderEffect).toHaveBeenLastCalledWith(expect.anything(), 'lowpass', {frequency: 800});
    });

    test('rejects unknown tools', async () => {
        await expect(applyTool('missing', mono([1]), {params: {}})).rejects.toThrow();
    });

    test('reports the range a tool changed', () => {
        const clip = mono([1, 1, 1, 1]);
        expect(affectedRange('gain', clip, null, 0, {clip, selection: {start: 1, end: 2}})).toEqual([1, 2]);
        expect(affectedRange('mix', clip, null, 2, {clip, selection: null})).toEqual([2, 4]);
        expect(affectedRange('gain', clip, null, 0, {clip, selection: null})).toEqual([0, 4]);
    });
});
