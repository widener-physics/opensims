// Rainbows: water's refractive index against the IAPWS release's own verification values and the handbook
// values relative to air; every ray traced again here, by solving for where the line meets the sphere and turning it
// with Snell's law written in angles, against Descartes' formula for the angle out; the bow's angle against a brute-
// force search over 200 000 rays; the published angles of both bows; Fresnel's reflection against its limits and
// against energy conservation with the transmission coefficients; the sky's brightness against the light falling on a
// drop, the dark band between the bows, and the secondary's fainter peak; and where the bow sits in the sky against
// spherical trigonometry.
const R = require('./load.js')('rainbow');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const D = R.DEG;

// 1. water and air
ok(near(R.nWater(589, 0, 999.843), 1.334344, 2e-6) && near(R.nWater(226.5, 0, 999.843), 1.394527, 2e-6) && near(R.nWater(1013.98, 0, 999.843), 1.326135, 2e-6),
   'IAPWS R9-97 verification values at 0 °C and 0.1 MPa: 1.394527 at 226.5 nm, 1.334344 at 589 nm, 1.326135 at 1013.98 nm');
ok(near(R.nWater(589), 1.33335, 1e-4) && R.nWater(589, 40, 992.22) < R.nWater(589), 'at 20 °C, relative to a vacuum: ' + R.nWater(589).toFixed(5) + '; warmer water bends less');
ok(near((R.nAir(589.3) - 1) * 1e4, 2.77, 0.03) && R.nAir(400) > R.nAir(700), 'air: n − 1 = ' + ((R.nAir(589.3) - 1) * 1e4).toFixed(3) + ' × 10⁻⁴ at 589 nm (published 2.77), a little more for blue');
ok(near(R.nDrop(589.3), 1.33299, 3e-5) && near(R.nDrop(486.1), 1.33712, 1e-4) && near(R.nDrop(656.3), 1.33115, 1e-4), 'water relative to air at 20 °C, as handbooks list it: 1.33299 (sodium D), 1.33712 (hydrogen F), 1.33115 (hydrogen C)');
const abbe = (R.nDrop(589.3) - 1) / (R.nDrop(486.1) - R.nDrop(656.3));
ok(near(abbe, 55.7, 0.5), 'Abbe number of water ' + abbe.toFixed(1) + ' (published 55.7)');
ok(R.SPECTRUM.every((nm, j) => j === 0 || R.nDrop(nm) < R.nDrop(R.SPECTRUM[j - 1])) && R.SPECTRUM[0] === 400 && R.SPECTRUM[R.SPECTRUM.length - 1] === 700,
   'from violet (400 nm) to red (700 nm), the index falls: violet bends most');

// 2. every ray traced again, a different way
function trace(b, n, k) {
  // where a line meets the unit circle (the far root), by the quadratic
  const hit = (p, d) => { const B = p[0] * d[0] + p[1] * d[1], C = p[0] * p[0] + p[1] * p[1] - 1, t = -B + Math.sqrt(B * B - C); return [p[0] + t * d[0], p[1] + t * d[1]]; };
  const ang = v => Math.atan2(v[1], v[0]), dir = a => [Math.cos(a), Math.sin(a)];
  let p = hit([-5, b], [1, 0]);                                // where it enters: the near root, from outside
  p = [-Math.sqrt(1 - b * b), b];
  // Snell's law in angles: measured from the inward normal at the entry point
  const nIn = ang([-p[0], -p[1]]), i = 0 - nIn, r = Math.asin(Math.sin(i) / n);
  let a = nIn + r; const path = [p];
  for (let j = 0; j <= k; j++) {
    p = hit(p, dir(a)); path.push(p);
    const nrm = ang(p); if (j < k) { const inc = a - nrm; a = nrm + Math.PI - inc; }      // mirror about the normal
  }
  const nrm = ang(p), inc = Math.atan2(Math.sin(a - nrm), Math.cos(a - nrm)), out = nrm + Math.asin(n * Math.sin(inc));
  return { path, out: dir(out), i, r };
}
let worst = 0, worstPts = 0, snellBad = 0;
for (const k of [1, 2, 3]) for (const nm of [400, 550, 700]) for (let j = 1; j < 200; j++) {
  const b = j / 200, n = R.nDrop(nm), t = trace(b, n, k), c = R.path(b, n, k);
  const back = Math.acos(-t.out[0]) / D;                       // the angle between the light out and the line back toward the Sun
  worst = Math.max(worst, Math.abs(back - R.angleOut(b, n, k) / D), Math.hypot(t.out[0] - c.out[0], t.out[1] - c.out[1]));
  c.pts.slice(1).forEach((q, m) => { worstPts = Math.max(worstPts, Math.abs(Math.hypot(q[0], q[1]) - 1), m < t.path.length ? Math.hypot(q[0] - t.path[m][0], q[1] - t.path[m][1]) : 0); });
  if (Math.abs(Math.sin(t.i) - n * Math.sin(t.r)) > 1e-12) snellBad++;
}
ok(worst < 1e-7, 'Descartes\' angle out (and the drawn ray\'s direction) agrees with tracing each ray again for 1, 2 and 3 bounces, 3 colors, 199 heights: worst ' + worst.toExponential(1));
ok(worstPts < 1e-9 && snellBad === 0, 'the drawn ray meets the drop\'s surface where the second tracing does, every time');
ok(near(R.angleOut(0, 1.333, 1), 0, 1e-12) && near(R.angleOut(1e-9, 1.333, 2) / D, 180, 1e-6), 'a ray through the middle comes straight back after one bounce, and goes straight on after two');

