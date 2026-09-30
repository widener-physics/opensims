// The photoelectric effect: Fowler's function against numerical integration, the current against a direct
// count of the electrons of a Fermi-Dirac metal, Einstein's limits, the handbook work functions, the
// electron sampler against the current, and a simulated stopping-voltage experiment recovering h.
const P = require('./load.js')('photoelectric');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const simpson = (f, a, b, n) => { n = n || 4000; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; };
const RATE = 1e14;                                   // photons per second at full brightness

// 1. constants from the SI definitions
{
  const hc = 6.62607015e-34 * 299792458 / 1.602176634e-19 * 1e9;
  ok(Math.abs(P.HC - hc) < 1e-5, 'hc = ' + hc.toFixed(4) + ' eV nm from the exact SI constants');
  ok(Math.abs(P.H_EV - 6.62607015e-34 / 1.602176634e-19) < 1e-23, 'h in eV s matches h / e');
  ok(Math.abs(P.photonEV(500) - 2.4797) < 1e-4, 'a 500 nm photon carries 2.480 eV');
}

// 2. Fowler's function against the integral that defines it, and its two limits
{
  let worst = 0;
  for (let x = -12; x <= 12; x += 0.37) {
    const num = simpson(y => Math.log1p(Math.exp(x - y)), 0, Math.max(0, x) + 45, 20000);
    worst = Math.max(worst, Math.abs(P.fowler(x) - num) / num);
  }
  ok(worst < 1e-8, 'F(x) agrees with the integral of ln(1 + e^(x-y)) from -12 to 12 (worst relative error ' + worst.toExponential(1) + ')');
  ok(Math.abs(P.fowler(0) - Math.PI * Math.PI / 12) < 1e-12, 'F(0) = pi^2/12, the hardest point for the series');
  ok(Math.abs(P.fowler(-20) / Math.exp(-20) - 1) < 1e-8, 'far below threshold F(x) -> e^x (a thermal tail)');
  ok(Math.abs(P.fowler(40) - (800 + Math.PI * Math.PI / 6)) < 1e-12, 'far above threshold F(x) -> x^2/2 + pi^2/6');
}

// 3. the current is the integral it claims to be: electrons whose energy toward the anode, outside the
//    metal, exceeds the barrier e|V|, with density ln(1 + e^((Kmax - E)/kT))
{
  let worst = 0;
  [['sodium', 400], ['cesium', 520], ['platinum', 200], ['zinc', 270]].forEach(([m, lam]) => {
    const phi = P.METALS[m].phi, K = P.photonEV(lam) - phi;
    [0, -0.3, -K / 2, -K + 0.05, -K, -K - 0.05].forEach(V => {
      const b = Math.max(0, -V);
      const num = P.QE * RATE * P.Y0 * P.KT * simpson(E => Math.log1p(Math.exp((K - E) / P.KT)), b, Math.max(K, b) + 40 * P.KT, 20000);
      worst = Math.max(worst, Math.abs(P.current(lam, phi, V, RATE) - num) / num);
    });
  });
  ok(worst < 1e-8, 'current = count of electrons with enough energy to climb the barrier, for 4 metals and 6 voltages (worst ' + worst.toExponential(1) + ')');
}

// 4. Fowler's step from the metal's electrons to that energy distribution. Count directly: electrons of a
//    Fermi-Dirac gas (sodium, E_F = 3.24 eV) moving toward the surface with speed u, weighted by the number
//    of states per du (Fowler 1931), that absorb h f and still clear the barrier plus e|V|. The model's
//    shortcut treats du as proportional to dE near the Fermi level; this checks how good that is.
{
  const EF = 3.24, phi = P.METALS.sodium.phi, kT = P.KT;
  // states per unit normal energy E in the metal: ln(1 + e^((EF - E)/kT)) / sqrt(E)   (du = dE / sqrt(2 m E))
  const direct = (lam, V) => {
    const E0 = EF + phi + Math.max(0, -V) - P.photonEV(lam);         // lowest normal energy that makes it
    return simpson(E => Math.log1p(Math.exp((EF - E) / kT)) / Math.sqrt(E), Math.max(E0, 1e-6), EF + 40 * kT, 40000);
  };
  let worst = 0, worstShape = 0;
  [440, 420, 400, 380].forEach(lam => {
    const K = P.photonEV(lam) - phi, d0 = direct(lam, 0), m0 = P.saturation(lam, phi, 1);
    [0, -0.25 * K, -0.5 * K, -0.75 * K, -0.9 * K].forEach(V => {
      worstShape = Math.max(worstShape, Math.abs(direct(lam, V) / d0 - P.current(lam, phi, V, 1) / m0));
    });
    // yield relative to its value at 420 nm
    worst = Math.max(worst, Math.abs((d0 / direct(420, 0)) / (m0 / P.saturation(420, phi, 1)) - 1));
  });
  ok(worstShape < 0.03, 'sodium, 380-440 nm: the current-voltage curve matches the direct count of Fermi-Dirac electrons to within ' + (100 * worstShape).toFixed(1) + '% of saturation');
  ok(worst < 0.12, 'and the yield\'s growth with photon energy matches it to within ' + (100 * worst).toFixed(0) + '% (the model is Fowler\'s near-threshold form)');
}

