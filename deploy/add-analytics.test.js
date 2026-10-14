// Checks for deploy/add-analytics.js: the repository is never touched, nothing happens without a snippet, bad
// settings stop the deploy with a clear message, and every page gets the snippet exactly once, with the physics
// in each page left byte-for-byte as it was.   Run: node deploy/add-analytics.test.js
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), { spawnSync } = require('child_process');
const A = require('./add-analytics.js');
const ROOT = path.resolve(__dirname, '..'), SCRIPT = path.join(__dirname, 'add-analytics.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

const SNIPPET = '<!-- Privacy-friendly analytics by Plausible -->\n<script async src="https://plausible.io/js/pa-TEST123.js"></script>\n' +
  '<script>\n  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};\n  plausible.init()\n</script>';
const HOSTS = 'opensims.wu-physics.net';
const run = (args, env, cwd) => spawnSync(process.execPath, [cwd ? path.join(cwd, 'deploy/add-analytics.js') : SCRIPT].concat(args),
  { env: Object.assign({ PATH: process.env.PATH }, env), encoding: 'utf8' });
// a fingerprint of every page in a directory
const hash = dir => A.pages(dir).concat(['TEMPLATE.html']).map(f => f + ':' + crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, f))).digest('hex')).join('\n');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensims-analytics-'));
const repoBefore = hash(ROOT);

// 1. nothing set: nothing happens, anywhere
let r = run([], {});
ok(r.status === 0 && /not set/.test(r.stdout), 'no snippet: exits cleanly and says so');
// 2. snippet set but not on Cloudflare: refuses to edit the repository in place
r = run([], { ANALYTICS_SNIPPET: SNIPPET, ANALYTICS_HOSTS: HOSTS });
ok(r.status === 1 && /only runs in a Cloudflare build/.test(r.stderr), 'snippet set outside Cloudflare without --out: refuses');
// 3. bad settings stop the deploy
r = run(['--out', tmp()], { ANALYTICS_SNIPPET: SNIPPET });
ok(r.status === 1 && /ANALYTICS_HOSTS is not/.test(r.stderr), 'snippet without hosts: stops with a message');
r = run(['--out', tmp()], { ANALYTICS_SNIPPET: 'pa-TEST123', ANALYTICS_HOSTS: HOSTS });
ok(r.status === 1 && /HTML snippet itself/.test(r.stderr), 'a bare site ID instead of the snippet: stops with a message');
r = run(['--out', tmp()], { ANALYTICS_SNIPPET: SNIPPET, ANALYTICS_HOSTS: 'https://opensims.wu-physics.net/' });
ok(r.status === 1 && /not a host name/.test(r.stderr), 'a URL instead of a host name: stops with a message');
r = run(['--out', path.join(ROOT, 'build')], { ANALYTICS_SNIPPET: SNIPPET, ANALYTICS_HOSTS: HOSTS });
ok(r.status === 1 && /outside the repository/.test(r.stderr) && !fs.existsSync(path.join(ROOT, 'build')), '--out inside the repository: refused');

