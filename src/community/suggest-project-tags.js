const decodeBase64Bytes = value => {
    const binary = atob(value || '');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
};
const decodeBase64Text = value => new TextDecoder().decode(decodeBase64Bytes(value));

const minifyFractch = source => {
    const output = [];
    let quote = '';
    let escaped = false;
    let lineComment = false;
    let blockComment = false;
    let pendingSpace = false;
    for (let index = 0; index < source.length; index++) {
        const character = source[index];
        const next = source[index + 1];
        if (lineComment) {
            if (character === '\n') {
                lineComment = false;
                pendingSpace = true;
            }
            continue;
        }
        if (blockComment) {
            if (character === '*' && next === '/') {
                blockComment = false;
                pendingSpace = true;
                index++;
            }
            continue;
        }
        if (quote) {
            output.push(character);
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === quote) quote = '';
            continue;
        }
        if (character === '/' && next === '/') {
            lineComment = true;
            index++;
            continue;
        }
        if (character === '/' && next === '*') {
            blockComment = true;
            index++;
            continue;
        }
        if (/\s/.test(character)) {
            pendingSpace = output.length > 0;
            continue;
        }
        if (pendingSpace && output[output.length - 1] !== ' ') output.push(' ');
        pendingSpace = false;
        output.push(character);
        if (character === '"' || character === "'") quote = character;
    }
    return output.join('').trim();
};

const isFractchSource = file => {
    const segments = String(file?.path || '').split('/');
    return file?.binary !== true && /\.fractch$/i.test(segments[segments.length - 1]) &&
        !segments.some(segment => segment.toLowerCase() === 'assets');
};

const loadLatestFractchSource = async (apiClient, project) => {
    if (!project?.id || !project?.gitHead) {
        throw new Error('Save a commit before suggesting tags.');
    }
    const [tree, history] = await Promise.all([
        apiClient.commitTree(project.id, project.gitHead),
        apiClient.commits(project.id)
    ]);
    let files = (tree.files || []).filter(isFractchSource).sort((left, right) => (
        left.path.localeCompare(right.path)
    ));
    let contents;
    if (files.length) {
        contents = await Promise.all(files.map(file => (
            apiClient.commitFile(project.id, project.gitHead, file.path)
                .then(result => decodeBase64Text(result.content))
        )));
    } else {
        const legacy = (tree.files || []).find(file => file.path === 'project.sb3');
        if (!legacy) throw new Error('The latest commit has no project source.');
        const snapshot = await apiClient.commitFile(project.id, project.gitHead, legacy.path);
        const {normalizeLegacySb3Snapshot} = await import('../lib/git/mwp.js');
        const converted = await normalizeLegacySb3Snapshot(decodeBase64Bytes(snapshot.content));
        files = converted.filter(isFractchSource).sort((left, right) => left.path.localeCompare(right.path));
        if (!files.length) throw new Error('The latest commit could not be converted to Fractch.');
        contents = files.map(file => new TextDecoder().decode(file.data));
    }
    const commit = (history.commits || []).find(entry => entry.sha === project.gitHead) || {};
    return {
        source: files.map((file, index) => `// File: ${file.path}\n${minifyFractch(contents[index])}`).join('\n'),
        commitName: (commit.message || 'Untitled commit').split('\n')[0],
        commitSha: project.gitHead
    };
};

export {decodeBase64Bytes, decodeBase64Text, isFractchSource, loadLatestFractchSource, minifyFractch};
