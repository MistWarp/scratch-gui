// Math and unit conversion utilities

const startersRegex = /^(what\s+is|what'?s|how\s+much\s+is|convert|calculate|compute|find)\s+/i;

/**
 * @param {string} expression The math expression to evaluate
 * @returns {number | null} The result of the math evaluation, or null if it failed
 */
const evaluateMath = expression => {
    try {
        let cleaned = expression.replace(startersRegex, '');
        cleaned = cleaned.replace(/\s+/g, '');
        if (!/^[0-9+\-*/.()%]+$/.test(cleaned)) {
            return null;
        }
        
        const result = Function(`"use strict"; return (${cleaned})`)();
        
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return result;
        }
    } catch (e) {
        // Invalid expression
    }
    return null;
};

/**
 * @typedef {{names: string[], toBase: (v: number) => number, fromBase?: (v: number) => number}} UnitDef
 * @typedef {{[unit: string]: UnitDef}} UnitCategory
 */

/**
 * @type {Record<string, UnitCategory>}
 */
const unitDefinitions = {
    distance: {
        mm: {names: ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'], toBase: v => v / 1000},
        cm: {names: ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'], toBase: v => v / 100},
        m: {names: ['m', 'meter', 'meters', 'metre', 'metres'], toBase: v => v},
        km: {names: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'], toBase: v => v * 1000},
        in: {names: ['in', 'inch', 'inches', '"'], toBase: v => v * 0.0254},
        ft: {names: ['ft', 'foot', 'feet', "'"], toBase: v => v * 0.3048},
        yd: {names: ['yd', 'yard', 'yards'], toBase: v => v * 0.9144},
        mi: {names: ['mi', 'mile', 'miles'], toBase: v => v * 1609.344}
    },
    temperature: {
        c: {names: ['c', 'celsius', '°c', 'celcius'], toBase: v => v, fromBase: v => v},
        // eslint-disable-next-line max-len
        f: {names: ['f', 'fahrenheit', '°f', 'farenheit'], toBase: v => (v - 32) * 5 / 9, fromBase: v => (v * 9 / 5) + 32},
        k: {names: ['k', 'kelvin'], toBase: v => v - 273.15, fromBase: v => v + 273.15}
    },
    weight: {
        mg: {names: ['mg', 'milligram', 'milligrams'], toBase: v => v / 1000000},
        g: {names: ['g', 'gram', 'grams'], toBase: v => v / 1000},
        kg: {names: ['kg', 'kilogram', 'kilograms', 'kilo', 'kilos'], toBase: v => v},
        oz: {names: ['oz', 'ounce', 'ounces'], toBase: v => v * 0.0283495},
        lb: {names: ['lb', 'lbs', 'pound', 'pounds'], toBase: v => v * 0.453592},
        ton: {names: ['ton', 'tons', 'tonne', 'tonnes'], toBase: v => v * 1000}
    },
    time: {
        ms: {names: ['ms', 'millisecond', 'milliseconds'], toBase: v => v / 1000},
        s: {names: ['s', 'sec', 'second', 'seconds'], toBase: v => v},
        min: {names: ['min', 'minute', 'minutes'], toBase: v => v * 60},
        hr: {names: ['hr', 'hour', 'hours', 'h'], toBase: v => v * 3600},
        day: {names: ['day', 'days', 'd'], toBase: v => v * 86400},
        week: {names: ['week', 'weeks', 'wk'], toBase: v => v * 604800}
    },
    angle: {
        deg: {names: ['deg', 'degree', 'degrees', '°'], toBase: v => v},
        rad: {names: ['rad', 'radian', 'radians'], toBase: v => v * (180 / Math.PI)},
        grad: {names: ['grad', 'gradian', 'gradians'], toBase: v => v * 0.9}
    }
};

/**
 * Try to convert a string to a unit
 * @param {string} input The string to convert
 * @returns {UnitConversionResult | null} The result of the conversion, or null if it failed
 */
const tryUnitConversion = input => {
    let lower = input.toLowerCase().trim();
    
    lower = lower.replace(startersRegex, '');
    
    // Try to extract: number + unit + (in/to) + target unit
    // "5 cm in inches"
    // "5cm in inches"
    // "5 cm to inches"
    // "5 centimeters in inches"
    const patterns = [
        /^([\d.]+)\s*([a-z°'"]+)\s+(?:in|to|as)\s+([a-z°'"]+)$/i,
        /^([\d.]+)\s*([a-z°'"]+)\s+([a-z°'"]+)$/i // fallback: "5 cm inches"
    ];
    
    let match = null;
    for (const pattern of patterns) {
        match = lower.match(pattern);
        if (match) break;
    }
    
    if (!match) return null;
    
    const value = parseFloat(match[1]);
    const fromUnitStr = match[2].trim();
    const toUnitStr = match[3].trim();
    
    if (isNaN(value)) return null;

    for (const [category, units] of Object.entries(unitDefinitions)) {
        let fromUnit = null;
        let toUnit = null;
        
        for (const [_, unit] of Object.entries(units)) {
            if (unit.names.includes(fromUnitStr)) {
                fromUnit = unit;
                break;
            }
        }

        for (const [_, unit] of Object.entries(units)) {
            if (unit.names.includes(toUnitStr)) {
                toUnit = unit;
                break;
            }
        }
        
        if (fromUnit && toUnit) {
            let result;
            
            if (category === 'temperature') {
                const baseValue = fromUnit.toBase(value);
                result = toUnit.fromBase ? toUnit.fromBase(baseValue) : baseValue;
            } else {
                const baseValue = fromUnit.toBase(value);
                result = baseValue / toUnit.toBase(1);
            }
            
            return {
                original: input,
                result: result,
                fromUnit: fromUnit.names[0],
                toUnit: toUnit.names[0],
                category: category
            };
        }
    }
    
    return null;
};

export {
    evaluateMath,
    tryUnitConversion
};
