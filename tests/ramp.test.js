// Crate on a ramp: the energy books balance; textbook results for the angle of repose, the pushes needed to
// start or hold the crate, sliding and stopping distances; and the exact event-driven stepping against a
// brute-force small-step integration written independently here.
const P = require('./load.js')('ramp');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const deg = d => d * Math.PI / 180;
const run = (p, st, T, dt, Ffun) => {
  const L = P.newLedger(), K0 = P.kinetic(st, p), U0 = P.potential(st, p);
  const n = Math.round(T / dt);
  for (let i = 0; i < n; i++) { if (Ffun) p.F = Ffun(st, i * dt); P.step(st, p, dt, L); }      // the push is set once a frame
  return { L, dK: P.kinetic(st, p) - K0, dU: P.potential(st, p) - U0 };
};

// 1. the energy books balance, in two accountings, for random runs with a push that keeps changing
{
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let worstSys = 0, worstCrate = 0, bumps = 0, scale = 0;
  for (let k = 0; k < 400; k++) {
    const muS = rnd() * 0.9, p = { m: 10 + rnd() * 90, theta: deg(rnd() * 60), muS, muK: muS * rnd(), F: 0 };
    const st = { s: P.S_MIN + rnd() * (P.S_MAX - P.S_MIN), v: (rnd() - 0.5) * 16, t: 0 };
    const Fs = Array.from({ length: 12 }, () => (rnd() - 0.5) * 2000);
    const r = run(p, st, 6, 1 / 60, (s, t) => Fs[Math.floor(t * 2) % 12]);
    const L = r.L, big = Math.abs(L.app) + Math.abs(r.dK) + Math.abs(r.dU) + L.heatF + L.heatB + 1;
    worstSys = Math.max(worstSys, Math.abs(L.app - (r.dK + r.dU + L.heatF + L.heatB)) / big);
    worstCrate = Math.max(worstCrate, Math.abs(L.app + L.grav + L.fric + L.bump - r.dK) / big);
    if (L.heatB > 0) bumps++; scale = Math.max(scale, big);
  }
  ok(worstSys < 1e-10, '400 random runs: work by the push = change in kinetic + gravitational energy + heat (worst ' + worstSys.toExponential(1) + ' of the energies involved)');
  ok(worstCrate < 1e-12, 'and for the crate alone: work by push + gravity + friction + bumpers = change in kinetic energy (worst ' + worstCrate.toExponential(1) + ')');
  ok(bumps > 20, 'the runs include ' + bumps + ' that hit a bumper, so that bookkeeping is exercised');
}

// 2. angle of repose: left alone at rest, the crate stays put exactly when tan(theta) <= mu_s
{
  let right = 0, total = 0;
  [0.2, 0.45, 0.7].forEach(muS => {
    const th0 = Math.atan(muS);
    [-0.2, -0.02, 0.02, 0.2].forEach(dd => {
      const p = { m: 40, theta: th0 + deg(dd), muS, muK: muS * 0.6, F: 0 }, st = { s: 4, v: 0, t: 0 };
      run(p, st, 1, 1 / 60);
      total++; if ((st.s === 4) === (dd < 0)) right++;
    });
  });
  ok(right === total, 'left at rest, it stays put just below tan(theta) = mu_s and slides just above, for three values of mu_s (' + right + '/' + total + ')');
}

// 3. the pushes that start it up the ramp, and that keep it from sliding down
{
  const m = 50, th = deg(35), muS = 0.4, up = P.pushToStartUp(m, th, muS), hold = P.pushToHold(m, th, muS);
  const moved = F => { const p = { m, theta: th, muS, muK: 0.25, F }, st = { s: 3, v: 0, t: 0 }; run(p, st, 0.5, 1 / 60); return st.s - 3; };
  ok(moved(up - 0.5) === 0 && moved(up + 0.5) > 0, 'it starts up the ramp only when pushed with more than mg(sin + mu_s cos) = ' + up.toFixed(1) + ' N');
  ok(moved(hold + 0.5) === 0 && moved(hold - 0.5) < 0, 'and slides down when pushed with less than mg(sin - mu_s cos) = ' + hold.toFixed(1) + ' N');
  ok(moved((up + hold) / 2) === 0, 'anything in between holds it still');
}

