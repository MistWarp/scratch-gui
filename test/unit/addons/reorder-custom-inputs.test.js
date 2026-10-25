import {modifiedCreateAllInputs} from '../../../src/addons/addons/reorder-custom-inputs/modified-funcs.js';

const makeBlock = procCode => {
    const block = {
        procCode_: procCode,
        argumentIds_: ['a', 'b'],
        labels: [],
        inputs: [],
        appendValueInput (id) {
            const input = {id, setCheck () {}};
            block.inputs.push(id);
            return input;
        },
        populateArgument_ () {},
        addProcedureLabel_ (text) {
            block.labels.push(text);
        }
    };
    return block;
};

describe('reorder custom inputs addon', () => {
    test('shows a block name that starts with a percent sign as a label', () => {
        const block = makeBlock('%2 chance %s');

        expect(() => modifiedCreateAllInputs.call(block, {})).not.toThrow();
        expect(block.labels[0]).toBe('%2 chance');
        expect(block.inputs).toEqual(['a']);
    });

    test('still keeps %l delimiters out of the arguments', () => {
        const block = makeBlock('%l first %s %l second %b');

        modifiedCreateAllInputs.call(block, {});

        expect(block.inputs).toEqual(['a', 'b']);
        expect(block.labels.filter(label => label.trim())).toEqual(['first', 'second']);
    });
});
