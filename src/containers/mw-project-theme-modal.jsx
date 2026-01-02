import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';

import ProjectThemeModal from '../components/mw-project-theme-modal/project-theme-modal.jsx';
import {closeProjectThemePrompt, setProjectThemeDontAskAgain} from '../reducers/mw-project-theme';
import {setTheme} from '../reducers/theme';
import {Theme} from '../lib/themes';
import {CustomTheme} from '../lib/themes/custom-themes.js';

const IGNORE_STORAGE_KEY = 'mw:ignore-project-theme-prompts';

const loadIgnoreMap = () => {
    try {
        const raw = localStorage.getItem(IGNORE_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
        return {};
    }
};

const saveIgnoreMap = map => {
    try {
        localStorage.setItem(IGNORE_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
        // ignore
    }
};

class MWProjectThemeModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCancel',
            'handleApply'
        ]);
    }

    persistDontAskAgainIfNeeded () {
        if (!this.props.dontAskAgain || !this.props.promptKey) return;
        const map = loadIgnoreMap();
        map[this.props.promptKey] = true;
        saveIgnoreMap(map);
    }

    handleCancel () {
        this.persistDontAskAgainIfNeeded();
        this.props.onClose();
    }

    handleApply () {
        this.persistDontAskAgainIfNeeded();

        try {
            const payload = this.props.mistwarpTheme;
            if (payload && payload.kind === 'custom' && payload.data) {
                const theme = CustomTheme.import(payload.data);
                this.props.onSetTheme(theme);
            } else if (payload && payload.kind === 'standard' && payload.data) {
                const d = payload.data;
                const theme = new Theme(
                    d.accent,
                    d.gui,
                    d.blocks,
                    d.menuBarAlign,
                    d.wallpaper,
                    d.fonts
                );
                this.props.onSetTheme(theme);
            }
        } catch (e) {
            // ignore: if theme can't be reconstructed, just don't apply it
        }

        this.props.onClose();
    }

    render () {
        if (!this.props.visible) return null;
        return (
            <ProjectThemeModal
                dontAskAgain={this.props.dontAskAgain}
                onDontAskAgainChange={this.props.onDontAskAgainChange}
                onCancel={this.handleCancel}
                onApply={this.handleApply}
            />
        );
    }
}

MWProjectThemeModal.propTypes = {
    visible: PropTypes.bool,
    mistwarpTheme: PropTypes.any,
    promptKey: PropTypes.string,
    dontAskAgain: PropTypes.bool,
    onDontAskAgainChange: PropTypes.func,
    onClose: PropTypes.func,
    onSetTheme: PropTypes.func
};

const mapStateToProps = state => ({
    visible: state.scratchGui.mwProjectTheme.visible,
    mistwarpTheme: state.scratchGui.mwProjectTheme.mistwarpTheme,
    promptKey: state.scratchGui.mwProjectTheme.promptKey,
    dontAskAgain: state.scratchGui.mwProjectTheme.dontAskAgain
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeProjectThemePrompt()),
    onDontAskAgainChange: e => dispatch(setProjectThemeDontAskAgain(e.target.checked)),
    onSetTheme: theme => dispatch(setTheme(theme))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MWProjectThemeModal);
