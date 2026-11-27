import React, {lazy, useEffect, useState} from 'react';
import {Navigate, useParams} from 'react-router-dom';
import rotur from '../rotur.js';
import RouteLoading from '../components/RouteLoading.jsx';

const Profile = lazy(() => import('./Profile.jsx'));
const Org = lazy(() => import('./Org.jsx'));

const accountKind = profile => (profile && profile.account_type === 'org' ? 'org' : 'person');

const Account = () => {
    const {name} = useParams();
    const [resolved, setResolved] = useState({name: '', kind: ''});
    useEffect(() => {
        let active = true;
        rotur.profile(name, {includePosts: true}).then(
            profile => active && setResolved({name, kind: accountKind(profile)}),
            () => active && setResolved({name, kind: 'person'})
        );
        return () => {
            active = false;
        };
    }, [name]);
    if (resolved.name !== name) return <RouteLoading />;
    return resolved.kind === 'org' ? <Org name={name} /> : <Profile />;
};

const OrgRedirect = () => {
    const {name} = useParams();
    return <Navigate to={`/users/${encodeURIComponent(name)}`} replace />;
};

export {accountKind, OrgRedirect};
export default Account;
