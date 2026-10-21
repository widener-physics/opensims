// Michelson interferometer: the ring pattern against adding up two waves from the two mirror images of the source
// (exact distances to points on a screen, not the 2 d cos(theta) formula); ring positions; one fringe per half
// wavelength of mirror travel; the refractive index of air against published values, and the gas cell's fringe count
// against the phase it adds; LIGO's arm change and phase; the chirp of GW150914 against what was observed.
const M = require('./load.js')('michelson-interferometer');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);
const lam = 632.8e-9;

// 1. the pattern on a screen far away, from two point sources 2d apart on the axis (the source's images in the two
//    mirrors), each wave traveling the exact distance to the screen point; brightness = |e^{ik r1} + e^{ik r2}|^2 / 4
(function () { const Ls = 1.5, d = 0.4e-3, k = 2 * Math.PI / lam; let worst = 0;
  for (let i = 0; i <= 400; i++) { const y = i / 400 * 0.12 * Ls;      // up to about 7 degrees
    const r1 = Math.hypot(Ls, y), r2 = Math.hypot(Ls + 2 * d, y), ph = k * (r2 - r1), I = (1 + Math.cos(ph)) / 2;
    // the formula, at the angle seen from the nearer source
    const Ifit = M.brightness(d, Math.atan2(y, Ls + d), lam); worst = Math.max(worst, Math.abs(I - Ifit)); }
  ok(worst < 0.02, 'ring pattern: brightness from adding two waves over exact distances matches cos²(π · 2d cosθ / λ) to ' + (100 * worst).toFixed(1) + '% (screen 1.5 m away)'); })();
// rings: bright where 2d cos(theta) = m lambda; dark halfway
(function () { const d = 0.5e-3, R = M.rings(d, lam, 0.1); ok(R.length > 5 && R.every(r => M.brightness(d, r.th, lam) > 1 - 1e-12), 'every ring found is a brightness maximum (' + R.length + ' rings within 0.1 rad at 0.5 mm)');
  const n = Math.floor(2 * d / lam) - Math.ceil(2 * d * Math.cos(0.1) / lam) + 1; ok(R.length === n, 'ring count = number of whole wavelengths in 2d(1 - cosθmax) = ' + n);
  ok(M.rings(0.25e-3, lam, 0.1).length < R.length, 'arms closer to equal: fewer, wider rings');
  // one fringe per half wavelength: moving the mirror by lambda/2 leaves the pattern exactly as it was
  let same = true; for (let th = 0; th < 0.1; th += 0.003) if (Math.abs(M.brightness(d, th, lam) - M.brightness(d + lam / 2, th, lam)) > 0.02) same = false;
  ok(same && M.fringesPassed(lam / 2, lam) === 1, 'moving the mirror half a wavelength brings back the same picture (one fringe passes the center)');
  ok(Math.abs(M.brightness(0, 0.07, lam) - 1) < 1e-12, 'arms equal: the whole screen bright, no rings'); })();
// the center as the mirror moves: count bright-dark cycles
(function () { const dx = 10e-6; let n = 0, prev = M.brightness(0.3e-3, 0, lam); for (let i = 1; i <= 20000; i++) { const b = M.brightness(0.3e-3 + i * dx / 20000, 0, lam); if (prev < 0.5 && b >= 0.5) n++; prev = b; }
  ok(Math.abs(n - M.fringesPassed(dx, lam)) <= 1, 'moving 10 µm: ' + n + ' bright flashes at the center, 2·10 µm / 632.8 nm = ' + M.fringesPassed(dx, lam).toFixed(1)); })();

// 2. air
ok(Math.abs((M.airIndex15(632.8e-9) - 1) * 1e4 - 2.7653) < 0.002, 'refractive index of air at 632.8 nm, 15 \u00B0C: n \u2212 1 = ' + ((M.airIndex15(632.8e-9) - 1) * 1e4).toFixed(4) + ' \u00D7 10\u207B\u2074 (Edl\u00E9n 1966; published 2.7653 \u00D7 10\u207B\u2074)');
ok(M.airIndex15(450e-9) > M.airIndex15(532e-9) && M.airIndex15(532e-9) > M.airIndex15(632.8e-9) && (M.airIndex15(532e-9) - 1) * 1e4 < 2.80, 'bluer light slows more in air; at 532 nm, n \u2212 1 = ' + ((M.airIndex15(532e-9) - 1) * 1e4).toFixed(3) + ' \u00D7 10\u207B\u2074');
ok(near(M.airIndex(lam, 101325, 293.15) - 1, (M.airIndex15(lam) - 1) * 288.15 / 293.15, 1e-12) && Math.abs(M.airIndex(lam, 0, 293.15) - 1) < 1e-15, 'n - 1 proportional to density: a vacuum gives exactly 1; warmer air less');
// the gas cell: filling a 3 cm cell from vacuum to 1 atm passes a known number of fringes, counted from the phase
(function () { const Lc = 0.03, T = 293.15; let n = 0, prev = Math.cos(0) ** 2; const steps = 20000;
  for (let i = 1; i <= steps; i++) { const P = 101325 * i / steps, b = Math.cos(Math.PI * M.cellExtra(lam, Lc, P, T) / lam) ** 2; if (prev < 0.5 && b >= 0.5) n++; prev = b; }
  const N = M.cellExtra(lam, Lc, 101325, T) / lam;
  ok(Math.abs(n - N) <= 1 && N > 24 && N < 27, 'letting air into a 3 cm cell: ' + n + ' fringes pass, 2 L (n - 1) / λ = ' + N.toFixed(1)); })();

