// Exoplanets: Kepler's law and the wobble against known planets; the transit light against a brute-force
// two-dimensional sum over the star's face; contact times against the duration formula; noise averaging
// down as 1/sqrt(N); and the mystery screen's analysis, done the way a student would, recovering each planet.
const P = require('./load.js')('exoplanets');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sun = P.STARS.G2, ME_JUP = P.M_JUP / P.M_EARTH, RE_JUP = P.R_JUP / P.R_EARTH;

// 1. Kepler's third law and the wobble, for the solar system and a famous exoplanet
{
  const yr = P.periodDays(1, sun, 1);
  ok(Math.abs(yr - 365.256) < 0.01, 'Earth at 1 AU from the Sun: P = ' + yr.toFixed(3) + ' days (sidereal year 365.256)');
  const pj = P.periodDays(5.2026, sun, ME_JUP) / 365.25;
  ok(Math.abs(pj - 11.86) < 0.01, 'Jupiter at 5.2026 AU: P = ' + pj.toFixed(3) + ' years (11.86)');
  const Kj = P.semiAmp(pj * 365.25, sun, ME_JUP, 90), Ke = P.semiAmp(365.256, sun, 1, 90);
  ok(Math.abs(Kj - 12.5) < 0.2, 'Jupiter makes the Sun wobble at K = ' + Kj.toFixed(2) + ' m/s (about 12.5)');
  ok(Math.abs(Ke - 0.0895) < 0.002, 'Earth makes it wobble at K = ' + (Ke * 100).toFixed(2) + ' cm/s (about 9 cm/s)');
  // 51 Pegasi b (Mayor & Queloz 1995 and later): K = 55.9 m/s, P = 4.2308 d, star 1.11 solar masses -> m sin i = 0.46-0.47 Jupiter masses
  const peg = { M: 1.11, R: 1.15 }, msini = P.massFromK(55.9, 4.2308, peg, 90) / ME_JUP;
  ok(Math.abs(msini - 0.465) < 0.015, '51 Pegasi b: from K = 55.9 m/s and P = 4.23 d, m sin i = ' + msini.toFixed(3) + ' Jupiter masses (published 0.46-0.47)');
  ok(Math.abs(P.semiAmp(4.2308, peg, P.massFromK(55.9, 4.2308, peg, 90), 90) - 55.9) < 1e-9, 'and turning that mass back into K gives 55.9 m/s again');
  // momentum: star speed x star mass = planet speed x planet mass
  const a = 0.05 * P.AU, Pd = P.periodDays(0.05, sun, 300), vp = 2 * Math.PI * a / (Pd * P.DAY) * (sun.M * P.M_SUN) / (sun.M * P.M_SUN + 300 * P.M_EARTH);
  ok(Math.abs(P.semiAmp(Pd, sun, 300, 90) * sun.M * P.M_SUN - vp * 300 * P.M_EARTH) / (vp * 300 * P.M_EARTH) < 1e-12, 'the star\'s momentum balances the planet\'s, around their center of mass');
}

// 2. transit light: the ring integral against a brute-force sum over a fine grid on the star's face
{
  const grid = (d, k, u, n) => {
    let tot = 0, hid = 0; const h = 2 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = -1 + (i + 0.5) * h, y = -1 + (j + 0.5) * h, r2 = x * x + y * y;
      if (r2 >= 1) continue;
      const I = P.intensity(Math.sqrt(r2), u); tot += I;
      if ((x - d) * (x - d) + y * y < k * k) hid += I;
    }
    return hid / tot;
  };
  let worst = 0;
  [[0, 0.1], [0.5, 0.1], [0.95, 0.1], [1.05, 0.1], [0.3, 0.3], [0.9, 0.3], [0.2, 0.05], [0.7, 0.2]].forEach(([d, k]) => {
    const g = grid(d, k, P.U_LD, 3000), r = P.blocked(d, k, P.U_LD);
    worst = Math.max(worst, Math.abs(g - r) / Math.max(g, 1e-6));
  });
  ok(worst < 0.003, 'light blocked, 8 positions and sizes: ring integral agrees with a 3000 x 3000 grid to ' + (100 * worst).toFixed(2) + '%');
  // uniform star: the blocked fraction is the exact overlap area of two circles over pi
  const lens = (d, k) => { if (d >= 1 + k) return 0; if (d <= 1 - k) return k * k * Math.PI;
    const a = Math.acos((d * d + k * k - 1) / (2 * d * k)), b = Math.acos((d * d + 1 - k * k) / (2 * d)); return k * k * a + b - 0.5 * Math.sqrt(4 * d * d - (d * d + 1 - k * k) ** 2); };
  let w2 = 0; for (let d = 0.01; d < 1.3; d += 0.037) w2 = Math.max(w2, Math.abs(P.blocked(d, 0.25, 0) - lens(d, 0.25) / Math.PI));
  ok(w2 < 2e-7, 'with no limb darkening it equals the exact overlap area of two circles (worst ' + w2.toExponential(1) + ')');
  ok(Math.abs(P.blocked(0, 0.01, 0) - 1e-4) < 1e-12, 'a centered planet on a uniform star blocks k^2 of the light');
  const c = P.blocked(0, 0.01, 0.6) / 1e-4;
  ok(Math.abs(c - 1 / (1 - 0.6 / 3)) < 1e-4, 'on a limb-darkened star a small planet at the center blocks k^2 / (1 - u/3) = ' + c.toFixed(4) + ' k^2, since the center is brighter than average');
  const de = P.kOf(1, sun) ** 2 * 1e6, dj = P.kOf(RE_JUP, sun) ** 2 * 100;
  ok(Math.abs(de - 84) < 1 && Math.abs(dj - 1.056) < 0.01, 'Earth crossing the Sun dims it by ' + de.toFixed(1) + ' ppm; Jupiter by ' + dj.toFixed(2) + '% (uniform-disk depths)');
}

