// Brachistochrone: path times against exact results (straight chute; cycloid, phi sqrt(R/g); a quarter circle,
// a pendulum swinging from horizontal, sqrt(R/g) K(1/sqrt 2)); the cycloid's tautochrone property; the cycloid
// beating every rival tried; the bead's motion along the wire; and a bead that cannot climb back to its start.
const P = require('./load.js')('brachistochrone');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sample = (f, n) => { const p = []; for (let k = 0; k <= n; k++) p.push(f(k / n)); return p; };

// 1. a straight chute: one piece, and many pieces, against 2L / sqrt(2 g h)
{
  const exact = P.straightTime(2.4, 1);
  const one = P.makePath([[0, 0], [2.4, -1]]).T, many = P.makePath(sample(u => [2.4 * u, -u], 997)).T;
  ok(Math.abs(one / exact - 1) < 1e-14 && Math.abs(many / exact - 1) < 1e-12, 'straight chute, 2.4 m across and 1 m down: ' + exact.toFixed(6) + ' s, in one piece or 997');
}
// 2. the cycloid through B, sampled as a chain of straight pieces, against phi sqrt(R/g)
{
  let worst = 0, worstEnd = 0;
  [[2.4, 1], [1, 1], [0.3, 1.5], [3, 0.4], [3, 0.12]].forEach(([dx, dh]) => {
    const c = P.cycloidThrough(dx, dh), pts = P.cycloidPoints(c.R, c.phi, 20000), e = pts[pts.length - 1];
    worstEnd = Math.max(worstEnd, Math.hypot(e[0] - dx, e[1] + dh));
    worst = Math.max(worst, Math.abs(P.makePath(pts).T / c.T - 1));
  });
  ok(worstEnd < 1e-9, 'the cycloid found for five end points passes through each one (within ' + worstEnd.toExponential(1) + ' m)');
  ok(worst < 1e-6, 'and the time along it, summed piece by piece, matches phi sqrt(R/g) to ' + worst.toExponential(1));
  const lvl = P.cycloidThrough(3, 1e-9);
  ok(Math.abs(lvl.phi - 2 * Math.PI) < 1e-3 && P.cycloidThrough(3, 0.12).dipsBelow && !P.cycloidThrough(1, 1).dipsBelow, 'a far, shallow end point needs a cycloid that dips below it and climbs back up (phi > pi); B level with A needs a full arch');
}
// 3. a quarter circle from A (leaving straight down) to its bottom: a pendulum released from horizontal,
//    whose quarter swing takes sqrt(R/g) K(1/sqrt 2), K = 1.854074677 (complete elliptic integral)
{
  const R = 1.2, pts = P.arcPoints(R, R, 40000), T = P.makePath(pts).T, exact = Math.sqrt(R / P.G) * 1.854074677301372;
  ok(Math.abs(T / exact - 1) < 1e-5, 'quarter circle, radius 1.2 m: ' + T.toFixed(6) + ' s; pendulum theory says ' + exact.toFixed(6) + ' s');
  const c = P.cycloidThrough(R, R);
  ok(c.T < exact && exact < P.straightTime(R, R), 'for that end point: cycloid ' + c.T.toFixed(4) + ' s < circle ' + exact.toFixed(4) + ' s (Galileo\'s guess) < straight ' + P.straightTime(R, R).toFixed(4) + ' s');
}
// 4. the tautochrone: released from rest anywhere on the cycloid, a bead reaches the bottom in pi sqrt(R/g)
{
  const R = 0.5, bottom = Math.PI; let worst = 0;
  [0.1, 0.8, 1.6, 2.5, 3.0].forEach(p0 => {
    const pts = []; for (let k = 0; k <= 20000; k++) { const p = p0 + (bottom - p0) * k / 20000; pts.push([R * (p - Math.sin(p)), -R * (1 - Math.cos(p))]); }
    worst = Math.max(worst, Math.abs(P.makePath(pts).T / (Math.PI * Math.sqrt(R / P.G)) - 1));
  });
  ok(worst < 1e-4, 'released from five heights on the same cycloid, every bead reaches the bottom in pi sqrt(R/g) (worst ' + worst.toExponential(1) + ')');
}
// 5. nothing beats the cycloid: smooth curves through random control points, and families of curves
{
  const dx = 2.4, dh = 1, best = P.cycloidThrough(dx, dh).T;
  let seed = 3, beaten = 0, tried = 0, closest = Infinity; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 400; k++) {
    const ctrl = [[0, 0]]; for (let j = 1; j <= 5; j++) ctrl.push([dx * j / 6 + (rnd() - 0.5) * 0.4, -dh * Math.pow(j / 6, 0.4 + rnd()) - rnd() * 0.6]);
    ctrl.push([dx, -dh]);
    const T = P.makePath(P.smoothThrough(ctrl, 80)).T; if (!isFinite(T)) continue;
    tried++; if (T < best) beaten++; closest = Math.min(closest, T);
  }
  for (let q = 0.15; q <= 1; q += 0.05) { const T = P.makePath(sample(u => [dx * u, -dh * Math.pow(u, q)], 4000)).T; tried++; if (T < best) beaten++; closest = Math.min(closest, T); }
  ok(beaten === 0, tried + ' rival paths (random smooth curves, and y ~ x^q for 18 powers q): none beats the cycloid; the closest is ' + ((closest / best - 1) * 100).toFixed(2) + '% slower');
  // small wiggles added to the cycloid itself only slow it down
  const c = P.cycloidThrough(dx, dh); let worse = 0;
  [-0.02, -0.005, 0.005, 0.02].forEach(e => { const pts = P.cycloidPoints(c.R, c.phi, 6000).map(([x, y], k, a) => [x, y + e * Math.sin(Math.PI * k / (a.length - 1))]); if (P.makePath(pts).T > c.T) worse++; });
  ok(worse === 4, 'bending the cycloid a little up or down, by 5 mm or 2 cm, always makes it slower');
}
// 6. the bead's motion: its speed is sqrt(2 g h) wherever it is, and it reaches the end at T
{
  const path = P.makePath(P.smoothThrough([[0, 0], [0.4, -0.9], [1.2, -1.2], [1.9, -1.1], [2.4, -1]], 120));
  let worst = 0, prev = null;
  for (let t = 0; t <= path.T; t += path.T / 500) { const q = P.locate(path, t); worst = Math.max(worst, Math.abs(q.v - Math.sqrt(2 * P.G * Math.max(0, -q.y)))); if (prev) worst = Math.max(worst, prev.s > q.s + 1e-12 ? 1 : 0); prev = q; }
  const end = P.locate(path, path.T * 1.5);
  ok(worst < 1e-9 && end.done && Math.hypot(end.x - 2.4, end.y + 1) < 1e-12, 'along a curved path the bead always moves forward at sqrt(2 g h), and arrives at B at time T');
  // ds/dt from successive positions agrees with the speed
  let w2 = 0; for (let t = 0.05; t < path.T - 0.05; t += 0.01) { const a = P.locate(path, t - 1e-6), b = P.locate(path, t + 1e-6); w2 = Math.max(w2, Math.abs((b.s - a.s) / 2e-6 - P.locate(path, t).v)); }
  ok(w2 < 1e-3, 'and the distance it covers each instant matches that speed (worst ' + w2.toExponential(1) + ' m/s)');
}
// 7. a path that climbs above the start: the bead stops at A's height, slides back, and never arrives
{
  const path = P.makePath(P.smoothThrough([[0, 0], [0.5, -0.8], [1.3, 0.3], [2.4, -1]], 120));
  ok(path.T === Infinity && path.turn && Math.abs(path.turn.y) < 1e-9, 'a path that rises above A: the bead turns back exactly at A\'s height and never reaches B');
  const q1 = P.locate(path, path.turn.t * 0.999), q2 = P.locate(path, path.turn.t * 2 - 1e-9);
  ok(q1.v < 0.2 && Math.hypot(q2.x, q2.y) < 1e-3, 'it slows to a stop there, then slides all the way back to A');
  ok(P.makePath([[0, 0], [1, 0.1], [2, -1]]).T === Infinity && P.locate(P.makePath([[0, 0], [1, 0.1], [2, -1]]), 5).x === 0, 'a path that starts uphill never gets going');
}
ok(P.G === 9.8, 'g = 9.8 m/s^2, as the notes say');
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
