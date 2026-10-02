// Pulled crate: the starting threshold at every angle; the best angle and least force; the normal force and
// lift-off; motion from rest against the textbook acceleration; the energy books; jamming when pushed down
// too steeply; and the exact stepping against a brute-force integration written separately here.
const P = require('./load.js')('pulling-crate');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const run = (p, st, T, dt, fn) => { const L = P.newLedger(), n = Math.round(T / dt); let r = null; for (let i = 0; i < n && !r; i++) { if (fn) fn(p, i * dt); r = P.step(st, p, dt, L); } return { L, r }; };

// 1. the starting pull: just below it the crate stays put, just above it slides, at angles from -30 to 80 deg
{
  let right = 0, total = 0;
  [0.2, 0.5, 0.9].forEach(muS => [-30, 0, 15, 30, 45, 60, 80].forEach(ang => {
    const F0 = P.startForce(40, muS, ang);
    [0.995, 1.005].forEach(f => {
      const p = { m: 40, muS, muK: muS * 0.7, pulls: [{ F: F0 * f, ang }] }, st = { x: 3, v: 0, t: 0 };
      run(p, st, 0.5, 1 / 60); total++; if ((st.x === 3) === (f < 1)) right++;
    });
  }));
  ok(right === total, 'it starts sliding exactly at F = mu_s m g / (cos + mu_s sin), for 3 frictions and 7 angles (' + right + '/' + total + ')');
}
// 2. the best angle: tan(theta) = mu_s, where the pull needed is mu_s m g / sqrt(1 + mu_s^2)
{
  let worstA = 0, worstF = 0;
  [0.1, 0.3, 0.6, 1.0].forEach(muS => {
    let best = Infinity, at = 0; for (let a = -40; a <= 89; a += 0.001) { const F = P.startForce(25, muS, a); if (F < best) { best = F; at = a; } }
    worstA = Math.max(worstA, Math.abs(at - P.bestAngle(muS))); worstF = Math.max(worstF, Math.abs(best / P.leastForce(25, muS) - 1));
  });
  ok(worstA < 0.002 && worstF < 1e-9, 'scanning the angle, the least starting pull is at tan(theta) = mu_s and equals mu_s m g / sqrt(1 + mu_s^2)');
  ok(P.startForce(25, 0.6, 0) / P.leastForce(25, 0.6) > 1.16, 'with mu_s = 0.6, pulling flat takes ' + (100 * (P.startForce(25, 0.6, 0) / P.leastForce(25, 0.6) - 1)).toFixed(0) + '% more force than pulling at ' + P.bestAngle(0.6).toFixed(1) + ' deg');
}
// 3. the normal force, and lifting off
{
  const p = { m: 30, muS: 0.5, muK: 0.3, pulls: [{ F: 100, ang: 30 }, { F: 50, ang: -20 }] }, fo = P.forces(5, 0, p);
  const Fy = 100 * Math.sin(P.rad(30)) + 50 * Math.sin(P.rad(-20));
  ok(Math.abs(fo.N - (30 * P.G - Fy)) < 1e-9, 'two ropes: the floor pushes up with N = mg - sum F sin(theta) = ' + fo.N.toFixed(2) + ' N');
  const q = { m: 10, muS: 0.5, muK: 0.3, pulls: [{ F: 10 * P.G / Math.sin(P.rad(60)) * 1.001, ang: 60 }] };
  ok(P.forces(5, 0, q).mode === 'lifted' && run(q, { x: 5, v: 0, t: 0 }, 1, 1 / 60).r === 'lifted', 'pulled up harder than its weight, it leaves the floor (and the model says so)');
  ok(P.startForce(10, 0.5, 60) < 10 * P.G / Math.sin(P.rad(60)), 'below 90 deg it always starts sliding before it would lift off');
}
// 4. motion from rest under a steady pull: x = a t^2 / 2 with a = (F cos - mu_k (m g - F sin)) / m
{
  const p = { m: 20, muS: 0.4, muK: 0.25, pulls: [{ F: 150, ang: 25 }] }, st = { x: 1, v: 0, t: 0 };
  run(p, st, 1.5, 0.5);
  const a = (150 * Math.cos(P.rad(25)) - 0.25 * (20 * P.G - 150 * Math.sin(P.rad(25)))) / 20;
  ok(Math.abs(st.x - 1 - 0.5 * a * 1.5 * 1.5) < 1e-12, 'from rest it moves exactly a t^2 / 2 with a = (F cos - mu_k(mg - F sin))/m = ' + a.toFixed(4) + ' m/s^2');
}
// 5. the energy books, for random runs with ropes that keep changing, including hitting the bumpers
{
  let seed = 8, worst = 0, bumps = 0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const muS = rnd() * 0.9, p = { m: 10 + rnd() * 90, muS, muK: muS * rnd(), pulls: [{ F: 0, ang: 0 }, { F: 0, ang: 0 }] };
    const st = { x: P.X_MIN + rnd() * (P.X_MAX - P.X_MIN), v: (rnd() - 0.5) * 6, t: 0 }, K0 = 0.5 * p.m * st.v * st.v;
    const plan = Array.from({ length: 10 }, () => [rnd() * 400, rnd() * 360 - 180, rnd() * 400, rnd() * 360 - 180]);
    const { L, r } = run(p, st, 5, 1 / 60, (q, t) => { const s = plan[Math.floor(t * 2) % 10]; q.pulls[0].F = s[0]; q.pulls[0].ang = s[1]; q.pulls[1].F = s[2]; q.pulls[1].ang = s[3]; });
    if (r) continue;
    const dK = 0.5 * p.m * st.v * st.v - K0, big = Math.abs(L.pull) + Math.abs(dK) + L.heatF + L.heatB + 1;
    worst = Math.max(worst, Math.abs(L.pull - dK - L.heatF - L.heatB) / big); if (L.heatB > 0) bumps++;
  }
  ok(worst < 1e-12, 'random runs: work by the ropes = change in kinetic energy + heat from friction and bumpers (worst ' + worst.toExponential(1) + '), ' + bumps + ' of them hitting a bumper');
}
// 6. pushing down too steeply jams it: when tan(theta) <= -1/mu_s no force is enough
{
  const p = { m: 20, muS: 0.8, muK: 0.5, pulls: [{ F: 1e5, ang: -52 }] }, st = { x: 4, v: 0, t: 0 };   // tan(-52) = -1.28 < -1/0.8
  run(p, st, 1, 1 / 60);
  ok(st.x === 4 && P.startForce(20, 0.8, -52) === Infinity, 'with mu_s = 0.8, a 100,000 N push aimed 52 deg below the horizontal does not budge it');
}
// 7. exact stepping against a brute-force integration with a tiny time step, written separately
{
  const brute = (p, x, v, T, fn) => {
    const dt = 2e-6;
    for (let t = 0; t < T; t += dt) {
      fn(p, Math.floor(t * 60 + 1e-9) / 60);
      let Fx = 0, Fy = 0; p.pulls.forEach(q => { Fx += q.F * Math.cos(q.ang * Math.PI / 180); Fy += q.F * Math.sin(q.ang * Math.PI / 180); });
      const N = p.m * P.G - Fy;
      let a = v === 0 ? (Math.abs(Fx) <= p.muS * N ? 0 : (Fx - Math.sign(Fx) * p.muK * N) / p.m) : (Fx - Math.sign(v) * p.muK * N) / p.m;
      let v2 = v + a * dt; if (v !== 0 && Math.sign(v2) !== Math.sign(v)) v2 = 0;
      x += (v + v2) / 2 * dt; v = v2;
      if (x > P.X_MAX) { x = P.X_MAX; v = 0; } if (x < P.X_MIN) { x = P.X_MIN; v = 0; }
    }
    return x;
  };
  let worst = 0;
  [[t => [[180, 20]], 2], [t => (t < 1 ? [[300, 35], [100, -10]] : [[0, 0], [50, 160]]), 1.5], [t => [[120, 70]], 3], [t => (t < 0.5 ? [[400, 0]] : [[0, 0]]), 0.5]].forEach(([plan, x0]) => {
    const set = (p, t) => { p.pulls = plan(t).map(([F, ang]) => ({ F, ang })); };
    const p = { m: 30, muS: 0.5, muK: 0.3, pulls: [] }, st = { x: x0, v: 0, t: 0 };
    run(p, st, 3, 1 / 60, set);
    worst = Math.max(worst, Math.abs(st.x - brute({ m: 30, muS: 0.5, muK: 0.3, pulls: [] }, x0, 0, 3, set)));
  });
  ok(worst < 2e-4, 'four runs with steady, changing and backward pulls match a 2-microsecond brute-force integration to ' + (worst * 1000).toFixed(3) + ' mm');
}
ok(P.G === 9.8, 'g = 9.8 m/s^2, as the notes say');
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
