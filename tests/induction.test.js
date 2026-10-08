// Electromagnetic induction: the magnet's flux through a turn against a brute-force Biot-Savart calculation and the
// far-field dipole formula; the emf as the rate of change of flux (its area is the flux), proportional to speed and
// turns; power balance and Lenz's law for the coil; the direction of the current in a loop, case by case, and each
// step of the reasoning shown on screen, against the computed current and force; a drop through the loop; and the
// sliding rod's exact solution against a step-by-step integration, with its energy books.
const P = require('./load.js')('induction');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const M = P.MAGNET, T = P.fluxTable(M, P.COIL.a);

// 1. flux through one turn
{
  // brute force: the magnet as 150 current loops (Br/mu0 per meter), Biot-Savart summed over 360 segments each,
  // and B_z integrated over the turn's disk by 24-point Gauss-Legendre in r
  function Bz(r, z) {
    let s = 0; const nl = 150, ns = 360, Iloop = M.Br / P.MU0 * M.L / nl;
    for (let l = 0; l < nl; l++) {
      const zl = -M.L / 2 + (l + 0.5) * M.L / nl;
      for (let k = 0; k < ns; k++) {
        const ph = (k + 0.5) * 2 * Math.PI / ns, dph = 2 * Math.PI / ns;
        const sx = M.b * Math.cos(ph), sy = M.b * Math.sin(ph), dlx = -M.b * Math.sin(ph) * dph, dly = M.b * Math.cos(ph) * dph;
        const rx = r - sx, ry = -sy, rz = z - zl, d3 = Math.pow(rx * rx + ry * ry + rz * rz, 1.5);
        s += Iloop * (dlx * ry - dly * rx) / d3;
      }
    }
    return P.MU0 / (4 * Math.PI) * s;
  }
  // 24-point Gauss-Legendre by Golub-Welsch would be long; use composite 4-point rules on 12 panels instead
  const g4x = [-0.8611363116, -0.3399810436, 0.3399810436, 0.8611363116], g4w = [0.3478548451, 0.6521451549, 0.6521451549, 0.3478548451];
  function fluxBS(a, z) {
    let s = 0; const np = 8, edges = [0, M.b * 0.999, M.b * 1.001, a];   // panels split at the magnet's edge, where B_z jumps
    for (let e = 0; e < 3; e++) { const r0 = edges[e], r1 = edges[e + 1], h = (r1 - r0) / np;
      for (let p = 0; p < np; p++) for (let q = 0; q < 4; q++) { const r = r0 + h * (p + 0.5 + 0.5 * g4x[q]); s += h / 2 * g4w[q] * Bz(r, z) * 2 * Math.PI * r; } }
    return s;
  }
  let worst = 0; [0.03, 0.0148, 0.05].forEach(z => { worst = Math.max(worst, Math.abs(fluxBS(P.COIL.a, z) / P.phi1(T, z) - 1)); });
  ok(worst < 2e-3, 'flux through a 2 cm turn, 3, 1.5 and 5 cm from the magnet\'s center: matches a brute-force Biot-Savart sum to ' + (worst * 100).toFixed(2) + '%');
  const far = s => P.MU0 * M.moment * P.COIL.a ** 2 / (2 * (P.COIL.a ** 2 + s * s) ** 1.5);
  const Tf = P.fluxTable(M, P.COIL.a, 1.2, 24000), e3 = P.phi1(Tf, 0.3) / far(0.3) - 1, e10 = P.phi1(Tf, 1) / far(1) - 1;
  ok(Math.abs(e10) < 3e-4 && Math.abs(e3 / e10 / (1 / 0.3) ** 2 - 1) < 0.02, 'far away it approaches the point-dipole formula mu0 m a^2 / 2(a^2 + s^2)^(3/2), the difference shrinking as 1/s^2 (' + (e10 * 100).toFixed(3) + '% at 1 m)');
  let dw = 0; for (let s = -0.1; s <= 0.1; s += 0.0037) { const h = 1e-5, num = (P.phi1(T, s + h) - P.phi1(T, s - h)) / (2 * h); dw = Math.max(dw, Math.abs(num - P.dphi1(T, s))); }
  ok(dw < 1e-4 * Math.abs(P.dphi1(T, 0.0148)), 'the exact slope of the flux matches the slope of the tabulated flux everywhere');
}
// 2. the emf
{
  const N = 200, v = 0.8; let area1 = 0, total = 0, peak = 0; const dt = 1e-6;
  for (let t = 0; t < 0.3 / v; t += dt) { const x = -0.15 + v * t, e = P.coilState(T, N, Infinity, x, v, 1).emf; total += e * dt; if (x < 0) area1 += e * dt; peak = Math.max(peak, Math.abs(e)); }
  const Phi0 = N * (P.coilFlux(T, 0) - P.coilFlux(T, -0.15));
  ok(Math.abs(-area1 / Phi0 - 1) < 1e-4 && Math.abs(total) < 1e-4 * Phi0, 'the area under the emf as the magnet comes in is N times the change in flux per turn (' + (Phi0 * 1e3).toFixed(2) + ' mWb); over the whole pass it is zero');
  const pk = (N, v) => { let m = 0; for (let x = -0.05; x < 0.05; x += 1e-4) m = Math.max(m, Math.abs(P.coilState(T, N, 50, x, v, 1).emf)); return m; };
  ok(Math.abs(pk(200, 1.6) / pk(200, 0.4) - 4) < 1e-12 && Math.abs(pk(400, 0.7) / pk(100, 0.7) - 4) < 1e-12, 'the peak emf is proportional to the speed and to the number of turns');
  // power balance and Lenz
  let bal = 0, opp = true;
  [[1, 0.5], [-1, 0.5], [1, -1.2], [-1, -0.3]].forEach(([sg, vv]) => [-0.03, -0.01, 0.004, 0.02].forEach(x => {
    const c = P.coilState(T, 200, 10, x, vv, sg); bal = Math.max(bal, Math.abs(c.force * vv + c.emf * c.I)); if (c.force * vv > 0) opp = false;
  }));
  ok(bal < 1e-15 && opp, 'the coil always pushes against the magnet\'s motion, and the work against it is exactly the electrical energy, emf times current');
  const app = P.coilState(T, 200, 10, -0.02, 0.5, 1);
  ok(app.I < 0, 'Lenz: as a north end approaches, the induced current makes the coil a magnet with its north end facing it');
  ok(Math.abs(P.coilResistance(200) - 200 * 2 * Math.PI * 0.02 * 0.213) < 1e-12, 'the coil\'s resistance is its 25 m of 28-gauge copper wire (0.213 ohm per meter)');
}
// 3. Lenz's law with a single loop: the direction of the current, step by step
{
  const TL = P.fluxTable(M, P.LOOP.a);
  // the convention, checked from scratch with Biot-Savart: current running counterclockwise as seen from above
  // (looking down, x to the right and z toward the bottom of the view, so the path goes x -> -z -> -x -> +z) makes
  // a field pointing up through the loop's center
  { let By = 0; const n = 720, a = P.LOOP.a;
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n * 2 * Math.PI, dt = 2 * Math.PI / n;
      const px = a * Math.cos(t), pz = -a * Math.sin(t), dlx = -a * Math.sin(t) * dt, dlz = -a * Math.cos(t) * dt, rx = -px, rz = -pz;
      By += (dlz * rx - dlx * rz) / Math.pow(a, 3); }
    By *= P.MU0 / (4 * Math.PI);
    ok(By > 0 && Math.abs(By / (P.MU0 / (2 * a)) - 1) < 1e-6, 'counterclockwise current, seen from above, makes a field pointing up through the loop (mu0 I / 2a): the loop\'s north side is on top'); }
  // every combination: magnet or loop moving, either end down, above or below, toward or away
  let agree = 0, cases = 0, opposeFlux = 0, opposeMotion = 0, growClose = 0, rel = 0;
  for (const sign of [1, -1]) for (const ym of [0.06, 0.015, -0.01, -0.07]) for (const yl of [0, 0.03]) for (const [vm, vl] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [0.3, -0.4]]) {
    const st = P.loopState(TL, ym, yl, vm, vl, sign), ch = P.lenzChain(st, ym, yl, vm, vl); cases++;
    // the chain's words against the physics: current direction from the computed current, the loop's field against
    // the change in flux, the push or pull against the computed force on the magnet
    if (ch && (ch.current === 'counterclockwise') === (st.I > 0) && (ch.north === 'top') === (st.I > 0)) agree++;
    if (ch && (ch.induced === 'up' ? 1 : -1) * st.rate < 0) opposeFlux++;
    const repels = st.force * (ym - yl) > 0;
    if (ch && (ch.interaction === 'repel') === repels && st.force * (vm - vl) < 0) opposeMotion++;
    if (ch && (ch.change === 'growing') === (Math.abs(P.phi1(TL, ym - yl + 1e-6 * (vm - vl))) > Math.abs(P.phi1(TL, ym - yl))) && (ch.change === 'growing') === (ch.interaction === 'repel')) growClose++;
    const same = P.loopState(TL, ym, yl, vm - vl, 0, sign); rel = Math.max(rel, Math.abs(same.I - st.I));
  }
  ok(agree === cases, 'in all ' + cases + ' cases the stated direction (counterclockwise or clockwise, north side up or down) matches the computed current');
  ok(opposeFlux === cases, 'in every case the loop\'s own field opposes the change in flux, not the flux itself');
  ok(opposeMotion === cases, 'in every case loop and magnet repel when getting closer and attract when moving apart, so the force opposes the relative motion');
  ok(growClose === cases, 'and the flux grows exactly when magnet and loop are getting closer, as the screen says');
  ok(rel < 1e-15, 'moving the loop toward the magnet gives exactly the same current as moving the magnet toward the loop');
  // the classic case: north end down, coming down toward the loop from above
  const c1 = P.lenzChain(P.loopState(TL, 0.04, 0, -0.5, 0, -1), 0.04, 0, -0.5, 0);
  ok(c1.flux === 'down' && c1.change === 'growing' && c1.induced === 'up' && c1.current === 'counterclockwise' && c1.interaction === 'repel', 'north end down, approaching from above: flux down and growing, so the loop\'s field is up and the current counterclockwise from above');
  ok(P.lenzChain(P.loopState(TL, 0.04, 0, 0, 0, -1), 0.04, 0, 0, 0) === null, 'a magnet sitting still, even right next to the loop, induces nothing');
  // a drop through the loop: the current reverses once as the magnet passes, and the fall is almost free
  const C = P.loopTable(TL), d = P.drop(C, 0.08, { sign: -1, yEnd: -0.09 }), free = Math.sqrt(2 * 0.17 / P.G);
  const big = d.I.map(i => Math.abs(i) > 1e-4 ? Math.sign(i) : 0).filter(x => x !== 0); let flips = 0; for (let i = 1; i < big.length; i++) if (big[i] !== big[i - 1]) flips++;
  ok(big[0] > 0 && flips === 1, 'dropped north end down: counterclockwise from above while it approaches, then clockwise once it has passed through');
  const d2 = P.drop(C, 0.08, { sign: 1, yEnd: -0.09 }), big2 = d2.I.filter(i => Math.abs(i) > 1e-4);
  ok(big2[0] < 0, 'south end down: the other way round');
  ok(Math.abs(d.tEnd / free - 1) < 3e-4, 'a single loop barely slows the magnet: ' + (1000 * d.tEnd).toFixed(1) + ' ms against ' + (1000 * free).toFixed(1) + ' ms in free fall');
  const E = 0.5 * M.mass * d.vEnd ** 2 + d.heatEnd;
  ok(Math.abs(E / (M.mass * P.G * (0.08 - d.y[d.y.length - 1])) - 1) < 1e-9, 'and the energy books balance: weight\'s work = kinetic energy + heat in the loop');
  let wt = 0; for (let y = -0.08; y < 0.08; y += 0.0031) wt = Math.max(wt, Math.abs(P.tableAt(C, C.c, y) + P.dphi1(TL, y) / P.LOOP.R));
  ok(wt < 1e-3 * Math.abs(P.dphi1(TL, 0.022)) / P.LOOP.R, 'the table used during a drop matches the direct calculation');
}
// 4. the sliding rod
{
  const base = { m: 0.04, B: 1, l: 0.2, R: 0.5 };
  let worst = 0, wE = 0;
  [{ F: 0.08, v0: 0 }, { F: 0, v0: 1.5 }, { F: 0.15, v0: 0.4 }].forEach(q => {
    const p = Object.assign({}, base, q), k = p.B * p.B * p.l * p.l / p.R;
    let v = p.v0, x = 0, heat = 0; const dt = 1e-4, T1 = 2;
    for (let t = 0; t < T1 - 1e-12; t += dt) {
      const f = vv => (p.F - k * vv) / p.m, a1 = f(v), a2 = f(v + dt / 2 * a1), a3 = f(v + dt / 2 * a2), a4 = f(v + dt * a3);
      const I1 = p.B * p.l * v / p.R; x += dt / 6 * (v + 2 * (v + dt / 2 * a1) + 2 * (v + dt / 2 * a2) + v + dt * a3);
      const vn = v + dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4), I2 = p.B * p.l * vn / p.R, Im = p.B * p.l * (v + vn) / 2 / p.R;
      heat += dt / 6 * (I1 * I1 + 4 * Im * Im + I2 * I2) * p.R; v = vn;
    }
    const r = P.rod(p, T1); worst = Math.max(worst, Math.abs(r.v - v), Math.abs(r.x - x)); wE = Math.max(wE, Math.abs(r.heat - heat));
  });
  ok(worst < 1e-9, 'pulled from rest, kicked, and both: the exact solution matches a step-by-step integration');
  ok(wE < 1e-6, 'and the heat, the integral of I^2 R, matches: work done + starting kinetic energy = kinetic energy + heat');
  const r = P.rod(Object.assign({ F: 0.08, v0: 0 }, base), 30);
  ok(Math.abs(r.v - 0.08 * 0.5 / 0.04) < 1e-9, 'a steady pull F reaches the terminal speed F R / (B l)^2 = ' + r.vT.toFixed(2) + ' m/s');
  const kick = P.rod(Object.assign({ F: 0, v0: 1.5 }, base), 60);
  ok(Math.abs(kick.x - 1.5 * kick.tau) < 1e-9, 'kicked to v0 and let go, it coasts v0 m R / (B l)^2 = ' + kick.x.toFixed(2) + ' m and stops');
  const op = P.rod(Object.assign({ F: 0.08, v0: 0 }, base, { R: Infinity }), 1);
  ok(Math.abs(op.v - 2) < 1e-12 && op.I === 0, 'with the circuit open there is no current and no braking: F = m a');
  const t0 = 0.37, dh = 1e-6, a = P.rod(Object.assign({ F: 0.08, v0: 0 }, base), t0 - dh), b = P.rod(Object.assign({ F: 0.08, v0: 0 }, base), t0 + dh), c = P.rod(Object.assign({ F: 0.08, v0: 0 }, base), t0);
  ok(Math.abs(base.B * base.l * (b.x - a.x) / (2 * dh) - c.emf) < 1e-8, 'emf = B l v is the rate of change of the flux B l x through the circuit');
}
// 5. the field-line picture
{
  const g = P.psiGrid(M, 0.1, 0.12, 50, 60), j0 = 30;
  let wg = 0; [10, 23].forEach(ia => { const Tr = P.fluxTable(M, g.rMax * ia / g.nr); [j0 + 15, j0 - 7, j0 + 2].forEach(j => { wg = Math.max(wg, Math.abs(g.v[ia][j] / P.phi1(Tr, -g.zMax + 2 * g.zMax * j / g.nz) - 1)); }); });
  ok(wg < 1e-3, 'the field-line picture, at the radii and distances its grid says, uses the same flux as the coil');
  const peak = Math.max(...g.v.map(row => row[j0])), eq = P.MU0 * M.moment / (2 * 0.1);
  ok(Math.abs(g.v[50][j0] / eq - 1) < 0.02 && g.v[50][j0] / peak < 0.15, 'the flux returning outside 10 cm of the magnet, ' + (100 * g.v[50][j0] / peak).toFixed(0) + '% of it, matches a point dipole\'s mu0 m / 2r');
}
ok(P.G === 9.8, 'g = 9.8 m/s^2');
if (fails) { console.log(fails + ' FAILED'); process.exitCode = 1; } else console.log('all passed');
