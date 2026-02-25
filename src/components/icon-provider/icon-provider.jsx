import React, {createContext, useContext, useMemo, useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
    ICON_PACK_DEFAULT,
    ICON_PACK_MAP
} from '../../lib/themes/icon-packs/index.js';
import {Theme} from '../../lib/themes/index.js';

const IconPackContext = createContext(null);

const IconPackProvider = ({children, theme}) => {
    const [currentIconPack, setCurrentIconPack] = useState(null);

    useEffect(() => {
        const iconPackName = theme.iconPack || ICON_PACK_DEFAULT;
        console.log('Theme iconPack:', theme.iconPack, 'Looking up:', iconPackName);
        const pack = ICON_PACK_MAP[iconPackName];
        console.log('Found icon pack:', pack);
        setCurrentIconPack(pack);
    }, [theme.iconPack]);

    const value = useMemo(() => ({
        iconPack: currentIconPack,
        getIcon: (iconName) => {
            const icon = currentIconPack?.icons?.[iconName] || currentIconPack?.[iconName] || null;
            return icon;
        }
    }), [currentIconPack]);

    return (
        <IconPackContext.Provider value={value}>
            {children}
        </IconPackContext.Provider>
    );
};

IconPackProvider.propTypes = {
    children: PropTypes.node.isRequired,
    theme: PropTypes.instanceOf(Theme).isRequired
};

export const useIconPack = () => {
    const context = useContext(IconPackContext);
    if (!context) {
        throw new Error('useIconPack must be used within an IconPackProvider');
    }
    return context;
};

export const useIcon = (iconName) => {
    const {getIcon} = useIconPack();
    return getIcon(iconName);
};

const mapStateToProps = state => ({
    theme: state.scratchGui.theme.theme
});

export default connect(mapStateToProps)(IconPackProvider);
export {IconPackContext};
