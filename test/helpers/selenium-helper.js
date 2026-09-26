jest.setTimeout(30000); // eslint-disable-line no-undef

import bindAll from 'lodash.bindall';
import path from 'path';
import chromedriver from 'chromedriver';
import webdriver from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import portprober from 'selenium-webdriver/net/portprober';

const {Button, By, until} = webdriver;

const USE_HEADLESS = process.env.USE_HEADLESS !== 'no';
let chromedriverService = null;

// Native file choosers cannot be driven by WebDriver. Headless Chrome cancels a file input's
// chooser straight away, which makes the editor remove the input, so opening choosers is stubbed
// out and tests send file paths to the input instead.
const DISABLE_NATIVE_FILE_PICKERS = `
    window.showOpenFilePicker = undefined;
    if (!HTMLInputElement.prototype._testClick) {
        HTMLInputElement.prototype._testClick = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function () {
            if (this.type === 'file') return;
            return this._testClick();
        };
    }
`;

// The main reason for this timeout is so that we can control the timeout message and report details;
// if we hit the Jasmine default timeout then we get a terse message that we can't control.
// The Jasmine default timeout is 30 seconds so make sure this is lower.
const DEFAULT_TIMEOUT_MILLISECONDS = 20 * 1000;

/**
 * Add more debug information to an error:
 * - Merge a causal error into an outer error with valuable stack information
 * - Add the causal error's message to the outer error's message.
 * - Add debug information from the web driver, if available.
 * The outerError compensates for the loss of context caused by `regenerator-runtime`.
 * @param {Error} outerError The error to embed the cause into.
 * @param {Error} cause The "inner" error to embed.
 * @param {webdriver.ThenableWebDriver} [driver] Optional driver to capture debug info from.
 * @returns {Promise<Error>} The outerError, with the cause embedded.
 */
const enhanceError = async (outerError, cause, driver) => {
    if (cause) {
        // This is the official way to nest errors in modern Node.js, but Jest ignores this field.
        // It's here in case a future version uses it, or in case the caller does.
        outerError.cause = cause;
    }
    if (cause && cause.message) {
        outerError.message += `\n${['Cause:', ...cause.message.split('\n')].join('\n    ')}`;
    } else {
        outerError.message += '\nCause: unknown';
    }
    if (driver) {
        try {
            const url = await driver.getCurrentUrl();
            const title = await driver.getTitle();
            const pageSource = await driver.getPageSource();
            const browserLogEntries = await driver.manage()
                .logs()
                .get('browser');
            const browserLogText = browserLogEntries.map(entry => entry.message).join('\n');
            outerError.message += `\nBrowser URL: ${url}`;
            outerError.message += `\nBrowser title: ${title}`;
            outerError.message += `\nBrowser logs:\n*****\n${browserLogText}\n*****\n`;
            outerError.message += `\nBrowser page source:\n*****\n${pageSource}\n*****\n`;
        } catch (debugError) {
            // Keep the original cause when the browser has already gone away.
            outerError.message += `\nBrowser debug info unavailable: ${debugError.message}`;
        }
    }
    return outerError;
};

class SeleniumHelper {
    constructor () {
        bindAll(this, [
            'clickText',
            'clickButton',
            'clickContextMenuItem',
            'closeTopWindow',
            'openSettingsPage',
            'selectLanguage',
            'addSoundFromLibrary',
            'clickXpath',
            'clickBlocksCategory',
            'elementIsVisible',
            'revealElement',
            'findByText',
            'textToXpath',
            'findByXpath',
            'textExists',
            'getDriver',
            'getLogs',
            'loadUri',
            'rightClickText'
        ]);

        this.Key = webdriver.Key; // map Key constants, for sending special keys

        // this type declaration suppresses IDE type warnings throughout this file
        /** @type {webdriver.ThenableWebDriver} */
        this.driver = null;
    }

    /**
     * Set the browser window title. Useful for debugging.
     * @param {string} title The title to set.
     * @returns {Promise<void>} A promise that resolves when the title is set.
     */
    async setTitle (title) {
        await this.driver.executeScript(`document.title = arguments[0];`, title);
    }

