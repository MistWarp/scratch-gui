import '../lib/utils/tw-polyfill';
import normalizeStyles from '../lib/normalize.module.css';
import {initSiteErrorReporting} from '../lib/error-reporter.js';

document.documentElement.classList.add(normalizeStyles.root);
initSiteErrorReporting();
