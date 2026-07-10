import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {AlignLeft, AlignCenter, AlignRight, GripVertical} from 'lucide-react';

import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import styles from './settings-modal.css';
import {
    ZONES,
    getZoneDisplayOrder,
    getZoneExtras,
    setZoneOrder,
    getHidden,
    setHidden,
    getPresentOrderedIds
} from '../../lib/mw-menu-bar-layout';
import {Theme} from '../../lib/themes/index.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';

const LABELS = {
    'file': 'File',
    'view': 'View',
    'bookmarks': 'Bookmarks',
    'edit': 'Edit',
    'tools': 'Tools',
    'mode': 'Mode',
    'block-count': 'Block Count',
    'save-status': 'Save Status',
    'addons': 'Addons',
    'settings': 'Settings',
    'about': 'About',
    'project-title': 'Project Title',
    'community': 'View Project Page',
    'rotur-account': 'Rotur Profile'
};

const SECTIONS = [
    {label: 'Menus', zones: ['left']},
    {label: 'Top-right', zones: ['right']}
];

const ALIGN_OPTIONS = [
    {
        id: 'left',
        icon: AlignLeft,
        label: (
            <FormattedMessage
                defaultMessage="Left aligned"
                description="Menu bar alignment option"
                id="mw.settings.menuBar.alignLeft"
            />
        )
    },
    {
        id: 'center',
        icon: AlignCenter,
        label: (
            <FormattedMessage
                defaultMessage="Middle aligned"
                description="Menu bar alignment option"
                id="mw.settings.menuBar.alignMiddle"
            />
        )
    },
    {
        id: 'right',
        icon: AlignRight,
        label: (
            <FormattedMessage
                defaultMessage="Right aligned"
                description="Menu bar alignment option"
                id="mw.settings.menuBar.alignRight"
            />
        )
    }
];

const isVisibleItem = id => !id.startsWith('__');

class MenuBarLayoutSetting extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleDragEnd', 'handleAlignChange']);
        const present = getPresentOrderedIds();
        this.state = {
            present,
            orders: this.readOrders(present),
            hidden: getHidden(),
            dragId: null,
            dragZone: null
        };
    }
    readOrders (present) {
        const orders = {};
        for (const zone of ZONES) {
            orders[zone.id] = getZoneDisplayOrder(zone.id, present);
        }
        return orders;
    }
    handleToggle (id) {
        return e => {
            setHidden(id, !e.target.checked);
            this.setState({hidden: getHidden()});
        };
    }
    handleDragStart (zoneId, id) {
        return () => this.setState({dragId: id, dragZone: zoneId});
    }
    handleDragEnd () {
        this.setState({dragId: null, dragZone: null});
    }
    handleDrop (zoneId, overId) {
        return e => {
            e.preventDefault();
            const {dragId, dragZone} = this.state;
            if (!dragId || dragZone !== zoneId || dragId === overId) return;
            const order = this.state.orders[zoneId].slice();
            const from = order.indexOf(dragId);
            const to = order.indexOf(overId);
            if (from === -1 || to === -1) return;
            order.splice(from, 1);
            order.splice(to, 0, dragId);
            setZoneOrder(zoneId, order);
            this.setState(prev => ({
                orders: {...prev.orders, [zoneId]: order},
                dragId: null,
                dragZone: null
            }));
        };
    }
    handleAlignChange (id) {
        return () => {
            if (!this.props.theme || this.props.theme.menuBarAlign === id) return;
            this.props.onChangeMenuBarAlign(this.props.theme.set('menuBarAlign', id));
        };
    }
    renderRow (zoneId, id, draggable) {
        const visible = !this.state.hidden.includes(id);
        const canHide = id !== 'rotur-account' && id !== 'save-status';
        return (
            <div
                key={id}
                className={styles.menuBarRow}
                draggable={draggable}
                onDragStart={draggable ? this.handleDragStart(zoneId, id) : null}
                onDragEnd={draggable ? this.handleDragEnd : null}
                onDragOver={draggable ? (e => e.preventDefault()) : null}
                onDrop={draggable ? this.handleDrop(zoneId, id) : null}
            >
                {draggable && (
                    <GripVertical
                        className={styles.menuBarGrip}
                        size={16}
                    />
                )}
                <span className={styles.menuBarRowLabel}>{LABELS[id] || id}</span>
                <FancyCheckbox
                    className={styles.checkbox}
                    checked={canHide ? visible : true}
                    disabled={!canHide}
                    onChange={canHide ? this.handleToggle(id) : null}
                />
            </div>
        );
    }
    renderZone (zoneId) {
        const ids = (this.state.orders[zoneId] || []).filter(isVisibleItem);
        const extras = getZoneExtras(zoneId, this.state.present).filter(isVisibleItem);
        return (
            <React.Fragment key={zoneId}>
                {ids.map(id => this.renderRow(zoneId, id, true))}
                {extras.map(id => this.renderRow(null, id, false))}
            </React.Fragment>
        );
    }
    sectionRowCount (section) {
        return section.zones.reduce((count, zoneId) => (
            count +
            (this.state.orders[zoneId] || []).filter(isVisibleItem).length +
            getZoneExtras(zoneId, this.state.present).filter(isVisibleItem).length
        ), 0);
    }
    render () {
        const currentAlign = (this.props.theme && this.props.theme.menuBarAlign) || 'center';
        return (
            <div className={styles.setting}>
                <div className={styles.menuBarZoneLabel}>
                    <FormattedMessage
                        defaultMessage="Alignment"
                        description="Label for menu bar alignment selector in settings"
                        id="mw.settings.menuBar.alignment"
                    />
                </div>
                <div
                    className={styles.alignSelector}
                    role="radiogroup"
                    aria-label="Menu bar alignment"
                >
                    {ALIGN_OPTIONS.map(option => {
                        const Icon = option.icon;
                        const selected = currentAlign === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                className={classNames(styles.alignOption, {
                                    [styles.alignOptionSelected]: selected
                                })}
                                onClick={this.handleAlignChange(option.id)}
                            >
                                <Icon size={18} />
                                <span>{option.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className={styles.menuBarHint}>
                    <FormattedMessage
                        defaultMessage="Drag to reorder items within each group. Uncheck to hide."
                        id="mw.settingsModal.menuBarHint"
                    />
                </div>
                {SECTIONS.map(section => {
                    if (this.sectionRowCount(section) === 0) return null;
                    return (
                        <div key={section.label}>
                            <div className={styles.menuBarZoneLabel}>{section.label}</div>
                            {section.zones.map(zoneId => this.renderZone(zoneId))}
                        </div>
                    );
                })}
            </div>
        );
    }
}

MenuBarLayoutSetting.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeMenuBarAlign: PropTypes.func
};

const mapStateToProps = state => ({
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeMenuBarAlign: theme => {
        dispatch(setTheme(theme));
        applyTheme(theme);
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MenuBarLayoutSetting);
