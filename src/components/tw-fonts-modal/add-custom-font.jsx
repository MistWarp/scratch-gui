import React from 'react';
import PropTypes from 'prop-types';
import {injectIntl, intlShape, defineMessages, FormattedMessage} from 'react-intl';
import bindAll from 'lodash.bindall';
import styles from './fonts-modal.css';
import LoadTemporaryFont from './load-temporary-font.jsx';
import FontName from './font-name.jsx';
import FontPlayground from './font-playground.jsx';
import FontFallback from './font-fallback.jsx';
import AddButton from './add-button.jsx';

const messages = defineMessages({
    error: {
        defaultMessage: 'Failed to read font file: {error}',
        description: 'Part of font management modal. Appears when a font from a local file could not be read.',
        id: 'tw.fonts.readError'
    }
});

export const FONT_FORMATS = [
    'ttf',
    'otf',
    'woff',
    'woff2'
];

const formatFontName = filename => {
    // Remove file extension
    const idx = filename.lastIndexOf('.');
    if (idx !== -1) {
        filename = filename.substring(0, idx);
    }
    return filename;
};

const getDataFormat = filename => {
    const parts = filename.split('.');
    const extension = parts[parts.length - 1].toLowerCase();
    if (FONT_FORMATS.includes(extension)) {
        return extension;
    }
    // We'll just guess
    return 'ttf';
};

class AddCustomFont extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleChangeFile',
            'handleChangeName',
            'handleChangeFallback',
            'handleReadError',
            'handleFinish'
        ]);
        this.state = {
            file: null,
            url: null,
            name: '',
            format: '',
            fallback: FontFallback.DEFAULT,
            loading: false,
            error: null
        };
        this.fileReader = null;
        this.mounted = false;
    }

    componentDidMount () {
        this.mounted = true;
    }

    componentWillUnmount () {
        this.mounted = false;
        if (this.fileReader && this.fileReader.readyState === 1) this.fileReader.abort();
        if (this.state.url) URL.revokeObjectURL(this.state.url);
    }

    handleChangeFile (e) {
        const file = e.target.files[0] || null;
        if (this.state.url) URL.revokeObjectURL(this.state.url);
        if (file) {
            this.setState({
                file,
                name: formatFontName(file.name),
                format: getDataFormat(file.name),
                url: URL.createObjectURL(file),
                error: null
            });
        } else {
            this.setState({
                file,
                name: null,
                url: null,
                error: null
            });
        }
    }

    handleChangeName (name) {
        this.setState({
            name
        });
    }

    handleChangeFallback (fallback) {
        this.setState({
            fallback
        });
    }

    handleReadError (error) {
        this.fileReader = null;
        if (!this.mounted) return;
        this.setState({
            loading: false,
            error: this.props.intl.formatMessage(messages.error, {
                error: error && error.message ? error.message : `${error || 'Unknown error'}`
            })
        });
    }

    handleFinish () {
        if (!this.state.file || this.state.loading) return;
        const {
            fallback,
            file,
            format,
            name
        } = this.state;
        this.setState({
            loading: true,
            error: null
        });

        const fr = new FileReader();
        this.fileReader = fr;
        fr.onload = () => {
            this.fileReader = null;
            if (!this.mounted) return;
            try {
                const data = new Uint8Array(fr.result);
                const storage = this.props.fontManager.runtime.storage;
                const asset = storage.createAsset(
                    storage.AssetType.Font,
                    format,
                    data,
                    null,
                    true
                );
                this.props.fontManager.addCustomFont(name, fallback, asset);
                this.props.onClose();
            } catch (error) {
                this.handleReadError(error);
            }
        };
        fr.onerror = () => this.handleReadError(fr.error);
        fr.onabort = () => this.handleReadError(new Error('Reading was cancelled'));
        try {
            fr.readAsArrayBuffer(file);
        } catch (error) {
            this.handleReadError(error);
        }
    }

    render () {
        return (
            <React.Fragment>
                <p>
                    <FormattedMessage
                        defaultMessage="Select a font file from your computer:"
                        description="Part of font management modal."
                        id="tw.fonts.custom.file"
                    />
                </p>

                <input
                    type="file"
                    onChange={this.handleChangeFile}
                    className={styles.fileInput}
                    accept={FONT_FORMATS.map(ext => `.${ext}`).join(',')}
                    disabled={this.state.loading}
                />

                {this.state.error && (
                    <div className={styles.errorMessage}>{this.state.error}</div>
                )}

                {this.state.file && (
                    <React.Fragment>
                        <p>
                            <FormattedMessage
                                defaultMessage="Give the font a name:"
                                description="Part of font management modal."
                                id="tw.fonts.custom.name"
                            />
                        </p>

                        <FontName
                            name={this.state.name}
                            onChange={this.handleChangeName}
                            fontManager={this.props.fontManager}
                            isCustom
                        />

                        <LoadTemporaryFont url={this.state.url}>{family => (
                            <FontPlayground family={`${family}, ${this.state.fallback}`} />
                        )}</LoadTemporaryFont>

                        <FontFallback
                            fallback={this.state.fallback}
                            onChange={this.handleChangeFallback}
                        />
                    </React.Fragment>
                )}

                <AddButton
                    onClick={this.handleFinish}
                    disabled={!this.state.file || !this.state.name || this.state.loading}
                />
            </React.Fragment>
        );
    }
}

AddCustomFont.propTypes = {
    intl: intlShape,
    fontManager: PropTypes.shape({
        addCustomFont: PropTypes.func,
        runtime: PropTypes.shape({
            // eslint-disable-next-line react/forbid-prop-types
            storage: PropTypes.any
        })
    }),
    onClose: PropTypes.func.isRequired
};

export {
    AddCustomFont,
    formatFontName,
    getDataFormat
};

export default injectIntl(AddCustomFont);