// 3. the bow: where the light piles up
function scan(n, k) { let best = k === 1 ? -1 : 9, bb = 0; for (let j = 1; j < 200000; j++) { const b = j / 200000, a = R.angleOut(b, n, k); if (k === 1 ? a > best : a < best) { best = a; bb = b; } } return { b: bb, deg: best / D }; }
let wb = 0; for (const k of [1, 2]) for (const nm of R.SPECTRUM) { const n = R.nDrop(nm), s = scan(n, k), f = R.bow(n, k); wb = Math.max(wb, Math.abs(s.deg - f.deg), Math.abs(s.b - f.b) * 1e-2); }
ok(wb < 1e-6, 'the bow\'s angle, from cos² i = (n² − 1)/(k² + 2k), against a search over 200 000 rays for the farthest (primary) and nearest (secondary) angle out: worst ' + wb.toExponential(1) + '°');
const p1 = R.SPECTRUM.map(nm => R.bow(R.nDrop(nm), 1).deg), p2 = R.SPECTRUM.map(nm => R.bow(R.nDrop(nm), 2).deg);
ok(near(p1[p1.length - 1], 42.4, 0.3) && near(p1[0], 40.6, 0.3), 'primary bow: red at ' + p1[p1.length - 1].toFixed(2) + '°, violet at ' + p1[0].toFixed(2) + '° (published about 42° and 40.6°): red on the outside');
ok(near(p2[p2.length - 1], 50.2, 0.4) && near(p2[0], 53.5, 0.4), 'secondary bow: red at ' + p2[p2.length - 1].toFixed(2) + '°, violet at ' + p2[0].toFixed(2) + '° (published about 50° and 53.5°): colors reversed');
ok(p1.every((a, j) => j === 0 || a > p1[j - 1]) && p2.every((a, j) => j === 0 || a < p2[j - 1]), 'the order of the colors is the same all the way through the spectrum');
ok(near(p2[p2.length - 1] - p1[p1.length - 1], 7.7, 0.6), 'Alexander\'s dark band between red and red: ' + (p2[p2.length - 1] - p1[p1.length - 1]).toFixed(1) + '° wide (published about 8°)');
ok(near(R.bow(R.nDrop(589), 1).b, 0.86, 0.01) && near(R.bow(R.nDrop(589), 2).b, 0.95, 0.01), 'the rays that make the bows enter at ' + R.bow(R.nDrop(589), 1).b.toFixed(2) + ' (primary) and ' + R.bow(R.nDrop(589), 2).b.toFixed(2) + ' (secondary) of the way out from the middle');

// 4. how much light a ray keeps
const n0 = R.nDrop(589), F0 = R.fresnel(0, n0), Fb = R.fresnel(Math.atan(n0), n0), F90 = R.fresnel(89.9999 * D, n0);
ok(near(F0.s, ((n0 - 1) / (n0 + 1)) ** 2, 1e-12) && near(F0.p, F0.s, 1e-12), 'head on, both polarizations reflect ((n − 1)/(n + 1))² = ' + (100 * F0.s).toFixed(2) + '%');
ok(Fb.p < 1e-20 && F90.s > 0.999 && F90.p > 0.999, 'none of one polarization at Brewster\'s angle (' + (Math.atan(n0) / D).toFixed(1) + '°); nearly all of both at grazing incidence');
let eb = 0; for (let j = 0; j < 90; j++) { const i = j * D, r = Math.asin(Math.sin(i) / n0), F = R.fresnel(i, n0);
  const ts = 2 * Math.cos(i) / (Math.cos(i) + n0 * Math.cos(r)), tp = 2 * Math.cos(i) / (n0 * Math.cos(i) + Math.cos(r)), f = n0 * Math.cos(r) / Math.cos(i);
  eb = Math.max(eb, Math.abs(F.s + f * ts * ts - 1), Math.abs(F.p + f * tp * tp - 1)); }
