// Damped driven oscillator: the exact stepping against a Runge-Kutta integration; free decay, period and the
// three damping regimes; the steady amplitude and phase, measured from the motion, against the formulas; the
// resonance peak; and the energy books (motor's power in, paddle's power out).
const P = require('./load.js')('driven-oscillator');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const TAU = 2 * Math.PI;
function rk4(p, x, v, th, wFun, T, h) {
  const acc = (x, v, th) => (-p.b * v - p.k * x + p.k * p.A * Math.cos(th)) / p.m;
  let t = 0;
  while (t < T - 1e-12) {
    const dt = Math.min(h, T - t), w = wFun(t);
    const k1x = v, k1v = acc(x, v, th);
    const k2x = v + dt / 2 * k1v, k2v = acc(x + dt / 2 * k1x, v + dt / 2 * k1v, th + w * dt / 2);
    const k3x = v + dt / 2 * k2v, k3v = acc(x + dt / 2 * k2x, v + dt / 2 * k2v, th + w * dt / 2);
    const k4x = v + dt * k3v, k4v = acc(x + dt * k3x, v + dt * k3v, th + w * dt);
    x += dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); v += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v); th += w * dt; t += dt;
  }
  return { x, v };
}
// 1. exact stepping against RK4, in all three regimes, with the drive on and off and its frequency changed mid-run
{
  let worst = 0, seed = 4; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const regimes = { under: 0, crit: 0, over: 0 };
  for (let n = 0; n < 60; n++) {
    const m = 0.2 + rnd() * 1.8, k = 5 + rnd() * 45, bc = 2 * Math.sqrt(k * m);
    const b = n % 6 === 0 ? bc : n % 6 === 1 ? bc * (1 + 1e-9) : n % 6 === 2 ? bc * (1 - 1e-9) : bc * Math.exp((rnd() - 0.7) * 4);
    const p = { m, k, b, A: n % 3 === 0 ? 0 : 0.005 + rnd() * 0.01 };
    const d = P.derived(p); regimes[d.zeta > 1 + 1e-12 ? 'over' : d.zeta < 1 - 1e-12 ? 'under' : 'crit']++;
    const w1 = d.w0 * (0.3 + rnd() * 2), w2 = d.w0 * (0.3 + rnd() * 2), wFun = t => t < 2 ? w1 : w2;
    const st = { x: (rnd() - 0.5) * 0.2, v: (rnd() - 0.5), th: rnd() * TAU, t: 0 }, x0 = st.x, v0 = st.v, th0 = st.th;
    for (let i = 0; i < 300; i++) P.step(st, p, wFun(st.t + 1e-12), 4 / 300);
    // Runge-Kutta in two legs, switching frequency exactly at t = 2 (the drive's phase carries on smoothly)
    const r1 = rk4(p, x0, v0, th0, () => w1, 2, 1e-4), r = rk4(p, r1.x, r1.v, th0 + 2 * w1, () => w2, 2, 1e-4);
    worst = Math.max(worst, Math.abs(st.x - r.x));
  }
  ok(worst < 1e-9, '60 runs (' + regimes.under + ' underdamped, ' + regimes.crit + ' within 1e-9 of critical, ' + regimes.over + ' overdamped; drive on and off, frequency changed mid-run) agree with Runge-Kutta to ' + worst.toExponential(1) + ' m');
  // one big step equals many small ones: the stepping is exact, not approximate
  const p = { m: 0.5, k: 20, b: 0.4, A: 0.01 }, w = 5;
  const a = { x: 0.1, v: 0, th: 0, t: 0 }, b2 = { x: 0.1, v: 0, th: 0, t: 0 };
  P.step(a, p, w, 3); for (let i = 0; i < 3000; i++) P.step(b2, p, w, 0.001);
  ok(Math.abs(a.x - b2.x) < 1e-12 && Math.abs(a.v - b2.v) < 1e-11, 'one 3-second step lands exactly where 3000 one-millisecond steps do');
}
// 2. free motion: decay rate, period, and the three regimes
{
  const p = { m: 0.5, k: 20, b: 0.3, A: 0 }, d = P.derived(p), w1 = Math.sqrt(d.w0 ** 2 - d.g ** 2 / 4);
  const st = { x: 0.1, v: 0, th: 0, t: 0 }, peaks = [];
  let prev = st.x, pv = st.v;
  for (let i = 0; i < 20000; i++) { P.step(st, p, 0, 0.0005); if (pv > 0 && st.v <= 0) peaks.push([st.t, st.x]); pv = st.v; }
  const T = (peaks[5][0] - peaks[0][0]) / 5, ratio = peaks[1][1] / peaks[0][1];
  ok(Math.abs(T - TAU / w1) < 1e-3, 'released, it swings with period 2 pi / sqrt(w0^2 - g^2/4) = ' + (TAU / w1).toFixed(4) + ' s, a little longer than without damping');
  ok(Math.abs(ratio - Math.exp(-d.g / 2 * TAU / w1)) < 1e-3, 'and each swing is e^(-g T / 2) = ' + Math.exp(-d.g / 2 * TAU / w1).toFixed(4) + ' times the one before');
  const crosses = b => { const q = { m: 0.5, k: 20, b, A: 0 }, s = { x: 0.1, v: 0, th: 0, t: 0 }; let n = 0, px = s.x; for (let i = 0; i < 8000; i++) { P.step(s, q, 0, 0.001); if (px * s.x < 0) n++; px = s.x; } return n; };
  const bc = 2 * Math.sqrt(20 * 0.5);
  ok(crosses(bc * 0.9) > 0 && crosses(bc) === 0 && crosses(bc * 2) === 0, 'below critical damping (b = 2 sqrt(km) = ' + bc.toFixed(3) + ' kg/s) it overshoots; at and above, it never crosses the middle');
  const settle = b => { const q = { m: 0.5, k: 20, b, A: 0 }, s = { x: 0.1, v: 0, th: 0, t: 0 }; let last = 0; for (let i = 0; i < 20000; i++) { P.step(s, q, 0, 0.001); if (Math.abs(s.x) > 0.001) last = s.t; } return last; };
  ok(settle(bc) < settle(bc * 1.5) && settle(bc) < settle(bc * 3) && settle(bc) < settle(bc * 0.5), 'critical damping settles to within 1 mm sooner than half, 1.5 or 3 times as much damping');
}
// 3. steady state, measured from the motion over whole drive cycles, against the formulas
{
  const p = { m: 0.5, k: 20, b: 0.5, A: 0.01 }, d = P.derived(p);
  let worstX = 0, worstD = 0;
  [0.2, 0.5, 0.8, 0.95, 1, 1.05, 1.2, 1.6, 2.5].forEach(r => {
    const w = r * d.w0, st = { x: 0, v: 0, th: 0, t: 0 }, meter = P.newMeter();
    P.advance(st, p, w, 60, meter);                                          // 60 s: the transient is gone (e^-30)
    const s = P.steady(p, w), D = s.A;
    const X = s.X, dl = s.delta;
    worstX = Math.max(worstX, Math.abs(meter.last.X / X - 1)); worstD = Math.max(worstD, Math.abs(meter.last.delta - dl));
  });
  ok(worstX < 1e-4 && worstD < 1e-4, 'amplitude and lag measured from the motion match X = A w0^2/sqrt((w0^2-w^2)^2 + (g w)^2) and tan(delta) = g w/(w0^2-w^2) (worst ' + worstX.toExponential(1) + ', ' + worstD.toExponential(1) + ' rad)');
  ok(Math.abs(P.steady(p, d.w0).delta - Math.PI / 2) < 1e-12, 'at the natural frequency the mass lags exactly a quarter cycle (90 deg) behind the motor');
  ok(Math.abs(P.steady(p, d.w0 * 0.01).X / p.A - 1) < 1e-3 && P.steady(p, d.w0 * 0.01).delta < 0.01, 'driven very slowly it just follows the motor (same amplitude, in step)');
  ok(P.steady(p, d.w0 * 20).X / p.A < 0.003 && P.steady(p, d.w0 * 20).delta > Math.PI - 0.01, 'driven very fast it hardly moves, and what motion there is is opposite the motor (180 deg)');
  // the peak: at w_r = sqrt(w0^2 - g^2/2), height A w0^2 / (g sqrt(w0^2 - g^2/4)), about Q times A
  let best = 0, wb = 0; for (let w = 0.5 * d.w0; w < 1.5 * d.w0; w += d.w0 * 1e-6) { const X = P.steady(p, w).X; if (X > best) { best = X; wb = w; } }
  const wr = Math.sqrt(d.w0 ** 2 - d.g ** 2 / 2), Xr = p.A * d.w0 ** 2 / (d.g * Math.sqrt(d.w0 ** 2 - d.g ** 2 / 4));
  ok(Math.abs(wb - wr) < 2e-5 * d.w0 && Math.abs(best - Xr) < 1e-9, 'the peak is at sqrt(w0^2 - g^2/2), just below w0, with height ' + (Xr / p.A).toFixed(3) + ' A (Q = ' + d.Q.toFixed(3) + ')');
  // width: the energy's half-maximum points are g apart (for light damping)
  const q = { m: 0.5, k: 20, b: 0.05, A: 0.01 }, dq = P.derived(q), E = w => P.steady(q, w).X ** 2;
  const half = E(dq.w0) / 2; let lo = dq.w0, hi = dq.w0; while (E(lo) > half) lo -= dq.w0 * 1e-6; while (E(hi) > half) hi += dq.w0 * 1e-6;
  ok(Math.abs((hi - lo) / dq.g - 1) < 0.01, 'with light damping, the band where the motion has at least half its peak energy is g = b/m wide (w0/Q)');
}
// 4. energy: what the motor puts in, less what the paddle takes out, is the change in the oscillator's energy
{
  const p = { m: 0.5, k: 20, b: 0.4, A: 0.01 }, w = 5.5, st = { x: 0.05, v: 0, th: 0, t: 0 }, E0 = P.energy(st, p);
  let Win = 0, Wout = 0; const h = 1e-5;
  const pw = s => { const y = p.A * Math.cos(s.th), ydot = -p.A * w * Math.sin(s.th); return [-p.k * (s.x - y) * ydot, p.b * s.v * s.v]; };
  let [a, b] = pw(st);
  for (let i = 0; i < 300000; i++) { P.step(st, p, w, h); const [a2, b2] = pw(st); Win += (a + a2) / 2 * h; Wout += (b + b2) / 2 * h; a = a2; b = b2; }
  const dE = P.energy(st, p) - E0;
  ok(Math.abs(Win - Wout - dE) < 1e-6 * (Win + Wout), 'over 3 s, motor\'s work ' + (Win * 1000).toFixed(3) + ' mJ minus paddle\'s ' + (Wout * 1000).toFixed(3) + ' mJ = the change in energy, ' + (dE * 1000).toFixed(3) + ' mJ');
  // in the steady state the two balance over each cycle
  const s2 = { x: 0, v: 0, th: 0, t: 0 }; P.step(s2, p, w, 60); let i1 = 0, o1 = 0; [a, b] = pw(s2); const n = 20000, hh = TAU / w / n;
  for (let i = 0; i < n; i++) { P.step(s2, p, w, hh); const [a2, b2] = pw(s2); i1 += (a + a2) / 2 * hh; o1 += (b + b2) / 2 * hh; a = a2; b = b2; }
  ok(Math.abs(i1 / o1 - 1) < 1e-6, 'in the steady state the motor\'s work per cycle exactly replaces what the paddle takes');
}
// 5. the transient's size dies away as e^(-g t / 2)
{
  const p = { m: 0.5, k: 20, b: 0.4, A: 0.01 }, d = P.derived(p), w = 3, st = { x: 0.08, v: 0, th: 0, t: 0 };
  const s0 = P.transientSize(st, p, w); P.step(st, p, w, 5); const s1 = P.transientSize(st, p, w);
  ok(Math.abs(s1 / s0 - Math.exp(-d.g * 5 / 2)) < 1e-3, 'the start-up wobble shrinks by e^(-g t / 2) = ' + Math.exp(-d.g * 2.5).toFixed(4) + ' in 5 s (it rides along with the steady motion)');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
