import fs from 'fs';
import 'chromedriver';
import webdriver from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

jest.setTimeout(180000);

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8601';
const {By, until} = webdriver;
let driver;
const enterRuntime = async () => {
    await driver.switchTo().defaultContent();
    const frame = await driver.wait(until.elementLocated(By.css('iframe[title="MistWarp editor"]')), 30000);
    await driver.switchTo().frame(frame);
    await driver.wait(() => driver.executeScript('return Boolean(window.vm && window.vm.initialized);'), 120000);
    await driver.wait(() => driver.executeScript(`
        return window.vm.runtime.targets.length > 1 && !document.querySelector('[class*="loader_background"]');
    `), 120000);
};

beforeAll(() => {
    if (process.env.CHROMEDRIVER_PATH) {
        chrome.setDefaultService(new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH).build());
    }
    driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(
        new chrome.Options().addArguments('--headless=new', '--autoplay-policy=no-user-gesture-required')
    ).build();
});
afterAll(async () => { if (driver) await driver.quit(); });

test('the runtime refuses direct top-level entry', async () => {
    await driver.get(`${base}/editor-runtime.html`);
    await driver.wait(until.elementLocated(By.linkText('Open editor')), 30000);
    expect(await driver.executeScript('return typeof window.vm;')).toBe('undefined');
});

test('unchanged VM extensions work without access to the parent account page', async () => {
    await driver.get(`${base}/editor.html`);
    await enterRuntime();
    expect(await driver.executeScript('return location.pathname;')).toBe('/editor-runtime.html');
    const result = await driver.executeAsyncScript(`
        const done = arguments[arguments.length - 1];
        const source = '(function(Scratch) {' +
          'if (!Scratch.extensions.unsandboxed || !Scratch.vm) throw new Error("VM access missing");' +
          'Scratch.vm.runtime.sandboxCompatibilityProbe = true;' +
          'Scratch.extensions.register({getInfo(){return {id:"sandboxprobe",name:"Sandbox probe",blocks:[]}}});' +
          '})(Scratch);';
        window.vm.extensionManager.loadExtensionURL('data:application/javascript,' + encodeURIComponent(source))
          .then(() => {
            let parentBlocked = false;
            try { void parent.document.body; } catch (e) { parentBlocked = e.name === 'SecurityError'; }
            let storageBlocked = false;
            try { void parent.localStorage.length; } catch (e) { storageBlocked = e.name === 'SecurityError'; }
            done({origin:window.origin,parentBlocked,storageBlocked,loaded:window.vm.runtime.sandboxCompatibilityProbe});
          }, error => done({error:String(error)}));
    `);
    expect(result).toEqual({origin: 'null', parentBlocked: true, storageBlocked: true, loaded: true});
    if (process.env.SANDBOX_SCREENSHOT) {
        await driver.switchTo().defaultContent();
        fs.writeFileSync(process.env.SANDBOX_SCREENSHOT, await driver.takeScreenshot(), 'base64');
    }
});

test('isolated preferences and binary project data survive a complete editor reload', async () => {
    await enterRuntime();
    await driver.executeScript('localStorage.setItem("sandbox-persistence-probe", "saved");');
    expect(await driver.executeAsyncScript(`
        const done = arguments[arguments.length - 1];
        const request = indexedDB.open('sandbox-project-probe', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('projects');
        request.onerror = () => done(false);
        request.onsuccess = () => {
            const db = request.result;
            const write = db.transaction('projects', 'readwrite');
            write.objectStore('projects').put(new Uint8Array([1, 2, 255]), 'draft');
            write.oncomplete = () => { db.close(); done(true); };
            write.onabort = () => { db.close(); done(false); };
        };
    `)).toBe(true);
    await driver.switchTo().defaultContent();
    await driver.wait(() => driver.executeAsyncScript(`
        const done = arguments[arguments.length - 1];
        const request = indexedDB.open('MW_IsolatedEditor');
        request.onerror = () => done(false);
        request.onsuccess = () => {
            const db = request.result;
            const read = db.transaction('workspaces').objectStore('workspaces').getAll();
            read.onsuccess = () => {
                const found = read.result.some(item => item.local['sandbox-persistence-probe'] === 'saved' &&
                    item.databases.some(db => db.name === 'sandbox-project-probe' &&
                        db.stores.some(store => store.values.length === 1)));
                db.close(); done(found);
            };
        };
    `), 15000);
    await driver.navigate().refresh();
    await enterRuntime();
    expect(await driver.executeScript('return localStorage.getItem("sandbox-persistence-probe");')).toBe('saved');
    expect(await driver.executeAsyncScript(`
        const done = arguments[arguments.length - 1];
        const request = indexedDB.open('sandbox-project-probe');
        request.onerror = () => done(null);
        request.onsuccess = () => {
            const db = request.result;
            const read = db.transaction('projects').objectStore('projects').get('draft');
            read.onsuccess = () => { db.close(); done(Array.from(read.result)); };
            read.onerror = () => { db.close(); done(null); };
        };
    `)).toEqual([1, 2, 255]);
});
