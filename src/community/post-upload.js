import {getRotur} from '../lib/rotur/client.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ATTACHMENT_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'video/mp4', 'video/webm'];

const randomKey = () => {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return `mistwarp-post-${Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')}`;
};

const uploadPostAttachment = async (file, onProgress = () => {}) => {
    if (!ATTACHMENT_TYPES.includes(file.type)) throw new Error('Choose a PNG, JPEG, GIF, MP4, or WEBM file.');
    if (file.size > MAX_UPLOAD_BYTES) throw new Error('Attachments must be 10 MB or smaller.');
    const key = randomKey();
    const result = await getRotur().validators.generate(key);
    if (!result || !result.validator) throw new Error('Could not authorize the upload.');
    const query = new URLSearchParams({validator: result.validator, validator_key: key});
    const data = new FormData();
    data.append('validator', result.validator);
    data.append('validator_key', key);
    data.append('file', file);
    data.append('name', file.name);
    data.append('mime_type', file.type);
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `https://chats.mistium.com/attachments/upload?${query}`);
        request.upload.onprogress = event => {
            if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
        };
        request.onerror = () => reject(new Error('The attachment upload failed.'));
        request.onload = () => {
            if (request.status < 200 || request.status >= 300) {
                reject(new Error(`The attachment upload failed (${request.status}).`));
                return;
            }
            try {
                const response = JSON.parse(request.responseText);
                const attachment = (response.attachments && response.attachments[0]) || response.attachment || response;
                if (!attachment || !attachment.url) throw new Error('The upload response was incomplete.');
                resolve(attachment.url);
            } catch (cause) {
                reject(cause);
            }
        };
        request.send(data);
    });
};

export {ATTACHMENT_TYPES, MAX_UPLOAD_BYTES, uploadPostAttachment};
