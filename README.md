# Open Physics Sims

A library of free, single-file physics simulations for teaching. Each simulation is one HTML file with no dependencies, so it runs from a web server, from a course page, or straight off a USB stick. Licensed under the GNU GPL v3.

## Layout

```
index.html        the directory page (search + topic filters)
sims.js           the manifest: one entry per simulation
sims/             the simulations, one .html each
TEMPLATE.html     a complete starter simulation to copy from
PROMPT.md         how to draft a simulation with an AI model, with the prompt to use
STYLE_GUIDE.md    what a simulation should look and behave like, and why
style.json        the same rules in machine-readable form, for AI-assisted authoring
tests/            physics tests, run against the sims as they ship, and a check that the pages match sims.js
package.json      names the scripts: npm test, npm run meta (no dependencies)
tools/            page-meta.js (npm run meta: keeps the pages in step with sims.js); analytics.html (the site's analytics
                  snippet); share-image.html (source of share.png)
sitemap.xml       written by npm run meta, with robots.txt
share.png         the picture shown when a link to the site is shared
LICENSE           GPL v3
README.md
```

## Making a simulation

Read `STYLE_GUIDE.md` first; it is short and it is what reviewers check against. Then copy `TEMPLATE.html`, which already has the shared CSS, the page structure (home link, title, lede, canvas, transport, readouts, controls, notes), the wide-screen app layout, the phone layout, and a small worked example of an analytic model.

If you are using an AI model to draft the code, see `PROMPT.md`: it has the prompt to use, the two files to attach (`style.json` and `TEMPLATE.html`), a worked example of a physics description, and what to check before the result goes into the library. You remain responsible for verifying the physics; the file header says who did, and that disclosure stays in the file.

## Testing the physics

`node tests/run.js` checks each tested simulation's physics against independent calculations: numerical
integrations, transfer matrices, Lorentz transformations, published tables and measurements. It needs only
Node.js, and it loads each model straight out of the page in `sims/`, so it tests exactly what ships. The
tests also run on GitHub on every push. See `tests/README.md` for what each one checks and how to add tests
for a new simulation.

## Adding it to the library

1. Put the file in `sims/`, named with a URL-friendly slug: `sims/rolling-race.html`.
2. Add an entry to `sims.js`:

```js
{
  slug: 'rolling-race',                  // must match the file name
  title: 'Rolling race',
  topic: 'rotation',                     // one of the keys in TOPICS at the top of sims.js
  tags: ['moment of inertia', 'energy'],
  blurb: 'Hoop, disc and sphere down the same ramp, with kinetic energy split into translational and rotational.',
  level: 'intro',                        // 'intro' or 'intermediate'
  added: '2026-10-01',
  status: 'ready',                       // or 'beta' to show a badge
  pageTitle: 'Rolling race simulation: moment of inertia'   // optional; see below
}
```

3. Run `npm run meta`. It writes the page's `<title>` and `<meta name="description">` from this entry: the
   description is the blurb, and the title is `pageTitle` (or the title plus "simulation") followed by the site's
   name. Search engines show these, so give `pageTitle` the words a teacher would type: "Brachistochrone
   simulation: the fastest slide" rather than just "The fastest slide". It also adds the page to the home page's
   list and the sitemap, with its link-preview tags and the analytics snippet (see Publishing). The tests fail if a
   page has drifted from its entry.
4. Optionally add `thumb: 'thumbs/rolling-race.png'` for a real screenshot (16:9). Without it the card gets a schematic drawn from the topic.
5. Run through the checklist at the end of `STYLE_GUIDE.md`, then open a pull request.

To add a topic, add a key to `TOPICS` in `sims.js` with a display name and a color.

## Publishing

The site is static and has no build step: Cloudflare Pages serves the files in this repository exactly as they
are, and every push to `main` redeploys. The Pages project's build settings: framework preset *None*, build
command left blank, build output directory `/`.

What search engines and link previews need is written into the files by `npm run meta` (tools/page-meta.js), from
`sims.js`: each page's title, description, canonical address and link-preview tags (with `share.png`), the list
of simulations in the home page's HTML (for search engines that don't run scripts), `sitemap.xml` and
`robots.txt`. Run it after changing `sims.js`; the tests fail if a page has fallen out of step. The site's address
is set at the top of `tools/page-meta.js`. A page in `sims/` that isn't listed in `sims.js` yet is a draft: it
gets a "noindex" tag instead, stays off the sitemap, and doesn't appear in the directory.

### Analytics

`tools/analytics.html` holds the site's Plausible snippet, and `npm run meta` copies it into the head of
`index.html` and every page in `sims/` (not `TEMPLATE.html`). Plausible sets no cookies, and the pages work the
same without it. A downloaded copy carries the snippet too: opened from a disk with no network it does nothing.
To keep copies that other people host out of the counts, add `opensims.wu-physics.net` under *Shields → Hostnames*
in the site's Plausible settings, so only visits to this site are recorded. To turn analytics off, delete
`tools/analytics.html` and run `npm run meta`.

## License and contributions

Everything in this repository is released under the GNU General Public License, version 3 or later; see `LICENSE`. You may use, copy, modify and redistribute it, including commercially, provided derivative work is released under the same license. Each simulation carries the license notice in its header so it stays with the file when downloaded.

By contributing you agree that your contribution is licensed under the same terms. The project name is not part of the license: forks are welcome, but please give yours a different name so people can tell them apart.

## Credit

Several simulations replace or are inspired by the Java simulations from the [PhET Interactive Simulations](https://phet.colorado.edu) project at the University of Colorado Boulder. They are independent implementations, not ports. Where a simulation draws on someone else's idea, the credit is in that simulation's notes.
