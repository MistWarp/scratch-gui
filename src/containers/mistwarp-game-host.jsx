import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {
    loadProjectSave,
    saveProjectData,
    loadGlobalGameData,
    loadProjectInventory,
    grantProjectItem
} from '../lib/mistwarp-games/data-client.js';
import api from '../community/api';
import GameMarketplaceModal from '../community/components/GameMarketplaceModal.jsx';
import {getRememberedPlatformProjectState} from '../lib/community/publish.js';
import {MULTIPLAYER_ENABLED} from '../lib/mistwarp-games/config.js';

class MistWarpGameHost extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            marketplace: null
        };
        this.listeners = new Set();
        this.draftSave = {};
        this.draftSaveRevision = 0;
        this.handleMarketplaceResult = this.handleMarketplaceResult.bind(this);
    }

    componentDidMount () {
        this.attach();
    }

    componentDidUpdate (previous) {
        if (previous.projectId !== this.props.projectId || previous.vm !== this.props.vm) {
            this.detach(previous.vm);
            this.attach();
        }
    }

    componentWillUnmount () {
        this.detach(this.props.vm);
    }

    isParentBridged () {
        try {
            return window.parent !== window && new URLSearchParams(window.location.search).get('mw_bridge') === '1';
        } catch (e) {
            return false;
        }
    }

    attach () {
        if (this.isParentBridged() || !this.props.vm || !this.props.vm.runtime) return;
        this.props.vm.runtime.mistwarpGameHost = {
            whenReady: () => Promise.resolve(),
            getUser: () => ({
                loggedIn: Boolean(this.props.username),
                username: this.props.username || '',
                id: this.props.userId || ''
            }),
            subscribe: listener => {
                this.listeners.add(listener);
                return () => this.listeners.delete(listener);
            },
            call: (method, args) => this.call(method, args)
        };
        delete this.props.vm.runtime._mistwarpGamesHost;
    }

    detach (vm) {
        if (!vm || !vm.runtime) return;
        delete vm.runtime.mistwarpGameHost;
        delete vm.runtime._mistwarpGamesHost;
    }

    getProjectId () {
        const projectId = String(this.props.projectId || '');
        if (projectId && projectId !== '0') return projectId;
        const platformProject = getRememberedPlatformProjectState();
        return platformProject && platformProject.id ? String(platformProject.id) : '';
    }

    requireProject () {
        const projectId = this.getProjectId();
        if (!projectId || projectId === '0') throw new Error('Save this project to MistWarp before using game data');
        if (!this.props.username) throw new Error('Sign in to MistWarp to use account data');
        return projectId;
    }

    isDraftProject () {
        const projectId = this.getProjectId();
        return !projectId || projectId === '0';
    }

    callForDraft (method, args) {
        if (method === 'data.load') {
            return Promise.resolve({revision: this.draftSaveRevision, value: this.draftSave});
        }
        if (method === 'data.save') {
            const request = args[0] || {};
            this.draftSave = request.value && typeof request.value === 'object' ? request.value : {};
            this.draftSaveRevision += 1;
            return Promise.resolve({revision: this.draftSaveRevision, value: this.draftSave});
        }
        if (method === 'data.global') return Promise.resolve({revision: 0, value: {}});
        if (method === 'inventory.load' || method === 'inventory.grant') {
            return Promise.resolve({revision: 0, items: []});
        }
        if (!MULTIPLAYER_ENABLED && method === 'multiplayer.connect') {
            return Promise.resolve({connected: false, self: '', players: [], status: 'multiplayer disabled'});
        }
        if (method === 'multiplayer.disconnect') return Promise.resolve({connected: false});
        if (method === 'multiplayer.players') return Promise.resolve([]);
        if (method === 'multiplayer.setState') return Promise.resolve(false);
        if (method === 'multiplayer.sendEvent') return Promise.resolve(false);
        if (method === 'marketplace.owns') return Promise.resolve(false);
        if (method === 'marketplace.open' || method === 'marketplace.purchase') {
            return Promise.resolve({status: 'save project first'});
        }
        if (method === 'marketplace.configure' || method.startsWith('inventory.')) {
            return Promise.resolve(false);
        }
        return Promise.reject(new Error(`${method} is not available in an unsaved project`));
    }

    call (method, args) {
        if (method === 'multiplayer.connect') {
            return Promise.resolve({connected: false, self: '', players: [], status: 'multiplayer disabled'});
        }
        if (!MULTIPLAYER_ENABLED && method === 'multiplayer.disconnect') return Promise.resolve({connected: false});
        if (!MULTIPLAYER_ENABLED && method === 'multiplayer.players') return Promise.resolve([]);
        if (!MULTIPLAYER_ENABLED && (method === 'multiplayer.setState' || method === 'multiplayer.sendEvent')) {
            return Promise.resolve(false);
        }
        if (this.isDraftProject()) return this.callForDraft(method, args);
        const projectId = this.requireProject();
        if (method === 'data.load') return loadProjectSave(projectId, 'editor');
        if (method === 'data.save') return saveProjectData(projectId, 'editor', args[0]);
        if (method === 'data.global') return loadGlobalGameData(projectId, 'editor');
        if (method === 'inventory.load') return loadProjectInventory(projectId, 'editor');
        if (method === 'inventory.grant') {
            const request = args[0] || {};
            return grantProjectItem(projectId, 'editor', request.item, request.requestId);
        }
        if (method === 'marketplace.open' || method === 'marketplace.purchase') {
            return new Promise(resolve => {
                this.setState({
                    marketplace: {
                        projectId,
                        productId: method === 'marketplace.purchase' ? String(args[0] || '') : '',
                        resolve
                    }
                });
            });
        }
        if (method === 'marketplace.owns') {
            return api.ownsGameProduct(projectId, String(args[0] || '')).then(result => result.owned);
        }
        if (method === 'marketplace.configure') {
            const product = args[0] || {};
            return api.gameProducts(projectId).then(result => {
                const products = result.products || [];
                const next = products.filter(item => item.id !== product.id).map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    grantsItem: item.grantsItem ? item.grantsItem.split(':').pop() : ''
                }));
                next.push(product);
                return api.updateProject(projectId, {gameProducts: next});
            })
                .then(() => true);
        }
        if (method === 'inventory.configureItem') {
            const item = args[0] || {};
            return api.gameInventoryConfig(projectId).then(config => {
                const items = (config.items || []).filter(current => current.id !== item.id);
                items.push(item);
                return api.updateProject(projectId, {gameItems: items});
            })
                .then(() => true);
        }
        if (method === 'inventory.setPolicy') {
            return api.gameInventoryConfig(projectId).then(config => api.updateProject(projectId, {
                inventoryPolicy: {...config.policy, mode: String(args[0] || 'none')}
            }))
                .then(() => true);
        }
        if (method === 'inventory.allowItem' || method === 'inventory.allowProject') {
            return api.gameInventoryConfig(projectId).then(config => {
                const policy = {...config.policy, mode: 'allowlist'};
                const field = method === 'inventory.allowItem' ? 'allowedItems' : 'allowedProjects';
                policy[field] = [...new Set([...(policy[field] || []), String(args[0] || '')])];
                return api.updateProject(projectId, {inventoryPolicy: policy});
            })
                .then(() => true);
        }
        return Promise.reject(new Error(`${method} is not available in this MistWarp Games build`));
    }

    handleMarketplaceResult (result) {
        const marketplace = this.state.marketplace;
        if (marketplace) marketplace.resolve(result);
        this.setState({marketplace: null});
    }

    render () {
        const marketplace = this.state.marketplace;
        return (
            <React.Fragment>
                {marketplace ? (
                    <GameMarketplaceModal
                        projectId={marketplace.projectId}
                        productId={marketplace.productId}
                        onResult={this.handleMarketplaceResult}
                    />
                ) : null}
            </React.Fragment>
        );
    }
}

MistWarpGameHost.propTypes = {
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    userId: PropTypes.string,
    username: PropTypes.string,
    vm: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    projectId: state.scratchGui.projectState.projectId,
    userId: state.scratchGui.rotur.id,
    username: state.scratchGui.rotur.username,
    vm: state.scratchGui.vm
});

export {MistWarpGameHost};
export default connect(mapStateToProps)(MistWarpGameHost);
