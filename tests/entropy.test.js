// Entropy: counting against exact whole-number arithmetic; Einstein solids against brute-force enumeration and
// Vandermonde's identity; the random energy hops against the exact odds; the colliding-disk gas against the laws of
// elastic collisions, energy conservation, the thermal (Maxwell) speed distribution it should settle into, the
// even split it should fluctuate about, and exact reversibility, which one nudge of a billionth destroys.
const E = require('./load.js')('entropy');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);

// 1. counting, against exact whole numbers (BigInt)
(function () { const fact = n => { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return f; };
  const lnBig = b => { const s = b.toString(); return Math.log(Number('0.' + s.slice(0, 17))) + s.length * Math.LN10; };
  let worst = 0; for (const n of [0, 1, 2, 10, 100, 255, 256, 257, 300, 1000, 2000]) worst = Math.max(worst, Math.abs(E.lnFact(n) - (n < 2 ? 0 : lnBig(fact(n)))) / Math.max(1, E.lnFact(n)));
  ok(worst < 1e-13, 'ln n! against exact factorials up to 2000! (relative error ' + worst.toExponential(1) + ')');
  const C = (n, k) => fact(n) / (fact(k) * fact(n - k));
  ok([[4, 2, 6n], [10, 5, 252n], [20, 10, 184756n]].every(([n, k, v]) => C(n, k) === v && Math.abs(Math.exp(E.lnChoose(n, k)) - Number(v)) < 1e-6 * Number(v)), 'ways to put n of N molecules on the left: 4 → 6 ways for 2–2, 10 → 252 for 5–5, 20 → 184 756 for 10–10');
  ok(Math.abs(E.lnWays(1000, 500) - lnBig(C(1000, 500))) < 1e-9 && E.lnChoose(5, 6) === -Infinity && E.lnChoose(5, -1) === -Infinity, 'ways for 500–500 of 1000 molecules: e^' + E.lnWays(1000, 500).toFixed(2) + ' (exact); impossible splits have none'); })();
ok(E.tenPow(Math.log(2) * 100).e === 30 && Math.abs(E.tenPow(Math.log(2) * 100).m - 1.2677) < 1e-3 && E.tenPow(Math.log(5)).e === 0, 'writing big numbers: 2^100 = 1.27 × 10^30');

// 2. Einstein solids
(function () { const brute = (N, q) => { if (N === 1) return 1; let s = 0; for (let k = 0; k <= q; k++) s += brute(N - 1, q - k); return s; };
  ok([[3, 3, 10], [4, 2, 10], [1, 5, 1], [5, 0, 1], [6, 6, 462]].every(([N, q, v]) => brute(N, q) === v && Math.abs(Math.exp(E.lnOmegaSolid(N, q)) - v) < 1e-9 * v), 'Einstein solid: ways to share q packets among N oscillators match listing them all (3 oscillators, 3 packets: 10 ways)');
  // Vandermonde: every split of A and B together, summed, is the combined solid's count
  const NA = 300, NB = 200, q = 100, sp = E.splits(NA, NB, q), mx = Math.max(...sp.map(s => s.t)); let sum = 0; sp.forEach(s => sum += Math.exp(s.t - mx));
  ok(Math.abs(Math.log(sum) + mx - E.lnOmegaSolid(NA + NB, q)) < 1e-9, 'all the splits together add up to the combined solid: ln Ω = ' + E.lnOmegaSolid(NA + NB, q).toFixed(3));
  const best = sp.reduce((a, b) => b.t > a.t ? b : a);
  ok(Math.abs(best.qA - q * NA / (NA + NB)) <= 1, '300 and 200 oscillators sharing 100 packets: most likely split ' + best.qA + '–' + (q - best.qA) + ' (in proportion to size: 60–40)');
  ok(Math.abs(E.tempSolid(NA, best.qA) - E.tempSolid(NB, q - best.qA)) / E.tempSolid(NA, best.qA) < 0.02, 'at the most likely split, the two temperatures are equal');
  // temperature: 1/T = dS/dq, against the slope of the exact ln Ω for a big solid
  const N = 5000, qq = 3000, slope = (E.lnOmegaSolid(N, qq + 1) - E.lnOmegaSolid(N, qq - 1)) / 2;
  ok(near(E.tempSolid(N, qq), 1 / slope, 1e-3) && E.tempSolid(10, 0) === 0, 'temperature: 1 / (slope of ln Ω against energy) for 5000 oscillators, kT/ε = ' + E.tempSolid(N, qq).toFixed(3) + '; zero with no energy'); })();
