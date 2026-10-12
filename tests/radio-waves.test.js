// Radiation: the field lines built from light rays against the exact (Lienard-Wiechert) field of the moving charge,
// which is itself checked against Coulomb's law and the known field of a uniformly moving charge; aberration
// keeping directions as directions; the antenna's exact field against Maxwell's equations (no divergence in empty
// space) and its near and far limits; and its field lines (contours of the flux function) against that field.
const P = require('./load.js')('radio-waves');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const c = P.CLIGHT;
// the speed of light is exact in SI units (the meter is defined by it)
ok(c === 299792458, 'speed of light is the defined 299 792 458 m/s: ' + c);
// 1. the field of a single moving charge
{
  // at rest: Coulomb, 1/r^2 pointing away
  const rest = () => ({ x: 0, y: 0, vx: 0, vy: 0 }), E = P.lienardWiechert(rest, [3, 4], 1e-6);
  ok(Math.abs(Math.hypot(...E) - 1 / 25) < 1e-12 && Math.abs(E[0] / E[1] - 0.75) < 1e-9, 'a charge at rest: Coulomb\'s field, 1/r^2 straight outward');
  // moving steadily: the field points from the present position, strengthened sideways by gamma (Heaviside)
  const v = 0.6 * c, uni = t => ({ x: v * t, y: 0, vx: v, vy: 0 }), t = 2e-8, g = 1 / Math.sqrt(1 - 0.36);
  let w = 0; [[3, 2], [-1, 4], [6, -3]].forEach(r => { const Ef = P.lienardWiechert(uni, r, t), R = [r[0] - v * t, r[1]], Rl = Math.hypot(...R), sin2 = (R[1] / Rl) ** 2;
    const mag = (1 - 0.36) / (Rl * Rl * Math.pow(1 - 0.36 * sin2, 1.5)); w = Math.max(w, Math.abs(Ef[0] - mag * R[0] / Rl), Math.abs(Ef[1] - mag * R[1] / Rl)); });
  ok(w < 1e-9, 'a charge moving steadily at 0.6 c: the field points away from where it is now, squeezed sideways by gamma = ' + g.toFixed(2) + ' (Heaviside\'s result)');
  // aberration keeps unit vectors unit, and undoes itself
  let wa = 0; for (let i = 0; i < 50; i++) { const th = i * 0.37, n0 = [Math.cos(th), Math.sin(th)], b = [0.3 * Math.cos(i), 0.5 * Math.sin(i * 1.3)], n = P.aberrate(n0, b), back = P.aberrate(n, [-b[0], -b[1]]);
    wa = Math.max(wa, Math.abs(Math.hypot(...n) - 1), Math.hypot(back[0] - n0[0], back[1] - n0[1])); }
  ok(wa < 1e-12, 'the aberration of light keeps directions as unit vectors, and turning it round (minus the velocity) undoes it');
}
// 2. the field lines of a shaken charge, built from light rays, against the exact field
{
  const line = (m, t, th0) => tp => { const s = m(tp), n = P.aberrate([Math.cos(th0), Math.sin(th0)], [s.vx / c, s.vy / c]), d = c * (t - tp); return [s.x + d * n[0], s.y + d * n[1]]; };
  let worst = 0, n = 0;
  [[P.wiggle(0.3, 1e8), 25e-9], [P.wiggle(0.15, 2e8), 18e-9], [P.jolt(0.5, 6e-9), 20e-9]].forEach(([m, t]) => [0.3, 1.0, 1.9, 2.7, -0.8, -2.2].forEach(th0 => {
    const L = line(m, t, th0);
    for (let tp = t - 19e-9; tp < t - 0.5e-9; tp += 0.29e-9) { const a = L(tp - 1e-13), b = L(tp + 1e-13), E = P.lienardWiechert(m, L(tp), t), tan = [b[0] - a[0], b[1] - a[1]];
      worst = Math.max(worst, Math.abs(tan[0] * E[1] - tan[1] * E[0]) / (Math.hypot(...tan) * Math.hypot(...E))); n++; }
  }));
  ok(worst < 1e-6, n + ' points on field lines of a wiggled and a jolted charge: the lines built from light rays run exactly along the field (worst angle ' + worst.toExponential(1) + ' rad)');
  // and the history-based version used on screen gives the same points
  const m = P.wiggle(0.3, 1e8), H = P.makeHistory(1e-11, 4000);
  for (let i = 0; i < 4000; i++) { const t = i * 1e-11, s = m(t); H.t[i] = t; H.x[i] = s.x; H.y[i] = s.y; H.vx[i] = s.vx; H.vy[i] = s.vy; } H.len = 4000;
  const T = 3999e-11, pts = P.fieldLine(H, T, 0.7, 1), L = line(m, T, 0.7);
  let wh = 0; pts.forEach((p, j) => { const q = L(H.t[H.len - 1 - j]); wh = Math.max(wh, Math.hypot(p[0] - q[0], p[1] - q[1])); });
  ok(wh < 1e-9, 'the field lines drawn from the recorded motion match the same construction done directly');
  // the kink travels at c: after a jolt, the bend sits on the sphere of radius c (t - T)
  const mj = P.jolt(0.5, 6e-9), tj = 30e-9, Lj = line(mj, tj, 1.2), mid = Lj(3e-9), r = Math.hypot(mid[0] - 0.25, mid[1] - 0.25);
  ok(Math.abs(r - c * (tj - 3e-9)) < 0.3, 'after a jolt, the kink is on a sphere spreading at the speed of light (' + r.toFixed(2) + ' m after ' + ((tj - 3e-9) * 1e9).toFixed(0) + ' ns)');
}
// 3. the antenna
{
  const k = 2 * Math.PI / 3; let wd = 0, wt = 0;
  for (const ph of [0, 0.8, 2.1]) for (let x = 0.4; x < 8; x += 0.71) for (let y = -4; y < 4; y += 0.77) {
    // divergence in 3D for a field symmetric about the antenna's axis: (1/s) d(s E_x)/dx + dE_y/dy, s = x
    const h = 1e-5, Ea = P.dipoleE(x + h, y, k, ph), Eb = P.dipoleE(x - h, y, k, ph), Ec = P.dipoleE(x, y + h, k, ph), Ed = P.dipoleE(x, y - h, k, ph), E = P.dipoleE(x, y, k, ph);
    const div = ((x + h) * Ea[0] - (x - h) * Eb[0]) / (2 * h * x) + (Ec[1] - Ed[1]) / (2 * h);
    const scale = Math.hypot(...E) / Math.hypot(x, y) + 1e-12; wd = Math.max(wd, Math.abs(div) / scale);
    const gx = (P.dipolePsi(x + h, y, k, ph) - P.dipolePsi(x - h, y, k, ph)) / (2 * h), gy = (P.dipolePsi(x, y + h, k, ph) - P.dipolePsi(x, y - h, k, ph)) / (2 * h);
    wt = Math.max(wt, Math.abs(E[0] * gx + E[1] * gy) / (Math.hypot(...E) * Math.hypot(gx, gy)));
  }
  ok(wd < 1e-4, 'the antenna\'s field has no divergence anywhere in empty space (Gauss\'s law with no charge there)');
  ok(wt < 1e-6, 'and its field lines, drawn as contours of the flux function, run along the field everywhere');
  const near = P.dipoleE(0.003, 0.004, k, 0), r = 0.005, rho = k * r, ct = 0.8, st = 0.6;
  const stat = [3 * st * ct / rho ** 3, (2 * ct * ct - st * st) / rho ** 3];   // static dipole, (2 cos r-hat + sin theta-hat) / rho^3, in x and y
  ok(Math.abs(near[0] / stat[0] - 1) < 1e-3 && Math.abs(near[1] / stat[1] - 1) < 1e-3, 'close to the antenna it is the field of a static dipole, falling as 1/r^3');
  const far = P.dipoleE(300, 0, k, 0), rho2 = k * 300;
  ok(Math.abs(Math.hypot(...far) * rho2 / Math.abs(Math.cos(rho2)) - 1) < 1e-3, 'far away, broadside, it falls as 1/r: radiation');
  const along = Math.hypot(...P.dipoleE(0.001, 300, k, 0.3)), side = Math.hypot(...P.dipoleE(300, 0.001, k, 0.3));
  ok(along / side < 1e-2, 'and nothing radiates along the antenna\'s own line: far away along it the field is ' + (along / side).toExponential(0) + ' of that broadside');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
