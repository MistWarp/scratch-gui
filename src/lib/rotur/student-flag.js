const STUDENT_SESSION_KEY = 'mw:classroom-student';

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

const isStudentSession = () => readStudentFlag();

export {
    readStudentFlag,
    writeStudentFlag,
    isStudentSession
};
