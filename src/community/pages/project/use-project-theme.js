import {useEffect, useState} from 'react';
import {applyThemeVisuals} from '../../../lib/themes/themePersistance';
import rotur from '../../rotur';
import {buildProjectTheme, getProjectThemeMode, restoreUserTheme} from './embed-helpers.js';

// A project can bring its own theme. The viewer's preference decides whether it may:
// for every project, only hearted ones, or only ones by people they follow.
const useProjectTheme = (user, owner) => {
    const [projectThemeApplied, setProjectThemeApplied] = useState(false);
    const [revertTheme, setRevertTheme] = useState(false);
    const [followedOwner, setFollowedOwner] = useState(null);
    const themeMode = getProjectThemeMode();

    useEffect(() => {
        const onMessage = event => {
            if (event.data && event.data.type === 'mw:project-theme-applied') {
                setProjectThemeApplied(true);
                const theme = buildProjectTheme(event.data.theme);
                if (theme) {
                    try {
                        applyThemeVisuals(theme);
                    } catch (e) {
                        // ignore
                    }
                }
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    // Always hand the viewer's own theme back when leaving the project.
    useEffect(() => () => restoreUserTheme(), []);

    useEffect(() => {
        if (themeMode !== 'followed' || !user || !owner) return;
        let active = true;
        const viewerKey = String(user.username).toLowerCase();
        const ownerKey = String(owner).toLowerCase();
        setFollowedOwner(null);
        rotur.following(user.username)
            .then(data => {
                if (!active) return;
                const list = (data.following || []).map(name => String(name).toLowerCase());
                setFollowedOwner({
                    owner: ownerKey,
                    value: list.includes(ownerKey),
                    viewer: viewerKey
                });
            })
            .catch(() => {
                if (active) setFollowedOwner({owner: ownerKey, value: false, viewer: viewerKey});
            });
        return () => {
            active = false;
        };
    }, [themeMode, user, owner]);

    return {
        themeMode,
        projectThemeApplied,
        setProjectThemeApplied,
        revertTheme,
        setRevertTheme,
        followedOwner,
        setFollowedOwner
    };
};

export default useProjectTheme;
