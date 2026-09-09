# Generating a simulation with an AI model

Most simulations in this library were drafted by an AI model working from a physics teacher's description, then checked and revised by the teacher. This page is the prompt that gets good results. The model needs three things: the rules, a working example, and a clear description of the physics. The first two are in the repository; the third is the part you write.

## What to attach

Attach (or paste) these two files with every request:

- `style.json`: the design tokens, page structure, and rules
- `TEMPLATE.html`: a complete working simulation in the house style

Models follow a working example far better than a description of one. Without the template you get a generic-looking page; with it you get one that matches the library.

## The prompt

Copy this, fill in the bracketed parts, and attach the two files.

```
You are building a single-file HTML physics simulation for the Open Physics Sims library
(https://opensims.wu-physics.net), licensed GPL v3.

Two files are attached. style.json holds the design tokens, page structure, and rules for
physics, interaction, canvas drawing, accessibility, and writing; follow it exactly.
TEMPLATE.html is a complete working simulation in the house style; start from it, keep its
CSS, page structure, transport, readout, controls, and loop, and replace the model, the
drawing, and the text.

The simulation: [ONE PARAGRAPH: what is on screen, what happens, which quantities are
adjustable, what the student should notice. Say which of these things are exaggerated or
schematic, if any.]

Tabs (only if needed): [LIST the distinct screens, or write "none".]

Requirements:
1. Put the physical model in clearly named functions at the top of the script, with the
   governing equations in comments beside them. Use closed-form solutions where they exist;
   otherwise a symplectic integrator with a fixed small step.
2. State units and assumptions on the page. If time is accelerated or a parameter is
   exaggerated to make an effect visible, say so on screen and make the exaggeration a
   slider that starts at the real value.
3. Readouts in HTML, each with its governing formula beside the number.
4. A "What to try" paragraph with two or three specific things to do and what to look for.
5. Works from a local file with no network, at 900px wide on desktop and at 390px wide on
   a phone, with canvas text at 12-13px in screen pixels.
6. Keep the GPL header from the template and fill in the title, year, author, provenance
   ("Code drafted with an AI model under the author's direction; physics verified by the
   author."), and credit lines.

After the code, list: (a) the limiting cases you checked and the values they produced,
(b) anything in the model that is approximate or schematic, and (c) the sims.js entry
for this simulation.
```

## A filled-in example

This is the description that produced the ballistics cart:

> The simulation: a small cart on a horizontal track with a spring launcher that fires a
> ball straight up relative to the cart. Three cases: the cart rolling at constant speed
> (the ball lands back in the launcher), the cart being accelerated along the track (the
> ball lands behind, by ½aT²), and the cart rolling freely down a ramp with the ball fired
> perpendicular to the ramp (the ball lands back in the launcher because both share the
> g sin θ acceleration). Adjustable: launch speed relative to the cart, the cart's speed at
> launch, the acceleration (case 2), the ramp angle (case 3). Show the ball's path as a
> dashed prediction and a solid trail, velocity components on the ball and the cart, and a
> toggle to view the scene from the cart's frame, where the parabola becomes a straight
> line. The student should notice that the horizontal velocity of the ball matches the
> cart's in case 1 and doesn't change in case 2, and that the flight time depends only on
> the launch speed and the perpendicular component of gravity. Nothing is exaggerated; use
> g = 9.8 m/s². Also add a checkbox for case 3 giving the cart rotational inertia (5/7 g
> sin θ) so the ball lands ahead of it.
>
> Tabs: constant speed; accelerating cart; rolling down a ramp.

## After the model answers

The model's output is a draft. Before it goes in `sims/`:

1. Open the file from your desktop with no network. It must run with no console errors.
2. Check the physics yourself. Change a parameter to a value where you know the answer and compare with the readout. The model's own list of limiting cases is a starting point, not a substitute.
3. Read the text on the page as a student would. Cut anything that sounds like marketing.
4. Try it at phone width (resize the browser to about 390px).
5. Ask for revisions in the same conversation: "the pericentre label overlaps the ball; move it", "the plot should show both bodies". Small, specific requests work better than restating the whole task.
6. Fill in the header (author, year), add the `sims.js` entry, and run the checklist at the end of `STYLE_GUIDE.md`.

The provenance line in the header is not optional. It states that a model drafted the code and that a named person verified the physics. Teachers who download the file deserve to know both.
