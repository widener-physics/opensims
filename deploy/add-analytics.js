#!/usr/bin/env node
// Adds a site owner's analytics snippet to the pages when the site is deployed, and does nothing otherwise.
//
// The repository itself never contains a tracker: a fork, a clone, or a file downloaded from GitHub is clean.
// The snippet is added only to the copy that a hosting service builds, and only if the owner of that deployment
// has given it one, through two environment variables:
//
//   ANALYTICS_SNIPPET   the HTML your analytics service tells you to put in <head> (Plausible, Umami,
//                       GoatCounter, ...), pasted whole
//   ANALYTICS_HOSTS     the host name(s) your site is served from, comma-separated,
//                       e.g. opensims.wu-physics.net
//
// The snippet is added inert, inside a <template>, with a three-line guard that switches it on only when the page
// is being viewed on one of ANALYTICS_HOSTS. So a page someone downloads from the live site and opens from a USB
// stick, or hosts on their own course site, sends nothing to anyone.
//
// Usage
//   npm run build  (or node deploy/add-analytics.js)
//                                             edits the pages in place; runs only in a Cloudflare build, Pages or
//                                             Workers (where the edit happens in the build's own copy, never in
//                                             the repository)
//   node deploy/add-analytics.js --out DIR    copies the site to DIR and edits the copy (safe anywhere; for
//                                             checking the result, or for other hosting services)
//
// Pages edited: index.html and every sims/*.html. TEMPLATE.html is left alone, since contributors copy it.
//
// The block runs from "<!-- site-analytics:" to "<!-- /site-analytics -->". The directory page's "Download file"
// button cuts it back out, so a downloaded simulation is byte-for-byte the file in the repository.
'use strict';
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MARK = 'site-analytics';

// the block that goes before </head>
function block(snippet, hosts) {
  return '<!-- ' + MARK + ': added when this copy of the site was deployed, and active only on ' + hosts.join(', ') +
    '. Anywhere else (a downloaded copy, another server) it does nothing. You can delete it. -->\n' +
    '<template id="' + MARK + '">\n' + snippet.trim() + '\n</template>\n' +
    '<script>(function () { var hosts = ' + JSON.stringify(hosts) + ';\n' +
    '  if (hosts.indexOf(location.hostname) < 0) return;\n' +
    '  var t = document.getElementById(\'' + MARK + '\');\n' +
    '  Array.prototype.forEach.call(t.content.childNodes, function (n) {\n' +
    '    // a script copied out of a template does not run, so remake each one\n' +
    '    if (n.nodeName === \'SCRIPT\') { var s = document.createElement(\'script\'); Array.prototype.forEach.call(n.attributes, function (a) { s.setAttribute(a.name, a.value); }); s.text = n.text; document.head.appendChild(s); }\n' +
    '    else document.head.appendChild(document.importNode(n, true)); }); })();</script>\n' +
    '<!-- /' + MARK + ' -->\n';
}

// add the block to one page's HTML; returns the new HTML (unchanged if it already has one)
function addTo(html, snippet, hosts, name) {
  if (html.includes('id="' + MARK + '"')) return html;
  const i = html.search(/<\/head>/i);
  if (i < 0) throw new Error(name + ': no </head> to put the analytics snippet before');
  return html.slice(0, i) + block(snippet, hosts) + html.slice(i);
}

// read and check the settings; returns null when there is nothing to do
function settings(env) {
  const snippet = (env.ANALYTICS_SNIPPET || '').trim();
  if (!snippet) return null;
  if (!/<script[\s>]/i.test(snippet)) throw new Error('ANALYTICS_SNIPPET should be the HTML snippet itself, starting with <script ...> (or an HTML comment); paste the whole snippet your analytics service gives you');
  if (/<\/?template[\s>]/i.test(snippet)) throw new Error('ANALYTICS_SNIPPET may not contain a <template> tag');
  const hosts = (env.ANALYTICS_HOSTS || '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
  if (!hosts.length) throw new Error('ANALYTICS_SNIPPET is set but ANALYTICS_HOSTS is not: set it to the host name the site is served from, e.g. opensims.wu-physics.net');
  hosts.forEach(h => { if (!/^[a-z0-9.-]+$/.test(h)) throw new Error('ANALYTICS_HOSTS: "' + h + '" is not a host name (no https://, no slashes)'); });
  return { snippet, hosts };
}

const pages = dir => ['index.html'].concat(fs.readdirSync(path.join(dir, 'sims')).filter(f => f.endsWith('.html')).sort().map(f => 'sims/' + f))
  .filter(f => fs.existsSync(path.join(dir, f)));

function run(argv, env) {
  const k = argv.indexOf('--out'), out = k >= 0 ? path.resolve(argv[k + 1] || '') : null;
  if (k >= 0 && !argv[k + 1]) throw new Error('--out needs a directory');
  const cfg = settings(env);
  if (!cfg && !out) { console.log('analytics: ANALYTICS_SNIPPET not set; pages left as they are'); return 0; }
  // Cloudflare sets CF_PAGES in a Pages build and WORKERS_CI in a Workers build
  if (!out && !env.CF_PAGES && !env.WORKERS_CI) throw new Error('this edits the pages in place, so it only runs in a Cloudflare build; to try it here, use --out DIR');
  if (out) {
    if (out === ROOT || out.startsWith(ROOT + path.sep)) throw new Error('--out must be outside the repository');
    fs.rmSync(out, { recursive: true, force: true });
    fs.cpSync(ROOT, out, { recursive: true, filter: s => !/[\\/](\.git|node_modules)$/.test(s) });
  }
  const dir = out || ROOT;
  if (!cfg) { console.log('analytics: ANALYTICS_SNIPPET not set; pages left as they are'); return 0; }
  let n = 0;
  pages(dir).forEach(f => { const p = path.join(dir, f), html = fs.readFileSync(p, 'utf8'), next = addTo(html, cfg.snippet, cfg.hosts, f); if (next !== html) { fs.writeFileSync(p, next); n++; } });
  console.log('analytics: snippet added to ' + n + ' pages, active only on ' + cfg.hosts.join(', ') + (out ? ' (in ' + out + ')' : ''));
  return n;
}

if (require.main === module) {
  try { run(process.argv.slice(2), process.env); }
  catch (e) { console.error('analytics: ' + e.message); process.exit(1); }
}
module.exports = { addTo, settings, run, block, pages, MARK };
