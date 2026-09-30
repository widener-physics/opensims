// Newton's cannonball: the closed-form conic the sim draws, checked against a direct numerical
// integration of the inverse-square pull, for every kind of path from a short arc to escape.
const c = require('./load.js')('newtons-cannon');
let bad = 0;
const chk = (n, got, want, tol) => {
  const ok = Math.abs(got - want) <= tol * Math.max(1, Math.abs(want)); if (!ok) bad++;
  console.log((ok ? '  ok   ' : '  FAIL ') + n.padEnd(62) + (+got).toPrecision(10) + '  vs ' + (+want).toPrecision(10));
};
const H = c.H0;   // the sim's mountain

console.log('orbital elements against energy and angular momentum (a formula the sim does not use)');
for (const v of [3000, 6500, 7290, 7456, 9000, 10540, 12000]) {
  const o = c.solve(H, v), eFromE = Math.sqrt(Math.max(0, 1 + 2 * o.E * o.L * o.L / (c.MU * c.MU)));
  chk('v = ' + (v / 1000).toFixed(2) + ' km/s: e = sqrt(1 + 2 E L^2 / mu^2)', o.e, eFromE, 1e-9);
}

// the same launch, integrated step by step: RK4 on r'' = -mu r / |r|^3, starting where the sim starts
// (on top of the mountain, moving to the right)
function integrate(v, tEnd, dt) {
  let x = 0, y = c.RE + H, vx = v, vy = 0;
  const acc = (x, y) => { const r3 = Math.pow(x * x + y * y, 1.5); return [-c.MU * x / r3, -c.MU * y / r3]; };
  const out = [];
  for (let t = 0; t < tEnd - 1e-9; t += dt) {
    const h = Math.min(dt, tEnd - t);
    const [a1x, a1y] = acc(x, y);
    const [a2x, a2y] = acc(x + h / 2 * vx, y + h / 2 * vy);
    const [a3x, a3y] = acc(x + h / 2 * (vx + h / 2 * a1x), y + h / 2 * (vy + h / 2 * a1y));
    const [a4x, a4y] = acc(x + h * (vx + h / 2 * a2x), y + h * (vy + h / 2 * a2y));
    const k2vx = vx + h / 2 * a1x, k2vy = vy + h / 2 * a1y, k3vx = vx + h / 2 * a2x, k3vy = vy + h / 2 * a2y, k4vx = vx + h * a3x, k4vy = vy + h * a3y;
    x += h / 6 * (vx + 2 * k2vx + 2 * k3vx + k4vx); y += h / 6 * (vy + 2 * k2vy + 2 * k3vy + k4vy);
    vx += h / 6 * (a1x + 2 * a2x + 2 * a3x + a4x); vy += h / 6 * (a1y + 2 * a2y + 2 * a3y + a4y);
    out.push({ t: t + h, x, y });
  }
  return out;
}
console.log('\nthe drawn path against a direct integration, all the way to the ground or round one orbit');
console.log('(7.29 km/s is the apogee launch whose second half once came out at negative times)');
for (const v of [3000, 6500, 7290, 7456, 9000, 10540, 12000]) {
  const o = c.solve(H, v), t0 = c.tOf(o.nu0, o), tEnd = Math.min(o.tEnd, 20000);
  const path = integrate(v, tEnd, 0.5);
  let worst = 0;
  path.forEach((p, i) => { if (i % 20) return; const [x, y] = c.xy(o, c.nuOf(t0 + p.t, o)); worst = Math.max(worst, Math.hypot(x - p.x, y - p.y)); });
  chk('v = ' + (v / 1000).toFixed(2) + ' km/s: largest gap over ' + (tEnd / 60).toFixed(0) + ' min (m, want < 1)', worst, 0, 1);
}

console.log('\ntime and true anomaly are exact inverses, and time never runs backward, over 230 launch speeds');
{
  let worstInv = 0, backwards = 0;
  for (let k = 0; k < 230; k++) {
    const v = 500 + k * 50, o = c.solve(H, v);
    let prev = -Infinity;
    for (let j = 0; j <= 200; j++) {
      const nu = o.nu0 + (o.nuHit !== null ? o.nuHit - o.nu0 : o.nuMax - o.nu0) * j / 200, t = c.tOf(nu, o);
      if (t < prev - 1e-6) backwards++;
      prev = t;
      if (isFinite(t)) worstInv = Math.max(worstInv, Math.abs(c.nuOf(t, o) - nu));
    }
  }
  chk('worst |nu(t(nu)) - nu| (rad)', worstInv, 0, 1e-8);
  chk('places where time ran backward', backwards, 0, 0);
}

console.log('\nwhere it lands, and when it comes round again');
for (const v of [3000, 5000, 7000]) {
  const o = c.solve(H, v);
  chk('v = ' + (v / 1000).toFixed(1) + ' km/s: radius at the impact point = Earth radius', c.rOf(o, o.nuHit), c.RE, 1e-12);
  chk('   range = angle swept x Earth radius', o.range, (o.nuHit - o.nu0) * c.RE, 1e-12);
}
for (const v of [8000, 9500]) {
  const o = c.solve(H, v), path = integrate(v, o.T, 0.25), last = path[path.length - 1];
  chk('v = ' + (v / 1000).toFixed(1) + ' km/s: back at the mountain after one period (m from start)', Math.hypot(last.x, last.y - (c.RE + H)), 0, 5);
}
{
  const vc = c.solve(H, 7000).vc, ve = c.solve(H, 7000).ve;
  chk('circular speed sqrt(mu / r0)', vc, Math.sqrt(c.MU / (c.RE + H)), 1e-12);
  chk('escape speed = sqrt(2) x circular', ve / vc, Math.SQRT2, 1e-12);
  chk('at circular speed the path is a circle (e)', c.solve(H, vc).e, 0, 1e-12);
  chk('at escape speed the path is a parabola (e)', c.solve(H, ve).e, 1, 1e-12);
}
console.log(bad ? `\n${bad} FAILURES` : '\nall checks passed');
process.exitCode = bad ? 1 : 0;
