# Style guide for simulations

This is what makes a simulation feel like part of the library rather than a stranger. Most of it is about consistency: a teacher who has used one of these should be able to use the next one without thinking. The machine-readable version of this guide is `style.json`; if you are generating a simulation with an AI model, give it that file along with `TEMPLATE.html`.

## 1. The one-file rule

A simulation is a single `.html` file. Everything it needs is inside it: CSS, JavaScript, and any images as inline SVG or data URLs. No external scripts, fonts, stylesheets, analytics, or CDN links, ever. The file must work when opened from a desktop with no network connection.

This is the library's promise to teachers ("nothing loaded from anyone else's server") and it also means the file keeps working after it has been downloaded, emailed, or uploaded to a learning management system.

## 2. Page structure

Top to bottom, every simulation page has:

1. **Home link** above the title: `<nav class="home"><a href="../">Open Physics Sims</a></nav>`.
2. **Title** (`h1`), a short noun phrase: "Ballistics cart", "p-n junction diode". Not a sentence, no "simulation" in the name.
3. **Lede** (`p.lede`): two to four sentences saying what the reader is looking at and what will happen. Written for a student, in plain words, with the key physics claim stated up front.
4. **Tabs**, only if the sim has genuinely different screens (the ballistics cart's three cases; the resonance sim's three views). Not for settings.
5. **The canvas**, or several stacked canvases. One scene plus, where useful, a plot underneath it.
6. **Transport**: Play/Pause and Reset buttons, a time scrubber when the motion is analytic, and a playback-speed control when the real timescale is too fast or too slow to watch.
7. **Readouts**: the numbers, in HTML (not drawn on the canvas), with the governing formula beside each where there is one.
8. **Controls**: sliders with a label on the left and the current value with units on the right.
9. **Notes** (`div.notes`): a "What to try" paragraph with two or three specific things to do and what to look for, then a short statement of the model's assumptions and units.

Sections 7 to 9 are what turn a toy into a lesson. Don't skip them.

## 3. Visual system

Use the CSS custom properties exactly as named in `style.json`; every sim shares them, so the pages read as one set.

- **Surfaces**: page background `--paper`, canvases and panels `--panel` with a 1px `--rule` border and 4px radius. No drop shadows, no gradients, no hover lift.
- **Text**: `--ink` for content, `--muted` for labels and secondary text. Body and headings in the serif stack; controls, canvas labels, readouts and anything numeric in the sans stack. Canvas labels are 12 to 13px in screen pixels at every screen size.
- **Colour has meaning.** Each moving thing gets one colour and keeps it everywhere it appears (scene, plot, legend, readout). Use the semantic colours in `style.json` where they fit (`--body` blue for the thing being studied, `--conj`/`--ball` orange for a secondary moving object, `--ghost` magenta for predicted or osculating paths, `--vel` green for velocity vectors, `--hot` red for removed/warning). Don't use red and green as the only distinction between two things.
- **Paths**: predicted or theoretical paths are dashed; actual trails are solid and fade with age.
- **Buttons**: primary is filled `--ink` with white text; secondary is outlined. Segmented controls (`.seg`) for choosing among a few options, with `aria-pressed`.
- **Focus rings** are visible (3px, `#BFD7E2` on the sim pages), never removed.

## 4. Physics

- **Put the model at the top of the script**, in a few clearly named functions, with the equations in a comment beside them. A reader should be able to check the physics in the first fifty lines without wading through drawing code.
- **State the units** on the page (`g = 9.8 m/s²`; or "the planet orbits at radius 1 around a star of mass 1, with G = 1").
- **Be honest about what's fake.** If time is accelerated, say so and show a real-time counter. If a mass or force is exaggerated to make an effect visible, make it a labelled slider that starts at the real value. If carriers or particles are schematic, say "a handful stand in for 10¹⁷". Students take what the screen shows as true.
- **Prefer analytic solutions** where they exist (projectiles, Kepler orbits); they make scrubbing exact. Where you must integrate, use a symplectic integrator for orbits and oscillators (leapfrog / kick-drift-kick), keep the step small enough that energy drift is invisible over a session, and remove bodies that leave the domain rather than letting `NaN` propagate.
- **Check the limiting cases** before shipping: does the sim reproduce the textbook result when drag is zero, mass is zero, angle is zero? Put that comparison in the readout when you can (the boat sim shows predicted and simulated shift side by side).

