import {sharedCredentials} from '../account/shared-credentials.js';
import {isSplitEditor} from '../account/origins.js';

const STUDENT_SESSION_KEY = 'mw:classroom-student';
const STUDENT_HINT_PARAM = 'classroom';

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
    writeStudentFlag(active);
};

const adoptStudentHint = () => {
    if (typeof location === 'undefined' || !isSplitEditor()) return;
    try {
        if (new URLSearchParams(location.search).get(STUDENT_HINT_PARAM) === 'student') writeStudentFlag(true);
    } catch (_) {
        return;
    }
};

adoptStudentHint();

const isStudentSession = () => readStudentFlag();

export {
    STUDENT_HINT_PARAM,
    STUDENT_SESSION_KEY,
    readStudentFlag,
    writeStudentFlag,
    setSplitStudent,
    isStudentSession
};
