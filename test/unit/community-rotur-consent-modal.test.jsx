import React from 'react';
import {mount} from 'enzyme';

import RoturConsentModal from '../../src/community/components/RoturConsentModal.jsx';

test('Rotur project prompts offer a project block action', () => {
    const onBlock = jest.fn();
    const wrapper = mount(
        <RoturConsentModal
            type="consent"
            data={{name: 'Project', scopes: ['account:profile']}}
            onAllow={jest.fn()}
            onBlock={onBlock}
            onDeny={jest.fn()}
            onShareAll={jest.fn()}
            onShareNo={jest.fn()}
            onShareThis={jest.fn()}
        />
    );

    wrapper.find('button').filterWhere(button => button.text() === 'Block this project').simulate('click');
    expect(onBlock).toHaveBeenCalledTimes(1);
    wrapper.unmount();
});
