// Gravitational lensing: distances against the exact results for an all-matter and an empty universe; Einstein
// radii and bending against published numbers (1.75" at the Sun's edge; 0.902 mas for a solar mass 10 kpc away;
// 1.15" for a 200 km/s galaxy); the elliptical galaxy's bending against a brute-force sum over its mass; images and
// brightening against light rays shot through the lens and counted (a separate route, written here); the star-and-
// planet images against the same ray counts, and against the single star when the planet is tiny; caustics where
// the magnification blows up and where theory puts them; time delays against path lengths plus the Shapiro delay
// added up along the rays.
const L = require('./load.js')('gravitational-lensing');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const { PH } = L, Mpc = 1e6 * PH.pc, kpc = 1e3 * PH.pc, near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);

// 1. distances
(function () { const H0 = L.COSMO.H0, eds = { H0, Om: 1 }, empty = { H0, Om: 0 };
  ok([0.3, 1, 3].every(z => near(L.comoving(z, eds), 2 * PH.c / H0 * (1 - 1 / Math.sqrt(1 + z)), 1e-9)), 'comoving distance in an all-matter universe: 2c/H0 (1 - 1/sqrt(1+z)), z = 0.3, 1, 3');
  ok([0.3, 1, 3].every(z => near(L.comoving(z, empty), PH.c / H0 * z, 1e-12)), 'and in a universe of dark energy only: c z / H0');
  ok([0.5, 2].every(z => near(L.lookback(z, eds), 2 / (3 * H0) * (1 - Math.pow(1 + z, -1.5)), 1e-9)), 'lookback time in an all-matter universe: (2/3H0)(1 - (1+z)^-3/2)');
  const d = L.lensDistances(0.3, 1.0, eds), Dc = z => 2 * PH.c / H0 * (1 - 1 / Math.sqrt(1 + z));
  ok(near(d.Dls, (Dc(1) - Dc(0.3)) / 2, 1e-9) && Math.abs(d.Dls - (d.Ds - d.Dl)) > 0.1 * d.Dls, 'lens-to-source distance: (comoving difference)/(1 + zs), which is not Ds - Dl across the universe');
  const p = L.lensDistances(0.3, 1.0); ok(p.Dl / Mpc > 900 && p.Dl / Mpc < 1000 && p.Ds / Mpc > 1650 && p.Ds / Mpc < 1750, 'Planck universe: lens at z = 0.3 is ' + (p.Dl / Mpc).toFixed(0) + ' Mpc, source at z = 1 is ' + (p.Ds / Mpc).toFixed(0) + ' Mpc (angular-diameter)'); })();

// 2. how strong lenses are
ok(Math.abs(PH.G * PH.Msun / 1.3271244e20 - 1) < 2e-5, 'G times the Sun\'s mass matches the IAU value 1.3271244e20 m\u00B3/s\u00B2 (known far better than either alone)');
ok(Math.abs(L.bendAngle(PH.Msun, PH.Rsun) / PH.arcsec - 1.7512) < 0.0005, 'starlight grazing the Sun bends by 1.751 arcseconds (Einstein 1915; Eddington 1919)');
ok(near(L.thetaEPoint(PH.Msun, 10 * kpc, 1e9 * kpc, 1e9 * kpc - 10 * kpc) / PH.arcsec * 1e3, 0.902, 0.002), 'Einstein radius of one solar mass 10 kpc away, distant source: 0.902 milliarcseconds (Gould 2000)');
ok(near(L.thetaEIso(200e3, 1, 1) / PH.arcsec, 1.15, 0.005), 'isothermal galaxy with 200 km/s speed spread: 1.15 arcseconds times Dls/Ds');
ok(near(L.crossTime(0.3 * PH.Msun, 4 * kpc, 8 * kpc, 200e3), L.thetaEPoint(0.3 * PH.Msun, 4 * kpc, 8 * kpc, 4 * kpc) * 4 * kpc / 200e3, 1e-12) && L.crossTime(0.3 * PH.Msun, 4 * kpc, 8 * kpc, 200e3) / PH.day > 15 && L.crossTime(0.3 * PH.Msun, 4 * kpc, 8 * kpc, 200e3) / PH.day < 25, 'microlensing by a 0.3 solar-mass star halfway to the bulge lasts about ' + (L.crossTime(0.3 * PH.Msun, 4 * kpc, 8 * kpc, 200e3) / PH.day).toFixed(0) + ' days (typical: 20)');

