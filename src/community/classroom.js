import {
    Apple, Bird, Car, Cat, Dog, Fish, Moon, Rabbit, Rocket, Sailboat, Snail, Squirrel, Star, Sun, TreePine, Turtle
} from 'lucide-react';
import {getCommunityLocale} from './locale';

const JOIN_ORIGIN = 'https://mistwarp.org';

const PICTURE_ICONS = {
    cat: Cat,
    dog: Dog,
    fish: Fish,
    bird: Bird,
    rabbit: Rabbit,
    turtle: Turtle,
    squirrel: Squirrel,
    snail: Snail,
    star: Star,
    moon: Moon,
    sun: Sun,
    tree: TreePine,
    apple: Apple,
    rocket: Rocket,
    boat: Sailboat,
    car: Car
};

const PICTURE_LABELS = {
    cat: {label: 'Cat'},
    dog: {label: 'Dog'},
    fish: {label: 'Fish'},
    bird: {label: 'Bird'},
    rabbit: {label: 'Rabbit'},
    turtle: {label: 'Turtle'},
    squirrel: {label: 'Squirrel'},
    snail: {label: 'Snail'},
    star: {label: 'Star'},
    moon: {label: 'Moon'},
    sun: {label: 'Sun'},
    tree: {label: 'Tree'},
    apple: {label: 'Apple'},
    rocket: {label: 'Rocket'},
    boat: {label: 'Boat'},
    car: {label: 'Car'}
};

const pictureLabel = name => (PICTURE_LABELS[name] ? PICTURE_LABELS[name].label : String(name || ''));

const PICTURE_COUNT = 3;

const SUBMISSION_STATES = ['not_started', 'started', 'turned_in', 'late', 'returned'];

const SUBMISSION_LABELS = {
    not_started: {label: 'Not started'},
    started: {label: 'In progress'},
    turned_in: {label: 'Turned in'},
    late: {label: 'Turned in late'},
    returned: {label: 'Returned'}
};

const submissionLabel = state => (SUBMISSION_LABELS[state] || SUBMISSION_LABELS.not_started).label;

const submissionState = submission => {
    if (!submission || !submission.state) return 'not_started';
    if (submission.state === 'turned_in' && submission.late) return 'late';
    return SUBMISSION_STATES.includes(submission.state) ? submission.state : 'not_started';
};

const normalizeClassCode = value => String(value || '')
    .toUpperCase()
    .replace(/[\s-]+/g, '')
    .replace(/[^A-Z0-9]/g, '');

const aboutUrl = () => `${JOIN_ORIGIN}/classroom/about`;

const joinUrl = code => `${JOIN_ORIGIN}/classroom/join/${normalizeClassCode(code)}`;