// the random hops: a tiny pair of solids, run long, against the exact odds of each split
(function () { const NA = 2, NB = 3, q = 4, st = new Int32Array(NA + NB); st[0] = 4; const rand = E.mulberry(7), cnt = new Array(q + 1).fill(0), T = 2e6;
  for (let i = 0; i < T; i++) { E.hop(st, rand); cnt[st[0] + st[1]]++; }
  const sp = E.splits(NA, NB, q), tot = Math.exp(E.lnOmegaSolid(NA + NB, q)); let worst = 0;
  sp.forEach(s => worst = Math.max(worst, Math.abs(cnt[s.qA] / T - Math.exp(s.t) / tot)));
  ok(worst < 0.004, 'random hops visit every arrangement equally often: splits of 4 packets between 2 and 3 oscillators match the exact odds (worst ' + (100 * worst).toFixed(2) + '%)');
  ok(st.reduce((a, b) => a + b, 0) === q && Math.min(...st) >= 0, 'hops never create or destroy energy, and never go negative');
  const z = new Int32Array(4); ok(E.hop(z, () => 0.5) === null && z.every(v => v === 0), 'an oscillator with no energy has none to give'); })();

// 3. the gas
const G = E.GAS, vel = E.velocity;
// two disks head-on: equal masses swap velocities; at an angle they leave at right angles; momentum and energy kept
(function () { const g = E.makeGas(2, { seed: 1, r: 0.03, wall: false }); const Q = G.Q, dt = G.dt;
  const set = (i, x, y, vx, vy) => { g.x[i] = Math.round(x * Q); g.y[i] = Math.round(y * Q); g.px[i] = g.x[i] - Math.round(vx * dt * Q); g.py[i] = g.y[i] - Math.round(vy * dt * Q); };
  set(0, 0.8, 0.5, 1, 0); set(1, 1.2, 0.5, -0.5, 0); E.stepGas(g, 2500);
  const a = vel(g, 0), b = vel(g, 1); ok(Math.abs(a[0] + 0.5) < 0.005 && Math.abs(b[0] - 1) < 0.005, 'head-on: the disks swap velocities (' + a[0].toFixed(3) + ', ' + b[0].toFixed(3) + ')');
  set(0, 0.7, 0.5, 1, 0); set(1, 1.2, 0.5 + 0.03, 0, 0); E.stepGas(g, 3000);
  const c = vel(g, 0), d = vel(g, 1), dot = c[0] * d[0] + c[1] * d[1], ke = c[0] ** 2 + c[1] ** 2 + d[0] ** 2 + d[1] ** 2;
  ok(Math.abs(c[0] + d[0] - 1) < 0.003 && Math.abs(c[1] + d[1]) < 0.003 && Math.abs(ke - 1) < 0.005 && Math.abs(dot) < 0.005 && Math.hypot(...d) > 0.3, 'glancing: momentum and energy kept, and the disks leave at right angles'); })();
// a wall: bounces straight back at the same speed
(function () { const g = E.makeGas(1, { seed: 1, r: 0.03 }); g.x[0] = Math.round(0.2 * G.Q); g.px[0] = g.x[0] + Math.round(0.8 * G.dt * G.Q); g.y[0] = g.py[0] = Math.round(0.5 * G.Q); E.stepGas(g, 2000);
  ok(Math.abs(vel(g, 0)[0] - 0.8) < 0.003 && g.x[0] > 0.03 * G.Q, 'a wall sends a disk straight back at the same speed'); })();
