const hslToRgb = (h, s, l) => {
    const chroma = (1 - Math.abs((2 * l) - 1)) * s;
    const huePrime = ((h % 360) + 360) % 360 / 60;
    const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
    const [r, g, b] = huePrime < 1 ? [chroma, x, 0] :
        huePrime < 2 ? [x, chroma, 0] :
            huePrime < 3 ? [0, chroma, x] :
                huePrime < 4 ? [0, x, chroma] :
                    huePrime < 5 ? [x, 0, chroma] : [chroma, 0, x];
    const m = l - (chroma / 2);
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};

const oklabToRgb = (l, a, b) => {
    const lPrime = l + (0.3963377774 * a) + (0.2158037573 * b);
    const mPrime = l - (0.1055613458 * a) - (0.0638541728 * b);
    const sPrime = l - (0.0894841775 * a) - (1.291485548 * b);

    const lLinear = lPrime * lPrime * lPrime;
    const mLinear = mPrime * mPrime * mPrime;
    const sLinear = sPrime * sPrime * sPrime;
    const linearRgb = [
        (4.0767416621 * lLinear) - (3.3077115913 * mLinear) + (0.2309699292 * sLinear),
        (-1.2684380046 * lLinear) + (2.6097574011 * mLinear) - (0.3413193965 * sLinear),
        (-0.0041960863 * lLinear) - (0.7034186147 * mLinear) + (1.707614701 * sLinear)
    ];
    return linearRgb.map(channel => {
        const value = channel <= 0.0031308 ?
            12.92 * channel :
            (1.055 * Math.pow(channel, 1 / 2.4)) - 0.055;
        return Math.min(255, Math.max(0, value * 255));
    });
};

/**
 * @param {string} color a CSS hex, rgb(a), hsl(a), or oklab color
 * @returns {?Array.<number>} red, green, and blue channels from 0 to 255
 */
const parseColor = color => {
    if (typeof color !== 'string') return null;
    const value = color.trim();

    const hex = value.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
        let digits = hex[1];
        if (digits.length === 3 || digits.length === 4) {
            digits = digits.split('').map(channel => channel + channel)
                .join('');
        }
        if (digits.length < 6) return null;
        return [0, 2, 4].map(index => parseInt(digits.substr(index, 2), 16));
    }

    const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) {
        const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
        if (parts.length < 3) return null;
        const channels = parts.slice(0, 3).map(part => (
            part.endsWith('%') ? (parseFloat(part) / 100) * 255 : parseFloat(part)
        ));
        return channels.every(Number.isFinite) ? channels : null;
    }

    const hsl = value.match(/^hsla?\(([^)]+)\)$/i);
    if (hsl) {
        const parts = hsl[1].split(/[\s,/]+/).filter(Boolean);
        if (parts.length < 3) return null;
        const channels = hslToRgb(
            parseFloat(parts[0]),
            parseFloat(parts[1]) / 100,
            parseFloat(parts[2]) / 100
        );
        return channels.every(Number.isFinite) ? channels : null;
    }

    const oklab = value.match(/^oklab\(\s*([+-]?[\d.]+%?)\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)/i);
    if (oklab) {
        const lightness = oklab[1].endsWith('%') ? parseFloat(oklab[1]) / 100 : parseFloat(oklab[1]);
        return oklabToRgb(lightness, parseFloat(oklab[2]), parseFloat(oklab[3]));
    }

    return null;
};

const relativeLuminance = rgb => {
    const [r, g, b] = rgb.map(channel => {
        const value = Math.min(255, Math.max(0, channel)) / 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
};

const contrastRatio = (first, second) => {
    const firstRgb = Array.isArray(first) ? first : parseColor(first);
    const secondRgb = Array.isArray(second) ? second : parseColor(second);
    if (!firstRgb || !secondRgb) return null;
    const lighter = Math.max(relativeLuminance(firstRgb), relativeLuminance(secondRgb));
    const darker = Math.min(relativeLuminance(firstRgb), relativeLuminance(secondRgb));
    return (lighter + 0.05) / (darker + 0.05);
};

const mix = (from, to, amount) => from.map((channel, index) => channel + ((to[index] - channel) * amount));

const closestContrastingMix = (color, background, target, minimumRatio) => {
    if (contrastRatio(target, background) < minimumRatio) return null;
    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 16; iteration++) {
        const middle = (low + high) / 2;
        if (contrastRatio(mix(color, target, middle), background) >= minimumRatio) {
            high = middle;
        } else {
            low = middle;
        }
    }
    return {amount: high, color: mix(color, target, high), target};
};

/**
 * Keep an accent visible against a surface by nudging it toward black or white.
 * Colors that already meet the requested ratio are returned unchanged.
 *
 * @param {string} color accent color
 * @param {string} background surface color
 * @param {number} minimumRatio requested contrast ratio
 * @returns {string} original or adjusted CSS color
 */
const ensureColorContrast = (color, background, minimumRatio = 3) => {
    const parsedColor = parseColor(color);
    const parsedBackground = parseColor(background);
    if (!parsedColor || !parsedBackground || contrastRatio(parsedColor, parsedBackground) >= minimumRatio) {
        return color;
    }

    const candidates = [
        closestContrastingMix(parsedColor, parsedBackground, [0, 0, 0], minimumRatio),
        closestContrastingMix(parsedColor, parsedBackground, [255, 255, 255], minimumRatio)
    ].filter(Boolean).sort((first, second) => first.amount - second.amount);

    if (candidates.length === 0) return color;
    const selected = candidates[0];
    const rounded = selected.color.map(channel => Math.round(channel));
    while (contrastRatio(rounded, parsedBackground) < minimumRatio) {
        rounded.forEach((channel, index) => {
            rounded[index] = channel + Math.sign(selected.target[index] - channel);
        });
    }
    return `rgb(${rounded.join(', ')})`;
};

export {
    parseColor,
    contrastRatio,
    ensureColorContrast
};
