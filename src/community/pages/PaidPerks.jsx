import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {ArrowRight, BarChart3, Check, Coins, ExternalLink, Heart, Palette, Plus, RotateCcw, Server, Sparkles, X} from 'lucide-react';
import {Link} from 'react-router-dom';
import api from '../api.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import analyticsScreenshot from '../assets/membership/analytics.png';
import brandingScreenshot from '../assets/membership/branding.png';
import recoveryScreenshot from '../assets/membership/recovery.png';
import styles from './PaidPerks.module.css';

const TIERS = ['Free', 'Lite', 'Plus', 'Pro'];
const PRICES = {Free: 'Free', Lite: '15 RC/month', Plus: '£1.75/month', Pro: '£5.75/month'};

const MISTWARP_ROWS = [
    ['Weekly uploads', 'weeklyUploadBytes', value => `${Math.round(value / 1048576).toLocaleString(getCommunityLocale())} MB`],
    ['Total project assets', 'maxProjectAssetsBytes', value => `${Math.round(value / 1048576).toLocaleString(getCommunityLocale())} MB`],
    ['Largest project asset', 'maxProjectAssetBytes', value => `${Math.round(value / 1048576).toLocaleString(getCommunityLocale())} MB`],
    ['Deleted project recovery', 'recoveryDays', (value, text) => text('{count} days', {count: value})],
    ['Creator analytics history', 'analyticsDays', (value, text) => (value === 0 ? text('All time') : text('{count} days', {count: value}))],
    ['Advanced analytics and CSV exports', 'advancedAnalytics', String],
    ['Custom project branding', 'customProjectBranding', String],
    ['Vanity project URLs', 'vanityProjectUrls', String],
    ['Project sales fee', 'salesFeeBasisPoints', value => `${value / 100}%`],
    ['Maximum project price', 'maxProjectPrice', value => `${value} RC`]
];

const Cell = ({value, format}) => {
    const {text: communityText} = useCommunityText();
    if (typeof value === 'boolean') return (value ? <Check aria-label={communityText('Included')} size={17} /> : <X aria-label={communityText('Not included')} size={17} />);
    if (typeof value === 'undefined' || value === null) return '—';
    return format ? format(value, communityText) : String(value);
};

const Comparison = ({plans, rows, source}) => {
    const {text: communityText} = useCommunityText();
    return (<div className={styles.tableWrap}>
        <table>
            <thead><tr><th scope="col">{communityText('Benefit')}</th>{TIERS.map(tier => <th scope="col" key={tier}>{tier}</th>)}</tr></thead>
            <tbody>{rows.map(([label, key, format]) => (
                <tr key={key}>
                    <th scope="row">{communityText(label)}</th>
                    {TIERS.map(tier => {
                        const plan = plans.find(item => item.tier === tier);
                        return <td key={tier}><Cell format={format} value={plan?.[source]?.[key]} /></td>;
                    })}
                </tr>
            ))}</tbody>
        </table>
    </div>);
};

Cell.propTypes = {
    value: PropTypes.oneOfType([PropTypes.bool, PropTypes.number, PropTypes.string]),
    format: PropTypes.func
};

Comparison.propTypes = {
    plans: PropTypes.arrayOf(PropTypes.object).isRequired,
    rows: PropTypes.arrayOf(PropTypes.array).isRequired,
    source: PropTypes.string.isRequired
};

