import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React from 'react';
import {FileSignature, FileText, Server} from 'lucide-react';
import Markdown from '../components/Markdown.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import classroomDpa from '../legal/classroom-dpa.js';
import classroomSubprocessors from '../legal/classroom-subprocessors.js';
import classroomTerms from '../legal/classroom-terms.js';
import styles from './ClassroomLegal.module.css';

const DOCUMENTS = {
    terms: {icon: FileText, render: classroomTerms},
    dpa: {icon: FileSignature, render: classroomDpa},
    subprocessors: {icon: Server, render: classroomSubprocessors}
};

const ClassroomLegal = ({document}) => {
    const {text: communityText} = useCommunityText();
    const titles = {
        terms: communityText('Classroom Terms for Schools'),
        dpa: communityText('Classroom Data Processing Agreement'),
        subprocessors: communityText('Classroom sub-processors')
    };
    const leads = {
        terms: communityText('The agreement between MistWarp and the school or organisation a teacher uses Classroom for.'),
        dpa: communityText('How MistWarp handles student data on behalf of schools, under UK GDPR, FERPA and COPPA.'),
        subprocessors: communityText('Every company that handles student data for Classroom, and the other services the editor contacts.')
    };
    const {icon, render} = DOCUMENTS[document];
    return (
        <main className={styles.page}>
            <PageHeader
                icon={icon}
                title={titles[document]}
                lead={leads[document]}
                backTo="/classroom/about"
                backLabel={communityText('About Classroom')}
            />
            <p className={styles.language}>{communityText('This document is in English, and the English version is the one that applies.')}</p>
            <article className={styles.document}>
                <Markdown>{render()}</Markdown>
            </article>
        </main>
    );
};

ClassroomLegal.propTypes = {
    document: PropTypes.oneOf(Object.keys(DOCUMENTS)).isRequired
};

export default ClassroomLegal;
