import React from 'react';
import VM from 'scratch-vm';

import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {GUIComponent} from '../../../src/components/gui/gui.jsx';

jest.mock('../../../src/components/gui/gui-components', () => {
    const empty = () => null;
    const components = new Proxy({}, {get: () => empty});
    return {
        getGuiComponents: () => components,
        preloadLazyGuiComponents: () => {}
    };
});
jest.mock('../../../src/components/gui/editor-pane.jsx', () => () => null);
jest.mock('../../../src/components/gui/gui-windows.jsx', () => () => null);
jest.mock('../../../src/components/gui/editor-overlays.jsx', () => () => null);
jest.mock('../../../src/components/gui/asset-library-windows.jsx', () => () => null);
jest.mock('../../../src/components/gui/player-page.jsx', () => () => null);
jest.mock('../../../src/components/gui/stage-panel.jsx', () => () => null);
jest.mock('../../../src/components/gui/stage-panel-resizer.jsx', () => () => null);
jest.mock('../../../src/components/gui/starter-guide.jsx', () => () => null);
jest.mock('../../../src/components/mw-chat/chat-dock.jsx', () => () => null);

const baseProps = () => ({
    customStageSize: {width: 480, height: 360},
    onActivateTab: jest.fn(),
    onClosePanel: jest.fn(),
    onSetStageSize: jest.fn(),
    stageSizeMode: 'full',
    stageSizeRequestId: 0,
    vm: new VM()
});

describe('GUIComponent children', () => {
    test('switching between custom children and the editor keeps the hook order stable', () => {
        const wrapper = mountWithIntl(
            <GUIComponent {...baseProps()}>
                <div className="custom-child" />
            </GUIComponent>
        );
        expect(wrapper.find('.custom-child')).toHaveLength(1);

        expect(() => wrapper.setProps({children: null})).not.toThrow();
        expect(wrapper.find('.custom-child')).toHaveLength(0);
        expect(wrapper.find('[dir="ltr"]').hostNodes()).toHaveLength(1);

        expect(() => wrapper.setProps({children: <div className="custom-child" />})).not.toThrow();
        expect(wrapper.find('.custom-child')).toHaveLength(1);
        wrapper.unmount();
    });
});
