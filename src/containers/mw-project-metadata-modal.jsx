import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

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
import {BarChart3, FileText, Info, UserRound} from 'lucide-react';

import styles from '../components/mw-project-metadata/project-metadata-modal.css';

const formatTime = iso => {
    if (!iso) return null;
    const date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    return date.toLocaleString();
};

/**
 * Count what is actually in the project. Cheap enough to do on open — a
 * project big enough for this to be slow is one you cannot edit anyway.
 * @param {VirtualMachine} vm The VM.
 * @returns {object} Counts.
 */
const countContents = vm => {
    const targets = vm.runtime.targets.filter(target => target.isOriginal);
    const sprites = targets.filter(target => !target.isStage);
    const sum = (list, get) => list.reduce((total, target) => total + get(target).length, 0);
    return {
        sprites: sprites.length,
        costumes: sum(targets, target => target.getCostumes()),
        sounds: sum(targets, target => target.getSounds()),
        blocks: targets.reduce((total, target) => total + Object.keys(target.blocks._blocks).length, 0),
        extensions: vm.extensionManager && vm.extensionManager._loadedExtensions ?
            Array.from(vm.extensionManager._loadedExtensions.keys()) :
            []
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

/**
 * What the currently open project says about itself: who saved it, when it was
 * made, what it was made with, and what is inside it.
 * @param {object} props Props.
 * @returns {React.ReactElement} The modal.
 */
const ProjectMetadataModal = ({onRequestClose, projectTitle, roturUsername, vm}) => {
    const [view, setView] = React.useState('project');
    const meta = getLoadedProjectMeta() || {};
    const author = meta.author;
    const platform = meta.platform;
    const contents = countContents(vm);
    const items = [
        {id: 'project', label: 'Project', icon: Info},
        {id: 'mistwarp', label: 'MistWarp', icon: UserRound},
        {id: 'scratch', label: 'Scratch', icon: FileText},
        {id: 'contents', label: 'Contents', icon: BarChart3}
    ].map(item => Object.assign({}, item, {handleClick: () => setView(item.id)}));

    let page;
    switch (view) {
    case 'mistwarp':
        page = (
            <React.Fragment>
                <Header>{'MistWarp metadata'}</Header>
                <Row
                    label="Author"
                    value={author ? `@${author.username}` : null}
                />
                <Row
                    label="Author ID"
                    value={author && author.id}
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
                    label="Platform"
                    value={platform && platform.name}
                />
                <Row
                    label="Version"
                    value={platform && platform.version}
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
        break;
    case 'scratch':
        page = (
            <React.Fragment>
                <Header>{'Scratch metadata'}</Header>
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
    case 'contents':
        page = (
            <React.Fragment>
                <Header>{'Contents'}</Header>
                <Row
                    label="Sprites"
                    value={String(contents.sprites)}
                />
                <Row
                    label="Costumes"
                    value={String(contents.costumes)}
                />
                <Row
                    label="Sounds"
                    value={String(contents.sounds)}
                />
                <Row
                    label="Blocks"
                    value={String(contents.blocks)}
                />
                <Row
                    label="Extensions"
                    value={contents.extensions.length ? contents.extensions.join(', ') : 'None'}
                />
            </React.Fragment>
        );
        break;
    default:
        page = (
            <React.Fragment>
                <Header>{'Project'}</Header>
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
            </React.Fragment>
        );
    }

    return (
        <Modal
            className={styles.modalContent}
            contentLabel="Project Metadata"
            id="projectMetadataModal"
            onRequestClose={onRequestClose}
            width={760}
            height={520}
        >
            <ModalSidebarLayout>
                <ModalSidebar
                    ariaLabel="Project metadata sections"
                    width="narrow"
                >
                    <ModalSidebarGroup>
                        <ModalSidebarGroupHeader label="Project metadata" />
                        {items.map(item => (
                            <ModalSidebarItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                selected={view === item.id}
                                onClick={item.handleClick}
                            />
                        ))}
                    </ModalSidebarGroup>
                </ModalSidebar>
                <ModalSidebarContent>
                    <Box className={styles.pageContent}>
                        {page}
                    </Box>
                </ModalSidebarContent>
            </ModalSidebarLayout>
        </Modal>
    );
};

ProjectMetadataModal.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    projectTitle: PropTypes.string,
    roturUsername: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default connect(
    state => ({
        projectTitle: state.scratchGui.projectTitle,
        roturUsername: (state.scratchGui.rotur && state.scratchGui.rotur.username) || null,
        vm: state.scratchGui.vm
    }),
    dispatch => ({
        onRequestClose: () => dispatch(closeProjectMetadataModal())
    })
)(ProjectMetadataModal);
