// The pages' titles and descriptions: every simulation listed in sims.js has its page, and the page's <title> and
// <meta name="description"> match its entry there (run `npm run meta` to update them). Pages in sims/ that aren't
// listed yet are drafts, noted but not checked.
'use strict';
const M = require('../tools/page-meta.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const res = M.check();
res.filter(r => !r.draft).forEach(r => ok(r.ok, r.file + (r.ok ? '' : ': ' + r.problem)));
res.filter(r => r.draft).forEach(r => console.log('NOTE ' + r.file + ' is not listed in sims.js, so it is treated as a draft: not in the directory, the sitemap or these checks'));
// sanity of the rule itself
const s = { title: 'Rolling race', blurb: 'Hoop & disc "race".' };
ok(M.titleFor(s) === 'Rolling race simulation | ' + M.SITE_NAME, 'title without pageTitle: the title plus "simulation"');
ok(M.titleFor(Object.assign({ pageTitle: 'Moment of inertia race' }, s)) === 'Moment of inertia race | ' + M.SITE_NAME, 'pageTitle used when given');
const h = M.apply('<head><title>x</title></head>', s, 't');
ok(h === '<head><title>Rolling race simulation | ' + M.SITE_NAME + '</title>\n<meta name="description" content="Hoop &amp; disc &quot;race&quot;."></head>', 'description added after the title, escaped');
ok(M.apply(h, s, 't') === h, 'applying twice changes nothing');
process.exit(fails ? 1 : 0);
