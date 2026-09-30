/* eslint-disable max-len */
import {LEGAL, contactLines, operatorSentence} from './config.js';

const classroomPrivacy = () => `
Version ${LEGAL.classroomTermsVersion}, in effect from ${LEGAL.effectiveDate}.

This notice explains how MistWarp Classroom handles information about students. It is for parents, carers and schools. The School that set up the class decides how its students' information is used, and MistWarp handles it for the School under the [Classroom Terms](/classroom/terms) and [Data Processing Agreement](/classroom/dpa).

## Who we are

${operatorSentence()} For student accounts, the School is the controller and MistWarp is its processor. In the United States, MistWarp is the operator for the purposes of the Children's Online Privacy Protection Act (COPPA) and collects student information with the School's consent, given on behalf of parents for educational use only.

## What we collect

- The student's name as the teacher types it, a username made from it, and their class.
- Their password or picture sequence, stored only as a bcrypt hash.
- When they last signed in, and recent failed sign-in attempts.
- The projects they make, with the files and version history of each one.
- Assignment submissions, and the feedback and grades teachers give.
- Which group projects they belong to.
- Their editor settings and notifications inside MistWarp.
- An activity log of changes teachers make to the class.
- Error reports from the editor: browser type, the page address and a technical error message.
- The device's IP address, which our server and Cloudflare use to deliver pages and limit abuse. Our server does not store it for signed-in users.

We do not collect email addresses, phone numbers, home addresses, dates of birth, photos, or location. Student accounts are not Rotur accounts, and student information is not sent to Rotur.

## How we use it

Only to run Classroom for the School: to sign students in, store and show their work to them and their teachers, let teachers set and review assignments, run group projects and class presentations, keep the service secure, and fix problems.

We do not show adverts to students, sell or rent student information, build profiles of students, use it to market to students or parents, make automated decisions about students, or use it to train artificial intelligence models. Students' devices do not send us analytics.

## The lawful basis

The School decides the lawful basis for its use of Classroom. For most UK state schools this is public task: teaching the curriculum. Independent schools and other organisations usually rely on legitimate interests. MistWarp processes the information on the School's behalf and does not have a separate lawful basis of its own for student data.

## Who can see it

- The class's teachers and co-teachers, and on a School plan, the School's Classroom admins.
- Other students in a group, who can open their shared group project.
- The class, while a teacher presents a project to it.
- Anyone with the class code can see the list of names on the class sign-in page, so students can pick their own. That is why we ask teachers to use first names or nicknames.

Nobody outside the class can see a student's projects. Students cannot publish, comment, follow, chat or post.

## Who we share it with

- **Cloudflare**, which hosts the website, carries all traffic and stores project files. It is our only sub-processor. See the [sub-processor list](/classroom/subprocessors).
- **The School.** If a teacher moves a student to their own Rotur account, the student's projects go to that account and work they turned in is copied to the class owner.
- **Anyone the law requires**, such as a court order. We will tell the School unless the law forbids it.

The editor also downloads extension code and library images from a few public services, which see the device's IP address but no student details. A few Scratch blocks, such as Text to Speech and Translate, send the words in the block to an outside service when a project uses them. All of these are listed on the sub-processor page.

## Where it is stored

Our database is on our own server in the United Kingdom. Project files are stored in Cloudflare R2, which may keep them in data centres outside the UK under the safeguards described in the Data Processing Agreement.

## How long we keep it

- Until a teacher deletes the student or the class. Deleted records leave our database straight away. Project files leave storage once no other project uses the same file.
- If no teacher opens a class for 11 months we warn its teachers. At 12 months, and never less than 14 days after the warning, we delete the class, its students and their work.
- When a School asks us to delete its data, we do so within 30 days.
- Release links for moving a student to their own account expire after 14 days.

## Keeping it safe

Passwords are hashed, all traffic is encrypted, sign-in locks after five wrong attempts, student accounts can only reach their own class, and teachers can only reach classes they teach. We keep a written information security programme and review it every year.

## Your rights

Students and parents can ask to see, download, correct or delete a student's information, or to stop its use. The quickest way is to ask the teacher or the School, who can do most of this themselves from the Classroom pages. You can also write to ${LEGAL.email}. We will pass your request to the School within 10 days, because the School decides what happens to its students' information.

In the United States, a parent can ask to review their child's information, have it deleted, or refuse further collection, through the School or by writing to us.

If you are unhappy with how a student's information is handled, talk to the School first. In the UK you can also complain to the Information Commissioner's Office at https://ico.org.uk/make-a-complaint/. In the United States you can contact the Federal Trade Commission at https://reportfraud.ftc.gov/.

## Changes

If we change this notice we will publish the new version here with its date. If the change affects how student information is used, teachers must accept the new version on the Classroom page before adding more students.

## Contact

${contactLines().map(line => `- ${line}`).join('\n')}
`.trim();

export default classroomPrivacy;
