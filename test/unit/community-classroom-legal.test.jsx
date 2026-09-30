/* eslint-disable react/jsx-no-bind */
import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import Classroom from '../../src/community/pages/Classroom.jsx';
import ClassroomLegal from '../../src/community/pages/ClassroomLegal.jsx';
import ClassroomPrivacy from '../../src/community/pages/ClassroomPrivacy.jsx';
import DownloadDataButton from '../../src/community/components/classroom/DownloadDataButton.jsx';
import Avatar from '../../src/components/mw-avatar/avatar.jsx';
import api from '../../src/community/api.js';
import downloadJson from '../../src/community/download-json.js';
import {analyticsEnabled} from '../../src/community/analytics.js';
import {LEGAL} from '../../src/community/legal/config.js';
import classroomDpa from '../../src/community/legal/classroom-dpa.js';
import classroomPrivacy from '../../src/community/legal/classroom-privacy.js';
import classroomSubprocessors from '../../src/community/legal/classroom-subprocessors.js';
import classroomTerms from '../../src/community/legal/classroom-terms.js';
import {useUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        classroom: {
            overview: jest.fn(),
            acceptTerms: jest.fn(),
            startTrial: jest.fn(),
            billingCheckout: jest.fn(),
            billingPortal: jest.fn(),
            exportClass: jest.fn()
        }
    }
}));
jest.mock('../../src/community/download-json.js', () => ({__esModule: true, default: jest.fn()}));
jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/locale', () => ({getCommunityLocale: () => 'en', formatCommunityMessage: key => key}));
jest.mock('../../src/community/i18n.jsx', () => {
    // eslint-disable-next-line global-require
    const IntlMessageFormat = require('intl-messageformat').default;
    return {
        useCommunityIntl: () => ({
            t: key => key,
            text: (key, values) => (values ? new IntlMessageFormat(key, 'en').format(values) : key)
        })
    };
});

const ROUTER_FUTURE = {v7_startTransition: true, v7_relativeSplatPath: true};

const flush = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

const renderAt = element => mount(
    <MemoryRouter initialEntries={['/page']} future={ROUTER_FUTURE}>
        <Routes>
            <Route path="/page" element={element} />
        </Routes>
    </MemoryRouter>
);

const overview = terms => ({
    role: 'teacher',
    terms,
    plan: {tier: 'free', seats: 5, maxClasses: 1, storageBytes: 1024},
    usage: {seats: 0, storageBytes: 0, classes: 0},
    billing: {available: false, trialAvailable: true, trialDays: 30},
    school: null,
    classes: []
});

const findButton = (wrapper, label) => wrapper.find('button').filterWhere(node => node.text().includes(label))
    .first();

describe('Classroom terms acceptance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useUser.mockReturnValue({user: {username: 'teach'}, loading: false, login: jest.fn()});
    });

    test('teachers must agree before creating classes or starting the trial', async () => {
        api.classroom.overview
            .mockResolvedValueOnce(overview({version: LEGAL.classroomTermsVersion, accepted: false}))
            .mockResolvedValueOnce(overview({version: LEGAL.classroomTermsVersion, accepted: true}));
        api.classroom.acceptTerms.mockResolvedValue({ok: true});
        const wrapper = renderAt(<Classroom />);
        await flush(wrapper);
        expect(wrapper.text()).toContain('Agree to the Classroom terms for your school');
        expect(wrapper.text()).not.toContain('Start free trial');
        expect(findButton(wrapper, 'New class').prop('disabled')).toBe(true);
        expect(findButton(wrapper, 'Agree and continue').prop('disabled')).toBe(true);

        wrapper.find('input[autoComplete="organization"]').simulate('change', {target: {value: 'Riverside Primary'}});
        const boxes = wrapper.find('input[type="checkbox"]');
        boxes.at(0).simulate('change', {target: {checked: true}});
        expect(findButton(wrapper, 'Agree and continue').prop('disabled')).toBe(true);
        wrapper.find('input[type="checkbox"]').at(1)
            .simulate('change', {target: {checked: true}});
        expect(findButton(wrapper, 'Agree and continue').prop('disabled')).toBe(false);

        await act(async () => {
            wrapper.find('form').filterWhere(node => node.text().includes('Agree and continue'))
                .simulate('submit');
        });
        await flush(wrapper);
        expect(api.classroom.acceptTerms).toHaveBeenCalledWith({
            version: LEGAL.classroomTermsVersion,
            organisation: 'Riverside Primary',
            authorised: true
        });
        expect(wrapper.text()).not.toContain('Agree to the Classroom terms for your school');
        expect(wrapper.text()).toContain('Start free trial');
        expect(findButton(wrapper, 'New class').prop('disabled')).toBe(false);
    });

    test('a refused acceptance shows the reason', async () => {
        api.classroom.overview.mockResolvedValue(overview({version: LEGAL.classroomTermsVersion, accepted: false}));
        api.classroom.acceptTerms.mockRejectedValue(new Error('The Classroom terms have changed. Reload the page and read the new version.'));
        const wrapper = renderAt(<Classroom />);
        await flush(wrapper);
        wrapper.find('input[autoComplete="organization"]').simulate('change', {target: {value: 'Riverside Primary'}});
        wrapper.find('input[type="checkbox"]').at(0)
            .simulate('change', {target: {checked: true}});
        wrapper.find('input[type="checkbox"]').at(1)
            .simulate('change', {target: {checked: true}});
        await act(async () => {
            wrapper.find('form').filterWhere(node => node.text().includes('Agree and continue'))
                .simulate('submit');
        });
        await flush(wrapper);
        expect(wrapper.text()).toContain('The Classroom terms have changed.');
    });
});

