/* eslint-disable react/jsx-no-bind, react/jsx-handler-names, react/jsx-no-literals, no-alert */
import React from 'react';
import PropTypes from 'prop-types';
import WindowedModal from './windowed-modal.jsx';
import PackagerOptions from '../components/packager/options.jsx';
import {SettingsContext} from '../components/packager/controls.jsx';
import styles from '../components/packager/packager.module.css';
import Packager from '../packager/packager/web/export';
import {getEditorProjectData} from '../packager/editor-project';
import {exportProject} from '../packager/export-project';
import {getTranslator} from '../packager/locales';
import deepClone from '../packager/settings/deep-clone';
import merge from '../packager/settings/merge';
import serialize from '../packager/settings/serialize';
import {recursivelySerializeBlobs, recursivelyDeserializeBlobs} from '../packager/settings/blob-serializer';
import downloadURL from '../packager/settings/download-url';
import {APP_NAME} from '../lib/constants/brand';

const sessionOptions = new Map();
const tabs = ['Export', 'Runtime', 'Appearance', 'Advanced'];

class PackagerWindow extends React.Component {
    constructor (props) {
        super(props);
        this.projectData = getEditorProjectData(props.vm, props.projectTitle);
        this.defaults = Packager.DEFAULT_OPTIONS();
        this.defaults.projectId = `editor-${props.projectTitle}`;
        this.defaults.app.windowTitle = props.projectTitle;
        this.defaults.app.packageName = Packager.getDefaultPackageNameFromFileName(props.projectTitle);
        this.defaults.extensions = this.projectData.project.analysis.extensions;
        this.defaults.custom.csp = "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:";
        this.cloudVariables = this.projectData.project.analysis.stageVariables.filter(v => v.isCloud).map(v => v.name);
        for (const variable of this.cloudVariables) this.defaults.cloudVariables.custom[variable] = 'ws';
        this.settingsKey = `PackagerOptions.${this.projectData.uniqueId}`;
        let options = deepClone(this.defaults);
        try {
            const saved = sessionOptions.get(this.settingsKey) || JSON.parse(localStorage.getItem(this.settingsKey));
            if (saved) options = merge(deepClone(saved), options);
        } catch (e) { /* Unavailable or invalid storage should not prevent exporting. */ }
        options.extensions = options.extensions.map(item => (typeof item === 'string' ? item : item.url || ''));
        this.state = {options, tab: 'Export', progress: null, error: null, result: null, previewHTML: null};
        this.options = options;
        this.otherEnvironmentsInitiallyOpen = !['html', 'zip', 'electron-win32', 'webview-mac', 'electron-linux64']
            .includes(options.target);
        this.advancedOptionsInitiallyOpen = true;
        this.operation = null;
        this.disposed = false;
    }

    componentWillUnmount () {
        this.disposed = true;
        this.cancel();
        if (this.state.result) URL.revokeObjectURL(this.state.result.url);
    }

    cancel = () => {
        if (this.operation) this.operation.abort();
        this.operation = null;
        if (!this.disposed) this.setState({progress: null});
    };

