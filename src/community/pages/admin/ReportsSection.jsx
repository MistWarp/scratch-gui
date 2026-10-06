/* eslint-disable max-len */
import React from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {Flag, UserSearch} from 'lucide-react';
import {projectUrl} from '../../api';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {timeAgo} from '../../format';
import styles from '../Admin.module.css';
import EvidencePanel from './EvidencePanel.jsx';
import {adminUserPath} from './admin-links.js';

// The open moderation queue: reports and support requests with their actions.
const ReportsSection = ({reports, openCount, replyToSupport, act, warnFromReport, banFromReport}) => {
    const {text: communityText} = useCommunityText();
    return (
        <section className={styles.card}>
            <SectionHeading icon={Flag} title={communityText('Open reports')} count={openCount} />
            {reports === null ? (
                <StatusMessage />
            ) : reports.length ? (
                <div className={styles.list}>
                    {reports.map(report => (
                        <div
                            key={report.id}
                            className={styles.row}
                        >
                            <div className={styles.rowInfo}>
                                <span className={styles.rowTitle}>
                                    {report.type === 'support' ? communityText('{value1} request from @{value2}', {value1: report.supportType || 'Support', value2: report.reporter}) : report.type === 'project' ? (
                                        <Link
                                            to={projectUrl(report.target)}
                                        >{communityText('Project {value1}', {value1: report.target})}</Link>
                                    ) : report.type === 'user' ? (
                                        <Link
                                            to={`/users/${report.target}`}
                                        >{`@${report.target}`}</Link>
                                    ) : report.type === 'bounty' ? (
                                        <Link to={`/bounties/${report.target}`}>{communityText('Bounty {value1}', {value1: report.target})}</Link>
                                    ) : report.type === 'comment' && report.context ? (
                                        (() => {
                                            const ctx = report.context;
                                            const target = report.target;
                                            if (ctx.startsWith('project ')) {
                                                const pid = ctx.slice(8);
                                                return (
                                                    <Link
                                                        to={`${projectUrl(pid)}#comment-id-${target}`}
                                                    >{communityText('Comment {value1}', {value1: target})}</Link>
                                                );
                                            }
                                            if (ctx.startsWith('profile ')) {
                                                const uname = ctx.slice(8);
                                                return (
                                                    <Link
                                                        to={`/users/${uname}#comment-id-${target}`}
                                                    >{communityText('Comment {value1}', {value1: target})}</Link>
                                                );
                                            }
                                            return `Comment ${target}`;
                                        })()
                                    ) : (
                                        communityText('Comment {value1}', {value1: report.target})
                                    )}
                                </span>
                                <span className={styles.rowMeta}>
                                    {communityText('Reported by @{value1}{value2}', {value1: report.reporter, value2: timeAgo(report.created) ? ` · ${timeAgo(report.created)} ago` : ''})}
                                    {report.type !== 'support' && report.context ? communityText(' · in {value1}', {value1: report.context}) : ''}
                                </span>
                                <span className={styles.reason}>{report.reason}</span>
                                {report.type === 'support' && report.context ? <span className={styles.reason}>{report.context}</span> : null}
                                {report.type === 'project' ? (
                                    <EvidencePanel target={report.target} />
                                ) : null}
                            </div>
                            <div className={styles.rowActions}>
                                {report.type === 'support' || report.subject || report.targetUser || report.type === 'user' ? (
                                    <Button as={Link} to={adminUserPath(report.type === 'support' ? report.reporter : (report.subject || report.targetUser || report.target))}>
                                        <UserSearch size={15} />{communityText('View account')}</Button>
                                ) : null}
                                {report.type === 'support' ? (
                                    <Button onClick={() => replyToSupport(report)}>{communityText('Reply and close')}</Button>
                                ) : null}
                                {report.type === 'project' ? (
                                    <Button onClick={() => act(report.id, 'unshare_project')}>{communityText('Unshare')}</Button>
                                ) : null}
                                {report.type !== 'support' ? (
                                    <Button onClick={() => warnFromReport(report)}>
                                        {report.type === 'project' ? communityText('Warn owner') : communityText('Warn user')}
                                    </Button>
                                ) : null}
                                {report.type !== 'support' ? (
                                    <Button variant="danger" onClick={() => banFromReport(report)}>
                                        {report.type === 'project' ? communityText('Ban owner') : communityText('Ban user')}
                                    </Button>
                                ) : null}
                                <Button onClick={() => act(report.id, 'dismiss')}>{communityText('Dismiss')}</Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState compact icon={Flag} title={communityText('No open reports')}>
                    {communityText('The moderation queue is clear.')}
                </EmptyState>
            )}
        </section>
    );
};

export default ReportsSection;