// 4. a real run into a copy
const out = tmp();
r = run(['--out', out], { ANALYTICS_SNIPPET: SNIPPET, ANALYTICS_HOSTS: HOSTS + ', www.' + HOSTS });
const pages = A.pages(out), nSims = fs.readdirSync(path.join(ROOT, 'sims')).filter(f => f.endsWith('.html')).length;
ok(r.status === 0 && pages.length === nSims + 1, 'run with --out: ' + pages.length + ' pages (index + ' + nSims + ' sims)');
let once = 0, beforeHead = 0, coreSame = 0, rest = 0;
pages.forEach(f => {
  const a = fs.readFileSync(path.join(ROOT, f), 'utf8'), b = fs.readFileSync(path.join(out, f), 'utf8');
  if (b.split('id="site-analytics"').length === 2 && b.includes('pa-TEST123.js')) once++;
  if (b.indexOf('id="site-analytics"') < b.search(/<\/head>/i)) beforeHead++;
  // the only change is the inserted block
  if (b.replace(A.block(SNIPPET, [HOSTS, 'www.' + HOSTS]), '') === a) rest++;
  const core = s => { const i = s.indexOf('---- physics core'), j = s.indexOf('---- end of core'); return i < 0 ? '' : s.slice(i, j); };
  if (core(a) === core(b)) coreSame++;
});
ok(once === pages.length, 'every page has the snippet exactly once (' + once + '/' + pages.length + ')');
ok(beforeHead === pages.length, 'and always inside <head>');
ok(rest === pages.length, 'nothing else in any page changed');
ok(coreSame === pages.length, 'physics cores byte-for-byte unchanged');
ok(fs.readFileSync(path.join(out, 'TEMPLATE.html'), 'utf8') === fs.readFileSync(path.join(ROOT, 'TEMPLATE.html'), 'utf8'), 'TEMPLATE.html left alone');
ok(!fs.existsSync(path.join(out, '.git')), 'repository history not copied');
// the directory page's download button cuts the block out with its own pattern: check that pattern gives back
// exactly the repository's file, for every page
const m = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/html\.replace\((\/<!-- site-analytics:.*?\/)\s*,\s*''\)/);
ok(!!m, 'index.html has the download button\'s cleaning pattern');
if (m) { const re = eval(m[1]); let clean = 0;
  pages.forEach(f => { if (fs.readFileSync(path.join(out, f), 'utf8').replace(re, '') === fs.readFileSync(path.join(ROOT, f), 'utf8')) clean++; });
  ok(clean === pages.length, 'downloads cleaned by that pattern match the repository byte for byte (' + clean + '/' + pages.length + ')'); }
// running again changes nothing
const h1 = hash(out); const again = A.addTo(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), SNIPPET, [HOSTS], 'index.html');
ok(again === fs.readFileSync(path.join(out, 'index.html'), 'utf8'), 'adding twice leaves one copy');

// 5. on Cloudflare: edits in place, in the build's own checkout (here, a copy of the repository)
const cf = tmp(); fs.cpSync(ROOT, cf, { recursive: true, filter: s => !/[\\/](\.git|node_modules)$/.test(s) });
r = run([], { ANALYTICS_SNIPPET: SNIPPET, ANALYTICS_HOSTS: HOSTS, CF_PAGES: '1' }, cf);
ok(r.status === 0 && fs.readFileSync(path.join(cf, 'sims/radio-waves.html'), 'utf8').includes('pa-TEST123.js'), 'on Cloudflare Pages (CF_PAGES=1): edits the build\'s pages in place');
const wk = tmp(); fs.cpSync(ROOT, wk, { recursive: true, filter: s => !/[\\/](\.git|node_modules)$/.test(s) });
r = spawnSync('npm', ['run', 'build', '--silent'], { cwd: wk, env: { PATH: process.env.PATH, HOME: os.tmpdir(), ANALYTICS_SNIPPET: SNIPPET, ANALYTICS_HOSTS: HOSTS, WORKERS_CI: '1' }, encoding: 'utf8' });
ok(r.status === 0 && fs.readFileSync(path.join(wk, 'sims/radio-waves.html'), 'utf8').includes('pa-TEST123.js'), 'on Cloudflare Workers (WORKERS_CI=1), through npm run build: edits the build\'s pages in place');
const fork = tmp(); fs.cpSync(ROOT, fork, { recursive: true, filter: s => !/[\\/](\.git|node_modules)$/.test(s) });
r = run([], { CF_PAGES: '1' }, fork);
ok(r.status === 0 && hash(fork) === repoBefore, 'on Cloudflare without a snippet (a fork): builds fine, pages untouched');

ok(hash(ROOT) === repoBefore && h1 === hash(out), 'the repository itself was never touched');
console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
