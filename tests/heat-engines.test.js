// Heat engines on a PV diagram: every leg's work and heat against numerical integrals and the first law,
// and each named cycle's efficiency against its textbook formula.
const c = require('./load.js')('heat-engines');
let bad = 0;
const chk = (n, got, want, tol = 1e-9) => {
  const ok = Math.abs(got - want) <= tol * Math.max(1, Math.abs(want)); if (!ok) bad++;
  console.log((ok ? '  ok   ' : '  FAIL ') + n.padEnd(52) + got.toPrecision(10) + '  vs ' + want.toPrecision(10));
};
// numerical W = integral of P dV along the path, by composite Simpson in the path parameter
function numW(t, a, b) {
  if (t === 'isochoric') return 0;
  const n = 20000, h = 1 / n; let s = 0;
  for (let i = 0; i <= n; i++) {
    const p = c.legAt(t, a, b, i * h), w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    s += w * p.P;
  }
  return s * h / 3 * (b.V - a.V);
}
console.log('closed-form work against a numerical integral of P dV');
const A = { P: 300, V: 8 };
for (const [t, x] of [['isothermal', 20], ['isothermal', 3], ['adiabatic', 20], ['adiabatic', 3], ['isobaric', 20], ['isobaric', 3], ['isochoric', 600]]) {
  const B = c.legTo(t, A, x);
  chk(`W ${t} to ${x}`, c.legW(t, A, B), numW(t, A, B), 1e-10);
}
console.log('\nfirst law per leg, and the defining property of each process');
{
  const B = c.legTo('isothermal', A, 20); chk('isothermal: T unchanged', c.T_of(B.P, B.V), c.T_of(A.P, A.V)); chk('isothermal: Q = W', c.legQ('isothermal', A, B), c.legW('isothermal', A, B));
  const C = c.legTo('adiabatic', A, 20); chk('adiabatic: P V^gamma unchanged', C.P * Math.pow(C.V, c.G), A.P * Math.pow(A.V, c.G)); chk('adiabatic: dU = -W', c.U_of(C.P, C.V) - c.U_of(A.P, A.V), -c.legW('adiabatic', A, C));
  const D = c.legTo('isobaric', A, 20); chk('isobaric: Q = (5/2) n R dT', c.legQ('isobaric', A, D), 2.5 * c.R * (c.T_of(D.P, D.V) - c.T_of(A.P, A.V)));
  const E = c.legTo('isochoric', A, 600); chk('isochoric: Q = (3/2) n R dT', c.legQ('isochoric', A, E), 1.5 * c.R * (c.T_of(E.P, E.V) - c.T_of(A.P, A.V)));
}
function shoelace(legs) {
  let s = 0; const pts = [];
  legs.forEach(([t, a, b]) => { for (let i = 0; i < 4000; i++) pts.push(c.legAt(t, a, b, i / 4000)); });
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p.V * q.P - q.V * p.P; }
  return -s / 2;       // clockwise in (V, P) is positive work
}
function cycle(name, legs, effWant) {
  console.log('\n' + name);
  const last = legs[legs.length - 1][2], first = legs[0][1];
  chk('closes: V', last.V, first.V); chk('closes: P', last.P, first.P);
  legs.forEach(([t, a, b], i) => { if (i) chk(`leg ${i + 1} starts where leg ${i} ended`, a.V, legs[i - 1][2].V); });
  const s = c.summarize(legs);
  chk('dU around the loop = 0', s.dU, 0, 1e-9);
  chk('W_net = Q_in - Q_out', s.W, s.Qin - s.Qout);
  chk('W_net = enclosed area (shoelace)', s.W, shoelace(legs), 1e-5);
  chk('efficiency = textbook formula', s.eff, effWant);
  chk('below or at the Carnot limit', s.eff <= s.carnot + 1e-12 ? 1 : 0, 1);
  console.log(`         W ${s.W.toFixed(0)} J, Qin ${s.Qin.toFixed(0)} J, eff ${(100 * s.eff).toFixed(1)}%, Carnot ${(100 * s.carnot).toFixed(1)}%, T ${s.Tmin.toFixed(0)}-${s.Tmax.toFixed(0)} K`);
  return s;
}
cycle('Carnot 600/300 K, expansion ratio 2', c.carnot(600, 300, 2, 5), 1 - 300 / 600);
const cs = cycle('Carnot efficiency must not depend on the expansion ratio (ratio 3.5)', c.carnot(600, 300, 3.5, 5), 0.5);
{ const o = cycle('Otto r = 6, peak 1800 K', c.otto(6, 1800, 20, 300), 1 - Math.pow(6, 1 - c.G)); }
cycle('Otto efficiency must not depend on peak temperature (2600 K)', c.otto(6, 2600, 20, 300), 1 - Math.pow(6, 1 - c.G));
{ const Th = 600, Tc = 300, r = 4, lr = Math.log(r);
  cycle('Stirling 600/300 K, r = 4, no regenerator', c.stirling(Th, Tc, r, 20), c.R * (Th - Tc) * lr / (1.5 * c.R * (Th - Tc) + c.R * Th * lr)); }
cycle('Brayton rp = 8, peak 1400 K', c.brayton(8, 1400, 20, 300), 1 - Math.pow(8, (1 - c.G) / c.G));

console.log('\nfree-build: every snap point lands exactly on its closing curve, and then closes');
const S = { P: 250, V: 12 };
for (const t of ['isothermal', 'adiabatic', 'isobaric', 'isochoric']) {
  const E = { P: 410, V: 7.3 };
  for (const q of c.closers(t, E, S)) {
    // the snap point must lie on the pending leg's own constraint from E ...
    const onLeg = t === 'isochoric' ? q.V === E.V : c.legTo(t, E, q.V);
    if (t !== 'isochoric') chk(`${t} snap is on its own curve (via ${q.via})`, onLeg.P, q.P, 1e-12);
    // ... and on the named closing curve through S
    chk(`  ... and one ${q.via} leg from S`, c.closingType(q, S, 1e-9) === q.via ? 1 : 0, 1);
  }
}
console.log(bad ? `\n${bad} FAILURES` : '\nall checks passed');
process.exitCode = bad ? 1 : 0;