// 4. sliding down from rest: s = s0 - g (sin - mu_k cos) t^2 / 2 until it reaches the floor
{
  const p = { m: 30, theta: deg(40), muS: 0.5, muK: 0.3, F: 0 }, st = { s: 7, v: 0, t: 0 };
  run(p, st, 1.2, 0.3);
  const exact = 7 - 0.5 * P.G * (Math.sin(p.theta) - p.muK * Math.cos(p.theta)) * 1.2 * 1.2;
  ok(Math.abs(st.s - exact) < 1e-12, 'sliding down from rest matches s0 - g(sin - mu_k cos)t^2/2 (' + st.s.toFixed(6) + ' m)');
}

// 5. a shove up the ramp: it stops after v0^2 / 2g(sin + mu_k cos), then stays or slides back
{
  const p = { m: 50, theta: deg(25), muS: 0.5, muK: 0.3, F: 0 }, st = { s: 0.5, v: 6, t: 0 };
  let top = 0; const L = P.newLedger();
  for (let i = 0; i < 600; i++) { P.step(st, p, 1 / 120, L); top = Math.max(top, st.s); }
  const d = P.stopUpRamp(6, p.theta, p.muK);
  ok(Math.abs(top - 0.5 - d) < 1e-9, 'shoved up at 6 m/s it climbs ' + d.toFixed(3) + ' m = v0^2/2g(sin + mu_k cos), then (tan 25 deg < 0.5) stays there: ' + (Math.abs(st.s - top) < 1e-12));
  const q = { m: 50, theta: deg(35), muS: 0.5, muK: 0.3, F: 0 }, s2 = { s: 0.5, v: 6, t: 0 }, L2 = P.newLedger();
  let peak = 0, back = null;
  for (let i = 0; i < 8000 && back === null; i++) { const prev = s2.s; P.step(s2, q, 1 / 2000, L2); peak = Math.max(peak, s2.s); if (peak > 0.6 && prev >= 0.5 && s2.s < 0.5) back = Math.abs(s2.v); }
  const d2 = P.stopUpRamp(6, q.theta, q.muK), vb = Math.sqrt(2 * P.G * d2 * (Math.sin(q.theta) - q.muK * Math.cos(q.theta)));
  ok(back !== null && Math.abs(back - vb) < 0.01, 'at 35 deg it slides back and passes its starting point at ' + (back || 0).toFixed(3) + ' m/s; energy says ' + vb.toFixed(3) + ' m/s (slower than it left)');
}

// 6. on the level: a crate shoved at v0 stops after v0^2 / (2 mu_k g); down the ramp onto the floor it stops
//    where the height it lost has all gone into heat
{
  const p = { m: 20, theta: 0, muS: 0.4, muK: 0.25, F: 0 }, st = { s: -3, v: 4, t: 0 };
  run(p, st, 4, 1 / 60);
  ok(Math.abs(st.s + 3 - 16 / (2 * 0.25 * P.G)) < 1e-12 && st.v === 0, 'on the level it stops after v0^2/(2 mu_k g) = ' + (16 / (2 * 0.25 * P.G)).toFixed(4) + ' m');
  const q = { m: 20, theta: deg(30), muS: 0.4, muK: 0.3, F: 0 }, s2 = { s: 3, v: 0, t: 0 };
  run(q, s2, 8, 1 / 60);
  const h = 3 * Math.sin(q.theta), dRamp = 3, dFloor = (h - q.muK * Math.cos(q.theta) * dRamp) / q.muK;
  ok(Math.abs(s2.s + dFloor) < 1e-9, 'sliding down the ramp onto the floor, it stops ' + dFloor.toFixed(4) + ' m out, where mg h = mu_k mg cos(theta) d_ramp + mu_k mg d_floor');
}

