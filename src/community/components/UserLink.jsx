import PropTypes from 'prop-types';
import React from 'react';
import {Link, useInRouterContext} from 'react-router-dom';

const UserLink = ({children, username, ...props}) => {
    const inRouter = useInRouterContext();
    const name = String(username || '').trim();
    const content = children || name;
    if (!name) return <span {...props}>{content}</span>;
    const href = `/users/${encodeURIComponent(name)}`;
    return inRouter ? <Link to={href} {...props}>{content}</Link> : <a href={href} {...props}>{content}</a>;
};

UserLink.propTypes = {
    children: PropTypes.node,
    username: PropTypes.string
};

UserLink.defaultProps = {
    children: null,
    username: ''
};

export default UserLink;
