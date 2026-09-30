/* eslint-disable max-len */
import {LEGAL, contactLines, operatorSentence} from './config.js';

const classroomDpa = () => `
Version ${LEGAL.classroomTermsVersion}, in effect from ${LEGAL.effectiveDate}.

This Data Processing Agreement is part of the [Classroom Terms for Schools](/classroom/terms). It sets out how ${LEGAL.tradingName} ("we", "the processor") handles personal data about students and teachers for the School ("the controller") when the School uses MistWarp Classroom. ${operatorSentence()} It is written to meet Article 28 of the UK General Data Protection Regulation (UK GDPR), and it also covers what US schools need under FERPA and COPPA.

## 1. Roles

1. For student accounts and everything made or recorded in them, the School is the controller and we are the processor.
2. For teachers' own sign-in (through Rotur) and for billing, we are a separate controller, as described on the [Trust page](/trust).
3. Annex 1 describes the processing.

## 2. Instructions

1. We process student data only on the School's documented instructions. These terms, and the actions teachers take in Classroom such as adding students, setting assignments, moving a student to their own account or deleting data, are the School's instructions.
2. We may also process it where UK law requires us to. If so, we will tell the School first unless the law forbids it.
3. We will tell the School straight away if we think an instruction breaks data protection law.

## 3. Confidentiality

Only ${LEGAL.ownerName}, who runs MistWarp, has administrative access to Classroom data. Anyone we later authorise to access it will be bound by a written duty of confidentiality, and will access it only as needed to run and support Classroom.

## 4. Security

We keep the technical and organisational measures in Annex 2 in place and review them at least once a year. We will not reduce the overall level of protection they give.

## 5. Sub-processors

1. The School gives general authorisation for us to use the sub-processors on the [sub-processor list](/classroom/subprocessors).
2. We will announce any new or replacement sub-processor on that page and on the Classroom page at least 30 days before it starts processing student data. The School may object by writing to ${LEGAL.email}. If we cannot address the objection, the School may stop using Classroom and we will delete its data as in section 9.
3. We will have a written contract with each sub-processor that protects student data at least as well as this agreement, and we remain responsible to the School for what our sub-processors do.

## 6. International transfers

Our database is on our own server in the United Kingdom. Cloudflare, our only sub-processor, runs a global network, and project files may be stored in its data centres outside the UK. Those transfers rely on the safeguards in Cloudflare's Data Processing Addendum, which includes the UK International Data Transfer Addendum to the European Commission's standard contractual clauses, and, where they apply, on the UK Extension to the EU-US Data Privacy Framework. We will not transfer student data outside the UK in any other way without a lawful transfer mechanism.

## 7. Helping the School

1. Teachers can see, download, correct and delete student data themselves from the Classroom pages. This is how the School answers most requests from students and parents.
2. If a student or parent contacts us directly, we will pass the request to the School within 10 days and will not answer it ourselves unless the School asks us to.
3. We will help the School with data protection impact assessments, consultations with the Information Commissioner's Office and security questions, as far as the information is ours to give. Our own data protection impact assessment for Classroom is available on request.

## 8. Personal data breaches

1. We will tell the School without undue delay, and in any case within 48 hours, after we become aware of a personal data breach affecting its student data. We tell every teacher of the affected classes on MistWarp and, where we have one, the School's contact address.
2. We will describe what happened, the data and number of students affected, the likely consequences and what we are doing about it, and update the School as we learn more.
3. We will not tell students, parents or regulators about a breach of the School's data without the School's agreement, unless the law requires it.

## 9. Deletion and return

1. Teachers can download a class or a student's data at any time.
2. When the School asks us to delete its data, or when it stops using Classroom, we will delete student data within 30 days, unless UK law requires us to keep it.
3. Classes that no teacher opens for 12 months are deleted as set out in section 8 of the Classroom Terms.

## 10. Audits and information

We will make available the information the School reasonably needs to show that we meet this agreement, including our security programme and data protection impact assessment. The School may carry out an audit, or have one carried out, once a year with 30 days' notice, at its own cost, in a way that protects other schools' data.

## 11. United States schools

1. **FERPA.** We act as a "school official" with a legitimate educational interest under 34 CFR 99.31(a)(1). We perform a service the School would otherwise use its own staff for, we are under the School's direct control for the use and maintenance of education records, we use them only for the purposes the School authorises, and we do not disclose them to anyone else except as the School directs or the law requires.
2. **COPPA.** We collect personal information from students under 13 only with the School's authorisation and only for the School's educational purposes. We do not use it for any commercial purpose. Parents can ask the School, or us at ${LEGAL.email}, to review or delete their child's information or to stop further collection. Our information security programme and data retention policy are described in Annex 2 and in the [student data notice](/classroom/privacy).
3. **State student privacy laws.** We meet the commitments in section 4 of the Classroom Terms: no targeted advertising, no sale of student data, no profiles for non-educational purposes. We will sign the Student Data Privacy Consortium's National Data Privacy Agreement, or a state version of it, on request.

## 12. General

This agreement lasts as long as we process student data for the School. If it conflicts with the Classroom Terms on the handling of student data, this agreement wins. The law and courts of ${LEGAL.governingLaw} apply, as in the Classroom Terms.

## Annex 1: Description of the processing

**Subject matter and duration.** Providing MistWarp Classroom to the School, for as long as the School uses it plus up to 30 days for deletion.

**Nature and purpose.** Hosting student accounts and their work so teachers can teach coding with Scratch blocks: signing students in, storing and showing their projects, assignments, submissions, feedback and grades, group projects, presentations to the class, moving a student to their own account when the School asks, and keeping the service secure.

**Data subjects.** Students the School adds to Classroom, who may be children, and the School's teachers.

**Personal data.**

- The student's name as the teacher types it, a username made from it, and their class.
- A bcrypt hash of the student's password or picture sequence.
- Sign-in times, failed sign-in attempts and temporary account locks.
- Projects the student makes, their files and version history.
- Assignment submissions, feedback, grades and group membership.
- Editor settings and notifications inside MistWarp.
- An activity log of changes teachers make to the class.
- Error reports from the editor: browser type, page address and a technical error message.
- IP addresses, which our server and Cloudflare use to deliver the service and limit abuse. Our server keeps them only in memory for a short time and does not store them for signed-in users.

**Special category data.** None is needed. Schools must not enter it.

## Annex 2: Technical and organisational measures

- All traffic is encrypted in transit with TLS through Cloudflare.
- Student passwords and picture sequences are stored only as bcrypt hashes. Sign-in locks for 15 minutes after five wrong attempts.
- Student accounts can only call an allowlist of API routes. They cannot read the public community, publish, comment, message or open projects outside their class.
- Teachers can only reach classes they teach. Every request is checked on the server.
- Teacher changes to a class are recorded in an activity log the class's teachers can read.
- Students' devices do not send analytics, and the editor blocks custom extensions, network requests from extensions, cloud variables, git remotes and third-party relay servers for students.
- Administrative access is limited to the operator. The server runs on hardware the operator controls in the United Kingdom, and project files are stored in Cloudflare R2.
- Data is kept only as long as described in section 9 and the Classroom Terms, and deleted automatically after 12 months without a teacher.
- We keep a written information security programme and data protection impact assessment and review both at least once a year and after any significant change.
- We have a written breach response procedure that meets section 8.

## Annex 3: Sub-processors

See the [sub-processor list](/classroom/subprocessors).

## Contact

${contactLines().map(line => `- ${line}`).join('\n')}
`.trim();

export default classroomDpa;
