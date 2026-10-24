import React, {useEffect, useState} from 'react';
import {Outlet, useLocation} from 'react-router-dom';
import {request} from '../../lib/community/api.js';
import {useClassroomAvailable} from '../classroom-availability.js';
import NotFound from '../pages/NotFound.jsx';
import RouteLoading from './RouteLoading.jsx';

const CODE_PATH = /^\/classroom\/(join|claim)\/([^/]+)\/?$/;

const codeOpens = async (kind, code) => {
    try {
        const response = await request(`/classroom/${kind}/${encodeURIComponent(code)}`, {raw: true, cache: false});
        return Boolean(response) && response.status === 200;
    } catch (e) {
        return false;
    }
};

const useCodeAccess = (pathname, skip) => {
    const match = CODE_PATH.exec(pathname);
    const key = match && !skip ? `${match[1]}:${match[2]}` : '';
    const [result, setResult] = useState({key: '', open: false});
    useEffect(() => {
        if (!key) return;
        let active = true;
        codeOpens(match[1], decodeURIComponent(match[2])).then(open => {
            if (active) setResult({key, open});
        });
        return () => {
            active = false;
        };
    }, [key]);
    if (!key) return {checked: true, open: false};
    return {checked: result.key === key, open: result.key === key && result.open};
};

const ClassroomRoute = () => {
    const {pathname} = useLocation();
    const {checked, available} = useClassroomAvailable();
    const code = useCodeAccess(pathname, !checked || available);
    if (!checked || !code.checked) return <RouteLoading />;
    return available || code.open ? <Outlet /> : <NotFound />;
};

export default ClassroomRoute;
