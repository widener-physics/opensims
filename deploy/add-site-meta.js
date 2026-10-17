#!/usr/bin/env node
// Prepares the pages for search engines and link previews when the site is deployed.
//
// Always (it needs nothing from you):
//   - writes the list of simulations into index.html, the same markup the page's script draws, so search engines
//     that don't run scripts still see every simulation and its description, and follow the links.
//
// If SITE_URL is set (the address the site is served from, e.g. https://opensims.wu-physics.net):
//   - adds to every page a canonical address (so search engines treat that address as the real one, not a
//     pages.dev or other copy) and link-preview tags (title, description, picture) for email, chat and course sites
//   - writes sitemap.xml, listing every page, and robots.txt pointing to it
//
// Nothing here changes the repository: like deploy/add-analytics.js, it edits the build's own copy on Cloudflare
// (Pages or Workers), or a copy made with --out DIR. The tags go in a block marked <!-- site-meta: ... --> that the
// directory's "Download file" button cuts back out, so a downloaded simulation is still the repository's file.
//
//   npm run build  (runs this, then add-analytics.js)          on Cloudflare
//   SITE_URL=https://example.org node deploy/add-site-meta.js --out DIR     anywhere, to see the result
'use strict';
const fs = require('fs'), path = require('path');
const META = require('../tools/page-meta.js');

const ROOT = path.resolve(__dirname, '..');
const MARK = 'site-meta';
const IMAGE = { file: 'share.png', w: 1200, h: 630, alt: 'Open Physics Sims: free interactive physics simulations for teaching' };
const esc = META.esc;

