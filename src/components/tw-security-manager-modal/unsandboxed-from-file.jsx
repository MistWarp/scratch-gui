import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import styles from './load-extension.css';
import codeStyles from './data-url.css';

const PREVIEW_LINES = 40;

const previewOf = source => String(source || '').split(/\r\n?|\n/)
    .slice(0, PREVIEW_LINES)
    .join('\n');

const UnsandboxedFromFileModal = props => (
    <div>
        <FormattedMessage
            defaultMessage="Run {fileName} without the sandbox?"
            description="Title of the prompt asking to run an extension loaded from a file without the sandbox"
            id="mw.unsandboxedFromFile.title"
            values={{fileName: <strong>{props.fileName}</strong>}}
        />
        <div className={styles.unsandboxedWarning}>
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="Without the sandbox, the extension gets full access to MistWarp. It could steal your login session, take over your account, read or change projects and settings, or run other malicious code. Only continue if you wrote this file or trust its author."
                description="Warning in the prompt that runs an extension file without the sandbox"
                id="mw.unsandboxedFromFile.warning"
            />
        </div>
        <FormattedMessage
            defaultMessage="The first {count} lines of the file:"
            description="Label above the preview of an extension file before running it without the sandbox"
            id="mw.unsandboxedFromFile.preview"
            values={{count: PREVIEW_LINES}}
        />
        <pre
            className={codeStyles.code}
            data-testid="unsandboxed-preview"
            style={{height: '12rem', overflow: 'auto', whiteSpace: 'pre'}}
        >
            {previewOf(props.source)}
        </pre>
    </div>
);

UnsandboxedFromFileModal.propTypes = {
    fileName: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired
};

export {PREVIEW_LINES, previewOf};
export default UnsandboxedFromFileModal;
