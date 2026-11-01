/* eslint-disable max-len */
import {request} from '../../lib/community/api.js';

export default {
    overview: () => request('/classroom', {cache: false}),
    createClass: ({name, loginMode}) => request('/classroom/classes', {method: 'POST', body: {name, loginMode}}),
    class: id => request(`/classroom/classes/${encodeURIComponent(id)}`, {cache: false}),
    updateClass: (id, patch) => request(`/classroom/classes/${encodeURIComponent(id)}`, {method: 'PUT', body: patch}),
    deleteClass: id => request(`/classroom/classes/${encodeURIComponent(id)}`, {method: 'DELETE'}),
    resetCode: id => request(`/classroom/classes/${encodeURIComponent(id)}/code`, {method: 'POST'}),
    addTeacher: (id, username) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/teachers`, {method: 'POST', body: {username}}),
    removeTeacher: (id, teacherUserId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/teachers/${encodeURIComponent(teacherUserId)}`, {method: 'DELETE'}),
    transferClass: (id, username, keepAsCoTeacher) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/transfer`, {method: 'POST', body: {username, keepAsCoTeacher}}),
    addStudents: (id, names) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students`, {method: 'POST', body: {names}}),
    student: (id, studentId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students/${encodeURIComponent(studentId)}`, {cache: false}),
    updateStudent: (id, studentId, patch) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students/${encodeURIComponent(studentId)}`, {method: 'PUT', body: patch}),
    resetStudent: (id, studentId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students/${encodeURIComponent(studentId)}/reset`, {method: 'POST'}),
    moveStudent: (id, studentId, classId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students/${encodeURIComponent(studentId)}/move`, {method: 'POST', body: {classId}}),
    deleteStudent: (id, studentId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students/${encodeURIComponent(studentId)}`, {method: 'DELETE'}),
    createAssignment: (id, assignment) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/assignments`, {method: 'POST', body: assignment}),
    assignment: (id, assignmentId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/assignments/${encodeURIComponent(assignmentId)}`, {cache: false}),
    updateAssignment: (id, assignmentId, patch) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/assignments/${encodeURIComponent(assignmentId)}`, {method: 'PUT', body: patch}),
    deleteAssignment: (id, assignmentId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/assignments/${encodeURIComponent(assignmentId)}`, {method: 'DELETE'}),
    reviewSubmission: (id, assignmentId, studentId, review) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(studentId)}`, {method: 'PUT', body: review}),
    audit: id => request(`/classroom/classes/${encodeURIComponent(id)}/audit`, {cache: false}),
    join: code => request(`/classroom/join/${encodeURIComponent(code)}`, {cache: false}),
    login: body => request('/classroom/login', {method: 'POST', body}),
    startAssignment: assignmentId =>
        request(`/classroom/assignments/${encodeURIComponent(assignmentId)}/start`, {method: 'POST'}),
    turnIn: assignmentId =>
        request(`/classroom/assignments/${encodeURIComponent(assignmentId)}/turn-in`, {method: 'POST'}),
    unsubmit: assignmentId =>
        request(`/classroom/assignments/${encodeURIComponent(assignmentId)}/unsubmit`, {method: 'POST'}),
    billingCheckout: (seatPacks, interval) =>
        request('/classroom/billing/checkout', {method: 'POST', body: {seatPacks, interval}}),
    billingPortal: () => request('/classroom/billing/portal', {method: 'POST'}),
    startTrial: () => request('/classroom/trial', {method: 'POST'}),
    acceptTerms: body => request('/classroom/terms/accept', {method: 'POST', body}),
    exportClass: id => request(`/classroom/classes/${encodeURIComponent(id)}/export`, {cache: false}),
    exportStudent: (id, studentId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students/${encodeURIComponent(studentId)}/export`, {cache: false}),
    groups: id => request(`/classroom/classes/${encodeURIComponent(id)}/groups`, {cache: false}),
    createGroup: (id, group) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/groups`, {method: 'POST', body: group}),
    deleteGroup: (id, groupId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/groups/${encodeURIComponent(groupId)}`, {method: 'DELETE'}),
    releaseStudent: (id, studentId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students/${encodeURIComponent(studentId)}/release`, {method: 'POST'}),
    cancelRelease: (id, studentId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/students/${encodeURIComponent(studentId)}/release`, {method: 'DELETE'}),
    claim: code => request(`/classroom/claim/${encodeURIComponent(code)}`, {cache: false}),
    redeemClaim: code => request(`/classroom/claim/${encodeURIComponent(code)}`, {method: 'POST'}),
    school: () => request('/classroom/school', {cache: false}),
    addSchoolTeacher: username => request('/classroom/school/teachers', {method: 'POST', body: {username}}),
    removeSchoolTeacher: userId =>
        request(`/classroom/school/teachers/${encodeURIComponent(userId)}`, {method: 'DELETE'}),
    setSchoolAdmin: (userId, admin) =>
        request(`/classroom/school/teachers/${encodeURIComponent(userId)}/admin`, {method: 'PUT', body: {admin}}),
    schoolAudit: (limit = 50) => request(`/classroom/school/audit?limit=${limit}`, {cache: false}),
    schoolExport: () => request('/classroom/school/export', {raw: true, cache: false}),
    present: (id, projectId) =>
        request(`/classroom/classes/${encodeURIComponent(id)}/present`, {method: 'POST', body: {projectId}}),
    stopPresenting: id => request(`/classroom/classes/${encodeURIComponent(id)}/present`, {method: 'DELETE'})
};
