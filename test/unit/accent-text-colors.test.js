const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../src');
const cssFiles = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'community' ? [] : cssFiles(file);
    return file.endsWith('.css') ? [file] : [];
});

// These sit on a hard-coded white surface in every theme, where the lighter
// accent text would be too pale.
const ON_WHITE = [
    'components/crash-message/crash-message.css',
    'components/record-modal/record-modal.css'
];

describe('editor accent text', () => {
    test('defines the readable accent for text', () => {
        const colors = fs.readFileSync(path.join(root, 'css/colors.css'), 'utf8');
        expect(colors).toMatch(/\$accent-text: var\(--accent-text, var\(--looks-secondary\)\);/);
    });

    test('colours text with the readable accent, not the fill colour', () => {
        const offenders = [];
        for (const file of cssFiles(root)) {
            const relative = path.relative(root, file).split(path.sep)
                .join('/');
            if (ON_WHITE.includes(relative)) continue;
            fs.readFileSync(file, 'utf8').split('\n')
                .forEach((line, index) => {
                    if (/^\s*color\s*:\s*(\$looks-secondary|\$motion-primary|var\(--(looks-secondary|motion-primary)\))\s*(!important)?;/
                        .test(line)) {
                        offenders.push(`${relative}:${index + 1}`);
                    }
                });
        }
        expect(offenders).toEqual([]);
    });
});
