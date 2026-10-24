import {sharedCredentials} from '../account/shared-credentials.js';
import {isSplitEditor} from '../account/origins.js';

const STUDENT_SESSION_KEY = 'mw:classroom-student';
const STUDENT_HINT_PARAM = 'classroom';

let studentFrame = false;
let hintChecked = false;
let hintStudent = false;
let bridgeStudent = null;

const takeStudentHint = () => {
    hintChecked = true;
    if (typeof location === 'undefined' || !isSplitEditor()) return;
    try {
        const url = new URL(location.href);
        if (!url.searchParams.has(STUDENT_HINT_PARAM)) return;
        hintStudent = url.searchParams.get(STUDENT_HINT_PARAM) === 'student';
        url.searchParams.delete(STUDENT_HINT_PARAM);
        history.replaceState(history.state, '', url.toString());
    } catch (_) {
        return;
    }
};

const readStudentFlag = () => {
    try {
        return sharedCredentials.getItem(STUDENT_SESSION_KEY) === '1';
    } catch (_) {
        return false;
    }
};

const writeStudentFlag = active => {
    try {
        if (active) sharedCredentials.setItem(STUDENT_SESSION_KEY, '1');
        else sharedCredentials.removeItem(STUDENT_SESSION_KEY);
    } catch (_) {
        return;
    }
};

const setSplitStudent = active => {
    if (!isSplitEditor()) return;
    bridgeStudent = Boolean(active);
    writeStudentFlag(bridgeStudent);
};

const markStudentFrame = () => {
    studentFrame = true;
};

const isStudentSession = () => {
    if (studentFrame) return true;
    if (!isSplitEditor()) return readStudentFlag();
    if (!hintChecked) takeStudentHint();
    if (bridgeStudent !== null) return bridgeStudent;
    return hintStudent || readStudentFlag();
};

const isClassroomUsername = username => typeof username === 'string' && username.includes('~');

const isDeviceOrSameOriginUrl = url => {
    try {
        const parsed = new URL(url, location.href);
        return ['data:', 'blob:'].includes(parsed.protocol) || parsed.origin === location.origin;
    } catch (_) {
        return false;
    }
};

const canStudentSessionLoadUrl = url => !isStudentSession() || isDeviceOrSameOriginUrl(url);

export {
    STUDENT_HINT_PARAM,
    STUDENT_SESSION_KEY,
    readStudentFlag,
    writeStudentFlag,
    setSplitStudent,
    markStudentFrame,
    isStudentSession,
    isClassroomUsername,
    canStudentSessionLoadUrl
};
