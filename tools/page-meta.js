#!/usr/bin/env node
// Writes each simulation's <title> and <meta name="description"> from its entry in sims.js, so what search engines
// show matches the directory. The <title> is the entry's pageTitle (or its title plus "simulation"), then the
// site's name; the description is the blurb.
//
//   npm run meta                 (node tools/page-meta.js)           update the pages in sims/
//   node tools/page-meta.js --check                                  report pages that are out of date; change nothing
//
// tests/page-meta.test.js runs the check, so a page that has drifted from sims.js fails the tests. A page in sims/
// that isn't listed in sims.js yet is treated as a draft and left alone.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const SITE_NAME = 'Open Physics Sims';
const ROOT = path.resolve(__dirname, '..');

function manifest(root) {
  const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root || ROOT, 'sims.js'), 'utf8'), ctx);
  return { SIMS: ctx.window.SIMS || [], TOPICS: ctx.window.TOPICS || {} };
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const titleFor = s => (s.pageTitle || s.title + ' simulation') + ' | ' + SITE_NAME;

// the page with its title and description set; throws if the page has no <title> to work from
function apply(html, sim, name) {
  const t = /<title>[\s\S]*?<\/title>/i;
  if (!t.test(html)) throw new Error(name + ': no <title>');
  html = html.replace(t, '<title>' + esc(titleFor(sim)) + '</title>');
  const tag = '<meta name="description" content="' + esc(sim.blurb) + '">';
  const d = /<meta name="description"[^>]*>/i;
  return d.test(html) ? html.replace(d, tag) : html.replace(/(<title>[\s\S]*?<\/title>)/i, '$1\n' + tag);
}

// every page compared with what it should be: { slug, file, ok, problem }
function check(root) {
  root = root || ROOT;
  const { SIMS } = manifest(root), out = [];
  const files = fs.readdirSync(path.join(root, 'sims')).filter(f => f.endsWith('.html'));
  SIMS.forEach(s => {
    const file = 'sims/' + s.slug + '.html', p = path.join(root, file);
    if (!fs.existsSync(p)) { out.push({ slug: s.slug, file, ok: false, problem: 'listed in sims.js but there is no ' + file }); return; }
    const html = fs.readFileSync(p, 'utf8');
    let want; try { want = apply(html, s, file); } catch (e) { out.push({ slug: s.slug, file, ok: false, problem: e.message }); return; }
    out.push({ slug: s.slug, file, ok: want === html, problem: want === html ? '' : 'title or description differs from sims.js (run npm run meta)' });
  });
  // a page in sims/ that isn't listed yet is a draft: it isn't in the directory, and isn't checked here
  files.filter(f => !SIMS.some(s => s.slug + '.html' === f)).forEach(f => out.push({ slug: f, file: 'sims/' + f, ok: true, draft: true, problem: '' }));
  return out;
}

function write(root) {
  root = root || ROOT;
  const { SIMS } = manifest(root); let n = 0;
  SIMS.forEach(s => { const p = path.join(root, 'sims', s.slug + '.html'); if (!fs.existsSync(p)) return;
    const html = fs.readFileSync(p, 'utf8'), next = apply(html, s, s.slug); if (next !== html) { fs.writeFileSync(p, next); n++; } });
  return n;
}

if (require.main === module) {
  if (process.argv.includes('--check')) {
    const res = check(), bad = res.filter(r => !r.ok);
    res.filter(r => r.draft).forEach(r => console.log(r.file + ': not listed in sims.js, so treated as a draft (left alone)'));
    bad.forEach(r => console.log(r.file + ': ' + r.problem));
    console.log(bad.length ? bad.length + ' page(s) out of date' : 'all pages match sims.js');
    process.exit(bad.length ? 1 : 0);
  }
  const n = write(); console.log('page titles and descriptions: ' + n + ' page(s) updated');
}
module.exports = { SITE_NAME, manifest, esc, titleFor, apply, check, write };
