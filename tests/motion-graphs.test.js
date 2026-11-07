// Motion graphs: the walker that follows your finger never goes faster than its top speed or changes speed faster
// than its limit, settles on a target without overshooting, and its recorded velocity and acceleration are the true
// rates of change of its position (checked by differencing); motion from a velocity graph against the formulas for
// constant acceleration, the area under the graph, and a separate step-by-step integration, with the walls; and the
// position graphs to match against their own limits, with the scoring against cases worked by hand.
const M = require('./load.js')('motion-graphs');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const dt = 1 / M.SAMPLE, W = M.WALKER;

// 1. the walker
function walk(x0, xp, secs) { let s = { x: x0, v: 0 }; const out = [s]; for (let i = 0; i < secs * M.SAMPLE; i++) { s = M.follow(s, typeof xp === 'function' ? xp(i * dt) : xp, dt); out.push(s); } return out; }
let vmax = 0, amax = 0, over = 0, settle = 0;
for (const [a, b] of [[-8, 8], [5, -9.9], [-10, 10], [0, 2], [0, 6], [3, 2.9], [-2, -9]]) {
  const r = walk(a, b, 15); r.forEach(s => { vmax = Math.max(vmax, Math.abs(s.v)); amax = Math.max(amax, Math.abs(s.a || 0)); over = Math.max(over, (s.x - b) * Math.sign(b - a)); });
  settle = Math.max(settle, Math.abs(r[r.length - 1].x - b));
}
ok(W.VMAX === 4 && W.AMAX === 5, 'the limits the notes describe: a top speed of 4 m/s (a jog) and 5 m/s² for speeding up or slowing down');
ok(vmax <= W.VMAX + 1e-9 && near(vmax, W.VMAX, 0.01), 'top speed ' + vmax.toFixed(3) + ' m/s, reached and never passed');
ok(amax <= W.AMAX + 1e-9, 'it never speeds up or slows down faster than ' + W.AMAX + ' m/s² (largest ' + amax.toFixed(3) + ')');
ok(over <= 1e-9 && settle < 1e-6, 'sent to a new place, it gets there and stops without overshooting, for seven moves short and long');
ok(4 * W.K * W.TAU <= 1, 'close to the target it is a damped spring with 4 K τ = ' + (4 * W.K * W.TAU).toFixed(2) + ' ≤ 1: no overshoot (critical damping at 1)');
const lag = walk(0, t => -5 + t, 10), last = lag[lag.length - 1];
ok(near(last.v, 1, 0.002) && near((-5 + 10) - last.x, 1 / W.K + W.SMOOTH, 0.01), 'following a finger moving steadily at 1 m/s, it keeps pace ' + ((-5 + 10) - last.x).toFixed(3) + ' m behind: heading for where the finger was ' + W.SMOOTH + ' s ago, at speed = K × distance (1/K + ' + W.SMOOTH + ' = ' + (1 / W.K + W.SMOOTH).toFixed(3) + ' m)');
// its velocity and acceleration are the rates of change of its position: what the graphs should show
const jig = walk(0, t => 6 * Math.sin(1.3 * t) + 2 * Math.sin(3.1 * t), 12);
let dv = 0, da = 0; for (let i = 1; i < jig.length; i++) { dv = Math.max(dv, Math.abs((jig[i].x - jig[i - 1].x) / dt - jig[i].v)); da = Math.max(da, Math.abs((jig[i].v - jig[i - 1].v) / dt - jig[i].a)); }
ok(dv < 0.04 && da < 1e-9, 'on a wild walk, the acceleration it reports is the change in velocity each sixtieth of a second (to ' + da.toExponential(1) + '), and the velocity the change in position to ' + dv.toFixed(3) + ' m/s (it moves in 8 smaller steps in between)');
const fine = walk(0, t => 6 * Math.sin(1.3 * t), 12); let area = 0; for (let i = 1; i < fine.length; i++) area += (fine[i - 1].v + fine[i].v) / 2 * dt;
ok(near(area, fine[fine.length - 1].x, 0.01), 'the area under its velocity graph is how far it went: ' + area.toFixed(3) + ' m against ' + fine[fine.length - 1].x.toFixed(3) + ' m');
const wall = walk(9, 30, 4);
ok(wall.every(s => Math.abs(s.x) <= M.WALL) && near(wall[wall.length - 1].x, M.WALL, 1e-6) && Math.abs(wall[wall.length - 1].v) < 1e-4, 'a finger past the wall takes it only as far as the wall');

// 2. motion from a velocity graph
const kn = M.PRESETS.turn.v, p = M.planRun(kn, 0);
let ex = 0; for (let i = 0; i <= M.N; i++) { const t = i * dt, j = Math.min(4, Math.floor(t / 4)), t0 = 4 * j, s = (kn[j + 1] - kn[j]) / 4;
  let x = 0; for (let q = 0; q < j; q++) x += (kn[q] + kn[q + 1]) / 2 * 4;          // the trapezoids before, then x = v0 t + ½ a t² in this one
  const u = t - t0; x += kn[j] * u + 0.5 * s * u * u; ex = Math.max(ex, Math.abs(p.x[i] - x), Math.abs(p.v[i] - (kn[j] + s * u)), i % (4 * M.SAMPLE) ? Math.abs(p.a[i] - s) : 0); }   // at a knot the acceleration jumps: either side will do
