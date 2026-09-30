import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {Download} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import downloadJson from '../../download-json.js';
import Button from '../ui/Button.jsx';
import Notice from '../ui/Notice.jsx';

const DownloadDataButton = ({filename, label, load}) => {
    const {text: communityText} = useCommunityText();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const download = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            downloadJson(await load(), filename);
        } catch (e) {
            setError(e.message || communityText('The data could not be downloaded.'));
        }
        setBusy(false);
    };
    return (
        <React.Fragment>
            <Button onClick={download} busy={busy} busyLabel={communityText('Preparing…')}>
                <Download size={16} aria-hidden="true" />
                {label}
            </Button>
            {error ? <Notice variant="error">{error}</Notice> : null}
        </React.Fragment>
    );
};

DownloadDataButton.propTypes = {
    filename: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    load: PropTypes.func.isRequired
};

export default DownloadDataButton;