// 7. independent check: a brute-force integration with a tiny time step, written separately here
{
  const brute = (p, s, v, T, Ffun) => {
    const dt = 2e-6, m = p.m;
    for (let t = 0; t < T; t += dt) {
      // the same once-a-frame push as the sim
      const F = Ffun ? Ffun(Math.floor(t * 60 + 1e-9) / 60) : p.F, th = s > 0 ? p.theta : 0, N = m * P.G * Math.cos(th), other = F - m * P.G * Math.sin(th);
      let a;
      if (v === 0) a = Math.abs(other) <= p.muS * N ? 0 : (other - Math.sign(other) * p.muK * N) / m;
      else a = (other - Math.sign(v) * p.muK * N) / m;
      let v2 = v + a * dt;
      if (v !== 0 && Math.sign(v2) !== Math.sign(v)) v2 = 0;          // friction cannot reverse the motion
      s += (v + v2) / 2 * dt; v = v2;
      if (s > P.S_MAX) { s = P.S_MAX; v = 0; } if (s < P.S_MIN) { s = P.S_MIN; v = 0; }
      if (s >= P.S_MAX && v === 0 && a > 0) a = 0;
    }
    return s;
  };
  let worst = 0;
  const cases = [
    [{ m: 50, theta: deg(25), muS: 0.5, muK: 0.3, F: 0 }, 0.5, 6, null],
    [{ m: 50, theta: deg(40), muS: 0.5, muK: 0.3, F: 0 }, 6, 0, null],
    [{ m: 30, theta: deg(15), muS: 0.6, muK: 0.4, F: 0 }, -2, 3, t => t < 1 ? 300 : t < 2 ? -150 : 0],
    [{ m: 80, theta: deg(50), muS: 0.3, muK: 0.1, F: 0 }, 1, -1, t => 700],
    [{ m: 20, theta: deg(30), muS: 0.2, muK: 0.15, F: 0 }, -3.5, 7, null]
  ];
  cases.forEach(([p, s, v, Ff]) => {
    const st = { s, v, t: 0 }; run(p, st, 3, 1 / 60, Ff ? (x, t) => Ff(t) : null);
    const b = brute({ ...p }, s, v, 3, Ff); worst = Math.max(worst, Math.abs(st.s - b));
  });
  ok(worst < 2e-4, 'five runs (shoves, slides, changing pushes, onto the floor, into a bumper) match a 2-microsecond brute-force integration to ' + (worst * 1000).toFixed(3) + ' mm');
}

// 8. the mystery screen's two measurements recover the coefficients
{
  let worstS = 0, worstK = 0;
  for (const [muS, muK] of [[0.25, 0.15], [0.42, 0.31], [0.68, 0.45], [0.55, 0.5]]) {
    // tilt 0.1 deg at a time until it slips
    let a = 0; for (; a < 60; a += 0.1) { const p = { m: 40, theta: deg(a), muS, muK, F: 0 }, st = { s: 4, v: 0, t: 0 }; run(p, st, 0.2, 1 / 60); if (st.s !== 4) break; }
    worstS = Math.max(worstS, Math.abs(Math.tan(deg(a)) - muS));
    // shove at 5 m/s on the level, read the stopping distance to the nearest centimeter
    const p = { m: 40, theta: 0, muS, muK, F: 0 }, st = { s: -3.2, v: 5, t: 0 }; run(p, st, 6, 1 / 60);
    const d = Math.round((st.s + 3.2) * 100) / 100;
    worstK = Math.max(worstK, Math.abs(25 / (2 * P.G * d) - muK));
  }
  ok(worstS < 0.005, 'tilting in 0.1 deg steps until it slips gives mu_s = tan(angle) to within ' + worstS.toFixed(4));
  ok(worstK < 0.005, 'and a 5 m/s shove on the level, distance read to 1 cm, gives mu_k to within ' + worstK.toFixed(4));
}
// 9. the value of g the notes quote, and the brute-force check above, assume
ok(P.G === 9.8, 'g = 9.8 m/s^2, as the notes say');
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