// 3. contact times in the light curve against the duration formula, and the transit geometry
{
  let worst = 0;
  [[sun, 0.05, 1 * RE_JUP, 89.0], [P.STARS.M4, 0.03, 2, 88.5], [P.STARS.F5, 0.1, 4, 90], [sun, 1, 1, 89.99]].forEach(([star, aAU, RpE, inc]) => {
    const sys = { star, aAU, RpE, MpE: 1, inc, t0: 0 }; sys.P = P.periodDays(aAU, star, 1);
    const T = P.duration(sys);
    // find first and last contact by bisection on the brightness
    const dipping = t => P.brightness(t, sys) < 1;
    let lo = 0, hi = T; for (let n = 0; n < 60; n++) { const m = (lo + hi) / 2; if (dipping(m)) lo = m; else hi = m; }
    worst = Math.max(worst, Math.abs(2 * lo - T) / T);
  });
  ok(worst < 1e-9, 'four systems: first-to-last contact in the light curve equals the duration formula (worst ' + worst.toExponential(1) + ')');
  // a planet transits exactly when its impact parameter b = (a/R*) cos i is below 1 + k
  const sys = { star: sun, aAU: 0.05, RpE: 11, MpE: 300, t0: 0 }; sys.P = P.periodDays(0.05, sun, 300);
  const ar = 0.05 * P.AU / P.R_SUN, k = P.kOf(11, sun), incEdge = Math.acos((1 + k) / ar) * 180 / Math.PI;
  const t = s => P.brightness(0, Object.assign({}, sys, { inc: s })) < 1;
  ok(t(incEdge + 0.01) && !t(incEdge - 0.01), 'a hot Jupiter at 0.05 AU transits only for inclinations above ' + incEdge.toFixed(2) + ' deg, where b = 1 + k');
  // for random orientations, the fraction that transit is (R* + Rp)/a
  let seed = 5, n = 0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let j = 0; j < 200000; j++) { const ci = rnd(); if (ar * ci < 1 + k) n++; }          // cos i uniform for random orientations
  ok(Math.abs(n / 200000 - (1 + k) / ar) < 0.002, 'random orientations: ' + (100 * n / 200000).toFixed(2) + '% transit, as (R* + Rp)/a = ' + (100 * (1 + k) / ar).toFixed(2) + '% says');
}

// 4. the wobble's sign and timing: zero at mid-transit, the star moving toward us just after
{
  const sys = { star: sun, aAU: 0.05, RpE: 11, MpE: 300, inc: 90, t0: 2 }; sys.P = P.periodDays(0.05, sun, 300);
  ok(Math.abs(P.starVr(2, sys)) < 1e-9 && P.starVr(2.1, sys) < 0 && P.starVr(1.9, sys) > 0, 'at mid-transit the star\'s velocity along our line of sight is zero; just after, it moves toward us (blueshift)');
}

// 5. noise averages down as 1/sqrt(N)
{
  let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const N = 400, M = 2000; let s2 = 0;
  for (let m = 0; m < M; m++) { let s = 0; for (let j = 0; j < N; j++) s += P.gauss(rnd) * P.PHOT_SIGMA; s2 += (s / N) ** 2; }
  const sd = Math.sqrt(s2 / M) / (P.PHOT_SIGMA / Math.sqrt(N));
  ok(Math.abs(sd - 1) < 0.05, 'the average of 400 readings scatters ' + sd.toFixed(3) + ' times sigma/sqrt(400)');
}

