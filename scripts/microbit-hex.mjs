import fs from 'node:fs';
import path from 'node:path';
import nodeCrypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import yauzl from 'yauzl';

const ZIP_URL = 'https://packagerdata.turbowarp.org/scratch-microbit-1.2.0.hex.zip';
const ZIP_SHA256 = 'dfd574b709307fe76c44dbb6b0ac8942e7908f4d5c18359fae25fbda3c9f4399';
const HEX_NAME = 'scratch-microbit-1.2.0.hex';

const readHex = zipBuffer => new Promise((resolve, reject) => {
    yauzl.fromBuffer(zipBuffer, {lazyEntries: true}, (zipError, zipfile) => {
        if (zipError) return reject(zipError);
        zipfile.on('error', reject);
        zipfile.on('end', () => reject(new Error(`${ZIP_URL} has no .hex file`)));
        zipfile.on('entry', entry => {
            if (!entry.fileName.endsWith('.hex')) return zipfile.readEntry();
            zipfile.openReadStream(entry, (streamError, stream) => {
                if (streamError) return reject(streamError);
                const chunks = [];
                stream.on('data', chunk => chunks.push(chunk));
                stream.on('error', reject);
                stream.on('end', () => resolve(Buffer.concat(chunks)));
            });
        });
        zipfile.readEntry();
    });
});

const downloadHex = async () => {
    const response = await fetch(ZIP_URL);
    if (!response.ok) throw new Error(`${ZIP_URL} returned HTTP ${response.status}`);
    const zipBuffer = Buffer.from(await response.arrayBuffer());
    const sha256 = nodeCrypto.createHash('sha256').update(zipBuffer)
        .digest('hex');
    if (sha256 !== ZIP_SHA256) throw new Error(`${ZIP_URL} has SHA-256 ${sha256}, expected ${ZIP_SHA256}`);
    return readHex(zipBuffer);
};

export const ensureMicrobitHex = async (directory, {required = true} = {}) => {
    const hexFile = path.join(directory, 'static', 'microbit', HEX_NAME);
    const urlFile = path.join(directory, 'src', 'generated', 'microbit-hex-url.js');
    if (fs.existsSync(hexFile) && fs.existsSync(urlFile)) return;
    if (!fs.existsSync(hexFile)) {
        try {
            const hex = await downloadHex();
            fs.mkdirSync(path.dirname(hexFile), {recursive: true});
            fs.writeFileSync(hexFile, hex);
        } catch (error) {
            const message = `Could not download the micro:bit HEX file (${error.message}).`;
            if (required) {
                throw new Error(`${message} Production builds need it. Check your connection and build again.`);
            }
            console.warn(`${message} The editor still runs, but micro:bit updates fail until it downloads.`);
        }
    }
    fs.mkdirSync(path.dirname(urlFile), {recursive: true});
    const source = `const hexUrl = \`\${process.env.ROOT}microbit/${HEX_NAME}\`;\n\nexport default hexUrl;\n`;
    fs.writeFileSync(urlFile, source);
};

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await ensureMicrobitHex(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
}
