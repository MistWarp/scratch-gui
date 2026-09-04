import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {parseFractch} from 'fractch/browser';
import {extensionOfPath, mediaTypeForAssetPath} from '../asset-media.js';
import styles from './SpriteList.module.css';

const IMAGE_EXTENSIONS = new Set(['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico']);

export const spriteOfPath = path => {
    const parts = String(path || '').split('/');
    return parts.length > 1 ? parts[0] : '';
};

export const spriteLabel = name => {
    if (name === 'Stage') return 'Global';
    return name || 'Other files';
};

export const groupFilesBySprite = files => {
    const groups = new Map();
    for (const file of files || []) {
        const name = spriteOfPath(file.path);
        if (!groups.has(name)) groups.set(name, {name, files: []});
        groups.get(name).files.push(file);
    }
    return [...groups.values()];
};

export const currentCostumeAsset = (spriteName, fileTexts) => {
    if (!spriteName) return '';
    try {
        const text = fileTexts?.[`${spriteName}/main.fractch`]?.after;
        if (!text) return '';
        const parsed = parseFractch(text);
        const current = (parsed.assets?.costumes || []).find(entry => entry.current);
        const chosen = current || parsed.assets?.costumes?.[0];
        return chosen?.file ? `${spriteName}/${chosen.file}` : '';
    } catch (error) {
        return '';
    }
};

const firstImageAsset = (spriteName, files) => {
    const match = (files || []).find(file =>
        spriteOfPath(file.path) === spriteName && IMAGE_EXTENSIONS.has(extensionOfPath(file.path)));
    return match ? match.path : '';
};

const SpriteRow = ({sprite, thumb, active, onSelect}) => (
    <button
        type="button"
        className={active ? styles.rowActive : styles.row}
        aria-pressed={active}
        onClick={() => onSelect(sprite.name)}
    >
        {thumb?.url && thumb.mediaType.startsWith('image/') ? (
            <span className={styles.thumb}><img src={thumb.url} alt="" draggable={false} /></span>
        ) : (
            <span className={styles.thumbFallback} aria-hidden="true">{spriteLabel(sprite.name).slice(0, 1)}</span>
        )}
        <span className={styles.rowText}>
            <strong>{spriteLabel(sprite.name)}</strong>
            <span>{sprite.files.length} changed file{sprite.files.length === 1 ? '' : 's'}</span>
        </span>
    </button>
);

const SpriteList = ({files, fileTexts, loadAsset, activeSprite, onSelect}) => {
    const sprites = groupFilesBySprite(files).filter(sprite => sprite.name && sprite.name !== 'Stage');
    const [thumbs, setThumbs] = useState({});
    const urlsRef = useRef([]);
    useEffect(() => () => {
        urlsRef.current.forEach(url => URL.revokeObjectURL(url));
        urlsRef.current = [];
    }, []);
    const spritesKey = sprites
        .map(sprite => `${sprite.name}:${sprite.files.map(file => file.path).join(',')}`)
        .join('|');

    useEffect(() => {
        let active = true;
        urlsRef.current.forEach(url => URL.revokeObjectURL(url));
        urlsRef.current = [];
        setThumbs({});
        if (!loadAsset) return () => {};
        Promise.all(sprites.map(async sprite => {
            const assetPath = currentCostumeAsset(sprite.name, fileTexts) ||
                firstImageAsset(sprite.name, sprite.files);
            if (!assetPath) return [sprite.name, null];
            try {
                const result = await loadAsset('new', assetPath);
                if (!active || !result?.bytes?.length) return [sprite.name, null];
                const url = URL.createObjectURL(
                    new Blob([result.bytes], {type: result.mediaType || mediaTypeForAssetPath(assetPath)})
                );
                if (!active) {
                    URL.revokeObjectURL(url);
                    return [sprite.name, null];
                }
                urlsRef.current.push(url);
                return [sprite.name, {url, mediaType: result.mediaType || ''}];
            } catch (error) {
                return [sprite.name, null];
            }
        })).then(entries => {
            if (active) setThumbs(Object.fromEntries(entries));
        });
        return () => {
            active = false;
        };
    }, [spritesKey, loadAsset]);

    if (!sprites.length) return null;
    return (
        <aside className={styles.sidebar} aria-label="Changed sprites">
            {sprites.map(sprite => (
                <SpriteRow
                    key={sprite.name || 'other'}
                    sprite={sprite}
                    thumb={thumbs[sprite.name]}
                    active={activeSprite === sprite.name}
                    onSelect={onSelect}
                />
            ))}
        </aside>
    );
};

SpriteList.propTypes = {
    files: PropTypes.array.isRequired,
    fileTexts: PropTypes.object,
    loadAsset: PropTypes.func,
    activeSprite: PropTypes.string,
    onSelect: PropTypes.func.isRequired
};

SpriteList.defaultProps = {
    fileTexts: {},
    loadAsset: null,
    activeSprite: ''
};

export default SpriteList;
