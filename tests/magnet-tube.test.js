// Magnet falling through a copper tube: elliptic integrals against tables, the loop-to-loop inductance
// against its far-field limit, and the drag model against a published measurement.
const c = require('./load.js')('magnet-tube');
let bad = 0;
const chk = (n, got, want, tol) => {
  const ok = Math.abs(got - want) <= tol * Math.max(1e-300, Math.abs(want)); if (!ok) bad++;
  console.log((ok ? '  ok   ' : '  FAIL ') + n.padEnd(58) + got.toPrecision(9) + '  vs ' + want.toPrecision(9));
};
console.log('elliptic integrals against tabulated values');
{ const [K, E] = c.ellipKE(0.5); chk('K(m = 1/2)', K, 1.854074677301372, 1e-13); chk('E(m = 1/2)', E, 1.350643881047675, 1e-13); }
{ const [K, E] = c.ellipKE(0); chk('K(0) = pi/2', K, Math.PI / 2, 1e-15); chk('E(0) = pi/2', E, Math.PI / 2, 1e-15); }
{ const [K, E] = c.ellipKE(0.99); chk('K(m = 0.99)', K, 3.695637362989875, 1e-12); chk('E(m = 0.99)', E, 1.015993545025224, 1e-12); }

console.log('\nmutual inductance: far apart it must become the dipole-dipole value mu0 pi r1^2 r2^2 / (2 s^3)');
// leading dipole-dipole term with its first correction, -(3/2)(r1^2 + r2^2)/s^2; what is left is O((r/s)^4)
for (const s of [0.05, 0.2, 1.0]) chk(`s = ${s} m`, c.mutual(0.008, 0.006, s), c.MU0 * Math.PI * 0.008 ** 2 * 0.006 ** 2 / (2 * s ** 3) * (1 - 1.5 * (0.008 ** 2 + 0.006 ** 2) / (s * s)), s < 0.1 ? 1e-2 : s < 0.5 ? 1e-4 : 1e-6);
console.log('  ...and the series and the elliptic forms must agree where they hand over (m = 1e-3)');
{ // evaluate both branches right at the switch
  const r1 = 0.008, r2 = 0.006, s = Math.sqrt(4 * r1 * r2 / 1e-3 - (r1 + r2) ** 2);
  const m = 4 * r1 * r2 / ((r1 + r2) ** 2 + s * s), k = Math.sqrt(m), [K, E] = c.ellipKE(m);
  const ell = (2 / k - k) * K - (2 / k) * E, ser = Math.PI * k * m / 16 * (1 + 0.75 * m + 75 / 128 * m * m);
  chk('series vs elliptic at the switch point', ser, ell, 1e-7);
}

console.log('\na tiny magnet must look like a point dipole: flux mu0 m r^2 / (2 (r^2+u^2)^(3/2))');
{
  const mag = { Br: 1.3, b: 4e-5, L: 4e-5 }, m = mag.Br * Math.PI * mag.b ** 2 * mag.L / c.MU0, r = 0.009;
  for (const u of [0, 0.005, 0.02]) chk(`flux at u = ${u}`, c.Phi(r, mag, u), c.MU0 * m * r * r / (2 * (r * r + u * u) ** 1.5), 1e-4);
  // dPhi from the end-face formula against a finite difference of the flux
  const big = { Br: 1.3, b: 0.00635, L: 0.0127 }, h = 1e-6;
  chk('dPhi/du = 0 at u = 0 by symmetry (absolute)', Math.abs(c.dPhi(0.009, big, 0)) < 1e-15 ? 1 : 0, 1, 0);
  for (const u of [0.004, 0.011, 0.03]) chk(`dPhi/du end-face formula vs numerical, u = ${u}`, c.dPhi(0.009, big, u), (c.Phi(0.009, big, u + h, 2000) - c.Phi(0.009, big, u - h, 2000)) / (2 * h), 1e-5);
}

console.log('\n...and its drag must approach the closed form 45 mu0^2 m^2 sigma / 1024 * (aIn^-3 - aOut^-3)/3');
{
  const tube = { aIn: 0.00785, aOut: 0.00975, sigma: 5.8e7 };
  for (const s of [0.05, 0.02, 0.005]) {
    const mag = { Br: 1.3, b: 0.00635 * s, L: 0.00635 * s };
    chk(`magnet scaled to ${s} of real size`, c.dragTable(mag, tube).kInf, c.dipoleDrag(mag, tube), s > 0.03 ? 5e-3 : 1e-3);
  }
}

console.log('\nthe integrator: deep in a long tube the drag is constant, so v(t) = vt (1 - exp(-t/tau)) exactly');
{
  const mag = { Br: 1.3, b: 0.00635, L: 0.00635, mass: 0.006 }, tube = { aIn: 0.00785, aOut: 0.00975, sigma: 5.8e7, len: 40 };
  const T = c.dragTable(mag, tube), k = T.kInf, tau = mag.mass / k, vt = mag.mass * c.GRAV / k;
  // start it at rest deep inside by integrating directly with constant k
  let v = 0, dt = 1e-4; const f = vv => c.GRAV - k * vv / mag.mass;
  for (let i = 0; i < 400; i++) { const a1 = f(v), a2 = f(v + dt / 2 * a1), a3 = f(v + dt / 2 * a2), a4 = f(v + dt * a3); v += dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4); }
  chk('v after 40 ms, RK4 vs exact', v, vt * (1 - Math.exp(-0.04 / tau)), 1e-10);
  console.log(`         tau = ${(tau * 1000).toFixed(2)} ms, so it reaches terminal speed within a centimetre or two of entering`);
}

