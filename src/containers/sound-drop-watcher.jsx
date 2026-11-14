import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import DragConstants from '../lib/constants/drag-constants';

class SoundDropWatcher extends React.Component {
    constructor (props) {
        super(props);
        this.hovered = null;
    }
    componentDidUpdate (prevProps) {
        const {dragInfo} = this.props;
        const previous = prevProps.dragInfo;
        if (previous.dragging && !dragInfo.dragging) {
            const sample = this.hovered;
            this.hovered = null;
            this.props.onHover(null);
            if (sample !== null && previous.dragType === DragConstants.SOUND) {
                this.props.onDropSound(previous.index, sample);
            }
            return;
        }
        if (!dragInfo.dragging) return;
        let sample = null;
        if (dragInfo.dragType === DragConstants.SOUND && dragInfo.index !== this.props.soundIndex &&
            dragInfo.currentOffset) {
            sample = this.props.sampleAtPoint(dragInfo.currentOffset.x, dragInfo.currentOffset.y);
        }
        if (sample !== this.hovered) {
            this.hovered = sample;
            this.props.onHover(sample);
        }
    }
    render () {
        return null;
    }
}

SoundDropWatcher.propTypes = {
    dragInfo: PropTypes.shape({
        currentOffset: PropTypes.shape({
            x: PropTypes.number,
            y: PropTypes.number
        }),
        dragType: PropTypes.string,
        dragging: PropTypes.bool,
        index: PropTypes.number
    }).isRequired,
    onDropSound: PropTypes.func.isRequired,
    onHover: PropTypes.func.isRequired,
    sampleAtPoint: PropTypes.func.isRequired,
    soundIndex: PropTypes.number
};

const mapStateToProps = state => ({
    dragInfo: state.scratchGui.assetDrag
});

export {SoundDropWatcher};
export default connect(mapStateToProps)(SoundDropWatcher);
