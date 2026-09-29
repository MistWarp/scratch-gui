import React from 'react';
import PropTypes from 'prop-types';

import BackpackDrawer from './backpack-drawer.jsx';
import BackpackStrip from './backpack-strip.jsx';
import {LAYOUTS, DEFAULT_LAYOUT, FILTERS} from '../../lib/backpack/layout.js';

const noop = () => {};

const Backpack = props => {
    const Layout = props.layout === 'strip' ? BackpackStrip : BackpackDrawer;
    return <Layout {...props} />;
};

Backpack.propTypes = {
    busyId: PropTypes.string,
    canRename: PropTypes.bool,
    canToggle: PropTypes.bool,
    contents: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        thumbnailUrl: PropTypes.string,
        type: PropTypes.string,
        name: PropTypes.string
    })),
    dragActive: PropTypes.bool,
    dragOver: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    expanded: PropTypes.bool,
    filter: PropTypes.oneOf(FILTERS),
    handleRef: PropTypes.func,
    height: PropTypes.number,
    layout: PropTypes.oneOf(LAYOUTS),
    loading: PropTypes.bool,
    notice: PropTypes.string,
    panelRef: PropTypes.func,
    pinned: PropTypes.bool,
    renamingId: PropTypes.string,
    searchQuery: PropTypes.string,
    showMore: PropTypes.bool,
    totalCount: PropTypes.number,
    onClose: PropTypes.func,
    onDelete: PropTypes.func,
    onFilterChange: PropTypes.func,
    onInsert: PropTypes.func,
    onLayoutChange: PropTypes.func,
    onMore: PropTypes.func,
    onOpen: PropTypes.func,
    onPanelKeyDown: PropTypes.func,
    onPinToggle: PropTypes.func,
    onRenameCancel: PropTypes.func,
    onRenameStart: PropTypes.func,
    onRenameSubmit: PropTypes.func,
    onResizePointerDown: PropTypes.func,
    onSearchChange: PropTypes.func,
    onToggle: PropTypes.func
};

Backpack.defaultProps = {
    canRename: false,
    canToggle: true,
    contents: [],
    dragActive: false,
    dragOver: false,
    error: false,
    expanded: false,
    filter: 'all',
    height: null,
    layout: DEFAULT_LAYOUT,
    loading: false,
    notice: null,
    pinned: false,
    searchQuery: '',
    showMore: false,
    totalCount: 0,
    onClose: noop,
    onDelete: noop,
    onFilterChange: noop,
    onInsert: noop,
    onLayoutChange: noop,
    onMore: noop,
    onOpen: noop,
    onPinToggle: noop,
    onRenameCancel: noop,
    onRenameStart: noop,
    onRenameSubmit: noop,
    onResizePointerDown: noop,
    onSearchChange: noop,
    onToggle: noop
};

export default Backpack;
