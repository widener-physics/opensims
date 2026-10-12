// Stern-Gerlach: the deflection against a step-by-step integration; the oven's speed distribution sampled correctly;
// classical moments spread evenly; the spin-1/2 probabilities against the spinor overlap and the Pauli-matrix
// expectation; repeated measurements; and rows of analyzers, exact fractions against 200,000 simulated atoms.
const P = require('./load.js')('stern-gerlach');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const D2R = Math.PI / 180;
// 1. the magnet
{
  let w = 0;
  [[400, 1000, 0.035, 0], [700, 600, 0.035, 0.1], [250, 1000, 0.05, 0.02]].forEach(([v, G, L, D]) => {
    const a = P.SG.muB * G / P.SG.m; let z = 0, vz = 0, x = 0; const dt = 1e-8;
    while (x < L + D) { const acc = x < L ? a : 0; vz += acc * dt; z += vz * dt; x += v * dt; }
    // correct the last step's overshoot
    w = Math.max(w, Math.abs(z / P.deflection(P.SG.muB, v, G, L, D) - 1));
  });
  ok(w < 2e-3, 'the deflection (mu G / m)(L^2/2 + L D)/v^2 matches a step-by-step integration through the magnet and beyond');
  const s = 2 * P.deflection(P.SG.muB, P.meanSpeed(1300), 1000, 0.035, 0) * 1000;
  ok(s > 0.15 && s < 0.25, 'with a 1000 T/m gradient over 3.5 cm and an oven at 1300 K, the two spots are ' + s.toFixed(2) + ' mm apart, close to Stern and Gerlach\'s 0.2 mm');
}
// 2. the oven and the classical expectation
{
  const T = 1300, n = 400000; let sv = 0, si = 0;
  for (let i = 0; i < n; i++) { const v = P.sampleSpeed(T, rnd); sv += v; si += 1 / (v * v); }
  ok(Math.abs(sv / n / P.meanSpeed(T) - 1) < 0.005 && Math.abs(si / n * P.vp(T) ** 2 - 1) < 0.02, 'speeds drawn for an oven beam (v^3 e^(-v^2/vp^2)) have the right mean, (3 sqrt(pi)/4) vp, and the right mean of 1/v^2, 1/vp^2');
  const bins = new Array(10).fill(0); for (let i = 0; i < n; i++) bins[Math.min(9, Math.floor((P.classicalMuz(rnd) / P.SG.muB + 1) * 5))]++;
  ok(bins.every(b => Math.abs(b / (n / 10) - 1) < 0.02), 'classical tiny magnets pointing every which way: mu_z is spread evenly from -mu to +mu, so the screen would show a smear, not two spots');
  // that even spread is what random directions in space give: check by drawing directions uniformly on a sphere
  const b2 = new Array(10).fill(0); for (let i = 0; i < n; i++) { let x, y, z, r; do { x = 2 * rnd() - 1; y = 2 * rnd() - 1; z = 2 * rnd() - 1; r = x * x + y * y + z * z; } while (r > 1 || r < 1e-6); b2[Math.min(9, Math.floor((z / Math.sqrt(r) + 1) * 5))]++; }
  ok(b2.every(b => Math.abs(b / (n / 10) - 1) < 0.02), 'checked independently: directions drawn evenly over a sphere have evenly spread z components');
}
// 2b. the expected pattern on the screen against simulated atoms
{
  const T = 1300, G = 1000, zMax = 4e-4, nb = 80, sb = 1.5e-5, N = 300000; let worst = 0;
  ['quantum', 'classical', 'off'].forEach(mode => {
    const h = P.pattern(mode, G, T, zMax, nb, sb), cnt = new Float64Array(nb), dz = 2 * zMax / nb;
    for (let i = 0; i < N; i++) { const v = P.sampleSpeed(T, rnd), muz = mode === 'quantum' ? (rnd() < 0.5 ? 1 : -1) * P.SG.muB : mode === 'off' ? 0 : P.classicalMuz(rnd);
      const g = Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd()), z = P.deflection(muz, v, G, P.SG.L, P.SG.D) + g * sb, j = Math.floor((z + zMax) / dz); if (j >= 0 && j < nb) cnt[j]++; }
    // compare where there are enough counts to judge
    for (let j = 0; j < nb; j++) { const e = h[j] * N; if (e > 400) worst = Math.max(worst, Math.abs(cnt[j] - e) / Math.sqrt(e)); }
  });
  ok([[0, 0.5], [1, 0.8413447461], [-1.96, 0.0249978951], [3, 0.9986501020]].every(([x, v]) => Math.abs(P.Phi(x) - v) < 3e-7), 'the normal distribution used to spread each atom over the beam\'s width is accurate to better than one part in a million');
  ok(worst < 5, 'the expected screen pattern (two spots, a smear, or one line) matches 300,000 simulated atoms bin by bin (worst ' + worst.toFixed(1) + ' standard deviations)');
}
// 3. spin 1/2
{
  let w1 = 0, w2 = 0;
  for (let s = -180; s <= 180; s += 15) for (let a = -180; a <= 180; a += 20) {
    const S = P.spinor(s * D2R), A = P.spinor(a * D2R), ov = (S[0] * A[0] + S[1] * A[1]) ** 2;
    // Pauli: <sigma . m> for the state along s is cos(a - s), so P(up along a) = (1 + cos)/2
    const pauli = (1 + Math.cos((a - s) * D2R)) / 2;
    w1 = Math.max(w1, Math.abs(P.probUp(s * D2R, a * D2R) - ov)); w2 = Math.max(w2, Math.abs(P.probUp(s * D2R, a * D2R) - pauli));
  }
  ok(w1 < 1e-15 && w2 < 1e-15, 'the chance of "up" along any axis matches both the spinor overlap |<a|s>|^2 and the Pauli-matrix expectation (1 + cos)/2');
  let same = 0, opp = 0, n = 0;
  for (let i = 0; i < 2000; i++) { const a = rnd() * 6.28, r = P.measure(null, a, rnd), r2 = P.measure(r.s, a, rnd), r3 = P.measure(r.s, a + Math.PI, rnd); n++; if (r2.up === r.up) same++; if (r3.up !== r.up) opp++; }
  ok(same === n && opp === n, 'measure the same axis again and you always get the same answer; along the opposite direction, always the opposite');
  let ups = 0; const N = 200000; for (let i = 0; i < N; i++) if (P.measure(null, rnd() * 6.28, rnd).up) ups++;
  ok(Math.abs(ups / N - 0.5) < 4 * Math.sqrt(0.25 / N), 'atoms straight from the oven come out up half the time, whatever the magnet\'s angle');
}
// 4. rows of analyzers
{
  const rows = [
    [{ a: 0, pass: 'up' }, { a: 0, pass: 'both' }],
    [{ a: 0, pass: 'up' }, { a: 90 * D2R, pass: 'both' }],
    [{ a: 0, pass: 'up' }, { a: 90 * D2R, pass: 'up' }, { a: 0, pass: 'both' }],
    [{ a: 0, pass: 'up' }, { a: 60 * D2R, pass: 'down' }, { a: -45 * D2R, pass: 'both' }],
    [{ a: 30 * D2R, pass: 'both' }, { a: 120 * D2R, pass: 'up' }, { a: 0, pass: 'both' }]
  ];
  let wsum = 0, wmc = 0;
  rows.forEach(row => {
    const ex = P.expected(row), tot = ex.reduce((s, e) => s + e.frac, 0); wsum = Math.max(wsum, Math.abs(tot - 1));
    const N = 200000, cnt = {}; for (let i = 0; i < N; i++) { const r = P.runAtom(row, rnd), key = r.k + (r.up ? '+' : '-'); cnt[key] = (cnt[key] || 0) + 1; }
    ex.forEach(e => { const c = (cnt[e.k + (e.up ? '+' : '-')] || 0) / N; wmc = Math.max(wmc, Math.abs(c - e.frac) / Math.sqrt(e.frac * (1 - e.frac) / N + 1e-12)); });
  });
  ok(wsum < 1e-12, 'every atom ends at some counter: the fractions always add to 1');
  ok(wmc < 4.5, 'five rows of analyzers: 200,000 simulated atoms land at each counter in the expected proportions (worst ' + wmc.toFixed(1) + ' standard deviations)');
  let wf = 0; rows.forEach(row => { const f = P.flows(row), ex = P.expected(row), n = row.length - 1;
    wf = Math.max(wf, Math.abs(f[n].up - (ex.find(e => e.k === n && e.up) || { frac: 0 }).frac), Math.abs(f[n].down - (ex.find(e => e.k === n && !e.up) || { frac: 0 }).frac));
    for (let k = 0; k < n; k++) { const passed = (row[k].pass !== 'down' ? f[k].up : 0) + (row[k].pass !== 'up' ? f[k].down : 0); wf = Math.max(wf, Math.abs(f[k].in - f[k].up - f[k].down), Math.abs(passed - f[k + 1].in)); } });
  ok(wf < 1e-15, 'the beam strengths drawn on screen add up: what enters each magnet leaves it, what is passed on enters the next, and the last magnet\'s exits match the counters');
  const zz = P.expected(rows[0]), zxz = P.expected(rows[2]);
  ok(zz.find(e => e.k === 1 && !e.up).frac === 0 && Math.abs(zz.find(e => e.k === 1 && e.up).frac - 0.5) < 1e-15, 'z then z: every atom that came out up comes out up again');
  ok(Math.abs(zxz.find(e => e.k === 2 && e.up).frac - 0.125) < 1e-15 && Math.abs(zxz.find(e => e.k === 2 && !e.up).frac - 0.125) < 1e-15, 'z, then x, then z: the z-down atoms come back, 1/8 of the beam each way: measuring x erased the z result');
  const keepBoth = P.expected([{ a: 0, pass: 'up' }, { a: 90 * D2R, pass: 'both' }, { a: 0, pass: 'both' }]);
  ok(Math.abs(keepBoth.find(e => e.k === 2 && e.up).frac - 0.25) < 1e-15, 'and passing both x beams on still gives z-down atoms: each atom was measured along x, whichever way it went');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