// 3. the elliptical galaxy's bending, from adding up the pull of all its mass: alpha = (1/pi) sum kappa (x - x')/|x - x'|^2 dA.
//    In elliptical rings the mass per ring is even (kappa dA = sqrt(q)/(2q) dr dphi), and the mass outside a ring pulls
//    nothing inside it (as for a hollow shell), so the sum can stop at any ring outside the point.
(function () { const G = { kind: 'iso', q: 0.6, ang: 0 }, q = G.q;
  const brute = (x, y) => { const NR = 1500, NP = 1500, R = 4, dr = R / NR, dp = 2 * Math.PI / NP; let ax = 0, ay = 0;
    for (let i = 0; i < NR; i++) { const r = (i + 0.5) * dr; for (let j = 0; j < NP; j++) { const p = (j + 0.5) * dp, u = r * Math.cos(p) / q, v = r * Math.sin(p), dx = x - u, dy = y - v, d2 = dx * dx + dy * dy;
      const w = Math.sqrt(q) / (2 * q) * dr * dp; ax += w * dx / d2; ay += w * dy / d2; } }
    return [ax / Math.PI, ay / Math.PI]; };
  let worst = 0; [[0.7, 0.3], [-0.2, 1.1], [1.6, -0.9], [0.31, 0.27]].forEach(([x, y]) => { const a = L.deflect(G, x, y), b = brute(x, y); worst = Math.max(worst, Math.hypot(a[0] - b[0], a[1] - b[1]) / Math.hypot(...b)); });
  ok(worst < 4e-3, 'elliptical galaxy (axis ratio 0.6): bending matches a brute-force sum over its mass at 4 points (worst ' + (100 * worst).toFixed(2) + '%)');
  // and it rotates with the galaxy, and becomes the round one as q -> 1
  const R = { kind: 'iso', q: 0.6, ang: 0.7 }, a0 = L.deflect(G, 0.8, 0.2), c = Math.cos(0.7), s = Math.sin(0.7), a1 = L.deflect(R, c * 0.8 - s * 0.2, s * 0.8 + c * 0.2);
  ok(Math.hypot(a1[0] - (c * a0[0] - s * a0[1]), a1[1] - (s * a0[0] + c * a0[1])) < 1e-12, 'turning the galaxy turns its bending with it');
  const a2 = L.deflect({ kind: 'iso', q: 0.99999, ang: 0 }, 0.6, 0.8), a3 = L.deflect({ kind: 'iso', q: 1, ang: 0 }, 0.6, 0.8);
  ok(Math.hypot(a2[0] - a3[0], a2[1] - a3[1]) < 1e-4 && Math.abs(Math.hypot(...a3) - 1) < 1e-12, 'round galaxy: bending of exactly one Einstein radius toward the center, everywhere');
  // divergence of the bending is twice the mass per area (Gauss's law for lensing)
  const h = 1e-5, x = 0.9, y = -0.4, dv = (L.deflect(G, x + h, y)[0] - L.deflect(G, x - h, y)[0] + L.deflect(G, x, y + h)[1] - L.deflect(G, x, y - h)[1]) / (2 * h);
  ok(near(dv, 2 * L.kappa(G, x, y), 1e-6), 'divergence of the bending = 2 x mass per area'); })();

