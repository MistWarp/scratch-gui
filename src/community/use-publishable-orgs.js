import {useCallback, useEffect, useState} from 'react';
import api from './api';

const publishableOrgs = data => (Array.isArray(data && data.orgs) ? data.orgs : [])
    .filter(org => org && org.canPublish && typeof org.username === 'string' && org.username);

const orgLabel = org => (org.displayName ? `${org.displayName} (@${org.username})` : `@${org.username}`);

const sameName = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

const ownerOptions = ({selfLabel, orgs, current}) => {
    const choices = [{value: '', label: selfLabel}];
    for (const org of orgs) {
        choices.push({value: org.username, label: orgLabel(org)});
    }
    if (current && !choices.some(choice => sameName(choice.value, current))) {
        choices.push({value: current, label: `@${current}`});
    }
    return choices;
};

const usePublishableOrgs = username => {
    const [state, setState] = useState({username: '', orgs: [], loaded: false, failed: false});
    const [attempt, setAttempt] = useState(0);
    const retry = useCallback(() => setAttempt(value => value + 1), []);
    useEffect(() => {
        if (!username) {
            setState({username: '', orgs: [], loaded: true, failed: false});
            return () => {};
        }
        let active = true;
        setState({username, orgs: [], loaded: false, failed: false});
        api.myOrgs()
            .then(data => active && setState({username, orgs: publishableOrgs(data), loaded: true, failed: false}))
            .catch(() => active && setState({username, orgs: [], loaded: true, failed: true}));
        return () => {
            active = false;
        };
    }, [username, attempt]);
    const current = state.username === (username || '') ? state : {username, orgs: [], loaded: false, failed: false};
    return {...current, retry};
};

export {orgLabel, ownerOptions, publishableOrgs, sameName};
export default usePublishableOrgs;
