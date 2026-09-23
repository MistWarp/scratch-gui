import PropTypes from 'prop-types';
import React from 'react';
import {BarChart3, Check, Download, Eye, Heart, Link2, RotateCcw, Sprout, Star, Users} from 'lucide-react';

import {useCommunityIntl} from '../i18n.jsx';
import styles from './MembershipPreviews.module.css';

const Preview = ({children, label}) => (
    <div className={styles.preview} role="img" aria-label={label}>
        <div aria-hidden="true">{children}</div>
    </div>
);

Preview.propTypes = {
    children: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired
};

const BARS = [38, 52, 44, 70, 58, 84, 66, 92, 76, 100, 88, 94];

export const AnalyticsPreview = () => {
    const {text: communityText} = useCommunityIntl();
    const stats = [
        {icon: Eye, tone: styles.toneViews, value: '840', label: communityText('Views')},
        {icon: Heart, tone: styles.toneHearts, value: '64', label: communityText('Hearts')},
        {icon: Users, tone: styles.toneBuyers, value: '48', label: communityText('Buyers')},
        {icon: BarChart3, tone: styles.toneRate, value: '5.7%', label: communityText('View-to-buyer conversion')}
    ];
    return (
        <Preview
            label={communityText('Example project analytics showing views, playtime, buyer conversion, and CSV export')}
        >
            <div className={styles.stats}>
                {stats.map(({icon: Icon, tone, value, label}) => (
                    <div className={styles.stat} key={label}>
                        <span className={`${styles.statIcon} ${tone}`}><Icon size={16} /></span>
                        <strong>{value}</strong>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
            <div className={styles.chart}>
                <div className={styles.chartHead}>
                    <span>{communityText('Last 30 days')}</span>
                    <span className={styles.chip}><Download size={12} />{communityText('Export CSV')}</span>
                </div>
                <div className={styles.bars}>
                    {BARS.map((height, index) => <i key={index} style={{height: `${height}%`}} />)}
                </div>
            </div>
        </Preview>
    );
};

const SWATCHES = ['#4c97ff', '#ff6680', '#59c059', '#ffab19'];

export const BrandingPreview = () => {
    const {text: communityText} = useCommunityIntl();
    return (
        <Preview
            label={communityText('Project branding settings with an accent colour, a tagline, and a custom URL')}
        >
            <div className={styles.projectCard} style={{'--preview-brand': SWATCHES[1]}}>
                <div className={styles.projectArt}><Star size={26} /></div>
                <div className={styles.projectText}>
                    <strong>{communityText('Star Garden')}</strong>
                    <span>{communityText('A little space to explore.')}</span>
                </div>
            </div>
            <div className={styles.fields}>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>{communityText('Brand colour')}</span>
                    <div className={styles.swatches}>
                        {SWATCHES.map((colour, index) => (
                            <i
                                key={colour}
                                className={index === 1 ? styles.swatchActive : ''}
                                style={{background: colour}}
                            >
                                {index === 1 ? <Check size={12} /> : null}
                            </i>
                        ))}
                    </div>
                </div>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>{communityText('Tagline')}</span>
                    <span className={styles.input}>{communityText('A little space to explore.')}</span>
                </div>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>{communityText('Custom URL')}</span>
                    <span className={styles.input}><Link2 size={13} />{communityText('/p/star-garden')}</span>
                </div>
            </div>
        </Preview>
    );
};

export const RecoveryPreview = () => {
    const {text: communityText} = useCommunityIntl();
    const rows = [
        {icon: Star, tone: styles.artStar, title: communityText('Star Garden'), days: 27},
        {icon: Sprout, tone: styles.artSprout, title: communityText('First garden sketch'), days: 12}
    ];
    return (
        <Preview label={communityText('Deleted example projects in Trash with Restore buttons')}>
            <div className={styles.rows}>
                {rows.map(({icon: Icon, tone, title, days}) => (
                    <div className={styles.row} key={title}>
                        <span className={`${styles.thumb} ${tone}`}><Icon size={22} /></span>
                        <div className={styles.rowText}>
                            <strong>{title}</strong>
                            <span>{communityText('{count} days left to restore', {count: days})}</span>
                        </div>
                        <span className={styles.restore}><RotateCcw size={13} />{communityText('Restore')}</span>
                    </div>
                ))}
            </div>
        </Preview>
    );
};
