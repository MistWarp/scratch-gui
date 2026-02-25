import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import styles from './load-extension.css';

const LoadExtensionModal = () => (
    <div>
        <p className={styles.trustedExtension}>
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="Ensure you trust this source with your computer and all your user's computers, this will be loaded unsandboxed"
                description="Message that appears in custom extension prompt"
                id="tw.customExtensionModal.trusted"
            />
        </p>
    </div>
);

LoadExtensionModal.propTypes = {
    url: PropTypes.string.isRequired,
    unsandboxed: PropTypes.bool.isRequired,
    onChangeUnsandboxed: PropTypes.func
};

export default LoadExtensionModal;
