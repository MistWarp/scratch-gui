import {useEffect, useState} from 'react';
import api from './api';

const publishableOrgs = data => (Array.isArray(data && data.orgs) ? data.orgs : [])
    .filter(org => org && org.canPublish && typeof org.username === 'string' && org.username);

const sameName = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

const ownerOptions = ({selfLabel, orgs, current}) => {
    const choices = [{value: '', label: selfLabel}];
    for (const org of orgs) {
        const label = org.displayName ? `${org.displayName} (@${org.username})` : `@${org.username}`;
        choices.push({value: org.username, label});
    }
    if (current && !choices.some(choice => sameName(choice.value, current))) {
        choices.push({value: current, label: `@${current}`});
    }
    return choices;
};

const usePublishableOrgs = username => {
    const [state, setState] = useState({username: '', orgs: [], loaded: false});
    useEffect(() => {
        if (!username) {
            setState({username: '', orgs: [], loaded: true});
            return () => {};
        }
        let active = true;
        setState({username, orgs: [], loaded: false});
        api.myOrgs()
            .then(data => active && setState({username, orgs: publishableOrgs(data), loaded: true}))
            .catch(() => active && setState({username, orgs: [], loaded: true}));
        return () => {
            active = false;
        };
    }, [username]);
    return state.username === (username || '') ? state : {username, orgs: [], loaded: false};
};

export {ownerOptions, publishableOrgs};
export default usePublishableOrgs;
