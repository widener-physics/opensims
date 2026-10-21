// Doppler effect: the arrival times found from a recorded motion against the exact solution for straight-line
// motion; the heard frequency against counting crests (the rate at which sent-time advances, by finite
// differences); the textbook formulas for a moving source and a moving listener as limits; a drive-by heard at
// exactly the sent pitch for sound sent at closest approach; faster than sound: silence, then the boom at the
// predicted time and angle, then two arrivals; relativistic Doppler and its slow limit; a planet's tug on its star
// against published values; note names.
const D = require('./load.js')('doppler-effect');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const v = D.SOUND.v, near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);
// a recorded straight drive at speed u from x0, sampled every dt
function drive(u, x0, y0, dt, T) { const tr = D.makeTrack(dt, Math.ceil(T / dt) + 2); for (let i = 0; i * dt <= T + 1e-9; i++) { const t = i * dt; D.record(tr, t, x0 + u * t, y0, u, 0); } return tr; }

// 0. the speed of sound in air at 20 C: 331.3 m/s at 0 C, times sqrt(T / 273.15 K)
ok(Math.abs(v - 331.3 * Math.sqrt(293.15 / 273.15)) < 0.5, 'speed of sound ' + v + ' m/s: 331.3 m/s x sqrt(293.15/273.15) = ' + (331.3 * Math.sqrt(293.15 / 273.15)).toFixed(1) + ' m/s, air at 20 \u00B0C');
// 1. arrivals from a recording against the exact quadratic
(function () { const u = 30, tr = drive(u, -150, 0, 0.01, 12); let worst = 0, n = 0;
  [[0, 25], [40, -10], [-100, 60], [200, 5]].forEach(([X, Y]) => [2, 5.5, 9, 11.9].forEach(t => {
    const a = D.arrivals(tr, t, { x: X, y: Y }), e = D.straightArrivals(-150, 0, u, X, Y, t).filter(s => s >= 0);
    if (a.length !== e.length) worst = Infinity; else a.forEach((q, i) => { worst = Math.max(worst, Math.abs(q.te - e[i])); n++; }); }));
  ok(worst < 1e-9 && n === 16, 'ambulance at 30 m/s: when the sound now arriving was sent, from the recording vs the exact solution, 16 cases (worst ' + worst.toExponential(1) + ' s)'); })();
// a curving path: the arrival really satisfies v (t - te) = distance
(function () { const tr = D.makeTrack(0.005, 3000); for (let i = 0; i < 3000; i++) { const t = i * 0.005, w = 0.4; D.record(tr, t, 80 * Math.cos(w * t), 50 * Math.sin(w * t), -80 * w * Math.sin(w * t), 50 * w * Math.cos(w * t)); }
  const L = { x: 10, y: -30 }, a = D.arrivals(tr, 14, L), p = a.length && D.sourceAt(tr, a[0].te);
  ok(a.length === 1 && Math.abs(v * (14 - a[0].te) - Math.hypot(L.x - p.x, L.y - p.y)) < 1e-6, 'car on a curving path: the arrival found satisfies v (t - te) = distance'); })();

// 2. heard frequency = rate at which the sending time of the arriving sound advances (counting crests), by finite differences
(function () { const u = 40, tr = drive(u, -200, 0, 0.005, 12); let worst = 0;
  [[0, 15], [30, -40], [-60, 5]].forEach(([X, Y]) => [3, 5, 6.5, 8].forEach(t => { const h = 1e-4, a = D.arrivals(tr, t, { x: X, y: Y })[0], b1 = D.arrivals(tr, t + h, { x: X, y: Y })[0], b0 = D.arrivals(tr, t - h, { x: X, y: Y })[0];
    worst = Math.max(worst, Math.abs((b1.te - b0.te) / (2 * h) / a.ratio - 1)); }));
  ok(worst < 1e-6, 'heard / sent frequency equals the rate of arriving crests, at 12 moments (worst ' + worst.toExponential(1) + ')');
  // and for a moving listener: crests met per second
  const tr2 = drive(0, 0, 0, 0.005, 12), Lat = t => ({ x: -100 + 25 * t, y: 8, vx: 25, vy: 0 }), h = 1e-4, t = 6;
  const r = D.arrivals(tr2, t, Lat(t))[0].ratio, d = (D.arrivals(tr2, t + h, Lat(t + h))[0].te - D.arrivals(tr2, t - h, Lat(t - h))[0].te) / (2 * h);
  ok(near(r, d, 1e-6), 'listener walking past a still source: heard ratio ' + r.toFixed(4) + ' = crests met per crest sent'); })();

