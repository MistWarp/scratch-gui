import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {
    Download,
    RotateCcw
} from 'lucide-react';

import Box from '../box/box.jsx';
import Modal from '../../containers/windowed-modal.jsx';
import FlameGraphRenderer from './flame-graph-renderer.js';

const messages = defineMessages({
    title: {
        defaultMessage: 'Flame Graph',
        description: 'Title of flame graph window',
        id: 'mw.flameGraph.title'
    },
    noData: {
        defaultMessage: 'No execution data yet. Run your project to see performance data.',
        description: 'Message when no profiling data is available',
        id: 'mw.flameGraph.noData'
    },
    exportData: {
        defaultMessage: 'Export Data',
        description: 'Button to export profiling data',
        id: 'mw.flameGraph.exportData'
    },
    clearData: {
        defaultMessage: 'Clear Data',
        description: 'Button to clear profiling data',
        id: 'mw.flameGraph.clearData'
    },
    restartNeeded: {
        defaultMessage: 'Performance tracking is disabled. Press the green flag to restart your project with performance tracking enabled.',
        description: 'Message telling user to restart project for performance tracking',
        id: 'mw.flameGraph.restartNeeded'
    },
    trackingEnabled: {
        defaultMessage: 'Performance tracking is enabled. Run your project to see performance data.',
        description: 'Message when performance tracking is enabled',
        id: 'mw.flameGraph.trackingEnabled'
    }
});

