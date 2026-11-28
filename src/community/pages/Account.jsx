import React, {useCallback, useEffect, useState} from 'react';
import {Navigate, useLocation, useParams} from 'react-router-dom';
import rotur from '../rotur.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import RouteLoading from '../components/RouteLoading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';

import Profile from './Profile.jsx';
import Org from './Org.jsx';

const accountKind = profile => (profile && profile.account_type === 'org' ? 'org' : 'person');

const kindAfterError = error => (error && error.status === 404 ? 'person' : 'unknown');

const Account = () => {
    const {name} = useParams();
    const {text: communityText} = useCommunityText();
    const [resolved, setResolved] = useState({name: '', kind: ''});
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        rotur.profile(name, {includePosts: true}).then(
            profile => active && setResolved({name, kind: accountKind(profile)}),
            error => active && setResolved({name, kind: kindAfterError(error)})
        );
        return () => {
            active = false;
        };
    }, [name, attempt]);
    const retry = useCallback(() => {
        setResolved({name: '', kind: ''});
        setAttempt(value => value + 1);
    }, []);
    if (resolved.name !== name) return <RouteLoading />;
    if (resolved.kind === 'unknown') {
        return (
            <main>
                <StatusMessage
                    error
                    onRetry={retry}
                >
                    {communityText('Could not load this profile.')}
                </StatusMessage>
            </main>
        );
    }
    return resolved.kind === 'org' ? <Org name={name} /> : <Profile />;
};

const OrgRedirect = () => {
    const {name} = useParams();
    const {search, hash} = useLocation();
    return <Navigate to={`/users/${encodeURIComponent(name)}${search}${hash}`} replace />;
};

export {accountKind, kindAfterError, OrgRedirect};
export default Account;
