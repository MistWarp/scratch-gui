import {StageHeader} from '../../../src/containers/stage-header';
import {STAGE_SIZE_MODES} from '../../../src/lib/constants/layout-constants';

const makeStageHeader = overrides => new StageHeader({
    customStageSize: {height: 360, width: 480},
    isEmbedded: false,
    isFullScreen: false,
    isWindowFullScreen: false,
    onOpenSettings: jest.fn(),
    onSetStageFull: jest.fn(),
    onSetStageHidden: jest.fn(),
    onSetStageUnFullScreen: jest.fn(),
    stageSizeMode: STAGE_SIZE_MODES.large,
    vm: {},
    ...overrides
});

describe('stage header workflows', () => {
    test('does not dispatch a size correction during construction', () => {
        const header = makeStageHeader();

        expect(header.props.onSetStageFull).not.toHaveBeenCalled();
    });

    test('corrects an unavailable fixed-large size after mounting', () => {
        const header = makeStageHeader();

        header.componentDidMount();

        expect(header.props.onSetStageFull).toHaveBeenCalledTimes(1);
        header.componentWillUnmount();
    });

    test('keeps fixed-large mode when a wider custom stage makes it useful', () => {
        const header = makeStageHeader({customStageSize: {height: 360, width: 600}});

        header.componentDidMount();

        expect(header.props.onSetStageFull).not.toHaveBeenCalled();
        header.componentWillUnmount();
    });

    test('Escape exits fullscreen but does nothing in the editor', () => {
        const header = makeStageHeader({isFullScreen: true});
        header.handleKeyPress({key: 'Escape'});
        expect(header.props.onSetStageUnFullScreen).toHaveBeenCalledTimes(1);

        header.props.isFullScreen = false;
        header.handleKeyPress({key: 'Escape'});
        expect(header.props.onSetStageUnFullScreen).toHaveBeenCalledTimes(1);
    });
});
