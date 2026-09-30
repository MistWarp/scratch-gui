/* eslint-disable max-len */
import {LEGAL, contactLines, operatorSentence} from './config.js';

const classroomTerms = () => `
Version ${LEGAL.classroomTermsVersion}, in effect from ${LEGAL.effectiveDate}.

These terms are a contract between ${LEGAL.tradingName} ("we", "us") and the school, school district, academy trust or other organisation that a teacher uses Classroom for (the "School"). ${operatorSentence()} The [Data Processing Agreement](/classroom/dpa) forms part of these terms. If the two conflict on how student data is handled, the Data Processing Agreement wins.

## 1. Agreeing to these terms

1. A teacher agrees to these terms for their School by ticking the boxes on the Classroom page before adding classes or students. By doing so the teacher confirms that they are at least 18, that they work for or volunteer with the School, and that the School has authorised them to use Classroom with its students.
2. If a teacher uses Classroom on their own, for example to run a club or teach at home, "School" means that teacher.
3. The School is responsible for everything its teachers do in Classroom.
4. Teachers sign in with a Rotur account. The [MistWarp community guidelines](/trust) also apply to teachers.

## 2. What Classroom is

Classroom lets teachers create private classes of student accounts, set assignments, give feedback and grades, run group projects and present projects to a class, all inside MistWarp. Students cannot publish projects, comment, follow people, chat, or browse the public MistWarp community.

## 3. Student accounts

1. Only teachers create student accounts. The School decides which students get one.
2. Use the smallest amount of personal information you need. A first name or a nickname is enough. Do not put surnames, dates of birth, contact details, or information about health, religion or other special categories of data into names, projects, assignments, feedback or grades.
3. Keep printed login cards safe. Reset any card that is lost, and reset the class code if it is shared outside the class.
4. The School is responsible for having a lawful basis to use Classroom and for telling parents and students about it. The [student data page](/classroom/privacy) is our notice to the School and to parents about what we collect and why.

In the UK, the School is the controller of its students' data. It chooses the lawful basis, which for most state schools is public task, and includes Classroom in its privacy information.

In the United States, the School consents on behalf of parents, for the educational use of Classroom only, to the collection of personal information from students under 13 under the Children's Online Privacy Protection Act (COPPA). The School will give parents any notice its policies or state law require. We treat student data as education records under FERPA, as set out in the Data Processing Agreement.

## 4. Our promises about student data

We use student data only to run Classroom for the School, on the School's instructions. In particular we will not:

- show advertising to students, or use student data to target advertising anywhere;
- sell, rent or trade student data;
- build profiles of students for any purpose other than the School's education use;
- let students be contacted by, or make their work visible to, anyone outside their class;
- use student data to market to students or parents;
- use student data to train artificial intelligence models.

## 5. Plans, the free trial and payment

1. The Free plan is free. Its limits are shown on the Classroom page.
2. A teacher who has not had a paid plan can try the Classroom plan free for 30 days, once. Nothing is charged. When the trial ends the teacher returns to the Free plan unless they subscribe.
3. The Classroom plan is a subscription paid by card through Stripe, monthly or yearly. The price is shown at checkout before you pay. It renews each billing period until cancelled. You can cancel at any time from Manage billing and the plan continues until the end of the period you have paid for. We do not refund part periods unless the law requires it.
4. School plans are agreed with us in writing and paid by invoice.
5. When a paid plan or trial ends, students and their work stay, but you cannot add students, classes or storage beyond the Free plan limits until you upgrade or remove some.
6. We may change prices for future billing periods. We will tell you at least 30 days before a price change affects you.

## 6. Acceptable use

Use Classroom for teaching and learning. Do not use it to harm, bully or harass anyone, to share content that is unlawful or unsuitable for children, to break or probe the security of MistWarp, or to get around the limits of your plan. We may remove content that breaks these rules.

## 7. Projects and ownership

Students and the School keep ownership of the projects they make. The School gives us permission to store, copy and display those projects only as needed to run Classroom. MistWarp is a modification of TurboWarp and Scratch. The MistWarp software is open source under its own licences, and Scratch is a project of the Scratch Foundation, which is not connected with MistWarp.

## 8. Keeping and deleting data

1. Teachers can delete any student, and with it that student's projects and submissions, at any time. A class can be deleted once it has no students.
2. Teachers can download a copy of a class, or of one student's data, from the Classroom pages at any time.
3. If no teacher of a class has opened it for 11 months, we notify its teachers. If still nobody opens it, we delete the class, its students and their work 12 months after a teacher last opened it, and never less than 14 days after the notice.
4. If the School asks us to delete its data by writing to ${LEGAL.email}, we will do so within 30 days.
5. Deleted records are removed from our live database straight away. Project files are removed from storage once no other project uses the same file.
6. When a student leaves, a teacher can move their projects to a Rotur account. Rotur accounts are for people aged 13 and over, so for a younger student the teacher should give the link to a parent or guardian.

## 9. Availability and changes

1. We work to keep Classroom available and secure, but we provide it as it is and cannot promise it will never be interrupted.
2. We may improve or change features. We will not make a change that reduces the protection of student data described in these terms or the Data Processing Agreement.
3. If we change these terms in a way that matters, we will publish the new version with its date and tell teachers on the Classroom page at least 30 days before it takes effect, unless the change is needed sooner to protect students or to follow the law. Teachers must accept the new version before adding more classes or students.

## 10. Ending

1. The School can stop using Classroom at any time by deleting its classes or by asking us to delete its data.
2. We may suspend a teacher's access to Classroom if we reasonably believe they are putting students at risk or seriously breaking these terms. We will tell the teacher and, where we can, the School.
3. If we ever stop offering Classroom, we will give at least 60 days' notice so that Schools can download their data, and then delete it.
4. Sections 4, 7, 8 and 11 continue after these terms end.

## 11. Liability

1. Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited by law.
2. Otherwise, our total liability to the School under or in connection with these terms in any 12 months is limited to the greater of the fees the School paid us in those 12 months and £100.
3. We are not liable for loss of profits, revenue or goodwill, or for indirect or consequential loss.

## 12. Law and disputes

These terms are governed by the law of ${LEGAL.governingLaw}, and its courts have jurisdiction. If the School is a public body whose own law does not allow it to accept this, write to us and we will agree the changes it needs in writing. Many United States districts use the Student Data Privacy Consortium's National Data Privacy Agreement, and we are happy to sign it or a state version of it.

## 13. Contact

${contactLines().map(line => `- ${line}`).join('\n')}
`.trim();

export default classroomTerms;
