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
tests/            physics tests, run against the sims as they ship (node tests/run.js)
package.json      names the two scripts: npm test, npm run build (no dependencies)
deploy/           the optional deploy step that adds a site owner's analytics (see Deploying)
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
  status: 'ready'                        // or 'beta' to show a badge
}
```

3. Optionally add `thumb: 'thumbs/rolling-race.png'` for a real screenshot (16:9). Without it the card gets a schematic drawn from the topic.
4. Run through the checklist at the end of `STYLE_GUIDE.md`, then open a pull request.

To add a topic, add a key to `TOPICS` in `sims.js` with a display name and a color.

## Deploying on Cloudflare Pages

The whole site is static. In the Cloudflare dashboard: Workers & Pages → Create → Pages → connect the GitHub repository. Build command: `npm run build` (it runs `deploy/add-analytics.js`; there are no dependencies to install). Build output directory: `/`. Every push to `main` redeploys. Add a custom domain from the project's *Custom domains* tab.

### Analytics (optional)

The repository contains no analytics and never will: a fork, a clone or a downloaded file is clean. If you want
to count visits to *your* deployment, give Cloudflare your analytics service's snippet and the deploy step adds it
to the copy it serves. Without it, the deploy step does nothing, so forks need no changes.

In the Pages project: *Settings → Variables and Secrets*, for **Production** only (so preview builds aren't counted):

| Variable | Value |
|---|---|
| `ANALYTICS_SNIPPET` | the whole HTML snippet your service gives you for the page's `<head>` (Plausible, Umami, GoatCounter, …) |
| `ANALYTICS_HOSTS` | the host name the site is served from, e.g. `opensims.wu-physics.net` (comma-separate several) |

Then redeploy. The snippet goes into `index.html` and every page in `sims/` (not `TEMPLATE.html`), switched off
by a three-line check unless the page is being viewed on one of `ANALYTICS_HOSTS`. The directory's *Download
file* button cuts the block back out, so a downloaded simulation is byte-for-byte the file in this repository; and
a page saved some other way (*Save as*) still sends nothing to anyone once it is opened from a USB stick or hosted
on someone else's course site. A bad setting (no host, or a site ID instead of the snippet) stops the deploy with a message rather than
deploying something half-working.

To see the result without deploying: `ANALYTICS_SNIPPET='…' ANALYTICS_HOSTS=… node deploy/add-analytics.js --out /tmp/site`.
The script refuses to edit the repository's own files; on Cloudflare it edits the build's throwaway copy.
`node deploy/add-analytics.test.js` checks all of this. Other static hosts work the same way with `--out` as the
build step and that directory as the output.

## License and contributions

Everything in this repository is released under the GNU General Public License, version 3 or later; see `LICENSE`. You may use, copy, modify and redistribute it, including commercially, provided derivative work is released under the same license. Each simulation carries the license notice in its header so it stays with the file when downloaded.

By contributing you agree that your contribution is licensed under the same terms. The project name is not part of the license: forks are welcome, but please give yours a different name so people can tell them apart.

## Credit

Several simulations replace or are inspired by the Java simulations from the [PhET Interactive Simulations](https://phet.colorado.edu) project at the University of Colorado Boulder. They are independent implementations, not ports. Where a simulation draws on someone else's idea, the credit is in that simulation's notes.
