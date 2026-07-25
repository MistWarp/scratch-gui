import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {Search} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import {
    ModalSidebar,
    ModalSidebarGroup,
    ModalSidebarGroupHeader,
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
const topExtensionIds = new Set(['tw', 'custom_extension', 'gallery']);
const sources = [
    ['scratch', 'Scratch'],
    ['tw', 'TurboWarp'],
    ['mistium', 'Mistium'],
    ['rotur', 'Rotur']
];

const labelOf = (tag, intl) => (
    typeof tag.intlLabel === 'string' ? tag.intlLabel : intl.formatMessage(tag.intlLabel)
);

// A real, loadable extension (not a divider or gallery-status card).
const isExtension = item => item && typeof item === 'object' && (item.extensionId || item.href);

const TagItem = ({tag, label, selected, onSelect}) => {
    const handleClick = React.useCallback(() => onSelect(tag), [onSelect, tag]);
    return (
        <ModalSidebarItem
            label={label}
            selected={selected}
            onClick={handleClick}
        />
    );
};

TagItem.propTypes = {
    tag: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    selected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired
};

const ExtensionSection = ({children, title}) => (
    <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.grid}>{children}</div>
    </section>
);

ExtensionSection.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.node.isRequired
};

const ExtensionCard = ({item, onSelect}) => {
    const handleClick = React.useCallback(() => onSelect(item), [onSelect, item]);
    const icon = item.iconURL || item.rawURL;
    const content = (
        <React.Fragment>
            {icon ? (
                <img
                    className={styles.cardIcon}
                    src={icon}
                    alt=""
                    draggable={false}
                />
            ) : <div className={styles.cardIcon} />}
            {item.insetIconURL ? (
                <img
                    className={styles.cardInsetIcon}
                    src={item.insetIconURL}
                    alt=""
                    draggable={false}
                />
            ) : null}
            <div className={styles.cardText}>
                <div className={styles.cardName}>{item.name}</div>
                {item.description ? (
                    <div className={styles.cardDescription}>{item.description}</div>
                ) : null}
            </div>
        </React.Fragment>
    );
    const info = item.docsURI || item.samples || item.credits || item.bluetoothRequired ||
        item.internetConnectionRequired || item.collaborator ? (
            <div className={styles.cardInfo}>
                {item.docsURI ? (
                    <a
                        href={item.docsURI}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <FormattedMessage
                            defaultMessage="Documentation"
                            id="tw.documentation"
                        />
                    </a>
                ) : null}
                {item.samples && item.samples[0] ? (
                    <a
                        href={item.samples[0].href}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <FormattedMessage
                            defaultMessage="Sample project"
                            id="tw.sample"
                        />
                    </a>
                ) : null}
                {item.credits && item.credits.length ? (
                    <span>
                        <FormattedMessage
                            defaultMessage="Created by:"
                            id="tw.createdBy"
                        />
                        {' '}
                        {item.credits.map((credit, index) => (
                            <React.Fragment key={index}>
                                {credit}{index < item.credits.length - 1 ? ', ' : null}
                            </React.Fragment>
                        ))}
                    </span>
                ) : null}
                {item.bluetoothRequired || item.internetConnectionRequired ? (
                    <span>
                        <FormattedMessage
                            defaultMessage="Requires"
                            id="gui.extensionLibrary.requires"
                        />
                        {': '}
                        {[item.bluetoothRequired && 'Bluetooth', item.internetConnectionRequired && 'Internet']
                            .filter(Boolean).join(', ')}
                    </span>
                ) : null}
                {item.collaborator ? (
                    <span>
                        <FormattedMessage
                            defaultMessage="Collaboration with"
                            id="gui.extensionLibrary.collaboration"
                        />
                        {': '}
                        {item.collaborator}
                    </span>
                ) : null}
            </div>
        ) : null;
    return (
        <div className={classNames(styles.card, {[styles.cardDisabled]: item.disabled})}>
            {item.href ? (
                <a
                    className={styles.cardSelect}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {content}
                </a>
            ) : (
                <button
                    className={styles.cardSelect}
                    onClick={handleClick}
                    disabled={item.disabled}
                    type="button"
                >
                    {content}
                </button>
            )}
            {info}
        </div>
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
        const data = this.props.data || [];
        const divider = data.indexOf('---');
        const builtIn = data.slice(0, divider === -1 ? data.length : divider).filter(isExtension);
        const gallery = divider === -1 ? [] : data.slice(divider + 1).filter(isExtension);
        const matches = item => this.matchesTag(item) && this.matchesQuery(item);
        const items = builtIn.concat(gallery);
        const visible = items.filter(matches);
        const top = visible.filter(item => topExtensionIds.has(item.extensionId));
        const sourceOf = item => item.source ||
            (item.tags.includes('rotur') ? 'rotur' : item.tags.includes('mistium') ? 'mistium' :
                item.tags.includes('tw') ? 'tw' : 'scratch');
        const sections = sources.map(([source, sourceTitle]) => ({
            title: sourceTitle,
            items: visible.filter(item =>
                !topExtensionIds.has(item.extensionId) && sourceOf(item) === source
            )
        })).filter(section => section.items.length);
        const showSections = this.state.selectedTag === ALL && !this.state.query.trim() &&
            (top.length || sections.length > 1);

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
                        width="wide"
                    >
                        <ModalSidebarGroup>
                            <ModalSidebarGroupHeader label="Extensions" />
                            {sidebarTags.map(tag => (
                                <TagItem
                                    key={tag.tag}
                                    tag={tag.tag}
                                    label={labelOf(tag, intl)}
                                    selected={this.state.selectedTag === tag.tag}
                                    onSelect={this.handleSelectTag}
                                />
                            ))}
                        </ModalSidebarGroup>
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
                            {showSections ? (
                                <React.Fragment>
                                    {top.length ? (
                                        <div className={styles.grid}>
                                            {top.map((item, index) => (
                                                <ExtensionCard
                                                    key={`${item.extensionId || 'link'}-${index}`}
                                                    item={item}
                                                    onSelect={onItemSelected}
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                    {sections.map(section => (
                                        <ExtensionSection
                                            key={section.title}
                                            title={section.title}
                                        >
                                            {section.items.map((item, index) => (
                                                <ExtensionCard
                                                    key={`${item.extensionId || 'link'}-${index}`}
                                                    item={item}
                                                    onSelect={onItemSelected}
                                                />
                                            ))}
                                        </ExtensionSection>
                                    ))}
                                </React.Fragment>
                            ) : (
                                <div className={styles.grid}>
                                    {visible.map((item, index) => (
                                        <ExtensionCard
                                            key={`${item.extensionId || 'link'}-${index}`}
                                            item={item}
                                            onSelect={onItemSelected}
                                        />
                                    ))}
                                </div>
                            )}
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
