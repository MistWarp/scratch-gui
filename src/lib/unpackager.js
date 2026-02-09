import JSZip from '@turbowarp/jszip';

const unzipOrNull = async binaryData => {
    try {
        return await JSZip.loadAsync(binaryData);
    } catch (e) {
        return null;
    }
};

const readAsText = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read blob as text'));
    reader.readAsText(blob);
});

const matchAll = (string, regex) => {
    const result = [];
    let match = null;
    while ((match = regex.exec(string)) !== null) {
        result.push(match);
    }
    return result;
};

const getContainingFolder = name => {
    const parts = name.split('/');
    parts.pop();
    return parts.join('/');
};

const identifyProjectJSONType = data => {
    if ('targets' in data) {
        return 'sb3';
    } else if ('objName' in data) {
        return 'sb2';
    }
    throw new Error('Can not determine project.json type');
};

const decodeBase85WithLengthHeader = str => {
    const decode1 = str => {
        const getValue = code => {
            if (code === 0x7e) {
                return 0x5c - 0x29;
            }
            return code - 0x29;
        };
        const toMultipleOfFour = n => {
            if (n % 4 === 0) {
                return n;
            }
            return n + (4 - n % 4);
        };
        const stringToBytes = str => new TextEncoder().encode(str);
        const lengthEndsAt = str.indexOf(',');
        const byteLength = +str.substring(0, lengthEndsAt);
        const resultBuffer = new ArrayBuffer(toMultipleOfFour(byteLength));
        const resultView = new DataView(resultBuffer);
        const stringBytes = stringToBytes(str);
        for (let i = lengthEndsAt + 1, j = 0; i < str.length; i += 5, j += 4) {
            resultView.setUint32(j, (
                (getValue(stringBytes[i + 4]) * 85 * 85 * 85 * 85) +
                (getValue(stringBytes[i + 3]) * 85 * 85 * 85) +
                (getValue(stringBytes[i + 2]) * 85 * 85) +
                (getValue(stringBytes[i + 1]) * 85) +
                getValue(stringBytes[i])
            ), true);
        }
        return new Uint8Array(resultBuffer, 0, byteLength);
    };

    const decode2 = str => {
        const getValue = code => {
            if (code === 0x28) code = 0x3c;
            if (code === 0x29) code = 0x3e;
            return code - 0x2a;
        };
        const toMultipleOfFour = n => {
            if (n % 4 === 0) {
                return n;
            }
            return n + (4 - n % 4);
        };
        const stringToBytes = str => new TextEncoder().encode(str);
        const lengthEndsAt = str.indexOf(',');
        const byteLength = +str.substring(0, lengthEndsAt);
        const resultBuffer = new ArrayBuffer(toMultipleOfFour(byteLength));
        const resultView = new DataView(resultBuffer);
        const stringBytes = stringToBytes(str);
        for (let i = lengthEndsAt + 1, j = 0; i < str.length; i += 5, j += 4) {
            resultView.setUint32(j, (
                (getValue(stringBytes[i + 4]) * 85 * 85 * 85 * 85) +
                (getValue(stringBytes[i + 3]) * 85 * 85 * 85) +
                (getValue(stringBytes[i + 2]) * 85 * 85) +
                (getValue(stringBytes[i + 1]) * 85) +
                getValue(stringBytes[i])
            ), true);
        }
        return new Uint8Array(resultBuffer, 0, byteLength);
    };

    const decode3 = str => {
        const getValue = code => {
            if (code === 0x28) code = 0x3c;
            if (code === 0x29) code = 0x3e;
            return code - 0x2a;
        };
        const toMultipleOfFour = n => {
            if (n % 4 === 0) {
                return n;
            }
            return n + (4 - n % 4);
        };
        const lengthEndsAt = str.indexOf(',');
        const byteLength = +str
            .substring(0, lengthEndsAt)
            .split('')
            .map(i => String.fromCharCode(i.charCodeAt(0) - 49))
            .join('');
        const resultBuffer = new ArrayBuffer(toMultipleOfFour(byteLength));
        const resultView = new DataView(resultBuffer);
        for (let i = lengthEndsAt + 1, j = 0; i < str.length; i += 5, j += 4) {
            resultView.setUint32(j, (
                (getValue(str.charCodeAt(i + 4)) * 85 * 85 * 85 * 85) +
                (getValue(str.charCodeAt(i + 3)) * 85 * 85 * 85) +
                (getValue(str.charCodeAt(i + 2)) * 85 * 85) +
                (getValue(str.charCodeAt(i + 1)) * 85) +
                getValue(str.charCodeAt(i))
            ), true);
        }
        return new Uint8Array(resultBuffer, 0, byteLength);
    };

    const header = str.substring(0, str.indexOf(','));
    if (/^\d+$/.test(header)) {
        if (str.includes('\\')) {
            return decode2(str);
        }
        return decode1(str);
    }
    return decode3(str);
};

