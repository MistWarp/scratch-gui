import bindAll from 'lodash.bindall';
import defaultsDeep from 'lodash.defaultsdeep';
import PropTypes from 'prop-types';
import React from 'react';
import CustomProceduresComponent from '../components/custom-procedures/custom-procedures.jsx';
import LazyScratchBlocks from '../lib/tw-lazy-scratch-blocks';
import {connect} from 'react-redux';

const DEFAULT_COLOR = '#FF6680';

class CustomProcedures extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAddLabel',
            'handleAddBoolean',
            'handleAddTextNumber',
            'handleToggleWarp',
            'handleColorChange',
            'handleCancel',
            'handleKeyDown',
            'handleOk',
            'recenterBlock',
            'setBlocks'
        ]);
        this.state = {
            rtlOffset: 0,
            warp: false,
            color: DEFAULT_COLOR,
            emptyName: false
        };
    }
    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyDown);
    }
    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        if (this.workspace) {
            this.workspace.dispose();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    handleKeyDown (event) {
        const tag = event.target.tagName;
        const inTextField = tag === 'INPUT' || tag === 'TEXTAREA';
        if (event.key === 'Escape' && !inTextField) {
            this.handleCancel();
        } else if (event.key === 'Enter' && !inTextField && tag !== 'BUTTON') {
            this.handleOk();
        }
    }
    setBlocks (blocksRef) {
        if (!blocksRef) return;
        if (this.workspace) return;

        this.blocks = blocksRef;
        const workspaceConfig = defaultsDeep({},
            CustomProcedures.defaultOptions,
            this.props.options,
            {rtl: this.props.isRtl}
        );

        const ScratchBlocks = LazyScratchBlocks.get();
        const oldDefaultToolbox = ScratchBlocks.Blocks.defaultToolbox;
        ScratchBlocks.Blocks.defaultToolbox = null;
        this.workspace = ScratchBlocks.inject(this.blocks, workspaceConfig);
        ScratchBlocks.Blocks.defaultToolbox = oldDefaultToolbox;

        this.mutationRoot = this.workspace.newBlock('procedures_declaration');
        this.mutationRoot.setMovable(false);
        this.mutationRoot.setDeletable(false);
        this.mutationRoot.contextMenu = false;

        this.workspace.addChangeListener(() => {
            if (!this.workspace || !this.mutationRoot || !this.mutationRoot.workspace) return;
            this.mutationRoot.onChangeFn();
            const emptyName = !(this.mutationRoot.procCode_ || '').trim();
            if (emptyName !== this.state.emptyName) {
                this.setState({emptyName});
            }
            this.recenterBlock();
        });
        this.mutationRoot.domToMutation(this.props.mutator);
        this.mutationRoot.initSvg();
        this.mutationRoot.render();

        if (typeof this.mutationRoot.getWarp === 'function') {
            this.setState({warp: this.mutationRoot.getWarp()});
        }
        const customColor = typeof this.mutationRoot.getCustomColor === 'function' &&
            this.mutationRoot.getCustomColor();
        if (customColor) {
            this.setState({color: customColor});
        }

        setTimeout(() => {
            if (this.mutationRoot && this.mutationRoot.workspace) {
                this.mutationRoot.focusLastEditor_();
            }
        });

        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                if (!this.workspace) return;
                this.workspace.resize();
                this.recenterBlock();
            });
            this.resizeObserver.observe(this.blocks);
        }
    }
    recenterBlock () {
        if (!this.workspace || !this.mutationRoot || !this.mutationRoot.workspace) return;
        const metrics = this.workspace.getMetrics();
        const {x, y} = this.mutationRoot.getRelativeToSurfaceXY();
        const dy = (metrics.viewHeight / 2) - (this.mutationRoot.height / 2) - y;
        let dx;
        if (this.props.isRtl) {
            const ltrX = ((metrics.viewWidth / 2) - (this.mutationRoot.width / 2) + 25);
            const mirrorX = x - ((x - this.state.rtlOffset) * 2);
            if (mirrorX === ltrX) {
                return;
            }
            dx = mirrorX - ltrX;
            const midPoint = metrics.viewWidth / 2;
            if (x === 0) {
                if (this.mutationRoot.width < midPoint) {
                    dx = ltrX;
                } else if (this.mutationRoot.width < metrics.viewWidth) {
                    dx = midPoint - ((metrics.viewWidth - this.mutationRoot.width) / 2);
                } else {
                    dx = midPoint + (this.mutationRoot.width - metrics.viewWidth);
                }
                this.mutationRoot.moveBy(dx, dy);
                this.setState({rtlOffset: this.mutationRoot.getRelativeToSurfaceXY().x});
                return;
            }
            if (this.mutationRoot.width > metrics.viewWidth) {
                dx = dx + this.mutationRoot.width - metrics.viewWidth;
            }
        } else {
            dx = (metrics.viewWidth / 2) - (this.mutationRoot.width / 2) - x;
            if (this.mutationRoot.width > metrics.viewWidth) {
                dx = metrics.viewWidth - this.mutationRoot.width - x;
            }
        }
        this.mutationRoot.moveBy(dx, dy);
    }
    handleCancel () {
        this.props.onRequestClose();
    }
    handleOk () {
        if (this.state.emptyName) return;
        const newMutation = this.mutationRoot ? this.mutationRoot.mutationToDom(true) : null;
        if (newMutation && this.state.color.toLowerCase() === DEFAULT_COLOR.toLowerCase()) {
            newMutation.removeAttribute('customcolor');
        }
        this.props.onRequestClose(newMutation);
    }
    handleAddLabel () {
        if (this.mutationRoot) {
            this.mutationRoot.addLabelExternal();
        }
    }
    handleAddBoolean () {
        if (this.mutationRoot) {
            this.mutationRoot.addBooleanExternal();
        }
    }
    handleAddTextNumber () {
        if (this.mutationRoot) {
            this.mutationRoot.addStringNumberExternal();
        }
    }
    handleToggleWarp () {
        if (this.mutationRoot &&
            typeof this.mutationRoot.getWarp === 'function' &&
            typeof this.mutationRoot.setWarp === 'function') {
            const newWarp = !this.mutationRoot.getWarp();
            this.mutationRoot.setWarp(newWarp);
            this.setState({warp: newWarp});
        }
    }
    handleColorChange (event) {
        const newColor = event.target.value;
        this.setState({color: newColor});
        if (this.mutationRoot && typeof this.mutationRoot.setCustomColor === 'function') {
            this.mutationRoot.setCustomColor(newColor);
        }
    }
    render () {
        return (
            <CustomProceduresComponent
                componentRef={this.setBlocks}
                emptyName={this.state.emptyName}
                warp={this.state.warp}
                color={this.state.color}
                onAddBoolean={this.handleAddBoolean}
                onAddLabel={this.handleAddLabel}
                onAddTextNumber={this.handleAddTextNumber}
                onCancel={this.handleCancel}
                onColorChange={this.handleColorChange}
                onOk={this.handleOk}
                onToggleWarp={this.handleToggleWarp}
            />
        );
    }
}

CustomProcedures.propTypes = {
    isRtl: PropTypes.bool,
    mutator: PropTypes.instanceOf(Element),
    onRequestClose: PropTypes.func.isRequired,
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool
    })
};

CustomProcedures.defaultOptions = {
    zoom: {
        controls: false,
        wheel: false,
        startScale: 1
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: 'rgba(140, 140, 140, 0.25)',
        snap: false
    },
    comments: false,
    collapse: false,
    scrollbars: true,
    move: {
        scrollbars: true,
        drag: true,
        wheel: true
    }
};

CustomProcedures.defaultProps = {
    options: CustomProcedures.defaultOptions
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    mutator: state.scratchGui.customProcedures.mutator
});

export default connect(
    mapStateToProps
)(CustomProcedures);
