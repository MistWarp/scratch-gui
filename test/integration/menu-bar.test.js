import path from 'path';
import SeleniumHelper from '../helpers/selenium-helper';

const {
    clickButton,
    closeTopWindow,
    openSettingsPage,
    textExists,
    clickContextMenuItem,
    clickText,
    clickXpath,
    findByText,
    findByXpath,
    getDriver,
    loadUri,
    rightClickText,
    scope
} = new SeleniumHelper();

const uri = path.resolve(__dirname, '../../build/index.html');

let driver;

const FILE_MENU_XPATH = '//div[contains(@class, "menu-bar_menu-bar-item")]' +
    '[*[contains(@class, "menu-bar_collapsible-label")]//*[text()="File"]]';
describe('Menu bar settings', () => {
    beforeAll(() => {
        driver = getDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test('File->New should be enabled', async () => {
        await loadUri(uri);
        await clickXpath(FILE_MENU_XPATH);
        await findByXpath('//*[li[span[text()="New"]] and not(@data-tip="tooltip")]');
    });

    test('File->Load should be enabled', async () => {
        await loadUri(uri);
        await clickXpath(FILE_MENU_XPATH);
        await findByXpath('//*[li[text()="Load from your computer"] and not(@data-tip="tooltip")]');
    });

    test('File->Save should be enabled', async () => {
        await loadUri(uri);
        await clickXpath(FILE_MENU_XPATH);
        await findByXpath('//*[li[span[text()="Save to your computer"]] and not(@data-tip="tooltip")]');
    });


    test('Logo should be clickable', async () => {
        await loadUri(uri);
        await clickXpath('//a[@href="/"]//img[@alt="MistWarp"]');
        const currentUrl = await driver.getCurrentUrl();
        await expect(currentUrl.startsWith(process.env.TEST_BASE_URL)).toBe(true);
    });

    test('(GH#4064) Project name should be editable', async () => {
        await loadUri(uri);
        const el = await findByXpath('//input[@value="Project"]');
        await el.sendKeys(' - Personalized');
        await clickText('Costumes'); // just to blur the input
        await clickXpath('//input[@value="Project - Personalized"]');
    });

    test('User is not warned before uploading project file over a fresh project', async () => {
        await loadUri(uri);
        await clickXpath(FILE_MENU_XPATH);
        await clickText('Load from your computer');
        const input = await findByXpath('//body/input[@type="file"]');
        await input.sendKeys(path.resolve(__dirname, '../fixtures/project1.sb3'));
        // No replace alert since no changes were made
        await findByText('project1-sprite');
    });

    test('User is warned before uploading project file over an edited project', async () => {
        await loadUri(uri);

        // Change the project by deleting a sprite
        await rightClickText('Sprite1', scope.spriteTile);
        await clickContextMenuItem('delete');

        await clickXpath(FILE_MENU_XPATH);
        await clickText('Load from your computer');
        const input = await findByXpath('//body/input[@type="file"]');
        await input.sendKeys(path.resolve(__dirname, '../fixtures/project1.sb3'));
        // The editor asks before replacing an edited project
        await findByText('Replace this project?');
        await clickButton('OK');
        await findByText('project1-sprite');
    });

    test('Block colors page shows the color options', async () => {
        await loadUri(uri);
        await openSettingsPage('Blocks');

        expect(await (await findByText('Original', scope.modal)).isDisplayed()).toBe(true);
        expect(await (await findByText('High Contrast', scope.modal)).isDisplayed()).toBe(true);
    });

    test('Block colors page switches to high contrast', async () => {
        await loadUri(uri);
        await openSettingsPage('Blocks');
        await clickText('High Contrast', scope.modal);
        await closeTopWindow();

        // There is a tiny delay for the color theme to be applied to the categories.
        await driver.wait(async () => {
            const motionCategoryDiv = await findByXpath(
                '//div[contains(@class, "scratchCategoryMenuItem") and ' +
                'contains(@class, "scratchCategoryId-motion")]/*[1]');
            const color = await motionCategoryDiv.getCssValue('background-color');

            // Documentation for getCssValue says it depends on how the browser
            // returns the value. Locally I am seeing 'rgba(128, 181, 255, 1)',
            // but this is a bit flexible just in case.
            return /128,\s?181,\s?255/.test(color) || color.includes('80B5FF');
        }, 5000, 'Motion category color does not match high contrast theme');
    });

    test('Settings window switches between pages', async () => {
        await loadUri(uri);
        await openSettingsPage('Language');

        // Only the language picker is visible
        await findByXpath('//*[contains(@class,"modal-window")]//select/option[text()="Esperanto"]');
        expect(await textExists('High Contrast', scope.modal)).toBe(false);

        await clickText('Blocks', scope.modal);

        // Only the block color options are visible
        expect(await (await findByText('High Contrast', scope.modal)).isDisplayed()).toBe(true);
        expect(await textExists('Esperanto', scope.modal)).toBe(false);
    });

    test('Menu labels hidden when width is equal to 1024', async () => {
        await loadUri(uri);
        await driver.manage()
            .window()
            .setSize(1024, 768);

        const collapsibleMenus = ['Settings', 'File', 'Edit'];
        for (const menu of collapsibleMenus) {
            const settingsMenu = await findByText(menu, scope.menuBar);
            expect(await settingsMenu.isDisplayed()).toBe(false);
        }
    });

    test('Menu labels shown when width is greater than 1024', async () => {
        await loadUri(uri);
        await driver.manage()
            .window()
            .setSize(1200, 768);

        const collapsibleMenus = ['Settings', 'File', 'Edit'];
        for (const menu of collapsibleMenus) {
            const settingsMenu = await findByText(menu, scope.menuBar);
            expect(await settingsMenu.isDisplayed()).toBe(true);
        }
    });
});
