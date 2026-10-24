#!/usr/bin/env node
// Keeps the pages in step with sims.js. Run it after adding or changing an entry there:
//
//   npm run meta                 (node tools/page-meta.js)       update the files
//   node tools/page-meta.js --check                              report anything out of date; change nothing
//
// It writes, straight into the repository's files (there is no build step; what is here is what the site serves):
//   - each simulation's <title> (its pageTitle, or its title plus "simulation", then the site's name) and
//     <meta name="description"> (its blurb)
//   - a block at the end of each page's <head>, marked "site tags": the page's canonical address and link-preview
//     tags, and the site's analytics snippet (tools/analytics.html, copied in exactly; delete that file for none)
//   - the list of simulations into index.html, the same markup its script draws, for search engines that don't
//     run scripts
//   - sitemap.xml and robots.txt
// A page in sims/ that isn't listed in sims.js yet is a draft: its block only asks search engines to leave it out,
// and it stays off the sitemap. tests/page-meta.test.js runs the check, so anything that has drifted fails the tests.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const SITE_NAME = 'Open Physics Sims';
const SITE_URL = 'https://opensims.wu-physics.net';
const IMAGE = { file: 'share.png', w: 1200, h: 630, alt: 'Open Physics Sims: free interactive physics simulations for teaching' };
const ROOT = path.resolve(__dirname, '..');
const OPEN = '<!-- site tags: written by tools/page-meta.js from sims.js (npm run meta); edits here are replaced -->';
const CLOSE = '<!-- /site tags -->';

