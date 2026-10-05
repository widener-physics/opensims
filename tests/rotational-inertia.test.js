// Rotational-inertia apparatus: the inertia formulas against brute-force sums over the parts; the motion against
// an independent integration with a stiff, stretchy string; energy at landing; free spin after landing; and a
// simulated lab, read off a stopwatch, recovering I from the slope of angular acceleration against torque.
const P = require('./load.js')('rotational-inertia');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

// 1. inertia of the parts, summed over many small pieces
{
  const n = 200000; let rod = 0; for (let i = 0; i < n; i++) { const x = (i + 0.5) / n * P.ARM.L; rod += (P.ARM.m / n) * x * x; }
  ok(Math.abs(4 * rod + P.I_HUB - P.frameInertia()) < 1e-12, 'four arms summed slice by slice give 4 (1/3) m L^2 = ' + (4 * rod * 1e3).toFixed(4) + ' x 10^-3 kg m^2');
  // a solid cylinder (axis vertical) of radius RC centered d from the axle: sum M r^2 over a fine grid of its cross-section
  let worst = 0;
  [0.04, 0.12, 0.23].forEach(d => {
    const M = 0.1, N = 1500; let s = 0, cnt = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = -P.RC + (i + 0.5) * 2 * P.RC / N, y = -P.RC + (j + 0.5) * 2 * P.RC / N;
      if (x * x + y * y > P.RC * P.RC) continue; cnt++; s += (d + x) ** 2 + y * y;
    }
    worst = Math.max(worst, Math.abs(4 * M * s / cnt / P.massInertia(M, d) - 1));
  });
  ok(worst < 1e-5, 'the sliding cylinders, summed over their cross-sections, match M (rc^2/2 + d^2) (the parallel-axis theorem) to ' + worst.toExponential(1));
  ok(Math.abs(P.massInertia(0.1, 0.2) / P.massInertia(0.1, 0.1) - (P.RC ** 2 / 2 + 0.04) / (P.RC ** 2 / 2 + 0.01)) < 1e-12 && P.massInertia(0.1, 0.2) > 3.9 * P.massInertia(0.1, 0.1), 'twice as far out, the masses add nearly four times the inertia');
}
// 2. the motion, against a separate integration: the string as a very stiff spring between the pulley and the mass
{
  let worstA = 0, worstT = 0;
  [[0.1, 0.05, 0.02, 0.1], [0.2, 0.22, 0.01, 0.05], [0.05, 0.12, 0.03, 0.25]].forEach(([M, d, r, m]) => {
    const R = P.run({ M, d, r, m }), I = P.inertia(M, d), k = 2e6, c = 2 * Math.sqrt(k * m) * 0.5;
    let th = 0, w = 0, y = 0, v = 0, Tsum = 0, n = 0; const dt = 2e-6, T1 = 0.5;
    for (let t = 0; t < T1; t += dt) {
      const stretch = y - th * r, sv = v - w * r, T = Math.max(0, k * stretch + c * sv);
      v += (P.G - T / m) * dt; y += v * dt; w += T * r / I * dt; th += w * dt;
      if (t > 0.2) { Tsum += T; n++; }
    }
    worstA = Math.max(worstA, Math.abs(y / (0.5 * R.a * T1 * T1) - 1)); worstT = Math.max(worstT, Math.abs(Tsum / n / R.T - 1));
  });
  ok(worstA < 2e-3, 'three setups: the fall matches a = g m r^2/(I + m r^2) against a stiff-string integration (worst ' + (worstA * 100).toFixed(3) + '%)');
  ok(worstT < 2e-3, 'and the string\'s tension is m(g - a), less than the hanging weight (worst ' + (worstT * 100).toFixed(3) + '%)');
}
// 3. energy: at landing, the weight's work m g h is the wheel's (1/2) I w^2 plus the mass's (1/2) m v^2
{
  let worst = 0;
  [[0.1, 0.05, 0.02, 0.1], [0.25, 0.23, 0.01, 0.02], [0.05, 0.04, 0.03, 0.25]].forEach(([M, d, r, m]) => {
    const R = P.run({ M, d, r, m }), E = 0.5 * R.I * R.wLand ** 2 + 0.5 * m * R.vLand ** 2;
    worst = Math.max(worst, Math.abs(E / (m * P.G * P.DROP) - 1));
  });
  ok(worst < 1e-12, 'at landing, m g h = (1/2) I w^2 + (1/2) m v^2 (worst ' + worst.toExponential(1) + ')');
  const R = P.run({ M: 0.1, d: 0.15, r: 0.02, m: 0.1 }), s1 = P.at(R, R.tLand * 1.2), s2 = P.at(R, R.tLand * 2), s0 = P.at(R, R.tLand);
  ok(s1.omega === R.wLand && s2.omega === R.wLand && Math.abs((s2.theta - s1.theta) - R.wLand * R.tLand * 0.8) < 1e-12 && Math.abs(s0.theta - 0.5 * R.alpha * R.tLand ** 2) < 1e-12, 'after the mass lands the wheel spins on at constant speed, its angle carrying on smoothly');
}
// 4. the race: same masses, tucked in versus spread out
{
  const base = { M: 0.1, r: 0.02, m: 0.1 }, A = P.run(Object.assign({ d: 0.05 }, base)), B = P.run(Object.assign({ d: 0.22 }, base));
  const ratio = Math.sqrt((B.I + 0.1 * 0.0004) / (A.I + 0.1 * 0.0004));
  ok(A.tLand < B.tLand && Math.abs(B.tLand / A.tLand - ratio) < 1e-12, 'tucked in (5 cm) lands in ' + A.tLand.toFixed(2) + ' s, spread out (22 cm) in ' + B.tLand.toFixed(2) + ' s: the ratio is sqrt((I_B + m r^2)/(I_A + m r^2))');
}
// 5. a simulated lab: time the fall with a stopwatch (0.01 s), for each pulley and several hanging masses, work out
//    alpha and the torque T r, and fit a line through the origin: its slope is 1/I
{
  let worst = 0, worstNaive = 0;
  [0.05, 0.14, 0.23].forEach(d => {
    const pts = [], naive = [];
    P.PULLEYS.forEach(r => [0.05, 0.1, 0.15, 0.2].forEach(m => {
      const t = Math.round(P.run({ M: 0.1, d, r, m }).tLand * 100) / 100, q = P.fromFallTime(t, r, m);
      pts.push([q.tau, q.alpha]); naive.push([q.tauNaive, q.alpha]);
    }));
    const I = P.inertia(0.1, d);
    worst = Math.max(worst, Math.abs(1 / P.slopeThroughOrigin(pts) / I - 1)); worstNaive = Math.max(worstNaive, Math.abs(1 / P.slopeThroughOrigin(naive) / I - 1));
  });
  ok(worst < 0.01, 'three mass positions, 12 runs each timed to 0.01 s: the slope of alpha against T r gives I to within ' + (worst * 100).toFixed(2) + '%');
  ok(worstNaive > worst, 'using m g r for the torque instead (ignoring that the tension is less than the weight) is off by up to ' + (worstNaive * 100).toFixed(1) + '%');
}
ok(P.G === 9.8, 'g = 9.8 m/s^2, as the notes say');
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
