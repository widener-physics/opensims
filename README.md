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
LICENSE           GPL v3
README.md
```

## Making a simulation

Read `STYLE_GUIDE.md` first; it is short and it is what reviewers check against. Then copy `TEMPLATE.html`, which already has the shared CSS, the page structure (home link, title, lede, canvas, transport, readouts, controls, notes), the phone layout, and a small worked example of an analytic model.

If you are using an AI model to draft the code, see `PROMPT.md`: it has the prompt to use, the two files to attach (`style.json` and `TEMPLATE.html`), a worked example of a physics description, and what to check before the result goes into the library. You remain responsible for verifying the physics; the file header says who did, and that disclosure stays in the file.

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
  status: 'ready'                        // or 'beta' to show a badge
}
```

3. Optionally add `thumb: 'thumbs/rolling-race.png'` for a real screenshot (16:9). Without it the card gets a schematic drawn from the topic.
4. Run through the checklist at the end of `STYLE_GUIDE.md`, then open a pull request.

To add a topic, add a key to `TOPICS` in `sims.js` with a display name and a color.

## Deploying on Cloudflare Pages

The whole site is static. In the Cloudflare dashboard: Workers & Pages → Create → Pages → connect the GitHub repository. Build command: none. Build output directory: `/`. Every push to `main` redeploys. Add a custom domain from the project's *Custom domains* tab.

## License and contributions

Everything in this repository is released under the GNU General Public License, version 3 or later; see `LICENSE`. You may use, copy, modify and redistribute it, including commercially, provided derivative work is released under the same license. Each simulation carries the license notice in its header so it stays with the file when downloaded.

By contributing you agree that your contribution is licensed under the same terms. The project name is not part of the license: forks are welcome, but please give yours a different name so people can tell them apart.

## Credit

Several simulations replace or are inspired by the Java simulations from the [PhET Interactive Simulations](https://phet.colorado.edu) project at the University of Colorado Boulder. They are independent implementations, not ports. Where a simulation draws on someone else's idea, the credit is in that simulation's notes.