// the partition keeps them in, until it is taken out
(function () { const g = E.makeGas(200, { seed: 2 }); E.stepGas(g, 6000); ok(E.countLeft(g) === 200 && g.placed === 200, 'with the partition in, all 200 stay on the left');
  g.wall = false; E.stepGas(g, 6000); ok(E.countLeft(g) < 170, 'partition out: they spread (' + E.countLeft(g) + ' still on the left after 6000 steps)'); })();
// energy is conserved by the stepping
(function () { const g = E.makeGas(300, { seed: 4, wall: false }); E.stepGas(g, 10); const e0 = E.energy(g); let worst = 0;
  for (let i = 0; i < 20; i++) { E.stepGas(g, 500); worst = Math.max(worst, Math.abs(E.energy(g) / e0 - 1)); }
  ok(worst < 0.02, '300 disks, 10 000 steps: energy (motion plus squeezed overlaps) within ' + (100 * worst).toFixed(2) + '% of the start'); })();
// collisions turn equal speeds into the thermal distribution: in 2D, P(speed < v) = 1 - exp(-v^2 / vrms^2)
(function () { const g = E.makeGas(400, { seed: 5, same: true, wall: false, box: [0, 0, 2, 1] }); E.stepGas(g, 20000);
  const sp = []; for (let i = 0; i < g.N; i++) sp.push(Math.hypot(...vel(g, i))); const vr = Math.sqrt(sp.reduce((a, b) => a + b * b, 0) / sp.length);
  let worst = 0; [0.5, 1, 1.5].forEach(f => { const frac = sp.filter(s => s < f * vr).length / sp.length; worst = Math.max(worst, Math.abs(frac - (1 - Math.exp(-f * f)))); });
  ok(worst < 0.05, 'all starting at the same speed, collisions spread the speeds into the thermal (Maxwell) distribution (worst ' + (100 * worst).toFixed(1) + '%)'); })();
// the long-run split: about half on each side, wandering by about 1/(2 sqrt N)
// For points, counting predicts a spread of 1/(2 sqrt N); disks take up room, which evens out the crowding a little:
// the spread shrinks by the square root of S(0) = 1 / d(phi Z)/d phi, with Z from Henderson's equation of state for disks
(function () { const N = 40, g = E.makeGas(N, { seed: 6 }); g.wall = false; E.stepGas(g, 15000); const f = [];
  for (let i = 0; i < 1500; i++) { E.stepGas(g, 500); f.push(E.countLeft(g) / N); }
  const m = f.reduce((a, b) => a + b, 0) / f.length, sd = Math.sqrt(f.reduce((a, b) => a + (b - m) ** 2, 0) / f.length);
  const phi = N * Math.PI * g.r * g.r / (G.W * G.H), Z = p => (1 + p * p / 8) / (1 - p) ** 2, dp = 1e-6, S0 = 2 * dp / ((phi + dp) * Z(phi + dp) - (phi - dp) * Z(phi - dp)), want = 0.5 / Math.sqrt(N) * Math.sqrt(S0);
  ok(Math.abs(m - 0.5) < 0.02 && Math.abs(sd / want - 1) < 0.15, '40 molecules, long run: ' + (100 * m).toFixed(1) + '% on the left on average, wandering by ' + (100 * sd).toFixed(1) + '% (points: ' + (50 / Math.sqrt(N)).toFixed(1) + '%; disks this size: ' + (100 * want).toFixed(1) + '%)'); })();
