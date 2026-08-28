import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'scratch-vm';
import {
    BarChart3,
    FileText,
    Gauge,
    HardDrive,
    Info,
    RefreshCw
} from 'lucide-react';

import Modal from './windowed-modal.jsx';
import Box from '../components/box/box.jsx';
import {
    ModalSidebar,
    ModalSidebarContent,
    ModalSidebarGroup,
    ModalSidebarGroupHeader,
    ModalSidebarItem,
    ModalSidebarLayout
} from '../components/modal-sidebar/modal-sidebar.jsx';
import {closeProjectMetadataModal} from '../reducers/modals';
import {getLoadedProjectMeta} from '../lib/mw-project-metadata';
import {getPerks, getProject} from '../lib/community/api';
import {getRememberedPlatformProject} from '../lib/community/publish';

import styles from '../components/mw-project-metadata/project-metadata-modal.css';

const MB = 1024 * 1024;
const LIMITS = {
    storedJson: 20 * MB,
    assets: 50 * MB,
    asset: 10 * MB,
    expandedJson: 1024 * MB
};

const formatTime = iso => {
    if (!iso) return null;
    const date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    return date.toLocaleString();
};

const formatSize = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < MB) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * MB) return `${(bytes / MB).toFixed(2)} MB`;
    return `${(bytes / (1024 * MB)).toFixed(2)} GB`;
};

const assetSize = asset => {
    if (!asset || !asset.data) return 0;
    return asset.data.byteLength || asset.data.length || 0;
};

const valueSize = value => {
    if (value === null || typeof value === 'undefined') return 0;
    return String(value).length;
};

const variableValueSize = value => {
    if (!Array.isArray(value)) return valueSize(value);
    const samples = Math.min(value.length, 1000);
    if (!samples) return 0;
    let size = 0;
    for (let i = 0; i < samples; i++) {
        size += valueSize(value[Math.floor(i * value.length / samples)]);
    }
    return Math.round(size * value.length / samples);
};

const buildSizeReport = (vm, limits = LIMITS) => {
    const entries = new Map();
    const addAsset = (asset, category, label) => {
        if (!asset) return;
        const name = `${asset.assetId}.${asset.dataFormat}`;
        if (!entries.has(name)) {
            entries.set(name, {name, category, label, size: assetSize(asset)});
        }
    };
    const targets = vm.runtime.targets.filter(target => target.isOriginal);
    let sprites = 0;
    let costumes = 0;
    let sounds = 0;
    let blocks = 0;
    let variableDataSize = 0;

    for (const target of targets) {
        const targetName = target.getName();
        if (!target.isStage) sprites++;
        const targetCostumes = target.getCostumes();
        const targetSounds = target.getSounds();
        costumes += targetCostumes.length;
        sounds += targetSounds.length;
        for (const costume of targetCostumes) {
            addAsset(costume.asset, 'Costumes', `${targetName}: ${costume.name}`);
        }
        for (const sound of targetSounds) {
            addAsset(sound.asset, 'Sounds', `${targetName}: ${sound.name}`);
        }
        for (const id in target.blocks._blocks) {
            if (Object.prototype.hasOwnProperty.call(target.blocks._blocks, id)) blocks++;
        }
        for (const variable of Object.values(target.variables || {})) {
            const size = valueSize(variable.name) + variableValueSize(variable.value);
            variableDataSize += size;
            entries.set(`variable:${target.id}:${variable.id}`, {
                name: `variable:${target.id}:${variable.id}`,
                category: 'Variables and lists',
                label: `${targetName}: ${variable.name}`,
                size
            });
        }
    }

    for (const entry of (vm.runtime.assetManager && vm.runtime.assetManager.assets) || []) {
        addAsset(entry.asset, 'Custom assets', entry.name);
    }
    for (const font of (vm.runtime.fontManager && vm.runtime.fontManager.fonts) || []) {
        addAsset(font.asset, 'Fonts', font.family);
    }

    const allEntries = Array.from(entries.values());
    const categories = new Map();
    let localAssetSize = 0;
    for (const entry of allEntries) {
        categories.set(entry.category, (categories.get(entry.category) || 0) + entry.size);
        if (entry.category !== 'Variables and lists') localAssetSize += entry.size;
    }
    const localEstimate = localAssetSize + variableDataSize;
    const largestAsset = allEntries
        .filter(entry => entry.category !== 'Variables and lists')
        .reduce((largest, entry) => Math.max(largest, entry.size), 0);

    return {
        localEstimate,
        localAssetSize,
        variableDataSize,
        largestAsset,
        overAssetLimit: largestAsset > limits.asset,
        overAssetsLimit: localAssetSize > limits.assets,
        overExpandedLimit: variableDataSize > limits.expandedJson,
        contents: {
            sprites,
            costumes,
            sounds,
            blocks,
            extensions: vm.extensionManager && vm.extensionManager._loadedExtensions ?
                Array.from(vm.extensionManager._loadedExtensions.keys()) :
                []
        },
        categories: Array.from(categories, ([name, size]) => ({
            name,
            size,
            percent: localEstimate ? Math.max(1, size / localEstimate * 100) : 0
        })).sort((a, b) => b.size - a.size),
        largest: allEntries.sort((a, b) => b.size - a.size).slice(0, 12)
    };
};

