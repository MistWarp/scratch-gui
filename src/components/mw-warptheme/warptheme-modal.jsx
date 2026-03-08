import PropTypes from 'prop-types';
import React, {useState, useEffect, useMemo} from 'react';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';
import {Search, Heart, Download, ExternalLink} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import Spinner from '../spinner/spinner.jsx';

import styles from './warptheme-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'WarpTheme Marketplace',
        description: 'Title of the WarpTheme marketplace modal',
        id: 'mw.warptheme.title'
    },
    searchPlaceholder: {
        defaultMessage: 'Search themes...',
        description: 'Placeholder text for search input',
        id: 'mw.warptheme.searchPlaceholder'
    },
    sortBy: {
        defaultMessage: 'Sort by',
        description: 'Label for sort dropdown',
        id: 'mw.warptheme.sortBy'
    },
    newest: {
        defaultMessage: 'Newest',
        description: 'Sort option for newest themes',
        id: 'mw.warptheme.newest'
    },
    likes: {
        defaultMessage: 'Most Liked',
        description: 'Sort option for most liked themes',
        id: 'mw.warptheme.likes'
    },
    name: {
        defaultMessage: 'Name',
        description: 'Sort option for alphabetical by name',
        id: 'mw.warptheme.name'
    },
    allPlatforms: {
        defaultMessage: 'All Platforms',
        description: 'Filter option for all platforms',
        id: 'mw.warptheme.allPlatforms'
    },
    mistwarp: {
        defaultMessage: 'MistWarp',
        description: 'Platform filter for MistWarp',
        id: 'mw.warptheme.mistwarp'
    },
    nitrobolt: {
        defaultMessage: 'NitroBolt',
        description: 'Platform filter for NitroBolt',
        id: 'mw.warptheme.nitrobolt'
    },
    allColors: {
        defaultMessage: 'All Colors',
        description: 'Filter option for all colors',
        id: 'mw.warptheme.allColors'
    },
    login: {
        defaultMessage: 'Sign In',
        description: 'Button to sign in',
        id: 'mw.warptheme.login'
    },
    logout: {
        defaultMessage: 'Sign Out',
        description: 'Button to sign out',
        id: 'mw.warptheme.logout'
    },
    createTheme: {
        defaultMessage: 'Create Theme',
        description: 'Button to create a new theme',
        id: 'mw.warptheme.createTheme'
    },
    noThemes: {
        defaultMessage: 'No themes found',
        description: 'Message shown when no themes match filters',
        id: 'mw.warptheme.noThemes'
    },
    loading: {
        defaultMessage: 'Loading themes...',
        description: 'Loading message',
        id: 'mw.warptheme.loading'
    },
    error: {
        defaultMessage: 'Failed to load themes',
        description: 'Error message when themes fail to load',
        id: 'mw.warptheme.error'
    },
    likesCount: {
        defaultMessage: '{count} likes',
        description: 'Label for like count',
        id: 'mw.warptheme.likesCount'
    },
    downloadsCount: {
        defaultMessage: '{count} downloads',
        description: 'Label for download count',
        id: 'mw.warptheme.downloadsCount'
    },
    applyTheme: {
        defaultMessage: 'Apply',
        description: 'Button to apply a theme',
        id: 'mw.warptheme.applyTheme'
    },
    openInWarpTheme: {
        defaultMessage: 'Open in WarpTheme',
        description: 'Button to open theme in WarpTheme website',
        id: 'mw.warptheme.openInWarpTheme'
    }
});

const COLORS = [
    {id: 'all', label: 'All Colors'},
    {id: 'red', label: 'Red'},
    {id: 'orange', label: 'Orange'},
    {id: 'yellow', label: 'Yellow'},
    {id: 'green', label: 'Green'},
    {id: 'blue', label: 'Blue'},
    {id: 'purple', label: 'Purple'},
    {id: 'pink', label: 'Pink'}
];

const PLATFORMS = [
    {id: 'all', label: 'All Platforms'},
    {id: 'mistwarp', label: 'MistWarp'},
    {id: 'nitrobolt', label: 'NitroBolt'}
];

