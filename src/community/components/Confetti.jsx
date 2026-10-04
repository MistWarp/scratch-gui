import React, {useCallback, useEffect, useState} from 'react';
import styles from './Confetti.module.css';

const COLORS = ['#f3c952', '#855cd6', '#4aa8f0', '#2faa72', '#ef5d7a', '#ff9f43'];
const STORAGE_PREFIX = 'mw-celebrated:';

export const confettiPieces = (count, random = Math.random) => Array.from({length: count}, (unused, index) => ({
    left: random() * 100,
    delay: random() * 0.7,
    duration: 2.4 + (random() * 1.6),
    drift: (random() - 0.5) * 220,
    spin: (random() * 900) - 450,
    size: 6 + (random() * 7),
    round: random() > 0.7,
    color: COLORS[index % COLORS.length]
}));

const prefersReducedMotion = () => {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
        return false;
    }
};

const alreadyCelebrated = key => {
    try {
        if (window.localStorage.getItem(STORAGE_PREFIX + key)) return true;
        window.localStorage.setItem(STORAGE_PREFIX + key, '1');
    } catch (e) {
        // Storage can be blocked; celebrating again is harmless.
    }
    return false;
};

// Bursts once per viewer for each key, and again whenever replay() is called.
export const useCelebration = key => {
    const [burst, setBurst] = useState(0);
    useEffect(() => {
        if (key && !alreadyCelebrated(key)) setBurst(current => current + 1);
    }, [key]);
    const replay = useCallback(() => setBurst(current => current + 1), []);
    return [burst, replay];
};

const Confetti = ({burst}) => {
    const [pieces, setPieces] = useState([]);
    useEffect(() => {
        if (!burst || prefersReducedMotion()) return;
        setPieces(confettiPieces(110));
        const timer = setTimeout(() => setPieces([]), 4600);
        return () => clearTimeout(timer);
    }, [burst]);
    if (!pieces.length) return null;
    return (
        <div className={styles.confetti} aria-hidden="true">
            {pieces.map((piece, index) => (
                <span
                    key={`${burst}-${index}`}
                    style={{
                        'left': `${piece.left}%`,
                        'width': `${piece.size}px`,
                        'height': `${piece.round ? piece.size : piece.size * 0.45}px`,
                        'borderRadius': piece.round ? '50%' : '1px',
                        'background': piece.color,
                        'animationDelay': `${piece.delay}s`,
                        'animationDuration': `${piece.duration}s`,
                        '--drift': `${piece.drift}px`,
                        '--spin': `${piece.spin}deg`
                    }}
                />
            ))}
        </div>
    );
};

export default Confetti;
