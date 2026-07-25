import React from 'react';
import {shallow} from 'enzyme';
import {RestorePoint} from '../../../src/components/tw-restore-point-modal/restore-point.jsx';
import {IntlProvider} from 'react-intl';

const {intl} = new IntlProvider({locale: 'en'}, {}).getChildContext();

describe('RestorePoint', () => {
    test('only restores from the explicit restore button', () => {
        const onClickLoad = jest.fn();
        const wrapper = shallow(
            <RestorePoint
                assets={{'costume.svg': 10}}
                created={1}
                id={7}
                intl={intl}
                isExporting={false}
                onClickDelete={jest.fn()}
                onClickExport={jest.fn()}
                onClickLoad={onClickLoad}
                projectSize={20}
                thumbnailSize={5}
                title="Project"
                type={1}
            />,
            {disableLifecycleMethods: true}
        );

        expect(wrapper.find('article').prop('onClick')).toBeUndefined();
        expect(onClickLoad).not.toHaveBeenCalled();

        wrapper.find('button').first().simulate('click');
        expect(onClickLoad).toHaveBeenCalledWith(7);
    });
});
