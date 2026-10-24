# Open Physics Sims

A library of free, single-file physics simulations for teaching. Each simulation is one HTML file with no dependencies, so it runs from a web server, from a course page, or straight off a USB stick. Licensed under the GNU GPL v3.

**Browse and use them at [opensims.wu-physics.net](https://opensims.wu-physics.net).**

## Using the simulations

- **Link to them.** Every simulation has its own address, such as
  `https://opensims.wu-physics.net/sims/fourier`, to put in a syllabus, a slide or a course page.
- **Download them.** Each card on the home page has a *Download file* button. The file is the whole simulation:
  open it in a browser and it works with no internet connection, no installation and no account, from a laptop,
  a classroom computer or a USB stick.
- **Put them on your course site.** Upload the file to Canvas, Moodle, Blackboard or any web server, as you would
  any HTML file. You're free to do so, and to change it; keep the license notice at the top of the file.
- They work in a current web browser on a computer, tablet or phone.

## Problems and requests

Found a physics error, an explanation that confuses students, or something that doesn't work (on a phone, say)?
Please [open an issue](https://github.com/widener-physics/opensims/issues): name the simulation and the tab, and
say what you saw and what you expected. A screenshot helps.

Want a simulation that isn't here? Open an issue describing the demonstration you have in mind.

## Contributing

### What the library is looking for

Classroom demonstrations: simulations a teacher runs in front of a class, or students explore, by changing a
setting and watching what happens. Not labs where students record and analyze data. The library favors topics
that [PhET](https://phet.colorado.edu) doesn't cover, or still offers only in its old Java versions. If you're
planning a new simulation, open an issue first to check that it fits.

### What you need

Only [Node.js](https://nodejs.org) 18 or later, to run the tests; there are no packages to install. To try a
simulation, or the home page, open its file straight from your disk in a browser: no server needed. Before
opening a pull request, run `npm test`. GitHub runs the same tests on every push and pull request.

### Layout

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

### Making a simulation

Read `STYLE_GUIDE.md` first; it is short and it is what reviewers check against. Then copy `TEMPLATE.html`, which already has the shared CSS, the page structure (home link, title, lede, canvas, transport, readouts, controls, notes), the wide-screen app layout, the phone layout, and a small worked example of an analytic model.

If you are using an AI model to draft the code, see `PROMPT.md`: it has the prompt to use, the two files to attach (`style.json` and `TEMPLATE.html`), a worked example of a physics description, and what to check before the result goes into the library. You remain responsible for verifying the physics; the file header says who did, and that disclosure stays in the file.

### Testing the physics

`node tests/run.js` checks each tested simulation's physics against independent calculations: numerical
integrations, transfer matrices, Lorentz transformations, published tables and measurements. It needs only
Node.js, and it loads each model straight out of the page in `sims/`, so it tests exactly what ships. The
tests also run on GitHub on every push. See `tests/README.md` for what each one checks and how to add tests
for a new simulation.

### Adding it to the library

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
   list and the sitemap. The tests fail if a page has drifted from its entry.
4. Optionally add `thumb: 'thumbs/rolling-race.png'` for a real screenshot (16:9). Without it the card gets a schematic drawn from the topic.
5. Run through the checklist at the end of `STYLE_GUIDE.md`, then open a pull request.

To add a topic, add a key to `TOPICS` in `sims.js` with a display name and a color.

## The website

The library is published at [opensims.wu-physics.net](https://opensims.wu-physics.net), served straight from
this repository with no build step. Each published page carries search-engine and link-preview tags and a
[Plausible](https://plausible.io) analytics tag, which sets no cookies. All of these
are written into the pages by `npm run meta`; the simulations work the same without them, including offline.

## License and contributions

Everything in this repository is released under the GNU General Public License, version 3 or later; see `LICENSE`. You may use, copy, modify and redistribute it, including commercially, provided derivative work is released under the same license. Each simulation carries the license notice in its header so it stays with the file when downloaded.

By contributing you agree that your contribution is licensed under the same terms. The project name is not part of the license: forks are welcome, but please give yours a different name so people can tell them apart.

## Credit

Several simulations replace or are inspired by the Java simulations from the [PhET Interactive Simulations](https://phet.colorado.edu) project at the University of Colorado Boulder. They are independent implementations, not ports. Where a simulation draws on someone else's idea, the credit is in that simulation's notes.
