// node scripts/build-threert-package.mjs /path/to/ThreeRT
// Use the recorded upstream commit with its packages/scene and packages/gameplay sources.
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstream = path.resolve(process.argv[2]);
const project = path.join(root, 'public/scene-assets/threert');
const aliases = Object.fromEntries(['gameplay', 'scene'].map(name =>
  [`@threert/${name}`, path.join(upstream, 'packages', name, 'src/index.ts')]));
const digest = data => createHash('sha256').update(data).digest('hex');
const bundle = await build({
  stdin: {contents: `import scene from './game.mjs';
    import {defineGame, installNodeHost} from '@threert/gameplay';
    installNodeHost(defineGame({state:{}, setup:scene, handlers:{}}));`, resolveDir: project},
  bundle: true, alias: aliases, platform: 'neutral', target: 'es2022', format: 'iife',
  legalComments: 'none', write: false, minify: true,
  banner: {js: '/* ThreeRT — MIT, Meshy LLC 2026. See ThreeRT-LICENSE.txt. */'}
});
const code = bundle.outputFiles[0].contents;
const recording = await build({stdin: {contents: `import {RecordingEngine} from '@threert/scene'; globalThis.__engine=new RecordingEngine();`}, alias: aliases, bundle: true, format: 'iife', platform: 'neutral', write:false});
const ctx = {TextDecoder, TextEncoder};
runInNewContext(recording.outputFiles[0].text, ctx);
runInNewContext(bundle.outputFiles[0].text, ctx);
ctx.__threert.setup('starlit-check', 27);
for (let i=1; i<=3; i++) ctx.__threert.frame(1/60, i/60);
const calls = ctx.__engine.take();
assert.equal(calls.filter(([type, , desc]) => type === 'object' && desc.kind === 'light').length, 13);
assert.ok(JSON.stringify(calls).includes('assets/winter-sky.hdr'));
assert.ok(JSON.stringify(calls).includes('assets/courtyard.glb'));
await writeFile(path.join(project, 'game.js'), code);
const assets = {};
for (const file of (await readdir(path.join(project, 'assets'))).sort()) {
  const data = await readFile(path.join(project,'assets',file));
  assets['assets/'+file] = {size: data.length, sha256: digest(data)};
}
const manifest = {format:'threert/1', id:'osc-starlit-courtyard', name:'별빛광장', version:'1.0.0', hash:digest(code).slice(0,16),
  entry:'game.js', assets, web:'index.html', minClient:'0.5.3'};
await writeFile(path.join(project,'threert.json'), JSON.stringify(manifest,null,2)+'\n');
console.log(`Validated ThreeRT setup and three frames, ${Object.keys(assets).length} assets and 13 lights.`);

// Keep a portable copy alongside the URL-based package for offline native use.
const {execFileSync} = await import('node:child_process');
execFileSync('python3', ['-c', `
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import sys
folder = Path(sys.argv[1])
with ZipFile(folder.parent / 'starlit-threert.zip', 'w', ZIP_DEFLATED, compresslevel=7) as archive:
    for path in sorted(folder.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(folder))
`, project]);