// Helper functions for color analysis
const hexToRgb = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const rgbToHue = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    if (max !== min) {
        if (max === r) {
            hue = (g - b) / (max - min) + (g < b ? 6 : 0);
        } else if (max === g) {
            hue = (b - r) / (max - min) + 2;
        } else {
            hue = (r - g) / (max - min) + 4;
        }
        hue *= 60;
    }
    return hue < 0 ? hue + 360 : hue;
};

const rgbToSaturation = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    if (max === min) return 0;
    return lightness > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
};

const rgbToLightness = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return (max + min) / 2;
};

const colorMatchesCategory = (hexColor, category) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return false;
    
    const hue = rgbToHue(rgb.r, rgb.g, rgb.b);
    const saturation = rgbToSaturation(rgb.r, rgb.g, rgb.b);
    const lightness = rgbToLightness(rgb.r, rgb.g, rgb.b);
    
    // Skip very dark or very light/unsaturated colors
    if (lightness < 0.15 || lightness > 0.95 || saturation < 0.1) {
        return false;
    }
    
    switch (category.toLowerCase()) {
    case 'red':
        return (hue >= 345 || hue < 15) && saturation > 0.2;
    case 'orange':
        return hue >= 15 && hue < 45 && saturation > 0.2;
    case 'yellow':
        return hue >= 45 && hue < 65 && saturation > 0.3;
    case 'green':
        return hue >= 65 && hue < 155 && saturation > 0.2;
    case 'blue':
        return hue >= 155 && hue < 260 && saturation > 0.2;
    case 'purple':
        return hue >= 260 && hue < 300 && saturation > 0.2;
    case 'pink':
        return hue >= 300 && hue < 345 && saturation > 0.2;
    default:
        return false;
    }
};

const themeHasColor = (theme, colorName) => {
    if (!theme.colors) return false;
    
    try {
        let gradientColors = null;
        if (theme.colors.gradient && Array.isArray(theme.colors.gradient)) {
            gradientColors = theme.colors.gradient;
        } else if (theme.colors.accent && theme.colors.accent.colors && Array.isArray(theme.colors.accent.colors)) {
            gradientColors = theme.colors.accent.colors;
        }
        
        if (gradientColors) {
            return gradientColors.some(c => colorMatchesCategory(c.color, colorName));
        }
    } catch (e) {
        console.debug('Failed to parse gradient data:', e);
    }
    return false;
};

