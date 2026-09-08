import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import LoadingSpinner from '../components/tw-loading-spinner/spinner.jsx';

let realScratchPaint;
let loading;
const emptyState = {};
const PAINT_LOADED = 'scratch-gui/paint/LOADED';

const setScratchPaint = scratchPaint => {
    realScratchPaint = scratchPaint;
};

const loadScratchPaint = () => {
    if (realScratchPaint) return Promise.resolve(realScratchPaint);
    if (!loading) {
        loading = import('scratch-paint').then(paint => {
            setScratchPaint(paint);
            return paint;
        }).catch(error => {
            loading = null;
            throw error;
        });
    }
    return loading;
};

// The paint reducer must be initialized before its connected controls mount.
// Until paint is requested, Redux keeps one stable, empty state object.
const ScratchPaintReducer = (state = emptyState, action) => {
    if (!realScratchPaint) return state;
    return realScratchPaint.ScratchPaintReducer(state === emptyState ? void 0 : state, action);
};

class PaintEditor extends React.Component {
    constructor (props) {
        super(props);
        this.state = {ready: false, error: null};
        this.unmounted = false;
    }
    componentDidMount () {
        loadScratchPaint().then(() => {
            if (this.unmounted) return;
            this.props.onPaintLoaded();
            this.setState({ready: true});
        })
            .catch(error => {
                if (!this.unmounted) this.setState({error});
            });
    }
    componentWillUnmount () {
        this.unmounted = true;
    }
    render () {
        if (this.state.error) throw this.state.error;
        if (!this.state.ready) return React.createElement(LoadingSpinner);
        const {onPaintLoaded, ...props} = this.props;
        return React.createElement(realScratchPaint.default, props);
    }
}
PaintEditor.propTypes = {onPaintLoaded: PropTypes.func.isRequired};

const ConnectedPaintEditor = connect(null, dispatch => ({
    onPaintLoaded: () => dispatch({type: PAINT_LOADED})
}))(PaintEditor);

export {
    ConnectedPaintEditor as default,
    ScratchPaintReducer,
    setScratchPaint,
    loadScratchPaint
};
