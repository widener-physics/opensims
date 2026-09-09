# Open Physics Sims

A library of free, single-file physics simulations for teaching. Each simulation is one HTML file with no dependencies, so it runs from a web server, from a course page, or straight off a USB stick.

## Layout

```
index.html        the directory page (search + topic filters)
sims.js           the manifest: one entry per simulation
sims/             the simulations, one .html each
README.md
```

## Adding a simulation

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

To add a topic, add a key to `TOPICS` in `sims.js` with a display name and a colour.

## Conventions for simulations

- One file, no external scripts, fonts or images. Anything the sim needs is inline.
- Vanilla JavaScript and Canvas. Keep the physics in clearly named functions near the top of the script so a reader can check it.
- Desktop first, but functional on a phone. Concretely: draw canvas text in CSS pixels (not scaled design units) so labels stay about 13 px at every width; switch the canvas to a taller aspect ratio below ~640 px; drop non-essential labels below ~560 px; keep numbers in HTML readouts rather than on the canvas; make slider thumbs at least 22 px. The ballistics cart is the reference implementation.
- Respect `prefers-reduced-motion` (start paused, or animate only on user action).
- State the model's assumptions and units on the page.

## Deploying on Cloudflare Pages

The whole site is static. In the Cloudflare dashboard: Workers & Pages → Create → Pages → connect the GitHub repository. Build command: none. Build output directory: `/`. Every push to `main` redeploys. Add a custom domain from the project's *Custom domains* tab.

## Licence

Set your licence here (for example MIT for the code, or CC BY 4.0 for everything). Add a `LICENSE` file at the repository root.

## Credit

Several simulations replace or are inspired by the Java simulations from the [PhET Interactive Simulations](https://phet.colorado.edu) project at the University of Colorado Boulder. They are independent implementations, not ports.