// exact reversal, and what a nudge does
(function () { const run = (nudge, steps) => { const g = E.makeGas(200, { seed: 9 }); g.wall = false;
    const x0 = Float64Array.from(g.x), y0 = Float64Array.from(g.y); E.stepGas(g, steps); if (nudge) { g.x[0] += 1; g.px[0] += 1; }
    E.reverseGas(g); E.stepGas(g, steps); let same = 0, err = 0; for (let i = 0; i < g.N; i++) { if (g.px[i] === x0[i] && g.py[i] === y0[i]) same++; err = Math.max(err, Math.hypot(g.px[i] - x0[i], g.py[i] - y0[i]) / G.Q); }
    let back = 0; for (let i = 0; i < g.N; i++) if (Math.hypot(g.px[i] - x0[i], g.py[i] - y0[i]) < 0.01 * G.Q) back++; return { same, err, back, steps: g.steps }; };
  const a = run(false, 8000); ok(a.same === 200 && a.steps === 0, 'reverse every velocity after 8000 steps: 8000 steps later every one of 200 molecules is back exactly where it started, to the last digit');
  const b = run(true, 8000); ok(b.back < 100 && b.err > 0.1, 'nudge one molecule by a billionth of the box first: they don\'t go back (only ' + b.back + ' of 200 end up within 1% of the box from where they started)');
  const c = run(true, 300); ok(c.err < 1e-4, 'reversed quickly, the same nudge barely matters (worst miss ' + c.err.toExponential(1) + ' of the box): its effect grows with every collision'); })();
ok(E.diskRadius(1000) < 0.009 && E.diskRadius(2) === 0.03 && Math.abs(1000 * Math.PI * E.diskRadius(1000) ** 2 - 0.22) < 1e-9, 'disk size: up to 0.03 of the box, smaller for crowds so 1000 cover 22% of the left half');

// constants: Boltzmann's constant (exact, SI 2019); the box 2 by 1; the position unit 1/2^30 of the height ("a billionth")
ok(E.KB === 1.380649e-23 && E.GAS.W === 2 && E.GAS.H === 1 && E.GAS.Q === 2 ** 30 && Math.abs(1 / E.GAS.Q - 9.3e-10) < 1e-11, 'Boltzmann\'s constant 1.380649 × 10⁻²³ J/K; box 2 × 1; positions in steps of 1/2³⁰ ≈ 0.93 billionths');
(function () { const sp = E.splits(3, 4, 5); ok(sp.length === 6 && sp[0].qA === 0 && sp[5].qA === 5 && Math.abs(Math.exp(sp[0].b) - 56) < 1e-9 && Math.abs(Math.exp(sp[5].a) - 21) < 1e-9, 'splits of 5 packets: every one from 0 to 5 in A; all 5 in B (4 oscillators): 56 ways; all 5 in A (3): 21 ways'); })();
ok(Math.abs(E.tempSolid(10, 1) - 1 / Math.log(11)) < 1e-12, 'one packet in 10 oscillators: kT/ε = 1/ln 11');
// a fresh gas: inside its box, not overlapping, moving in all directions with rms speed 1, and no net drift
(function () { const g = E.makeGas(1000, { seed: 11 }), Q = E.GAS.Q; let inside = true, overlap = 0, v2 = 0, mx = 0, my = 0; const quad = [0, 0, 0, 0];
  for (let i = 0; i < g.N; i++) { const x = g.x[i] / Q, y = g.y[i] / Q; if (x < g.r || x > 1 - g.r || y < g.r || y > 1 - g.r) inside = false;
    const v = E.velocity(g, i); v2 += v[0] ** 2 + v[1] ** 2; mx += v[0]; my += v[1]; quad[(v[0] > 0 ? 1 : 0) + (v[1] > 0 ? 2 : 0)]++;
    for (let j = 0; j < i; j++) if (Math.hypot(g.x[j] / Q - x, g.y[j] / Q - y) < 2 * g.r) overlap++; }
  ok(inside && overlap === 0 && g.placed === 1000, '1000 molecules placed inside the left half, none overlapping');
  ok(Math.abs(Math.sqrt(v2 / g.N) - 1) < 0.04 && Math.hypot(mx, my) / g.N < 0.06 && quad.every(c => c > 210 && c < 290), 'their speeds: rms 1 box height per unit of time, in every direction equally (' + quad.join(', ') + ' per quarter)'); })();
