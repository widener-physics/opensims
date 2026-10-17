// Gyroscope: the motion of the axle against a separate integration written here from scratch, as rigid-body vectors
// (dL/dt = torque, with the axle turning at the body's angular velocity) rather than the sim's angles; energy, spin
// and vertical angular momentum conserved; steady precession holding its tilt, and the level case equal to
// M g d / (I3 w3); the dip after letting go against its exact value from the conservation laws; the cusps (the axle
// stopping for an instant at the top of each wobble); the wobble's rate and the average precession for a fast
// spin; friction ending the wobble in steady precession; and the pivot force.
const G = require('./load.js')('gyroscope');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const deg = Math.PI / 180, level = 90 * deg;

// 0. the wheel itself
const P0 = G.params(5, 0.2);
ok(Math.abs(P0.I3 - 0.85 * 1.5 * 0.04) < 1e-15 && Math.abs(P0.I1 - (P0.I3 / 2 + 1.5 * 0.04)) < 1e-15, 'moments of inertia: I3 = 0.85 M R^2, I1 = I3/2 + M d^2 (perpendicular axes, then parallel axes)');
// I3/2 really is the moment about a diameter for a flat wheel: check by summing over a rim plus spokes of point masses
(function () { let Iz = 0, Ix = 0; const N = 2000; for (let k = 0; k < N; k++) { const a = 2 * Math.PI * k / N, r = 0.2 * (k % 4 ? 1 : (k % 8) / 8 + 0.3); const m = 1 / N; Iz += m * r * r; Ix += m * (r * Math.sin(a)) ** 2; } ok(Math.abs(Ix - Iz / 2) / Iz < 1e-9, 'a flat wheel: moment about a diameter is half that about the axle (point-mass sum)'); })();

// the numbers that set the precession: M g d from the wheel's mass, g and the distance, written out here
(function () { const P = G.params(5, 0.2); ok(Math.abs(G.steadyRate(level, P) - 1.5 * 9.8 * 0.2 / (0.85 * 1.5 * 0.2 * 0.2 * 2 * Math.PI * 5)) < 1e-12, 'level precession rate from the numbers: 1.5 kg × 9.8 m/s² × 0.2 m / (0.051 kg·m² × 31.4 rad/s) = ' + G.steadyRate(level, P).toFixed(4) + ' rad/s');
  // the wheel's own turning rate: in Euler angles the spin about the axle is psi' + phi' cos(theta); it must equal w3
  const S = G.steadyState(60 * deg, P), r = G.rates(S, P);
  ok(Math.abs(r.psi + r.ph * Math.cos(S.th) - P.w3) < 1e-12 && Math.abs(r.psi - P.w3) > 0.1, 'the drawn wheel turns on its axle at psi\' = w3 - phi\' cos(theta), so its spin about the axle is w3'); })();

