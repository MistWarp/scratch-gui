const STUDENT_SESSION_KEY = 'mw:classroom-student';

let studentFrame = false;

const readStudentFlag = () => {
    try {
        return localStorage.getItem(STUDENT_SESSION_KEY) === '1';
    } catch (_) {
        return false;
    }
};

const writeStudentFlag = active => {
    try {
        if (active) localStorage.setItem(STUDENT_SESSION_KEY, '1');
        else localStorage.removeItem(STUDENT_SESSION_KEY);
    } catch (_) {
        return;
    }
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
    readStudentFlag,
    writeStudentFlag,
    markStudentFrame,
    isStudentSession,
    isClassroomUsername,
    canStudentSessionLoadUrl
};
