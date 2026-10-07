/* eslint-disable @typescript-eslint/no-require-imports -- Operational CJS loader compiles installed TypeScript in memory. */
/* Operational commands use the installed TypeScript compiler; no additional runtime is required. */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const Module = require('node:module');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.chdir(root);
for (const name of ['.env', '.env.local']) if (fs.existsSync(name)) process.loadEnvFile(name);
const ts = require('typescript');
Module._extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const load = Module._load;
Module._load = function(id, parent, main) { if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2)); return load.call(this, id, parent, main); };
const db = require('../src/lib/db/index.ts');
require('../src/lib/auth.ts');
require('../src/lib/library.ts');
const jobs = require('../src/lib/studio/jobs.ts');
const agents = require('../src/lib/studio/agent-runs.ts');
require('../src/lib/studio/skill-runs.ts');
const renders = require('../src/lib/render.ts');
require('../src/lib/payments.ts');
require('../src/lib/commissions.ts');
require('../src/lib/studio/usage.ts');

const { mediaRoot } = require('../src/lib/media.ts');
async function initialize() { await require('../src/lib/startup.ts').initializeBackend(); }
async function backup() {
  const directory = path.join(root, 'backups', new Date().toISOString().replace(/[:.]/g, '-')); await fsp.mkdir(directory, { recursive: true });
  await db.sequelize.query('VACUUM INTO :file', { replacements: { file: path.join(directory, 'database.sqlite') } });
  if (fs.existsSync(path.join(root,'data'))) await fsp.cp(path.join(root,'data'), path.join(directory,'data'), { recursive: true });
  const externalMedia = mediaRoot();
  if (!externalMedia.startsWith(path.join(root,'data') + path.sep)) await fsp.cp(externalMedia, path.join(directory, 'media'), { recursive: true });
  await fsp.writeFile(path.join(directory,'manifest.json'), JSON.stringify({ version: 1, createdAt: new Date().toISOString(), externalMedia: !externalMedia.startsWith(path.join(root,'data') + path.sep) },null,2));
  console.log(`Backup created: ${directory}`);
}
async function garbageCollect() {
  const references = new Set();
  const visit = value => { if (typeof value === 'string') { for (const match of value.matchAll(/\/uploads\/([A-Za-z0-9_-]+\.[a-z0-9]+)/gi)) references.add(match[1]); try { if (/^[\[{]/.test(value)) visit(JSON.parse(value)); } catch {} } else if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') Object.values(value).forEach(visit); };
  // Soft-deleted asset rows themselves are excluded; canvas, template history, orders and jobs retain live references.
  for (const model of Object.values(db.sequelize.models)) {
    const table = String(model.getTableName());
    if (!(await db.sequelize.getQueryInterface().showAllTables()).includes(table)) continue;
    for (const row of await model.findAll({ hooks: false })) {
      if (model.name === 'LibraryAsset' && row.get('deletedAt')) continue;
      visit(row.toJSON());
    }
  }
  let removed = 0;
  for (const name of await fsp.readdir(mediaRoot())) {
    if (!/^[A-Za-z0-9_-]+\.[a-z0-9]+$/i.test(name) || references.has(name)) continue;
    const file = path.join(mediaRoot(), name), stat = await fsp.lstat(file);
    if (stat.isFile() && !stat.isSymbolicLink() && stat.mtimeMs < Date.now() - 7 * 86400000) { await fsp.unlink(file); removed++; }
  }
  console.log(`Removed ${removed} unreferenced files older than 7 days.`);
}
async function worker() {
  let stopping = false;
  process.on('SIGTERM', () => { stopping = true; }); process.on('SIGINT', () => { stopping = true; });
  while (!stopping) {
    try { await jobs.recoverGenerationQueue(); await agents.recoverAgentQueue(); await renders.recoverRenderQueue(); }
    catch { console.error('Worker cycle failed; retained jobs will be checked on the next cycle.'); }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
(async () => {
  const command = process.argv[2] || 'migrate';
  if (command === 'restore') {
    const source = path.resolve(process.argv[3] || '');
    const manifest = JSON.parse(await fsp.readFile(path.join(source, 'manifest.json'), 'utf8'));
    if (manifest.version !== 1) throw new Error('Unsupported backup.');
    const directory = path.join(root, 'data', `restored-${Date.now()}`);
    await fsp.mkdir(directory, { recursive: true });
    await fsp.copyFile(path.join(source, 'database.sqlite'), path.join(directory, 'database.sqlite'), fs.constants.COPYFILE_EXCL);
    const savedMedia = path.join(source, manifest.externalMedia ? 'media' : 'data/uploads');
    if (fs.existsSync(savedMedia)) await fsp.cp(savedMedia, path.join(directory, 'uploads'), { recursive: true });
    console.log(`Restored into ${directory}. Stop the server, set SPARKLE_DATABASE_PATH to its database.sqlite and SPARKLE_MEDIA_PATH to its uploads, then restart. The active database was preserved.`);
    return;
  }
  await initialize();
  if (command === 'migrate') console.log('Database migrations applied.');
  else if (command === 'backup') await backup();
  else if (command === 'gc') await garbageCollect();
  else if (command === 'worker') await worker();
  else if (command === 'serve') {
    const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', process.env.SPARKLE_AUTH_MODE === 'accounts' ? '0.0.0.0' : '127.0.0.1', ...process.argv.slice(3)], { stdio: 'inherit', env: process.env });
    const stop = signal => child.kill(signal); process.on('SIGTERM', () => stop('SIGTERM')); process.on('SIGINT', () => stop('SIGINT'));
    child.on('exit', code => { process.exit(code || 0); }); await worker();
  } else throw new Error('Unknown backend command.');
  await db.sequelize.close();
})().catch(() => { console.error('Backend operation failed. Check database permissions and configuration; credentials were not logged.'); process.exitCode = 1; });
