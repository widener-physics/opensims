// Motion seen from a turning platform: the platform-frame path (a straight line turned back) against a separate
// step-by-step integration of the centrifugal and Coriolis forces; the energy-like quantity they conserve; the
// Coriolis force's direction (always sideways, to the right on a counterclockwise platform); the small-time
// deflection; release from rest on the rim; the rim crossing; and catching, with and without aiming off.
const P = require('./load.js')('coriolis');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const LAUNCHES = [[[0, 0], [2, 0], 1.0], [[-2, 0], [1.5, 0.4], 0.8], [[1, 0.5], [-0.5, 2.5], -1.3], [[0, -2], [0.3, 3], 1.57], [[-1.2, 0.3], [0, 0], 1.2]];
// 1. the platform-frame path against a separate integration of a = centrifugal + Coriolis
{
  let w = 0;
  LAUNCHES.forEach(([r0, u, om]) => {
    const L = P.launch(r0, u, om); let r = r0.slice(), v = u.slice(); const dt = 1e-4, T = 2.5;
    const acc = (r, v) => [om * om * r[0] + 2 * om * v[1], om * om * r[1] - 2 * om * v[0]];
    for (let i = 0; i < T / dt; i++) {
      const a1 = acc(r, v), r2 = [r[0] + dt / 2 * v[0], r[1] + dt / 2 * v[1]], v2 = [v[0] + dt / 2 * a1[0], v[1] + dt / 2 * a1[1]], a2 = acc(r2, v2);
      const r3 = [r[0] + dt / 2 * v2[0], r[1] + dt / 2 * v2[1]], v3 = [v[0] + dt / 2 * a2[0], v[1] + dt / 2 * a2[1]], a3 = acc(r3, v3);
      const r4 = [r[0] + dt * v3[0], r[1] + dt * v3[1]], v4 = [v[0] + dt * a3[0], v[1] + dt * a3[1]], a4 = acc(r4, v4);
      r = [r[0] + dt / 6 * (v[0] + 2 * v2[0] + 2 * v3[0] + v4[0]), r[1] + dt / 6 * (v[1] + 2 * v2[1] + 2 * v3[1] + v4[1])];
      v = [v[0] + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]), v[1] + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1])];
    }
    const p = P.platform(L, T); w = Math.max(w, Math.hypot(p.r[0] - r[0], p.r[1] - r[1]), Math.hypot(p.v[0] - v[0], p.v[1] - v[1]));
  });
  ok(w < 1e-9, 'five launches: the straight line seen from the ground, turned back, is exactly the path the centrifugal and Coriolis forces produce on the platform (within ' + w.toExponential(1) + ' m)');
}
// 2. what the fictitious forces do
{
  let jac = 0, perp = 0, right = true, steady = 0;
  LAUNCHES.forEach(([r0, u, om]) => {
    const L = P.launch(r0, u, om), J = s => 0.5 * (s.v[0] ** 2 + s.v[1] ** 2) - 0.5 * om * om * (s.r[0] ** 2 + s.r[1] ** 2), J0 = J(P.platform(L, 0));
    for (let t = 0; t < 3; t += 0.037) { const s = P.platform(L, t), g = P.ground(L, t);
      jac = Math.max(jac, Math.abs(J(s) - J0)); perp = Math.max(perp, Math.abs(s.coriolis[0] * s.v[0] + s.coriolis[1] * s.v[1]));
      const cross = s.v[0] * s.coriolis[1] - s.v[1] * s.coriolis[0]; if (om > 0 && Math.hypot(...s.v) > 1e-6 && cross >= 0) right = false; if (om < 0 && Math.hypot(...s.v) > 1e-6 && cross <= 0) right = false;
      steady = Math.max(steady, Math.abs(Math.hypot(...g.v) - Math.hypot(...L.v0))); }
  });
  // the two forces add up to the path's actual curvature: its acceleration, by finite differences
  let wa = 0; LAUNCHES.forEach(([r0, u, om]) => { const L = P.launch(r0, u, om), h = 1e-4;
    for (let t = 0.1; t < 2.5; t += 0.31) { const a = P.platform(L, t - h).r, b = P.platform(L, t).r, c = P.platform(L, t + h).r, st = P.platform(L, t);
      const acc = [(a[0] - 2 * b[0] + c[0]) / (h * h), (a[1] - 2 * b[1] + c[1]) / (h * h)];
      wa = Math.max(wa, Math.hypot(acc[0] - st.centrifugal[0] - st.coriolis[0], acc[1] - st.centrifugal[1] - st.coriolis[1]) / (Math.hypot(...acc) + 1)); } });
  ok(wa < 1e-5, 'the centrifugal and Coriolis forces the screen shows add up to the acceleration of the path seen on the platform');
  ok(perp < 1e-12, 'the Coriolis force is always at right angles to the motion seen on the platform: it bends the path but never speeds it up or slows it down');
  ok(right, 'on a platform turning counterclockwise it always pushes to the right of the motion; clockwise, to the left');
  ok(jac < 1e-12, 'so only the centrifugal force changes the speed seen on the platform: (1/2) v^2 - (1/2) w^2 r^2 stays the same');
  ok(steady === 0, 'seen from the ground there is no force at all: steady speed in a straight line');
}
// 3. special cases
{
  const om = 1.0, s = 2, L = P.launch([0, 0], [s, 0], om);
  let w = 0; [0.02, 0.05, 0.1].forEach(t => { const p = P.platform(L, t); w = Math.max(w, Math.abs(-p.r[1] / (om * s * t * t) - 1)); });
  ok(w < 0.01, 'slid from the center: at first it drifts sideways by (1/2)(2 w v) t^2 = w v t^2, the Coriolis acceleration acting alone');
  const R = P.PLATFORM.R, Lr = P.launch([R, 0], [0, 0], om), g = P.ground(Lr, 0);
  ok(Math.abs(g.v[1] - om * R) < 1e-15 && Math.abs(g.v[0]) < 1e-15, 'let go from the rim: it leaves along the tangent at the rim\'s speed w R, ' + (om * R).toFixed(1) + ' m/s');
  const h = 1e-4, pa = P.platform(Lr, h);
  ok(Math.abs((pa.r[0] - R) / (0.5 * om * om * R * h * h) - 1) < 1e-3 && Math.abs(pa.r[1]) < 1e-6, 'seen on the platform it starts from rest and moves straight outward with the centrifugal acceleration w^2 R');
  let wr = 0; LAUNCHES.forEach(([r0, u, o]) => { const L2 = P.launch(r0, u, o), t = P.rimTime(L2); if (t !== null) wr = Math.max(wr, Math.abs(Math.hypot(...P.ground(L2, t).r) - R)); });
  let found = 0; LAUNCHES.forEach(([r0, u, o]) => { if (Math.hypot(...u) > 0 || o !== 0) { const t = P.rimTime(P.launch(r0, u, o)); if (t !== null && t > 0) found++; } });
  ok(wr < 1e-12 && found === LAUNCHES.length, 'the moment it reaches the rim is found exactly, for every launch from inside the platform');
  ok(Math.abs(P.fromRpm(60) - 2 * Math.PI) < 1e-15 && Math.abs(P.rpm(P.fromRpm(7.5)) - 7.5) < 1e-12, 'turns a minute convert to radians per second correctly (60 turns a minute = 2 pi rad/s)');
}
// 4. playing catch
{
  const R = P.PLATFORM.R, A = [-R, 0], B = [R, 0], s = 4;
  ok(P.miss(A, B, s, 0, 0).gap < 1e-9 && Math.abs(P.aimFor(A, B, s, 0)) < 1e-9, 'on a platform at rest, aim straight at your friend and the ball arrives');
  const om = P.fromRpm(10), straight = P.miss(A, B, s, 0, om), aim = P.aimFor(A, B, s, om), fix = P.miss(A, B, s, aim, om);
  ok(straight.gap > 1 && fix.gap < 1e-6, 'at 10 turns a minute, aiming straight misses by ' + straight.gap.toFixed(2) + ' m; aiming ' + Math.abs(aim * 180 / Math.PI).toFixed(0) + ' degrees off reaches the friend');
  const c = P.aimFor([0, 0], [R, 0], s, om), back = P.aimFor([R, 0], [0, 0], s, om);
  const side = P.aimFor([0, -R], [R * Math.cos(1), R * Math.sin(1)], s, om);
  ok(c > 0 && back > 0 && side > 0, 'on a counterclockwise platform you aim to the left of your friend whichever way you throw (out, in, or across): ' + [c, back, side].map(a => (a * 180 / Math.PI).toFixed(0) + ' deg').join(', '));
  ok(P.aimFor([0, 0], [R, 0], s, -om) < 0, 'turn the platform the other way and the aim flips');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
