// eslint-disable-next-line import/no-unresolved
import soundThumbnail from '!base64-loader!./sound-thumbnail.png';

const soundPayload = sound => {
    const assetDataFormat = sound.dataFormat;
    if (!['wav', 'mp3', 'ogg'].includes(assetDataFormat)) {
        return Promise.reject(new Error(`Unsupported sound format: ${assetDataFormat || 'unknown'}`));
    }

    const assetDataUrl = sound.asset.encodeDataURI();
    const payload = {
        type: 'sound',
        name: sound.name,
        thumbnail: soundThumbnail,
        // Params to be filled in below
        mime: '',
        body: ''
    };

    payload.mime = {
        wav: 'audio/x-wav',
        mp3: 'audio/mp3',
        ogg: 'audio/ogg'
    }[assetDataFormat];
    // scratch-storage currently labels every sound data URI as WAV, so strip whatever
    // header it supplied instead of assuming that it matches the actual sound format.
    payload.body = assetDataUrl.substring(assetDataUrl.indexOf(',') + 1);

    // Return a promise to make it consistent with other payload constructors like costume-payload
    return new Promise(resolve => resolve(payload));
};

export {
    soundPayload as default,
    soundThumbnail
};