    editOptions = edit => {
        this.cancel();
        const previous = this.state;
        const options = deepClone(this.options);
        edit(options);
        this.options = options;
        if (previous.result) URL.revokeObjectURL(previous.result.url);
        sessionOptions.set(this.settingsKey, options);
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(serialize(options, this.defaults)));
        } catch (e) { /* Keep the settings in memory if persistent storage is full. */ }
        this.setState({options, result: null, error: null});
    };

    resetOptions = paths => this.editOptions(draft => {
        for (const path of paths) {
            const parts = path.split('.');
            const key = parts.pop();
            const target = parts.reduce((value, part) => value[part], draft);
            const defaults = parts.reduce((value, part) => value[part], this.defaults);
            target[key] = deepClone(defaults[key]);
        }
    });

    automaticallyCenterCursor = () => {
        const file = this.state.options.cursor.custom;
        if (!file) return;
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            if (!this.disposed) {
                this.editOptions(draft => {
                    draft.cursor.center = {x: Math.round(image.width / 2), y: Math.round(image.height / 2)};
                });
            }
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            if (!this.disposed) this.setState({error: 'Could not read the cursor image.'});
        };
        image.src = url;
    };

    run = async preview => {
        this.cancel();
        const operation = new AbortController();
        this.operation = operation;
        const options = deepClone(this.state.options);
        options.csp = options.custom.csp;
        if (preview) options.target = 'html';
        this.setState({error: null, progress: {text: 'Preparing project', value: 0}});
        try {
            const result = await exportProject({
                vm: this.props.vm,
                options,
                signal: operation.signal,
                onProgress: progress => {
                    if (!this.disposed && this.operation === operation) this.setState({progress});
                }
            });
            const previewHTML = preview ? await result.blob.text() : null;
            if (this.disposed || operation.signal.aborted) return;
            const url = URL.createObjectURL(result.blob);
            if (this.state.result) URL.revokeObjectURL(this.state.result.url);
            this.setState({result: {...result, url}, previewHTML, progress: null});
            this.operation = null;
            if (!preview) downloadURL(result.filename, url);
        } catch (error) {
            if (!this.disposed && this.operation === operation) {
                this.operation = null;
                this.setState({progress: null, error: error.message || String(error)});
            }
        }
    };

    exportSettings = async () => {
        try {
            const data = await recursivelySerializeBlobs(this.state.options);
            const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            downloadURL(`${APP_NAME.toLowerCase()}-packaging-settings.json`, url);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            if (!this.disposed) this.setState({error: error.message});
        }
    };

    importSettings = async file => {
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            const options = merge(recursivelyDeserializeBlobs(parsed), deepClone(this.defaults));
            if (this.disposed) return;
            if (Packager.usesUnsafeOptions(options)) {
                const translate = getTranslator(this.props.locale);
                const accepted = await this.props.confirm(
                    translate('options.import'),
                    translate('options.confirmImportUnsafe')
                );
                if (!accepted || this.disposed) return;
            }
            this.editOptions(draft => Object.assign(draft, options));
        } catch (error) {
            if (!this.disposed) this.setState({error: error.message});
        }
    };

    render () {
        const {projectTitle, locale, onClose} = this.props;
        const {options, tab, progress, error, result, previewHTML} = this.state;
        const translate = getTranslator(locale);
        const model = {
            options,
            defaults: this.defaults,
            translate,
            projectData: this.projectData,
            cloudVariables: this.cloudVariables,
            hasSettingsStoredInProject: this.projectData.project.analysis.stageComments
                .some(text => text.split('\n').some(line => line.endsWith(' // _twconfig_'))),
            otherEnvironmentsInitiallyOpen: this.otherEnvironmentsInitiallyOpen,
            advancedOptionsInitiallyOpen: this.advancedOptionsInitiallyOpen,
            editOptions: this.editOptions,
            resetOptions: this.resetOptions,
            automaticallyCenterCursor: this.automaticallyCenterCursor
        };
        return (<React.Fragment>
            <WindowedModal
                id="mw-packager"
                modal={false}
                contentLabel="Packager"
                width={800}
                height={700}
                minWidth={460}
                minHeight={360}
                onRequestClose={onClose}
            >
                <div
                    className={styles.root}
                    onDragOver={e => {
                        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
                    }}
                    onDrop={e => {
                        if (e.dataTransfer.files[0] && e.dataTransfer.files[0].name.endsWith('.json')) {
                            e.preventDefault();
                            this.importSettings(e.dataTransfer.files[0]);
                        }
                    }}
                >
                    <nav
                        className={styles.tabs}
                        aria-label="Packager settings"
                    >
                        {tabs.map(name => (<button
                            key={name}
                            aria-pressed={name === tab}
                            onClick={() => this.setState({tab: name})}
                        >{name}</button>))}
                    </nav>
                    {error && <div
                        className={styles.error}
                        role="alert"
                    >
                        <span>{error}</span>
                        <button onClick={() => this.setState({error: null})}>Dismiss</button>
                    </div>}
                    <div className={styles.body}>
                        <SettingsContext.Provider value={{tab, translate, confirm: this.props.confirm}}>
                            <PackagerOptions model={model} />
                        </SettingsContext.Provider>
                    </div>
                    <div className={styles.footer}>
                        <div className={styles.settingsActions}>
                            <button onClick={this.exportSettings}>Export settings</button>
                            <button onClick={() => this.settingsInput.click()}>Import settings</button>
                            <input
                                hidden
                                ref={element => {
                                    this.settingsInput = element;
                                }}
                                type="file"
                                accept=".json"
                                onChange={e => {
                                    this.importSettings(e.target.files[0]);
                                    e.target.value = '';
                                }}
                            />
                            <button
                                onClick={() => {
                                    this.props.confirm(translate('reset.reset'), translate('reset.confirmAll'))
                                        .then(accepted => {
                                            if (accepted) this.resetOptions(Object.keys(this.defaults));
                                        });
                                }}
                            >Reset settings</button>
                        </div>
                        {progress && <div
                            role="status"
                            className={styles.progress}
                        >
                            <span>{progress.text}</span>
                            <progress
                                max="1"
                                value={progress.value || 0}
                            />
                            <button onClick={this.cancel}>Cancel</button>
                        </div>}
                        <div className={styles.actions}>
                            <button
                                className={styles.primary}
                                disabled={Boolean(progress)}
                                onClick={() => this.run(false)}
                            >
                                Package
                            </button>
                            <button
                                disabled={Boolean(progress)}
                                onClick={() => this.run(true)}
                            >Preview</button>
                            {result && <a
                                href={result.url}
                                download={result.filename}
                            >Download {result.filename}</a>}
                        </div>
                    </div>
                </div>
            </WindowedModal>
            {previewHTML !== null && <WindowedModal
                id="mw-packager-preview"
                modal={false}
                contentLabel={`${projectTitle} preview`}
                width={640}
                height={540}
                onRequestClose={() => this.setState({previewHTML: null})}
            >
                <iframe
                    className={styles.preview}
                    title={`${projectTitle} preview`}
                    srcDoc={previewHTML}
                    sandbox={'allow-scripts allow-forms allow-modals allow-downloads allow-pointer-lock ' +
                        'allow-popups allow-popups-to-escape-sandbox'}
                    allow="fullscreen; autoplay"
                />
            </WindowedModal>}
        </React.Fragment>);
    }
}

PackagerWindow.propTypes = {
    confirm: PropTypes.func.isRequired,
    vm: PropTypes.object.isRequired,
    projectTitle: PropTypes.string.isRequired,
    locale: PropTypes.string,
    onClose: PropTypes.func.isRequired
};
PackagerWindow.defaultProps = {locale: 'en'};
export default PackagerWindow;