// 6. the mystery screen: simulate the data, analyze it like a student, recover radius, mass and type
{
  const POOL = P.POOL;
  let seed = 21; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let good = 0, naiveGood = 0, total = 0, worstR = 0, worstM = 0;
  for (let rep = 0; rep < 10; rep++) POOL.forEach(make => {
    const sys = make(rnd); total++;
    // 40 days of brightness every 30 minutes, and one velocity a night with 1 m/s scatter
    const ts = [], fs = [], tv = [], vs = [];
    for (let t = 0; t < 40; t += P.CADENCE) { ts.push(t); fs.push(P.brightness(t, sys) + P.gauss(rnd) * P.PHOT_SIGMA); }
    for (let n = 0; n < 40; n++) { if (rnd() < 0.25) continue; const t = n + 0.9 + 0.25 * rnd(); tv.push(t); vs.push(P.starVr(t, sys) + P.gauss(rnd) * 1); }
    // period: the student reads the time between dips; here, the true period known to 1%
    const Pd = sys.P * (1 + (rnd() - 0.5) * 0.02);
    // depth: fold the light curve and average the readings in the middle half of the dip, where it is deepest
    const half = P.duration(sys) / 4; let sum = 0, cnt = 0;
    ts.forEach((t, j) => { let ph = (((t - sys.t0) / sys.P) % 1 + 1) % 1; if (ph > 0.5) ph -= 1; if (Math.abs(ph * sys.P) < half) { sum += fs[j]; cnt++; } });
    const low = sum / cnt;
    // the notes' reading: the planet blocks about 1.25 k^2 near the star's brighter center, so k^2 = 0.8 x depth
    const RpE = Math.sqrt(0.8 * (1 - low)) * sys.star.R * P.R_SUN / P.R_EARTH, naiveR = Math.sqrt(1 - low) * sys.star.R * P.R_SUN / P.R_EARTH;
    // K: least-squares fit of a sine at the period
    let sc = 0, cc = 0, ss = 0, ys = 0, yc = 0;
    tv.forEach((t, j) => { const ph = 2 * Math.PI * (t - sys.t0) / Pd, s = Math.sin(ph), c = Math.cos(ph); ss += s * s; cc += c * c; sc += s * c; ys += vs[j] * s; yc += vs[j] * c; });
    const det = ss * cc - sc * sc, A = (ys * cc - yc * sc) / det, B = (yc * ss - ys * sc) / det, K = Math.hypot(A, B);
    const MpE = P.massFromK(K, Pd, sys.star, 90);
    const eR = Math.abs(RpE / sys.RpE - 1), eM = Math.abs(MpE / sys.MpE - 1);
    worstR = Math.max(worstR, eR); worstM = Math.max(worstM, eM);
    if (eR < 0.2 && eM < 0.2 && P.isRocky(RpE, MpE) === P.isRocky(sys.RpE, sys.MpE)) good++;
    if (Math.abs(naiveR / sys.RpE - 1) < 0.2 && eM < 0.2 && P.isRocky(naiveR, MpE) === P.isRocky(sys.RpE, sys.MpE)) naiveGood++;
  });
  ok(good === total, 'mystery planets, analyzed like a student would from 40 days of noisy data: ' + good + '/' + total + ' get radius and mass within 20% and the right type (worst radius error ' + (100 * worstR).toFixed(0) + '%, mass ' + (100 * worstM).toFixed(0) + '%)');
  ok(naiveGood >= 0.9 * total, 'a student who skips the limb-darkening correction still passes ' + naiveGood + '/' + total + ' (radius reads about 12% large)');
}
// 7. the inputs: Eddington's limb darkening, and the stars as tabulated
{
  let w = 0; for (let r = 0; r < 1; r += 0.05) { const mu = Math.sqrt(1 - r * r); w = Math.max(w, Math.abs(P.intensity(r, P.U_LD) - (2 + 3 * mu) / 5)); }
  ok(w < 1e-12, 'limb darkening is Eddington\'s gray-atmosphere result, I(mu)/I(1) = (2 + 3 mu)/5');
  const table = { F5: [1.33, 1.473, 6550], G2: [1, 1, 5772], K5: [0.70, 0.701, 4440], M4: [0.23, 0.274, 3210] };
  ok(Object.keys(table).every(k => P.STARS[k].M === table[k][0] && P.STARS[k].R === table[k][1] && P.STARS[k].T === table[k][2]) && Object.keys(P.STARS).length === 4,
    'the stars match Mamajek\'s table (2022.04.16) and the Sun\'s nominal values');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
