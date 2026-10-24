import React from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import styles from './Markdown.module.css';

// No raw HTML ever reaches the page: everything is built as React elements,
// and only https:// and same-site /paths become links or images.
const SAFE_URL = '(?:https:\\/\\/[^\\s)]+|\\/(?!\\/)[^\\s)]*)';
const INLINE = new RegExp([
    '(`[^`\\n]+`|\\*\\*[^*\\n]+\\*\\*|__[^_\\n]+__|',
    '\\*[^*\\n]+\\*|_[^_\\n]+_|',
    `!\\[[^\\]\\n]*\\]\\(${SAFE_URL}\\)|`,
    `\\[[^\\]\\n]+\\]\\(${SAFE_URL}\\)|`,
    'https:\\/\\/[^\\s]+)'
].join(''), 'g');
const IMAGE = new RegExp(`^!\\[([^\\]]*)\\]\\((${SAFE_URL})\\)$`);
const LINK = new RegExp(`^\\[([^\\]]+)\\]\\((${SAFE_URL})\\)$`);

// Links off the site open in a new tab without a handle back to this one.
const SafeLink = ({children, href}) => (href.startsWith('/') ?
    <Link to={href}>{children}</Link> :
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
    >{children}</a>);

SafeLink.propTypes = {
    children: PropTypes.node,
    href: PropTypes.string.isRequired
};

const inlineMarkdown = text => String(text || '').split(INLINE).filter(Boolean).map((part, index) => {
    if (/^`[^`]+`$/.test(part)) return <code key={index}>{part.slice(1, -1)}</code>;
    if (/^(?:\*\*|__)[\s\S]+(?:\*\*|__)$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (/^(?:\*|_)[\s\S]+(?:\*|_)$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>;
    const image = part.match(IMAGE);
    if (image) {
        return (<img
            key={index}
            src={image[2]}
            alt={image[1]}
            loading="lazy"
        />);
    }
    const link = part.match(LINK);
    if (link) {
        return (<SafeLink
            key={index}
            href={link[2]}
        >{link[1]}</SafeLink>);
    }
    if (/^https:\/\//.test(part)) {
        const trailing = part.match(/[.,!?)]+$/);
        const href = trailing ? part.slice(0, -trailing[0].length) : part;
        return (
            <React.Fragment key={index}>
                <SafeLink href={href}>{href.replace(/^https:\/\//, '')}</SafeLink>
                {trailing?.[0] || ''}
            </React.Fragment>
        );
    }
    return part;
});

export const markdownBlocks = source => {
    const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index];
        if (!line.trim()) {
            index++;
            continue;
        }
        if (line.startsWith('```')) {
            const language = line.slice(3).trim();
            const content = [];
            index++;
            while (index < lines.length && !lines[index].startsWith('```')) content.push(lines[index++]);
            if (index < lines.length) index++;
            blocks.push({type: 'code', language, text: content.join('\n')});
            continue;
        }
        const heading = line.match(/^(#{1,4})\s+(.+)$/);
        if (heading) {
            blocks.push({type: 'heading', level: heading[1].length, text: heading[2]});
            index++;
            continue;
        }
        if (/^\s*[-*+]\s+/.test(line)) {
            const items = [];
            while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
                items.push(lines[index++].replace(/^\s*[-*+]\s+/, ''));
            }
            blocks.push({type: 'list', ordered: false, items});
            continue;
        }
        if (/^\s*\d+\.\s+/.test(line)) {
            const items = [];
            while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
                items.push(lines[index++].replace(/^\s*\d+\.\s+/, ''));
            }
            blocks.push({type: 'list', ordered: true, items});
            continue;
        }
        if (/^>\s?/.test(line)) {
            const quote = [];
            while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''));
            blocks.push({type: 'quote', text: quote.join('\n')});
            continue;
        }
        if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
            blocks.push({type: 'rule'});
            index++;
            continue;
        }
        const paragraph = [line];
        index++;
        while (index < lines.length && lines[index].trim() &&
            !/^(?:```|#{1,4}\s+|\s*[-*+]\s+|\s*\d+\.\s+|>\s?)/.test(lines[index])) {
            paragraph.push(lines[index++]);
        }
        blocks.push({type: 'paragraph', text: paragraph.join('\n')});
    }
    return blocks;
};

const Markdown = ({children, className = '', headingOffset = 0}) => (
    <div className={`${styles.markdown} ${className}`.trim()}>
        {markdownBlocks(children).map((block, index) => {
            if (block.type === 'heading') {
                const Tag = `h${Math.min(6, block.level + headingOffset)}`;
                return <Tag key={index}>{inlineMarkdown(block.text)}</Tag>;
            }
            if (block.type === 'paragraph' && IMAGE.test(block.text.trim())) {
                return <figure key={index}>{inlineMarkdown(block.text.trim())}</figure>;
            }
            if (block.type === 'code') {
                return <pre key={index}><code data-language={block.language}>{block.text}</code></pre>;
            }
            if (block.type === 'quote') {
                return <blockquote key={index}>{inlineMarkdown(block.text)}</blockquote>;
            }
            if (block.type === 'rule') return <hr key={index} />;
            if (block.type === 'list') {
                const Tag = block.ordered ? 'ol' : 'ul';
                return (
                    <Tag key={index}>
                        {block.items.map((item, itemIndex) => (
                            <li key={itemIndex}>{inlineMarkdown(item)}</li>
                        ))}
                    </Tag>
                );
            }
            return (
                <p key={index}>
                    {block.text.split('\n').map((line, lineIndex) => (
                        <React.Fragment key={lineIndex}>
                            {lineIndex ? <br /> : null}
                            {inlineMarkdown(line)}
                        </React.Fragment>
                    ))}
                </p>
            );
        })}
    </div>
);

Markdown.propTypes = {
    children: PropTypes.string,
    className: PropTypes.string,
    // Inside a page that already has its own h1, a post's # is an h2.
    headingOffset: PropTypes.number
};

export default Markdown;