const WarpThemeModal = props => {
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [colorFilter, setColorFilter] = useState('all');

    // Fetch themes from WarpTheme API
    useEffect(() => {
        const fetchThemes = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('https://warptheme.mistium.com/api/themes');
                if (!response.ok) throw new Error('Failed to fetch themes');
                const data = await response.json();
                setThemes(data.themes || []);
            } catch (err) {
                console.error('Error fetching themes:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchThemes();
    }, []);

    // Filter and sort themes
    const filteredThemes = useMemo(() => {
        let result = [...themes];
        
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(theme =>
                theme.name.toLowerCase().includes(query) ||
                theme.description?.toLowerCase().includes(query) ||
                theme.authorName.toLowerCase().includes(query)
            );
        }
        
        // Filter by platform
        if (platformFilter !== 'all') {
            result = result.filter(theme => theme.platform === platformFilter);
        }
        
        // Filter by color
        if (colorFilter !== 'all') {
            result = result.filter(theme => themeHasColor(theme, colorFilter));
        }
        
        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
            case 'likes':
                return b.likes - a.likes;
            case 'name':
                return a.name.localeCompare(b.name);
            case 'newest':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
        
        return result;
    }, [themes, searchQuery, platformFilter, colorFilter, sortBy]);

    const handleCreateTheme = () => {
        window.open('https://warptheme.mistium.com', '_blank');
    };

    const handleOpenInWarpTheme = theme => {
        const slug = theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        window.open(`https://warptheme.mistium.com/themes/${theme.author}/${slug}`, '_blank');
    };

    const handleApplyTheme = async theme => {
        if (props.onThemeApply) {
            try {
                const response = await fetch(
                    `https://warptheme.mistium.com/api/theme/export?uuid=${theme.uuid}&platform=mistwarp`
                );
                if (!response.ok) throw new Error('Failed to fetch theme');
                const themeData = await response.json();
                props.onThemeApply(themeData);
            } catch (err) {
                console.error('Error applying theme:', err);
            }
        }
    };

    const getGradientStyle = theme => {
        if (!theme.colors?.gradient) return {};
    
        const sortedColors = [...theme.colors.gradient].sort((a, b) => a.position - b.position);
        const gradientStops = sortedColors.map(c => `${c.color} ${c.position}%`).join(', ');
    
        const direction = theme.colors.gradientDirection || 135;
    
        return {
            background: `linear-gradient(${direction}deg, ${gradientStops})`
        };
    };

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={props.intl.formatMessage(messages.title)}
            id="warpthemeModal"
            fullScreen
            onRequestClose={props.onClose}
        >
            <Box className={styles.container}>
                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.searchBox}>
                        <Search
                            size={18}
                            className={styles.searchIcon}
                        />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder={props.intl.formatMessage(messages.searchPlaceholder)}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.select}
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                        >
                            <option value="newest">{props.intl.formatMessage(messages.newest)}</option>
                            <option value="likes">{props.intl.formatMessage(messages.likes)}</option>
                            <option value="name">{props.intl.formatMessage(messages.name)}</option>
                        </select>
                        
                        <select
                            className={styles.select}
                            value={platformFilter}
                            onChange={e => setPlatformFilter(e.target.value)}
                        >
                            {PLATFORMS.map(p => (
                                <option
                                    key={p.id}
                                    value={p.id}
                                >
                                    {p.id === 'all' ? props.intl.formatMessage(messages.allPlatforms) :
                                        p.id === 'mistwarp' ? props.intl.formatMessage(messages.mistwarp) :
                                            props.intl.formatMessage(messages.nitrobolt)}
                                </option>
                            ))}
                        </select>
                        
                        <select
                            className={styles.select}
                            value={colorFilter}
                            onChange={e => setColorFilter(e.target.value)}
                        >
                            {COLORS.map(c => (
                                <option
                                    key={c.id}
                                    value={c.id}
                                >
                                    {c.id === 'all' ? props.intl.formatMessage(messages.allColors) : c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Themes Grid */}
                <div className={styles.themesGrid}>
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <Spinner large />
                            <p className={styles.loadingText}>
                                <FormattedMessage {...messages.loading} />
                            </p>
                        </div>
                    ) : error ? (
                        <div className={styles.errorContainer}>
                            <p className={styles.errorText}>
                                <FormattedMessage {...messages.error} />
                            </p>
                        </div>
                    ) : filteredThemes.length === 0 ? (
                        <div className={styles.noThemesContainer}>
                            <p className={styles.noThemesText}>
                                <FormattedMessage {...messages.noThemes} />
                            </p>
                        </div>
                    ) : (
                        filteredThemes.map(theme => (
                            <div
                                key={theme.uuid}
                                className={styles.themeCard}
                                data-name={theme.name}
                                data-platform={theme.platform}
                            >
                                <div
                                    className={styles.themeHeader}
                                    style={getGradientStyle(theme)}
                                />
                                <div className={styles.themeContent}>
                                    <h3 className={styles.themeName}>{theme.name}</h3>
                                    <p className={styles.themeAuthor}>by {theme.authorName}</p>
                                    {theme.description && (
                                        <p className={styles.themeDescription}>{theme.description}</p>
                                    )}
                                    <div className={styles.themeStats}>
                                        <div className={styles.stat}>
                                            <Heart size={14} />
                                            <span>{theme.likes}</span>
                                        </div>
                                        <div className={styles.stat}>
                                            <Download size={14} />
                                            <span>{theme.downloads}</span>
                                        </div>
                                    </div>
                                    <div className={styles.themeActions}>
                                        <button
                                            className={styles.applyBtn}
                                            onClick={() => handleApplyTheme(theme)}
                                        >
                                            <FormattedMessage {...messages.applyTheme} />
                                        </button>
                                        <button
                                            className={styles.openBtn}
                                            onClick={() => handleOpenInWarpTheme(theme)}
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <button
                    className={styles.floatingCreateBtn}
                    onClick={handleCreateTheme}
                    title={props.intl.formatMessage(messages.createTheme)}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </Box>
        </Modal>
    );
};

WarpThemeModal.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func.isRequired,
    onThemeApply: PropTypes.func
};

export default injectIntl(WarpThemeModal);