(function () { const g = E.makeGas(5, { seed: 1 }); E.stepGas(g, 10); E.stepGas(g); const a = g.steps; E.reverseGas(g); E.stepGas(g, 4); ok(a === 11 && g.steps === 7, 'the step counter: forward 11, then back 4'); })();
// the partition is a wall: a disk bounces off it with its edge touching (barely squeezed), from either side
(function () { const Q = E.GAS.Q, dt = E.GAS.dt; let lo = 9, hi = -9;
  const g = E.makeGas(1, { seed: 1, r: 0.03 }); g.y[0] = g.py[0] = Math.round(0.5 * Q); g.x[0] = Math.round(0.8 * Q); g.px[0] = g.x[0] - Math.round(0.8 * dt * Q);
  for (let i = 0; i < 2000; i++) { E.stepGas(g, 1); hi = Math.max(hi, g.x[0] / Q); }
  const h = E.makeGas(1, { seed: 1, r: 0.03 }); h.y[0] = h.py[0] = Math.round(0.5 * Q); h.x[0] = Math.round(1.2 * Q); h.px[0] = h.x[0] + Math.round(0.8 * dt * Q);
  for (let i = 0; i < 2000; i++) { E.stepGas(h, 1); lo = Math.min(lo, h.x[0] / Q); }
  const sq = 0.8 / Math.sqrt(E.GAS.k);   // a spring's largest squeeze: speed / angular frequency
  ok(Math.abs(hi - 0.97 - sq) < 0.05 * sq && Math.abs(1.03 - lo - sq) < 0.05 * sq && Math.abs(E.velocity(g, 0)[0] + 0.8) < 0.003 && Math.abs(E.velocity(h, 0)[0] - 0.8) < 0.003, 'the partition: a disk bounces back off either face, squeezing in by ' + ((hi - 0.97) * 1000).toFixed(2) + ' and ' + ((1.03 - lo) * 1000).toFixed(2) + ' thousandths (a spring predicts ' + (sq * 1000).toFixed(2) + ')'); })();
// energy, in absolute terms: motion ½v²; a squeeze of s against a wall or another disk ½ k s²
(function () { const Q = E.GAS.Q, k = E.GAS.k, r = 0.03, s = 0.002, w = 0.5 * k * s * s;
  const at = (pts, wall) => { const g = E.makeGas(pts.length, { seed: 1, r, wall }); pts.forEach((p, i) => { g.x[i] = g.px[i] = Math.round(p[0] * Q); g.y[i] = g.py[i] = Math.round(p[1] * Q); }); return g; };
  const m = at([[0.5, 0.5]], false); m.px[0] = m.x[0] - Math.round(0.6 * E.GAS.dt * Q);
  const cases = [[at([[0.5, 0.5], [0.5 + 2 * r - s, 0.5]], false), w], [at([[r - s, 0.5]], false), w], [at([[2 - r + s, 0.5]], false), w], [at([[0.5, r - s]], false), w], [at([[0.5, 1 - r + s]], false), w], [at([[1 - r + s, 0.5]], true), w], [at([[1 + r - s, 0.5]], true), w], [at([[1 - r + s, 0.5]], false), 0], [at([[0.3, 0.5], [0.5, 0.5]], false), 0]];
  ok(Math.abs(E.energy(m) - 0.18) < 1e-6 && cases.every(([g, want]) => Math.abs(E.energy(g) - want) < 1e-6 * Math.max(1, want)), 'energy: ½v² for a moving disk; ½ k s² for a squeeze against each wall, each face of the partition, or another disk; nothing for the partition once removed'); })();

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
