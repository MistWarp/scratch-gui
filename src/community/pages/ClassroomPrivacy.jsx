import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React from 'react';
import {Backpack, ShieldCheck} from 'lucide-react';
import Markdown from '../components/Markdown.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import {LEGAL} from '../legal/config.js';
import classroomPrivacy from '../legal/classroom-privacy.js';
import styles from './ClassroomLegal.module.css';

const ClassroomPrivacy = () => {
    const {text: communityText} = useCommunityText();
    return (
        <main className={styles.page}>
            <PageHeader
                icon={ShieldCheck}
                title={communityText('Student data in MistWarp Classroom')}
                lead={communityText('What Classroom keeps about students, who can see it, how long we keep it, and how to ask for it to be changed or deleted.')}
                backTo="/classroom/about"
                backLabel={communityText('About Classroom')}
            />
            <section className={styles.kids} aria-labelledby="privacy-for-students">
                <SectionHeading id="privacy-for-students" icon={Backpack} title={communityText('If you are a student')} />
                <ul>
                    <li>{communityText('Your teacher made your account. We keep your name the way your teacher typed it, the projects you make, the work you turn in, and what your teacher says about it.')}</li>
                    <li>{communityText('Only your teachers can see all your work. Your group can see your group project. Nobody outside your class can see anything you make.')}</li>
                    <li>{communityText('We never show you adverts, sell your information, or share it with other companies except the one that keeps the website running.')}</li>
                    <li>{communityText('Your teacher can delete your account and your projects. If your teacher stops using Classroom, we delete everything after a year.')}</li>
                    <li>{communityText('If you want to see, change or delete your information, ask your teacher or a parent. They can also email {value1}.', {value1: LEGAL.email})}</li>
                </ul>
            </section>
            <p className={styles.language}>{communityText('The full notice below is for parents, carers and schools. It is in English, and the English version is the one that applies.')}</p>
            <article className={styles.document}>
                <Markdown>{classroomPrivacy()}</Markdown>
            </article>
        </main>
    );
};

export default ClassroomPrivacy;