// on the curving path too (a source moving in both directions): heard ratio = rate of arriving crests
(function () { const tr = D.makeTrack(0.005, 4000); for (let i = 0; i < 4000; i++) { const t = i * 0.005, w = 0.5; D.record(tr, t, 90 * Math.cos(w * t), 60 * Math.sin(w * t), -90 * w * Math.sin(w * t), 60 * w * Math.cos(w * t)); }
  let worst = 0; [[10, -30], [-70, 20], [5, 90]].forEach(([X, Y]) => [12, 15.3, 18].forEach(t => { const h = 1e-4, L = { x: X, y: Y }, a = D.arrivals(tr, t, L)[0], b1 = D.arrivals(tr, t + h, L)[0], b0 = D.arrivals(tr, t - h, L)[0]; worst = Math.max(worst, Math.abs((b1.te - b0.te) / (2 * h) / a.ratio - 1)); }));
  ok(worst < 1e-6, 'car on a curving path: heard ratio = rate of arriving crests, 9 cases (worst ' + worst.toExponential(1) + ')'); })();
// how loud: as 1/distance, and squeezed waves (higher pitch) carry proportionally more pressure
(function () { const a = { dist: 50, ratio: 1.1 }, b = { dist: 100, ratio: 0.9 }; ok(Math.abs(D.loudness(a, 20) / D.loudness(b, 20) - (1.1 / 50) / (0.9 / 100)) < 1e-12, 'loudness goes as (heard/sent ratio) / distance'); })();

// 3. the textbook formulas
(function () { const f0 = 700, u = 34.3;
  ok(near(f0 * D.heardRatio([u, 0], [0, 0], [1, 0]), f0 * v / (v - u), 1e-12) && near(f0 * D.heardRatio([u, 0], [0, 0], [-1, 0]), f0 * v / (v + u), 1e-12), 'source coming at 34.3 m/s: 700 Hz heard as ' + (f0 * v / (v - u)).toFixed(1) + ' Hz, going away ' + (f0 * v / (v + u)).toFixed(1) + ' Hz (f0 v/(v -+ u))');
  ok(near(f0 * D.heardRatio([0, 0], [-u, 0], [1, 0]), f0 * (v + u) / v, 1e-12) && near(f0 * D.heardRatio([0, 0], [u, 0], [1, 0]), f0 * (v - u) / v, 1e-12), 'listener running toward a still source at 34.3 m/s: f0 (v + u)/v = ' + (f0 * (v + u) / v).toFixed(1) + ' Hz: not the same as the source moving');
  ok(near(D.heardRatio([u, 0], [u, 0], [1, 0]), 1, 1e-15), 'source and listener moving together: no shift'); })();
// recording vs formula, far ahead and far behind a drive
(function () { const u = 30, tr = drive(u, -500, 0, 0.01, 30); const ahead = D.arrivals(tr, 25, { x: 4000, y: 0 })[0], behind = D.arrivals(tr, 25, { x: -3000, y: 0 })[0];
  ok(near(ahead.ratio, v / (v - u), 1e-9) && near(behind.ratio, v / (v + u), 1e-9), 'straight ahead and straight behind: exactly v/(v - u) and v/(v + u)'); })();
// a drive-by: sound sent at the moment of closest approach is heard at exactly the sent pitch, and it arrives after the
// source has passed, so the pitch is already lower when the car is beside you
(function () { const u = 30, tr = drive(u, -150, 0, 0.005, 12), L = { x: 0, y: 25 }, tc = 5, tArr = tc + 25 / v;
  const a = D.arrivals(tr, tArr, L)[0], b = D.arrivals(tr, tc, L)[0];
  ok(Math.abs(a.te - tc) < 1e-9 && Math.abs(a.ratio - 1) < 1e-9 && b.ratio > 1, 'drive-by: the sound sent at closest approach arrives ' + (25 / v * 1000).toFixed(0) + ' ms later at exactly the sent pitch; when the car is beside you, you still hear it high (×' + b.ratio.toFixed(3) + ')'); })();