const parseStudentNames = value => {
    const seen = new Set();
    return String(value || '')
        .split(/\r?\n/)
        .map(line => line.trim().replace(/\s+/g, ' ').slice(0, 40))
        .filter(name => {
            if (!name) return false;
            const key = name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

const freeSeats = (plan, usage) => Math.max(0, Number((plan && plan.seats) || 0) - Number((usage && usage.seats) || 0));

const percentOf = (used, total) => {
    const limit = Number(total) || 0;
    if (limit <= 0) return 0;
    return Math.min(100, Math.max(0, (Number(used) || 0) / limit * 100));
};

const isOverdue = (dueAt, now = Date.now()) => Number(dueAt) > 0 && Number(dueAt) < now;

const toLocalInputs = ms => {
    const value = Number(ms);
    if (!Number.isFinite(value) || value <= 0) return {date: '', time: ''};
    const date = new Date(value);
    const pad = n => String(n).padStart(2, '0');
    return {
        date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
    };
};

const fromLocalInputs = (date, time) => {
    if (!date) return 0;
    const parsed = new Date(`${date}T${time || '23:59'}`).getTime();
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const relativeTime = (ms, now = Date.now()) => {
    const value = Number(ms);
    if (!Number.isFinite(value) || value <= 0) return '';
    const seconds = Math.round((value - now) / 1000);
    const abs = Math.abs(seconds);
    const [size, unit] = abs < 60 ? [1, 'second'] :
        abs < 3600 ? [60, 'minute'] :
            abs < 86400 ? [3600, 'hour'] :
                abs < 2592000 ? [86400, 'day'] :
                    abs < 31536000 ? [2592000, 'month'] : [31536000, 'year'];
    const amount = Math.trunc(seconds / size);
    if (typeof Intl.RelativeTimeFormat !== 'function') return `${Math.abs(amount)} ${unit}`;
    return new Intl.RelativeTimeFormat(getCommunityLocale(), {numeric: 'auto'}).format(amount, unit);
};

const initials = name => String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');

const initialsAvatar = name => {
    const label = initials(name) || '?';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#855cd6"/><text x="32" y="40" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${label}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const AUDIT_SENTENCES = {
    class_created: {label: '{actor} created the class.'},
    class_updated: {label: '{actor} updated the class settings.'},
    class_archived: {label: '{actor} archived the class.'},
    class_unarchived: {label: '{actor} unarchived the class.'},
    code_reset: {label: '{actor} reset the class code.'},
    students_created: {label: '{actor} added {count, plural, one {# student} other {# students}}.'},
    student_updated: {label: '{actor} updated {student}.'},
    student_disabled: {label: '{actor} disabled {student}.'},
    student_enabled: {label: '{actor} enabled {student}.'},
    student_unlocked: {label: '{actor} unlocked {student}.'},
    student_renamed: {label: '{actor} renamed {student}.'},
    student_reset: {label: '{actor} reset the sign-in for {student}.'},
    student_moved: {label: '{actor} moved {student} to another class.'},
    student_deleted: {label: '{actor} deleted {student}.'},
    assignment_created: {label: '{actor} created the assignment {title}.'},
    assignment_updated: {label: '{actor} updated the assignment {title}.'},
    assignment_deleted: {label: '{actor} deleted the assignment {title}.'},
    submission_reviewed: {label: '{actor} reviewed the work of {student}.'},
    submission_returned: {label: '{actor} returned the work of {student}.'},
    teacher_added: {label: '{actor} added {username} as a co-teacher.'},
    teacher_removed: {label: '{actor} removed {username} as a co-teacher.'},
    class_transferred: {label: '{actor} transferred the class to {username}.'},
    class_exported: {label: '{actor} downloaded the class data.'},
    student_exported: {label: '{actor} downloaded the data of {student}.'},
    retention_warning: {
        label: 'MistWarp warned that this class will be deleted because no teacher has opened it for 11 months.'
    }
};

const auditKey = event => {
    const detail = (event && event.detail) || {};
    if (event.action === 'student_updated') {
        if (detail.disabled === true) return 'student_disabled';
        if (detail.disabled === false) return 'student_enabled';
        if (detail.unlock) return 'student_unlocked';
        if (detail.displayName) return 'student_renamed';
    }
    if (event.action === 'submission_reviewed' && detail.returned) return 'submission_returned';
    return AUDIT_SENTENCES[event.action] ? event.action : 'class_updated';
};

const auditSentence = (event, {text, studentName, assignmentTitle}) => {
    const detail = (event && event.detail) || {};
    const key = auditKey(event);
    return text(AUDIT_SENTENCES[key].label, {
        actor: event.actor || text('A teacher'),
        count: Number(detail.count) || 0,
        student: studentName(detail.studentId),
        title: detail.title || assignmentTitle(detail.assignmentId),
        username: detail.username || detail.newOwner || detail.teacher || ''
    });
};

export {
    AUDIT_SENTENCES,
    PICTURE_COUNT,
    PICTURE_ICONS,
    PICTURE_LABELS,
    SUBMISSION_LABELS,
    SUBMISSION_STATES,
    aboutUrl,
    auditKey,
    auditSentence,
    freeSeats,
    fromLocalInputs,
    initials,
    initialsAvatar,
    isOverdue,
    joinUrl,
    normalizeClassCode,
    parseStudentNames,
    percentOf,
    pictureLabel,
    relativeTime,
    submissionLabel,
    submissionState,
    toLocalInputs
};