ok(eb < 1e-12, 'reflected plus transmitted light, from Fresnel\'s amplitude coefficients, is all the light at every angle (worst ' + eb.toExponential(1) + ')');
// the light kept, from the amplitudes instead: in through the front, reflected inside (seen from inside, at r), out through the back
let wk = 0; for (const k of [1, 2, 3]) for (let j = 1; j < 100; j++) { const b = j / 100, i = Math.asin(b), r = Math.asin(b / n0), ci = Math.cos(i), cr = Math.cos(r);
  const tIn = [2 * ci / (ci + n0 * cr), 2 * ci / (n0 * ci + cr)], rIn = [(n0 * cr - ci) / (n0 * cr + ci), (cr - n0 * ci) / (cr + n0 * ci)], tOut = [2 * n0 * cr / (n0 * cr + ci), 2 * n0 * cr / (cr + n0 * ci)];
  const power = q => (tIn[q] * rIn[q] ** k * tOut[q]) ** 2;          // in and out again, the two factors n cos r / cos i cancel
  wk = Math.max(wk, Math.abs(R.kept(b, n0, k) - 0.5 * (power(0) + power(1)))); }
ok(wk < 1e-12, 'the light a ray keeps, from Fresnel\'s amplitudes seen from inside the drop, agrees for 1 to 3 bounces at 99 heights (worst ' + wk.toExponential(1) + ')');
const kb = R.kept(R.bow(n0, 1).b, n0, 1), kb2 = R.kept(R.bow(n0, 2).b, n0, 2);
ok(kb > 0.03 && kb < 0.06 && kb2 < kb / 2, 'at the bow a ray keeps ' + (100 * kb).toFixed(1) + '% of its light after one bounce, ' + (100 * kb2).toFixed(1) + '% after two');

// 5. the brightness of the sky
const step = 0.25, B1 = R.brightness(n0, 1, step), B2 = R.brightness(n0, 2, step);
const total = B => B.reduce((s, v, m) => s + v * 2 * Math.PI * Math.sin((m + 0.5) * step * D) * step * D, 0);
let simp = 0; const M = 20000; for (let j = 0; j <= M; j++) { const b = j / M, w = j === 0 || j === M ? 1 : j % 2 ? 4 : 2; simp += w * R.kept(b, n0, 1) * 2 * b; } simp /= 3 * M;
ok(Math.abs(total(B1) / simp - 1) < 1e-3, 'all the light sent out after one bounce, added up over the sky, equals the light kept by the rays falling on the drop\'s face (Simpson\'s rule): ' + (100 * simp).toFixed(2) + '%');
const peak = B => (B.indexOf(Math.max(...B)) + 0.5) * step;           // the middle of the brightest slice
ok(near(peak(B1), R.bow(n0, 1).deg, step) && near(peak(B2), R.bow(n0, 2).deg, step), 'the brightest ' + step + '° slice of sky is the one right at each bow: centered on ' + peak(B1) + '° and ' + peak(B2) + '° (bows at ' + R.bow(n0, 1).deg.toFixed(2) + '° and ' + R.bow(n0, 2).deg.toFixed(2) + '°)');
const b1 = Math.ceil(R.bow(n0, 1).deg / step), b2 = Math.floor(R.bow(n0, 2).deg / step);
ok(B1.slice(b1).every(v => v === 0) && B2.slice(0, b2).every(v => v === 0), 'no light once reflected beyond the primary, and none twice reflected inside the secondary: the dark band gets neither');
const inside = B1.slice(Math.round(30 / step), Math.round(38 / step)).reduce((s, v) => s + v, 0) / (8 / step), outside = B2.slice(Math.round(56 / step), Math.round(64 / step)).reduce((s, v) => s + v, 0) / (8 / step);
ok(Math.max(...B2) < Math.max(...B1) && inside > outside, 'the secondary bow is fainter, and the sky just inside the primary is brighter than just outside the secondary');
const cnt = R.rayCount(n0, 1, 1, 400);
const top = cnt.indexOf(Math.max(...cnt));
ok(cnt.reduce((s, v) => s + v, 0) === 400 && top <= R.bow(n0, 1).deg && top + 1 >= R.bow(n0, 1).deg - 1 && Math.max(...cnt) > 3 * 400 / 42, 'of 400 evenly spaced rays, the most come out in the 1° slice just inside the bow: ' + Math.max(...cnt) + ', against ' + (400 / 42).toFixed(0) + ' if they spread evenly');

