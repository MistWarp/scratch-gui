import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {parse} from '@babel/parser';
import traverseModule from '@babel/traverse';
import {readBlockMessages} from './vite-blocks.mjs';

const require = createRequire(import.meta.url);
const traverse = traverseModule.default || traverseModule;

const stringProperty = (node, name) => {
    const property = node.properties.find(item => (
        item.type === 'ObjectProperty' &&
        (item.key.name === name || item.key.value === name)
    ));
    return property?.value.type === 'StringLiteral' ? property.value.value : null;
};

export const readEditorDefaultMessages = directory => {
    const messages = {};
    const visit = sourceDirectory => {
        for (const entry of fs.readdirSync(sourceDirectory, {withFileTypes: true})) {
            const filename = path.join(sourceDirectory, entry.name);
            if (entry.isDirectory()) {
                if (!['generated', 'ScratchAddons'].includes(entry.name)) visit(filename);
                continue;
            }
            if (entry.name.startsWith('_') || !/\.jsx?$/.test(entry.name)) continue;
            let ast;
            try {
                ast = parse(fs.readFileSync(filename, 'utf8'), {
                    sourceType: 'module',
                    allowAwaitOutsideFunction: true,
                    plugins: ['jsx', 'dynamicImport']
                });
            } catch (error) {
                error.message = `${path.relative(directory, filename)}: ${error.message}`;
                throw error;
            }
            traverse(ast, {
                ObjectExpression ({node}) {
                    const id = stringProperty(node, 'id');
                    const fallback = stringProperty(node, 'defaultMessage');
                    if (id && fallback) messages[id] = fallback;
                },
                JSXOpeningElement ({node}) {
                    if (!['FormattedMessage', 'FormattedHTMLMessage'].includes(node.name.name)) return;
                    const attribute = name => node.attributes.find(item => item.name?.name === name)?.value;
                    const id = attribute('id');
                    const fallback = attribute('defaultMessage');
                    if (id?.type === 'StringLiteral' && fallback?.type === 'StringLiteral') {
                        messages[id.value] = fallback.value;
                    }
                }
            });
        }
    };
    visit(path.join(directory, 'src'));
    return messages;
};

// Split the upstream generated dictionary without executing third-party code.
export const writeEditorLocales = directory => {
    const source = fs.readFileSync(require.resolve('@turbowarp/scratch-l10n/locales/editor-msgs.js'), 'utf8');
    const messages = JSON.parse(source.slice(source.indexOf('{')).replace(/;?\s*$/, ''));
    const additionsPath = path.join(directory, 'src/lib/tw-translations/generated-translations.json');
    const additions = JSON.parse(fs.readFileSync(additionsPath));
    const defaultsPath = path.join(directory, 'src/lib/tw-translations/default-messages.json');
    const defaults = JSON.parse(fs.readFileSync(defaultsPath));
    const output = path.join(directory, 'src/generated/editor-locales');
    fs.mkdirSync(output, {recursive: true});
    const write = (filename, content) => {
        const target = path.join(output, filename);
        if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) fs.writeFileSync(target, content);
    };
    const loaders = [];
    const imports = [];
    for (const [locale, dictionary] of Object.entries(messages)) {
        if (!/^[a-zA-Z0-9-]+$/.test(locale)) throw new Error(`Invalid locale: ${locale}`);
        if (locale === 'en') Object.assign(dictionary, defaults);
        const addonPath = path.join(directory, `src/addons/addons-l10n/${locale.toLowerCase()}.json`);
        if (fs.existsSync(addonPath)) Object.assign(dictionary, JSON.parse(fs.readFileSync(addonPath)));
        Object.assign(dictionary, additions[locale.toLowerCase()] || {});
        if (locale === 'es-419') Object.assign(dictionary, additions.es || {});
        write(`${locale}.json`, JSON.stringify({messages: dictionary, blocks: readBlockMessages(locale)}));
        if (locale !== 'en') {
            const name = `locale${imports.length}`;
            imports.push(`import ${name} from './${locale}.json';`);
            loaders.push(`${JSON.stringify(locale)}: () => Promise.resolve({default: ${name}})`);
        }
    }
    const placeholders = Object.fromEntries(Object.keys(messages).map(locale => [locale, {}]));
    write('index.js', `import english from './en.json';\n` +
        `${imports.join('\n')}\n` +
        `export const messages = ${JSON.stringify(placeholders)};\n` +
        `messages.en = english.messages;\n` +
        `export const blockMessages = ${JSON.stringify(placeholders)};\n` +
        `blockMessages.en = english.blocks;\nexport const loaders = {${loaders.join(',\n')}};\n`);
};
