import {execFileSync} from 'child_process';
import path from 'path';

test('production keeps scoped editor classes and explicit third-party theme rules', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
        import path from 'node:path';
        import {build} from 'vite';
        const filename = path.resolve('src/components/find-bar/find-bar.module.css');
        const result = await build({
            configFile: false,
            logLevel: 'silent',
            publicDir: false,
            plugins: [{
                name: 'test-entry',
                resolveId(id) {
                    if (id === 'test-entry') return id;
                },
                load(id) {
                    if (id === 'test-entry') return 'import styles from ' + JSON.stringify(filename) +
                        '; document.body.className = styles["sa-find-bar"]';
                }
            }],
            build: {write: false, rollupOptions: {input: 'test-entry'}}
        });
        console.log(JSON.stringify(result.output.filter(file => file.type === 'asset')
            .map(file => String(file.source)).join('\\n')));
    `], {cwd: path.resolve(__dirname, '../..'), encoding: 'utf8'});
    const css = JSON.parse(output);
    expect(css).toMatch(/\._sa-find-bar_\w+/);
    expect(css).toMatch(/\._sa-find-toggle_\w+/);
    expect(css).toContain('.sa-block-color');
    expect(css).not.toContain(':global(');
});
