import React from 'react';

const messageText = (node, intl) => {
    if (node === null || typeof node === 'undefined' || typeof node === 'boolean') {
        return '';
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(child => messageText(child, intl)).join(' ');
    }
    if (React.isValidElement(node)) {
        const props = node.props || {};
        if (typeof props.id === 'string' && typeof props.defaultMessage === 'string') {
            if (intl) {
                return intl.formatMessage({id: props.id, defaultMessage: props.defaultMessage}, props.values);
            }
            return props.defaultMessage;
        }
        return messageText(props.children, intl);
    }
    return '';
};

const wordsOf = text => text.toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

const searchWordsOf = (item, intl) => wordsOf([
    messageText(item.name, intl),
    messageText(item.description, intl),
    item.extensionId,
    Array.isArray(item.tags) ? item.tags.join(' ') : '',
    messageText(item.credits, intl),
    messageText(item.collaborator, intl)
].filter(Boolean).join(' '));

const matchesExtensionQuery = (item, query, intl) => {
    const terms = wordsOf(query || '');
    if (!terms.length) {
        return true;
    }
    const words = searchWordsOf(item, intl);
    return terms.every(term => words.some(word => word.startsWith(term)));
};

export {
    messageText,
    matchesExtensionQuery
};