// 4. faster than sound
(function () { const u = 510, d = 300, tr = drive(u, -2000, 0, 0.002, 10), L = { x: 0, y: d };   // jet at Mach 1.5, 300 m above
  const tb = D.boomTime(2000, d, u);
  const before = D.arrivals(tr, tb - 0.01, L), after = D.arrivals(tr, tb + 0.05, L);
  ok(before.length === 0 && after.length === 2, 'Mach 1.5: nothing heard until ' + tb.toFixed(3) + ' s, then two arrivals at once (the boom)');
  const ex = D.straightArrivals(-2000, 0, u, 0, d, tb + 0.05); ok(Math.abs(after[0].te - ex[0]) < 1e-9 && Math.abs(after[1].te - ex[1]) < 1e-9, 'both arrivals match the exact solution');
  // the boom arrives when the cone, at half-angle asin(v/u) behind the jet, sweeps over the listener
  const xj = -2000 + u * tb, ang = Math.atan2(d, xj); ok(Math.abs(ang - D.machAngle(u)) < 1e-9, 'at the boom the jet is ahead by ' + xj.toFixed(0) + ' m: the listener sits on the cone of half-angle asin(v/u) = ' + (D.machAngle(u) * 180 / Math.PI).toFixed(1) + '°');
  // of the two, the sound sent while the jet was still coming arrives in reverse order (sent later, heard earlier):
  // its ratio is negative; the other was sent as the jet went away
  ok(after[0].ratio < 0 !== after[1].ratio < 0, 'after the boom: one arrival is the jet coming (heard in reverse, negative ratio), the other going'); })();

// 5. light
(function () { [0.001, 0.01].forEach(b => ok(near(D.lightRatio(b, 0), 1 / (1 - b), 2 * b * b) && near(D.lightRatio(b, Math.PI), 1 / (1 + b), 2 * b * b), 'slow source (' + b + ' c): light shifts like sound, f0 / (1 -+ beta), to order beta^2'));
  const b = 0.6; ok(near(D.lightRatio(b, 0), Math.sqrt(1.6 / 0.4), 1e-12) && near(D.lightRatio(b, 0) * D.lightRatio(b, Math.PI), 1, 1e-12), '0.6 c straight toward or away: frequency ×2 or ×½ exactly, sqrt((1+b)/(1-b))');
  ok(near(D.lightRatio(b, Math.PI / 2), Math.sqrt(1 - b * b), 1e-12), 'moving across the line of sight: still redder by sqrt(1 - b^2): time dilation, with no classical counterpart');
  ok([0.1, 1, 3, 10].every(z => near(D.zFromBeta(D.betaFromZ(z)), z, 1e-12)) && near(D.betaFromZ(1), 0.6, 1e-12), 'redshift and speed convert back and forth; z = 1 is 0.6 c');
  ok(near(D.BALMER[0] * (1 + D.zFromBeta(0.01)), 656.28 * Math.sqrt(1.01 / 0.99), 1e-12), 'H-alpha from a galaxy receding at 0.01 c: ' + (656.28 * Math.sqrt(1.01 / 0.99)).toFixed(2) + ' nm'); })();
// a planet's tug: Jupiter on the Sun about 12.5 m/s, Earth 0.09 m/s (published values for radial-velocity searches)
(function () { const Ms = 1.98841e30, yr = 3.15576e7;
  const KJ = D.wobbleK(11.862 * yr, 1.8982e27, Ms), KE = D.wobbleK(yr, 5.972e24, Ms);
  ok(Math.abs(KJ - 12.5) < 0.15 && Math.abs(KE - 0.0894) < 0.002, 'the Sun wobbles at ' + KJ.toFixed(2) + ' m/s from Jupiter and ' + KE.toFixed(4) + ' m/s from Earth (published: 12.5 and 0.09)');
  // and the same from momentum balance written out: M Vs = m Vp, Vp = 2 pi a / P, a from Kepler's third law
  const P = 11.862 * yr, m = 1.8982e27, a = Math.cbrt(D.G * (Ms + m) * P * P / (4 * Math.PI ** 2)), Vrel = 2 * Math.PI * a / P;
  ok(near(KJ, Vrel * m / (Ms + m), 1e-12), 'equal to the star\'s share of the orbital speed, from Kepler\'s law and momentum'); })();

// 6. note names
ok(D.noteName(440).name === 'A4' && D.noteName(440).cents === 0 && D.noteName(261.626).name === 'C4' && D.noteName(466.16).name === 'B♭4' && D.noteName(452).cents === 47, 'notes: 440 Hz is A4, 261.6 Hz is middle C, 452 Hz is A4 + 47 cents');

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
