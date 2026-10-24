/* eslint-disable max-len */
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {ArrowUpRight, Backpack, FolderOpen, Trash2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {projectUrl} from '../api';
import {formatBytes} from '../format';
import Notice from './ui/Notice.jsx';
import QuietLink from './ui/QuietLink.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './MyStuffStorage.module.css';

const ROTUR_MEMBERSHIP_URL = 'https://rotur.dev/membership';

const number = value => Math.max(0, Number(value) || 0);
const share = (bytes, limit) => (limit > 0 ? Math.min(100, (number(bytes) / limit) * 100) : 0);

// Rotur accounts have one storage allowance shared by every Rotur app, shown
// in the decimal units plans are sold in. Classroom students have their
// class's storage instead.
const storageSize = quota => value => formatBytes(value, {decimal: Boolean(quota && quota.shared === true)});

const storageRemaining = quota => quota.remaining ??
    Math.max(0, number(quota.limit) - number(quota.used) - number(quota.pending));

const storageFull = quota => Boolean(quota) && quota.known !== false && number(quota.limit) > 0 &&
    storageRemaining(quota) <= 0;

// Where the allowance goes. For Rotur accounts: MistWarp's part, the rest of
// Rotur, and uploads waiting for a save. For classroom accounts: projects (with
// the trash), the backpack, and uploads waiting for a save.
const storageParts = quota => {
    const used = number(quota.used);
    const pending = number(quota.pending);
    if (quota.shared === true) {
        const mistwarp = Math.min(used, number(quota.mistwarp));
        return [
            {key: 'mistwarp', bytes: mistwarp},
            {key: 'rotur', bytes: Math.max(0, used - mistwarp)},
            {key: 'pending', bytes: pending}
        ];
    }
    const backpack = Math.min(used, number(quota.backpack));
    return [
        {key: 'projects', bytes: Math.max(0, used - backpack)},
        {key: 'backpack', bytes: backpack},
        {key: 'pending', bytes: pending}
    ];
};

const MembershipLink = ({quota}) => {
    const {text: communityText} = useCommunityText();
    return (
        <a
            className={styles.link}
            href={(quota && quota.membershipUrl) || ROTUR_MEMBERSHIP_URL}
            target="_blank"
            rel="noopener noreferrer"
        >{communityText('Rotur membership')}</a>
    );
};

MembershipLink.propTypes = {
    quota: PropTypes.object
};

// The storage warning: when it's full anywhere on My Stuff, and when it's
// nearly full on the views where you'd act on it.
const StorageWarning = ({className, fullOnly, quota}) => {
    const {text: communityText, rich: communityRich} = useCommunityText();
    if (!quota || quota.known === false || !(number(quota.limit) > 0)) return null;
    const size = storageSize(quota);
    const full = storageFull(quota);
    const pct = Math.floor(((number(quota.used) + number(quota.pending)) / number(quota.limit)) * 100);
    if (!full && (fullOnly || pct < 80)) return null;
    if (quota.shared === true) {
        return full ? (
            <Notice variant="warning" className={className} title={communityText('Your Rotur storage is full')}>
                {communityRich('You can still save a project at the same size or smaller. To save more, delete projects or backpack items you no longer need and empty the trash, or get more storage with a {link}.', {link: <MembershipLink key="link" quota={quota} />})}
            </Notice>
        ) : (
            <Notice variant="warning" className={className}>
                {communityText('Your Rotur storage is {value1}% full: {value2} of {value3}.', {
                    value1: pct,
                    value2: size(quota.used),
                    value3: size(quota.limit)
                })}
            </Notice>
        );
    }
    return (
        <Notice variant={full ? 'error' : 'warning'} className={className}>
            {full ?
                communityText('Your storage is full: your projects use {value1} of your {value2}. You can still save a project at the same size or smaller. To add more, delete projects you no longer need and empty them from the trash.', {
                    value1: size(quota.used),
                    value2: size(quota.limit)
                }) :
                communityText('Your projects use {value1} of your {value2} of storage ({value3}%).', {
                    value1: size(quota.used),
                    value2: size(quota.limit),
                    value3: pct
                })}
        </Notice>
    );
};

StorageWarning.propTypes = {
    className: PropTypes.string,
    fullOnly: PropTypes.bool,
    quota: PropTypes.object
};

const MyStuffStorage = ({error, onRetry, perks, quota}) => {
    const {text: communityText, rich: communityRich} = useCommunityText();
    if (error) {
        return <StatusMessage compact error onRetry={onRetry}>{communityText('Could not load storage usage.')}</StatusMessage>;
    }
    if (!quota) {
        return <StatusMessage compact>{communityText('Loading storage usage…')}</StatusMessage>;
    }
    const shared = quota.shared === true;
    const known = quota.known !== false;
    const size = storageSize(quota);
    const limit = number(quota.limit);
    const remaining = storageRemaining(quota);
    const full = storageFull(quota);
    const parts = storageParts(quota);
    const names = {
        mistwarp: communityText('Used by MistWarp'),
        rotur: communityText('Your other Rotur apps'),
        projects: communityText('Projects and trash'),
        backpack: communityText('Backpack'),
        pending: communityText('Waiting for a save')
    };
    const largest = (quota.largest || []).filter(project => project.bytes > 0);
    const backpack = number(quota.backpack);
    const biggest = Math.max(1, backpack, ...largest.map(project => project.bytes));
    const anyTrashed = largest.some(project => project.trashed);

    return (
        <section className={styles.storage}>
            <SectionHeading
                title={communityText('Storage')}
                actions={shared ? (
                    <a
                        className={styles.more}
                        href={quota.membershipUrl || ROTUR_MEMBERSHIP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >{communityText('Get more storage')}<ArrowUpRight size={14} aria-hidden="true" /></a>
                ) : null}
            />
            {known ? (
                <div className={styles.summary}>
                    <p className={styles.used}>
                        {communityRich('{used} of {limit}', {
                            used: <strong key="used">{size(quota.used)}</strong>,
                            limit: size(limit)
                        })}
                        {shared ? <span className={styles.scope}>{communityText('Used across Rotur')}</span> : null}
                    </p>
                    <div
                        className={classNames(styles.meter, {[styles.meterFull]: full})}
                        role="img"
                        aria-label={communityText('{value1} of {value2} used, {value3} free', {
                            value1: size(number(quota.used) + number(quota.pending)),
                            value2: size(limit),
                            value3: size(remaining)
                        })}
                    >
                        {parts.filter(part => part.bytes > 0).map(part => (
                            <span
                                key={part.key}
                                className={classNames(styles.part, styles[part.key])}
                                style={{width: `${share(part.bytes, limit)}%`}}
                            />
                        ))}
                    </div>
                    <ul className={styles.legend}>
                        {parts.filter(part => part.bytes > 0 || part.key === 'mistwarp' || part.key === 'projects').map(part => (
                            <li key={part.key}>
                                <span className={classNames(styles.swatch, styles[part.key])} aria-hidden="true" />
                                {names[part.key]}
                                <span className={styles.faint}>{size(part.bytes)}</span>
                            </li>
                        ))}
                        <li className={styles.free}>{communityText('{value1} free', {value1: size(remaining)})}</li>
                    </ul>
                </div>
            ) : (
                <Notice variant="warning">
                    {communityText('Rotur couldn’t say how much storage you have left just now. Try again in a minute.')}
                </Notice>
            )}
            <StorageWarning fullOnly quota={quota} />
            {shared && !full ? (
                <p className={styles.note}>
                    {communityText('Your projects, their history and your backpack count against your Rotur storage, which your other Rotur apps share.')}
                    {perks ? ` ${communityText('Your {value1} membership allows {value2} of assets per project and {value3} per asset.', {
                        value1: perks.tier,
                        value2: formatBytes(perks.mistwarp.maxProjectAssetsBytes),
                        value3: formatBytes(perks.mistwarp.maxProjectAssetBytes)
                    })}` : null}
                </p>
            ) : null}

            <SectionHeading
                as="h3"
                className={styles.listHeading}
                title={communityText('Largest projects')}
                actions={anyTrashed ? <QuietLink to="/mystuff?section=trash">{communityText('Open Trash')}</QuietLink> : null}
            />
            {largest.length || backpack ? (
                <ul className={styles.list}>
                    {largest.map(project => {
                        const Icon = project.trashed ? Trash2 : FolderOpen;
                        const title = project.title || communityText('Untitled');
                        return (
                            <li key={project.id} className={styles.row}>
                                <span className={styles.icon} aria-hidden="true"><Icon size={16} /></span>
                                <span className={styles.part}>
                                    <span className={styles.name}>
                                        {project.trashed ? title : <Link to={projectUrl(project.id)}>{title}</Link>}
                                        {project.trashed ? <span className={styles.faint}>{communityText('In the trash')}</span> : null}
                                    </span>
                                    <span className={styles.bar} aria-hidden="true">
                                        <span style={{width: `${Math.max(2, (project.bytes / biggest) * 100)}%`}} />
                                    </span>
                                </span>
                                <span className={styles.size}>{size(project.bytes)}</span>
                            </li>
                        );
                    })}
                    {backpack ? (
                        <li className={styles.row}>
                            <span className={styles.icon} aria-hidden="true"><Backpack size={16} /></span>
                            <span className={styles.part}>
                                <span className={styles.name}>{communityText('Backpack')}</span>
                                <span className={styles.bar} aria-hidden="true">
                                    <span style={{width: `${Math.max(2, (backpack / biggest) * 100)}%`}} />
                                </span>
                            </span>
                            <span className={styles.size}>{size(backpack)}</span>
                        </li>
                    ) : null}
                </ul>
            ) : (
                <p className={styles.note}>{communityText('Your projects are not using any storage yet.')}</p>
            )}
            <p className={styles.note}>
                {communityText('Each project counts its assets, project data and version history, including projects in the trash. An asset used in several of your projects counts once. To free space, delete projects you no longer need and empty them from the trash.')}
            </p>
        </section>
    );
};

MyStuffStorage.propTypes = {
    error: PropTypes.bool,
    onRetry: PropTypes.func.isRequired,
    perks: PropTypes.object,
    quota: PropTypes.object
};

export {StorageWarning, storageFull, storageParts, storageRemaining, storageSize};
export default MyStuffStorage;
