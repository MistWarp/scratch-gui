import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const output = path.resolve(process.argv[2]);
const checkout = path.dirname(output);
const run = (command, args, cwd) => execFileSync(command, args, {cwd, stdio: 'inherit'});

fs.rmSync(checkout, {recursive: true, force: true});
run('git', ['clone', '--depth', '1', '--branch', 'master', 'https://github.com/MistWarp/docs', checkout]);
run('npm', ['ci', '--no-audit', '--no-fund'], checkout);
run('npm', ['run', 'build'], checkout);
if (!fs.existsSync(path.join(output, 'index.html'))) throw new Error(`The docs build did not produce ${output}`);
