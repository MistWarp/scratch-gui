// Set once by the host build and shared with every emitted packager runtime.
import {buildId} from 'virtual:packager-runtime';

// A runtime only carries a build id when the host stamped one on. Development
// builds of the standalone packager do not, and rejecting those would make it
// refuse the scaffolding it just built.
const verifyBuildId = (expectedBuildId, source) => (source.endsWith('=^..^=') ?
  source.endsWith(`${expectedBuildId} =^..^=`) : true);

export {buildId, verifyBuildId};
