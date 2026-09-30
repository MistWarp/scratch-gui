/* eslint-disable react/jsx-no-bind */
import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {UpgradeModal, billingIntervals, seatPacksFor} from '../../src/community/pages/Classroom.jsx';
import ClassroomAbout from '../../src/community/pages/ClassroomAbout.jsx';
import api from '../../src/community/api.js';
import {useUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {classroom: {billingCheckout: jest.fn()}}
}));
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

const billing = {
    available: true,
    seatPackSize: 10,
    seatPacksAvailable: true,
    intervals: ['year', 'month'],
    seatPackIntervals: ['year']
};

const checkout = async wrapper => {
    await act(async () => {
        wrapper.find('button').filterWhere(node => node.text().includes('Continue to checkout'))
            .first()
            .simulate('click');
        await Promise.resolve();
    });
};

describe('Classroom billing choices', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.classroom.billingCheckout.mockReturnValue(new Promise(() => {}));
    });

    test('intervals come from the API, with monthly as the fallback for older servers', () => {
        expect(billingIntervals(billing)).toEqual(['year', 'month']);
        expect(billingIntervals({intervals: ['week', 'month']})).toEqual(['month']);
        expect(billingIntervals({})).toEqual(['month']);
        expect(seatPacksFor(billing, 'year')).toBe(true);
        expect(seatPacksFor(billing, 'month')).toBe(false);
        expect(seatPacksFor({seatPacksAvailable: true}, 'month')).toBe(true);
    });

    test('checkout defaults to yearly billing with no extra seats', async () => {
        const wrapper = mount(<UpgradeModal
            billing={billing}
            onClose={jest.fn()}
        />);
        expect(wrapper.find('input[name="billingInterval"][value="year"]').prop('checked')).toBe(true);
        expect(wrapper.find('input[name="seatPacks"][value=0]').prop('checked')).toBe(true);
        expect(wrapper.text()).toContain('35 seats in total');
        await checkout(wrapper);
        expect(api.classroom.billingCheckout).toHaveBeenCalledWith(0, 'year');
    });

    test('a teacher can add seat packs on yearly billing', async () => {
        const wrapper = mount(<UpgradeModal
            billing={billing}
            onClose={jest.fn()}
        />);
        wrapper.find('input[name="seatPacks"][value=2]').simulate('change');
        await checkout(wrapper);
        expect(api.classroom.billingCheckout).toHaveBeenCalledWith(2, 'year');
    });

    test('monthly billing hides seat packs when there is no monthly seat pack price', async () => {
        const wrapper = mount(<UpgradeModal
            billing={billing}
            onClose={jest.fn()}
        />);
        wrapper.find('input[name="seatPacks"][value=3]').simulate('change');
        wrapper.find('input[name="billingInterval"][value="month"]').simulate('change');
        expect(wrapper.find('input[name="seatPacks"]')).toHaveLength(0);
        await checkout(wrapper);
        expect(api.classroom.billingCheckout).toHaveBeenCalledWith(0, 'month');
    });

    test('with one interval there is no billing choice', () => {
        const wrapper = mount(<UpgradeModal
            billing={{...billing, intervals: ['month'], seatPackIntervals: []}}
            onClose={jest.fn()}
        />);
        expect(wrapper.find('input[name="billingInterval"]')).toHaveLength(0);
        expect(wrapper.find('input[name="seatPacks"]')).toHaveLength(0);
    });
});

describe('Classroom plans on the about page', () => {
    test('the plans show the launch prices and a full free class', () => {
        useUser.mockReturnValue({user: null, loading: false, login: jest.fn()});
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <ClassroomAbout />
            </MemoryRouter>
        );
        const text = wrapper.text();
        expect(text).toContain('1 class of up to 35 students');
        expect(text).toContain('£45 a year, or £5 a month');
        expect(text).toContain('$50 a year, or $6 a month');
        expect(text).toContain('From £300 a year');
        expect(text).not.toContain('Up to 5 students');
    });
});
