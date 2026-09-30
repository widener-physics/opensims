// Thin-film interference: exact reflectance against an independent transfer-matrix calculation, textbook
// limits, the CIE 1931 color tables, and Newton's sequence of soap-film colors.
const P = require('./load.js')('thin-film');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
// independent check: characteristic (transfer) matrix of a single layer, Born and Wolf section 1.6
function tmm(n0, n1, n2, d, lam, s, pol) {
  const c0 = Math.sqrt(1 - (s / n0) ** 2), c1 = Math.sqrt(1 - (s / n1) ** 2), c2 = Math.sqrt(1 - (s / n2) ** 2);
  const Y = (n, c) => pol === 's' ? n * c : n / c;            // tilted admittances
  const y0 = Y(n0, c0), y1 = Y(n1, c1), y2 = Y(n2, c2), b = 2 * Math.PI * n1 * d * c1 / lam;
  // M = [[cos b, i sin b / y1], [i y1 sin b, cos b]];  [B, C] = M [1, y2]
  const Br = Math.cos(b), Bi = Math.sin(b) * y2 / y1, Cr = y2 * Math.cos(b), Ci = y1 * Math.sin(b);
  const nr = y0 * Br - Cr, ni = y0 * Bi - Ci, dr = y0 * Br + Cr, di = y0 * Bi + Ci;
  const R = (nr * nr + ni * ni) / (dr * dr + di * di);
  const T = 4 * y0 * y2 / (dr * dr + di * di);
  return { R, T };
}
// 1. exact Airy result against the transfer matrix, both polarizations averaged, many random cases; and R + T = 1
{
  let worst = 0, cons = 0, seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 3000; k++) {
    const n0 = rnd() < 0.3 ? 1.52 : 1, n1 = 1 + rnd() * 0.8, n2 = 1 + rnd() * 0.8, d = rnd() * 3000, lam = 380 + rnd() * 400;
    const s = rnd() < 0.3 ? 0 : rnd() * Math.min(0.85, n1 * 0.99, n2 * 0.99);   // no total internal reflection
    const a = P.film(n0, n1, n2, d, lam, s), ts = tmm(n0, n1, n2, d, lam, s, 's'), tp = tmm(n0, n1, n2, d, lam, s, 'p');
    worst = Math.max(worst, Math.abs(a.R - (ts.R + tp.R) / 2));
    cons = Math.max(cons, Math.abs(ts.R + ts.T - 1), Math.abs(tp.R + tp.T - 1));
  }
  ok(worst < 1e-12, 'exact reflectance agrees with the transfer-matrix method in 3000 random cases, oblique and both polarizations (worst ' + worst.toExponential(1) + ')');
  ok(cons < 1e-12, 'the transfer matrix conserves energy, R + T = 1 (worst ' + cons.toExponential(1) + ')');
}
// 2. limits
{
  const bare = (a, b) => ((a - b) / (a + b)) ** 2;
  ok(Math.abs(P.film(1, 1.38, 1.52, 0, 550).R - bare(1, 1.52)) < 1e-15, 'zero thickness: the film vanishes and bare glass is left (' + (100 * bare(1, 1.52)).toFixed(2) + '%)');
  const n1 = 1.38, n2 = 1.52, q = P.film(1, n1, n2, 550 / (4 * n1), 550).R, qa = ((n2 - n1 * n1) / (n2 + n1 * n1)) ** 2;
  ok(Math.abs(q - qa) < 1e-15, 'quarter-wave coating: R = ((n0 n2 - n1^2)/(n0 n2 + n1^2))^2 = ' + (100 * qa).toFixed(2) + '% for magnesium fluoride on glass');
  ok(Math.abs(P.film(1, 1.38, 1.52, 550 / (2 * 1.38), 550).R - bare(1, 1.52)) < 1e-15, 'half-wave layer is "absent": R equals bare glass');
  const perfect = P.film(1, Math.sqrt(1.52), 1.52, 550 / (4 * Math.sqrt(1.52)), 550).R;
  ok(perfect < 1e-30, 'a quarter-wave layer of index sqrt(n_glass) reflects nothing at its design wavelength');
  // soap film in air: thin limit is black (the two reflections cancel), bright where 2nd = (m + 1/2) lambda
  const soap = d => P.film(1, 1.333, 1, d, 550).R;
  ok(soap(0.5) < 1e-5 && soap(5) < 5e-4, 'a very thin soap film reflects almost nothing (the black film)');
  const dmax = 550 / (4 * 1.333), rmax = 4 * ((0.333 / 2.333) ** 2) / (1 + (0.333 / 2.333) ** 2) ** 2;
  ok(Math.abs(soap(dmax) - rmax) < 1e-12 && Math.abs(soap(3 * dmax) - rmax) < 1e-12, 'soap film brightest where 2nd = lambda/2, 3 lambda/2 (R = ' + (100 * rmax).toFixed(2) + '%)');
  ok(soap(2 * dmax) < 1e-15, 'and dark where 2nd = lambda');
  // oil lower in index than the water under it: both reflections flip, so the thin limit is bright, not black
  const lowOil = P.film(1, 1.25, 1.333, 1, 550).R;
  ok(Math.abs(lowOil - bare(1, 1.333)) < 1e-4, 'a thin film with n below the substrate is bright in the thin limit, like bare water (' + (100 * lowOil).toFixed(2) + '%)');
  const f = P.film(1, 1.47, 1.333, 100, 550), g = P.film(1, 1.25, 1.333, 100, 550), h = P.film(1, 1.38, 1.52, 100, 550), w = P.film(1.52, 1, 1.52, 100, 550);
  ok(f.flipTop && !f.flipBottom && g.flipTop && g.flipBottom && h.flipTop && h.flipBottom && !w.flipTop && w.flipBottom, 'flip bookkeeping: oil 1.47 on water (top only), oil 1.25 (both), coating (both), air gap in glass (bottom only)');
  ok(f.r1 < 0 && f.a2 > 0 && g.a2 < 0 && w.r1 > 0 && w.a2 < 0, 'and the signs of the two waves agree with it');
}
// 3. the two-wave picture: how close it comes
{
  let worstS = 0, worstW = 0;
  for (let d = 0; d <= 1500; d += 3) for (let l = 380; l <= 780; l += 10) {
    const s = P.film(1, 1.333, 1, d, l), w = P.film(1.52, 1, 1.52, d, l);
    worstS = Math.max(worstS, Math.abs(s.R - s.twoWave)); worstW = Math.max(worstW, Math.abs(w.R - w.twoWave));
  }
  ok(worstS < 0.004, 'soap film: two waves are within ' + (100 * worstS).toFixed(2) + ' percentage points of the exact answer (peak R is 7.7%)');
  ok(worstW < 0.03, 'air gap between glass: within ' + (100 * worstW).toFixed(1) + ' points (peak R 16%) - the extra bounces matter more when the surfaces reflect more');
}
// 4. color: the CIE fit against the published CIE 1931 table
{
  const table = { 450: [0.3362, 0.0380, 1.7721], 500: [0.0049, 0.3230, 0.2720], 550: [0.4334, 0.9950, 0.0087], 600: [1.0622, 0.6310, 0.0008], 650: [0.2835, 0.1070, 0.0000] };
  let worst = 0; Object.keys(table).forEach(l => { const c = P.cmf(+l); c.forEach((v, i) => { worst = Math.max(worst, Math.abs(v - table[l][i])); }); });
  ok(worst < 0.03, 'color matching functions within ' + worst.toFixed(3) + ' of the CIE 1931 table at 450-650 nm');
  const wrgb = P.sRGB(P.linRGB(P.WHITE));
  ok(wrgb.every(c => Math.abs(c - 1) < 1e-3), 'a perfect mirror in daylight comes out white: ' + wrgb.map(c => c.toFixed(3)).join(', '));
  const grey = P.sRGB(P.linRGB(P.xyzOf(() => 0.18)));
  ok(grey.every(c => Math.abs(c - grey[0]) < 1e-3), 'and a flat 18% reflector is a neutral gray');
  const red = P.spectralRGB(650), grn = P.spectralRGB(530), blu = P.spectralRGB(460);
  ok(red[0] === 1 && red[1] < 0.3 && grn[1] === 1 && grn[0] < 0.6 && blu[2] === 1 && blu[1] < 0.6, 'single wavelengths: 650 nm red, 530 nm green, 460 nm blue');
}
// 5. the soap-film color sequence (reflected daylight, n = 1.333, seen head on)
{
  const hueOf = rgb => { const [r, g, b] = rgb, mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn; if (c < 1e-9) return { h: 0, s: 0, v: mx };
    let h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4; h *= 60; if (h < 0) h += 360; return { h, s: c / mx, v: mx }; };
  const col = d => { const lin = P.linRGB(P.xyzOf(l => P.film(1, P.water(l), 1, d, l).R)).map(c => c * 8); return hueOf(P.sRGB(lin)); };
  const rows = [10, 60, 100, 150, 200, 250, 290, 330, 380, 430, 480].map(d => { const c = col(d); return d + ' nm: hue ' + c.h.toFixed(0) + ', sat ' + c.s.toFixed(2) + ', value ' + c.v.toFixed(2); });
  console.log('     ' + rows.join('\n     '));
  // Newton's sequence in reflection: black, white, yellow, purple | blue, green, yellow, red | blue, green ...
  const expect = [[5, 'black', c => c.v < 0.12], [10, 'near-black', c => c.v < 0.25], [100, 'pale white', c => c.s < 0.2 && c.v > 0.5],
    [150, 'yellow', c => c.h > 35 && c.h < 70 && c.s > 0.3], [200, 'purple', c => c.h > 260 && c.h < 320], [250, 'blue', c => c.h > 180 && c.h < 250],
    [290, 'green', c => c.h > 90 && c.h < 170], [330, 'yellow', c => c.h > 35 && c.h < 70], [380, 'red-magenta', c => c.h > 290 && c.h < 350],
    [430, 'blue', c => c.h > 180 && c.h < 250], [480, 'green', c => c.h > 90 && c.h < 170]];
  const got = expect.map(([d, name, test]) => test(col(d)));
  ok(got.every(Boolean), "soap film follows Newton's sequence: " + expect.map(([d, name], i) => d + ' nm ' + name + (got[i] ? '' : ' (NO)')).join(', '));
}
// 6. very thick films: the white-light color of the exact result blends into the incoherent sum
{
  const a = P.xyzOf(l => P.film(P.glass(l), 1, P.glass(l), 6000, l, 0.2).R), b = P.xyzOf(l => P.filmIncoherent(P.glass(l), 1, P.glass(l), l, 0.2));
  const c = P.xyzOf(l => P.film(1, 1.47, P.water(l), 6000, l).R), e = P.xyzOf(l => P.filmIncoherent(1, 1.47, P.water(l), l));
  const dev = Math.max(...a.map((v, i) => Math.abs(v / b[i] - 1)), ...c.map((v, i) => Math.abs(v / e[i] - 1)));
  ok(dev < 0.03, 'at 6 micrometers the exact white-light color is within ' + (100 * dev).toFixed(1) + '% of the incoherent sum, so the page can switch over there');
}
// 7. the material data: refractive indices at the sodium line (589 nm) against handbook values
{
  ok(Math.abs(P.water(589) - 1.3330) < 5e-4, 'water: n = ' + P.water(589).toFixed(4) + ' at 589 nm (handbook 1.3330 at 20 C)');
  ok(Math.abs(P.glass(589) - 1.5168) < 1e-3, 'crown glass: n = ' + P.glass(589).toFixed(4) + ' at 589 nm (BK7 1.5168)');
  ok(P.water(450) > P.water(650) && P.glass(450) > P.glass(650), 'both bend blue light more than red (normal dispersion)');
}
console.log(fails ? fails + ' FAILED' : 'all passed');
process.exitCode = fails ? 1 : 0;
