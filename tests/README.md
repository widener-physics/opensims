# Physics tests

These check the physics of the simulations against independent calculations. They need only Node.js
(version 18 or later) and nothing else: no packages, no browser.

```
node tests/run.js             one line per simulation
node tests/run.js --verbose   every check, with the values compared
```

## What the tests run

Each simulation that has a tested model keeps it in one block of its script, between the comments
`---- physics core` and `---- end of core`. That block does no drawing and never touches the page.
`load.js` reads the block **straight out of the page in `sims/`** and runs it, so the tests check the
code students actually use, not a copy of it. If someone edits a sim and breaks its physics, the tests
fail, locally and on GitHub, where they run on every push.

## The rule the tests follow

A check is only worth something if it does not use the formula it is checking. So the tests compare the
simulation against a *different* route to the same answer: a numerical integration instead of a closed
form, a transfer matrix instead of a sum of reflections, a Lorentz transformation instead of a time-dilation
formula, or a published table or measurement.

| Simulation | What it is checked against |
|---|---|
| Heat engines | Numerical integrals of P dV for every kind of leg; the first law on each leg; every named cycle closing on itself, its net work equal to the area it encloses (shoelace formula), and its efficiency equal to the textbook formula and below the Carnot limit |
| Magnet in a copper tube | Elliptic integrals against tabulated values; loop-to-loop inductance against its far-field (dipole) limit; a shrunken magnet against the point-dipole drag formula; the fall against the exact exponential approach to terminal speed; energy balance over the whole fall; and the model against the measurements of Levin, da Silveira and Rizzato, *Am. J. Phys.* 74, 815 (2006) |
| Newton's cannon | The closed-form conic against a step-by-step integration of the inverse-square pull, from short arcs to beyond escape; eccentricity against energy and angular momentum; time and angle along the path as exact inverses over 230 launch speeds (the bug this caught is described in the sim) |
| Crate on a ramp | The energy books in 400 random runs with a changing push, in both the crate-plus-Earth and the crate-alone accounting; the angle of repose; the pushes that start the crate up the ramp or let it slide down; sliding, stopping and return speeds on the ramp and the floor against textbook formulas; five runs against a brute-force integration written separately in the test; the mystery screen's two measurements recovering both coefficients |
| Relativity (Earth's frame) | Light clocks built in their own rest frames and Lorentz-transformed; the moving ruler found by locating both ends at one time; the twins' ages by integrating the spacetime interval; flash counts against the Doppler counting identity |
| Relativity (traveler's frame) | The traveler at rest in each of his two frames with his clock reading that frame's time; the jump in Earth's "now" at the turnaround; every flash moving at c in his frame and arriving when the Earth-frame calculation says |
| Standing waves | The mode sums against closed-form solutions of the damped wave equation (string with a moving end; point-source pipes); the exact time stepping against a Runge-Kutta integration through a change of frequency; resonances at nv/2L (string, open pipe) and odd multiples of v/4L (closed pipe); boundary conditions held in the running model |
| Photoelectric effect | Fowler's function against numerical integration; the current against the integral over electron energies it stands for, and against a direct count of a Fermi-Dirac metal's electrons near threshold; no current below threshold or past the stopping voltage; the work functions against Michaelson's handbook table; the animated electrons against the current; a simulated stopping-voltage experiment, read off the meter as a student would, recovering Planck's constant for every metal and naming every mystery metal |
| Thin films | Exact reflectance against an independent transfer-matrix calculation in 3000 random cases, with energy conserved; textbook limits (bare surface, quarter-wave and half-wave layers, the black soap film); the refractive indices of water and crown glass against handbook values; the color-matching functions against the CIE 1931 table; soap-film colors in Newton's sequence |

The other simulations do not yet have a marked core and tests. Most of their models are short closed-form
expressions (projectiles, relative velocity, rolling without slipping); adding tests for them is welcome.

## Adding tests for a simulation

1. In the sim's script, put the model between `// ---- physics core` and `// ---- end of core ----`. It may
   use only plain JavaScript and `Math`.
2. Write `tests/<slug>.test.js`. Load the core with `require('./load.js')('<slug>')`, print one line per
   check starting with `ok` or `FAIL` (or `PASS`/`FAIL`), and set `process.exitCode = 1` if anything fails.
   Look at `thin-film.test.js` or `newtons-cannon.test.js` for the pattern.
3. Run `node tests/run.js`.