## 5. Interaction

- Sliders change the model immediately and, for analytic sims, reset time to zero. Show the value with units next to the slider label.
- Play/Pause is one button whose label changes. Reset returns to t = 0 with the current parameters.
- A scrubber (range input) whenever the motion is analytic; it must work in both directions.
- Anything with a timescale the eye can't follow gets a playback-speed control, labelled in physical terms ("planet orbits per second", "0.4× slow motion").
- Toggles (`checkbox`) for views and overlays: "view from the cart", "show velocity components". Default the view that makes the main point; default overlays on.
- Nothing autoplays sound. If a sim uses audio (beats, Doppler), it starts on a button press.

## 6. Accessibility and motion

- Respect `prefers-reduced-motion`: start paused, or animate only in response to user actions.
- All controls are real HTML controls with labels; tabs use `role="tab"` and `aria-selected`; segmented buttons use `aria-pressed`.
- Pause the animation loop when the tab is hidden (`document.hidden`).
- Don't rely on colour alone to distinguish two things: vary line style (solid/dashed) or shape as well.

## 7. Desktop first, phone functional

The canvas is designed for a ~900px-wide desktop column, but must be usable at 390px:

- Draw canvas text in CSS pixels, not scaled design units, so labels stay 12–13px everywhere.
- Below ~640px switch the canvas to a taller aspect ratio (4:3) and let the scene fit the extra height.
- Below ~560px drop non-essential canvas labels (keep the arrows, drop their captions); the HTML readouts carry the numbers.
- Range-slider thumbs at least 22px; transport controls wrap onto their own rows.
- `touch-action: pan-y` on the canvas so the page still scrolls.

`sims/ballistics-cart.html` is the reference implementation.

## 8. Writing

- Plain words, short sentences, present tense. "The ball keeps the cart's horizontal velocity, so it comes back down into the launcher."
- Name things by what they are, not what they're called in code: "the planet", not "the perturber", in anything a student reads. Physics terms are fine when they're the point ("depletion region", "resonant angle").
- Button labels say what happens: "Open simulation", "Restart", "Show band diagram". Status text reports state: "ball in flight", "φ is librating".
- No exclamation marks, no "cool", no emoji.
- British or American spelling is fine; be consistent within a file.

## 9. Licence, credit, and AI-generated code

- Every file starts with the licence comment in `TEMPLATE.html` (GPL v3). Downloaded files travel alone, so the notice has to be inside.
- If the sim is a reimplementation of someone else's idea (a PhET Java sim, a textbook figure), credit that in the notes: "inspired by PhET's Semiconductors simulation". Never copy their artwork or code.
- Say in the file header whether the code was AI-generated and who verified the physics. That's a disclosure the journals now expect, and it's honest.
- Contributions are accepted under the project licence (GPL v3). By opening a pull request you agree to that.

## 10. Before you submit

- [ ] Opens from a local file with no network and no console errors.
- [ ] The physics functions are at the top and reproduce the textbook limiting case.
- [ ] Assumptions, units, and any time acceleration or exaggeration are stated on the page.
- [ ] Works at 390px wide with readable labels and usable sliders.
- [ ] Reduced-motion respected; loop pauses when hidden.
- [ ] Home link, licence header, "What to try", readouts with formulas.
- [ ] Entry added to `sims.js` with a real `added` date.
- [ ] Someone other than the author has tried it for two minutes without instructions.
