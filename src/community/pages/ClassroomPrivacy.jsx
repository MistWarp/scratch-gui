import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React from 'react';
import {Link} from 'react-router-dom';
import {Database, Eye, EyeOff, KeyRound, LifeBuoy, School, ShieldCheck, Trash2} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import styles from './InfoPage.module.css';

const ClassroomPrivacy = () => {
    const {text: communityText} = useCommunityText();
    return (
        <main className={styles.page}>
            <PageHeader
                icon={ShieldCheck}
                title={communityText('Student data in MistWarp Classroom')}
                lead={communityText('What Classroom stores about students, who can see it, and how teachers and schools remove it.')}
                backTo="/classroom/about"
                backLabel={communityText('About Classroom')}
            />
            <section className={styles.section}>
                <SectionHeading icon={School} title={communityText('Who is in charge of student accounts')} />
                <p>{communityText('Teachers create student accounts inside a class, and the class belongs to the teacher who made it. Students cannot sign up on their own, and they cannot change their name, sign-in details, or class.')}</p>
                <p>{communityText('A teacher can add co-teachers or hand the class to another teacher. On a School plan, school admins can see every class in the school and manage its teachers.')}</p>
            </section>
            <div className={styles.grid}>
                <section className={styles.section}>
                    <SectionHeading icon={Database} title={communityText('What we store')} />
                    <ul>
                        <li>{communityText('The name the teacher types, a username made from it, and the class the student is in.')}</li>
                        <li>{communityText('Their password or picture sequence, stored only as a bcrypt hash.')}</li>
                        <li>{communityText('When they last signed in, and recent failed sign-in attempts.')}</li>
                        <li>{communityText('Their projects, with the files and version history of each one.')}</li>
                        <li>{communityText('Assignment submissions, and the feedback and grades teachers give.')}</li>
                        <li>{communityText('Their editor settings and notifications.')}</li>
                    </ul>
                </section>
                <section className={styles.section}>
                    <SectionHeading icon={EyeOff} title={communityText('What we do not collect')} />
                    <ul>
                        <li>{communityText('Email addresses, phone numbers, or home addresses.')}</li>
                        <li>{communityText('Dates of birth or photos.')}</li>
                        <li>{communityText('A Rotur account. Student accounts exist only inside MistWarp Classroom.')}</li>
                    </ul>
                    <p>{communityText('Students have no wallet, memberships, chat, or direct messages.')}</p>
                </section>
            </div>
            <section className={styles.section}>
                <SectionHeading icon={Eye} title={communityText('Who can see student work')} />
                <p>{communityText('Class teachers and co-teachers can open every project a student makes. Students in the same group can open their shared group project. During a presentation, the class can watch the project being presented.')}</p>
                <p>{communityText('Nobody outside the class can see a student\'s projects. Students cannot publish, comment, follow, or post, and they cannot browse projects or profiles from the public community.')}</p>
                <p>{communityText('The sign-in page lists the names in a class so students can pick their own. Anyone with the class code can see that list, so use first names or nicknames, and reset the class code if it is shared outside the class.')}</p>
            </section>
            <section className={styles.section}>
                <SectionHeading icon={KeyRound} title={communityText('Signing in')} />
                <p>{communityText('Students sign in with the class code, their name, and a word password or three pictures. After five wrong attempts the account locks for 15 minutes. Teachers can reset a student\'s sign-in or turn their account off at any time.')}</p>
                <p>{communityText('Printed login cards show the password or pictures, so keep them somewhere safe and reset any card that goes missing.')}</p>
            </section>
            <section className={styles.section}>
                <SectionHeading icon={Trash2} title={communityText('Removing and moving data')} />
                <ul>
                    <li>{communityText('Deleting a student removes their account, their projects, and their submissions.')}</li>
                    <li>{communityText('A class can be deleted once it has no students. That removes its assignments and activity log.')}</li>
                    <li>{communityText('When a student leaves, a teacher can create a one-time link that moves the student\'s projects to their own Rotur account. The link lasts 14 days. Work the student turned in is copied to the class owner first, so the school keeps its records. Students under 13 should ask a parent or guardian before using it.')}</li>
                    <li>{communityText('On a School plan, school admins can download a file of the school\'s classes, students, projects, assignments, and submissions. It never includes passwords.')}</li>
                </ul>
            </section>
            <section className={styles.section}>
                <SectionHeading icon={LifeBuoy} title={communityText('Storage and questions')} />
                <p>{communityText('Student projects are stored the same way as every other MistWarp project.')}{' '}<Link to="/trust">{communityText('See where MistWarp stores data.')}</Link></p>
                <p>{communityText('For a question about a student\'s data, or a request your school cannot handle from the Classroom pages, contact MistWarp support.')}{' '}<Link to="/support?topic=legal">{communityText('Contact support')}</Link></p>
            </section>
        </main>
    );
};

export default ClassroomPrivacy;