// 6. where the bow is in the sky
const sep = (az1, el1, az2, el2) => Math.acos(Math.sin(el1 * D) * Math.sin(el2 * D) + Math.cos(el1 * D) * Math.cos(el2 * D) * Math.cos((az1 - az2) * D)) / D;
let ws = 0; for (const h of [0, 10, 25, 41, 50]) R.bowCircle(h, 42, 72).forEach(q => { ws = Math.max(ws, Math.abs(sep(q.az, q.el, 0, -h) - 42), Math.abs(R.fromShadow(q.az, q.el, h) - 42)); });
ok(ws < 1e-9, 'every point of the drawn bow is 42° from the shadow of your head, by the spherical law of cosines (worst ' + ws.toExponential(1) + '°)');
ok([0, 10, 30].every(h => near(Math.max(...R.bowCircle(h, 42, 3600).map(q => q.el)), R.bowTop(h, 42), 1e-3)) && Math.max(...R.bowCircle(45, 42, 720).map(q => q.el)) < 0,
   'the top of the bow is 42° minus the Sun\'s height above the horizon; with the Sun higher than 42°, the whole bow is below it');
ok(near(Math.min(...R.bowCircle(0, 42, 3600).map(q => q.el)), -42, 1e-3) && near(Math.max(...R.bowCircle(0, 42, 3600).map(q => Math.abs(q.az))), 42, 1e-3), 'at sunset the bow is a half circle standing on the horizon, 42° high and 84° across');

// 7. colors
const [r7, g7, b7] = R.hue(700), [r5, g5, b5] = R.hue(530), [r4, g4, b4] = R.hue(450), [rv, gv, bv] = R.hue(400);
ok(r7 > 3 * b7 && g5 > r5 && g5 > b5 && b4 > r4 && b4 > g4 && Math.max(r7, g7, b7) === 255 && bv === 255 && rv > gv, 'the screen colors: 700 nm red, 530 nm green, 450 nm blue, 400 nm violet, each at full brightness');
// the CIE 1931 table (published values) against the fit, which is good to a few percent
const CIE = [[450, 0.3362, 0.0380, 1.7721], [500, 0.0049, 0.3230, 0.2720], [555, 0.5121, 1.0000, 0.0057], [600, 1.0622, 0.6310, 0.0008], [650, 0.2835, 0.1070, 0.0000]];
const wc = Math.max(...CIE.map(([nm, x, y, z]) => Math.max(...R.cmf(nm).map((v, a) => Math.abs(v - [x, y, z][a])))));
ok(wc < 0.05, 'the color-matching functions match the CIE 1931 table at 450, 500, 555, 600 and 650 nm to within ' + wc.toFixed(3));
const SRGB = [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]];      // the sRGB standard's forward matrix
let wm = 0; for (let q = 0; q < 3; q++) { const c = R.linRGB(SRGB[0][q], SRGB[1][q], SRGB[2][q]); c.forEach((v, a) => { wm = Math.max(wm, Math.abs(v - (a === q ? 1 : 0))); }); }
ok(wm < 2e-3, 'the conversion to screen colors undoes the sRGB standard\'s matrix: its red, green and blue come back pure (worst ' + wm.toExponential(1) + ')');
ok(R.gamma(0.5) === 188 && R.gamma(0.18) === 118 && R.gamma(0.002) === 7 && R.gamma(1) === 255 && R.gamma(0) === 0 && R.gamma(2) === 255, 'the sRGB curve: half the light is 188 of 255, 18% gray is 118');
let X = 0, Y = 0, Z = 0; for (let nm = 360; nm <= 830; nm++) { const c = R.cmf(nm); X += c[0]; Y += c[1]; Z += c[2]; }
ok(near(X / Y, 1, 0.02) && near(Z / Y, 1, 0.02), 'light with the same power at every wavelength comes out white: X : Y : Z = ' + (X / Y).toFixed(3) + ' : 1 : ' + (Z / Y).toFixed(3));
const wl = Array.from({ length: 500 }, (_, j) => 300 + j); const sunPeak = wl.reduce((m, nm) => R.sun(nm) > R.sun(m) ? nm : m, 300);
ok(near(sunPeak, 2.897772e6 / 5772, 1.5), 'sunlight\'s spectrum peaks at ' + sunPeak + ' nm, as Wien\'s law gives for 5772 K');
process.exit(fails ? 1 : 0);