// 1. an independent integration: unit axle n and angular momentum L about the pivot.
//    omega = (L - (L.n) n) / I1 + (L.n / I3) n ;  dn/dt = omega x n ;  dL/dt = (d n) x (-M g z)
function vecRun(n, L, P, T, h) {
  const cr = G.cross, f = (n, L) => { const Ln = L[0] * n[0] + L[1] * n[1] + L[2] * n[2];
    const w = [0, 1, 2].map(i => (L[i] - Ln * n[i]) / P.I1 + Ln / P.I3 * n[i]);
    return [cr(w, n), [n[1] * -P.mgd, -n[0] * -P.mgd, 0]]; };
  const out = []; let t = 0;
  while (t < T - 1e-12) {
    const a = f(n, L), ad = (v, k, s) => v.map((x, i) => x + s * k[i]);
    const b = f(ad(n, a[0], h / 2), ad(L, a[1], h / 2)), c = f(ad(n, b[0], h / 2), ad(L, b[1], h / 2)), d = f(ad(n, c[0], h), ad(L, c[1], h));
    n = n.map((x, i) => x + h / 6 * (a[0][i] + 2 * b[0][i] + 2 * c[0][i] + d[0][i])); L = L.map((x, i) => x + h / 6 * (a[1][i] + 2 * b[1][i] + 2 * c[1][i] + d[1][i]));
    const m = Math.hypot(...n); n = n.map(x => x / m); t += h; out.push({ t, n });
  }
  return out;
}
[[4, 0.2, level, 'released level, 4 rev/s'], [3, 0.35, 70 * deg, 'released tipped up 20 degrees, 3 rev/s, long axle'], [12, 0.1, 110 * deg, 'released tipped down, 12 rev/s']].forEach(([rev, d, th0, label]) => {
  const P = G.params(rev, d); let S = G.heldState(th0, P);
  const ref = vecRun(G.axle(S), G.angMom(S, P), P, 3, 2e-5);
  let worst = 0, k = 0, t = 0;
  for (let j = 1; j <= 300; j++) { S = G.advance(S, P, 0.01); t += 0.01; while (ref[k].t < t - 1e-9) k++; const n = G.axle(S); worst = Math.max(worst, Math.hypot(n[0] - ref[k].n[0], n[1] - ref[k].n[1], n[2] - ref[k].n[2])); }
  ok(worst < 1e-6, 'axle path matches a separate vector integration over 3 s, ' + label + ' (worst gap ' + worst.toExponential(1) + ')');
});
// and steady precession, set up by the sim, is steady in the separate integration too
(function () { const P = G.params(6, 0.25), S = G.steadyState(60 * deg, P), ref = vecRun(G.axle(S), G.angMom(S, P), P, 5, 1e-4);
  const tilt = ref.map(r => Math.acos(r.n[2])); ok(Math.max(...tilt) - Math.min(...tilt) < 1e-7, 'steady precession at 60 degrees holds its tilt in the separate integration (spread ' + (Math.max(...tilt) - Math.min(...tilt)).toExponential(1) + ' rad)'); })();

// 2. what stays fixed
(function () { const P = G.params(3.5, 0.3); let S = G.heldState(80 * deg, P); const E0 = G.energy(S, P), L0 = G.angMom(S, P)[2];
  let dE = 0, dL = 0; for (let j = 0; j < 800; j++) { S = G.advance(S, P, 0.01); dE = Math.max(dE, Math.abs(G.energy(S, P) - E0)); dL = Math.max(dL, Math.abs(G.angMom(S, P)[2] - L0)); }
  ok(dE / E0 < 1e-9, 'energy conserved over 8 s (largest change ' + (dE / E0).toExponential(1) + ' of it)');
  ok(dL < 1e-9 * P.I3 * P.w3, 'angular momentum about the vertical conserved (gravity\'s torque is horizontal)');
  const n = G.axle(S), L = G.angMom(S, P), along = L[0] * n[0] + L[1] * n[1] + L[2] * n[2];
  ok(Math.abs(along - P.I3 * P.w3) < 1e-9 * P.I3 * P.w3, 'angular momentum along the axle stays I3 w3 (no torque along the axle)'); })();
// dL/dt = torque, checked by finite differences along a wobbling run
(function () { const P = G.params(4, 0.2); let S = G.advance(G.heldState(level, P), P, 0.37); let worst = 0;
  for (let j = 0; j < 20; j++) { const h = 1e-4, a = G.angMom(G.step(S, P, h), P), b = G.angMom(G.step(S, P, -h), P), tq = G.torque(S, P);
    worst = Math.max(worst, Math.hypot(...[0, 1, 2].map(i => (a[i] - b[i]) / (2 * h) - tq[i])) / P.mgd); S = G.advance(S, P, 0.05); }
  ok(worst < 1e-6, 'rate of change of angular momentum equals gravity\'s torque, through the wobble (worst ' + worst.toExponential(1) + ' of M g d)'); })();

