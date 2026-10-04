import {CloudVariablesToggler} from '../../../src/containers/tw-cloud-toggler';

const makeToggler = overrides => new CloudVariablesToggler({
    canUseCloudVariables: true,
    enabled: false,
    onCloudChange: jest.fn(),
    onOpenCloudSettings: jest.fn(),
    ...overrides
});

describe('cloud variable toggler', () => {
    test('toggles cloud variables when they are available', () => {
        const toggler = makeToggler();

        toggler.toggleCloudVariables();

        expect(toggler.props.onCloudChange).toHaveBeenCalledWith(true);
        expect(toggler.props.onOpenCloudSettings).not.toHaveBeenCalled();
    });

    test('opens the cloud variable setting without changing state when the toggle is unavailable', () => {
        const toggler = makeToggler({canUseCloudVariables: false});

        toggler.toggleCloudVariables();

        expect(toggler.props.onOpenCloudSettings).toHaveBeenCalledTimes(1);
        expect(toggler.props.onCloudChange).not.toHaveBeenCalled();
    });
});
