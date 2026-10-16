import {
    hasFullGrant, commitGrant, grantedScopesFor, callRotur,
    activityAllowed, rememberActivityDecision
} from '../rotur/extension-bridge.js';
import {authorizeProjectCall, grantsSilently, validateProjectScopes} from '../rotur/project-methods.js';
import {getRoturSettings, setRoturSetting} from '../rotur/settings.js';
import {blockProjectPrompts, isProjectPromptBlocked} from '../project-prompt-blocking.js';
import ProjectActivityScope from '../rotur/project-activity-scope.js';

const projectMeta = project => (project.id ? {name: project.name, projectId: project.id} : {name: project.name});
const promptDetails = project => ({id: project.id || '', name: project.name});
const activityKey = project => project.id || `name:${project.name}`;

const createProjectRotur = ({prompt, getUsername, call = callRotur}) => {
    let queue = Promise.resolve();
    const scopes = new Map();

    const ask = (project, type, data) => {
        const run = queue.then(async () => {
            if (isProjectPromptBlocked(promptDetails(project))) return false;
            const answer = await prompt(type, {...data, username: getUsername(), name: project.name});
            if (answer === 'block') {
                blockProjectPrompts(promptDetails(project));
                return false;
            }
            return answer;
        });
        queue = run.catch(() => null);
        return run;
    };

    const scopeFor = project => {
        const key = activityKey(project);
        if (!scopes.has(key)) scopes.set(key, new ProjectActivityScope(call));
        return scopes.get(key);
    };

    const ensureActivitySharing = async project => {
        const key = activityKey(project);
        const decision = activityAllowed(getRoturSettings().activitySharing, key);
        if (decision !== null) return decision;
        const choice = await ask(project, 'share', {});
        if (choice === 'all') {
            setRoturSetting('activitySharing', 'all');
            return true;
        }
        rememberActivityDecision(key, choice === 'this');
        return choice === 'this';
    };

    const ensureConsent = async (project, requested) => {
        const valid = validateProjectScopes(requested);
        if (!valid) throw new Error('Projects cannot ask for that Rotur permission');
        if (!getUsername()) throw new Error('Log in to Rotur to let this project connect');
        const meta = projectMeta(project);
        if (hasFullGrant(meta, valid)) return true;
        if (!grantsSilently(valid) && await ask(project, 'consent', {scopes: valid}) !== true) return false;
        await commitGrant(meta, valid);
        return true;
    };

    const callProject = async (project, method, args) => {
        if (!getUsername()) throw new Error('Log in to Rotur to use this block');
        const authorized = authorizeProjectCall(method, args, grantedScopesFor(projectMeta(project)),
            project.id || 'mistwarp');
        if (authorized.spec.activity && !(await ensureActivitySharing(project))) return '';
        if (authorized.confirm) {
            const confirmed = await ask(project, 'confirm', {
                label: authorized.confirm.label,
                confirmation: authorized.confirm.confirmation || null
            });
            if (confirmed !== true) throw new Error('You cancelled this Rotur action');
        }
        return scopeFor(project).call(method, authorized.args);
    };

    const clear = async project => {
        const key = activityKey(project);
        const scope = scopes.get(key);
        scopes.delete(key);
        if (scope) await scope.clear();
        return true;
    };

    return {ensureConsent, call: callProject, clear};
};

export {createProjectRotur};