// 3. steady precession
(function () { const P = G.params(5, 0.2); ok(Math.abs(G.steadyRate(level, P) - P.mgd / (P.I3 * P.w3)) < 1e-15, 'level axle: steady precession at exactly M g d / (I3 w3) = ' + G.steadyRate(level, P).toFixed(3) + ' rad/s');
  [level, 60 * deg, 120 * deg, 30 * deg].forEach(th => { let S = G.steadyState(th, P), spread = 0; const r0 = G.phiDot(S, P);
    for (let j = 0; j < 500; j++) { S = G.advance(S, P, 0.01); spread = Math.max(spread, Math.abs(S.th - th)); }
    ok(spread < 1e-9 && Math.abs(S.ph - r0 * 5) < 1e-7, 'steady precession at ' + Math.round(th / deg) + ' degrees: tilt holds for 5 s, and it swings around at a constant rate'); });
  // the rate halves when the spin doubles, doubles when the axle doubles
  const r = (rev, d) => G.steadyRate(level, G.params(rev, d));
  ok(Math.abs(r(10, 0.2) / r(5, 0.2) - 0.5) < 1e-12 && Math.abs(r(5, 0.3) / r(5, 0.15) - 2) < 1e-12, 'level: twice the spin, half the precession rate; twice the axle length, twice the rate');
  // tilted: the textbook estimate is close for a fast spin, and the exact rate solves the steady-motion condition
  const th = 50 * deg, W = G.steadyRate(th, P), resid = P.I1 * Math.cos(th) * W * W - P.I3 * P.w3 * W + P.mgd;
  const Om = G.gyroRate(P), first = Om * (1 + P.I1 * Math.cos(th) * Om / (P.I3 * P.w3));
  ok(Math.abs(resid) < 1e-12 && Math.abs(W / first - 1) < 0.01, 'tilted 40 degrees up at 5 rev/s: exact steady rate (' + W.toFixed(3) + ' rad/s) solves the steady-motion condition, ' + ((W / Om - 1) * 100).toFixed(1) + '% above the textbook M g d / (I3 w3), as the first correction predicts');
  const Pf = G.params(15, 0.2);
  ok(Math.abs(G.steadyRate(th, Pf) / G.gyroRate(Pf) - 1) < 0.025, 'at 15 rev/s the textbook rate is within 2.5% at that tilt');
  ok(isNaN(G.steadyRate(10 * deg, G.params(0.5, 0.35))), 'too slow a spin with the axle nearly upright: no steady precession'); })();

// 4. letting go
(function () { const P = G.params(4, 0.2); let S = G.heldState(level, P), lo = level, minRate = Infinity, maxRate = -Infinity, cuspRates = [];
  let prev = G.rates(S, P).th, prevTh = S.th;
  for (let j = 0; j < 40000; j++) { S = G.step(S, P, 1e-4); const r = G.rates(S, P), pd = r.ph;
    lo = Math.max(lo, S.th); minRate = Math.min(minRate, pd); maxRate = Math.max(maxRate, pd);
    if (prev > 0 && r.th <= 0) cuspRates.push(['bottom', pd]); if (prev < 0 && r.th >= 0) cuspRates.push(['top', pd, S.th]);
    prev = r.th; }
  ok(Math.abs(lo - G.lowestTilt(level, P)) < 1e-6, 'let go level at 4 rev/s: dips to ' + (lo / deg - 90).toFixed(2) + ' degrees below level, as energy and angular momentum require (' + (G.lowestTilt(level, P) / deg - 90).toFixed(2) + ')');
  const tops = cuspRates.filter(c => c[0] === 'top');
  ok(tops.length > 5 && tops.every(c => Math.abs(c[1]) < 2e-3 * maxRate && Math.abs(c[2] - level) < 1e-5), 'it comes back up to level each time, and stops there for an instant (cusps): ' + tops.length + ' wobbles in 4 s');
  ok(minRate > -1e-3 * maxRate, 'the axle never swings backward');
})();
(function () { const P = G.params(15, 0.15); let S = G.heldState(level, P); const T = 6; S = G.advance(S, P, T, 2e-4);
  // with a fast spin, the average precession approaches the steady rate, and the wobble is fast and tiny
  ok(Math.abs(S.ph / T / G.gyroRate(P) - 1) < 0.01, 'fast spin (15 rev/s): average precession within 1% of M g d / (I3 w3)');
  let S2 = G.heldState(level, P), prev = 0, ups = []; let t = 0;
  for (let j = 0; j < 20000; j++) { S2 = G.step(S2, P, 1e-4); t += 1e-4; const r = G.rates(S2, P).th; if (prev < 0 && r >= 0) ups.push(t); prev = r; }
  const per = (ups[ups.length - 1] - ups[0]) / (ups.length - 1), wn = P.I3 * P.w3 / P.I1;
  ok(Math.abs(2 * Math.PI / per / wn - 1) < 0.01, 'wobble (nutation) rate I3 w3 / I1 for a fast spin, to 1% (' + (2 * Math.PI / per).toFixed(1) + ' vs ' + wn.toFixed(1) + ' rad/s)'); })();

