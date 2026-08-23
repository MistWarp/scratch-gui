import {CloudVariablesToggler} from '../../../src/containers/tw-cloud-toggler';

const makeToggler = overrides => new CloudVariablesToggler({
    canUseCloudVariables: true,
    enabled: false,
    onCloudChange: jest.fn(),
    onShowCloudUnavailable: jest.fn(),
    ...overrides
});

describe('cloud variable toggler', () => {
    test('toggles cloud variables when they are available', () => {
        const toggler = makeToggler();

        toggler.toggleCloudVariables();

        expect(toggler.props.onCloudChange).toHaveBeenCalledWith(true);
        expect(toggler.props.onShowCloudUnavailable).not.toHaveBeenCalled();
    });

    test('shows an app alert without changing state when cloud variables are unavailable', () => {
        const toggler = makeToggler({canUseCloudVariables: false});

        toggler.toggleCloudVariables();

        expect(toggler.props.onShowCloudUnavailable).toHaveBeenCalledTimes(1);
        expect(toggler.props.onCloudChange).not.toHaveBeenCalled();
    });
});