const decodeBase85WithoutLengthHeader = (str, length) => {
    const getBase85DecodeValue = code => {
        if (code === 0x28) code = 0x3c;
        if (code === 0x29) code = 0x3e;
        return code - 0x2a;
    };

    const buffer = new ArrayBuffer(Math.ceil(length / 4) * 4);
    const view = new DataView(buffer, 0, Math.floor(str.length / 5 * 4));
    for (let i = 0, j = 0; i < str.length; i += 5, j += 4) {
        view.setUint32(j, (
            (getBase85DecodeValue(str.charCodeAt(i + 4)) * 85 * 85 * 85 * 85) +
            (getBase85DecodeValue(str.charCodeAt(i + 3)) * 85 * 85 * 85) +
            (getBase85DecodeValue(str.charCodeAt(i + 2)) * 85 * 85) +
            (getBase85DecodeValue(str.charCodeAt(i + 1)) * 85) +
            getBase85DecodeValue(str.charCodeAt(i))
        ), true);
    }
    return new Uint8Array(buffer, 0, length);
};

const decodeBase64 = str => {
    const decoded = atob(str);
    const result = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
        result[i] = decoded.charCodeAt(i);
    }
    return result;
};

const decodeDataURI = uri => {
    const parts = uri.split(';base64,');
    if (parts.length < 2) {
        throw new Error('Data URI is not base64');
    }
    const base64 = parts[1];
    return decodeBase64(base64);
};

const findFileInZip = (zip, path) => {
    const f = zip.file(path);
    if (f) {
        return f;
    }
    for (const filename of Object.keys(zip.files)) {
        if (filename.endsWith(`/${path}`)) {
            return zip.file(filename);
        }
    }
    return null;
};

const unpackageBinaryBlob = async data => {
    const projectZip = await unzipOrNull(data);

    if (projectZip) {
        const projectJSON = findFileInZip(projectZip, 'project.json');
        const projectJSONData = JSON.parse(await projectJSON.async('text'));
        const type = identifyProjectJSONType(projectJSONData);
        return {
            type,
            data
        };
    }

    return {
        type: 'sb',
        data
    };
};

const zipToArrayBuffer = zip => {
    for (const file of Object.values(zip.files)) {
        file.date = new Date(1662869887000);
    }
    return zip.generateAsync({
        type: 'arraybuffer',
        compression: 'DEFLATE'
    });
};