// 5. friction ends the wobble in steady precession
(function () { const P = G.params(4, 0.2, 2.0); let S = G.heldState(level, P), E = G.energy(S, P), down = true;
  for (let j = 0; j < 3000; j++) { S = G.advance(S, P, 0.01); const e = G.energy(S, P); if (e > E + 1e-12) down = false; E = e; }
  ok(down, 'with friction, energy only goes down');
  const W = G.phiDot(S, P), Ws = G.steadyRate(S.th, P);
  ok(Math.abs(S.thd) < 1e-6 && Math.abs(W / Ws - 1) < 1e-4, 'after 30 s the wobble is gone and it precesses steadily at ' + (S.th / deg - 90).toFixed(1) + ' degrees below level, at the steady rate for that tilt'); })();

// 5b. no spin: let go level, it swings down and back like a pendulum, with the period of a physical pendulum of
//     amplitude 90 degrees: 4 sqrt(I1 / (M g d)) K(sin 45 degrees), K the complete elliptic integral (AGM)
(function () { const P = G.params(0, 0.25); let S = G.heldState(level, P), t = 0, prev = 0, back = null, lowest = 0;
  const K = Math.PI / 2 / (function agm(a, b) { for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return a; })(1, Math.SQRT1_2);
  const Tp = 4 * Math.sqrt(P.I1 / P.mgd) * K;
  for (let j = 0; j < 40000 && back === null; j++) { S = G.step(S, P, 1e-4); t += 1e-4; lowest = Math.max(lowest, S.th); const r = G.rates(S, P).th; if (prev > 0 && r <= 0) back = t; prev = r; }
  ok(Math.abs(S.ph) < 1e-12 && Math.abs(lowest - 270 * deg) < 1e-3 && Math.abs(2 * back / Tp - 1) < 1e-3, 'not spinning: it swings straight down and up to level on the far side, like a pendulum, period ' + (2 * back).toFixed(3) + ' s vs ' + Tp.toFixed(3) + ' s'); })();

// 6. the pivot: holds up the weight, and in steady precession also pulls the wheel inward
(function () { const P = G.params(5, 0.25), S = G.steadyState(level, P), F = G.pivotForce(S, P), W = G.steadyRate(level, P), n = G.axle(S);
  const inward = -(F[0] * n[0] + F[1] * n[1]);
  ok(Math.abs(F[2] - 1.5 * 9.8) < 1e-6 && Math.abs(inward - 1.5 * W * W * 0.25) < 1e-6, 'steady, level: pivot pushes up with M g and pulls inward with M Omega^2 d'); })();

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
