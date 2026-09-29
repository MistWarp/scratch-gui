import React from 'react';
import PropTypes from 'prop-types';
import {DOCS_BASE} from '../../lib/help/index.js';

const DOCS_PAGES = {
    'custom-fps': 'advanced/custom-fps',
    'custom-stage-size': 'advanced/custom-stage-size',
    'disable-compiler': 'advanced/disable-compiler',
    'high-quality-pen': 'advanced/high-quality-pen',
    'infinite-clones': 'advanced/infinite-clones',
    'interpolation': 'advanced/interpolation',
    'remove-fencing': 'advanced/remove-fencing',
    'remove-misc-limits': 'advanced/remove-limits',
    'warp-timer': 'advanced/warp-timer'
};

const documentationURL = slug => {
    const page = DOCS_PAGES[slug];
    return page ? `${DOCS_BASE}/${page}/` : `${DOCS_BASE}/`;
};

const DocumentationLink = ({slug, children}) => (
    <a
        href={documentationURL(slug)}
        target="_blank"
        rel="noopener noreferrer"
    >
        {children}
    </a>
);
DocumentationLink.propTypes = {
    slug: PropTypes.string,
    children: PropTypes.node
};

export {documentationURL};
export default DocumentationLink;
