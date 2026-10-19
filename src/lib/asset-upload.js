import {handleFileUpload, costumeUpload, soundUpload, spriteUpload} from './file-uploader.js';
import {encodeAndAddSoundToVM} from './audio/audio-util.js';

const SOUND_RECORDED_EVENT = 'mw:sound-recorded';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'jfif', 'gif', 'svg', 'bmp', 'webp'];
const SOUND_EXTENSIONS = ['wav', 'mp3', 'ogg', 'oga', 'flac'];

const noop = () => {};

const extensionOf = name => {
    const text = String(name || '');
    const index = text.lastIndexOf('.');
    return index === -1 ? '' : text.slice(index + 1).toLowerCase();
};

const classifyFile = file => {
    if (!file) return null;
    const extension = extensionOf(file.name);
    const type = String(file.type || '');
    if (extension === 'sprite3' || extension === 'sprite2' || extension === 'sprite') return 'sprite';
    if (extension === 'js' || type === 'text/javascript' || type === 'application/javascript') return 'extension';
    if (IMAGE_EXTENSIONS.includes(extension) || type.startsWith('image/')) return 'image';
    if (SOUND_EXTENSIONS.includes(extension) || type.startsWith('audio/')) return 'sound';
    return null;
};

const toInput = files => {
    if (files && typeof files === 'object' && 'files' in files && !Array.isArray(files)) return files;
    return {files: Array.from(files || []), value: null};
};

const runUpload = (files, notify, handle) => new Promise(resolve => {
    const onStart = notify.onStart || noop;
    const onEnd = notify.onEnd || noop;
    const onError = notify.onError || noop;
    const results = [];
    const finished = new Set();
    const finish = (index, count) => {
        finished.add(index);
        if (finished.size === count) {
            onEnd();
            resolve(results);
        }
    };
    const fail = (error, index, count) => {
        onError(error);
        finish(index, count);
    };
    onStart();
    const count = handleFileUpload(toInput(files), (buffer, fileType, fileName, index, total) => {
        handle(buffer, fileType, fileName, result => {
            results[index] = result;
            finish(index, total);
        }, error => fail(error, index, total));
    }, fail);
    if (count === 0) {
        onEnd();
        resolve(results);
    }
});

const uploadCostumes = ({vm, files, targetId, isBackdrop = false, ...notify}) => runUpload(files, notify,
    (buffer, fileType, fileName, done, fail) => {
        costumeUpload(buffer, fileType, vm, vmCostumes => {
            vmCostumes.forEach((costume, i) => {
                costume.name = `${fileName}${i ? i + 1 : ''}`;
            });
            Promise.all(vmCostumes.map(costume => (isBackdrop ?
                vm.addBackdrop(costume.md5, costume) :
                vm.addCostume(costume.md5, costume, targetId)
            ))).then(done, fail);
        }, fail);
    }
);

const uploadSounds = ({vm, files, targetId, onAdded, ...notify}) => runUpload(files, notify,
    (buffer, fileType, fileName, done, fail) => {
        soundUpload(buffer, fileType, vm.runtime.storage, newSound => {
            newSound.name = fileName;
            vm.addSound(newSound, targetId)
                .then(result => {
                    if (onAdded) onAdded(result);
                    done(result);
                }, fail);
        }, fail);
    }
);

const uploadSprites = ({vm, files, addSprite, ...notify}) => runUpload(files, notify,
    (buffer, fileType, fileName, done, fail) => {
        spriteUpload(buffer, fileType, fileName, vm, newSprite => {
            Promise.resolve(addSprite ? addSprite(newSprite) : vm.addSprite(newSprite)).then(done, fail);
        }, fail);
    }
);

const addRecordedSound = ({vm, samples, sampleRate, name, targetId}) =>
    encodeAndAddSoundToVM(vm, samples, sampleRate, name || 'recording1', null, targetId);

export {
    SOUND_RECORDED_EVENT,
    addRecordedSound,
    classifyFile,
    uploadCostumes,
    uploadSounds,
    uploadSprites
};
