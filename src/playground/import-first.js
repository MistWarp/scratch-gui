import './public-path';
import '../lib/utils/tw-polyfill';
import '../lib/normalize.css';
import {initSiteErrorReporting} from '../lib/error-reporter.js';

initSiteErrorReporting();
