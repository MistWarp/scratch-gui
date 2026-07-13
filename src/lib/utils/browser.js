import Bowser from 'bowser';

const parser = Bowser.getParser(window.navigator.userAgent);

export const isMac = parser.getOSName(true) === 'macos';

export const isTablet = parser.getPlatformType(true) === 'tablet';

export const isInternetExplorer = parser.getBrowserName(true) === 'internet explorer';

export const engine = parser.getEngineName(true);