    /**
     * Wait for an element to be visible.
     * @param {webdriver.WebElement} element The element to wait for.
     * @returns {Promise<void>} A promise that resolves when the element is visible.
     */
    async elementIsVisible (element) {
        const outerError = new Error('elementIsVisible failed');
        try {
            await this.setTitle(`elementIsVisible ${await element.getId()}`);
            await this.driver.wait(until.elementIsVisible(element), DEFAULT_TIMEOUT_MILLISECONDS);
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * List of useful xpath scopes for finding elements.
     * @returns {object} An object mapping names to xpath strings.
     */
    get scope () {
        return {
            blocksTab: "*[@id='react-tabs-1']",
            costumesTab: "*[@id='react-tabs-3']",
            modal: '*[contains(@class,"modal-window") or @class="ReactModalPortal"]',
            reportedValue: '*[@class="blocklyDropDownContent"]',
            soundsTab: "*[@id='react-tabs-5']",
            spriteTile: '*[starts-with(@class,"react-contextmenu-wrapper")]',
            menuBar: '*[contains(@class,"menu-bar_menu-bar_")]',
            monitors: '*[starts-with(@class,"stage_monitor-wrapper")]',
            contextMenu: '*[starts-with(@class,"react-contextmenu")]'
        };
    }

    /**
     * Instantiate a new Selenium driver.
     * @returns {webdriver.ThenableWebDriver} The new driver.
     */
    getDriver () {
        const options = new chrome.Options();
        if (USE_HEADLESS) {
            options.addArguments('--headless=new');
        }

        // Stub getUserMedia to always not allow access
        options.addArguments('--use-fake-ui-for-media-stream=deny');

        // Suppress complaints about AudioContext starting before a user gesture
        // This is especially important on Windows, where Selenium directs JS console messages to stdout
        options.addArguments('--autoplay-policy=no-user-gesture-required');

        // Allow pointing at a Chrome that is not on PATH, e.g. a Chrome for Testing download.
        if (process.env.CHROME_BIN) {
            options.setChromeBinaryPath(process.env.CHROME_BIN);
        }
        options.setLoggingPrefs(new webdriver.logging.Preferences());

        if (!chromedriverService) {
            // Allow a chromedriver that matches the installed Chrome instead of the npm package's copy.
            const driverPath = process.env.CHROMEDRIVER_BIN || chromedriver.path;
            // Parallel Jest workers probing for a free port at the same time can pick the same one and
            // end up sharing a chromedriver, so give each worker its own port.
            const port = 9515 + (10 * (Number(process.env.JEST_WORKER_ID) || 1));
            chromedriverService = new chrome.ServiceBuilder(driverPath).setPort(port)
                .build();
            // Each test file starts a fresh chromedriver on that port. The previous file's chromedriver
            // is still shutting down when the next file starts, so wait for the port to be released.
            const start = chromedriverService.start.bind(chromedriverService);
            chromedriverService.start = async timeout => {
                const deadline = Date.now() + 10000;
                while (!(await portprober.isFree(port, '127.0.0.1')) && Date.now() < deadline) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return start(timeout);
            };
            chrome.setDefaultService(chromedriverService);
            // selenium-webdriver 3 never stops the default chromedriver, so every test file would leave
            // one behind. Stop it when the driver quits.
            const quit = webdriver.WebDriver.prototype.quit;
            webdriver.WebDriver.prototype.quit = function () {
                const stop = () => chromedriverService.kill();
                return quit.call(this).then(
                    value => Promise.resolve(stop()).then(() => value),
                    error => Promise.resolve(stop()).then(() => {
                        throw error;
                    })
                );
            };
        }
        this.driver = new webdriver.Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        return this.driver;
    }

    /**
     * Find an element by xpath.
     * @param {string} xpath The xpath to search for.
     * @returns {Promise<webdriver.WebElement>} A promise that resolves to the element.
     */
    async findByXpath (xpath) {
        const outerError = new Error(`findByXpath failed with arguments:\n\txpath: ${xpath}`);
        try {
            await this.setTitle(`findByXpath ${xpath}`);
            const el = await this.driver.wait(until.elementLocated(By.xpath(xpath)), DEFAULT_TIMEOUT_MILLISECONDS);
            // await this.driver.wait(() => el.isDisplayed(), DEFAULT_TIMEOUT_MILLISECONDS);
            return el;
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Generate an xpath that finds an element by its text.
     * @param {string} text The text to search for.
     * @param {string} [scope] An optional xpath scope to search within.
     * @returns {string} The xpath.
     */
    textToXpath (text, scope) {
        return `//body//${scope || '*'}//*[contains(text(), '${text}')]`;
    }

    /**
     * Find an element by its text.
     * @param {string} text The text to search for.
     * @param {string} [scope] An optional xpath scope to search within.
     * @returns {Promise<webdriver.WebElement>} A promise that resolves to the element.
     */
    findByText (text, scope) {
        return this.findByXpath(this.textToXpath(text, scope));
    }

    /**
     * Check if an element exists by its text.
     * @param {string} text The text to search for.
     * @param {string} [scope] An optional xpath scope to search within.
     * @returns {Promise<boolean>} A promise that resolves to true if the element exists.
     */
    async textExists (text, scope) {
        const outerError = new Error(`textExists failed with arguments:\n\ttext: ${text}\n\tscope: ${scope}`);
        try {
            await this.setTitle(`textExists ${text}`);
            const elements = await this.driver.findElements(By.xpath(this.textToXpath(text, scope)));
            return elements.length > 0;
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Load a URI in the driver.
     * @param {string} uri The URI to load.
     * @returns {Promise} A promise that resolves when the URI is loaded.
     */
    async loadUri (uri) {
        const outerError = new Error(`loadUri failed with arguments:\n\turi: ${uri}`);
        try {
            await this.setTitle(`loadUri ${uri}`);
            const WINDOW_WIDTH = 1024;
            const WINDOW_HEIGHT = 768;
            await this.driver
                .get(new URL(
                    path.relative(path.resolve(__dirname, '../../build'), uri),
                    `${process.env.TEST_BASE_URL || 'http://localhost:8601'}/`
                ).href);
            await this.driver
                .executeScript('window.onbeforeunload = undefined;');
            // The File System Access API opens a native picker that WebDriver cannot drive.
            // Removing it makes the editor fall back to a file input that tests can send paths to.
            await this.driver.executeScript(DISABLE_NATIVE_FILE_PICKERS);
            // A language picked by an earlier test is remembered. Start every test in English unless asked otherwise.
            if (!/[?&]locale=/.test(uri)) {
                const reloaded = await this.driver.executeScript(`
                    if (document.documentElement.lang === 'en' && !localStorage.getItem('tw:language')) return false;
                    localStorage.removeItem('tw:language');
                    location.reload();
                    return true;
                `);
                if (reloaded) {
                    await this.driver.wait(
                        async () => await this.driver.executeScript('return document.readyState;') === 'complete',
                        DEFAULT_TIMEOUT_MILLISECONDS
                    );
                    await this.driver.executeScript(`window.onbeforeunload = undefined; ${DISABLE_NATIVE_FILE_PICKERS}`);
                }
            }
            await this.driver.manage().window()
                .setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
            await this.driver.wait(
                async () => await this.driver.executeScript('return document.readyState;') === 'complete',
                DEFAULT_TIMEOUT_MILLISECONDS
            );
            // The editor shows a full-screen loader over the menu bar until the project has loaded.
            await this.driver.wait(
                async () => (await this.driver.findElements(By.css('[class*="loader_background"]'))).length === 0,
                DEFAULT_TIMEOUT_MILLISECONDS
            );
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Click an element by xpath.
     * @param {string} xpath The xpath to click.
     * @returns {Promise<void>} A promise that resolves when the element is clicked.
     */
    async clickXpath (xpath) {
        const outerError = new Error(`clickXpath failed with arguments:\n\txpath: ${xpath}`);
        try {
            await this.setTitle(`clickXpath ${xpath}`);
            const el = await this.findByXpath(xpath);
            // Scrollable toolbars (such as library filter tags) can leave the element off screen.
            await this.driver.executeScript('arguments[0].scrollIntoView({block: "center", inline: "center"});', el);
            return el.click();
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Bring an element into view before interacting with it.
     * Scrollable panes (such as the block category menu) can leave an element under a fixed button, and the
     * block palette hides blocks that are scrolled out of view, so the palette is scrolled to them first.
     * @param {webdriver.WebElement} el The element to reveal.
     * @returns {Promise<void>} A promise that resolves when the element is displayed.
     */
    async revealElement (el) {
        const inFlyout = await this.driver.executeScript(`
            const el = arguments[0];
            const flyout = el.closest('.blocklyFlyout');
            if (!flyout) {
                el.scrollIntoView({block: 'center', inline: 'center'});
                return false;
            }
            const block = el.closest('g.blocklyDraggable');
            if (!block || block.style.display !== 'none') return false;
            const workspace = window.ScratchBlocks.getMainWorkspace();
            const flyoutWorkspace = workspace.getFlyout().getWorkspace();
            const blockId = block.getAttribute('data-id');
            const target = flyoutWorkspace.getBlockById(blockId);
            if (!target) return false;
            const y = target.getRelativeToSurfaceXY().y;
            workspace.getFlyout().scrollTo(Math.max(0, y - 40));
            return true;
        `, el);
        if (inFlyout) {
            await this.driver.wait(
                () => this.driver.executeScript(
                    'const b = arguments[0].closest("g.blocklyDraggable"); return !b || b.style.display !== "none";', el
                ),
                DEFAULT_TIMEOUT_MILLISECONDS
            );
            await this.driver.sleep(500); // Wait for the scroll animation to finish
        }
    }

    /**
     * Click an element by its text.
     * @param {string} text The text to click.
     * @param {string} [scope] An optional xpath scope to search within.
     * @returns {Promise<void>} A promise that resolves when the element is clicked.
     */
    async clickText (text, scope) {
        const outerError = new Error(`clickText failed with arguments:\n\ttext: ${text}\n\tscope: ${scope}`);
        try {
            await this.setTitle(`clickText ${text}`);
            const el = await this.findByText(text, scope);
            await this.revealElement(el);
            return el.click();
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Click a category in the blocks pane.
     * @param {string} categoryText The text of the category to click.
     * @returns {Promise<void>} A promise that resolves when the category is clicked.
     */
    async clickBlocksCategory (categoryText) {
        const outerError = new Error(`clickBlocksCategory failed with arguments:\n\tcategoryText: ${categoryText}`);
        // The toolbox is destroyed and recreated several times, so avoid clicking on a nonexistent element and erroring
        // out. First we wait for the block pane itself to appear, then wait 100ms for the toolbox to finish refreshing,
        // then finally click the toolbox text.
        try {
            await this.setTitle(`clickBlocksCategory ${categoryText}`);
            await this.findByXpath('//div[contains(@class, "blocks_blocks")]');
            await this.driver.sleep(100);
            await this.clickText(categoryText, 'div[contains(@class, "blocks_blocks")]');
            await this.driver.sleep(500); // Wait for scroll to finish
        } catch (cause) {
            throw await enhanceError(outerError, cause);
        }
    }

    /**
     * Right click an element by its text.
     * @param {string} text The text to right click.
     * @param {string} [scope] An optional xpath scope to search within.
     * @returns {Promise<void>} A promise that resolves when the element is right clicked.
     */
    async rightClickText (text, scope) {
        const outerError = new Error(`rightClickText failed with arguments:\n\ttext: ${text}\n\tscope: ${scope}`);
        try {
            await this.setTitle(`rightClickText ${text}`);
            const el = await this.findByText(text, scope);
            await this.revealElement(el);
            return this.driver.actions()
                .click(el, Button.RIGHT)
                .perform();
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Click an item in the open right click menu by its text.
     * The menu item element receives clicks, not the text inside it.
     * @param {string} text The text of the menu item.
     * @returns {Promise<void>} A promise that resolves when the item is clicked.
     */
    async clickContextMenuItem (text) {
        const outerError = new Error(`clickContextMenuItem failed with arguments:\n\ttext: ${text}`);
        try {
            await this.setTitle(`clickContextMenuItem ${text}`);
            await this.clickXpath(
                `//*[contains(@class,"react-contextmenu--visible")]//*[@role="menuitem"][contains(., '${text}')]`
            );
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Close the topmost windowed modal (settings, libraries, and so on).
     * @returns {Promise<void>} A promise that resolves when the window is closed.
     */
    async closeTopWindow () {
        const outerError = new Error('closeTopWindow failed');
        try {
            await this.setTitle('closeTopWindow');
            const buttons = await this.driver.findElements(By.css('.addon-window-btn-close'));
            if (buttons.length === 0) return; // Some actions, such as changing the language, close the window
            await buttons[buttons.length - 1].click();
            await this.driver.wait(
                async () => (await this.driver.findElements(By.css('.addon-window-btn-close'))).length < buttons.length,
                DEFAULT_TIMEOUT_MILLISECONDS
            );
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Open the settings window on the page with the given sidebar label.
     * @param {string} label The sidebar label, such as "Language".
     * @returns {Promise<void>} A promise that resolves when the page is shown.
     */
    async openSettingsPage (label) {
        const outerError = new Error(`openSettingsPage failed with arguments:\n\tlabel: ${label}`);
        try {
            await this.setTitle(`openSettingsPage ${label}`);
            await this.clickXpath('//button[@data-mw-item="view"]');
            await this.clickXpath(`//*[contains(@class,"modal-window")]//button[.//*[text()="${label}"] or text()="${label}"]`);
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Switch the editor language through the settings window.
     * @param {string} name The language name as shown in the picker, such as "Deutsch".
     * @returns {Promise<void>} A promise that resolves when the language is selected and the window is closed.
     */
    async selectLanguage (name) {
        const outerError = new Error(`selectLanguage failed with arguments:\n\tname: ${name}`);
        try {
            await this.openSettingsPage('Language');
            await this.clickXpath(`//*[contains(@class,"modal-window")]//select/option[text()="${name}"]`);
            await this.driver.sleep(1000); // Wait for the editor to reload its translations
            await this.closeTopWindow();
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Add a sound from the sound library to the selected target. The sounds tab must be open.
     * @param {string} search Text to type into the library search box.
     * @param {string} name The name of the sound to click.
     * @returns {Promise<void>} A promise that resolves when the sound has been added.
     */
    async addSoundFromLibrary (search, name) {
        const outerError = new Error(`addSoundFromLibrary failed with arguments:\n\tsearch: ${search}\n\tname: ${name}`);
        try {
            await this.clickXpath('//button[@aria-label="Add sound"]');
            const el = await this.findByXpath("//input[@placeholder='Search']");
            await el.sendKeys(search);
            await this.clickText(name, this.scope.modal);
            await this.findByText(name, this.scope.soundsTab);
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Click a button by its text.
     * @param {string} text The text to click.
     * @returns {Promise<void>} A promise that resolves when the button is clicked.
     */
    async clickButton (text) {
        const outerError = new Error(`clickButton failed with arguments:\n\ttext: ${text}`);
        try {
            await this.setTitle(`clickButton ${text}`);
            await this.clickXpath(`//button[.//*[contains(text(), '${text}')] or contains(text(), '${text}')]`);
        } catch (cause) {
            throw await enhanceError(outerError, cause, this.driver);
        }
    }

    /**
     * Get selected browser log entries.
     * @param {Array.<string>} [whitelist] An optional list of log strings to allow. Default: see implementation.
     * @returns {Promise<Array.<webdriver.logging.Entry>>} A promise that resolves to the log entries.
     */
    async getLogs (whitelist) {
        const outerError = new Error(`getLogs failed with arguments:\n\twhitelist: ${whitelist}`);
        try {
            await this.setTitle(`getLogs ${whitelist}`);
            if (!whitelist) {
                // Default whitelist
                whitelist = [
                    'The play() request was interrupted by a call to pause()',
                    // The status banner fetch is blocked by CORS when the editor is served locally.
                    'status.warp.mistium.com',
                    'net::ERR_FAILED'
                ];
            }
            const entries = await this.driver.manage()
                .logs()
                .get('browser');
            return entries.filter(entry => {
                const message = entry.message;
                for (const element of whitelist) {
                    if (message.indexOf(element) !== -1) {
                        return false;
                    } else if (entry.level !== 'SEVERE') { // WARNING: this doesn't do what it looks like it does!
                        return false;
                    }
                }
                return true;
            });
        } catch (cause) {
            throw await enhanceError(outerError, cause);
        }
    }
}

export default SeleniumHelper;
