import React from 'react';
import ReactDOM from 'react-dom';
import {act} from 'react-dom/test-utils';
import {retryableLazy} from '../../../src/lib/lazy-with-retry';

class Boundary extends React.Component {
    static getDerivedStateFromError (error) {
        return {error};
    }
    constructor (props) {
        super(props);
        this.state = {error: null};
    }
    render () {
        return this.state.error ? <p>{'failed'}</p> : this.props.children; // eslint-disable-line react/prop-types
    }
}

const flush = async () => {
    for (let i = 0; i < 5; i++) {
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
    }
};

test('a failed lazy import is attempted again after the error boundary resets', async () => {
    const Panel = () => <p>{'loaded'}</p>;
    const load = jest.fn()
        .mockRejectedValueOnce(new Error('panel failed to evaluate'))
        .mockResolvedValue({default: Panel});
    const LazyPanel = retryableLazy(load);

    const container = document.createElement('div');
    const boundaryRef = React.createRef();
    const render = () => {
        ReactDOM.render(
            <Boundary ref={boundaryRef}>
                <React.Suspense fallback={<p>{'loading'}</p>}>
                    <LazyPanel />
                </React.Suspense>
            </Boundary>,
            container
        );
    };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        act(() => {
            render();
        });
        await flush();
        expect(container.textContent).toBe('failed');
        expect(load).toHaveBeenCalledTimes(1);

        act(() => {
            boundaryRef.current.setState({error: null});
        });
        await flush();
        expect(load).toHaveBeenCalledTimes(2);
        expect(container.textContent).toBe('loaded');
    } finally {
        consoleError.mockRestore();
        ReactDOM.unmountComponentAtNode(container);
    }
});

test('preload starts the import without rendering', async () => {
    const load = jest.fn().mockResolvedValue({default: () => null});
    const LazyPanel = retryableLazy(load);
    await LazyPanel.preload();
    expect(load).toHaveBeenCalledTimes(1);
});
