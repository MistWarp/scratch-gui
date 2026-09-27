import React from 'react';

const noop = () => false;

const ChatActions = React.createContext({
    addScript: noop,
    canAddScript: false,
    homeServer: null,
    homeMembership: 'unknown',
    joinHomeServer: noop,
    openDirect: noop
});

const CHAT_DRAG_MIME = 'application/x-mistwarp-chat';

const formatBytes = bytes => {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
    return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

const formatCount = value => {
    const count = Number(value) || 0;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(count);
};

const saveBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const downloadFile = async (url, name) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Download failed (${response.status})`);
        saveBlob(await response.blob(), name);
    } catch (e) {
        window.open(url, '_blank', 'noopener');
    }
};

export {CHAT_DRAG_MIME, ChatActions, downloadFile, formatBytes, formatCount, saveBlob};