const FlameGraph = props => {
    console.log('[FlameGraph] Component rendering, vm:', !!props.vm, 'theme:', !!props.theme);

    const [canvasElement, setCanvasElement] = React.useState(null);
    const rendererRef = React.useRef(null);
    const [stats, setStats] = React.useState({
        timeWindow: 10000,
        totalExecutionTime: 0,
        procedureCount: 0
    });
    const [performanceTrackingReady, setPerformanceTrackingReady] = React.useState(false);
    const [cacheCleared, setCacheCleared] = React.useState(false);

    // Handle canvas mounting
    const handleCanvasRef = React.useCallback((node) => {
        console.log('[FlameGraph] Canvas ref callback - node:', !!node);
        setCanvasElement(node);
    }, []);

    React.useEffect(() => {
        console.log('[FlameGraph] Initializing profiling check');
        console.log('[FlameGraph] VM:', !!props.vm);
        console.log('[FlameGraph] Runtime:', !!props.vm?.runtime);

        if (props.vm && props.vm.runtime) {
            console.log('[FlameGraph] Enabling flame graph on runtime');
            if (props.vm.runtime.setFlameGraphEnabled) {
                props.vm.runtime.setFlameGraphEnabled(true);
                console.log('[FlameGraph] Flame graph enabled, checking if cache was cleared');
                setPerformanceTrackingReady(cacheCleared);
            }

        } else {
            console.error('[FlameGraph] ERROR: VM or runtime not available!');
        }

        return () => {
            console.log('[FlameGraph] Cleanup - disabling profiling and clearing cache');
            if (props.vm && props.vm.runtime) {
                if (props.vm.runtime.setFlameGraphEnabled) {
                    props.vm.runtime.setFlameGraphEnabled(false);
                }
                if (props.vm.runtime.targets) {
                    console.log('[FlameGraph] Clearing compiled cache for all targets');
                    props.vm.runtime.targets.forEach(target => {
                        if (target.blocks && target.blocks.resetCache) {
                            target.blocks.resetCache();
                        }
                    });
                }
                if (props.vm.runtime.flyoutBlocks && props.vm.runtime.flyoutBlocks.resetCache) {
                    props.vm.runtime.flyoutBlocks.resetCache();
                }
                if (props.vm.runtime.monitorBlocks && props.vm.runtime.monitorBlocks.resetCache) {
                    props.vm.runtime.monitorBlocks.resetCache();
                }
            }
            if (rendererRef.current) {
                rendererRef.current.destroy();
                rendererRef.current = null;
            }
            setCacheCleared(false);
        };
    }, [props.vm, cacheCleared]);

    // Listen for green flag press to clear cache
    React.useEffect(() => {
        if (!props.vm || !props.vm.runtime) return;

        const handleGreenFlag = () => {
            console.log('[FlameGraph] Green flag pressed, clearing cache');
            if (props.vm.runtime.targets) {
                props.vm.runtime.targets.forEach(target => {
                    if (target.blocks && target.blocks.resetCache) {
                        target.blocks.resetCache();
                    }
                });
            }
            if (props.vm.runtime.flyoutBlocks && props.vm.runtime.flyoutBlocks.resetCache) {
                props.vm.runtime.flyoutBlocks.resetCache();
            }
            if (props.vm.runtime.monitorBlocks && props.vm.runtime.monitorBlocks.resetCache) {
                props.vm.runtime.monitorBlocks.resetCache();
            }
            setCacheCleared(true);
            setPerformanceTrackingReady(true);
            console.log('[FlameGraph] Cache cleared, performance tracking ready');
        };

        const runtime = props.vm.runtime;
        runtime.on(runtime.PROJECT_START, handleGreenFlag);

        return () => {
            runtime.off(runtime.PROJECT_START, handleGreenFlag);
        };
    }, [props.vm]);

    // Create renderer when canvas becomes available
    React.useEffect(() => {
        console.log('[FlameGraph] Canvas element changed:', !!canvasElement, 'renderer exists:', !!rendererRef.current, 'vm available:', !!props.vm);
        
        if (canvasElement && props.vm && props.vm.runtime) {
            console.log('[FlameGraph] Creating FlameGraphRenderer with canvas, vm and theme');
            const renderer = new FlameGraphRenderer(canvasElement, props.vm, props.theme, (newStats) => {
                console.log('[FlameGraph] Stats callback called with:', newStats);
                setStats(newStats);
            });
            
            if (rendererRef.current) {
                rendererRef.current.destroy();
            }
            rendererRef.current = renderer;
            console.log('[FlameGraph] Renderer created successfully');
        }
    }, [canvasElement, props.vm, props.theme]);

    const handleExport = () => {
        if (rendererRef.current) {
            rendererRef.current.exportData();
        }
    };

    const handleClear = () => {
        if (rendererRef.current) {
            rendererRef.current.clearData();
        }
    };

    return (
        <Modal
            onRequestClose={props.onRequestClose}
            contentLabel={props.intl.formatMessage(messages.title)}
            id={'flameGraphModal'}
            width={1100}
            height={700}
            fullScreen={false}
        >
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: 'var(--ui-modal-background)',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                }}
            >
                <Box
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--ui-black-transparent)',
                        background: 'var(--ui-modal-header-background)'
                    }}
                >
                    <Box
                        style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: 'var(--ui-modal-header-foreground)',
                            margin: 0
                        }}
                    >
                        <FormattedMessage {...messages.title} />
                    </Box>
                    <Box
                        style={{
                            display: 'flex',
                            fontSize: '13px',
                            color: 'var(--ui-modal-foreground)',
                            flexWrap: 'wrap'
                        }}
                    >
                        <span style={{marginRight: '12px'}}>
                            {'⏱ '}{(stats.timeWindow / 1000).toFixed(1)}{'s window'}
                        </span>
                        <span>{'|'}</span>
                        <span style={{marginLeft: '12px', marginRight: '12px'}}>
                            {'Total: '}
                            {(stats.totalExecutionTime / 1000).toFixed(3)}{'s'}
                        </span>
                        <span>{'|'}</span>
                        <span style={{marginLeft: '12px'}}>{stats.procedureCount}{' executions'}</span>
                    </Box>
                </Box>
                {!performanceTrackingReady && (
                    <Box
                        style={{
                            padding: '20px',
                            margin: '10px 12px',
                            background: 'var(--warning)',
                            borderRadius: '6px',
                            border: '1px solid var(--ui-black-transparent)'
                        }}
                    >
                        <FormattedMessage {...messages.restartNeeded} />
                    </Box>
                )}
                {performanceTrackingReady && stats.procedureCount === 0 && (
                    <Box
                        style={{
                            padding: '20px',
                            margin: '10px 12px',
                            background: 'var(--success)',
                            borderRadius: '6px',
                            border: '1px solid var(--ui-black-transparent)'
                        }}
                    >
                        <FormattedMessage {...messages.trackingEnabled} />
                    </Box>
                )}
                <Box
                    style={{
                        flex: 1,
                        overflow: 'hidden',
                        background: 'var(--ui-secondary)',
                        borderRadius: '4px',
                        margin: '10px 12px',
                        border: '1px solid var(--ui-black-transparent)',
                        position: 'relative'
                    }}
                >
                    <canvas
                        id="flamegraph-canvas"
                        ref={handleCanvasRef}
                        style={{
                            display: 'block',
                            width: '100%',
                            height: '100%'
                        }}
                    />
                </Box>
                <Box
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '10px 20px',
                        borderTop: '1px solid var(--ui-black-transparent)',
                        background: 'var(--ui-tertiary)'
                    }}
                >
                    <button
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--ui-black-transparent)',
                            borderRadius: '6px',
                            background: 'var(--input-background)',
                            color: 'var(--ui-modal-foreground)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                        }}
                        onClick={handleClear}
                        onMouseEnter={e => {
                            e.target.style.background = 'var(--ui-black-transparent)';
                        }}
                        onMouseLeave={e => {
                            e.target.style.background = 'var(--input-background)';
                        }}
                    >
                        <RotateCcw
                            size={14}
                            style={{verticalAlign: 'middle', marginRight: '6px'}}
                        />
                        <FormattedMessage {...messages.clearData} />
                    </button>
                    <button
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--ui-black-transparent)',
                            marginLeft: '8px',
                            borderRadius: '6px',
                            background: 'var(--input-background)',
                            color: 'var(--ui-modal-foreground)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                        }}
                        onClick={handleExport}
                        onMouseEnter={e => {
                            e.target.style.background = 'var(--ui-black-transparent)';
                        }}
                        onMouseLeave={e => {
                            e.target.style.background = 'var(--input-background)';
                        }}
                    >
                        <Download
                            size={14}
                            style={{verticalAlign: 'middle', marginRight: '6px'}}
                        />
                        <FormattedMessage {...messages.exportData} />
                    </button>
                </Box>
                <Box
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 20px',
                        borderTop: '1px solid var(--ui-black-transparent)',
                        background: 'var(--ui-tertiary)',
                        fontSize: '12px',
                        color: 'var(--ui-modal-foreground)',
                        flexWrap: 'wrap'
                    }}
                >
                    <span style={{marginRight: '16px'}}>Average Duration:</span>
                    <Box
                        style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            border: '1px solid var(--ui-black-transparent)',
                            background: 'var(--flamegraph-color-fast)',
                            marginRight: '4px'
                        }}
                    />
                    <span style={{marginRight: '12px'}}>&lt; 1ms</span>
                    <Box
                        style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            border: '1px solid var(--ui-black-transparent)',
                            background: 'var(--flamegraph-color-medium-fast)',
                            marginRight: '4px'
                        }}
                    />
                    <span style={{marginRight: '12px'}}>1-5ms</span>
                    <Box
                        style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            border: '1px solid var(--ui-black-transparent)',
                            background: 'var(--flamegraph-color-medium)',
                            marginRight: '4px'
                        }}
                    />
                    <span style={{marginRight: '12px'}}>5-10ms</span>
                    <Box
                        style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            border: '1px solid var(--ui-black-transparent)',
                            background: 'var(--flamegraph-color-medium-slow)',
                            marginRight: '4px'
                        }}
                    />
                    <span style={{marginRight: '12px'}}>10-50ms</span>
                    <Box
                        style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            border: '1px solid var(--ui-black-transparent)',
                            background: 'var(--flamegraph-color-slow)',
                            marginRight: '4px'
                        }}
                    />
                    <span>{'> 50ms'}</span>
                </Box>
            </Box>
        </Modal>
    );
};

FlameGraph.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    vm: PropTypes.object.isRequired,
    theme: PropTypes.object
};

const mapStateToProps = state => ({
    theme: state.scratchGui.theme.theme
});

export default connect(mapStateToProps)(injectIntl(FlameGraph));
