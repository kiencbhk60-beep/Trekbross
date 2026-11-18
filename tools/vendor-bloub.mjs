import {mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

if (!process.argv[2]) throw Error('Usage: node tools/vendor-bloub.mjs <path-to-installed-bloub>');
const source = resolve(process.argv[2]);
const target = fileURLToPath(new URL('../vendor/bloub/', import.meta.url));
const ts = createRequire(resolve(source, 'package.json'))('typescript');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: source, encoding: 'utf8'}).trim();
mkdirSync(target, {recursive: true});
for (const file of readdirSync(resolve(source, 'src/bot'))) {
  if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
  const output = ts.transpileModule(readFileSync(resolve(source, 'src/bot', file), 'utf8'), {
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022},
  }).outputText.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g, '$1$2.js$3');
  writeFileSync(resolve(target, file.replace(/\.ts$/, '.js')), '// Bloub engine — MIT, Copyright (c) 2026 Jérémy Perret. See LICENSE.\n' + output);
}
copyFileSync(resolve(source, 'LICENSE'), resolve(target, 'LICENSE'));
writeFileSync(resolve(target, 'package.json'), '{"type":"module","private":true}\n');
writeFileSync(resolve(target, 'NOTICE.txt'), `Bloub SVG avatar engine\nSource: https://github.com/jeremy-prt/bloub\nRevision: ${revision}\nLicense: MIT; see LICENSE.\n\nOnly framework-free src/bot modules are included, transpiled with TypeScript.\nUpstream animation constants and expressions are unchanged.\nRegenerate: node tools/vendor-bloub.mjs <path-to-installed-bloub>\n\nTREKBROSS supplies its own round orange body, black eyes, draggable UI and interaction mapping.\n`);
console.log(`Vendored Bloub engine at ${revision}`);
