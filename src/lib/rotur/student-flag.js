import {sharedCredentials} from '../account/shared-credentials.js';
import {isSplitEditor} from '../account/origins.js';

const STUDENT_SESSION_KEY = 'mw:classroom-student';
const STUDENT_HINT_PARAM = 'classroom';

let studentFrame = false;
let hintChecked = false;

const adoptStudentHint = () => {
    hintChecked = true;
    if (typeof location === 'undefined' || !isSplitEditor()) return;
    try {
        if (new URLSearchParams(location.search).get(STUDENT_HINT_PARAM) === 'student') {
            sharedCredentials.setItem(STUDENT_SESSION_KEY, '1');
        }
    } catch (_) {
        return;
    }
};

const readStudentFlag = () => {
    if (!hintChecked) adoptStudentHint();
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
    writeStudentFlag(active);
};

const markStudentFrame = () => {
    studentFrame = true;
};

const isStudentSession = () => studentFrame || readStudentFlag();

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
