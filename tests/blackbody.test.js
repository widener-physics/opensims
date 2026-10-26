// Blackbody radiation: Planck's law against the Stefan-Boltzmann constant computed from h, c and k, against Wien's
// law found by searching for the peak, and against its long- and short-wavelength limits; the Sun's output against
// the measured solar constant; the colors against the CIE's published Planckian locus and standard illuminant A;
// the color index and its inverse; and the stars' radii and temperatures against their published luminosities.
const B = require('./load.js')('blackbody');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);
const { h, c, k, sigma } = B.PC;

// 1. Planck's law
(function () { const s = 2 * Math.PI ** 5 * k ** 4 / (15 * c * c * h ** 3);
  ok(near(s, sigma, 1e-9), 'Stefan-Boltzmann constant from h, c, k: ' + s.toExponential(6) + ' W m⁻² K⁻⁴ (CODATA 5.670374 × 10⁻⁸)');
  // the whole spectrum, added up on a fine log grid (trapezoids), is sigma T^4
  let worst = 0; for (const T of [300, 3000, 5772, 30000]) { const n = 20000, a = Math.log(1e-8), b = Math.log(1e-2); let sum = 0;
    for (let i = 0; i < n; i++) { const l1 = Math.exp(a + i * (b - a) / n), l2 = Math.exp(a + (i + 1) * (b - a) / n); sum += 0.5 * (B.exitance(l1, T) + B.exitance(l2, T)) * (l2 - l1); }
    worst = Math.max(worst, Math.abs(sum / B.totalPower(T) - 1)); }
  ok(worst < 1e-5, 'the spectrum adds up to σT⁴ at 300 K to 30 000 K (within ' + worst.toExponential(1) + ')');
  ok(Math.abs(B.share(5772, 1e-9, 1e-2) - 1) < 1e-4, 'the share between two wavelengths: all of it over the whole spectrum'); })();
(function () { let worst = 0; for (const T of [310, 1000, 5772, 12100]) { let best = 0, lb = 0; const l0 = B.PC.wien / T;
    for (let i = 0; i <= 20000; i++) { const l = l0 * (0.5 + i / 20000); const v = B.planck(l, T); if (v > best) { best = v; lb = l; } } worst = Math.max(worst, Math.abs(lb / l0 - 1)); }
  ok(worst < 1e-4, 'the peak, found by searching, is at Wien\'s b/T (b = 2.898 mm·K): the Sun at ' + (B.peakWavelength(5772) * 1e9).toFixed(0) + ' nm, a person (310 K) at ' + (B.peakWavelength(310) * 1e6).toFixed(1) + ' µm'); })();
// long wavelengths: Rayleigh-Jeans 2 c k T / lambda^4; short: Wien's 2hc^2/lambda^5 e^(-hc/lambda kT)
ok(near(B.planck(1e-2, 300), 2 * c * k * 300 / 1e-8, 5e-3) && near(B.planck(100e-9, 3000), 2 * h * c * c / 1e-35 * Math.exp(-h * c / (100e-9 * k * 3000)), 1e-12), 'limits: Rayleigh-Jeans at 1 cm, Wien\'s exponential at 100 nm');
ok(B.planck(10e-9, 300) === 0 && B.planck(500e-9, 6000) > B.planck(500e-9, 5000), 'nothing at 10 nm from a 300 K body; hotter is brighter at every wavelength');
// the Sun: power reaching Earth, sigma T^4 (R/AU)^2, against the measured total solar irradiance, 1361 W/m^2
ok(near(B.totalPower(5772) * (B.PC.Rsun / 1.495978707e11) ** 2, 1361, 0.002) && near(4 * Math.PI * B.PC.Rsun ** 2 * B.totalPower(5772), B.PC.Lsun, 0.002) && near(B.PC.Lsun, 3.828e26, 1e-9), 'the Sun as a 5772 K blackbody: 1361 W/m² at Earth (measured: 1361) and 3.828 × 10²⁶ W in all (IAU)');
(function () { const v = B.share(5772, 380e-9, 750e-9), ir = B.share(5772, 750e-9, 1e-2);
  ok(v > 0.4 && v < 0.47 && ir > 0.45 && B.share(310, 380e-9, 750e-9) < 1e-20, 'the Sun: ' + (100 * v).toFixed(0) + '% visible, ' + (100 * ir).toFixed(0) + '% infrared; a person: no visible light at all'); })();

