// Colliding carts: momentum at every instant, the energy books (kinetic + held in the bumpers + heat) at every
// instant, the coefficient of restitution of each bumper whatever the masses and speeds, final speeds against the
// textbook formula, a pad collision against a separate integration, the magnets never touching, Velcro sticking,
// the impulse, and the center-of-mass frame.
const P = require('./load.js')('collisions');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const CASES = [[0.5, 0.5, 0.6, 0], [0.25, 1.25, 1, -0.5], [1.25, 0.25, 0.4, -1], [0.75, 0.5, 0.4, 0.1], [1.25, 1.25, 1, -1]];
const run = (bumper, c, stop) => P.collide({ mA: c[0], mB: c[1], vA: c[2], vB: c[3], xA: 0.55, xB: 1.85, bumper }, { stopWhenApart: stop !== false });
const R = {}; ['magnet', 'spring', 'rubber', 'velcro'].forEach(b => { R[b] = CASES.map(c => run(b, c, b !== 'magnet')); });

// 1. momentum and energy, every sample, every bumper
{
  let wp = 0, wE = 0;
  Object.keys(R).forEach(b => R[b].forEach((r, j) => { const [mA, mB, vA, vB] = CASES[j], p0 = P.momentum(mA, mB, vA, vB);
    for (let i = 0; i < r.t.length; i++) { wp = Math.max(wp, Math.abs(P.momentum(mA, mB, r.vA[i], r.vB[i]) - p0) / (Math.abs(p0) + mA * Math.abs(vA))); wE = Math.max(wE, Math.abs(P.kinetic(mA, mB, r.vA[i], r.vB[i]) + r.stored[i] + r.lost[i] - r.E0) / r.E0); } }));
  ok(wp < 1e-12, 'total momentum is the same at every instant, during the squeeze too, for every bumper (worst ' + wp.toExponential(1) + ')');
  ok(wE < 1e-6, 'kinetic energy + energy held in the bumpers + heat = the starting kinetic energy at every instant (worst ' + wE.toExponential(1) + ')');
}
// 2. what comes out: restitution and final speeds
{
  ['spring', 'rubber'].forEach(b => {
    let lo = 9, hi = -9, wv = 0;
    R[b].forEach((r, j) => { const [mA, mB, vA, vB] = CASES[j], n = r.t.length - 1, e = (r.vB[n] - r.vA[n]) / (vA - vB), tb = P.textbook(mA, mB, vA, vB, P.BUMPERS[b].e);
      lo = Math.min(lo, e); hi = Math.max(hi, e); wv = Math.max(wv, Math.abs(r.vA[n] - tb.vA), Math.abs(r.vB[n] - tb.vB)); });
    ok(Math.abs(lo - P.BUMPERS[b].e) < 2e-4 && hi - lo < 2e-4 && wv < 2e-4, P.BUMPERS[b].name + ': the carts separate at ' + P.BUMPERS[b].e + ' of their closing speed in all five cases, and end at the textbook speeds (within ' + (wv * 1000).toFixed(2) + ' mm/s)');
  });
  let wv = 0, wl = 0, together = 0;
  R.velcro.forEach((r, j) => { const [mA, mB, vA, vB] = CASES[j], n = r.t.length - 1, V = P.vCM(mA, mB, vA, vB), mu = mA * mB / (mA + mB);
    wv = Math.max(wv, Math.abs(r.vA[n] - V), Math.abs(r.vB[n] - V)); wl = Math.max(wl, Math.abs(r.lost[n] + r.stored[n] - 0.5 * mu * (vA - vB) ** 2) / (0.5 * mu * (vA - vB) ** 2)); });
  ok(wv < 1e-6, 'Velcro: the carts end up moving together at the center of mass\'s speed (P / M)');
  ok(wl < 1e-5, 'and the kinetic energy lost is exactly (1/2) mu (relative speed)^2, all of the energy of the relative motion');
  let we = 0, minGap = 9;
  R.magnet.forEach((r, j) => { const [mA, mB, vA, vB] = CASES[j], n = r.t.length - 1, tb = P.textbook(mA, mB, vA, vB, 1), scale = Math.abs(vA - vB);
    we = Math.max(we, Math.abs(r.vA[n] - tb.vA) / scale, Math.abs(r.vB[n] - tb.vB) / scale);
    for (let i = 0; i < r.t.length; i++) minGap = Math.min(minGap, r.xB[i] - r.xA[i] - P.CART.L); });
  let wr = 0; R.magnet.forEach((r, j) => { const [mA, mB, vA, vB] = CASES[j], n = r.t.length - 1, mu = mA * mB / (mA + mB);
    wr = Math.max(wr, Math.abs(0.5 * mu * (r.vB[n] - r.vA[n]) ** 2 + r.stored[n] - 0.5 * mu * (vB - vA) ** 2 - r.stored[0]) / (0.5 * mu * (vB - vA) ** 2)); });
  ok(we < 0.01 && wr < 1e-6, 'magnets: nothing is lost; the carts separate as fast as they closed, once the field\'s faint far reach is counted, and end within ' + (we * 100).toFixed(2) + '% of the textbook elastic speeds');
  ok(minGap > 0.002, 'the magnets never touch, even at the hardest collision here: closest ' + (minGap * 1000).toFixed(1) + ' mm');
  const eq = R.magnet[0], n = eq.t.length - 1;
  ok(Math.abs(eq.vA[n]) < 0.002 && Math.abs(eq.vB[n] - 0.6) < 0.002, 'equal masses, elastic, one at rest: the moving cart stops and the other leaves with its speed');
}
// 2b. the bumpers are what the screen says they are, and pads only ever push
{
  ok(P.BUMPERS.magnet.e === 1 && P.BUMPERS.spring.e === 0.85 && P.BUMPERS.rubber.e === 0.5, 'the bumpers return 1, 0.85 and 0.5 of the closing speed (magnets, springs, rubber), as the notes say');
  let minF = 0; ['spring', 'rubber', 'velcro'].forEach(b => R[b].forEach(r => { if (b !== 'velcro') r.F.forEach(F => { minF = Math.min(minF, F); }); }));
  ok(minF >= 0, 'springs and rubber pads push but never pull: the force between the carts is never negative');
}
// 3. a pad collision integrated separately: semi-implicit Euler with a tiny step, contact from first touch to release
{
  let w = 0;
  [['spring', CASES[1]], ['rubber', CASES[2]]].forEach(([b, c]) => {
    const B = P.BUMPERS[b], [mA, mB] = c, mu = mA * mB / (mA + mB), k = B.k, cc = 2 * B.zeta * Math.sqrt(k * mu);
    let va = c[2], vb = c[3], x = 0; const dt = 1e-7;
    for (let i = 0; i < 1e7; i++) { const xd = va - vb, F = Math.max(0, k * x + cc * xd); va -= F / mA * dt; vb += F / mB * dt; x += (va - vb) * dt; if (x <= 0 && va - vb < 0) break; if (F <= 0 && va - vb < 0 && i > 10) break; }
    const r = run(b, c), n = r.t.length - 1; w = Math.max(w, Math.abs(r.vA[n] - va), Math.abs(r.vB[n] - vb));
  });
  ok(w < 2e-4, 'two pad collisions match a separate, much finer integration of the contact (within ' + (w * 1000).toFixed(3) + ' mm/s)');
  const r = R.spring[0], mu = 0.25, tc = r.last - r.first, T = Math.PI * Math.sqrt(mu / P.BUMPERS.spring.k);
  ok(Math.abs(tc / T - 1) < 0.08, 'the springs\' squeeze lasts ' + (tc * 1000).toFixed(1) + ' ms, close to half an oscillation, pi sqrt(mu / k) = ' + (T * 1000).toFixed(1) + ' ms');
  // the impulse: the force over time equals each cart's change in momentum
  let J = 0; for (let i = 1; i < r.t.length; i++) J += (r.F[i] + r.F[i - 1]) / 2 * (r.t[i] - r.t[i - 1]);
  const n = r.t.length - 1;
  ok(Math.abs(J / (0.5 * r.vB[n]) - 1) < 0.01 && Math.abs(J / (0.5 * (0.6 - r.vA[n])) - 1) < 0.01, 'the area under the force is the impulse: each cart\'s change in momentum, equal and opposite');
}
// 4. the center-of-mass frame
{
  let wk = 0, wz = 0, wloss = 0;
  Object.keys(R).forEach(b => R[b].forEach((r, j) => { const [mA, mB, vA, vB] = CASES[j], V = P.vCM(mA, mB, vA, vB), M = mA + mB;
    for (let i = 0; i < r.t.length; i += 7) { const ka = P.kinetic(mA, mB, r.vA[i], r.vB[i]), kc = P.kinetic(mA, mB, r.vA[i] - V, r.vB[i] - V);
      wk = Math.max(wk, Math.abs(ka - kc - 0.5 * M * V * V)); wz = Math.max(wz, Math.abs(P.momentum(mA, mB, r.vA[i] - V, r.vB[i] - V))); }
    if (b === 'velcro') { const n = r.t.length - 1; wloss = Math.max(wloss, Math.abs(P.kinetic(mA, mB, r.vA[n] - V, r.vB[n] - V))); } }));
  ok(wz < 1e-12, 'riding with the center of mass, the total momentum is zero at every instant: the carts\' momenta are always equal and opposite');
  ok(wk < 1e-12, 'kinetic energy in the lab = kinetic energy seen from the center of mass + (1/2) M V^2, at every instant');
  ok(wloss < 1e-10, 'Velcro takes away all the kinetic energy seen from the center of mass: both carts end at rest in that frame');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
