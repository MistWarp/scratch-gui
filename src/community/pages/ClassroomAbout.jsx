import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
    ArrowRight, Building2, ClipboardCheck, Eye, GraduationCap, KeyRound, LayoutList, LogIn, MonitorPlay, Plus, Printer,
    ShieldCheck, Sparkles, UserRoundX, Users, UsersRound
} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import ShareWithTeacher from '../components/classroom/ShareWithTeacher.jsx';
import styles from './ClassroomAbout.module.css';

const stepsCopy = communityText => [
    {
        icon: Users,
        title: communityText('Make the class'),
        body: communityText('Sign in, create a class, and type your students\' names, one per line. Students never need an email address.')
    },
    {
        icon: Printer,
        title: communityText('Print login cards'),
        body: communityText('Each card has the class code and either a word password or three pictures to tap in order, which suits younger children.')
    },
    {
        icon: ClipboardCheck,
        title: communityText('Set an assignment'),
        body: communityText('Pick a starter project and a due date. Students turn their work in, and you open it, leave feedback, add a grade, and hand it back.')
    }
];

const safetyCopy = communityText => [
    {
        icon: ShieldCheck,
        title: communityText('Private by default'),
        body: communityText('Students cannot publish, comment, follow, chat, or browse the public community. They see their own work, their group\'s project, and what you present.')
    },
    {
        icon: UserRoundX,
        title: communityText('No personal details'),
        body: communityText('A student account holds the name you type and nothing else about them: no email, no date of birth, no photo. First names or nicknames work fine.')
    },
    {
        icon: Eye,
        title: communityText('You see all their work'),
        body: communityText('Open any student\'s project from the class page, reset a forgotten password, or turn an account off. An activity log records what teachers change.')
    },
    {
        icon: KeyRound,
        title: communityText('You decide what happens to it'),
        body: communityText('Delete a student and their projects go with them. When a student leaves, you can move their projects to a personal account instead.')
    }
];

const plansCopy = communityText => [
    {
        key: 'free',
        title: communityText('Free'),
        lead: communityText('For trying Classroom with a small group.'),
        items: [communityText('1 class'), communityText('Up to 5 students'), communityText('1 GB of storage'), communityText('Assignments, feedback, and grades')]
    },
    {
        key: 'classroom',
        title: communityText('Classroom'),
        lead: communityText('Free for 30 days, then paid.'),
        items: [communityText('Up to 12 classes'), communityText('35 students, with more seats in packs of 10'), communityText('25 GB of storage'), communityText('Group projects that students edit together live'), communityText('Present mode to show one project to the whole class')]
    },
    {
        key: 'school',
        title: communityText('School'),
        lead: communityText('For several teachers sharing one plan.'),
        items: [communityText('Seats and storage sized for your school'), communityText('A school admin page for teachers and classes'), communityText('A data download for records requests'), communityText('Invoices instead of card payments')]
    }
];

const StartButton = ({className}) => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const navigate = useNavigate();
    if (user && !user.isStudent) {
        return (
            <Button as={Link} to="/classroom" variant="primary" className={className}>
                <Plus size={16} aria-hidden="true" />
                {communityText('Start a free class')}
            </Button>
        );
    }
    const start = async () => {
        await login();
        navigate('/classroom');
    };
    return (
        <Button variant="primary" onClick={start} className={className}>
            <LogIn size={16} aria-hidden="true" />
            {communityText('Sign in to start a class')}
        </Button>
    );
};

StartButton.propTypes = {
    className: PropTypes.string
};

const ClassroomAbout = ({showStudentSignIn}) => {
    const {text: communityText} = useCommunityText();
    return (
        <main className={styles.page}>
            <PageHeader
                icon={GraduationCap}
                title={communityText('MistWarp Classroom')}
                lead={communityText('A private place for your class to build Scratch projects. You create the student accounts, set the work, and see everything they make.')}
                actions={(
                    <div className={styles.headerActions}>
                        <ShareWithTeacher />
                        <StartButton />
                    </div>
                )}
            />
            {showStudentSignIn ? (
                <section className={styles.studentRow} aria-label={communityText('Student sign-in')}>
                    <p>{communityText('Already in a class? Sign in with the class code on your login card.')}</p>
                    <Button as={Link} to="/classroom/join">
                        <LogIn size={16} aria-hidden="true" />
                        {communityText('Student sign-in')}
                    </Button>
                </section>
            ) : null}

            <section className={styles.section}>
                <SectionHeading icon={LayoutList} title={communityText('How it works')} />
                <ol className={styles.steps}>
                    {stepsCopy(communityText).map(({icon: Icon, title, body}, index) => (
                        <li key={title} className={styles.step}>
                            <span className={styles.stepTop}>
                                <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
                                <Icon size={20} aria-hidden="true" />
                            </span>
                            <h3>{title}</h3>
                            <p>{body}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className={styles.section}>
                <SectionHeading icon={ShieldCheck} title={communityText('Safe for children')} />
                <div className={styles.grid}>
                    {safetyCopy(communityText).map(({icon: Icon, title, body}) => (
                        <div key={title} className={styles.feature}>
                            <span className={styles.icon}><Icon size={20} aria-hidden="true" /></span>
                            <div>
                                <h3>{title}</h3>
                                <p>{body}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <Link to="/classroom/privacy" className={styles.moreLink}>
                    {communityText('Read how Classroom handles student data')}
                    <ArrowRight size={14} aria-hidden="true" />
                </Link>
            </section>

            <section className={styles.section}>
                <SectionHeading icon={UsersRound} title={communityText('Working together')} />
                <div className={styles.grid}>
                    <div className={styles.feature}>
                        <span className={styles.icon}><UsersRound size={20} aria-hidden="true" /></span>
                        <div>
                            <h3>{communityText('Group projects')}</h3>
                            <p>{communityText('Put two to six students in a group. They share one project and can edit it at the same time from their own computers.')}</p>
                        </div>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.icon}><MonitorPlay size={20} aria-hidden="true" /></span>
                        <div>
                            <h3>{communityText('Present mode')}</h3>
                            <p>{communityText('Show your project, or a student\'s, on every screen in the class. Students follow along without being able to change it.')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <SectionHeading icon={Building2} title={communityText('Plans')} />
                <div className={styles.plans}>
                    {plansCopy(communityText).map(plan => (
                        <div key={plan.key} className={plan.key === 'classroom' ? styles.planFeatured : styles.plan}>
                            <h3>{plan.title}</h3>
                            <p className={styles.planLead}>{plan.lead}</p>
                            <ul>
                                {plan.items.map(item => <li key={item}>{item}</li>)}
                            </ul>
                            {plan.key === 'school' ? (
                                <Link to="/support" className={styles.moreLink}>
                                    {communityText('Contact us about a School plan')}
                                    <ArrowRight size={14} aria-hidden="true" />
                                </Link>
                            ) : null}
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.cta}>
                <div>
                    <h2>
                        <Sparkles size={20} aria-hidden="true" />
                        {communityText('Want to use MistWarp at school?')}
                    </h2>
                    <p>{communityText('Send this page to your teacher. Setting up a class takes about five minutes.')}</p>
                </div>
                <div className={styles.headerActions}>
                    <ShareWithTeacher />
                    <StartButton />
                </div>
            </section>
        </main>
    );
};

ClassroomAbout.propTypes = {
    showStudentSignIn: PropTypes.bool
};

ClassroomAbout.defaultProps = {
    showStudentSignIn: false
};

export default ClassroomAbout;
