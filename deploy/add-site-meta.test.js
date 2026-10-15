// Checks for deploy/add-site-meta.js: the repository is never touched; the home page gets the same list its script
// draws; with SITE_URL, every page gets one block of canonical and link-preview tags, and the sitemap lists every
// page at the address it is served from; and after the whole deploy (this step plus the analytics step), the
// download button's pattern gives back every page byte for byte.   Run: node deploy/add-site-meta.test.js
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), { spawnSync } = require('child_process');
const S = require('./add-site-meta.js'), META = require('../tools/page-meta.js');
const ROOT = path.resolve(__dirname, '..');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const run = (args, env, cwd) => spawnSync(process.execPath, [path.join(cwd || ROOT, 'deploy/add-site-meta.js')].concat(args), { env: Object.assign({ PATH: process.env.PATH }, env), encoding: 'utf8' });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensims-meta-'));
const copy = () => { const d = tmp(); fs.cpSync(ROOT, d, { recursive: true, filter: s => !/[\\/](\.git|node_modules)$/.test(s) }); return d; };
const files = dir => ['index.html'].concat(fs.readdirSync(path.join(dir, 'sims')).filter(f => f.endsWith('.html')).sort().map(f => 'sims/' + f));
const hash = dir => files(dir).map(f => f + crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, f))).digest('hex')).join();
const { SIMS, TOPICS } = META.manifest();
const SITE = 'https://opensims.wu-physics.net';
const before = hash(ROOT);

// refusals
let r = run([], { SITE_URL: SITE });
ok(r.status === 1 && /deploy build/.test(r.stderr), 'outside Cloudflare without --out: refuses to edit the repository');
r = run(['--out', tmp()], { SITE_URL: 'opensims.wu-physics.net' });
ok(r.status === 1 && /SITE_URL should be/.test(r.stderr), 'SITE_URL without https://: stops with a message');
ok(S.siteUrl({ SITE_URL: SITE + '/' }) === SITE, 'a trailing slash on SITE_URL is dropped');

// without SITE_URL: only the list on the home page
let out = tmp(); r = run(['--out', out], {});
const C = S.cardBuilder(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), TOPICS);
const want = SIMS.slice().sort(C.newestFirst).map(C.entry).join('');
let ix = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
ok(r.status === 0 && ix.includes('<div class="entries" id="entries">' + want + '</div>'), 'no SITE_URL: the home page gets the list, exactly as its script draws it (' + SIMS.length + ' entries)');
ok(ix.includes('<p class="status" id="status">' + SIMS.length + ' simulations</p>'), 'and the count');
ok(SIMS.every(s => ix.includes('href="sims/' + s.slug + '.html"')), 'every simulation linked from the home page\'s HTML');
ok(!fs.existsSync(path.join(out, 'sitemap.xml')) && !ix.includes('site-meta:') && files(out).slice(1).every(f => fs.readFileSync(path.join(out, f), 'utf8') === fs.readFileSync(path.join(ROOT, f), 'utf8')), 'and nothing else: no sitemap, no tags, simulations untouched');
ok(S.prerender(ix, SIMS, TOPICS) === ix, 'writing the list twice changes nothing');

// with SITE_URL
out = tmp(); r = run(['--out', out], { SITE_URL: SITE });
ok(r.status === 0, 'with SITE_URL: runs');
let one = 0, inHead = 0, canon = 0, titles = 0;
files(out).forEach(f => {
  const h = fs.readFileSync(path.join(out, f), 'utf8'), url = f === 'index.html' ? SITE + '/' : SITE + '/' + f.replace(/\.html$/, '');
  if (h.split('<!-- site-meta:').length === 2) one++;
  if (h.indexOf('<!-- /site-meta -->') < h.search(/<\/head>/i)) inHead++;
  if (h.includes('<link rel="canonical" href="' + url + '">') && h.includes('<meta property="og:url" content="' + url + '">')) canon++;
  const s = SIMS.find(x => 'sims/' + x.slug + '.html' === f);
  if (!s || (h.includes('<meta property="og:title" content="' + META.esc(s.pageTitle || s.title + ' simulation') + '">') && h.includes('<meta property="og:description" content="' + META.esc(s.blurb) + '">'))) titles++;
});
const n = files(out).length;
ok(one === n && inHead === n, 'every page (' + n + ') has the block exactly once, in <head>');
ok(canon === n, 'canonical address and og:url: the site\'s address, without .html (what Cloudflare serves)');
ok(titles === n, 'link-preview title and description match sims.js');
ok(fs.readFileSync(path.join(out, 'index.html'), 'utf8').includes('<meta property="og:image" content="' + SITE + '/share.png">'), 'preview picture at an absolute address');
const sm = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8'), locs = [...sm.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1]);
ok(locs.length === SIMS.length + 1 && locs[0] === SITE + '/' && SIMS.every(s => locs.includes(SITE + '/sims/' + s.slug)), 'sitemap.xml lists the home page and all ' + SIMS.length + ' simulations');
ok(fs.readFileSync(path.join(out, 'robots.txt'), 'utf8').includes('Sitemap: ' + SITE + '/sitemap.xml'), 'robots.txt points to the sitemap');
// the picture is a 1200 x 630 PNG
const png = fs.readFileSync(path.join(ROOT, 'share.png'));
ok(png.slice(1, 4).toString() === 'PNG' && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, 'share.png is a 1200 × 630 PNG');

// the whole deploy, as Cloudflare runs it, then the download button's clean-up
const cf = copy();
const snippet = '<script async src="https://plausible.io/js/pa-TEST.js"></script>';
r = spawnSync('npm', ['run', 'build', '--silent'], { cwd: cf, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: os.tmpdir(), CF_PAGES: '1', SITE_URL: SITE, ANALYTICS_SNIPPET: snippet, ANALYTICS_HOSTS: 'opensims.wu-physics.net' } });
const rh = fs.readFileSync(path.join(cf, 'sims/radio-waves.html'), 'utf8');
ok(r.status === 0 && rh.includes('site-meta:') && rh.includes('pa-TEST.js'), 'npm run build on Cloudflare: both steps applied');
const m = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/html\.replace\((\/<!-- site-.*?\/g?)\s*,\s*''\)/);
ok(!!m, 'index.html has the download button\'s clean-up pattern');
if (m) { const re = eval(m[1]); let clean = 0;
  files(cf).slice(1).forEach(f => { if (fs.readFileSync(path.join(cf, f), 'utf8').replace(re, '') === fs.readFileSync(path.join(ROOT, f), 'utf8')) clean++; });
  ok(clean === n - 1, 'downloads after the whole deploy match the repository byte for byte (' + clean + '/' + (n - 1) + ')'); }

ok(hash(ROOT) === before, 'the repository itself was never touched');
console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
