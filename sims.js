// One entry per simulation. Add a new sim by dropping its HTML file into /sims/ and adding an entry here.
// Fields: slug (file name without .html), title, topic (one of the keys in TOPICS), tags (free-form),
// blurb (one or two sentences), level ("intro" | "intermediate"), added (YYYY-MM-DD), status ("ready" | "beta").
window.TOPICS = {
  kinematics:   { name: 'Kinematics & frames', color: '#1D4F73' },
  dynamics:     { name: 'Forces & momentum',   color: '#2E7D32' },
  rotation:     { name: 'Rotation',            color: '#7A4B22' },
  oscillations: { name: 'Oscillations & waves', color: '#B5306D' },
  thermo:       { name: 'Thermodynamics',      color: '#C8321E' },
  em:           { name: 'Electricity & magnetism', color: '#D9651B' },
  optics:       { name: 'Optics',              color: '#E8A317' },
  modern:       { name: 'Modern physics',      color: '#5B3F8C' },
  astronomy:    { name: 'Astronomy',           color: '#2E6C8C' },
  materials:    { name: 'Solids & semiconductors', color: '#4A5A63' }
};

window.SIMS = [
  {
    slug: 'polarization',
    title: 'Polarized light',
    topic: 'optics',
    tags: ['polarization', "Malus's law", 'polarizer', "Brewster's angle", 'glare', 'wave plate', 'circular polarization', 'LCD'],
    blurb: "Watch the electric field of a light wave as it passes through polarizers, reflects off water as glare, and goes through quarter- and half-wave plates. Record a light meter to find Malus's law, the three-polarizer surprise, Brewster's angle, and why many small turns pass almost all the light.",
    level: 'intro',
    added: '2026-10-05',
    status: 'ready'
  },
  {
    slug: 'rotational-inertia',
    title: 'Torque and rotational inertia',
    topic: 'rotation',
    tags: ['torque', 'rotational inertia', 'moment of inertia', 'angular acceleration', 'parallel-axis theorem', 'tension', 'lab'],
    blurb: "A cross with four sliding masses, spun by a hanging weight on a step pulley, like the classic lab apparatus. Change the pulley to change the torque, slide the masses to change the rotational inertia, race two wheels with the same mass in different places, and measure I from the slope of angular acceleration against torque.",
    level: 'intro',
    added: '2026-10-05',
    status: 'ready'
  },
  {
    slug: 'brachistochrone',
    title: 'The fastest slide',
    topic: 'dynamics',
    tags: ['brachistochrone', 'cycloid', 'energy conservation', 'calculus of variations', 'Bernoulli', 'Galileo', 'tautochrone', 'frictionless'],
    blurb: "Bend a wire and race a bead down it against the straight line and your own best try: the shortest path is not the fastest. Then drag the end point and watch the cycloid, traced by a rolling circle, fit between the two points and beat every rival, Galileo's circular arc included.",
    level: 'intro',
    added: '2026-10-05',
    status: 'ready'
  },
  {
    slug: 'pulling-crate',
    title: 'Pulling a crate',
    topic: 'dynamics',
    tags: ['vector components', 'normal force', 'friction', 'free-body diagram', 'angled pull', 'vector addition', 'net force', "Newton's second law"],
    blurb: "Pull a crate with a rope at an angle and watch the pull split into components: one drags it forward, the other lifts on it and lightens the load on the floor. Find the angle that starts it moving with the least force, then add a second rope and combine the pulls as vectors.",
    level: 'intro',
    added: '2026-10-02',
    status: 'ready'
  },
  {
    slug: 'driven-oscillator',
    title: 'Damped, driven oscillator',
    topic: 'oscillations',
    tags: ['damping', 'critical damping', 'driven oscillator', 'resonance', 'phase lag', 'Q factor', 'transient', 'steady state', 'mass on a spring'],
    blurb: "A mass on a spring, slowed by a paddle in liquid and shaken by a motor. Watch swings die away and find critical damping, see the mass move with the motor, lag it by a quarter cycle, then oppose it, and build the resonance curve point by point as the motion settles.",
    level: 'intro',
    added: '2026-10-02',
    status: 'ready'
  },
  {
    slug: 'exoplanets',
    title: 'Finding exoplanets',
    topic: 'astronomy',
    tags: ['exoplanets', 'transit method', 'radial velocity', 'Doppler shift', "Kepler's third law", 'center of mass', 'density', 'light curve', 'limb darkening'],
    blurb: "Watch a star dim as a planet crosses it and wobble as the planet tugs on it, with data as noisy as the real thing. Find out why Earth-size planets are so hard to see, then measure a mystery planet's orbit, size and mass from its light curve and Doppler shifts, and decide whether it is rocky or gas-rich.",
    level: 'intro',
    added: '2026-10-02',
    status: 'ready'
  },
  {
    slug: 'ramp',
    title: 'A crate on a ramp',
    topic: 'dynamics',
    tags: ['inclined plane', 'friction', 'static friction', 'kinetic friction', 'free-body diagram', 'work', 'energy', 'work-energy theorem', 'thermal energy'],
    blurb: "Push a crate up or down a ramp, or let it go and see whether it slides. A free-body diagram shows static friction holding until it can't, energy bars show your work turning into motion, height and heat with the books always balancing, and a mystery crate challenges you to measure both friction coefficients.",
    level: 'intro',
    added: '2026-10-01',
    status: 'ready'
  },
  {
    slug: 'photoelectric',
    title: 'The photoelectric effect',
    topic: 'modern',
    tags: ['photoelectric effect', 'photons', 'work function', 'stopping voltage', "Planck's constant", 'Einstein', 'Millikan', 'quantum'],
    blurb: "Shine light on a metal in a vacuum tube and watch for electrons. Find the color below which no brightness will do, stop the fastest electrons with a battery, measure Planck's constant from your own stopping voltages, and identify a mystery metal by its work function.",
    level: 'intro',
    added: '2026-09-30',
    status: 'ready'
  },
  {
    slug: 'thin-film',
    title: 'Thin-film interference',
    topic: 'optics',
    tags: ['interference', 'thin films', 'soap film', 'phase change on reflection', 'anti-reflection coating', 'air wedge', "Newton's rings", 'color'],
    blurb: "A draining soap film, an oil slick, a coated lens and an air wedge, each colored by the daylight it actually reflects. A probe shows the two reflected waves falling into and out of step, and the half-wave flips that decide why the top of a soap film turns black just before it bursts.",
    level: 'intro',
    added: '2026-09-30',
    status: 'ready'
  },
  {
    slug: 'standing-waves',
    title: 'Standing waves',
    topic: 'oscillations',
    tags: ['standing waves', 'resonance', 'harmonics', 'normal modes', 'string', 'air columns', 'open and closed pipes', 'speed of sound'],
    blurb: 'Shake one end of a string, or play a tone into a pipe, and hunt for the frequencies where it suddenly comes alive. Nothing is marked in advance: each settled measurement goes on a graph, so the harmonics at nv/2L, and the missing even harmonics of a closed pipe, turn up as you find them.',
    level: 'intro',
    added: '2026-09-28',
    status: 'ready'
  },
  {
    slug: 'relativity',
    title: 'Moving clocks and the twin paradox',
    topic: 'modern',
    tags: ['special relativity', 'time dilation', 'length contraction', 'simultaneity', 'light clock', 'twin paradox', 'Doppler'],
    blurb: "Light clocks on a platform and a passing train, with a switch to ride either one: each observer finds the other's clocks slow and short. A toggle shows why length contraction is forced. Then the twin paradox, told with birthday flashes, from Earth's frame and then the traveler's: when he turns round, his 'now' on Earth jumps forward 12.8 years.",
    level: 'intro',
    added: '2026-09-27',
    status: 'ready'
  },
  {
    slug: 'magnet-tube',
    title: 'Magnet falling through a copper tube',
    topic: 'em',
    tags: ["Lenz's law", 'eddy currents', 'induction', 'terminal velocity', 'conductivity', 'energy'],
    blurb: 'Race one magnet down copper, aluminum, brass and slotted copper tubes, then ride along inside the wall to see the induced currents circling above and below it. The drag model has no fitted constants and reproduces a published measurement: two stacked discs fall more slowly than one or three.',
    level: 'intro',
    added: '2026-09-26',
    status: 'ready'
  },
  {
    slug: 'heat-engines',
    title: 'Heat engines on a PV diagram',
    topic: 'thermo',
    tags: ['PV diagram', 'first law', 'heat engine', 'efficiency', 'Carnot', 'Otto', 'Stirling', 'Brayton', 'refrigerator'],
    blurb: 'Run Carnot, Otto, Stirling and Brayton cycles beside a piston, with the work of each leg shaded as the area under it and the net work as the area the loop encloses. Or build your own cycle leg by leg, and find that the internal energy always returns to where it started while the work and heat depend on the route.',
    level: 'intro',
    added: '2026-09-26',
    status: 'ready'
  },
  {
    slug: 'newtons-cannon',
    title: "Newton's cannonball",
    topic: 'astronomy',
    tags: ['orbits', 'gravitation', 'escape speed', 'Kepler', 'conic sections', 'projectile motion'],
    blurb: "Fire a cannon horizontally from a mountain above the air, harder and harder, and leave the shots on the screen to build Newton's family of curves. The path is the exact conic throughout, so you can watch the impact point race away, the perigee rise above the ground before circular speed is reached, and the ellipse finally refuse to close at escape speed.",
    level: 'intro',
    added: '2026-09-25',
    status: 'ready'
  },
  {
    slug: 'angular-velocity',
    title: 'Angular and linear velocity',
    topic: 'rotation',
    tags: ['angular velocity', 'tangential speed', 'centripetal acceleration', 'period', 'rigid body'],
    blurb: 'Drag a ladybug anywhere on a spinning turntable. Every point shares one angular velocity, but the speed each point travels at grows with the radius. Velocity and centripetal acceleration arrows on fixed scales, with both plotted against radius so the slopes are omega and omega squared.',
    level: 'intro',
    added: '2026-09-25',
    status: 'ready'
  },
  {
    slug: 'forces-1d',
    title: 'Forces in one dimension',
    topic: 'dynamics',
    tags: ["Newton's laws", 'friction', 'free-body diagram', 'acceleration'],
    blurb: 'Push a crate while the graphs build up underneath, and watch the force trace look nothing like the velocity trace. A second screen plots friction against your push, showing the diagonal static region, the break-free point, and the flat sliding value that explains the lurch.',
    level: 'intro',
    added: '2026-09-08',
    status: 'ready'
  },
  {
    slug: 'laser',
    title: 'How a laser works',
    topic: 'modern',
    tags: ['stimulated emission', 'population inversion', 'threshold', 'optical cavity', 'energy levels'],
    blurb: 'One atom first: absorption, spontaneous emission, and stimulated emission making a copy of the photon that caused it. Then a tube of atoms between mirrors, where a two-level scheme can never lase, three levels need a hard push, and four levels light up easily.',
    level: 'intermediate',
    added: '2026-09-08',
    status: 'ready'
  },
  {
    slug: 'gauss-law',
    title: "Gauss's law",
    topic: 'em',
    tags: ['electric flux', 'field lines', 'symmetry', 'line charge'],
    blurb: 'Drag charges and drag a closed surface while the flux is measured piece by piece around the boundary and compared with the charge enclosed over epsilon-zero. Move a charge outside and the total falls to zero while the field does not.',
    level: 'intermediate',
    added: '2026-09-08',
    status: 'ready'
  },
  {
    slug: 'rocket-staging',
    title: 'Rocket staging',
    topic: 'dynamics',
    tags: ['rocket equation', 'variable mass', 'momentum', 'orbital velocity'],
    blurb: 'Build the same 500 metric ton rocket as one stage or two and see why one cannot reach orbit. Mass diagram, per-stage delta-v, and a speed trace with staging marked, with gravity losses on or off.',
    level: 'intermediate',
    added: '2026-09-08',
    status: 'ready'
  },
  {
    slug: 'static-equilibrium',
    title: 'Static equilibrium',
    topic: 'rotation',
    tags: ['torque', 'free-body diagram', 'ladder problem', 'reaction forces', 'friction'],
    blurb: 'A plank on two supports, a ladder against a smooth wall, and a boom held by a cable. Forces are solved and drawn, torque bars show the balance about any point you choose, and the force polygon closes.',
    level: 'intro',
    added: '2026-09-08',
    status: 'ready'
  },
  {
    slug: 'charged-particle-fields',
    title: 'Charged particle in electric and magnetic fields',
    topic: 'em',
    tags: ['magnetic force', 'velocity selector', 'mass spectrometer', 'cyclotron', 'Lorentz force'],
    blurb: 'Four screens on one idea: a magnetic field turns a charge without doing work. Circular orbits whose period ignores speed, a crossed-field speed filter, isotope separation on a detector, and a cyclotron that falls out of step when you detune it.',
    level: 'intermediate',
    added: '2026-09-08',
    status: 'ready'
  },
  {
    slug: 'rolling-race',
    title: 'Rolling race',
    topic: 'rotation',
    tags: ['moment of inertia', 'rotational energy', 'rolling without slipping', 'inclined plane'],
    blurb: 'A hoop, disc, sphere, hollow sphere and sliding block race down the same ramp. Energy bars show how much each one has to put into spinning, which is exactly the order they finish in. Mass and radius change nothing.',
    level: 'intro',
    added: '2026-09-08',
    status: 'ready'
  },
  {
    slug: 'river-crossing',
    title: 'River crossing',
    topic: 'kinematics',
    tags: ['relative velocity', 'vector addition', 'reference frames', 'optimization'],
    blurb: 'A boat crosses a flowing river. Set its heading and watch the two velocities add: fastest crossing, landing straight across, or least drift when the current wins. A water-frame view straightens the path.',
    level: 'intro',
    added: '2026-09-08',
    status: 'ready'
  },
  {
    slug: 'ballistics-cart',
    title: 'Ballistics cart',
    topic: 'kinematics',
    tags: ['projectiles', 'reference frames', 'relative motion', 'inclined plane'],
    blurb: 'A cart fires a ball straight up while rolling at constant speed, while accelerating, and while rolling down a ramp. Switch to the cart\'s frame and watch the parabola straighten out.',
    level: 'intro',
    added: '2026-09-04',
    status: 'ready'
  },
  {
    slug: 'boat-walker',
    title: 'Walking on a boat',
    topic: 'dynamics',
    tags: ['center of mass', 'momentum', 'drag', 'impulse'],
    blurb: 'A person walks the length of a floating boat. Without drag the boat slides back and stays; with linear drag it drifts home while the center of mass moves. Both cases side by side with x(t) plots.',
    level: 'intro',
    added: '2026-09-02',
    status: 'ready'
  },
  {
    slug: 'orbital-resonance',
    title: 'Orbital resonance',
    topic: 'astronomy',
    tags: ['orbits', 'Kepler', 'Kirkwood gaps', 'Pluto', 'three-body'],
    blurb: 'Three screens: where conjunctions land for a given period ratio, how repeated kicks pump a circular orbit into an ellipse, and how gaps carve themselves out of a belt of test bodies.',
    level: 'intermediate',
    added: '2026-09-03',
    status: 'ready'
  },
  {
    slug: 'pn-junction',
    title: 'p-n junction diode',
    topic: 'materials',
    tags: ['semiconductors', 'band diagram', 'doping', 'depletion region', 'diode'],
    blurb: 'Dope each half of a bar, connect a battery, and watch electrons and holes drift, cross the junction and recombine. A band diagram and an I-V curve track the same carriers in energy.',
    level: 'intermediate',
    added: '2026-09-02',
    status: 'ready'
  }
];
