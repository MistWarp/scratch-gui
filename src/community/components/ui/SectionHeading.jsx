import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';

import {useCommunityIntl} from '../../i18n.jsx';
import styles from './SectionHeading.module.css';

const SectionHeading = ({actions, as: Heading, className, count, icon: Icon, id, lead, link, linkLabel, title}) => {
    const {text: communityText} = useCommunityIntl();
    return (
        <div className={classNames(styles.heading, className)}>
            <div className={styles.text}>
                <Heading id={id} className={styles.title}>
                    {Icon ? <Icon size={18} aria-hidden="true" /> : null}
                    <span>{title}</span>
                    {typeof count === 'number' ? <b className={styles.count}>{count}</b> : null}
                </Heading>
                {lead ? <p className={styles.lead}>{lead}</p> : null}
            </div>
            {link ? <Link to={link} className={styles.link}>{linkLabel || communityText('See all')}</Link> : null}
            {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
    );
};

SectionHeading.propTypes = {
    actions: PropTypes.node,
    as: PropTypes.oneOf(['h2', 'h3']),
    className: PropTypes.string,
    count: PropTypes.number,
    icon: PropTypes.elementType,
    id: PropTypes.string,
    lead: PropTypes.node,
    link: PropTypes.string,
    linkLabel: PropTypes.node,
    title: PropTypes.node.isRequired
};

SectionHeading.defaultProps = {
    as: 'h2'
};

export default SectionHeading;
