import {isTablet, engine} from './browser';

/**
 * Helper method to request full screen in the browser when on a tablet.
 */
export default function () {
    if (isTablet) {
        if ((engine === 'webkit' || engine === 'blink') && document.documentElement.webkitRequestFullScreen) {
            document.documentElement.webkitRequestFullScreen();
        }
        if (engine === 'gecko' && document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        }
    }
}