console.log('\nenergy: gravitational energy released = kinetic energy + heat in the tube, all the way down');
{
  const mag = { Br: 1.3, b: 0.00635, L: 0.0127, mass: 0.012 }, tube = { aIn: 0.00785, aOut: 0.00975, sigma: 5.8e7, len: 1.0 };
  const T = c.dragTable(mag, tube), F = c.fall(mag, tube, T);
  let worst = 0;
  for (let i = 0; i < F.t.length; i += 50) {
    const PE = mag.mass * c.GRAV * (F.y[i] - F.y[0]), E = 0.5 * mag.mass * F.v[i] ** 2 + F.heat[i];
    worst = Math.max(worst, Math.abs(PE - E) / Math.max(PE, 1e-6));
  }
  chk('worst relative imbalance over the whole fall (want < 1e-6)', worst < 1e-6 ? 1 : 0, 1, 0);
  console.log(`         worst ${worst.toExponential(2)}; exits after ${F.tExit.toFixed(2)} s, heat ${(F.heat[F.heat.length - 1] * 1000).toFixed(1)} mJ`);
}

console.log('\n===== against experiment: Levin, da Silveira & Rizzato, Am. J. Phys. 74, 815 (2006) =====');
console.log('NdFeB discs r = 6.35 mm, h = 6.35 mm, 6 g each; copper pipe a = 7.85 mm, w = 1.9 mm, rho = 1.75e-8 ohm m');
console.log('measured terminal speeds: 1 disc 7.4 cm/s, 2 discs 6.4 cm/s, 3 discs 7.2 cm/s');
const meas = [7.4, 6.4, 7.2];
const tube = { aIn: 0.00785, aOut: 0.00785 + 0.0019, sigma: 1 / 1.75e-8 };
for (const Br of [1.20, 1.25, 1.30, 1.35]) {
  const row = [1, 2, 3].map(n => { const mag = { Br, b: 0.00635, L: 0.00635 * n, mass: 0.006 * n }; return 100 * mag.mass * c.GRAV / c.dragTable(mag, tube).kInf; });
  const dip = [1, 2, 3].map(n => { const mag = { Br, b: 0.00635, L: 0.00635 * n, mass: 0.006 * n }; return 100 * mag.mass * c.GRAV / c.dipoleDrag(mag, tube); });
  console.log(`  Br ${Br.toFixed(2)} T   model ${row.map(x => x.toFixed(2)).join(' / ')} cm/s   ` +
    `errors ${row.map((x, i) => ((x / meas[i] - 1) * 100).toFixed(0).padStart(3) + '%').join(' ')}   ` +
    `min at ${row.indexOf(Math.min(...row)) + 1} disc(s)   | point dipole ${dip.map(x => x.toFixed(2)).join(' / ')}`);
}
console.log('\nusing the magnet strength implied by their own surface-field readings (393, 501, 516 mT):');
// on-axis field at distance delta outside the end face of a uniformly magnetized cylinder
const Bface = (Br, d, r, delta) => Br / 2 * ((d + delta) / Math.hypot(d + delta, r) - delta / Math.hypot(delta, r));
const Bmeas = [0.393, 0.501, 0.516];
for (const delta of [0, 0.0005]) {
  const Brs = Bmeas.map((B, i) => B / Bface(1, 0.00635 * (i + 1), 0.00635, delta));
  const v = [1, 2, 3].map((n, i) => { const mag = { Br: Brs[i], b: 0.00635, L: 0.00635 * n, mass: 0.006 * n }; return 100 * mag.mass * c.GRAV / c.dragTable(mag, tube).kInf; });
  const vd = [1, 2, 3].map((n, i) => { const mag = { Br: Brs[i], b: 0.00635, L: 0.00635 * n, mass: 0.006 * n }; return 100 * mag.mass * c.GRAV / c.dipoleDrag(mag, tube); });
  console.log(`  probe ${delta * 1000} mm off the face -> Br ${Brs.map(x => x.toFixed(3)).join(' / ')} T`);
  console.log(`     finite-size model ${v.map(x => x.toFixed(2)).join(' / ')} cm/s  vs measured 7.4 / 6.4 / 7.2   errors ${v.map((x, i) => ((x / meas[i] - 1) * 100).toFixed(0) + '%').join(' ')}   minimum at ${v.indexOf(Math.min(...v)) + 1}`);
  console.log(`     point dipole      ${vd.map(x => x.toFixed(2)).join(' / ')} cm/s                              errors ${vd.map((x, i) => ((x / meas[i] - 1) * 100).toFixed(0) + '%').join(' ')}   minimum at ${vd.indexOf(Math.min(...vd)) + 1}`);
}
console.log(bad ? `\n${bad} FAILURES` : '\nall checks passed');
process.exitCode = bad ? 1 : 0;
