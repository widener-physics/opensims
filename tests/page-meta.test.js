// The pages are in step with sims.js (run `npm run meta` to update them): every listed simulation's page has its
// title, description, link-preview tags and the site's analytics; drafts (pages not listed yet) ask search engines
// to leave them out; the home page's HTML lists every simulation, as its script draws them; and sitemap.xml and
// robots.txt match.
'use strict';
const fs = require('fs'), path = require('path');
const M = require('../tools/page-meta.js');
const ROOT = path.resolve(__dirname, '..');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// everything up to date
const res = M.check();
res.filter(r => !r.ok).forEach(r => ok(false, r.file + ': ' + r.problem));
ok(res.every(r => r.ok), 'all ' + res.length + ' files match sims.js');
res.filter(r => r.draft).forEach(r => console.log('NOTE ' + r.file + ' is not listed in sims.js, so it is treated as a draft: not in the directory or the sitemap'));

// what the files hold
const { SIMS, TOPICS } = M.manifest(), snip = M.analytics();
const pages = SIMS.map(s => ['sims/' + s.slug + '.html', s]).filter(([f]) => fs.existsSync(path.join(ROOT, f)));
let good = 0; pages.forEach(([f, s]) => { const h = read(f), head = h.slice(0, h.search(/<\/head>/i)), url = M.SITE_URL + '/' + f.replace(/\.html$/, '');
  if (h.split(M.OPEN).length === 2 && head.includes(M.CLOSE) && head.includes('<link rel="canonical" href="' + url + '">') && head.includes('<meta property="og:title" content="' + M.esc(s.pageTitle || s.title + ' simulation') + '">') && (!snip || head.includes(snip))) good++; });
ok(good === pages.length, 'every listed page (' + pages.length + ') has one block in its <head>: its address without .html, its title' + (snip ? ', and the analytics snippet' : ''));
ok(!read('TEMPLATE.html').includes(M.OPEN), 'TEMPLATE.html is left alone');
const ix = read('index.html'), C = M.cardBuilder(ix, TOPICS);
ok(ix.includes('<div class="entries" id="entries">' + SIMS.slice().sort(C.newestFirst).map(C.entry).join('') + '</div>') && SIMS.every(s => ix.includes('href="sims/' + s.slug + '.html"')), 'the home page\'s HTML lists all ' + SIMS.length + ' simulations, exactly as its script draws them');
ok(ix.includes('<link rel="canonical" href="' + M.SITE_URL + '/">') && ix.includes('<meta property="og:image" content="' + M.SITE_URL + '/share.png">'), 'the home page has its own address and the preview picture');
const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1]);
ok(locs.length === SIMS.length + 1 && locs[0] === M.SITE_URL + '/' && SIMS.every(s => locs.includes(M.SITE_URL + '/sims/' + s.slug)), 'sitemap.xml lists the home page and every simulation');
ok(read('robots.txt').includes('Sitemap: ' + M.SITE_URL + '/sitemap.xml'), 'robots.txt points to the sitemap');
const png = fs.readFileSync(path.join(ROOT, 'share.png'));
ok(png.slice(1, 4).toString() === 'PNG' && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, 'share.png is a 1200 × 630 PNG');

// the rules themselves
const s = { title: 'Rolling race', blurb: 'Hoop & disc "race".' };
ok(M.titleFor(s) === 'Rolling race simulation | ' + M.SITE_NAME && M.titleFor(Object.assign({ pageTitle: 'Moment of inertia race' }, s)) === 'Moment of inertia race | ' + M.SITE_NAME, 'title: pageTitle if given, else the title plus "simulation"; then the site\'s name');
const h = M.apply('<head><title>x</title>\n</head><body></body>', s, 'sims/rolling-race.html', '<script>x</script>');
ok(h.startsWith('<head><title>Rolling race simulation | ' + M.SITE_NAME + '</title>\n<meta name="description" content="Hoop &amp; disc &quot;race&quot;.">\n' + M.OPEN + '\n<link rel="canonical"') && h.includes('<script>x</script>\n' + M.CLOSE + '\n</head>'), 'description after the title, escaped; the block just before </head>, snippet last');
ok(M.apply(h, s, 'sims/rolling-race.html', '<script>x</script>') === h && M.apply(h, s, 'sims/rolling-race.html', '').split(M.OPEN).length === 2 && !M.apply(h, s, 'sims/rolling-race.html', '').includes('<script>'), 'running it again changes nothing; with no snippet, the old one is taken out');
const d = M.applyDraft('<head><title>x</title>\n</head>', 'sims/draft.html');
ok(d.includes('<meta name="robots" content="noindex">') && !d.includes('canonical') && M.applyDraft(d, 'sims/draft.html') === d, 'a draft: only "noindex"');
process.exit(fails ? 1 : 0);
