import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import Explorer from '../../../src/components/code-mode/explorer.jsx';

const rows = [
    {key: 'target:stage', type: 'target', label: 'Stage', depth: 0, isStage: true, targetId: 'stage'},
    {key: 'target:s1', type: 'target', label: 'Sprite1', depth: 0, targetId: 's1'}
];

const mountExplorer = onSelect => {
    const noop = () => {};
    return mountWithIntl(<Explorer
        canDrop={() => false}
        rows={rows}
        selectedKey={null}
        onCancelRename={noop}
        onCommitRename={noop}
        onContextMenu={noop}
        onDelete={noop}
        onDragHover={noop}
        onDragStart={noop}
        onDrop={noop}
        onOpen={noop}
        onRename={noop}
        onRootMenu={noop}
        onSelect={onSelect}
        onToggle={noop}
    />);
};

const treeOf = wrapper => wrapper.find('[role="tree"]').hostNodes();

describe('Explorer focus', () => {
    test('tabbing into the tree selects its first row', () => {
        const onSelect = jest.fn();
        const wrapper = mountExplorer(onSelect);
        const tree = treeOf(wrapper);
        tree.simulate('focus', {target: tree.getDOMNode(), currentTarget: tree.getDOMNode()});
        expect(onSelect).toHaveBeenCalledWith(rows[0]);
        wrapper.unmount();
    });

    test('clicking a row selects only that row, not the first one', () => {
        const onSelect = jest.fn();
        const wrapper = mountExplorer(onSelect);
        const tree = treeOf(wrapper);
        tree.simulate('pointerdown');
        tree.simulate('focus', {target: tree.getDOMNode(), currentTarget: tree.getDOMNode()});
        tree.simulate('pointerup');
        wrapper.find('[data-row-key="target:s1"]').hostNodes()
            .simulate('click');
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(rows[1]);
        wrapper.unmount();
    });
});
