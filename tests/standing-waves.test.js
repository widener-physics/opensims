// Standing waves: the mode sums against closed-form solutions of the damped wave equation, exact time
// stepping against a Runge-Kutta integration, and the resonances of the string and both pipes.
const P = require('./load.js')('standing-waves');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
// complex helpers written independently of the core
const csqrt = z => { const r = Math.hypot(z[0], z[1]); const a = Math.sqrt((r + z[0]) / 2), b = Math.sign(z[1] || 1) * Math.sqrt((r - z[0]) / 2); return [a, b]; };
const csin = z => [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])];
const ccos = z => [Math.cos(z[0]) * Math.cosh(z[1]), -Math.sin(z[0]) * Math.sinh(z[1])];
const { cmul, cdiv, cabs } = P;

// 1. string: modal steady state against the closed form y = A sin(k(L-x)) / sin(kL), k^2 = (w^2 - i g w)/v^2
{
  const o = { L: 1.2, T: 1.96, mu: 0.001, gamma: 2.9, A: 0.001, N: 400 };
  const s = P.makeString(o), v = Math.sqrt(o.T / o.mu);
  let worst = 0;
  for (const f of [7, 18.4, 18.46, 30, 55.3, 92.1, 140]) {
    const w = 2 * Math.PI * f, k = cdiv(csqrt([w * w, -o.gamma * w]), [v, 0]);
    const C = P.steadyCoeffs(s, w);
    for (const x of [0, 0.05, 0.3, 0.6, 0.9, 1.15, 1.2]) {
      const exact = cdiv(cmul([o.A, 0], csin(cmul(k, [o.L - x, 0]))), csin(cmul(k, [o.L, 0])));
      const modal = P.steadyAt(s, w, x, C);
      const peak = Math.max(...[0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map(xx => cabs(P.steadyAt(s, w, xx * 1.2 / 0.6 * 0.5, C))));
      worst = Math.max(worst, cabs([exact[0] - modal[0], exact[1] - modal[1]]) / Math.max(peak, o.A));
    }
  }
  ok(worst < 2e-3, 'string steady state matches the closed form (worst relative error ' + worst.toExponential(2) + ', 400 modes)');
  const s80 = P.makeString({ ...o, N: 80 }); let w80 = 0;
  for (const f of [18.4, 55.3, 92.1, 140]) { const w = 2 * Math.PI * f, k = cdiv(csqrt([w * w, -o.gamma * w]), [v, 0]), C = P.steadyCoeffs(s80, w);
    for (const x of [0.02, 0.3, 0.6, 0.9]) { const e = cdiv(cmul([o.A, 0], csin(cmul(k, [o.L - x, 0]))), csin(cmul(k, [o.L, 0]))), m = P.steadyAt(s80, w, x, C);
      w80 = Math.max(w80, cabs([e[0] - m[0], e[1] - m[1]]) / Math.max(cabs(e), 0.01)); } }
  ok(w80 < 0.02, 'with the 80 modes the page uses, still within ' + (100 * w80).toFixed(2) + '% up to 140 Hz');
}
// 2. pipes: modal steady state against closed forms for a point source at the open end
for (const ends of ['oo', 'oc']) {
  const tc = 20, v = P.soundSpeed(tc), o = { L: 0.6, v, ends, gamma: 30, K: 0.0437, rho: P.airDensity(tc), N: 3000 };
  const s = P.makePipe(o); let worst = 0;
  for (const f of [100, 143, 290, 430, 700, 1500]) {
    const w = 2 * Math.PI * f, k = cdiv(csqrt([w * w, -o.gamma * w]), [v, 0]), F = o.K, C = P.steadyCoeffs(s, w);
    for (const x of [0.05, 0.2, 0.35, 0.5, 0.59]) {
      const exact = ends === 'oo'
        ? cdiv([-F * ccos(cmul(k, [o.L - x, 0]))[0], -F * ccos(cmul(k, [o.L - x, 0]))[1]], cmul(cmul([v * v, 0], k), csin(cmul(k, [o.L, 0]))))
        : cdiv([F * csin(cmul(k, [o.L - x, 0]))[0], F * csin(cmul(k, [o.L - x, 0]))[1]], cmul(cmul([v * v, 0], k), ccos(cmul(k, [o.L, 0]))));
      let m = P.steadyAt(s, w, x, C);
      // open-open only: the closed form also contains the whole column sliding back and forth together (the
      // n = 0, zero-frequency 'mode'), which the model leaves out on purpose; add it back to compare like with like
      if (ends === 'oo') m = [m[0] + cdiv([F / o.L, 0], [-w * w, o.gamma * w])[0], m[1] + cdiv([F / o.L, 0], [-w * w, o.gamma * w])[1]];
      worst = Math.max(worst, cabs([exact[0] - m[0], exact[1] - m[1]]) / cabs(exact));
    }
  }
  ok(worst < 1e-3, 'pipe (' + ends + ') steady state matches the closed form (worst ' + worst.toExponential(2) + ')');
}
// 3. exact time stepping against a brute-force RK4 integration of the same mode equations, with a retune midway
{
  const s = P.makeString({ L: 1.2, T: 1.96, mu: 0.001, gamma: 2.9, A: 0.001, N: 6 });
  let w = 2 * Math.PI * 17.9; const st = P.start(s, w);
  const q = new Float64Array(6), qd = new Float64Array(6); let phi = -Math.PI / 2;
  const acc = (i, qq, vv, ph, ww) => { const G = s.force(s.modes[i], ww); return G[0] * Math.cos(ph) - G[1] * Math.sin(ph) - s.gamma * vv - s.modes[i].w ** 2 * qq; };
  const dt = 1e-5; let worst = 0, peak = 0;
  for (let k = 1; k <= 300000; k++) {
    if (k === 150000) { w = 2 * Math.PI * 18.45; P.retune(st, w); }
    for (let i = 0; i < 6; i++) {
      const k1q = qd[i], k1v = acc(i, q[i], qd[i], phi, w);
      const k2q = qd[i] + dt / 2 * k1v, k2v = acc(i, q[i] + dt / 2 * k1q, qd[i] + dt / 2 * k1v, phi + w * dt / 2, w);
      const k3q = qd[i] + dt / 2 * k2v, k3v = acc(i, q[i] + dt / 2 * k2q, qd[i] + dt / 2 * k2v, phi + w * dt / 2, w);
      const k4q = qd[i] + dt * k3v, k4v = acc(i, q[i] + dt * k3q, qd[i] + dt * k3v, phi + w * dt, w);
      q[i] += dt / 6 * (k1q + 2 * k2q + 2 * k3q + k4q); qd[i] += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
    phi += w * dt; P.advance(st, dt);
    if (k % 1000 === 0) for (let i = 0; i < 6; i++) { worst = Math.max(worst, Math.abs(P.modeQ(st, i) - q[i])); peak = Math.max(peak, Math.abs(q[i])); }
  }
  ok(worst / peak < 1e-6, 'exact stepping agrees with RK4 over 3 s including a retune (relative error ' + (worst / peak).toExponential(2) + ')');
}
// 4. retuning never makes the string jump; big steps are as exact as small ones
{
  const s = P.makeString({ L: 1.2, T: 1.96, mu: 0.001, gamma: 2.9, A: 0.001, N: 80 }); const st = P.start(s, 2 * Math.PI * 12);
  for (let i = 0; i < 500; i++) P.advance(st, 0.003);
  const xs = [0.1, 0.4, 0.7, 1.0], before = xs.map(x => P.displacement(st, x));
  P.retune(st, 2 * Math.PI * 55);
  const after = xs.map(x => P.displacement(st, x));
  ok(Math.max(...before.map((b, i) => Math.abs(b - after[i]))) < 1e-15, 'retuning leaves the shape exactly where it was');
  const a = P.start(s, 2 * Math.PI * 18.4), b = P.start(s, 2 * Math.PI * 18.4);
  for (let i = 0; i < 100; i++) P.advance(a, 0.01); for (let i = 0; i < 10000; i++) P.advance(b, 0.0001);
  ok(Math.abs(P.displacement(a, 0.3) - P.displacement(b, 0.3)) < 1e-12, 'one 10 ms step lands where a hundred 0.1 ms steps do');
  // the flat start
  const c = P.start(s, 2 * Math.PI * 30);
  ok(Math.max(...[0, 0.2, 0.6, 1.1].map(x => Math.abs(P.displacement(c, x)))) < 1e-12, 'the string starts flat and at rest');
}
// 5. after the transient dies away the motion is the steady state, and the driver end moves with the driver
{
  const s = P.makeString({ L: 1.2, T: 1.96, mu: 0.001, gamma: 2.9, A: 0.001, N: 80 }); const w = 2 * Math.PI * 18.4; const st = P.start(s, w);
  for (let i = 0; i < 20000; i++) P.advance(st, 0.001);     // 20 s, about 29 time constants
  const C = P.steadyCoeffs(s, w);
  let worst = 0; for (const x of [0.2, 0.6, 1.0]) { const Y = P.steadyAt(s, w, x, C); worst = Math.max(worst, Math.abs(P.displacement(st, x) - (Y[0] * Math.cos(st.phi) - Y[1] * Math.sin(st.phi)))); }
  ok(worst < 1e-9, 'the transient dies away into the steady state');
  ok(Math.abs(P.displacement(st, 0) - 0.001 * Math.cos(st.phi)) < 1e-15 && Math.abs(P.displacement(st, 1.2)) < 1e-15, 'the driven end follows the vibrator and the pulley end stays fixed');
}
// 6. resonances sit at f_n = n v / 2L for the string; odd multiples of v / 4L for the open-closed pipe
function peaks(sys, fmax, df, xs) {
  const out = []; let prev2 = 0, prev = 0;
  for (let f = df; f <= fmax; f += df) {
    const w = 2 * Math.PI * f, C = P.steadyCoeffs(sys, w), a = Math.max(...xs.map(x => cabs(P.steadyAt(sys, w, x, C))));
    if (prev > prev2 && prev > a && f > 2 * df) out.push({ f: f - df, a: prev });
    prev2 = prev; prev = a;
  }
  return out;
}
{
  const s = P.makeString({ L: 1.2, T: 1.96, mu: 0.001, gamma: 2.9, A: 0.001, N: 80 }), v = Math.sqrt(1.96 / 0.001);
  const xs = Array.from({ length: 49 }, (_, i) => 0.012 + i * 0.0245);
  const pk = peaks(s, 150, 0.01, xs).filter(p => p.a > 0.005);
  ok(pk.length === 8 && pk.every((p, i) => Math.abs(p.f - (i + 1) * v / 2.4) < 0.02),
    'string peaks at n v / 2L: ' + pk.map(p => p.f.toFixed(2)).join(', ') + ' Hz (predicted ' + [1,2,3,4,5,6,7,8].map(n => (n * v / 2.4).toFixed(2)).join(', ') + ')');
  const a1 = pk[0].a, spread = Math.max(...pk.map(p => p.a)) / Math.min(...pk.map(p => p.a));
  ok(Math.abs(a1 / (2 * 0.001 * (2 * Math.PI * v / 2.4) / (Math.PI * 2.9)) - 1) < 0.02, 'peak amplitude ' + (a1 * 1000).toFixed(1) + ' mm = 2A w1 / (pi gamma), equal for every harmonic (spread ' + ((spread - 1) * 100).toFixed(1) + '%)');
}
for (const ends of ['oo', 'oc']) {
  const v = P.soundSpeed(20), s = P.makePipe({ L: 0.6, v, ends, gamma: 30, K: 0.0437, rho: P.airDensity(20), N: 60 });
  const xs = Array.from({ length: 31 }, (_, i) => i * 0.02);
  const pk = peaks(s, 1600, 0.5, xs).filter(p => p.a > 3e-7);
  const pred = ends === 'oo' ? [1, 2, 3, 4, 5].map(n => n * v / 1.2) : [1, 3, 5, 7, 9, 11].map(n => n * v / 2.4);
  ok(pk.length === pred.length && pk.every((p, i) => Math.abs(p.f - pred[i]) < 1.5),
    (ends === 'oo' ? 'open-open' : 'open-closed') + ' pipe peaks at ' + pk.map(p => p.f.toFixed(1)).join(', ') + ' Hz (predicted ' + pred.map(f => f.toFixed(1)).join(', ') + ')');
}
// 6b. every pipe resonance is equally loud: pressure antinode = 2 K rho v / (gamma L)
{
  const v = P.soundSpeed(20), rho = P.airDensity(20), o = { L: 0.6, v, ends: 'oc', gamma: 30, K: 0.0437, rho, N: 60 }, s = P.makePipe(o);
  const amps = [1, 3, 5, 7].map(n => { const st = P.start(s, 2 * Math.PI * n * v / 2.4); P.settle(st);
    let m = 0; for (let k = 0; k < 64; k++) { P.advance(st, 1 / (n * v / 2.4) / 64); for (let x = 0; x <= 0.6; x += 0.005) m = Math.max(m, Math.abs(P.pressure(st, x))); } return m; });
  const pred = 2 * o.K * rho * v / (o.gamma * o.L);
  ok(amps.every(a => Math.abs(a / pred - 1) < 0.03), 'pressure antinodes at harmonics 1, 3, 5, 7: ' + amps.map(a => a.toFixed(2)).join(', ') + ' Pa (predicted ' + pred.toFixed(2) + ')');
}
// 7. boundary conditions in the running pipe: pressure node at an open far end, displacement node at a closed one
{
  const v = P.soundSpeed(20);
  const so = P.makePipe({ L: 0.6, v, ends: 'oo', gamma: 30, K: 0.0437, rho: 1.2, N: 60 }), sc = P.makePipe({ L: 0.6, v, ends: 'oc', gamma: 30, K: 0.0437, rho: 1.2, N: 60 });
  const a = P.start(so, 2 * Math.PI * 286), b = P.start(sc, 2 * Math.PI * 143);
  for (let i = 0; i < 400; i++) { P.advance(a, 0.0007); P.advance(b, 0.0007); }
  const pmax = Math.max(...[0.1, 0.2, 0.3, 0.4, 0.5].map(x => Math.abs(P.pressure(a, x))));
  ok(Math.abs(P.pressure(a, 0.6)) < 1e-9 * pmax + 1e-12, 'open far end: pressure stays zero there');
  const smax = Math.max(...[0.1, 0.2, 0.3].map(x => Math.abs(P.displacement(b, x))));
  ok(Math.abs(P.displacement(b, 0.6)) < 1e-12 * smax + 1e-18, 'closed far end: the air there never moves');
}
// 7b. changing the tension carries the motion over unchanged; changing the length starts again from rest
{
  const mk = T => P.makeString({ L: 1.2, T, mu: 0.001, gamma: 2.9, A: 0.001, N: 80 });
  let st = P.start(mk(1.96), 2 * Math.PI * 18.4); for (let i = 0; i < 300; i++) P.advance(st, 0.002);
  const xs = [0.1, 0.5, 0.9], before = xs.map(x => P.displacement(st, x));
  const st2 = P.carry(st, mk(2.5));
  ok(Math.max(...xs.map((x, i) => Math.abs(P.displacement(st2, x) - before[i]))) < 1e-15, 'a new tension leaves the string where it was');
  const st3 = P.carry(st, P.makeString({ L: 1.0, T: 1.96, mu: 0.001, gamma: 2.9, A: 0.001, N: 80 }));
  ok(Math.max(...[0.3, 0.6, 0.9].map(x => Math.abs(P.displacement(st3, x) - 0.001 * Math.cos(st3.phi) * (1 - x / 1.0)))) < 1e-15, 'a new length starts the string again from rest (only the driven end moves)');
  const st4 = P.start(mk(1.96), 2 * Math.PI * 18.4); const u0 = P.unsettled(st4);
  for (let i = 0; i < 5000; i++) P.advance(st4, 0.001);
  ok(u0 > 0.5 && u0 < 2 && P.unsettled(st4) < 1e-3, 'the settling measure starts near 1 (' + u0.toFixed(2) + ') and falls below 0.1% (' + P.unsettled(st4).toExponential(1) + ' after 5 s)');
}
// 8. speed of sound
ok(Math.abs(P.soundSpeed(20) - 343.2) < 0.1 && Math.abs(P.soundSpeed(0) - 331.3) < 1e-9, 'speed of sound ' + P.soundSpeed(20).toFixed(1) + ' m/s at 20 C, 331.3 at 0 C');
console.log(fails ? fails + ' FAILED' : 'all passed');
process.exitCode = fails ? 1 : 0;