function manifest(root) {
  const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root || ROOT, 'sims.js'), 'utf8'), ctx);
  return { SIMS: ctx.window.SIMS || [], TOPICS: ctx.window.TOPICS || {} };
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const titleFor = s => (s.pageTitle || s.title + ' simulation') + ' | ' + SITE_NAME;
const analytics = root => { const f = path.join(root || ROOT, 'tools', 'analytics.html'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : ''; };
// the address a page is served at: Cloudflare serves sims/x.html at sims/x (and redirects the .html address there)
const pageUrl = file => file === 'index.html' ? SITE_URL + '/' : SITE_URL + '/' + file.replace(/\.html$/, '');

// ---- the pieces ----
// title and description
function setTitle(html, sim, name) {
  const t = /<title>[\s\S]*?<\/title>/i;
  if (!t.test(html)) throw new Error(name + ': no <title>');
  html = html.replace(t, '<title>' + esc(titleFor(sim)) + '</title>');
  const tag = '<meta name="description" content="' + esc(sim.blurb) + '">';
  const d = /<meta name="description"[^>]*>/i;
  return d.test(html) ? html.replace(d, tag) : html.replace(/(<title>[\s\S]*?<\/title>)/i, '$1\n' + tag);
}
// the canonical address and link-preview tags
function tags(file, title, description) {
  const url = pageUrl(file);
  return ['<link rel="canonical" href="' + esc(url) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + esc(SITE_NAME) + '">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(description) + '">',
    '<meta property="og:url" content="' + esc(url) + '">',
    '<meta property="og:image" content="' + esc(SITE_URL + '/' + IMAGE.file) + '">',
    '<meta property="og:image:width" content="' + IMAGE.w + '">', '<meta property="og:image:height" content="' + IMAGE.h + '">',
    '<meta property="og:image:alt" content="' + esc(IMAGE.alt) + '">',
    '<meta name="twitter:card" content="summary_large_image">'].join('\n');
}
// replace the page's block (or add one, just before </head>)
function setBlock(html, inner, name) {
  html = html.replace(/<!-- site tags:[\s\S]*?<!-- \/site tags -->\n/, '');
  const i = html.search(/<\/head>/i); if (i < 0) throw new Error(name + ': no </head>');
  return html.slice(0, i) + OPEN + '\n' + inner + '\n' + CLOSE + '\n' + html.slice(i);
}
const withSnippet = (inner, snip) => snip ? inner + '\n' + snip : inner;

// a listed simulation's page, as it should be
function apply(html, sim, file, snip) { html = setTitle(html, sim, file); return setBlock(html, withSnippet(tags(file, sim.pageTitle || sim.title + ' simulation', sim.blurb), snip), file); }
// a draft's page
const applyDraft = (html, file) => setBlock(html, '<meta name="robots" content="noindex">', file);

// the directory's own card builder, taken from index.html (between "---- cards" and "---- end of cards")
function cardBuilder(indexHtml, TOPICS) {
  const i = indexHtml.indexOf('// ---- cards'), j = indexHtml.indexOf('// ---- end of cards');
  if (i < 0 || j < 0) throw new Error('index.html: the "---- cards" block is missing');
  const src = indexHtml.slice(indexHtml.indexOf('\n', i) + 1, j);
  return new Function('TOPICS', src + '\nreturn cards(TOPICS);')(TOPICS);
}
// index.html with the list written in (newest first, as the page shows it before anyone searches or filters), and its block
function applyIndex(indexHtml, SIMS, TOPICS, snip) {
  const C = cardBuilder(indexHtml, TOPICS), list = SIMS.slice().sort(C.newestFirst);
  const entries = /(<div class="entries" id="entries">)[\s\S]*?(<\/div>\s*<\/section>)/;
  const status = /(<p class="status" id="status">)[^<]*(<\/p>)/;
  if (!entries.test(indexHtml) || !status.test(indexHtml)) throw new Error('index.html: no #entries / #status to write the list into');
  let html = indexHtml.replace(entries, (m, a, b) => a + list.map(C.entry).join('') + b)
    .replace(status, (m, a, b) => a + SIMS.length + ' simulation' + (SIMS.length === 1 ? '' : 's') + b);
  const desc = unesc((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  return setBlock(html, withSnippet(tags('index.html', SITE_NAME, desc), snip), 'index.html');
}
function sitemap(SIMS) {
  const urls = [pageUrl('index.html')].concat(SIMS.map(s => pageUrl('sims/' + s.slug + '.html')));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + esc(u) + '</loc></url>').join('\n') + '\n</urlset>\n';
}
const robots = () => 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n';

// ---- every file, as it is and as it should be ----
function plan(root) {
  root = root || ROOT;
  const { SIMS, TOPICS } = manifest(root), snip = analytics(root), out = [];
  const read = f => { const p = path.join(root, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
  SIMS.forEach(s => { const f = 'sims/' + s.slug + '.html', html = read(f);
    if (html === null) { out.push({ file: f, problem: 'listed in sims.js but there is no ' + f }); return; }
    try { out.push({ file: f, html, want: apply(html, s, f, snip) }); } catch (e) { out.push({ file: f, problem: e.message }); } });
  fs.readdirSync(path.join(root, 'sims')).filter(f => f.endsWith('.html') && !SIMS.some(s => s.slug + '.html' === f)).forEach(f => {
    const file = 'sims/' + f, html = read(file); out.push({ file, html, want: applyDraft(html, file), draft: true }); });
  const ix = read('index.html'); out.push({ file: 'index.html', html: ix, want: applyIndex(ix, SIMS, TOPICS, snip) });
  out.push({ file: 'sitemap.xml', html: read('sitemap.xml'), want: sitemap(SIMS) });
  out.push({ file: 'robots.txt', html: read('robots.txt'), want: robots() });
  return out;
}
// what's out of date: { file, ok, draft, problem }
function check(root) {
  return plan(root).map(p => p.problem ? { file: p.file, ok: false, problem: p.problem }
    : { file: p.file, ok: p.html === p.want, draft: !!p.draft, problem: p.html === p.want ? '' : 'out of date with sims.js (run npm run meta)' });
}
function write(root) {
  root = root || ROOT; let n = 0;
  plan(root).forEach(p => { if (p.problem) throw new Error(p.problem); if (p.html !== p.want) { fs.writeFileSync(path.join(root, p.file), p.want); n++; } });
  return n;
}

if (require.main === module) {
  if (process.argv.includes('--check')) {
    const res = check(), bad = res.filter(r => !r.ok);
    res.filter(r => r.draft).forEach(r => console.log(r.file + ': not listed in sims.js, so treated as a draft'));
    bad.forEach(r => console.log(r.file + ': ' + r.problem));
    console.log(bad.length ? bad.length + ' file(s) out of date' : 'all pages match sims.js');
    process.exit(bad.length ? 1 : 0);
  }
  const n = write(); console.log('pages, sitemap and robots.txt: ' + n + ' file(s) updated');
}
module.exports = { SITE_NAME, SITE_URL, IMAGE, OPEN, CLOSE, manifest, esc, titleFor, analytics, pageUrl, setTitle, tags, setBlock, apply, applyDraft, cardBuilder, applyIndex, sitemap, robots, check, write };
