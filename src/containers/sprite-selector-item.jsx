import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {setHoveredSprite} from '../reducers/hovered-target';
import {updateAssetDrag} from '../reducers/asset-drag';
import VM from 'scratch-vm';
import getCostumeUrl from '../lib/utils/get-costume-url';
import DragRecognizer from '../lib/utils/drag-recognizer.js';
import {getEventXY} from '../lib/utils/touch';
import {usersInSprite, usersOnAsset} from '../lib/collaboration/presence-selectors.js';

import SpriteSelectorItemComponent from '../components/sprite-selector-item/sprite-selector-item.jsx';

class SpriteSelectorItem extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'getCostumeData',
            'setRef',
            'handleClick',
            'handleDelete',
            'handleDuplicate',
            'handleExport',
            'handleRename',
            'handleMouseEnter',
            'handleMouseLeave',
            'handleMouseDown',
            'handleDragEnd',
            'handleDrag',
            'handleTouchEnd'
        ]);

        this.dragRecognizer = new DragRecognizer({
            onDrag: this.handleDrag,
            onDragEnd: this.handleDragEnd
        });
    }
    componentDidMount () {
        document.addEventListener('touchend', this.handleTouchEnd);
    }
    componentWillUnmount () {
        document.removeEventListener('touchend', this.handleTouchEnd);
        this.dragRecognizer.reset();
    }
    getCostumeData () {
        if (this.props.costumeURL) return this.props.costumeURL;
        if (!this.props.asset) return null;

        return getCostumeUrl(this.props.asset);
    }
    handleDragEnd () {
        if (this.props.dragging) {
            this.props.onDrag({
                img: null,
                currentOffset: null,
                dragging: false,
                dragType: null,
                index: null
            });
        }
        setTimeout(() => {
            this.noClick = false;
        });
    }
    handleDrag (currentOffset) {
        this.props.onDrag({
            img: this.getCostumeData(),
            currentOffset: currentOffset,
            dragging: true,
            dragType: this.props.dragType,
            index: this.props.index,
            payload: this.props.dragPayload
        });
        this.noClick = true;
    }
    handleTouchEnd (e) {
        if (!this.ref) return;
        const {x, y} = getEventXY(e);
        const {top, left, bottom, right} = this.ref.getBoundingClientRect();
        if (x >= left && x <= right && y >= top && y <= bottom) {
            this.handleMouseEnter();
        }
    }
    handleMouseDown (e) {
        this.dragRecognizer.start(e);
    }
    handleClick (e) {
        e.preventDefault();
        if (!this.noClick) {
            this.props.onClick(this.props.id);
        }
    }
    handleDelete (e) {
        e.stopPropagation(); // To prevent from bubbling back to handleClick
        this.props.onDeleteButtonClick(this.props.id);
    }
    handleDuplicate (e) {
        e.stopPropagation(); // To prevent from bubbling back to handleClick
        this.props.onDuplicateButtonClick(this.props.id);
    }
    handleExport (e) {
        e.stopPropagation();
        this.props.onExportButtonClick(this.props.id);
    }
    handleRename (e) {
        e.stopPropagation();
        this.props.onRenameButtonClick(this.props.id);
    }
    handleMouseLeave () {
        this.props.dispatchSetHoveredSprite(null);
    }
    handleMouseEnter () {
        // Ensure id is a string before passing to dispatchSetHoveredSprite
        const spriteId = typeof this.props.id === 'string' ? this.props.id : String(this.props.id);
        this.props.dispatchSetHoveredSprite(spriteId);
    }
    setRef (component) {
        // Access the DOM node using .elem because it is going through ContextMenuTrigger
        this.ref = component && component.elem;
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            asset,
            id,
            index,
            onClick,
            onDeleteButtonClick,
            onDuplicateButtonClick,
            onExportButtonClick,
            onRenameButtonClick,
            dragPayload,
            receivedBlocks,
            costumeURL,
            vm,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return (
            <SpriteSelectorItemComponent
                componentRef={this.setRef}
                costumeURL={this.getCostumeData()}
                preventContextMenu={this.dragRecognizer.gestureInProgress()}
                onClick={this.handleClick}
                onDeleteButtonClick={onDeleteButtonClick ? this.handleDelete : null}
                onDuplicateButtonClick={onDuplicateButtonClick ? this.handleDuplicate : null}
                onExportButtonClick={onExportButtonClick ? this.handleExport : null}
                onRenameButtonClick={onRenameButtonClick ? this.handleRename : null}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                {...props}
            />
        );
    }
}

SpriteSelectorItem.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    asset: PropTypes.any,
    costumeURL: PropTypes.string,
    dispatchSetHoveredSprite: PropTypes.func.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    dragPayload: PropTypes.any,
    dragType: PropTypes.string,
    dragging: PropTypes.bool,
    editingUsers: PropTypes.arrayOf(PropTypes.shape({
        userId: PropTypes.string,
        username: PropTypes.string,
        handle: PropTypes.string
    })),
    // eslint-disable-next-line react/forbid-prop-types
    id: PropTypes.any,
    index: PropTypes.number,
    // eslint-disable-next-line react/forbid-prop-types
    name: PropTypes.any,
    onClick: PropTypes.func,
    onDeleteButtonClick: PropTypes.func,
    onRenameButtonClick: PropTypes.func,
    onDrag: PropTypes.func.isRequired,
    onDuplicateButtonClick: PropTypes.func,
    onExportButtonClick: PropTypes.func,
    receivedBlocks: PropTypes.bool.isRequired,
    selected: PropTypes.bool,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = (state, {id}) => {
    const activity = state.scratchGui.collaboration.activity || {};
    const vm = state.scratchGui.vm;
    const editingTarget = vm && vm.editingTarget;
    const editorTab = state.scratchGui.editorTab;

    // The same component backs the sprite list (string id) and the costume and
    // sound lists (numeric index). For an asset, "who else is on it" means
    // whoever has the open sprite's list at this index — and since only the
    // active tab's list is on screen, that tab identifies which list it is.
    const editingUsers = typeof id === 'string' ?
        usersInSprite(activity, id) :
        usersOnAsset(
            activity,
            editingTarget ? editingTarget.id : null,
            editorTab ? editorTab.activeTabIndex : 0,
            id
        );

    return {
        dragging: state.scratchGui.assetDrag.dragging,
        receivedBlocks: state.scratchGui.hoveredTarget.receivedBlocks &&
                state.scratchGui.hoveredTarget.sprite === id,
        editingUsers,
        vm
    };
};
const mapDispatchToProps = dispatch => ({
    dispatchSetHoveredSprite: spriteId => {
        dispatch(setHoveredSprite(spriteId));
    },
    onDrag: data => dispatch(updateAssetDrag(data))
});

const ConnectedComponent = connect(
    mapStateToProps,
    mapDispatchToProps
)(SpriteSelectorItem);

export {SpriteSelectorItem};
export default ConnectedComponent;
