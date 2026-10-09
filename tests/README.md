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
| Damped, driven oscillator | The exact solution against a Runge-Kutta integration in all three damping regimes (including exactly critical), with the drive on, off and changed mid-run; one long step against many short ones; the damped period and the decay of each swing; overshoot below critical damping only, and critical damping settling fastest; amplitude and lag measured from the motion against the textbook formulas; the resonance peak's position, height and width; the motor's work minus the paddle's against the change in energy |
| Electromagnetic induction | The magnet's flux through a turn of wire against a brute-force Biot-Savart sum, and far away against the point-dipole formula (the difference shrinking as 1/s²); the area under the emf equal to N times the change in flux; peak emf proportional to speed and turns; the coil always pushing against the motion with exactly the power dissipated, and Lenz's law for its current; the convention for the loop's current (counterclockwise from above makes a field pointing up) checked with Biot-Savart; each step of the on-screen Lenz's-law reasoning against the computed current and force in 80 cases (magnet or loop moving, either end down, either side, toward or away), and moving the loop matching moving the magnet; a drop through the loop reversing the current once, nearly free fall, and energy conserved; the sliding rod's exact solution against a step-by-step integration, its heat, terminal speed and coasting distance; the field-line picture against the coil's flux and a dipole's returning flux |
| Finding exoplanets | Kepler's third law against the year and Jupiter's period; the wobble against the Sun's from Jupiter and Earth and against 51 Pegasi b's published minimum mass; the light a planet blocks against a brute-force sum over a 3000 × 3000 grid on the star's face, and against the exact overlap of two circles for a uniform star; contact times against the transit-duration formula; the fraction of random orbits that transit; noise averaging down as 1/√N; and 60 mystery planets solved from noisy data by a simulated student |
| Heat engines | Numerical integrals of P dV for every kind of leg; the first law on each leg; every named cycle closing on itself, its net work equal to the area it encloses (shoelace formula), and its efficiency equal to the textbook formula and below the Carnot limit |
| Magnet in a copper tube | Elliptic integrals against tabulated values; loop-to-loop inductance against its far-field (dipole) limit; a shrunken magnet against the point-dipole drag formula; the fall against the exact exponential approach to terminal speed; energy balance over the whole fall; and the model against the measurements of Levin, da Silveira and Rizzato, *Am. J. Phys.* 74, 815 (2006) |
| Newton's cannon | The closed-form conic against a step-by-step integration of the inverse-square pull, from short arcs to beyond escape; eccentricity against energy and angular momentum; time and angle along the path as exact inverses over 230 launch speeds (the bug this caught is described in the sim) |
| Pulling a crate | The starting pull against mu_s m g / (cos + mu_s sin) at 7 angles and 3 frictions; the best angle and least force found by scanning; the normal force with two ropes, and lift-off; motion from rest against the textbook acceleration; the energy books in 300 random runs with ropes that keep changing; jamming when pushed down too steeply; four runs against a brute-force integration written separately in the test |
| The fastest slide (brachistochrone) | Path times against exact results: the straight chute; the cycloid's phi sqrt(R/g) for five end points; a quarter circle against a pendulum released from horizontal, sqrt(R/g) K(1/sqrt 2); beads released at five heights on one cycloid reaching the bottom together (the tautochrone); 417 rival paths all slower than the cycloid, and bending the cycloid slowing it; the bead's speed sqrt(2gh) along the wire; turning back at the start's height |
| Colliding carts | Total momentum at every instant, through the squeeze; kinetic energy + energy held in the bumpers + heat at every instant; each bumper's coefficient of restitution the same in five cases of different masses and speeds, and final speeds against the textbook formula; magnets elastic and never touching; Velcro ending at the center of mass's speed, losing exactly (1/2)μv²; a pad collision against a separate, much finer integration; the contact time against π√(μ/k); the area under the force against each cart's change in momentum; the center-of-mass frame |
| Crate on a ramp | The energy books in 400 random runs with a changing push, in both the crate-plus-Earth and the crate-alone accounting; the angle of repose; the pushes that start the crate up the ramp or let it slide down; sliding, stopping and return speeds on the ramp and the floor against textbook formulas; five runs against a brute-force integration written separately in the test; the mystery screen's two measurements recovering both coefficients |
| Torque and rotational inertia | The arms' and sliding cylinders' inertia against brute-force sums over their pieces (the parallel-axis theorem); the fall and the string's tension against an independent integration with a stiff, stretchy string; the weight's work against the kinetic energy at landing; steady spin after landing; the race's time ratio; a simulated lab timed to 0.01 s recovering I from the slope of angular acceleration against torque |
| Polarized light | Malus's law at every angle; unpolarized light against 200,000 random polarized beams averaged, through three different chains; crossed polarizers, and 1/8 through a third at 45° (its best angle); quarter-wave plates making circular light that passes 50% at every angle, with its turning direction checked against the field traced in time and against the field built by hand from the fast and slow parts; a half-wave plate turning the light by twice its angle, and two quarter-wave plates acting as one; Fresnel reflection conserving energy for water, glass and diamond at every angle, the head-on reflection off water, and Brewster's angle; N polarizers in equal steps passing cos^2N(90°/N) |
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