// 4. images and brightening against rays shot backward through the lens and counted (a separate route).
//    The brightening of a small source disk = (rays landing in it) / (rays that would land in it without the lens).
function rayCount(lens, sx, sy, rho, R, n) {
  const h = 2 * R / n; let hit = 0;
  for (let i = 0; i < n; i++) { const x = -R + (i + 0.5) * h; for (let j = 0; j < n; j++) { const y = -R + (j + 0.5) * h, t = L.traceBack(lens, x, y); if ((t[0] - sx) ** 2 + (t[1] - sy) ** 2 < rho * rho) hit++; } }
  return hit * h * h / (Math.PI * rho * rho);
}
(function () { const P = { kind: 'point' };
  let ok1 = true; [0.1, 0.5, 1, 2].forEach(u => L.pointImages(u).forEach(im => { const t = L.traceBack(P, im.x, 0); if (Math.abs(t[0] - u) > 1e-12 || Math.abs(Math.abs(im.mag) - Math.abs(1 / L.detJ(P, im.x, 0))) > 1e-5 * Math.abs(im.mag)) ok1 = false; }));
  ok(ok1, 'point lens: both images land on the source, and each one\'s brightening is 1 / (stretching determinant)');
  ok([0.1, 0.5, 1, 2].every(u => near(L.pointImages(u).reduce((s, im) => s + Math.abs(im.mag), 0), L.pointMag(u), 1e-12)), 'and they add to (u^2 + 2) / (u sqrt(u^2 + 4))');
  [[0.3, 0.05], [1.0, 0.05]].forEach(([u, rho]) => { const rc = rayCount(P, u, 0, rho, 2.6, 2600), dm = L.diskMag(v => L.pointMag(v), u, 0, rho, 6);
    const dmx = L.diskMag((x, y) => L.pointMag(Math.hypot(x, y)), u, 0, rho, 6);
    ok(near(rc, dmx, 0.02), 'source disk of radius ' + rho + ' at ' + u + ' Einstein radii: rays counted ' + rc.toFixed(3) + ', disk average of the formula ' + dmx.toFixed(3)); });
  const S = { kind: 'iso', q: 1 }; ok([0.2, 0.7, 1.4].every(u => L.isoImages(u).every(im => Math.abs(L.traceBack(S, im.x, 0)[0] - u) < 1e-12 && near(Math.abs(im.mag), Math.abs(1 / L.detJ(S, im.x, 0)), 1e-5))) && L.isoImages(1.4).length === 1 && L.isoImages(0.7).length === 2, 'round galaxy: two images inside the Einstein radius, one outside, brightening 1 +- 1/u');
  ok(L.isoImages(0.95).length === 2 && L.isoImages(1.05).length === 1, 'round galaxy: the second image appears exactly when the source comes inside the Einstein radius');
  // the source-disk average itself: exact for a constant and a linear brightening, and the average of r^2 is rho^2/2
  const rho = 0.1, x0 = 0.3, y0 = -0.2;
  ok(Math.abs(L.diskMag(() => 1, x0, y0, rho) - 1) < 1e-12 && Math.abs(L.diskMag((x, y) => 2 * x - y, x0, y0, rho) - (2 * x0 - y0)) < 1e-12, 'averaging over the source star\'s disk: exact for constant and linear brightening');
  ok(Math.abs(L.diskMag((x, y) => (x - x0) ** 2 + (y - y0) ** 2, x0, y0, rho, 12) / (rho * rho / 2) - 1) < 0.01, 'and the average of r\u00B2 over the disk is \u03C1\u00B2/2');
  // the critical curve: zero stretching determinant there; a round lens's is the Einstein ring
  const cr = L.isoCritical({ kind: 'iso', q: 0.7, ang: 0.3 }, 90), cr1 = L.isoCritical({ kind: 'iso', q: 1 }, 30);
  ok(cr.crit.every(p => Math.abs(L.detJ({ kind: 'iso', q: 0.7, ang: 0.3 }, p[0], p[1])) < 1e-6) && cr1.crit.every(p => Math.abs(Math.hypot(p[0], p[1]) - 1) < 1e-9), 'galaxy\'s critical curve: the stretching determinant is zero on it; for a round galaxy it is the Einstein ring');
  // elliptical galaxy: four images inside the diamond-shaped caustic, two outside; brightening checked by counting rays
  const G = { kind: 'iso', q: 0.7, ang: 0.3 };
  const four = L.findImages(G, 0.05, 0.03), two = L.findImages(G, 0.45, 0.35);
  ok(four.length === 4 && two.length === 2, 'elliptical galaxy: 4 images (an Einstein cross) for a source near the center, 2 farther out');
  const rc = rayCount(G, 0.05, 0.03, 0.02, 2.2, 2600), sum = four.reduce((s, im) => s + Math.abs(im.mag), 0);
  ok(near(rc, sum, 0.03), 'Einstein cross: total brightening ' + sum.toFixed(2) + ' from the four images, ' + rc.toFixed(2) + ' by counting rays'); })();