const unpackage = async blob => {
    const packagedZip = await unzipOrNull(blob);

    if (packagedZip) {
        const projectJSON = findFileInZip(packagedZip, 'project.json');
        if (projectJSON) {
            const innerFolderPath = getContainingFolder(projectJSON.name);
            const innerZip = packagedZip.folder(innerFolderPath);

            let sb3Assets = 0;
            let sb2Assets = 0;

            for (const path of Object.keys(innerZip.files)) {
                if (path === 'project.json') {
                    // do nothing
                } else if (/^[a-f0-9]{32}\.[a-z0-9]{3}$/i.test(path)) {
                    sb3Assets++;
                } else if (/^[0-9]+\.[a-z0-9]{3}$/i.test(path)) {
                    sb2Assets++;
                } else {
                    innerZip.remove(path);
                }
            }

            const type = sb2Assets > 0 && sb3Assets === 0 ? 'sb2' : 'sb3';

            return {
                type,
                data: await zipToArrayBuffer(innerZip)
            };
        }

        const projectBinary = (
            findFileInZip(packagedZip, 'project.zip') ||
      findFileInZip(packagedZip, 'project')
        );
        if (projectBinary) {
            const projectData = await projectBinary.async('arraybuffer');
            return unpackageBinaryBlob(projectData);
        }

        throw new Error('Input was a zip but we could not find a project.');
    }

    const text = await readAsText(blob);

    let base85Matches = matchAll(text, /<script data="([^"]+)">decodeChunk\((\d+)\)<\/script>/g);
    if (base85Matches.length) {
        const base85 = base85Matches.map(i => i[1]).join('');
        const length = base85Matches.map(i => +i[2]).reduce((a, b) => a + b, 0);
        return unpackageBinaryBlob(decodeBase85WithoutLengthHeader(base85, length));
    }

    base85Matches = matchAll(text, /<script type="p4-project">([^<]+)<\/script>/g);
    if (base85Matches.length) {
        const base85 = base85Matches.map(i => i[1]).join('');
        return unpackageBinaryBlob(decodeBase85WithLengthHeader(base85));
    }

    const base85Match = (
        text.match(/const result = base85decode\("(.+)"\);/) ||
    text.match(/<script id="p4-encoded-project-data" type="p4-encoded-project-data">([^<]+)<\/script>/)
    );
    if (base85Match) {
        const base85 = base85Match[1];
        return unpackageBinaryBlob(decodeBase85WithLengthHeader(base85));
    }

    const dataURIMatch = (
        text.match(/const getProjectData = \(\) => fetch\("([a-zA-Z0-9+/=\-:;,]+)"\)/) ||
    text.match(/var project = '([a-zA-Z0-9+/=\-:;,]+)';/) ||
    text.match(/window\.__PACKAGER__ = {\n {4}projectData: "([a-zA-Z0-9+/=\-:;,]+)"/)
    );
    if (dataURIMatch) {
        const dataURI = dataURIMatch[1];
        return unpackageBinaryBlob(decodeDataURI(dataURI));
    }

    let htmlifierOptions = text
        .match(/<script>\nconst GENERATED = \d+\nconst initOptions = ({[\s\S]+})\ninit\(initOptions\)\n<\/script>/m);
    if (htmlifierOptions) {
        const htmlifierAssets = JSON.parse(htmlifierOptions[1]).assets;

        const compressedProjectData = htmlifierAssets.file;
        if (compressedProjectData) {
            const decodedProjectData = decodeDataURI(compressedProjectData);
            return {
                type: 'sb',
                data: decodedProjectData
            };
        }

        const newZip = new JSZip();
        for (const name of Object.keys(htmlifierAssets)) {
            const nameInZip = name === 'project' ? 'project.json' : name;
            const dataURI = htmlifierAssets[name];
            newZip.file(nameInZip, decodeDataURI(dataURI));
        }

        return {
            type: 'sb3',
            data: await zipToArrayBuffer(newZip)
        };
    }

    htmlifierOptions = text.match(/var TYPE = 'json',\nPROJECT_JSON = "([^"]*)",\nASSETS = ({[^}]*}),/m);
    if (htmlifierOptions) {
        const projectJSON = decodeDataURI(htmlifierOptions[1]);
        const assetsJSON = JSON.parse(htmlifierOptions[2]);

        const newZip = new JSZip();
        newZip.file('project.json', projectJSON);
        for (const name of Object.keys(assetsJSON)) {
            newZip.file(name, decodeDataURI(assetsJSON[name]));
        }

        return {
            type: 'sb3',
            data: await zipToArrayBuffer(newZip)
        };
    }

    if (text.includes('<script src="script.js"></script>')) {
        throw new Error('It looks like the project was packaged as a zip, but only the HTML file was provided.');
    }

    if (
        text.includes('<style class="scratch-render-styles"') ||
    text.includes('<div class="sc-layers"') ||
    text.includes('<canvas class="sc-canvas"') ||
    text.includes('<div class="scratch-render-overlays"') ||
    text.includes('<div class="sc-monitor-overlay"')
    ) {
        // eslint-disable-next-line max-len
        throw new Error('It looks like you saved the HTML after the project loads. This does not work as the project data is removed from the HTML as the project loads to save memory.');
    }

    throw new Error('Input was not a zip and we could not find project.');
};

export default unpackage;
