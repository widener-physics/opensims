// Fourier: each shape's known coefficients against coefficients found by integrating the shape numerically; the
// partial sums converging to the shape; the overshoot at a jump against Gibbs's constant; the analysis of drawn
// samples recovering known coefficients and Parseval's sum; a burst's spectrum against a direct numerical Fourier
// transform; and the widths of the spectrum against the formulas for a bell-curve and a switched-on tone.
const F = require('./load.js')('fourier');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);

// 1. the coefficients: b_n = 2 * integral over a period of f(x) sin(2 pi n x) dx, done with many small steps
(function () { let worst = 0; const K = 200000;
  for (const key of ['sine', 'square', 'triangle', 'sawtooth']) for (let n = 1; n <= 12; n++) {
    let sb = 0, sa = 0, s0 = 0; for (let i = 0; i < K; i++) { const x = (i + 0.5) / K, y = F.SHAPES[key].f(x); sb += y * Math.sin(2 * Math.PI * n * x); sa += y * Math.cos(2 * Math.PI * n * x); s0 += y; }
    worst = Math.max(worst, Math.abs(2 * sb / K - F.SHAPES[key].b(n)), Math.abs(2 * sa / K), Math.abs(s0 / K)); }
  ok(worst < 1e-5, 'square, triangle, sawtooth, sine: the listed sine coefficients match integrating each shape (worst ' + worst.toExponential(1) + '); no cosine terms, no steady level'); })();
ok(near(F.SHAPES.square.b(1), 4 / Math.PI, 1e-12) && F.SHAPES.square.b(2) === 0 && near(F.SHAPES.square.b(3), 4 / (3 * Math.PI), 1e-12), 'square: odd harmonics only, 4/(πn): 1.273, 0, 0.424, …');
ok(near(F.SHAPES.triangle.b(3), -8 / (9 * Math.PI * Math.PI), 1e-12) && near(F.SHAPES.triangle.b(5), 8 / (25 * Math.PI * Math.PI), 1e-12), 'triangle: odd harmonics, alternating in sign, falling as 1/n²');
ok(near(F.SHAPES.sawtooth.b(2), -1 / Math.PI, 1e-12) && near(F.SHAPES.sawtooth.b(3), 2 / (3 * Math.PI), 1e-12), 'sawtooth: every harmonic, alternating in sign, falling as 1/n');
// the shapes themselves
ok(F.SHAPES.square.f(0.25) === 1 && F.SHAPES.square.f(0.75) === -1 && F.SHAPES.triangle.f(0.25) === 1 && F.SHAPES.triangle.f(0.75) === -1 && Math.abs(F.SHAPES.sawtooth.f(0.49) - 0.98) < 1e-12 && Math.abs(F.SHAPES.sawtooth.f(0.51) + 0.98) < 1e-12, 'the shapes: square ±1, triangle peaks ±1 at a quarter period, sawtooth rising from −1 to 1 and dropping at mid-period');

// the shapes repeat every period, and sit at the middle of each jump
ok([-0.75, 1.25, 2.25, 7.25].every(x => F.SHAPES.square.f(x) === 1 && F.SHAPES.triangle.f(x) === 1) && [-0.25, 1.75, 3.75].every(x => F.SHAPES.square.f(x) === -1 && F.SHAPES.triangle.f(x) === -1) && Math.abs(F.SHAPES.triangle.f(1.9) + 0.4) < 1e-12 && Math.abs(F.SHAPES.sawtooth.f(2.2) - 0.4) < 1e-12,
  'the shapes repeat: same values a whole number of periods later or earlier');
ok(F.SHAPES.square.f(0) === 0 && F.SHAPES.square.f(0.5) === 0 && F.SHAPES.square.f(3) === 0 && F.SHAPES.sawtooth.f(0.5) === 0 && F.SHAPES.sawtooth.f(1.5) === 0, 'at a jump, the shapes take the midpoint (where every partial sum passes)');
ok(F.SHAPES.square.jump === 2 && F.SHAPES.sawtooth.jump === 2 && F.SHAPES.triangle.jump === 0 && F.SHAPES.sine.jump === 0, 'jumps: 2 for the square and sawtooth waves, none for the triangle and sine');
ok(Math.abs(F.series({ a: [0, 0, 0.3], b: [0, 1] }, 0.1, 2) - F.series({ a: [0, 0, 0.3], b: [0, 1] }, 0.1)) < 1e-15 && Math.abs(F.series({ a: [0, 0, 0.3], b: [0, 1] }, 0.1, 9) - F.series({ a: [0, 0, 0.3], b: [0, 1] }, 0.1)) < 1e-15, 'asking for all the terms (or more than there are) uses all of them');
ok(F.amplitude({ a: [0], b: [0, 0.5] }, 1) === 0.5 && F.amplitude({ a: [0, 0.6], b: [0] }, 1) === 0.6 && F.amplitude({ a: [0], b: [0] }, 3) === 0, 'amplitude with only a sine part, only a cosine part, or neither');
(function () { const y = new Array(16).fill(0); y[0] = 4; const z = { a: [0], b: [0] }; ok(Math.abs(F.rmsMiss(y, z, 0) - 1) < 1e-12, 'rms miss counts every sample, the first included'); })();
ok(F.envelope(0.005, 0.01, 'sharp') === 1 && F.envelope(-0.005, 0.01, 'sharp') === 1, 'sharp burst: on through both ends of its duration');
// the top of the spectrum: for very short bursts it is not at 440 Hz; check against a fine search
(function () { let worst = 0; for (const [tau, kind] of [[0.002, 'sharp'], [0.002, 'smooth'], [0.0025, 'sharp'], [0.03, 'smooth']]) { let best = 0, fb = 0; for (let f = 1; f < 3000; f += 0.05) { const v = F.spectrum(f, tau, kind, 440); if (v > best) { best = v; fb = f; } }
    const s = F.spread(tau, kind, 440); worst = Math.max(worst, Math.abs(s.peak - fb) / (1 / tau), Math.abs(s.top - best) / best); }
  ok(worst < 0.004, 'the spectrum\'s peak, found where it really is (a 2 ms burst peaks away from 440 Hz)'); })();