describe('Classroom legal documents', () => {
    const documents = {
        terms: classroomTerms(),
        dpa: classroomDpa(),
        privacy: classroomPrivacy(),
        subprocessors: classroomSubprocessors()
    };

    test.each(Object.keys(documents))('%s has no unfilled placeholders or em dashes', key => {
        const text = documents[key];
        expect(text).not.toMatch(/\$\{|undefined|null|—|–/);
        expect(text).not.toMatch(/^#{1,4} [A-Z ]{6,}$/m);
    });

    test('the documents name the operator, the contact address and the current version', () => {
        for (const key of ['terms', 'dpa', 'privacy']) {
            expect(documents[key]).toContain(LEGAL.email);
            expect(documents[key]).toContain(LEGAL.classroomTermsVersion);
            expect(documents[key]).toContain(`run by ${LEGAL.ownerName}, a sole trader in the ${LEGAL.country}`);
        }
        expect(documents.terms).toContain(`law of ${LEGAL.governingLaw}`);
        expect(documents.privacy).toContain('12 months');
        expect(documents.dpa).toContain('within 48 hours');
    });

    test.each(['terms', 'dpa', 'subprocessors'])('the %s page renders its document', document => {
        useUser.mockReturnValue({user: null, loading: false, login: jest.fn()});
        const wrapper = renderAt(<ClassroomLegal document={document} />);
        expect(wrapper.find('h1').text().length).toBeGreaterThan(5);
        expect(wrapper.find('article h2').length).toBeGreaterThan(1);
        expect(wrapper.text()).toContain('the English version is the one that applies');
    });

    test('the privacy page starts with a section written for students', () => {
        const wrapper = renderAt(<ClassroomPrivacy />);
        const section = wrapper.find('section').first();
        expect(section.text()).toContain('If you are a student');
        expect(section.text()).toContain(LEGAL.email);
        expect(wrapper.find('article').text()).toContain('Who can see it');
    });
});

describe('Classroom data downloads', () => {
    test('the download button saves what the API returns', async () => {
        const data = {ok: true, class: {id: 'c1'}};
        const load = jest.fn(() => Promise.resolve(data));
        const wrapper = mount(<DownloadDataButton filename="class.json" label="Download class data" load={load} />);
        await act(async () => {
            wrapper.find('button').simulate('click');
        });
        expect(load).toHaveBeenCalled();
        expect(downloadJson).toHaveBeenCalledWith(data, 'class.json');
    });

    test('a failed download explains itself', async () => {
        const load = jest.fn(() => Promise.reject(new Error('class not found')));
        const wrapper = mount(<DownloadDataButton filename="class.json" label="Download class data" load={load} />);
        await act(async () => {
            wrapper.find('button').simulate('click');
        });
        wrapper.update();
        expect(wrapper.text()).toContain('class not found');
    });
});

describe('Student privacy in shared components', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('analytics are off in student sessions', () => {
        expect(analyticsEnabled()).toBe(true);
        localStorage.setItem('mw:classroom-student', '1');
        expect(analyticsEnabled()).toBe(false);
    });

    test('student avatars never load from Rotur', () => {
        const student = mount(<Avatar username="ada~k7p2q" />);
        const sources = student.find('img').map(node => node.prop('src'));
        expect(sources).toHaveLength(1);
        expect(sources[0]).toMatch(/^data:image\/svg\+xml/);
        const teacher = mount(<Avatar username="mist" />);
        expect(teacher.find('img').first()
            .prop('src')).toContain('avatars.rotur.dev/mist');
    });
});
