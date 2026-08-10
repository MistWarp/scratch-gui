import React, {useEffect, useMemo, useState} from 'react';
import {Clock, Gamepad2, Headphones, Radio} from 'lucide-react';
import styles from './ActivityCard.module.css';

const safeUrl = value => (/^https?:\/\//i.test(value || '') ? value : null);

const formatTime = milliseconds => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` :
        `${minutes}:${String(remainder).padStart(2, '0')}`;
};

const ActivityCard = ({activity}) => {
    const timestamps = activity.timestamps || {};
    const media = activity.media || {};
    const assets = activity.assets || {};
    const application = activity.application || {};
    const start = timestamps.start || media.start || activity.start_time;
    const end = timestamps.end || media.end;
    const [now, setNow] = useState(Date.now());
    const image = safeUrl(activity.image || assets.large_image);
    const smallImage = safeUrl(assets.small_image);
    const url = safeUrl(activity.url || application.url);
    const title = activity.title || application.name || 'Activity';
    const details = activity.details || media.title;
    const status = activity.state || media.artist || activity.status;
    const isListening = Boolean(activity.media) || activity.type === 2;
    const Icon = isListening ? Headphones : activity.type === 0 ? Gamepad2 : Radio;

    useEffect(() => {
        if (!start) return () => {};
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [start]);

    const timing = useMemo(() => {
        if (!start) return null;
        if (!end || end <= start) return {elapsed: formatTime(now - start)};
        const total = end - start;
        const elapsed = Math.min(Math.max(0, now - start), total);
        return {elapsed: formatTime(elapsed), total: formatTime(total), progress: elapsed / total * 100};
    }, [start, end, now]);

    const heading = url ? (
        <a href={url} target="_blank" rel="noreferrer">{title}</a>
    ) : <span>{title}</span>;

    return (
        <div className={styles.card}>
            <div className={styles.heading}>
                <Icon size={15} />
                {heading}
            </div>
            <div className={styles.content}>
                {image ? (
                    <span className={styles.artwork}>
                        <img src={image} alt="" loading="lazy" />
                        {smallImage ? (
                            <img className={styles.smallArtwork} src={smallImage} alt="" loading="lazy" />
                        ) : null}
                    </span>
                ) : null}
                <div className={styles.details}>
                    {details ? <strong>{details}</strong> : null}
                    {status && status !== details ? <span>{status}</span> : null}
                    {media.album ? <span>On {media.album}</span> : null}
                    {timing ? (
                        <div className={styles.timing}>
                            {!timing.total ? <Clock size={12} /> : null}
                            <span>{timing.elapsed}</span>
                            {timing.total ? (
                                <React.Fragment>
                                    <span className={styles.progress}>
                                        <span style={{width: `${timing.progress}%`}} />
                                    </span>
                                    <span>{timing.total}</span>
                                </React.Fragment>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;