ok(ex < 1e-12 && p.hit === null, 'turning back: position from x = v₀t + ½at² in each 4-second stretch, velocity and acceleration, all to ' + ex.toExponential(1));
const KN = [0.3, 1.2, -0.6, 1.5, -1.4, 0.9], h = 1e-4;
// a separate integration: add up v dt in tiny steps with the midpoint rule
let X = -2; for (let i = 0; i < 20 / h; i++) X += M.planAt(KN, 0, (i + 0.5) * h).v * h;
const q = M.planRun(KN, -2);
ok(near(X, q.x[M.N], 1e-6) && q.hit === null, 'an uneven velocity graph: adding up v dt in steps of 0.1 ms ends where the exact walk does (' + X.toFixed(4) + ' m)');
const disp = M.KNOT_T.slice(1).reduce((s, t, j) => s + (KN[j] + KN[j + 1]) / 2 * (t - M.KNOT_T[j]), 0);
ok(near(q.x[M.N] - (-2), disp, 1e-12), 'how far it went is the area under the velocity graph: ' + disp.toFixed(2) + ' m');
const fast = M.planRun([3, 3, 3, 3, 3, 3], -8);
ok(near(fast.hit, 6, 1e-9) && fast.x.every(x => Math.abs(x) <= M.WALL) && fast.v[M.N] === 0 && near(fast.x[M.N], 10, 1e-12), 'at 3 m/s from −8 m it reaches the wall at 6 s, and stays there');
const odd = M.planRun([2.9, 2.9, 2.9, 2.9, 2.9, 2.9], -8), at = Math.ceil(odd.hit * M.SAMPLE);
ok(near(odd.hit, 18 / 2.9, 1e-9) && odd.x.length === M.N + 1 && odd.x.slice(at).every(x => x === 10) && odd.v.slice(at).every(v => v === 0) && odd.a.slice(at).every(a => a === 0) && odd.x[at - 1] < 10,
   'at 2.9 m/s from −8 m it bumps into the tree at 18/2.9 = ' + odd.hit.toFixed(4) + ' s, between samples, and from then on stays put: at 10 m, not moving, not accelerating');
const back = M.planRun([-1, -2, -2, -2, -2, -2], 0);
let tb = 0; for (let lo = 0, hi = 20, k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (M.planAt([-1, -2, -2, -2, -2, -2], 0, m).x <= -10) hi = m; else lo = m; tb = hi; }
ok(near(back.hit, tb, 1e-9) && near(back.hit, 6, 1e-9), 'backing into the house at the other end: there at ' + back.hit.toFixed(3) + ' s (worked by hand: 6 m in the first 4 s, then 4 m at 2 m/s takes 2 s more)');
ok(Object.values(M.PRESETS).every(pr => pr.v.length === 6 && pr.v.every(v => Math.abs(v) <= M.VLIM) && M.planRun(pr.v, pr.x0).hit === null), 'the starting graphs stay on the sidewalk for the whole 20 s');

// 3. graphs to match
let tv = 0, tx = 0; M.TARGETS.forEach(f => { for (let i = 0; i <= M.N; i++) { const t = i * dt; tx = Math.max(tx, Math.abs(f(t))); if (i) tv = Math.max(tv, Math.abs(f(t) - f(t - dt)) / dt); } });
ok(tx <= 9.5 && tv <= 2 + 1e-9, 'every target stays on the sidewalk (within ' + tx.toFixed(1) + ' m) at walking speeds (up to ' + tv.toFixed(2) + ' m/s)');
const reach = M.TARGETS.map(f => { const r = walk(f(0), f, 20); return Math.sqrt(r.reduce((s, st, i) => s + (st.x - f(i * dt)) ** 2, 0) / r.length); });
ok(reach.every(m => m < 0.7), 'a walker whose finger traces each target exactly misses by ' + reach.map(m => m.toFixed(2)).join(', ') + ' m on average: every target can be matched well');
const xs = Float64Array.from({ length: M.N + 1 }, (_, i) => M.TARGETS[0](i * dt));
ok(M.miss(xs, M.TARGETS[0]) < 1e-12 && near(M.miss(xs.map(x => x + 0.5), M.TARGETS[0]), 0.5, 1e-12) && near(M.miss(xs.map((x, i) => x + (i % 2 ? 1 : -1)), M.TARGETS[0]), 1, 1e-12),
   'the score: 0 for a perfect walk, 0.5 m for one half a meter off all the way, 1 m for one swinging a meter either side');
ok(near(M.miss(xs.map((x, i) => i === M.N ? x + 1 : x), M.TARGETS[0]), Math.sqrt(1 / (M.N + 1)), 1e-12), 'every sample counts, the last one too');
ok(near(M.miss(xs.map((x, i) => i <= 600 ? x : x + 3), M.TARGETS[0], 600), 0, 1e-12), 'scored part way, it counts only the walk so far');
process.exit(fails ? 1 : 0);