// the lasers: helium-neon 632.8 nm; the green laser is the 1064 nm infrared (LIGO's) doubled in frequency; blue diode
ok(M.LASERS[0].lam === 632.8e-9 && Math.abs(M.LASERS[1].lam - M.LIGO.lam / 2) < 1e-15 && M.LASERS[2].lam >= 440e-9 && M.LASERS[2].lam <= 460e-9, 'lasers: helium-neon 632.8 nm; green 532 nm, half of 1064 nm; blue diode about 450 nm');
// 3. LIGO
(function () { const h = 1e-21, dL = M.armChange(h);
  ok(near(dL, 2e-18, 1e-12), 'a strain of 10⁻²¹ changes each 4 km arm by 2 × 10⁻¹⁸ m, about a thousandth of a proton\'s width');
  ok(near(M.ligoExtra(h), 2 * 2 * dL * 280, 1e-12) && near(M.ligoPhase(h), 2 * Math.PI * 4 * dL * 280 / 1064e-9, 1e-12), 'difference in the light\'s trip: both arms change (×2), round trip (×2), 280 bounces: phase ' + M.ligoPhase(h).toExponential(2) + ' rad');
  // GW150914: chirp mass about 30 solar masses (detector frame); observed sweeping from 35 to 150 Hz in about 0.2 s
  const Mc = 30, t35 = M.chirpTau(35, Mc), t150 = M.chirpTau(150, Mc);
  ok(t35 - t150 > 0.13 && t35 - t150 < 0.25, 'GW150914 (chirp mass 30 suns): 35 Hz to 150 Hz in ' + (t35 - t150).toFixed(2) + ' s (observed: about 0.2 s; LIGO 2016)');
  ok([20, 50, 120].every(f => near(M.chirpFreq(M.chirpTau(f, Mc), Mc), f, 1e-12)), 'frequency and time to merger convert back and forth');
  // the wave's phase rate is 2 pi f: check by differencing the strain's phase
  const ph = tau => -2 * Math.pow(tau / (5 * Mc * M.GC3), 5 / 8), tau = 0.05, dt = 1e-7, w = -(ph(tau - dt) - ph(tau + dt)) / (2 * dt);
  ok(near(Math.abs(w), 2 * Math.PI * M.chirpFreq(tau, Mc), 1e-6), 'the chirp\'s phase advances at 2π f, with f from the same formula'); })();

// the drawn chirp itself: its crests come at the chirp frequency, and its size grows as f^(2/3)
(function () { const Mc = 30, crossings = []; let prev = M.chirpStrain(0.15, Mc, 1, 1e4);
  for (let i = 1; i <= 200000; i++) { const tau = 0.15 - i * 1e-6, h = M.chirpStrain(tau, Mc, 1, 1e4); if ((prev < 0) !== (h < 0)) crossings.push(tau); prev = h; }
  // half a period between zero crossings: compare with 1 / (2 f) near tau = 0.1 and 0.05
  let worst = 0; [0.1, 0.05].forEach(tc => { const k = crossings.findIndex(x => x < tc); const half = crossings[k - 1] - crossings[k], f = M.chirpFreq(tc, Mc); worst = Math.max(worst, Math.abs(1 / (2 * half) / f - 1)); });
  ok(worst < 0.02, 'the drawn wave\'s crests come at the chirp frequency (within ' + (100 * worst).toFixed(1) + '%)');
  const env = tc => { let m = 0; for (let tau = tc - 0.004; tau < tc + 0.004; tau += 1e-6) m = Math.max(m, Math.abs(M.chirpStrain(tau, Mc, 1, 1e4))); return m; };
  const r = env(0.02) / env(0.12), want = Math.pow(M.chirpFreq(0.02, Mc) / M.chirpFreq(0.12, Mc), 2 / 3);
  ok(Math.abs(r / want - 1) < 0.03, 'and it grows as f^(2/3): \u00D7' + r.toFixed(2) + ' from 120 ms to 20 ms before merger (expected \u00D7' + want.toFixed(2) + ')'); })();

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