const Row = ({label, value}) => (
    <div className={styles.row}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
            {value === null || typeof value === 'undefined' || value === '' ? (
                <span className={styles.emptyValue}>{'Not recorded'}</span>
            ) : value}
        </span>
    </div>
);

Row.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node
};

const Header = ({children}) => (
    <div className={styles.header}>
        <h2>{children}</h2>
        <div className={styles.divider} />
    </div>
);

Header.propTypes = {
    children: PropTypes.node
};

const Meter = ({current, label, limit, note}) => {
    const percent = Math.min(100, current / limit * 100);
    const over = current > limit;
    return (
        <div className={styles.meter}>
            <div className={styles.meterLabel}>
                <span>
                    <strong>{label}</strong>
                    {note && <small>{note}</small>}
                </span>
                <span className={over ? styles.over : null}>
                    {formatSize(current)} {' / '} {formatSize(limit)}
                </span>
            </div>
            <div className={styles.meterTrack}>
                <div
                    className={over ? styles.meterFillOver : styles.meterFill}
                    style={{width: `${percent}%`}}
                />
            </div>
        </div>
    );
};

Meter.propTypes = {
    current: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    limit: PropTypes.number.isRequired,
    note: PropTypes.string
};

const ProjectMetadataModal = ({initialView, onRequestClose, projectTitle, roturUsername, vm}) => {
    const [view, setView] = React.useState(initialView);
    const [refresh, setRefresh] = React.useState(0);
    const [serverProject, setServerProject] = React.useState(null);
    const [serverLoading, setServerLoading] = React.useState(false);
    const [perks, setPerks] = React.useState(null);
    const handleRefresh = React.useCallback(() => setRefresh(value => value + 1), []);
    const limits = React.useMemo(() => ({
        ...LIMITS,
        asset: perks?.mistwarp?.maxProjectAssetBytes || LIMITS.asset,
        assets: perks?.mistwarp?.maxProjectAssetsBytes || LIMITS.assets
    }), [perks]);
    const report = React.useMemo(() => buildSizeReport(vm, limits), [vm, refresh, limits]);
    const meta = getLoadedProjectMeta() || {};
    const author = meta.author;
    const platform = meta.platform;
    const projectId = getRememberedPlatformProject();

    React.useEffect(() => {
        let active = true;
        getPerks()
            .then(data => active && setPerks(data.current || null))
            .catch(() => active && setPerks(null));
        return () => {
            active = false;
        };
    }, [roturUsername]);

    React.useEffect(() => {
        if (!projectId) return;
        let active = true;
        setServerLoading(true);
        getProject(projectId)
            .then(data => {
                if (active) setServerProject(data.project);
            })
            .catch(() => {
                if (active) setServerProject(null);
            })
            .then(() => {
                if (active) setServerLoading(false);
            });
        return () => {
            active = false;
        };
    }, [projectId, refresh]);

    const serverStoredJson = serverProject && serverProject.storedJsonBytes;
    const hasLocalProblem = report.overAssetLimit || report.overAssetsLimit || report.overExpandedLimit;
    const hasServerProblem = serverStoredJson > limits.storedJson;
    const storageStatus = hasLocalProblem || hasServerProblem ?
        'This project is over a MistWarp upload limit.' :
        serverProject ?
            'The saved project is within MistWarp’s storage limits.' :
            'MistWarp checks compressed project data when you upload.';
    const perkSummary = perks ?
        `${formatSize(limits.assets)} of assets per project, ${formatSize(limits.asset)} per asset, ` +
            `${formatSize(perks.mistwarp.weeklyUploadBytes)} of uploads each week.` :
        '';
    const groups = [
        {
            label: 'Project',
            items: [
                {id: 'project', label: 'Overview', icon: Info},
                {id: 'contents', label: 'Contents', icon: BarChart3},
                {id: 'technical', label: 'Technical metadata', icon: FileText}
            ]
        },
        {
            label: 'Analysis',
            items: [
                {id: 'optimiser', label: 'MistWarp storage', icon: Gauge},
                {id: 'breakdown', label: 'Size breakdown', icon: HardDrive}
            ]
        }
    ].map(group => Object.assign({}, group, {
        items: group.items.map(item => Object.assign({}, item, {handleClick: () => setView(item.id)}))
    }));

    let page;
    switch (view) {
    case 'optimiser':
        page = (
            <React.Fragment>
                <div className={styles.pageTitle}>
                    <div>
                        <Header>{'MistWarp storage'}</Header>
                        <p>{'Current size, server usage and upload limits.'}</p>
                    </div>
                    <button
                        className={styles.refresh}
                        onClick={handleRefresh}
                    >
                        <RefreshCw size={16} />
                        {'Refresh'}
                    </button>
                </div>
                <div className={hasLocalProblem || hasServerProblem ? styles.statusBad : styles.statusGood}>
                    <strong>{storageStatus}</strong>
                    <span>
                        {'Sizes in the editor come directly from the VM. Final compression is measured during upload.'}
                    </span>
                </div>
                {perks && (
                    <div className={styles.perkNotice}>
                        <strong>{`${perks.tier} Rotur benefits are active`}</strong>
                        <span>{perkSummary}</span>
                    </div>
                )}
                <div className={styles.summary}>
                    <div>
                        <span>{'Editor estimate'}</span>
                        <strong>{formatSize(report.localEstimate)}</strong>
                    </div>
                    <div>
                        <span>{'Stored on MistWarp'}</span>
                        <strong>
                            {serverProject ? formatSize(serverProject.sizeBytes || 0) :
                                serverLoading ? 'Loading...' : 'Not uploaded'}
                        </strong>
                    </div>
                </div>
                {serverProject && (
                    <React.Fragment>
                        <Header>{'Server usage'}</Header>
                        <Row
                            label="Total stored"
                            value={formatSize(serverProject.sizeBytes || 0)}
                        />
                        <Row
                            label="Project data"
                            value={typeof serverProject.storedJsonBytes === 'number' ?
                                formatSize(serverProject.storedJsonBytes) :
                                null}
                        />
                        <Row
                            label="Assets"
                            value={typeof serverProject.assetBytes === 'number' ?
                                formatSize(serverProject.assetBytes) :
                                null}
                        />
                    </React.Fragment>
                )}
                <Header>{'Upload limits'}</Header>
                {typeof serverStoredJson === 'number' && (
                    <Meter
                        current={serverStoredJson}
                        label="Compressed project data on server"
                        limit={limits.storedJson}
                        note="Exact size from the last upload"
                    />
                )}
                <Meter
                    current={report.localAssetSize}
                    label="Assets in the editor"
                    limit={limits.assets}
                    note="Costumes, sounds, fonts and custom assets"
                />
                <Meter
                    current={report.largestAsset}
                    label="Largest single asset"
                    limit={limits.asset}
                />
                <Meter
                    current={serverProject && typeof serverProject.jsonBytes === 'number' ?
                        serverProject.jsonBytes :
                        report.variableDataSize}
                    label={serverProject && typeof serverProject.jsonBytes === 'number' ?
                        'Expanded project data on server' :
                        'Variable and list data in the editor'}
                    limit={limits.expandedJson}
                    note={serverProject && typeof serverProject.jsonBytes === 'number' ?
                        'Exact size from the last upload' :
                        'Fast lower-bound estimate from the VM'}
                />
                <p className={styles.detail}>
                    {`Your current limits are ${formatSize(limits.storedJson)} of compressed project data, ` +
                        `${formatSize(limits.expandedJson)} expanded, ${formatSize(limits.assets)} of assets, ` +
                        `and ${formatSize(limits.asset)} per asset.`}
                </p>
            </React.Fragment>
        );
        break;
    case 'contents':
        page = (
            <React.Fragment>
                <Header>{'Contents'}</Header>
                <Row
                    label="Sprites"
                    value={String(report.contents.sprites)}
                />
                <Row
                    label="Costumes"
                    value={String(report.contents.costumes)}
                />
                <Row
                    label="Sounds"
                    value={String(report.contents.sounds)}
                />
                <Row
                    label="Blocks"
                    value={String(report.contents.blocks)}
                />
                <Row
                    label="Extensions"
                    value={report.contents.extensions.length ?
                        report.contents.extensions.join(', ') :
                        'None'}
                />
            </React.Fragment>
        );
        break;
    case 'breakdown':
        page = (
            <React.Fragment>
                <Header>{'Size breakdown'}</Header>
                <p className={styles.detail}>
                    {'A fast estimate from live assets, variables and lists in the VM.'}
                </p>
                <div className={styles.breakdown}>
                    {report.categories.map(category => (
                        <div
                            className={styles.breakdownRow}
                            key={category.name}
                        >
                            <div className={styles.breakdownLabel}>
                                <span>{category.name}</span>
                                <strong>{formatSize(category.size)}</strong>
                            </div>
                            <div className={styles.bar}>
                                <div
                                    className={styles.barFill}
                                    style={{width: `${category.percent}%`}}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <Header>{'Largest parts'}</Header>
                <div className={styles.largest}>
                    {report.largest.map(entry => (
                        <div
                            className={styles.largestRow}
                            key={entry.name}
                        >
                            <span>
                                <strong>{entry.label}</strong>
                                <small>{entry.category}</small>
                            </span>
                            <strong>{formatSize(entry.size)}</strong>
                        </div>
                    ))}
                </div>
            </React.Fragment>
        );
        break;
    case 'technical':
        page = (
            <React.Fragment>
                <Header>{'Technical metadata'}</Header>
                <Row
                    label="Author ID"
                    value={author && author.id}
                />
                <Row
                    label="Platform"
                    value={platform && platform.name}
                />
                <Row
                    label="Version"
                    value={platform && platform.version}
                />
                <Row
                    label="Format"
                    value={meta.semver}
                />
                <Row
                    label="VM"
                    value={meta.vm}
                />
                <Row
                    label="User agent"
                    value={meta.agent}
                />
            </React.Fragment>
        );
        break;
    default:
        page = (
            <React.Fragment>
                <Header>{'Project overview'}</Header>
                <Row
                    label="Title"
                    value={projectTitle || 'Untitled'}
                />
                <Row
                    label="Author"
                    value={author ? `@${author.username}` : null}
                />
                <Row
                    label="Created"
                    value={formatTime(meta.created || meta.createdAt)}
                />
                <Row
                    label="Last edited"
                    value={formatTime(meta.edited || meta.savedAt)}
                />
                <Row
                    label="Format"
                    value={meta.semver}
                />
                {!author && !meta.edited && !meta.savedAt && (
                    <p className={styles.detail}>
                        {roturUsername ?
                            `Save this project to add @${roturUsername} as its author.` :
                            'Sign in to Rotur and save this project to add authorship.'}
                    </p>
                )}
            </React.Fragment>
        );
    }

    return (
        <Modal
            className={styles.modalContent}
            contentLabel="Project details"
            id="projectMetadataModal"
            onRequestClose={onRequestClose}
            width={880}
            height={550}
        >
            <ModalSidebarLayout>
                <ModalSidebar
                    ariaLabel="Project details sections"
                    width="wide"
                >
                    {groups.map(group => (
                        <ModalSidebarGroup key={group.label}>
                            <ModalSidebarGroupHeader label={group.label} />
                            {group.items.map(item => (
                                <ModalSidebarItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    selected={view === item.id}
                                    onClick={item.handleClick}
                                />
                            ))}
                        </ModalSidebarGroup>
                    ))}
                </ModalSidebar>
                <ModalSidebarContent>
                    <Box className={styles.pageContent}>{page}</Box>
                </ModalSidebarContent>
            </ModalSidebarLayout>
        </Modal>
    );
};

ProjectMetadataModal.propTypes = {
    initialView: PropTypes.string.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    projectTitle: PropTypes.string,
    roturUsername: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired
};

export {buildSizeReport, formatSize, LIMITS};
export default connect(
    state => ({
        initialView: state.scratchGui.modals.projectMetadataView || 'project',
        projectTitle: state.scratchGui.projectTitle,
        roturUsername: (state.scratchGui.rotur && state.scratchGui.rotur.username) || null,
        vm: state.scratchGui.vm
    }),
    dispatch => ({
        onRequestClose: () => dispatch(closeProjectMetadataModal())
    })
)(ProjectMetadataModal);
