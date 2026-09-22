import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';

import {useCommunityIntl} from '../../i18n.jsx';
import styles from './PageHeader.module.css';

const PageHeader = ({actions, backLabel, backTo, children, className, compact, icon: Icon, lead, title}) => {
    const {text: communityText} = useCommunityIntl();
    return (
        <header className={classNames(styles.header, {[styles.compact]: compact}, className)}>
            {backTo ? (
                <Link to={backTo} className={styles.back}>
                    <ArrowLeft size={15} />
                    {backLabel || communityText('Back')}
                </Link>
            ) : null}
            <div className={styles.row}>
                <div className={styles.text}>
                    <h1 className={styles.title}>
                        {Icon ? <Icon size={26} aria-hidden="true" /> : null}
                        <span>{title}</span>
                    </h1>
                    {lead ? <p className={styles.lead}>{lead}</p> : null}
                </div>
                {actions ? <div className={styles.actions}>{actions}</div> : null}
            </div>
            {children}
        </header>
    );
};

PageHeader.propTypes = {
    actions: PropTypes.node,
    backLabel: PropTypes.node,
    backTo: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
    compact: PropTypes.bool,
    icon: PropTypes.elementType,
    lead: PropTypes.node,
    title: PropTypes.node.isRequired
};

PageHeader.defaultProps = {
    compact: false
};

export default PageHeader;
