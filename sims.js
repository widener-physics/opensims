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
    slug: 'laser',
    title: 'How a laser works',
    topic: 'modern',
    tags: ['stimulated emission', 'population inversion', 'threshold', 'optical cavity', 'energy levels'],
    blurb: 'One atom first: absorption, spontaneous emission, and stimulated emission making a copy of the photon that caused it. Then a tube of atoms between mirrors, where a two-level scheme can never lase, three levels need a hard push, and four levels light up easily.',
    level: 'intermediate',
    added: '2026-09-08',
    status: 'beta'
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
