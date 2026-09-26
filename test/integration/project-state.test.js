import path from 'path';
import SeleniumHelper from '../helpers/selenium-helper';

const {
    clickButton,
    findByText,
    textExists,
    scope,
    clickXpath,
    findByXpath,
    getDriver,
    loadUri
} = new SeleniumHelper();

const uri = path.resolve(__dirname, '../../build/index.html');

let driver;

const FILE_MENU_XPATH = '//div[contains(@class, "menu-bar_menu-bar-item")]' +
    '[*[contains(@class, "menu-bar_collapsible-label")]//*[text()="File"]]';

describe('Project state', () => {
    beforeAll(() => {
        driver = getDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test('File->New starts a fresh project', async () => {
        await loadUri(uri);

        // Change the project by painting a new sprite
        const el = await findByXpath('//button[@aria-label="Choose a Sprite"]');
        await driver.actions().mouseMove(el)
            .perform();
        await driver.sleep(500); // Wait for thermometer menu to come up
        await clickXpath('//button[@aria-label="Paint"]');
        await findByText('Sprite2', scope.spriteTile);

        await clickXpath(FILE_MENU_XPATH);
        await clickXpath('//li[span[text()="New"]]');
        // The editor asks before replacing an edited project
        await clickButton('Back up and start new project');

        // The new project only has the default sprite again
        await findByText('Sprite1', scope.spriteTile);
        await driver.wait(async () => !(await textExists('Sprite2', scope.spriteTile)), 20000);
    });
});
