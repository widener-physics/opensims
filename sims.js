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
