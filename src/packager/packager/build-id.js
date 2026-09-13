// Set once by the GUI build and shared with every emitted packager runtime.
import {buildId} from 'virtual:packager-runtime';
const verifyBuildId = (expectedBuildId, source) => source.endsWith(`${expectedBuildId} =^..^=`);
export {buildId, verifyBuildId};