// 2. color, against the CIE's Planckian locus (Kim et al. 2002 fit to it) and illuminant A
(function () { const kim = T => { const x = T <= 4000 ? -0.2661239e9 / T ** 3 - 0.2343589e6 / T ** 2 + 0.8776956e3 / T + 0.179910 : -3.0258469e9 / T ** 3 + 2.1070379e6 / T ** 2 + 0.2226347e3 / T + 0.240390;
    const y = T <= 2222 ? -1.1063814 * x ** 3 - 1.34811020 * x ** 2 + 2.18555832 * x - 0.20219683 : T <= 4000 ? -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867 : 3.0817580 * x ** 3 - 5.87338670 * x ** 2 + 3.75112997 * x - 0.37001483; return [x, y]; };
  const off = T => { const a = B.chroma(T), b = kim(T); return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  const hot = Math.max(...[2856, 3500, 4500, 5772, 6500, 9000, 15000, 24000].map(off)), red = Math.max(off(1700), off(2000));
  // the color-matching curves are a smooth fit (Wyman et al. 2013), a little off far into the red
  ok(hot < 0.0015 && red < 0.006, 'colors of blackbodies on the CIE Planckian locus: within ' + hot.toFixed(4) + ' in x, y from 2856 K to 24 000 K, ' + red.toFixed(4) + ' at 1700–2000 K');
  const A = B.chroma(2856); ok(Math.hypot(A[0] - 0.44757, A[1] - 0.40745) < 0.002, 'a 2856 K blackbody: CIE illuminant A (an incandescent bulb), x = ' + A[0].toFixed(4) + ', y = ' + A[1].toFixed(4)); })();
(function () { const w = B.rgb(6504), r = B.rgb(1200), bl = B.rgb(25000), s = B.rgb(5772);
  ok(Math.min(...w) > 240 && r[0] === 255 && r[1] < 120 && r[2] < 40 && bl[2] === 255 && bl[0] < 200 && s[0] >= s[1] && s[1] >= s[2] && s[2] > 220, 'on screen: 6500 K white, 1200 K red, 25 000 K blue-white, the Sun a faintly warm white');
  ok(B.cmf(555)[1] > 0.99 && B.cmf(555)[1] < 1.02 && B.cmf(700)[1] < 0.01 && B.cmf(450)[2] > 1.6, 'the eye\'s response: brightness peaks near 555 nm; blue at 450'); })();

// 3. color index
ok(Math.abs(B.colorIndex(B.VEGA_T)) < 1e-12 && B.colorIndex(3700) > 1 && B.colorIndex(25000) < -0.3, 'B − V: zero for Vega by definition, positive (redder) for cool stars, negative for hot ones');
(function () { let mono = true, prev = Infinity; for (let T = 2000; T <= 40000; T *= 1.05) { const v = B.colorIndex(T); if (v >= prev) mono = false; prev = v; }
  ok(mono, 'B − V falls steadily as the temperature rises, so it can be turned back into a temperature');
  let worst = 0; for (const T of [2500, 3700, 5772, 9602, 20000]) worst = Math.max(worst, Math.abs(B.tempFromIndex(B.colorIndex(T)) / T - 1)); ok(worst < 1e-6, 'temperature from B − V and back: exact');
  // very hot: Rayleigh-Jeans, so B/V is the ratio of the filters' weights on lambda^-3, whatever the temperature
  const rj = f => { let s = 0; for (let nm = 250; nm <= 850; nm++) s += B.filterT(f, nm * 1e-9) * Math.pow(nm * 1e-9, -3); return s; };
  ok(Math.abs(B.colorIndex(1e7) - (-2.5 * Math.log10(rj('B') / rj('V')) + B.ZP)) < 0.003, 'the hottest possible color: B − V levels off at ' + B.colorIndex(1e7).toFixed(2) + ' (the Rayleigh-Jeans tail)'); })();
ok(B.filterT('B', 445e-9) === 1 && Math.abs(B.filterT('V', 551e-9 + 44e-9) - 0.5) < 1e-3, 'filters: B centered at 445 nm, V at 551 nm, 88 nm wide at half height');

// 4. the stars: luminosity from radius and temperature against the published luminosity
(function () { let worst = 0, who = ''; B.STARS.forEach(s => { const e = Math.abs(B.luminosity(s.R, s.T) / s.L - 1); if (e > worst) { worst = e; who = s.name; } });
  ok(worst < 0.2, B.STARS.length + ' stars: L = R² (T / 5772 K)⁴ within ' + (100 * worst).toFixed(0) + '% of their published luminosities (worst: ' + who + ')');
  ok(near(B.radiusFrom(B.luminosity(760, 3700), 3700), 760, 1e-12) && B.luminosity(1, 5772) === 1, 'radius from luminosity and temperature, and back'); })();

// more checks of the pieces
ok(Math.abs(B.peakWavelength(5772) - B.PC.wien / 5772) < 1e-15 && Math.abs(B.peakWavelength(5772) * 1e9 - 502) < 0.5, 'Wien\'s law: the Sun\'s peak at 502 nm');
(function () { const T = 5772, n = 200000, a = 380e-9, b = 750e-9; let sum = 0; for (let i = 0; i < n; i++) { const l1 = a + i * (b - a) / n, l2 = a + (i + 1) * (b - a) / n; sum += 0.5 * (B.exitance(l1, T) + B.exitance(l2, T)) * (l2 - l1); }
  ok(Math.abs(B.share(T, a, b) - sum / B.totalPower(T)) < 1e-6, 'the visible share against a fine sum of thin strips'); })();
// the color-matching curves against the CIE 1931 table
(function () { const tab = { 450: [0.3362, 0.0380, 1.7721], 500: [0.0049, 0.3230, 0.2720], 550: [0.4334, 0.9950, 0.0087], 600: [1.0622, 0.6310, 0.0008], 650: [0.2835, 0.1070, 0.0000] };
  let worst = 0; Object.keys(tab).forEach(nm => { const m = B.cmf(+nm); for (let i = 0; i < 3; i++) worst = Math.max(worst, Math.abs(m[i] - tab[nm][i])); });
  ok(worst < 0.015, 'the eye\'s color-matching curves within ' + worst.toFixed(3) + ' of the CIE 1931 table at 450–650 nm'); })();
// screen colors: the standard sRGB primaries and its white point come out exactly
ok([[[0.95047, 1, 1.08883], [255, 255, 255]], [[0.4124, 0.2126, 0.0193], [255, 0, 0]], [[0.3576, 0.7152, 0.1192], [0, 255, 0]], [[0.1805, 0.0722, 0.9505], [0, 0, 255]]].every(([x, want]) => B.srgb(...x).every((v, i) => Math.abs(v - want[i]) <= 1)) && B.srgb(0.4124 + 0.3576 * 0.214, 0.2126 + 0.7152 * 0.214, 0.0193 + 0.1192 * 0.214).every((v, i) => Math.abs(v - [255, 128, 0][i]) <= 1),
  'screen color: the sRGB white point and its red, green and blue primaries, and an orange with green at linear 0.214 (shown as 128)');
ok(B.VEGA_T === B.STARS.find(s => s.id === 'vega').T && B.PC.Rsun === 6.957e8 && B.PC.Lsun === 3.828e26, 'Vega\'s temperature for the zero point is the listed one; the Sun\'s nominal radius and luminosity (IAU 2015)');

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
