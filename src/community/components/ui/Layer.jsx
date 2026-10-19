import PropTypes from 'prop-types';
import React, {createContext, useContext} from 'react';
import {createPortal} from 'react-dom';

const LayerScopeContext = createContext('');

const Layer = ({children}) => {
    const scope = useContext(LayerScopeContext);
    if (typeof document === 'undefined' || !document.body) return children;
    return createPortal(scope ? <div className={scope}>{children}</div> : children, document.body);
};

Layer.propTypes = {
    children: PropTypes.node
};

export {LayerScopeContext};
export default Layer;
