import PropTypes from 'prop-types';
import React from 'react';
import {
    Blocks,
    CheckCircle2,
    ChevronRight,
    FileCode2,
    GitBranch,
    Image,
    Layers3,
    LayoutDashboard,
    Lightbulb,
    Music,
    RefreshCw,
    Repeat2,
    Shapes,
    Zap
} from 'lucide-react';

import {
    ModalSidebar,
    ModalSidebarContent,
    ModalSidebarFooter,
    ModalSidebarItem,
    ModalSidebarLayout
} from '../modal-sidebar/modal-sidebar.jsx';
import {analyzeProject, humanizeOpcode} from '../../lib/menu-bar/project-analysis-data.js';
import styles from './project-analysis.module.css';

const CATEGORY_COLORS = {
    motion: '#4c97ff',
    looks: '#9966ff',
    sound: '#cf63cf',
    event: '#ffbf00',
    control: '#ffab19',
    sensing: '#5cb1d6',
    operators: '#59c059',
    data: '#ff8c1a',
    procedures: '#ff6680',
    pen: '#0fbd8c'
};

const KNOWN_CATEGORIES = new Set(Object.keys(CATEGORY_COLORS));

const categoryLabel = (category, msg) => (
    KNOWN_CATEGORIES.has(category) ? msg(`category-${category}`) : humanizeOpcode(category)
);

const levelFor = score => {
    if (score >= 60) return {id: 'high', label: 'level-high'};
    if (score >= 30) return {id: 'medium', label: 'level-medium'};
    return {id: 'low', label: 'level-low'};
};

const PageHeader = ({subtitle, title}) => (
    <header className={styles.pageHeader}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
    </header>
);

PageHeader.propTypes = {
    subtitle: PropTypes.node,
    title: PropTypes.node.isRequired
};

const EmptyState = ({help, icon: Icon, title}) => (
    <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>
            <Icon size={26} />
        </span>
        <strong>{title}</strong>
        <p>{help}</p>
    </div>
);

EmptyState.propTypes = {
    help: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired
};

const MetricTile = ({icon: Icon, label, value}) => (
    <div className={styles.metricTile}>
        <Icon
            className={styles.metricIcon}
            size={16}
        />
        <strong className={styles.metricValue}>{value}</strong>
        <span className={styles.metricLabel}>{label}</span>
    </div>
);

MetricTile.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

const SectionHeading = ({children, icon: Icon}) => (
    <h2 className={styles.sectionHeading}>
        <Icon size={16} />
        {children}
    </h2>
);

SectionHeading.propTypes = {
    children: PropTypes.node.isRequired,
    icon: PropTypes.elementType.isRequired
};

