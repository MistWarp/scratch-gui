import PropTypes from 'prop-types';
import React from 'react';
import {MemoryRouter} from 'react-router-dom';

import {UserProvider} from '../../community/UserContext.jsx';
import styles from './community-scope.css';

const openAnchorInNewTab = e => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) {
        return;
    }
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    const url = /^https?:/.test(href) ? href : window.location.origin + href;
    window.open(url, '_blank', 'noopener');
};

const CommunityScope = ({children, initialPath, linksInNewTab}) => (
    <div
        className={styles.scope}
        onClickCapture={linksInNewTab ? openAnchorInNewTab : null}
    >
        <UserProvider>
            <MemoryRouter initialEntries={[initialPath || '/']}>
                {children}
            </MemoryRouter>
        </UserProvider>
    </div>
);

CommunityScope.propTypes = {
    children: PropTypes.node,
    initialPath: PropTypes.string,
    linksInNewTab: PropTypes.bool
};

export default CommunityScope;
