// Quantum tunneling: the barrier solution against the textbook transmission formula and the Schrodinger equation
// itself; probability conserved; the thick-barrier exponential; the Crank-Nicolson packet against the plane-wave
// result averaged over the packet's spread of energies (and converging as the grid is refined); free-packet motion
// and spreading against the exact formulas; the STM's factor per tenth of a nanometer; and the Gamow model of alpha
// decay against its closed form and against measured half-lives over 24 orders of magnitude.
const P = require('./load.js')('tunneling');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
// 1. the steady wave
{
  let wT = 0, wRT = 0, wc = 0, wse = 0;
  const cases = []; [0.5, 1.5, 3, 4.99, 5.01, 6, 9].forEach(E => [2, 5, 8].forEach(V => [0.1, 0.3, 0.7].forEach(a => cases.push([E, V, a]))));
  cases.forEach(([E, V, a]) => {
    const w = P.waveOn(E, V, a), T = P.transmission(E, V, a);
    wT = Math.max(wT, Math.abs(w.T / T - 1)); wRT = Math.max(wRT, Math.abs(w.T + w.R - 1));
    const h = 1e-6, d = x => { const p = w.psi(x + h), m = w.psi(x - h); return [(p[0] - m[0]) / (2 * h), (p[1] - m[1]) / (2 * h)]; };
    [0, a].forEach(x => { const l = w.psi(x - 1e-12), r = w.psi(x + 1e-12), dl = d(x - 3e-6), dr = d(x + 3e-6);
      wc = Math.max(wc, Math.hypot(l[0] - r[0], l[1] - r[1]) / (Math.hypot(...l) + 1e-9) / 1e-9, Math.hypot(dl[0] - dr[0], dl[1] - dr[1]) / ((Math.hypot(...dl) + w.k * Math.hypot(...l)) * 1e-3)); });   // both relative jumps, in units of their tolerances
    // -H2M psi'' + V psi = E psi, checked by finite differences in each region
    [-0.4, a / 2, a + 0.4].forEach(x => { const hh = 1e-4, p = w.psi(x), pp = w.psi(x + hh), pm = w.psi(x - hh), Vx = x >= 0 && x <= a ? V : 0;
      const lap = [(pp[0] - 2 * p[0] + pm[0]) / (hh * hh), (pp[1] - 2 * p[1] + pm[1]) / (hh * hh)];
      wse = Math.max(wse, Math.hypot(-P.H2M * lap[0] + (Vx - E) * p[0], -P.H2M * lap[1] + (Vx - E) * p[1]) / (E * Math.hypot(...p) + 1e-3)); });
  });
  ok(wT < 1e-9, cases.length + ' cases, below and above the barrier top: the solution\'s transmission matches the textbook formula');
  ok(wRT < 1e-9, 'transmitted + reflected = 1 in every case: the electron goes somewhere');
  ok(wc < 1, 'the wave and its slope are continuous at both edges of the barrier');
  ok(wse < 1e-4, 'and it satisfies the Schrodinger equation in each region (checked by finite differences)');
  const w = P.waveOn(5, 5, 0.3), T0 = 1 / (1 + 5 * 0.09 / (4 * P.H2M));
  ok(Math.abs(w.T + w.R - 1) < 1e-6 && Math.abs(w.T / T0 - 1) < 1e-6, 'right at the top of the barrier (E = V0) it takes the limiting value 1 / (1 + V0 a^2 / 4 H2M)');
  let wthick = 0; [[2, 5, 0.6], [1, 8, 0.8], [4, 6, 0.9]].forEach(([E, V, a]) => { const k = Math.sqrt((V - E) / P.H2M), approx = 16 * E * (V - E) / (V * V) * Math.exp(-2 * k * a); wthick = Math.max(wthick, Math.abs(P.waveOn(E, V, a).T / approx - 1)); });
  ok(wthick < 0.01, 'for a thick barrier, T is 16 (E/V0)(1 - E/V0) e^{-2 kappa a}: falling exponentially with width');
  ok(Math.abs(P.waveOn(2, 5, 0.4).T / P.waveOn(2, 5, 0.3).T / Math.exp(-2 * Math.sqrt(3 / P.H2M) * 0.1) - 1) < 0.01, 'a tenth of a nanometer more width cuts T by e^{-2 kappa (0.1 nm)}, about ' + (1 / Math.exp(-2 * Math.sqrt(3 / P.H2M) * 0.1)).toFixed(1) + ' times for 3 eV below the top');
}
// 2. the packet
{
  const run = (N, dt) => { const g = P.makeGrid(-25, 25, N, x => x >= 0 && x <= 0.3 ? 5 : 0), k0 = Math.sqrt(4 / P.H2M), st = P.makeStepper(g, dt), pk = P.packet(g, -8, 1.2, k0);
    let wn = 0; for (let n = 0; n < 18 / dt; n++) { st(pk.pr, pk.pi); if (n % 500 === 0) wn = Math.max(wn, Math.abs(P.probIn(g, pk, -26, 26) - 1)); }
    return { T: P.probIn(g, pk, 0.3, 26), R: P.probIn(g, pk, -26, 0), wn, k0 }; };
  const a = run(4001, 0.004), b = run(8001, 0.004), Tx = P.packetT(a.k0, 1.2, 5, 0.3);
  ok(a.wn < 1e-12, 'the total probability stays 1 at every step (to ' + a.wn.toExponential(1) + ')');
  ok(Math.abs(a.T / Tx - 1) < 0.01, 'a packet at 4 eV on a 5 eV, 0.3 nm barrier: ' + (100 * a.T).toFixed(2) + '% gets through, against ' + (100 * Tx).toFixed(2) + '% from the plane-wave result averaged over its energies');
  ok(Math.abs(b.T / Tx - 1) < Math.abs(a.T / Tx - 1) / 3, 'and halving the grid spacing brings it ' + (Math.abs(a.T / Tx - 1) / Math.abs(b.T / Tx - 1)).toFixed(1) + ' times closer, as it should');
  ok(Math.abs(a.T / P.transmission(4, 5, 0.3) - 1) > 0.02, 'which differs from the single-energy value (' + (100 * P.transmission(4, 5, 0.3)).toFixed(2) + '%): the faster parts of the packet get through more easily');
  // a free packet: moves at hbar k / m and spreads as sigma sqrt(1 + (hbar t / 2 m sigma^2)^2)
  const g = P.makeGrid(-25, 25, 4001, () => 0), k0 = 10, s0 = 0.8, st = P.makeStepper(g, 0.004), pk = P.packet(g, -10, s0, k0), T = 8;
  for (let n = 0; n < T / 0.004; n++) st(pk.pr, pk.pi);
  let m1 = 0, m2 = 0; for (let i = 0; i < g.N; i++) { const p = (pk.pr[i] ** 2 + pk.pi[i] ** 2) * g.dx; m1 += p * g.xs[i]; m2 += p * g.xs[i] ** 2; }
  const v = 2 * P.H2M * k0 / P.HBAR, sd = Math.sqrt(m2 - m1 * m1), sx = s0 * Math.sqrt(1 + (P.H2M * T / (P.HBAR * s0 * s0)) ** 2);
  ok(Math.abs((m1 + 10) / (v * T) - 1) < 0.003 && Math.abs(sd / sx - 1) < 0.003, 'a free packet moves at hbar k / m = ' + v.toFixed(2) + ' nm/fs and spreads from ' + s0 + ' to ' + sx.toFixed(2) + ' nm in ' + T + ' fs, as the exact solution says');
}
// 2b. the constants
{
  const hc = 197.3269804, mc2 = 510998.950, c = 299.792458;      // eV nm, eV, nm/fs
  ok(Math.abs(P.H2M / (hc * hc / (2 * mc2)) - 1) < 1e-5 && Math.abs(P.HBAR * c / hc - 1) < 1e-6, 'the constants: hbar^2/2m = 0.0381 eV nm^2 and hbar = 0.658 eV fs, from hbar c = 197.327 eV nm and an electron\'s 511 keV');
}
// 3. where it matters
{
  const f = P.stmCurrent(0.5, 1, 0.5) / P.stmCurrent(0.6, 1, 0.5);
  ok(Math.abs(f - Math.exp(2 * Math.sqrt(4.5 / P.H2M) * 0.1)) < 1e-12 && f > 8 && f < 10, 'STM: pulling the tip back 0.1 nm (less than an atom\'s width) cuts the current about ' + f.toFixed(1) + ' times');
  // the Gamow integral against its closed form
  let wg = 0; P.ALPHA.forEach(n => { const g = P.gamow(n.Z, n.A, n.Q), x = g.R / g.b, mu = P.NUC.mAlpha * g.Ad * P.NUC.u / (P.NUC.mAlpha + g.Ad * P.NUC.u);
    const G = Math.sqrt(2 * mu * n.Q) / P.NUC.hc * g.b * (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x))); wg = Math.max(wg, Math.abs(g.G / G - 1)); });
  ok(wg < 1e-5, 'the barrier integral G matches its closed form, b sqrt(2 mu Q)/hbar [arccos sqrt(R/b) - sqrt((R/b)(1 - R/b))]');
  const g0 = P.gamow(92, 238, 4.27); ok(Math.abs(g0.f / (Math.sqrt(2 * 4.27 / P.NUC.mAlpha) * P.NUC.c / (2 * g0.R)) - 1) < 1e-12, 'the alpha particle hits the wall v / 2R times a second, crossing the nucleus and back');
  const dev = P.ALPHA.map(n => Math.log10(P.gamow(n.Z, n.A, n.Q).halfLife / n.t)), span = Math.log10(P.ALPHA[7].t / P.ALPHA[0].t);
  const others = dev.filter((d, i) => P.ALPHA[i].sym !== 'Po-210'), po210 = dev[P.ALPHA.findIndex(n => n.sym === 'Po-210')];
  ok(span > 23 && Math.max(...others.map(Math.abs)) < 0.75 && Math.abs(po210) < 2, 'alpha decay: measured half-lives span ' + span.toFixed(0) + ' powers of ten; the simple model gets 7 of 8 within a factor of 6 (worst ' + Math.max(...others.map(Math.abs)).toFixed(2) + ' powers of ten), and polonium-210 within a factor of 100');
  const qs = P.ALPHA.filter(n => n.Z === 84).map(n => [n.Q, P.gamow(n.Z, n.A, n.Q).halfLife]);
  ok(qs.every((a, i) => i === 0 || (a[0] < qs[i - 1][0]) === (a[1] > qs[i - 1][1])), 'for polonium, a lower energy always means a longer half-life (Geiger-Nuttall)');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
