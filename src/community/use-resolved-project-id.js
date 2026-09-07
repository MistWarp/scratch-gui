import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import api, {projectUrl} from './api.js';

/**
 * Resolve the project route params to a concrete project id.
 * Supports both `/project/:id` and `/p/:slug` routes.
 * On vanity routes the `/p/slug` URL is kept as-is; only the id
 * needed for API calls is resolved in the background.
 * @returns {object} resolved route state with projectId, vanitySlug,
 * resolving flag, resolveError message, and isVanity flag.
 */
export const useResolvedProjectId = () => {
    const {id: idParam, slug} = useParams();
    const [resolvedId, setResolvedId] = useState(idParam || '');
    const [resolving, setResolving] = useState(Boolean(slug));
    const [resolveError, setResolveError] = useState('');

    useEffect(() => {
        if (!slug) {
            setResolvedId(idParam || '');
            setResolving(false);
            setResolveError('');
            return () => {};
        }
        let active = true;
        setResolvedId('');
        setResolving(true);
        setResolveError('');
        api.resolveVanity(slug)
            .then(data => {
                if (active) {
                    setResolvedId(data.id);
                    setResolving(false);
                }
            })
            .catch(() => {
                if (active) {
                    setResolveError('This project link does not exist.');
                    setResolving(false);
                }
            });
        return () => {
            active = false;
        };
    }, [idParam, slug]);

    return {
        projectId: resolvedId,
        vanitySlug: slug || '',
        isVanity: Boolean(slug),
        resolving,
        resolveError
    };
};

/**
 * Base project URL that stays on the vanity form while loading.
 * Once the project has loaded, its canonical vanitySlug wins.
 * @returns {string} project URL, preferring the vanity form when known.
 */
export const projectBaseUrl = ({project, projectId, vanitySlug}) => {
    if (project) return projectUrl(project);
    if (vanitySlug) return projectUrl({id: projectId, vanitySlug});
    return projectUrl(projectId);
};
