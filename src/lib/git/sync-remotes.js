import {getDefaultAuthor, getRemotes, push} from './browser-git.js';
import {getAuth as getRoturGitAuth, isRoturGitUrl} from '../rotur/git-api.js';

const TOKEN_KEY = 'mw:git-token';

const readRemoteToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY) || '';
    } catch (e) {
        return '';
    }
};

const authForRemoteUrl = url => {
    if (isRoturGitUrl(url)) return getRoturGitAuth;
    const token = readRemoteToken();
    const author = getDefaultAuthor();
    return () => (author.name ?
        {username: author.name, password: token} :
        {username: token || 'x-access-token', password: token});
};

const syncConfiguredRemotes = async ({vm, onProgress} = {}) => {
    const remotes = await getRemotes(vm);
    return Promise.all(remotes.map(async remote => {
        try {
            await push({
                vm,
                remote: remote.name,
                setUpstream: true,
                onAuth: authForRemoteUrl(remote.url),
                onProgress: progress => {
                    if (typeof onProgress === 'function') {
                        onProgress({...progress, message: `Syncing ${remote.name}`});
                    }
                }
            });
            return {name: remote.name, ok: true};
        } catch (error) {
            return {name: remote.name, ok: false, error: error.message || String(error)};
        }
    }));
};

export {TOKEN_KEY, authForRemoteUrl, readRemoteToken, syncConfiguredRemotes};
