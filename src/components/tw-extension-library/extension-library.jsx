import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {Search} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import {
    ModalSidebar,
    ModalSidebarItem,
    ModalSidebarLayout
} from '../modal-sidebar/modal-sidebar.jsx';
import styles from './extension-library.css';

const messages = defineMessages({
    all: {
        id: 'gui.extensionLibrary.allTag',
        defaultMessage: 'All',
        description: 'Sidebar entry showing every extension'
    },
    search: {
        id: 'gui.extensionLibrary.search',
        defaultMessage: 'Search extensions',
        description: 'Placeholder for the extension search field'
    }
});

const ALL = 'all';

const labelOf = (tag, intl) => (
    typeof tag.intlLabel === 'string' ? tag.intlLabel : intl.formatMessage(tag.intlLabel)
);

// A real, loadable extension (not a divider or gallery-status card).
const isExtension = item => item && typeof item === 'object' && (item.extensionId || item.href);

const TagItem = ({tag, label, count, selected, onSelect}) => {
    const handleClick = React.useCallback(() => onSelect(tag), [onSelect, tag]);
    return (
        <ModalSidebarItem
            label={label}
            count={count}
            selected={selected}
            onClick={handleClick}
        />
    );
};

TagItem.propTypes = {
    tag: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    count: PropTypes.number,
    selected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired
};

const ExtensionCard = ({item, onSelect}) => {
    const handleClick = React.useCallback(() => onSelect(item), [onSelect, item]);
    const icon = item.iconURL || item.rawURL;
    const body = (
        <React.Fragment>
            {icon ? (
                <img
                    className={styles.cardIcon}
                    src={icon}
                    alt=""
                    draggable={false}
                />
            ) : <div className={styles.cardIcon} />}
            <div className={styles.cardText}>
                <div className={styles.cardName}>{item.name}</div>
                {item.description ? (
                    <div className={styles.cardDescription}>{item.description}</div>
                ) : null}
            </div>
        </React.Fragment>
    );
    if (item.href) {
        return (
            <a
                className={styles.card}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
            >
                {body}
            </a>
        );
    }
    return (
        <button
            className={classNames(styles.card, {[styles.cardDisabled]: item.disabled})}
            onClick={handleClick}
            disabled={item.disabled}
            type="button"
        >
            {body}
        </button>
    );
};

ExtensionCard.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    item: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired
};

class TWExtensionLibrary extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            selectedTag: ALL,
            query: ''
        };
        this.handleQuery = this.handleQuery.bind(this);
        this.handleSelectTag = this.handleSelectTag.bind(this);
    }

    handleQuery (e) {
        this.setState({query: e.target.value});
    }

    handleSelectTag (tag) {
        this.setState({selectedTag: tag});
    }

    matchesTag (item) {
        if (this.state.selectedTag === ALL) {
            return true;
        }
        return Array.isArray(item.tags) && item.tags.includes(this.state.selectedTag);
    }

    matchesQuery (item) {
        const query = this.state.query.trim().toLowerCase();
        if (!query) {
            return true;
        }
        const haystack = `${item.name || ''} ${item.description || ''}`.toLowerCase();
        return haystack.includes(query);
    }

    render () {
        const {intl, tags, title, onRequestClose, onItemSelected} = this.props;
        const items = (this.props.data || []).filter(isExtension);
        const visible = items.filter(item => this.matchesTag(item) && this.matchesQuery(item));

        const sidebarTags = [{tag: ALL, intlLabel: intl.formatMessage(messages.all)}, ...tags];

        return (
            <Modal
                className={styles.modalContent}
                contentLabel={title}
                onRequestClose={onRequestClose}
                id="extensionLibrary"
                width={1040}
                height={720}
                minWidth={760}
                minHeight={520}
            >
                <ModalSidebarLayout className={styles.layout}>
                    <ModalSidebar
                        ariaLabel={title}
                        width="narrow"
                    >
                        {sidebarTags.map(tag => (
                            <TagItem
                                key={tag.tag}
                                tag={tag.tag}
                                label={labelOf(tag, intl)}
                                count={tag.tag === ALL ?
                                    items.length :
                                    items.filter(item => Array.isArray(item.tags) &&
                                        item.tags.includes(tag.tag)).length}
                                selected={this.state.selectedTag === tag.tag}
                                onSelect={this.handleSelectTag}
                            />
                        ))}
                    </ModalSidebar>

                    <div className={styles.content}>
                        <div className={styles.searchRow}>
                            <Search
                                className={styles.searchIcon}
                                size={18}
                            />
                            <input
                                className={styles.search}
                                placeholder={intl.formatMessage(messages.search)}
                                value={this.state.query}
                                onChange={this.handleQuery}
                                autoFocus
                            />
                        </div>
                        <div className={styles.scroll}>
                            <div className={styles.grid}>
                                {visible.map((item, index) => (
                                    <ExtensionCard
                                        key={`${item.extensionId || 'link'}-${index}`}
                                        item={item}
                                        onSelect={onItemSelected}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </ModalSidebarLayout>
            </Modal>
        );
    }
}

TWExtensionLibrary.propTypes = {
    intl: intlShape,
    // eslint-disable-next-line react/forbid-prop-types
    data: PropTypes.array,
    tags: PropTypes.arrayOf(PropTypes.object),
    title: PropTypes.string,
    onItemSelected: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func
};

export default injectIntl(TWExtensionLibrary);
