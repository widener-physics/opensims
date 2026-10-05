// Polarized light: Malus's law; unpolarized light against a Monte Carlo average of many random pure beams;
// the three-polarizer surprise; wave plates (circular light, rotation by a half-wave plate) with the turning
// direction checked against the field itself in time; Fresnel reflection, Brewster's angle and energy; and the
// many-polarizer limit.
const P = require('./load.js')('polarization');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const I = J => P.intensity(J);

// 1. Malus's law, and unpolarized light through one polarizer
{
  let w = 0; for (let a = 0; a <= 180; a += 7.5) w = Math.max(w, Math.abs(I(P.transform(P.polarizer(30 + a), P.linear(1, 30))) - Math.cos(a * P.DEG) ** 2));
  ok(w < 1e-14, 'polarized light through a polarizer turned by theta: I = I0 cos^2(theta), every 7.5 deg (worst ' + w.toExponential(1) + ')');
  let u = 0; for (let a = 0; a < 180; a += 13) u = Math.max(u, Math.abs(I(P.transform(P.polarizer(a), P.unpolarized(1))) - 0.5));
  ok(u < 1e-15, 'unpolarized light through a polarizer at any angle: exactly half gets through');
  const S = P.stokes(P.transform(P.polarizer(20), P.unpolarized(1)));
  ok(Math.abs(S.p - 1) < 1e-12 && Math.abs(P.lineAngle(P.transform(P.polarizer(20), P.unpolarized(1))) - 20) < 1e-9, 'and what comes out is fully polarized along the polarizer\'s axis');
}
// 2. unpolarized light as an average of many random pure beams (independent of the coherency matrix)
{
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const chains = [[P.polarizer(0), P.polarizer(45), P.polarizer(90)], [P.polarizer(10), P.wavePlate(55, P.QUARTER), P.polarizer(-30)], [P.reflector(1.5, 50), P.polarizer(70)]];
  let worst = 0;
  chains.forEach(Ms => {
    let sum = 0; const n = 200000;
    for (let k = 0; k < n; k++) {
      // a random pure state, uniform over the Poincare sphere, of unit intensity
      const z = 2 * rnd() - 1, ph = 2 * Math.PI * rnd(), th = Math.acos(z) / 2;
      let E = [P.cx(Math.cos(th)), P.cmul(P.cexp(ph), P.cx(Math.sin(th)))];
      Ms.forEach(M => { E = [P.cadd(P.cmul(M[0][0], E[0]), P.cmul(M[0][1], E[1])), P.cadd(P.cmul(M[1][0], E[0]), P.cmul(M[1][1], E[1]))]; });
      sum += P.abs2(E[0]) + P.abs2(E[1]);
    }
    worst = Math.max(worst, Math.abs(sum / n - I(P.through(P.unpolarized(1), Ms))));
  });
  ok(worst < 0.003, 'three chains (polarizers, a wave plate, a reflection): the coherency matrix agrees with 200,000 random pure beams averaged (worst ' + worst.toFixed(4) + ')');
}
// 3. crossed polarizers, and the third one in between
{
  ok(I(P.through(P.unpolarized(1), [P.polarizer(0), P.polarizer(90)])) < 1e-30, 'crossed polarizers: nothing gets through');
  const t = I(P.through(P.unpolarized(1), [P.polarizer(0), P.polarizer(45), P.polarizer(90)]));
  ok(Math.abs(t - 0.125) < 1e-15, 'put a third at 45 deg between them and 1/8 of the light gets through: (1/2) cos^2 45 cos^2 45');
  let best = 0, at = 0; for (let a = 0; a <= 90; a += 0.5) { const v = I(P.through(P.unpolarized(1), [P.polarizer(0), P.polarizer(a), P.polarizer(90)])); if (v > best) { best = v; at = a; } }
  ok(at === 45, 'the middle polarizer lets the most through at 45 deg');
}
// 4. wave plates
{
  const out = P.transform(P.wavePlate(45, P.QUARTER), P.linear(1, 0)), S = P.stokes(out);
  ok(Math.abs(Math.abs(S.S3) - 1) < 1e-12 && Math.abs(P.stokes(P.transform(P.wavePlate(-45, P.QUARTER), P.linear(1, 0))).S3 + S.S3) < 1e-12, 'a quarter-wave plate at 45 deg to the light makes it circular; at -45 deg, circular the other way round');
  let flat = 0; for (let a = 0; a < 180; a += 10) flat = Math.max(flat, Math.abs(I(P.transform(P.polarizer(a), out)) - 0.5));
  ok(flat < 1e-14, 'circular light through a polarizer: half gets through at every angle, as for unpolarized light, yet it is fully polarized (p = ' + S.p.toFixed(3) + ')');
  // the turning direction, checked in time: follow Re(E e^(-i w t)) and see which way it goes round
  let agree = 0, cases = 0;
  [[45, P.QUARTER], [-45, P.QUARTER], [30, P.QUARTER], [-60, 1.1], [20, 2.3]].forEach(([th, G]) => {
    const J = P.transform(P.wavePlate(th, G), P.linear(1, 0)), E = P.polarizedPart(J), s3 = P.stokes(J).S3;
    let cross = 0; for (let k = 0; k < 64; k++) { const a = P.fieldAt(E, k / 64 * 2 * Math.PI), b = P.fieldAt(E, (k + 1) / 64 * 2 * Math.PI); cross += a[0] * b[1] - a[1] * b[0]; }
    cases++; if (Math.sign(cross) === Math.sign(s3)) agree++;
  });
  ok(agree === cases, 'S3 > 0 means the field really turns counterclockwise as seen from the meter (checked in time, ' + agree + '/' + cases + ')');
  // and the turning direction built from scratch, without the core's matrices: split vertical light into parts along
  // the fast axis f and the slow axis s, and let the slow part lag by the retardance: E(t) = af cos(wt) f + as cos(wt - G) s
  let built = 0, nb = 0;
  [[45, P.QUARTER], [-45, P.QUARTER], [20, P.QUARTER], [-70, 1.1], [60, 2.3]].forEach(([th, G]) => {
    const c = Math.cos(th * P.DEG), sn = Math.sin(th * P.DEG), f = [-sn, c], sl = [c, sn], af = f[1], as = sl[1];
    let cross = 0, prev = null;
    for (let k = 0; k <= 64; k++) { const t = k / 64 * 2 * Math.PI, e = [af * Math.cos(t) * f[0] + as * Math.cos(t - G) * sl[0], af * Math.cos(t) * f[1] + as * Math.cos(t - G) * sl[1]]; if (prev) cross += prev[0] * e[1] - prev[1] * e[0]; prev = e; }
    nb++; if (Math.sign(cross) === Math.sign(P.stokes(P.transform(P.wavePlate(th, G), P.linear(1, 0))).S3)) built++;
  });
  ok(built === nb, 'the turning direction agrees with the field built by hand from the fast and slow parts (' + built + '/' + nb + '): a quarter-wave plate at +45 deg turns vertical light clockwise as seen from the meter');
  let rot = 0; [0, 10, 25, 40, 70].forEach(th => { rot = Math.max(rot, Math.abs(P.lineAngle(P.transform(P.wavePlate(th, P.HALF), P.linear(1, 0))) - (((2 * th + 90) % 180) - 90))); });
  ok(rot < 1e-9, 'a half-wave plate turns straight-line polarization by twice the angle between the light and its axis');
  const two = P.through(P.linear(1, 0), [P.wavePlate(30, P.QUARTER), P.wavePlate(30, P.QUARTER)]), half = P.transform(P.wavePlate(30, P.HALF), P.linear(1, 0));
  ok([0, 1].every(i => [0, 1].every(j => Math.hypot(two[i][j][0] - half[i][j][0], two[i][j][1] - half[i][j][1]) < 1e-14)), 'two quarter-wave plates in a row act as one half-wave plate');
  let keep = 0; [P.QUARTER, P.HALF, 0.7].forEach(G => [0, 33, 81].forEach(th => { keep = Math.max(keep, Math.abs(I(P.transform(P.wavePlate(th, G), P.unpolarized(1))) - 1)); }));
  ok(keep < 1e-14, 'wave plates never absorb: the intensity is unchanged');
}
// 5. reflection: Fresnel, Brewster's angle, energy
{
  const n = 1.52, b = P.brewster(n), f = P.fresnel(n, b);
  ok(f.Rp < 1e-30 && Math.abs(b - 56.66) < 0.01, 'glass (n = 1.52): at Brewster\'s angle, ' + b.toFixed(2) + ' deg, light polarized in the plane of incidence does not reflect at all');
  const f0 = P.fresnel(1.333, 0);
  ok(Math.abs(f0.Rs - ((0.333 / 2.333) ** 2)) < 1e-15 && Math.abs(f0.Rp - f0.Rs) < 1e-15, 'head-on, both reflect ((n - 1)/(n + 1))^2 = ' + (100 * f0.Rs).toFixed(2) + '% off water');
  // transmitted power from the Fresnel transmission amplitudes; R + T = 1 for each polarization
  let w = 0;
  [1.333, 1.52, 2.42].forEach(nn => { for (let a = 0; a < 89.5; a += 3.7) {
    const ci = Math.cos(a * P.DEG), st = Math.sin(a * P.DEG) / nn, ct = Math.sqrt(1 - st * st), r = P.fresnel(nn, a);
    const ts = 2 * ci / (ci + nn * ct), tp = 2 * ci / (nn * ci + ct), k = nn * ct / ci;
    w = Math.max(w, Math.abs(r.Rs + k * ts * ts - 1), Math.abs(r.Rp + k * tp * tp - 1));
  } });
  ok(w < 1e-12, 'water, glass and diamond at every angle: reflected + transmitted power = incident, for both polarizations (worst ' + w.toExponential(1) + ')');
  const glare = P.transform(P.reflector(1.333, P.brewster(1.333)), P.unpolarized(1));
  ok(P.stokes(glare).p > 0.999999 && (Math.abs(P.lineAngle(glare) - 90) < 1e-6 || Math.abs(P.lineAngle(glare) + 90) < 1e-6), 'glare off water at Brewster\'s angle is completely polarized, horizontally (parallel to the surface)');
  ok(I(P.transform(P.polarizer(0), glare)) < 1e-30, 'so a vertical polarizer, like polarized sunglasses, blocks all of it');
}
// 6. many polarizers turning the light 90 deg in equal steps: cos^2N(90 deg / N), approaching 1
{
  let w = 0; [1, 2, 3, 5, 10, 30].forEach(N => { w = Math.max(w, Math.abs(I(P.through(P.linear(1, 0), P.manySteps(N))) - Math.cos(Math.PI / 2 / N) ** (2 * N))); });
  ok(w < 1e-14, 'N polarizers in equal steps from vertical to horizontal pass cos^2N(90/N): 0, 1/4, 0.42, 0.61, 0.78, 0.92 ...');
  ok(I(P.through(P.linear(1, 0), P.manySteps(1000))) > 0.997, 'with 1000 steps more than 99.7% gets through: the light is turned, not blocked');
}
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
