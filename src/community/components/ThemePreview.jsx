import PropTypes from 'prop-types';
import React from 'react';

const safeColor = value => {
    const color = String(value || '').trim();
    if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
    if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%+-]+\)$/i.test(color)) return color;
    return '';
};

const gradientStyle = theme => {
    const visual = theme.visual || theme.theme || {};
    const legacyColors = visual.colors || {};
    const accent = visual.accent || {};
    const suppliedStops = Array.isArray(legacyColors.gradient) ? legacyColors.gradient :
        Array.isArray(accent.colors) ? accent.colors : [];
    let stops = suppliedStops
        .map((stop, index) => ({
            color: safeColor(typeof stop === 'string' ? stop : stop?.color),
            position: Number.isFinite(Number(stop?.position)) ? Number(stop.position) : index * 100
        }))
        .filter(stop => stop.color)
        .sort((left, right) => left.position - right.position);
    if (!stops.length) {
        stops = [legacyColors.primary, legacyColors.secondary]
            .map((color, index) => ({color: safeColor(color), position: index * 100}))
            .filter(stop => stop.color);
    }
    if (!stops.length) stops = [{color: '#4c97ff', position: 0}, {color: '#9966ff', position: 100}];
    if (stops.length === 1) stops.push({...stops[0], position: 100});
    const rawDirection = Number(legacyColors.gradientDirection ?? accent.direction);
    const direction = Number.isFinite(rawDirection) ? rawDirection : 135;
    const colors = stops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
    return {background: `linear-gradient(${direction}deg, ${colors})`};
};

const ThemePreview = ({className, theme}) => (theme.previewUrl ? (
    <img alt={`${theme.name} theme preview`} className={className} src={theme.previewUrl} />
) : <span className={className} style={gradientStyle(theme)} />);

ThemePreview.propTypes = {
    className: PropTypes.string,
    theme: PropTypes.object.isRequired
};

export {gradientStyle, safeColor};
export default ThemePreview;