// 5. a star with a planet
(function () { const q = 0.003, s = 1.2, B = { kind: 'binary', m: [1 / (1 + q), q / (1 + q)], z: [[0, 0], [s, 0]] };
  // the images really solve the lens equation, and there are 3 or 5 of them
  let good = true, counts = {}; for (let i = 0; i < 40; i++) { const zx = -1 + 0.05 * i, zy = 0.03; const im = L.binaryImages(B, [zx, zy]); counts[im.length] = 1; if (!(im.length === 3 || im.length === 5)) good = false; }
  ok(good && counts[3] && counts[5], 'star and planet: 3 images, or 5 when the source is inside a caustic');
  [[0.5, 0.4, 6, 0.03], [-0.3, 0.2, 6, 0.03], [0.2, -0.6, 6, 0.03], [0.35, 0.04, 24, 0.05]].forEach(([x, y, rings, tol]) => { const rho = 0.02, rc = rayCount(B, x, y, rho, 2.6, 2600), dm = L.diskMag((a, b) => L.binaryMag(B, [a, b]), x, y, rho, rings);
    ok(near(rc, dm, tol), (rings > 6 ? 'over the planet\'s caustic, ' : '') + 'brightening at (' + x + ', ' + y + '): ' + dm.toFixed(3) + ' from the images, ' + rc.toFixed(3) + ' by counting rays'); });
  const tiny = { kind: 'binary', m: [1 - 1e-9, 1e-9], z: [[0, 0], [1.2, 0]] };
  ok([0.1, 0.4, 0.9].every(u => near(L.binaryMag(tiny, [u * 0.6, -u * 0.8]), L.pointMag(u), 1e-6)), 'a vanishingly small planet: back to the single star');
  // caustics: the magnification blows up there; the planet's own caustic sits near s - 1/s from the star (Han 2006)
  const cc = L.binaryCaustics(B, 720); let worst = 0; cc.forEach(c => { worst = Math.max(worst, Math.abs(L.detJ(B, c.crit[0], c.crit[1]))); });
  ok(worst < 1e-4, 'critical curves: the stretching determinant is zero there (worst ' + worst.toExponential(1) + ')');
  const pc = cc.filter(c => c.caus[0] > 0.2), mx = pc.reduce((m, c) => m + c.caus[0], 0) / pc.length;
  ok(pc.length > 0 && Math.abs(mx - (s - 1 / s)) < 0.03, 'planetary caustic centered at ' + mx.toFixed(3) + ' Einstein radii from the star; theory s - 1/s = ' + (s - 1 / s).toFixed(3));
  const mid = [s - 1 / s, 0.0]; ok(L.binaryMag(B, [mid[0] + 0.001, 0.001]) > 3 * L.pointMag(Math.hypot(mid[0], 0.001)) || L.binaryImages(B, [mid[0], 0.001]).length === 5, 'a source on the planet\'s caustic is brightened far more than by the star alone'); })();

// 6. time delays: path lengths and the Shapiro delay added up along each ray, compared with the formula.
//    (Static space, Dls = Ds - Dl, for this check.) A ray to image theta: observer -> lens plane at b = theta Dl ->
//    source at beta Ds. Geometry: (length - straight distance)/c; Shapiro: (2GM/c^3) sum dl / r, done exactly per segment.
(function () { const M = 1e12 * PH.Msun, Dl = 1000 * Mpc, Ds = 2000 * Mpc, Dls = Ds - Dl, tE = L.thetaEPoint(M, Dl, Ds, Dls), beta = 0.4 * tE;
  const along = (x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, l0 = x0 * ux + y0 * uy, b = Math.abs(x0 * uy - y0 * ux); return Math.asinh((l0 + len) / b) - Math.asinh(l0 / b); };
  // the lens sits at the origin; the observer at (-Dl, 0); the ray crosses the lens plane at (0, b); the source is at (Dls, beta Ds)
  const travel = th => { const b = th * Dl, h1 = b, h2 = beta * Ds - b;
    const geo = (h1 * h1 / (Math.sqrt(Dl * Dl + h1 * h1) + Dl) + h2 * h2 / (Math.sqrt(Dls * Dls + h2 * h2) + Dls)) / PH.c;
    const sh = 2 * PH.G * M / PH.c ** 3 * (along(-Dl, 0, 0, b) + along(0, b, Dls, beta * Ds));
    return geo + sh; };   // the slowing near the mass adds time
  const ims = L.pointImages(0.4).map(i => i.x * tE), dtPath = travel(ims[1]) - travel(ims[0]);
  const dtF = L.delayPoint(ims[1], beta, M, Dl, Ds, Dls) - L.delayPoint(ims[0], beta, M, Dl, Ds, Dls);
  ok(near(dtPath, dtF, 1e-4), 'point lens of 10^12 solar masses: images arrive ' + (dtF / PH.day).toFixed(1) + ' days apart, by the formula and by adding up each path (' + (dtPath / PH.day).toFixed(1) + ' days)');
  const tI = L.thetaEIso(250e3, Ds, Dls), bI = 0.3 * tI, d = L.isoImages(0.3).map(i => L.delayIso(i.x * tI, bI, tI, Dl, Ds, Dls)), dts = d[1] - d[0];
  ok(dts > 0 && near(dts, Dl * Ds / (PH.c * Dls) * 2 * tI * bI, 1e-9), 'round galaxy: the outer image leads, by (Dl Ds / c Dls) 2 thetaE beta = ' + (dts / PH.day).toFixed(1) + ' days'); })();

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
