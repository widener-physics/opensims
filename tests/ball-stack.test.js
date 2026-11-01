// The bouncing ball stack: collisions against conservation of momentum and the definition of restitution; each
// spring-and-damper contact against the bounciness and bounce time it was set up for; the "ideal" stack against the
// textbook sequence of one collision at a time, and the tower's (2^N - 1) limit; energy kept by perfectly bouncy
// springs; and the springy stack against the ideal one, the same when the contacts don't overlap in time.
const B = require('./load.js')('ball-stack');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);
const v0 = h => Math.sqrt(2 * B.G * h);

// 1. one collision
(function () { const [a, b] = B.collide(2, 3, 1, -1, 0.6);
  ok(Math.abs(2 * a + 1 * b - (2 * 3 + 1 * -1)) < 1e-12 && Math.abs((b - a) - 0.6 * (3 - -1)) < 1e-12, 'a collision keeps the momentum, and the speed of separation is e times the speed of approach');
  const [c, d] = B.collide(1, 2, 1, 0, 1); ok(Math.abs(c) < 1e-12 && Math.abs(d - 2) < 1e-12, 'equal masses, perfectly bouncy: they swap velocities');
  const [p, q] = B.collide(3, 2, 1, -2, 0); ok(Math.abs(p - q) < 1e-12 && Math.abs(p - 1) < 1e-12, 'no bounce at all: they move off together');
  const [r, s] = B.collide(1e9, -5, 1, 0, 1); ok(Math.abs(s - -10) < 1e-6, 'a very heavy ball hitting a light one at rest sends it off at twice its speed'); })();
ok(Math.abs(B.pairE(B.BALLS.basketball, B.BALLS.tennis) - Math.sqrt(0.77 * 0.75)) < 1e-12, 'two balls\' bounciness with each other: the geometric mean of their bounciness on the floor');

// 2. the balls: their data, and each contact giving back the right speed in the right time
ok(B.BALLS.tennis.m === 0.058 && B.BALLS.pingpong.m === 0.0027 && B.BALLS.golf.m === 0.0459 && B.BALLS.basketball.m === 0.62 && B.BALLS.tennis.tau === 0.005, 'masses: basketball 620 g, tennis ball 58 g, golf ball 45.9 g, ping-pong ball 2.7 g; a tennis ball\'s bounce lasts about 5 ms');
ok(Math.abs(B.BALLS.tennis.e - Math.sqrt(141 / 254)) < 0.01 && Math.abs(B.BALLS.pingpong.e - Math.sqrt(240 / 305)) < 0.01 && Math.abs(B.BALLS.basketball.e - Math.sqrt(1.06 / 1.8)) < 0.01, 'bounciness from the rules\' drop tests: tennis 254 → 141 cm, ping-pong 30.5 → 24 cm, basketball 180 → about 106 cm');
(function () { let worst = 0, worstT = 0;
  for (const id of Object.keys(B.BALLS)) for (const ideal of [true, false]) {
    const st = B.makeStack([id], 0.2, ideal), b = B.BALLS[id], u = v0(0.2), tau = ideal ? B.IDEAL_TAU : b.tau; let tin = null, tout = null;
    // the floor pushes on the ball from the moment it touches until the squashed ball lets go
    while (st.t < 2) { const on = B.forces(st, false)[0] + b.m * B.G > 0; B.step(st); const now = B.forces(st, false)[0] + b.m * B.G > 0; if (!on && now) tin = st.t; if (on && !now) { tout = st.t; break; } }
    while (st.y[0] < 0) B.step(st);
    // gravity also acts during the bounce, taking up to g tau off the speed
    worst = Math.max(worst, Math.abs(st.v[0] / u - b.e) / (b.e * 0.002 + B.G * tau / u));
    worstT = Math.max(worstT, Math.abs((tout - tin) / tau - 1)); }
  ok(worst < 1, 'every ball, in both models, bounces off the floor with e times its speed (less what gravity takes during the bounce)');
  ok(worstT < 0.06, 'and the floor pushes on it for its set time: 5 ms for a tennis ball, 0.05 ms for every ball in the ideal model (within ' + (100 * worstT).toFixed(1) + '%)'); })();
(function () { const c = { k: 100, e: 0.5 }; ok(B.contactForce(c, 0.2, 0.1) === 20 && B.contactForce(c, 0.1, 0.2) === Math.max(0, 400 * (0.1 - 0.2 * 0.75)) && B.contactForce(c, 0.16, 0.2) > 0 && B.contactForce(c, -0.01, 0.2) === 0, 'a contact pushes like a spring k while squashed, then springs back along the steeper k/e², letting go early');
  // the energy it gives back, whatever the mass pressing on it: a light and a heavy mass, same contact
  const back = m => { let x = 0, v = -1, smax = 0; const dt = 1e-5; for (let i = 0; i < 1e6; i++) { const f = B.contactForce({ k: 1000, e: 0.6 }, -x, smax); v += f / m * dt; x += v * dt; smax = -x > 0 ? Math.max(smax, -x) : 0; if (x > 0 && v > 0) return v; } };
  ok(Math.abs(back(0.01) - 0.6) < 0.003 && Math.abs(back(10) - 0.6) < 0.003, 'it gives back e of the speed for a light mass and a heavy one alike'); })();

