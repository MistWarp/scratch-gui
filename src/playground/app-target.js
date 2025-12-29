import ReactDOM from 'react-dom';
import {setAppElement} from 'react-modal';

const appTarget = document.getElementById('app');

// Remove everything from the target to fix macOS Safari "Save Page As",
while (appTarget.firstChild) {
    appTarget.removeChild(appTarget.firstChild);
}

setAppElement(appTarget);

const render = children => {
    // Use ReactDOM.createRoot for better performance if available (React 18+)
    if (ReactDOM.createRoot) {
        const root = ReactDOM.createRoot(appTarget);
        root.render(children);
    } else {
        ReactDOM.render(children, appTarget);
    }

    // Schedule splash end after render completes
    requestAnimationFrame(() => {
        // Log time when React app renders (splash screen ends)
        if (window.MISTWARP_LOAD_START_TIME) {
            if (window.performance && window.performance.mark) {
                window.performance.mark('mistwarp-app-render');
            }
        }

        if (window.SplashEnd) {
            window.SplashEnd();
        }
    });
};

export default render;
