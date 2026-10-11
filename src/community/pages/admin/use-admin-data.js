import {useCallback, useEffect, useState} from 'react';
import api from '../../api';
import useLatest from '../../use-latest.js';

// The moderation queue and access lists the admin page shows: open reports, the open
// error count, bans and admins. Reloads when the error log changes.
const useAdminData = user => {
    const [reports, setReports] = useState(null);
    const [openErrors, setOpenErrors] = useState(0);
    const [bans, setBans] = useState([]);
    const [shadowBans, setShadowBans] = useState({users: [], projects: []});
    const [admins, setAdmins] = useState([]);
    const [error, setError] = useState('');
    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        api.admin.reports()
            .then(fresh(data => setReports((data.reports || []).filter(report => !report.resolved))))
            .catch(fresh(e => setError(e.message || 'Could not load reports.')));
        api.admin.siteErrors('open')
            .then(fresh(data => setOpenErrors(Number(data.openCount || 0))))
            .catch(() => {});
        api.admin.bans()
            .then(fresh(data => setBans(data.bans || [])))
            .catch(() => {});
        api.admin.shadowBans()
            .then(fresh(data => setShadowBans({users: data.users || [], projects: data.projects || []})))
            .catch(() => {});
        api.admin.admins()
            .then(fresh(data => setAdmins(data.admins || [])))
            .catch(() => {});
    }, [beginLoad]);

    useEffect(() => {
        if (user && user.isAdmin) load();
    }, [user, load]);

    useEffect(() => {
        window.addEventListener('mw:errors-updated', load);
        return () => window.removeEventListener('mw:errors-updated', load);
    }, [load]);

    return {reports, openErrors, bans, shadowBans, admins, error, setError, load};
};

export default useAdminData;
