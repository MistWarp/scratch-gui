import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import styles from './DiffView.module.css';

export const BLOCKS_PREVIEW_SCALE = 0.65;

let scratchblocksPromise = null;
const loadScratchblocks = () => {
    if (!scratchblocksPromise) scratchblocksPromise = import('scratchblocks');
    return scratchblocksPromise;
};

export const addChangeStripes = (canvas, svg) => {
    const canvasRect = canvas.getBoundingClientRect();
    const markers = svg.querySelectorAll('.sb3-diff-del, .sb3-diff-ins, .sb-diff-del, .sb-diff-ins');
    const changes = [];
    for (const marker of markers) {
        const removed = marker.classList.contains('sb3-diff-del') || marker.classList.contains('sb-diff-del');
        const changedBlock = removed ? marker.previousElementSibling : marker;
        const rect = changedBlock?.getBoundingClientRect();
        if (!rect || !rect.height) continue;
        changes.push({top: rect.top - canvasRect.top, height: rect.height, removed});
    }
    // Partition the vertical extent so nested blocks never stack translucent backgrounds.
    // The smallest block owns any overlap with its enclosing control blocks.
    changes.sort((a, b) => a.height - b.height);
    const boundaries = [...new Set(changes.flatMap(change => [change.top, change.top + change.height]))]
        .sort((a, b) => a - b);
    const bands = [];
    for (let index = 0; index < boundaries.length - 1; index++) {
        const top = boundaries[index];
        const bottom = boundaries[index + 1];
        const change = changes.find(candidate => candidate.top <= top && candidate.top + candidate.height >= bottom);
        if (!change) continue;
        const previous = bands[bands.length - 1];
        if (previous && previous.change === change && previous.bottom === top) {
            previous.bottom = bottom;
        } else {
            bands.push({top, bottom, change});
        }
    }
    for (const {top, bottom, change: {removed}} of bands) {
        const stripe = document.createElement('div');
        stripe.className = `${styles.blockChangeStripe} ${
            removed ? styles.blockChangeRemoved : styles.blockChangeAdded
        }`;
        stripe.style.top = `${top}px`;
        stripe.style.height = `${bottom - top}px`;
        stripe.dataset.blockChange = removed ? 'removed' : 'added';
        stripe.setAttribute('aria-hidden', 'true');
        stripe.textContent = removed ? '−' : '+';
        canvas.insertBefore(stripe, svg);
    }
};

const renderScript = (container, source, scratchblocks) => {
    container.innerHTML = '';
    const doc = scratchblocks.parse(source, {languages: ['en']});
    const svg = scratchblocks.render(doc, {style: 'scratch3', scale: BLOCKS_PREVIEW_SCALE});
    const canvas = document.createElement('div');
    canvas.className = styles.blocksCanvas;
    canvas.appendChild(svg);
    container.appendChild(canvas);
    return requestAnimationFrame(() => addChangeStripes(canvas, svg));
};

const BlocksCompare = ({source}) => {
    const ref = useRef(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;
        let renderFrame = null;
        setFailed(false);
        loadScratchblocks().then(module => {
            if (!active || !ref.current) return;
            try {
                renderFrame = renderScript(ref.current, source, module.default || module);
            } catch (error) {
                if (active) setFailed(true);
            }
        }).catch(() => {
            if (active) setFailed(true);
        });
        return () => {
            active = false;
            if (renderFrame !== null) cancelAnimationFrame(renderFrame);
        };
    }, [source]);

    if (failed) return <p className={styles.assetState}>Could not render blocks.</p>;
    return <div ref={ref} className={styles.blocksPreview} aria-label="Block changes" />;
};

BlocksCompare.propTypes = {
    source: PropTypes.string.isRequired
};

export default BlocksCompare;
