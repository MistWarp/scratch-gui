/* eslint-disable max-len */
const LEGAL = {
    ownerName: 'Sophie',
    tradingName: 'MistWarp',
    country: 'United Kingdom',
    email: 'privacy@mistwarp.org',
    postalAddress: '',
    icoRegistration: '',
    governingLaw: 'England and Wales',
    classroomTermsVersion: '2026-10-01',
    effectiveDate: '1 October 2026'
};

const operatorSentence = () => `${LEGAL.tradingName} is run by ${LEGAL.ownerName}, a sole trader in the ${LEGAL.country}.`;

const contactLines = () => [
    `Email: ${LEGAL.email}`,
    LEGAL.postalAddress ? `Post: ${LEGAL.postalAddress}` : `Post: write to ${LEGAL.email} and we will send a postal address for letters.`,
    LEGAL.icoRegistration ? `ICO registration number: ${LEGAL.icoRegistration}` : ''
].filter(Boolean);

export {LEGAL, contactLines, operatorSentence};