// 2. partial sums converge where the shape is smooth, and the triangle much faster than the square
(function () { const err = (key, N) => { let w = 0; const c = F.shapeCoeffs(key, N); for (let i = 0; i < 400; i++) { const x = i / 400, u = x - Math.floor(x); if (key !== 'triangle' && (Math.abs(u - 0.5) < 0.06 || u < 0.06 || u > 0.94)) continue; w = Math.max(w, Math.abs(F.series(c, x) - F.SHAPES[key].f(x))); } return w; };
  ok(err('square', 200) < 0.02 && err('square', 200) < err('square', 20) / 5, 'square: away from the jumps, 200 terms land within 0.02 of the shape');
  ok(err('triangle', 9) < 0.045 && err('triangle', 99) < 0.0045 && err('triangle', 99) < err('triangle', 9) / 9, 'triangle: within 0.045 with terms up to 9, within 0.0045 up to 99 (it has no jumps)');
  ok(err('sawtooth', 300) < 0.02, 'sawtooth: away from the drop, 300 terms within 0.02');
  ok(Math.abs(F.series(F.shapeCoeffs('sine', 10), 0.3) - Math.sin(2 * Math.PI * 0.3)) < 1e-12, 'a sine wave is its own first harmonic and nothing else'); })();
// series with cosine terms and a steady level
ok(Math.abs(F.series({ a: [0.5, 0, 0.3], b: [0, 1] }, 0.1) - (0.5 + Math.sin(0.2 * Math.PI) + 0.3 * Math.cos(0.4 * Math.PI))) < 1e-12 && Math.abs(F.series({ a: [0.5, 0, 0.3], b: [0, 1] }, 0.1, 1) - (0.5 + Math.sin(0.2 * Math.PI))) < 1e-12, 'a sum with a steady level, sines and cosines; and cut off after N terms');

// 3. the overshoot at a jump: never goes away; tends to Gibbs's (1/π) Si(π) − 1/2 = 0.08949 of the jump
(function () { let si = 0; const K = 100000; for (let i = 0; i < K; i++) { const t = (i + 0.5) / K * Math.PI; si += Math.sin(t) / t * Math.PI / K; }
  const gibbs = si / Math.PI - 0.5, o9 = F.overshoot('square', 9), o199 = F.overshoot('square', 199, 40000);
  ok(Math.abs(gibbs - 0.08949) < 1e-4, 'Gibbs constant from the sine integral: ' + gibbs.toFixed(5));
  ok(o9 > 0.09 && o9 < 0.1 && Math.abs(o199 - gibbs) < 0.0005, 'square: overshoot ' + (100 * o9).toFixed(1) + '% with harmonics up to 9, ' + (100 * o199).toFixed(2) + '% up to 199');
  const s10 = F.overshoot('sawtooth', 10), s400 = F.overshoot('sawtooth', 400, 80000);
  ok(s10 > 0.03 && s10 < s400 && Math.abs(s400 - gibbs) < 0.004, 'sawtooth: ' + (100 * s10).toFixed(1) + '% with 10 harmonics, ' + (100 * s400).toFixed(2) + '% with 400, approaching the same limit'); })();
ok(Math.abs(F.peak(F.shapeCoeffs('triangle', 9), undefined, 8000) - (8 / Math.PI ** 2) * (1 + 1 / 9 + 1 / 25 + 1 / 49 + 1 / 81)) < 1e-6, 'triangle with terms up to 9: its corners reach ' + F.peak(F.shapeCoeffs('triangle', 9)).toFixed(3) + ' (8/π² times 1 + 1/9 + … + 1/81)');

