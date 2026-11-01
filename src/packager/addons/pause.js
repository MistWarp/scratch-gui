import {RUNTIME_PAUSED, RUNTIME_UNPAUSED, silenceAudioWhilePaused} from '../../modules/paused-audio';

export default function ({ scaffolding }) {
  const vm = scaffolding.vm;

  silenceAudioWhilePaused(vm.runtime);

  vm.runtime.on(RUNTIME_PAUSED, () => {
    vm.runtime.emit('PROJECT_RUN_STOP');
    vm.emit('P4_PAUSE', true);
  });
  vm.runtime.on(RUNTIME_UNPAUSED, () => {
    vm.emit('P4_PAUSE', false);
  });
}