// 3. the ideal stack: one collision at a time, as in the textbook
(function () { let worst = 0; const pairs = [['basketball', 'tennis'], ['basketball', 'golf'], ['basketball', 'pingpong'], ['soccer', 'tennis'], ['tennis', 'pingpong']];
  pairs.forEach(ids => { const r = B.drop(ids, 1, true), s = B.idealSequence(ids, 1); for (let i = 0; i < 2; i++) worst = Math.max(worst, Math.abs(r.speedAfter[i] - s[i]) / v0(1)); });
  ok(worst < 0.015, 'the ideal model, for five pairs, leaves both balls with the speeds of the one-at-a-time sequence (within ' + (100 * worst).toFixed(1) + '% of the falling speed)'); })();
(function () { const s = B.idealSequence(['basketball', 'tennis'], 1), r = B.drop(['basketball', 'tennis'], 1, true), rise = s[1] * s[1] / (2 * B.G);
  ok(Math.abs(r.top[1] - (r.frames.find(f => f.v[1] > 0) || r.frames[0]).y[1] - rise) < 0.03 * rise || Math.abs((r.top[1] - B.BALLS.basketball.d) - rise) < 0.05 * rise, 'the tennis ball then climbs v²/2g: ' + rise.toFixed(2) + ' m after falling 1 m'); })();
// the tower's limit: perfectly bouncy balls, each a thousand times lighter than the one below
(function () { const ids = []; for (let i = 0; i < 4; i++) { const id = 't' + i; B.BALLS[id] = { name: id, m: Math.pow(1e-3, i), d: 0.05, e: 1, tau: 0.001 }; ids.push(id); }
  let ok3 = true; [2, 3, 4].forEach(N => { const s = B.idealSequence(ids.slice(0, N), 1), r = B.drop(ids.slice(0, N), 1, true); if (!near(s[N - 1] / v0(1), B.towerLimit(N), 0.01) || !near(r.speedAfter[N - 1] / v0(1), B.towerLimit(N), 0.02)) ok3 = false; });
  ok(ok3, 'perfectly bouncy, each ball far lighter than the one below: the top leaves at 3, 7, 15 times the falling speed, (2ᴺ − 1)'); })();
ok(B.towerLimit(2) === 3 && B.towerLimit(5) === 31, '2 balls: 3 times; 5 balls: 31 times');

// 4. energy: with perfectly bouncy springs, the stack loses nothing
(function () { B.BALLS.e1 = { name: 'e1', m: 0.6, d: 0.24, e: 1, tau: 0.01 }; B.BALLS.e2 = { name: 'e2', m: 0.06, d: 0.07, e: 1, tau: 0.005 };
  const en = st => st.balls.reduce((s, b, i) => s + b.m * (B.G * st.y[i] + st.v[i] * st.v[i] / 2), 0);
  [true, false].forEach(ideal => { const st = B.makeStack(['e1', 'e2'], 1, ideal), E0 = en(st); while (st.t < 0.6) B.step(st);
    ok(!B.touching(st) && near(en(st), E0, 2e-3), (ideal ? 'ideal' : 'springy') + ' model, perfectly bouncy balls: energy kept through the bounce'); }); })();

// 5. springy against ideal: real contacts overlap in time and pass on less; when they can't overlap, the two agree
(function () { const id = B.drop(['basketball', 'tennis'], 1, true), sp = B.drop(['basketball', 'tennis'], 1, false);
  ok(sp.speedAfter[1] < 0.9 * id.speedAfter[1] && sp.speedAfter[1] > v0(1), 'basketball and tennis ball: springy contacts send the tennis ball up slower (' + sp.speedAfter[1].toFixed(2) + ' m/s against ' + id.speedAfter[1].toFixed(2) + '), but still faster than it fell');
  // a bottom ball whose floor bounce is very short, and a gap: the contacts come one after the other again
  B.BALLS.q1 = { name: 'q1', m: 0.6, d: 0.24, e: 0.8, tau: 2e-5 }; B.BALLS.q2 = { name: 'q2', m: 0.06, d: 0.07, e: 0.8, tau: 0.005 };
  const q = B.drop(['q1', 'q2'], 1, false), s = B.idealSequence(['q1', 'q2'], 1);
  ok(Math.abs(q.speedAfter[1] - s[1]) < 0.05 * Math.abs(s[1]), 'with a very short floor bounce underneath, the springy stack agrees with the textbook'); })();
// upside down: the light ball underneath takes the floor's place, and the heavy one bounces no higher than alone
(function () { const r = B.drop(['tennis', 'basketball'], 1, true), alone = B.BALLS.basketball.e ** 2 * 1, s = B.idealSequence(['tennis', 'basketball'], 1);
  ok(s[1] < 0 && r.top[1] - B.BALLS.tennis.d < alone, 'upside down: after the first collisions the basketball is still heading down (' + s[1].toFixed(2) + ' m/s); in the end it rises ' + (r.top[1] - B.BALLS.tennis.d).toFixed(2) + ' m, less than the ' + alone.toFixed(2) + ' m it would bounce alone'); })();
// air resistance: the terminal speed and the height reached with drag, against stepping the motion with drag
(function () { const pp = B.BALLS.pingpong, vt = B.terminal(pp); let v = 17, y = 0; const k = B.G / (vt * vt), dt = 1e-6; while (v > 0) { v -= (B.G + k * v * v) * dt; y += v * dt; }
  ok(vt > 8 && vt < 9.5 && Math.abs(B.riseWithDrag(pp, 17) - y) < 0.01 * y, 'a ping-pong ball\'s terminal speed is ' + vt.toFixed(1) + ' m/s; launched up at 17 m/s it climbs ' + y.toFixed(1) + ' m, not the ' + (17 * 17 / 2 / B.G).toFixed(1) + ' m it would without air');
  ok(B.riseWithDrag(B.BALLS.basketball, 4) > 0.97 * 16 / (2 * B.G), 'for a basketball at a few m/s, air resistance hardly matters'); })();

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
