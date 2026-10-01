import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import {Compass, Search} from 'lucide-react';
import ExploreNav from './ExploreNav.jsx';
import PageHeader from './ui/PageHeader.jsx';
import styles from './ExploreHeader.module.css';

const ExploreHeader = ({active, actions, children, lead}) => {
    const {text: communityText} = useCommunityText();
    return (
        <React.Fragment>
            <PageHeader
                compact
                className={styles.header}
                icon={Compass}
                title={communityText('Explore')}
                actions={actions}
            />
            <ExploreNav active={active} />
            {lead ? <p className={styles.lead}>{lead}</p> : null}
            {children ? <div className={styles.toolbar}>{children}</div> : null}
        </React.Fragment>
    );
};

ExploreHeader.propTypes = {
    actions: PropTypes.node,
    active: PropTypes.string.isRequired,
    children: PropTypes.node,
    lead: PropTypes.node
};

const ExploreSearch = ({ariaLabel, onChange, onSubmit, placeholder, value}) => {
    const field = (
        <React.Fragment>
            <Search size={16} aria-hidden="true" />
            <input
                aria-label={ariaLabel}
                enterKeyHint="search"
                placeholder={placeholder || ariaLabel}
                type="search"
                value={value}
                onChange={event => onChange(event.target.value)}
            />
        </React.Fragment>
    );
    if (!onSubmit) return <div className={styles.search} role="search">{field}</div>;
    return (
        <form
            className={styles.search}
            role="search"
            onSubmit={event => {
                event.preventDefault();
                onSubmit(value);
            }}
        >
            {field}
        </form>
    );
};

ExploreSearch.propTypes = {
    ariaLabel: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    placeholder: PropTypes.string,
    value: PropTypes.string.isRequired
};

export {ExploreSearch};
export default ExploreHeader;