const ProjectAnalysis = ({msg, onShowScript, vm}) => {
    const [metrics, setMetrics] = React.useState(() => analyzeProject(vm.runtime));
    const [section, setSection] = React.useState('overview');

    React.useEffect(() => {
        let timer = null;
        const scheduleRefresh = () => {
            clearTimeout(timer);
            timer = setTimeout(() => setMetrics(analyzeProject(vm.runtime)), 300);
        };
        vm.on('PROJECT_CHANGED', scheduleRefresh);
        vm.runtime.on('PROJECT_LOADED', scheduleRefresh);
        return () => {
            clearTimeout(timer);
            vm.off('PROJECT_CHANGED', scheduleRefresh);
            vm.runtime.off('PROJECT_LOADED', scheduleRefresh);
        };
    }, [vm]);

    const refresh = React.useCallback(() => {
        setMetrics(analyzeProject(vm.runtime));
    }, [vm]);

    const handleSectionClick = React.useCallback(event => {
        setSection(event.currentTarget.value);
    }, []);

    const handleScriptClick = React.useCallback(event => {
        const {scriptId, targetId} = event.currentTarget.dataset;
        const script = metrics.scripts.find(item => item.id === scriptId && item.targetId === targetId);
        if (script) onShowScript(script);
    }, [metrics.scripts, onShowScript]);

    const hasBlocks = metrics.blockCount > 0;
    const level = levelFor(metrics.complexityScore);
    const sprites = metrics.targets.filter(target => !target.isStage);
    const sections = [
        {
            id: 'overview',
            label: msg('overview'),
            icon: LayoutDashboard
        },
        {
            id: 'code',
            label: msg('code'),
            icon: Blocks,
            ...(metrics.blockCount ? {count: metrics.blockCount} : {})
        },
        {
            id: 'scripts',
            label: msg('total-scripts'),
            icon: FileCode2,
            ...(metrics.scriptCount ? {count: metrics.scriptCount} : {})
        },
        {
            id: 'sprites',
            label: msg('total-sprites'),
            icon: Shapes,
            ...(metrics.spriteCount ? {count: metrics.spriteCount} : {})
        }
    ];

    const largestCategory = metrics.categories.length ? metrics.categories[0][1] : 1;
    let page = null;

    if (section === 'code') {
        page = (
            <React.Fragment>
                <PageHeader title={msg('code')} />
                {hasBlocks ? (
                    <React.Fragment>
                        <div className={styles.metricGrid}>
                            <MetricTile
                                icon={Zap}
                                label={msg('event-blocks')}
                                value={metrics.eventCount}
                            />
                            <MetricTile
                                icon={Repeat2}
                                label={msg('loop-blocks')}
                                value={metrics.loopCount}
                            />
                            <MetricTile
                                icon={GitBranch}
                                label={msg('conditional-blocks')}
                                value={metrics.conditionalCount}
                            />
                            <MetricTile
                                icon={Blocks}
                                label={msg('custom-blocks')}
                                value={metrics.customDefinitionCount}
                            />
                        </div>

                        <section className={styles.panel}>
                            <SectionHeading icon={Blocks}>
                                {msg('block-distribution')}
                            </SectionHeading>
                            <div className={styles.bars}>
                                {metrics.categories.map(([category, count]) => (
                                    <div
                                        className={styles.barRow}
                                        key={category}
                                    >
                                        <span className={styles.barLabel}>
                                            {categoryLabel(category, msg)}
                                        </span>
                                        <span className={styles.barTrack}>
                                            <span
                                                className={styles.barFill}
                                                style={{
                                                    '--bar-color': CATEGORY_COLORS[category],
                                                    'width': `${(count / largestCategory) * 100}%`
                                                }}
                                            />
                                        </span>
                                        <strong className={styles.barValue}>{count}</strong>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </React.Fragment>
                ) : (
                    <EmptyState
                        help={msg('empty-code-help')}
                        icon={Blocks}
                        title={msg('empty-code-title')}
                    />
                )}
            </React.Fragment>
        );
    } else if (section === 'scripts') {
        page = (
            <React.Fragment>
                <PageHeader
                    subtitle={metrics.scripts.length ? msg('scripts-help') : null}
                    title={msg('total-scripts')}
                />
                {metrics.scripts.length ? (
                    <div className={styles.list}>
                        {metrics.scripts.slice(0, 8).map(script => (
                            <button
                                className={styles.row}
                                data-script-id={script.id}
                                data-target-id={script.targetId}
                                key={`${script.targetId}-${script.id}`}
                                type="button"
                                onClick={handleScriptClick}
                            >
                                <span className={styles.rowIcon}>
                                    <FileCode2 size={16} />
                                </span>
                                <span className={styles.rowMain}>
                                    <strong>{script.targetName}</strong>
                                    <small>{script.label}</small>
                                </span>
                                <span className={styles.chip}>
                                    {msg('blocks-value', {count: script.length})}
                                </span>
                                <span className={styles.chip}>
                                    {msg('depth-value', {count: script.maxDepth})}
                                </span>
                                <ChevronRight
                                    className={styles.rowChevron}
                                    size={16}
                                />
                            </button>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        help={msg('empty-scripts-help')}
                        icon={FileCode2}
                        title={msg('empty-scripts-title')}
                    />
                )}
            </React.Fragment>
        );
    } else if (section === 'sprites') {
        page = (
            <React.Fragment>
                <PageHeader title={msg('total-sprites')} />
                {sprites.length ? (
                    <div className={styles.list}>
                        {sprites.map(sprite => (
                            <div
                                className={styles.row}
                                key={sprite.id}
                            >
                                <span className={styles.rowIcon}>
                                    <Shapes size={16} />
                                </span>
                                <span className={styles.rowMain}>
                                    <strong>{sprite.name}</strong>
                                </span>
                                <span className={styles.chip}>
                                    {msg('blocks-value', {count: sprite.blocks})}
                                </span>
                                <span className={styles.chip}>
                                    {msg('scripts-value', {count: sprite.scripts})}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        help={msg('empty-sprites-help')}
                        icon={Shapes}
                        title={msg('empty-sprites-title')}
                    />
                )}
            </React.Fragment>
        );
    } else {
        page = (
            <React.Fragment>
                <PageHeader
                    subtitle={hasBlocks ? msg('summary-inline', {
                        blocks: metrics.blockCount,
                        sprites: metrics.spriteCount,
                        scripts: metrics.scriptCount
                    }) : null}
                    title={msg('overview')}
                />
                {hasBlocks ? (
                    <React.Fragment>
                        <section className={`${styles.scoreCard} ${styles[`level-${level.id}`]}`}>
                            <div
                                className={styles.scoreRing}
                                style={{'--score': `${metrics.complexityScore}%`}}
                                title={msg('score-help')}
                            >
                                <span className={styles.scoreCenter}>
                                    <strong>{metrics.complexityScore}</strong>
                                    <small>{msg('out-of-100')}</small>
                                </span>
                            </div>
                            <div className={styles.scoreText}>
                                <span className={styles.scoreLabel}>{msg('complexity-score')}</span>
                                <strong className={styles.scoreLevel}>
                                    {msg('level-summary', {level: msg(level.label)})}
                                </strong>
                            </div>
                        </section>

                        <div className={styles.metricGrid}>
                            <MetricTile
                                icon={Blocks}
                                label={msg('total-blocks')}
                                value={metrics.blockCount}
                            />
                            <MetricTile
                                icon={FileCode2}
                                label={msg('total-scripts')}
                                value={metrics.scriptCount}
                            />
                            <MetricTile
                                icon={Shapes}
                                label={msg('total-sprites')}
                                value={metrics.spriteCount}
                            />
                            <MetricTile
                                icon={Layers3}
                                label={msg('max-nesting')}
                                value={metrics.maxDepth}
                            />
                        </div>

                        <section className={styles.panel}>
                            <SectionHeading icon={Lightbulb}>
                                {msg('recommendations')}
                            </SectionHeading>
                            {metrics.recommendations.length ? (
                                <div className={styles.recommendations}>
                                    {metrics.recommendations.map(recommendation => (
                                        <div
                                            className={styles.recommendation}
                                            key={recommendation.id}
                                        >
                                            <Lightbulb
                                                className={styles.recommendationIcon}
                                                size={15}
                                            />
                                            <span>
                                                <strong>{msg(`recommend-${recommendation.id}-title`)}</strong>
                                                <small>
                                                    {msg(`recommend-${recommendation.id}-detail`, {
                                                        count: recommendation.count || 0
                                                    })}
                                                </small>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`${styles.recommendation} ${styles.goodNote}`}>
                                    <CheckCircle2
                                        className={styles.recommendationIcon}
                                        size={15}
                                    />
                                    <span>
                                        <strong>{msg('balanced-title')}</strong>
                                        <small>{msg('balanced-detail')}</small>
                                    </span>
                                </div>
                            )}
                        </section>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <EmptyState
                            help={msg('empty-help')}
                            icon={Blocks}
                            title={msg('empty-title')}
                        />
                        <div className={styles.emptyMeta}>
                            {metrics.spriteCount > 0 && (
                                <span>
                                    <Shapes size={14} />
                                    {msg('sprites-value', {count: metrics.spriteCount})}
                                </span>
                            )}
                            {metrics.costumeCount > 0 && (
                                <span>
                                    <Image size={14} />
                                    {msg('costumes', {num: metrics.costumeCount})}
                                </span>
                            )}
                            {metrics.soundCount > 0 && (
                                <span>
                                    <Music size={14} />
                                    {msg('sounds', {num: metrics.soundCount})}
                                </span>
                            )}
                        </div>
                    </React.Fragment>
                )}
            </React.Fragment>
        );
    }

    return (
        <ModalSidebarLayout className={styles.layout}>
            <ModalSidebar
                ariaLabel={msg('complexity-title')}
                footer={
                    <ModalSidebarFooter>
                        <button
                            className={styles.refreshButton}
                            type="button"
                            onClick={refresh}
                        >
                            <RefreshCw size={15} />
                            {msg('refresh')}
                        </button>
                    </ModalSidebarFooter>
                }
            >
                {sections.map(item => (
                    <ModalSidebarItem
                        count={item.count}
                        icon={item.icon}
                        key={item.id}
                        label={item.label}
                        selected={section === item.id}
                        value={item.id}
                        onClick={handleSectionClick}
                    />
                ))}
            </ModalSidebar>
            <ModalSidebarContent className={styles.content}>
                <div className={styles.page}>
                    {page}
                </div>
            </ModalSidebarContent>
        </ModalSidebarLayout>
    );
};

ProjectAnalysis.propTypes = {
    msg: PropTypes.func.isRequired,
    onShowScript: PropTypes.func.isRequired,
    vm: PropTypes.shape({
        off: PropTypes.func.isRequired,
        on: PropTypes.func.isRequired,
        runtime: PropTypes.shape({
            off: PropTypes.func.isRequired,
            on: PropTypes.func.isRequired,
            targets: PropTypes.array
        }).isRequired
    }).isRequired
};

export default ProjectAnalysis;
