import VM from 'scratch-vm';
import {STARTERS, createStarterProject} from '../../../src/lib/starter-projects';

// Run real Scratch blocks, rather than only comparing generated JSON.
describe('working starter projects', () => {
    let vm;
    beforeEach(() => { vm = new VM(); });
    afterEach(() => { vm.quit(); vm.clear(); });

    test.each(STARTERS.map(starter => [starter.id]))('%s loads in the VM', async id => {
        await vm.loadProject(JSON.stringify(createStarterProject(id)), {skipGitImport: true});
        expect(vm.runtime.targets.filter(target => !target.isStage)).toHaveLength(1);
        expect(vm.runtime.getSpriteTargetByName('Cloud')).toBeTruthy();
    });

    test('clicker resets and then increases the score when clicked', async () => {
        await vm.loadProject(JSON.stringify(createStarterProject('clicker')), {skipGitImport: true});
        vm.greenFlag();
        vm.runtime._step();
        const stage = vm.runtime.getTargetForStage();
        expect(Number(stage.variables.score.value)).toBe(0);
        vm.runtime.startHats('event_whenthisspriteclicked', null, vm.runtime.getSpriteTargetByName('Cloud'));
        vm.runtime._step();
        expect(Number(stage.variables.score.value)).toBe(1);
    });

    test('explorer moves right on the right-arrow event', async () => {
        await vm.loadProject(JSON.stringify(createStarterProject('explorer')), {skipGitImport: true});
        const sprite = vm.runtime.getSpriteTargetByName('Cloud');
        vm.runtime.startHats('event_whenkeypressed', {KEY_OPTION: 'right arrow'}, sprite);
        vm.runtime._step();
        expect(sprite.x).toBe(10);
    });

    test('invalid starters are rejected', () => {
        expect(() => createStarterProject('missing')).toThrow('Unknown starter');
    });
});
