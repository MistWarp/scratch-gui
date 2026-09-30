import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {updateAssetDrag} from '../reducers/asset-drag';
import DragConstants from '../lib/constants/drag-constants';
import DragRecognizer from '../lib/utils/drag-recognizer.js';
import BackpackItemComponent from '../components/backpack/backpack-item.jsx';

const dragTypeMap = {
    costume: DragConstants.BACKPACK_COSTUME,
    sound: DragConstants.BACKPACK_SOUND,
    script: DragConstants.BACKPACK_CODE,
    sprite: DragConstants.BACKPACK_SPRITE
};

class BackpackItem extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleMouseDown',
            'handleDrag',
            'handleDragEnd'
        ]);
        this.noClick = false;
        this.dragRecognizer = new DragRecognizer({
            onDrag: this.handleDrag,
            onDragEnd: this.handleDragEnd
        });
    }
    componentWillUnmount () {
        this.dragRecognizer.reset();
    }
    handleDrag (currentOffset) {
        this.props.onDrag({
            img: this.props.item.thumbnailUrl,
            currentOffset: currentOffset,
            dragging: true,
            dragType: dragTypeMap[this.props.item.type],
            index: null,
            payload: this.props.item
        });
        this.noClick = true;
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
    handleMouseDown (e) {
        if (this.props.renaming) return;
        this.dragRecognizer.start(e);
    }
    handleClick (id) {
        if (this.noClick) return;
        this.props.onClick(id);
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            dragging,
            onDrag,
            onClick,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return (
            <BackpackItemComponent
                preventContextMenu={this.dragRecognizer.gestureInProgress()}
                onClick={this.handleClick}
                onMouseDown={this.handleMouseDown}
                {...props}
            />
        );
    }
}

BackpackItem.propTypes = {
    dragging: PropTypes.bool,
    item: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        thumbnailUrl: PropTypes.string,
        type: PropTypes.string
    }).isRequired,
    onClick: PropTypes.func.isRequired,
    onDrag: PropTypes.func.isRequired,
    renaming: PropTypes.bool
};

const mapStateToProps = state => ({
    dragging: state.scratchGui.assetDrag.dragging
});

const mapDispatchToProps = dispatch => ({
    onDrag: data => dispatch(updateAssetDrag(data))
});

export {BackpackItem};
export default connect(mapStateToProps, mapDispatchToProps)(BackpackItem);