// the site's address, checked: https://host[/path], no trailing slash
function siteUrl(env) {
  const u = (env.SITE_URL || '').trim().replace(/\/+$/, '');
  if (!u) return null;
  if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?(\/[^\s?#]*)?$/i.test(u)) throw new Error('SITE_URL should be the site\'s address, like https://opensims.wu-physics.net (got "' + env.SITE_URL + '")');
  return u;
}
// the address a page is served at. Cloudflare (and GitHub Pages, Netlify) serve sims/x.html at sims/x, and
// redirect the .html address there, so that is the one to name.
const pageUrl = (site, file) => file === 'index.html' ? site + '/' : site + '/' + file.replace(/\.html$/, '');

// the block of tags for one page
function block(site, file, title, description) {
  const url = pageUrl(site, file), img = site + '/' + IMAGE.file;
  return '<!-- ' + MARK + ': added when this copy of the site was deployed, for search engines and link previews. You can delete it. -->\n' +
    '<link rel="canonical" href="' + esc(url) + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="' + esc(META.SITE_NAME) + '">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(description) + '">\n' +
    '<meta property="og:url" content="' + esc(url) + '">\n' +
    '<meta property="og:image" content="' + esc(img) + '">\n' +
    '<meta property="og:image:width" content="' + IMAGE.w + '">\n<meta property="og:image:height" content="' + IMAGE.h + '">\n' +
    '<meta property="og:image:alt" content="' + esc(IMAGE.alt) + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<!-- /' + MARK + ' -->\n';
}
const draftBlock = () => '<!-- ' + MARK + ': added when this copy of the site was deployed. This page is not listed in the directory yet, so search engines are asked to leave it out. You can delete it. -->\n' +
  '<meta name="robots" content="noindex">\n<!-- /' + MARK + ' -->\n';
function addBlock(html, b, name) {
  if (html.includes('<!-- ' + MARK + ':')) return html;
  const i = html.search(/<\/head>/i);
  if (i < 0) throw new Error(name + ': no </head>');
  return html.slice(0, i) + b + html.slice(i);
}

// the directory's own card builder, taken from index.html (between "---- cards" and "---- end of cards")
function cardBuilder(indexHtml, TOPICS) {
  const i = indexHtml.indexOf('// ---- cards'), j = indexHtml.indexOf('// ---- end of cards');
  if (i < 0 || j < 0) throw new Error('index.html: the "---- cards" block is missing');
  const src = indexHtml.slice(indexHtml.indexOf('\n', i) + 1, j);
  return new Function('TOPICS', src + '\nreturn cards(TOPICS);')(TOPICS);
}
// index.html with the list written in (newest first, as the page shows it before anyone searches or filters)
function prerender(indexHtml, SIMS, TOPICS) {
  const C = cardBuilder(indexHtml, TOPICS), list = SIMS.slice().sort(C.newestFirst);
  const entries = /(<div class="entries" id="entries">)[\s\S]*?(<\/div>\s*<\/section>)/;
  const status = /(<p class="status" id="status">)[^<]*(<\/p>)/;
  if (!entries.test(indexHtml) || !status.test(indexHtml)) throw new Error('index.html: no #entries / #status to write the list into');
  return indexHtml.replace(entries, (m, a, b) => a + list.map(C.entry).join('') + b)
    .replace(status, (m, a, b) => a + SIMS.length + ' simulation' + (SIMS.length === 1 ? '' : 's') + b);
}

function sitemap(site, SIMS) {
  const urls = [pageUrl(site, 'index.html')].concat(SIMS.map(s => pageUrl(site, 'sims/' + s.slug + '.html')));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + esc(u) + '</loc></url>').join('\n') + '\n</urlset>\n';
}
const robots = site => 'User-agent: *\nAllow: /\n\nSitemap: ' + site + '/sitemap.xml\n';

function run(argv, env) {
  const k = argv.indexOf('--out'), out = k >= 0 ? path.resolve(argv[k + 1] || '') : null;
  if (k >= 0 && !argv[k + 1]) throw new Error('--out needs a directory');
  const site = siteUrl(env);
  // Cloudflare sets CF_PAGES in a Pages build and WORKERS_CI in a Workers build; on another host's build service,
  // set DEPLOY_BUILD=1 there
  if (!out && !env.CF_PAGES && !env.WORKERS_CI && !env.DEPLOY_BUILD) throw new Error('this edits the pages in place, so it only runs in a deploy build (Cloudflare, or DEPLOY_BUILD=1); to try it here, use --out DIR');
  if (out) {
    if (out === ROOT || out.startsWith(ROOT + path.sep)) throw new Error('--out must be outside the repository');
    fs.rmSync(out, { recursive: true, force: true });
    fs.cpSync(ROOT, out, { recursive: true, filter: s => !/[\\/](\.git|node_modules)$/.test(s) });
  }
  const dir = out || ROOT, { SIMS, TOPICS } = META.manifest(dir);
  const ix = path.join(dir, 'index.html');
  let index = prerender(fs.readFileSync(ix, 'utf8'), SIMS, TOPICS);
  if (!site) {
    fs.writeFileSync(ix, index);
    console.log('site-meta: list of ' + SIMS.length + ' simulations written into index.html; SITE_URL not set, so no sitemap or link previews');
    return;
  }
  const desc = (index.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  index = addBlock(index, block(site, 'index.html', META.SITE_NAME, unesc(desc)), 'index.html');
  fs.writeFileSync(ix, index);
  SIMS.forEach(s => {
    const f = 'sims/' + s.slug + '.html', p = path.join(dir, f); if (!fs.existsSync(p)) return;
    fs.writeFileSync(p, addBlock(fs.readFileSync(p, 'utf8'), block(site, f, s.pageTitle || s.title + ' simulation', s.blurb), f));
  });
  // a page in sims/ not listed in sims.js is a draft: ask search engines to leave it out until it is listed
  const drafts = fs.readdirSync(path.join(dir, 'sims')).filter(f => f.endsWith('.html') && !SIMS.some(s => s.slug + '.html' === f));
  drafts.forEach(f => { const p = path.join(dir, 'sims', f);
    fs.writeFileSync(p, addBlock(fs.readFileSync(p, 'utf8'), draftBlock(), 'sims/' + f)); });
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemap(site, SIMS));
  fs.writeFileSync(path.join(dir, 'robots.txt'), robots(site));
  console.log('site-meta: list written into index.html; canonical addresses and link previews on ' + (SIMS.length + 1) + ' pages' + (drafts.length ? '; ' + drafts.length + ' unlisted draft(s) marked noindex' : '') + '; sitemap.xml and robots.txt for ' + site + (out ? ' (in ' + out + ')' : ''));
}

if (require.main === module) {
  try { run(process.argv.slice(2), process.env); }
  catch (e) { console.error('site-meta: ' + e.message); process.exit(1); }
}
module.exports = { MARK, IMAGE, siteUrl, pageUrl, block, draftBlock, addBlock, cardBuilder, prerender, sitemap, robots, run };