// 5. Einstein's picture: no electrons below threshold however bright, none past K_max, current proportional to brightness
{
  const phi = P.METALS.sodium.phi, lt = P.thresholdNm(phi);
  ok(Math.abs(lt - 450.85) < 0.01, 'sodium\'s threshold wavelength is hc / phi = ' + lt.toFixed(1) + ' nm');
  ok(P.ammeter(P.current(P.HC / (phi - 0.3), phi, 0, RATE)).amps === 0, '0.3 eV below threshold the meter reads zero at full brightness');
  const lam = 400, K = P.photonEV(lam) - phi;
  ok(P.ammeter(P.current(lam, phi, -(K + 0.3), RATE)).amps === 0, 'a retarding voltage 0.3 V past K_max/e stops every electron the meter can see');
  ok(P.current(lam, phi, -(K - 0.3), RATE) > 1e-11, 'while 0.3 V short of it, current still flows');
  const r = [0.1, 0.5, 1].map(f => P.current(lam, phi, -0.4, f * RATE) / (f * RATE));
  ok(Math.abs(r[0] / r[2] - 1) < 1e-12 && Math.abs(r[1] / r[2] - 1) < 1e-12, 'current is proportional to the photon rate, at any voltage');
  ok([0, 0.5, 3, 8].every(V => P.current(lam, phi, V, RATE) === P.saturation(lam, phi, RATE)), 'any accelerating voltage collects every electron (saturation)');
  // far from the edges the curve is DuBridge's parabola (1 - e|V|/K_max)^2
  let w = 0; const K2 = P.photonEV(250) - phi;
  for (let V = 0; V <= K2 - 0.4; V += 0.1) w = Math.max(w, Math.abs(P.current(250, phi, -V, 1) / P.saturation(250, phi, 1) - (1 - V / K2) ** 2));
  ok(w < 0.005, 'away from the ends, I/I_sat = (1 - e|V|/K_max)^2, the zero-temperature parabola (within ' + w.toFixed(4) + ')');
}

// 6. work functions: Michaelson (1977) Table III, preferred polycrystalline values
{
  const table = { Cs: 2.14, Rb: 2.16, K: 2.30, Na: 2.75, Ca: 2.87, Li: 2.9, Mg: 3.66, Al: 4.28, Zn: 4.33, Cu: 4.65, Au: 5.1, Pt: 5.65 };
  const ms = Object.values(P.METALS);
  ok(ms.length === 12 && ms.every(m => table[m.sym] === m.phi), 'all 12 work functions match Michaelson (1977) Table III');
  const phis = P.MYSTERY.map(k => P.METALS[k].phi).sort((a, b) => a - b);
  const gap = Math.min(...phis.slice(1).map((p, i) => p - phis[i]));
  ok(gap >= 0.55, 'the mystery metals differ by at least ' + gap.toFixed(2) + ' eV, so a careful measurement can tell them apart');
  ok(P.EXPLORE.every(k => P.thresholdNm(P.METALS[k].phi) > 150), 'every metal emits somewhere in the 150-850 nm range of the lamp');
}