// 4. drawn samples: the analysis recovers coefficients, and the sum of squares matches (Parseval)
(function () { const M = 256, a = [0.2, 0.3, 0, -0.1], b = [0, 0.5, -0.25, 0, 0.05], y = [];
  for (let k = 0; k < M; k++) y.push(F.series({ a, b }, k / M));
  const c = F.analyze(y, 8); let w = 0; for (let n = 0; n <= 8; n++) w = Math.max(w, Math.abs((c.a[n] || 0) - (a[n] || 0)), Math.abs((c.b[n] || 0) - (b[n] || 0)));
  ok(w < 1e-12, 'drawn samples of a known mix: every coefficient recovered (worst error ' + w.toExponential(1) + ')');
  ok(F.rmsMiss(y, c, 4) < 1e-12 && F.rmsMiss(y, c, 2) > 0.03, 'the rebuilt curve matches once all its harmonics are in, and misses without the 4th');
  ok(near(F.amplitude(c, 1), Math.hypot(0.3, 0.5), 1e-12), 'amplitude of a harmonic: √(a² + b²) whatever its phase');
  // a jagged random drawing: mean square = a0² + ½ Σ (a_n² + b_n²) using every harmonic below M/2, plus the M/2 term
  let s = 0.7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280 * 2 - 1; const z = Array.from({ length: M }, r);
  const cz = F.analyze(z, M / 2 - 1); let ms = 0; z.forEach(v => ms += v * v / M);
  let nyq = 0; z.forEach((v, k) => nyq += v * (k % 2 ? -1 : 1) / M);
  let P = cz.a[0] ** 2 + nyq ** 2; for (let n = 1; n < M / 2; n++) P += (cz.a[n] ** 2 + cz.b[n] ** 2) / 2;
  ok(near(P, ms, 1e-10), 'Parseval: the power in the harmonics adds up to the power in the drawing (' + ms.toFixed(4) + ')');
  // a smooth drawing needs few harmonics; a sharp one many
  const smooth = Array.from({ length: M }, (_, k) => Math.exp(-((((k / M) - 0.5) / 0.15) ** 2))), sharp = Array.from({ length: M }, (_, k) => k / M < 0.5 ? 1 : -1);
  const cs = F.analyze(smooth, 20), ch = F.analyze(sharp, 20);
  ok(F.rmsMiss(smooth, cs, 5) < 0.01 && F.rmsMiss(sharp, ch, 5) > 0.1, 'a smooth hump: within 1% with 5 harmonics; a step: still ' + (100 * F.rmsMiss(sharp, ch, 5)).toFixed(0) + '% off'); })();

// 5. a burst of 440 Hz: the spectrum formula against a direct numerical transform
(function () { const f0 = 440; let worst = 0;
  for (const kind of ['smooth', 'sharp']) for (const tau of [0.002, 0.01, 0.03]) {
    const T = kind === 'sharp' ? tau / 2 : 3 * tau, K = 40000;
    for (const f of [0, 200, 400, 440, 470, 900]) { let re = 0, im = 0; for (let i = 0; i < K; i++) { const t = -T + (i + 0.5) * 2 * T / K, x = F.burst(t, tau, kind, f0); re += x * Math.cos(2 * Math.PI * f * t) * 2 * T / K; im -= x * Math.sin(2 * Math.PI * f * t) * 2 * T / K; }
      worst = Math.max(worst, Math.abs(Math.hypot(re, im) - F.spectrum(f, tau, kind, f0)) / F.spectrum(f0, tau, kind, f0)); } }
  ok(worst < 2e-3, 'spectrum of a short burst: the formula matches a direct numerical Fourier transform (worst ' + (100 * worst).toFixed(2) + '% of the peak)'); })();
ok(F.envelope(0.005, 0.01, 'smooth') > 0.4999 && F.envelope(0.005, 0.01, 'smooth') < 0.5001 && F.envelope(0.0049, 0.01, 'sharp') === 1 && F.envelope(0.0051, 0.01, 'sharp') === 0, 'duration: the bell curve is half height at ±τ/2; the sharp one is on for exactly τ');
// widths: bell curve, df = 4 ln 2 / (pi tau) (0.883 / tau); sharp edges, 1.207 / tau (sinc at half height), for long bursts
(function () { const g = F.spread(0.03, 'smooth', 440), h = F.spread(0.05, 'sharp', 440);
  ok(near(g.df * 0.03, 4 * Math.LN2 / Math.PI, 1e-4) && Math.abs(g.peak - 440) < 0.2, 'smooth 30 ms burst: spread ' + g.df.toFixed(1) + ' Hz, duration × spread = 4 ln2/π = 0.883');
  // sinc: sin(u)/u = 1/2 at u = 1.89549
  ok(near(h.df * 0.05, 2 * 1.89549 / Math.PI, 2e-3), 'sharp-edged 50 ms burst: duration × spread = ' + (h.df * 0.05).toFixed(3) + ' (sin u / u = ½ at u = 1.8955)');
  const a = F.spread(0.004, 'smooth', 440), b = F.spread(0.008, 'smooth', 440);
  ok(near(a.df / b.df, 2, 0.02), 'halve the duration, double the spread: ' + b.df.toFixed(0) + ' Hz at 8 ms, ' + a.df.toFixed(0) + ' Hz at 4 ms');
  const s = F.spread(0.002, 'smooth', 440); ok(s.f1 > 150 && s.f2 < 750 && s.df > 400, '2 ms (under one cycle): frequencies from ' + s.f1.toFixed(0) + ' to ' + s.f2.toFixed(0) + ' Hz'); })();

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