const PaidPerks = () => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [comparison, setComparison] = useState('tools');

    useEffect(() => {
        let active = true;
        api.perks().then(result => active && setData(result)).catch(e => active && setError(e.message));
        return () => {
            active = false;
        };
    }, [user?.username, user?.subscription]);

    if (error) return <main className={styles.page}><StatusMessage error>{error}</StatusMessage></main>;
    if (!data) return <main className={styles.page}><StatusMessage>{communityText('Loading membership benefits…')}</StatusMessage></main>;

    const currentTier = data.current?.tier || 'Free';
    const plans = data.plans || [];
    const features = [
        {
            icon: BarChart3,
            title: communityText('Get to know your audience'),
            description: communityText('Explore how your projects are doing, see view-to-buyer conversion, and export your analytics to CSV. Plus and Pro include these extra insights and a longer analytics history.'),
            image: analyticsScreenshot,
            width: 710,
            height: 630,
            alt: communityText('Example project analytics showing views, playtime, buyer conversion, and CSV export'),
            link: '/mystuff?section=projects',
            action: communityText('Choose a project to view analytics')
        },
        {
            icon: Palette,
            title: communityText('Give your project its own identity'),
            description: communityText('Set an accent colour and a tagline with Plus or Pro. Pro also includes a custom project URL that is easier to share.'),
            image: brandingScreenshot,
            width: 710,
            height: 479,
            alt: communityText('Project branding settings with an accent colour and tagline'),
            link: '/mystuff?section=projects',
            action: communityText('Choose a project to customise')
        },
        {
            icon: RotateCcw,
            title: communityText('Give yourself more time to recover work'),
            description: communityText('Changed your mind about deleting a project? Every account includes recovery from Trash. Memberships give you a longer window to restore projects you chose to delete. This is separate from keeping older projects online.'),
            image: recoveryScreenshot,
            width: 910,
            height: 176,
            alt: communityText('Deleted example projects in Trash with Restore buttons'),
            link: '/mystuff?section=trash',
            action: communityText('Open your Trash')
        }
    ];
    const storageKeys = ['weeklyUploadBytes', 'maxProjectAssetsBytes', 'maxProjectAssetBytes'];
    const salesKeys = ['salesFeeBasisPoints', 'maxProjectPrice'];
    const rows = MISTWARP_ROWS.filter(([, key]) => {
        if (comparison === 'storage') return storageKeys.includes(key);
        if (comparison === 'sales') return salesKeys.includes(key);
        return !storageKeys.includes(key) && !salesKeys.includes(key);
    });
    const planDescriptions = {
        Free: communityText('Start creating and find your community.'),
        Lite: communityText('Support MistWarp with Rotur credits.'),
        Plus: communityText('Get more insight and make your projects your own.'),
        Pro: communityText('More flexibility for an established creator.')
    };
    return (
        <main className={styles.page}>
            <PageHeader
                icon={Sparkles}
                title={communityText('More tools for your next project')}
                lead={communityText('Get more from creating on MistWarp with a Rotur membership. Your support helps cover the real costs of running the platform we share.')}
                actions={<Button as="a" href="#memberships" variant="primary"><Heart size={16} />{communityText('Find your membership')}</Button>}
            >
                <p className={styles.freeNote}>
                    {communityText('You can create, share, and take part with a free account. Membership is an optional way to support MistWarp and get extra tools.')}{' '}
                    <Link to="/editor">{communityText('Start creating for free')} <ArrowRight size={14} /></Link>
                </p>
            </PageHeader>

            <section className={styles.features} aria-label={communityText('Explore membership features')}>
                {features.map(feature => (
                    <article className={styles.feature} key={feature.title}>
                        <figure className={styles.screenshot}>
                            <img src={feature.image} alt={feature.alt} loading="lazy" width={feature.width} height={feature.height} />
                            <figcaption>{communityText('MistWarp interface with example project data.')}</figcaption>
                        </figure>
                        <div className={styles.featureCopy}>
                            <SectionHeading icon={feature.icon} title={feature.title} />
                            <p>{feature.description}</p>
                            <Link className={styles.featureLink} to={feature.link}>{feature.action}<ArrowRight size={16} /></Link>
                        </div>
                    </article>
                ))}
            </section>

            <section className={styles.support}>
                <SectionHeading icon={Server} title={communityText('Help keep MistWarp running')} />
                <div className={styles.supportCopy}>
                    <p>{communityText('Keeping projects available has an ongoing cost, including storing older work. Memberships help cover storage, hosting, and the work of maintaining MistWarp. Projects do not expire just because they are old or their creator is inactive.')}</p>
                    <p>{communityText('Rotur runs MistWarp, so support goes through your Rotur membership. Use the same Rotur account here to receive your benefits. You do not need a separate MistWarp subscription.')}</p>
                </div>
            </section>

            <section id="memberships" className={styles.section}>
                <SectionHeading icon={Heart} title={communityText('Choose how you support MistWarp')} lead={communityText('Keep creating for free, or choose the extra tools that fit you. Prices below are monthly; Rotur shows the billing options and payment terms before you join.')} />
                <div className={styles.plans}>
                    {plans.map(plan => (
                        <article className={`${styles.plan} ${user && plan.tier === currentTier ? styles.current : ''}`} key={plan.tier}>
                            <div className={styles.planTitle}><h3>{plan.tier}</h3>{user && plan.tier === currentTier ? <span>{communityText('Your membership')}</span> : null}</div>
                            <strong>{PRICES[plan.tier]}</strong>
                            <p>{planDescriptions[plan.tier]}</p>
                            <ul>
                                {plan.tier === 'Free' ? <li><Check size={15} />{communityText('Create, share, and join the community')}</li> : null}
                                <li><RotateCcw size={15} />{communityText('{count} days to undo a deletion', {count: plan.mistwarp.recoveryDays})}</li>
                                <li><BarChart3 size={15} />{plan.mistwarp.analyticsDays === 0 ? communityText('All-time analytics history') : communityText('{count} days of analytics history', {count: plan.mistwarp.analyticsDays})}</li>
                                {plan.mistwarp.advancedAnalytics ? <li><Check size={15} />{communityText('Advanced analytics and CSV exports')}</li> : null}
                                {plan.mistwarp.customProjectBranding ? <li><Palette size={15} />{communityText('Custom project branding')}</li> : null}
                                {plan.mistwarp.vanityProjectUrls ? <li><Check size={15} />{communityText('Custom project URLs')}</li> : null}
                                {plan.tier !== 'Free' ? <li><Coins size={15} />{communityText('{fee}% project sales fee', {fee: plan.mistwarp.salesFeeBasisPoints / 100})}</li> : null}
                            </ul>
                            {plan.tier === 'Free' ? <Button as={Link} to="/editor"><Plus size={15} />{communityText('Start creating')}</Button> : (
                                <Button as="a" href={data.roturMembershipUrl} target="_blank" rel="noopener noreferrer" variant={plan.tier === 'Plus' ? 'primary' : 'secondary'}>
                                    <ExternalLink size={15} />{communityText('View {tier} on Rotur', {tier: plan.tier})}
                                </Button>
                            )}
                        </article>
                    ))}
                </div>
                {!user ? <p className={styles.accountNote}><Button onClick={login}>{communityText('Sign in to view your membership')}</Button></p> : null}
            </section>

            <section className={styles.section}>
                <SectionHeading icon={Check} title={communityText('Compare the details')} lead={communityText('Check the tools, allowances, and sales terms included with each membership.')} />
                <UnderlineTabs
                    items={[{key: 'tools', label: communityText('Creator tools')}, {key: 'storage', label: communityText('Uploads and storage')}, {key: 'sales', label: communityText('Project sales')}]}
                    value={comparison}
                    onChange={setComparison}
                    ariaLabel={communityText('Membership comparison')}
                />
                <div role="tabpanel" aria-label={communityText('Membership comparison details')}>
                    <Comparison plans={plans} rows={rows} source="mistwarp" />
                    {comparison === 'storage' ? <p className={styles.detailNote}>{communityText('Uploads currently use a rolling seven-day allowance. Capacity becomes available as older uploads leave that window. Check your usage and upcoming resets in My stuff.')}{' '}<Link to="/mystuff?section=uploads">{communityText('View your upload usage')} <ArrowRight size={14} /></Link></p> : null}
                    {comparison === 'sales' ? <p className={styles.detailNote}>{communityText('Project purchases support individual creators. A membership does not include access to every project offered for purchase.')}{' '}<Link to="/mystuff?section=projects">{communityText('Manage project pricing')} <ArrowRight size={14} /></Link></p> : null}
                </div>
            </section>
        </main>
    );
};

export {MISTWARP_ROWS};
export default PaidPerks;