// 7. the animated electrons come from the same distribution as the current
{
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const phi = P.METALS.zinc.phi, lam = 230, K = P.photonEV(lam) - phi, N = 200000, Es = [];
  for (let i = 0; i < N; i++) Es.push(P.sampleEnergy(K, rnd));
  let worst = 0;
  [0.2, 0.4, 0.6, 0.8, 0.95].forEach(f => {
    const frac = Es.filter(E => E > f * K).length / N, pred = P.current(lam, phi, -f * K, 1) / P.saturation(lam, phi, 1);
    worst = Math.max(worst, Math.abs(frac - pred));
  });
  ok(worst < 0.005, 'fraction of sampled electrons that clear each retarding barrier matches I(V)/I_sat (worst ' + worst.toFixed(4) + ')');
  ok(Es.reduce((a, e) => Math.max(a, e), 0) < K + 12 * P.KT && Es.reduce((a, e) => Math.min(a, e), 1) >= 0, 'no sampled electron goes backward or beyond the thermal tail');
}

// 8. a simulated experiment, done the way a student would: for each color lower the voltage in 0.01 V steps
//    until the meter reads zero, then fit stopping voltage against frequency
{
  const lines = [253.7, 296.7, 313.2, 365.0, 404.7, 435.8, 546.1, 577.0];   // mercury lines, nm
  const stopping = (lam, phi, rate) => { let V = 0; while (P.ammeter(P.current(lam, phi, V, rate)).amps > 0) V -= 0.01; return -V; };
  let worstH = 0, worstPhi = 0, lowest = 1;
  P.EXPLORE.forEach(k => {
    const phi = P.METALS[k].phi;
    const pts = lines.filter(l => P.photonEV(l) > phi + 0.15).map(l => [P.freq(l), stopping(l, phi, 0.5 * RATE)]);
    if (pts.length < 2) return;
    const fit = P.fitLine(pts), h = fit.m * P.QE, phiFit = -fit.b;
    worstH = Math.max(worstH, Math.abs(h / P.H_SI - 1)); worstPhi = Math.max(worstPhi, Math.abs(phiFit - phi)); lowest = Math.min(lowest, phi - phiFit);
  });
  ok(worstH < 0.01, 'every metal: the slope of stopping voltage vs frequency gives h to within ' + (100 * worstH).toFixed(2) + '%');
  ok(worstPhi < 0.12 && lowest > 0, 'and the intercept gives phi a little low (by at most ' + worstPhi.toFixed(2) + ' eV), because of the thermal tail');
  let right = 0, total = 0;
  P.MYSTERY.forEach(k => {
    const phi = P.METALS[k].phi;
    [0.1, 0.4, 1].forEach(b => {
      const ls = [150, 170, 190, 210, 230, 260, 300, 350, 400, 450, 500, 550].filter(l => P.photonEV(l) > phi + 0.1).slice(-4);
      const fit = P.fitLine(ls.map(l => [P.freq(l), stopping(l, phi, b * RATE)])), guess = -fit.b;
      const best = P.MYSTERY.reduce((a, c) => Math.abs(P.METALS[c].phi - guess) < Math.abs(P.METALS[a].phi - guess) ? c : a);
      total++; if (best === k) right++;
    });
  });
  ok(right === total, 'the mystery metal is identified correctly from four colors in all ' + total + ' cases (6 metals, 3 brightnesses)');
}

// 9. the line fit
{
  const f = P.fitLine([[1, 3], [2, 5], [4, 9]]);
  ok(Math.abs(f.m - 2) < 1e-12 && Math.abs(f.b - 1) < 1e-12 && f.sm < 1e-7, 'least squares recovers an exact line');
  const g = P.fitLine([[0, 0], [1, 1], [2, 1], [3, 3]]);
  // by hand: slope 0.9, intercept -0.1, residuals 0.1, 0.2, -0.7, 0.4, sum of squares 0.7, s^2 0.35, s_m = sqrt(0.35/5)
  ok(Math.abs(g.m - 0.9) < 1e-12 && Math.abs(g.b + 0.1) < 1e-12 && Math.abs(g.sm - Math.sqrt(0.35 / 5)) < 1e-12, 'slope, intercept and slope uncertainty match a hand calculation');
  ok(P.fitLine([[1, 2]]) === null && P.fitLine([[1, 2], [1, 3]]) === null, 'refuses one point, or points all at one frequency');
}

// 10. the meter
{
  ok(P.ammeter(4e-13).text === '0.000 nA' && P.ammeter(6e-13).text === '0.001 nA', 'the meter resolves 1 pA');
  ok(P.ammeter(1.2346e-8).text === '12.35 nA' && P.ammeter(2.5e-6).text === '2.500 µA', 'and switches range as the current grows');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
