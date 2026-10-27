// Pressure in fluids: rho g d against published figures (10 m of water is about one atmosphere); the vessels'
// volumes against the formulas for cylinders and cones; the force balance on the liquid in every vessel (bottom
// plus walls equals its weight), with the walls' push found by adding up pressure over them; air pressure against
// the published standard atmosphere; the barometer's 760 mm and the 10.3 m limit for water; and the buoyant force,
// found by adding up the pressure on a cube's faces, against Archimedes' principle, and where a cube floats.
const F = require('./load.js')('fluid-pressure');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);
const L = id => F.LIQUIDS.find(l => l.id === id), M = id => F.MATERIALS.find(m => m.id === id);

// 1. pressure at depth
ok(F.G === 9.80665 && F.P_ATM === 101325, 'standard gravity 9.80665 m/s², standard air pressure 101 325 Pa');
ok(near(F.pressure(1000, 10), 98066.5, 1e-12) && F.pressure(1000, -1) === 0 && F.pressure(1000, 0) === 0, 'pressure rises by ρgd below the surface: 10 m of water adds 98 kPa, nearly an atmosphere; none above it');
ok(near(F.pressure(L('sea').rho, 10), 1.005e5, 0.01), 'seawater: 1 atmosphere for every 10 m of depth, as divers learn');
// published densities at 20 C
ok(L('water').rho === 998.2 && L('ethanol').rho === 789.3 && L('mercury').rho === 13546 && L('glycerin').rho === 1261 && L('sea').rho === 1025, 'densities at 20 °C: water 998.2, alcohol (ethanol) 789.3, glycerin 1261, mercury 13 546 kg/m³; seawater 1025');
ok(M('ice').rho === 917 && M('steel').rho === 7850 && M('gold').rho === 19300 && M('aluminum').rho === 2700, 'solids: ice 917, aluminum 2700, steel 7850, gold 19 300 kg/m³');

// 2. the vessels
(function () { const h = 0.3, rho = 998.2, [st, wi, na, ne] = F.VESSELS.map(v => F.vesselForces(v, h, rho)), R0 = F.R0;
  ok(near(st.volume, Math.PI * R0 * R0 * h, 1e-9), 'straight vessel: volume πR²h');
  const cone = (r1, r2) => Math.PI * h / 3 * (r1 * r1 + r1 * r2 + r2 * r2);
  ok(near(wi.volume, cone(R0, R0 + 0.3 * h), 1e-6) && near(na.volume, cone(R0, R0 * (1 - 0.75 * h / F.HMAX)), 1e-6), 'widening and narrowing vessels: volumes of truncated cones, πh(r₁² + r₁r₂ + r₂²)/3');
  ok(near(ne.volume, Math.PI * (R0 * R0 * 0.12 + 0.012 * 0.012 * (h - 0.12)), 1e-3), 'thin neck: a short wide cylinder and a long thin one');
  ok([st, wi, na, ne].every(f => near(f.bottomForce, st.bottomForce, 1e-12)), 'same depth, same base: the same push on every bottom (' + st.bottomForce.toFixed(1) + ' N)');
  ok([st, wi, na, ne].every(f => Math.abs(f.bottomForce + f.wallsUp - f.weight) < 0.002 * f.weight), 'force balance on the liquid in every vessel: the bottom\'s push plus the walls\' = its weight');
  ok(wi.wallsUp > 0 && na.wallsUp < 0 && ne.wallsUp < 0 && Math.abs(st.wallsUp) < 1e-12, 'walls leaning out hold the liquid up; walls leaning in push it down; straight walls only sideways');
  ok(near(ne.wallsUp, -F.pressure(rho, h - 0.12) * Math.PI * (R0 * R0 - 0.012 * 0.012), 0.01), 'the thin neck\'s shoulder pushes down with the pressure at its depth times its ring of area');
  ok(near(wi.weight / ne.weight, wi.volume / ne.volume, 1e-12) && wi.weight > 5 * ne.weight, 'the widening vessel holds ' + (wi.weight / ne.weight).toFixed(0) + ' times the liquid of the thin neck, yet its bottom feels the same'); })();

// 3. the air
(function () { const tab = [[0, 101.325], [1000, 89.875], [2000, 79.495], [5000, 54.020], [8000, 35.600], [10000, 26.436], [11000, 22.632]];
  let worst = 0; tab.forEach(([z, p]) => worst = Math.max(worst, Math.abs(F.airPressure(z) / 1000 - p) / p));
  ok(worst < 0.001, 'air pressure against the U.S. Standard Atmosphere (1976), sea level to 11 km (within ' + (100 * worst).toFixed(2) + '%)'); })();
ok(near(F.riseHeight(F.P_ATM, 0, 13595.1), 0.760, 1e-3), 'a barometer: the air holds up 760 mm of mercury (at 0 °C, 13 595 kg/m³)');
ok(near(F.riseHeight(F.P_ATM, 0, 998.2), 10.35, 1e-3) && F.riseHeight(F.P_ATM, 0, 998.2) < 10.4, 'no pump can suck water higher than ' + F.riseHeight(F.P_ATM, 0, 998.2).toFixed(2) + ' m at sea level');
ok(near(F.riseHeight(F.P_ATM, F.P_ATM - 1000, 998.2), 0.1021, 1e-3) && F.riseHeight(F.P_ATM, F.P_ATM + 500, 998.2) === 0, 'lowering the pressure in a straw by 1 kPa lifts water 10 cm; blowing into it lifts none');
ok(F.riseHeight(F.airPressure(8849), 0, 998.2) < 3.3, 'at the top of Everest, water can be sucked up only ' + F.riseHeight(F.airPressure(8849), 0, 998.2).toFixed(1) + ' m');

// 4. buoyancy: the pressure on a cube's faces, added up, against Archimedes (the weight of the liquid displaced)
(function () { const a = 0.1, rho = 998.2; let worst = 0;
  for (const d of [-0.2, -0.05, 0, 0.03, 0.2]) { const f = F.cubeForces(a, d, rho, 500), sub = Math.min(a, Math.max(0, d + a));
    // add up the pressure over the bottom face, and the top face, in small pieces
    let up = 0, down = 0; const n = 40; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { up += F.pressure(rho, d + a) * (a / n) ** 2; down += F.pressure(rho, d) * (a / n) ** 2; }
    worst = Math.max(worst, Math.abs(f.buoyancy - (up - down)), Math.abs(f.buoyancy - rho * F.G * a * a * sub)); }
  ok(worst < 1e-9, 'push from below minus push from above = the weight of the liquid the cube displaces, at every depth (Archimedes)');
  const deep = F.cubeForces(a, 0.3, rho, 500), shallow = F.cubeForces(a, 0.01, rho, 500);
  ok(near(deep.buoyancy, shallow.buoyancy, 1e-9) && deep.bottom > 3 * shallow.bottom && deep.top > 20 * shallow.top, 'once under, the buoyant force is the same at any depth, though both pushes grow');
  ok(near(F.cubeForces(a, 0, rho, 7850).weight, 7850 * F.G * 1e-3, 1e-12), 'a 10 cm steel cube weighs 77 N'); })();
// let go: settles floating with the density-ratio fraction under, or sinks to the bottom
(function () { const a = 0.1, floor = 0.5, run = (rb, rl, d0) => { let st = { d: d0, v: 0 }; for (let i = 0; i < 200000; i++) st = F.cubeStep(st, 1e-4, a, rl, rb, floor); return st; };
  const ice = run(917, 998.2, 0.2), pine = run(500, 998.2, -0.05), steelHg = run(7850, 13546, 0.2), gold = run(19300, 13546, 0), iceAlc = run(917, 789.3, 0);
  const frac = st => Math.min(1, Math.max(0, (st.d + a) / a));
  ok(Math.abs(frac(ice) - 917 / 998.2) < 0.005 && Math.abs(frac(pine) - 500 / 998.2) < 0.005, 'let go, ice floats ' + (100 * frac(ice)).toFixed(0) + '% under water and pine ' + (100 * frac(pine)).toFixed(0) + '%: the ratio of the densities');
  ok(Math.abs(frac(steelHg) - 7850 / 13546) < 0.005, 'steel floats on mercury, ' + (100 * frac(steelHg)).toFixed(0) + '% under');
  ok(Math.abs(gold.d + a - floor) < 1e-9 && Math.abs(iceAlc.d + a - floor) < 1e-9, 'gold sinks in mercury, and ice in alcohol: they come to rest on the bottom');
  ok(F.floatFraction(917, 998.2) === 917 / 998.2 && F.floatFraction(19300, 13546) === 1, 'floating fraction: the density ratio, or all of it if it sinks'); })();
// sinking speed: a steel cube in water reaches the speed at which drag balances its weight less buoyancy
(function () { const a = 0.1, rb = 7850, rl = 998.2; let st = { d: 0.0, v: 0 }; for (let i = 0; i < 3000; i++) st = F.cubeStep(st, 1e-4, a, rl, rb, 100);
  const vt = Math.sqrt(2 * (rb - rl) * F.G * a / (rl * 1.05)); let s2 = { d: 0, v: 0 }; for (let i = 0; i < 200000; i++) s2 = F.cubeStep(s2, 1e-4, a, rl, rb, 1000);
  ok(Math.abs(s2.v - vt) < 0.01 * vt && st.v < vt, 'a steel cube sinking in water settles at ' + vt.toFixed(2) + ' m/s, where drag balances its weight less buoyancy'); })();

// more checks of the pieces
ok(F.MATERIALS.find(m => m.id === 'cork').rho === 240 && F.MATERIALS.find(m => m.id === 'pine').rho === 500 && F.R0 === 0.06 && F.HMAX === 0.4, 'cork 240 and pine 500 kg/m³; the vessels 12 cm across at the base and up to 40 cm deep');
ok([-0.05, 0.02, 0.3].every(d => { const f = F.cubeForces(0.1, d, 998.2, 917); return Math.abs(f.displaced - f.buoyancy) < 1e-9; }), 'the weight of the liquid pushed aside is the buoyant force');
// let go from rest under water: it starts off with acceleration g (1 - rho_liquid / rho_block), no drag yet
(function () { const st = F.cubeStep({ d: 0.2, v: 0 }, 1e-4, 0.1, 998.2, 7850, 10), want = F.G * (1 - 998.2 / 7850);
  ok(Math.abs(st.v / 1e-4 - want) < 0.01 * want, 'a released steel cube starts sinking at ' + want.toFixed(2) + ' m/s²: g less the buoyant share'); })();
// a pine block dropped in bobs a few times and settles within a couple of seconds (the waves it makes calm it)
(function () { const a = 0.1, eq = 0.5009 * a - a; let st = { d: -0.1, v: 0 }, t = 0, settle = null, cross = 0, prev = st.d - eq;
  for (let i = 0; i < 10000; i++) { st = F.cubeStep(st, 1e-3, a, 998.2, 500, 0.5); t += 1e-3; const e = st.d - eq; if (Math.sign(e) !== Math.sign(prev) && Math.abs(prev) > 1e-4) cross++; prev = e; if (settle === null && Math.abs(e) < 5e-4 && Math.abs(st.v) < 5e-3) settle = t; }
  ok(settle !== null && settle < 2.5 && cross >= 1 && cross <= 6, 'a pine block dropped in bobs (' + cross + ' crossings) and settles in ' + (settle || 0).toFixed(1) + ' s'); })();
(function () { let st = { d: 0.3, v: 0 }; for (let i = 0; i < 20000; i++) st = F.cubeStep(st, 1e-3, 0.1, 998.2, 19300, 0.5); ok(st.v === 0 && Math.abs(st.d - 0.4) < 1e-12, 'a sunken block rests on the bottom, not moving'); })();

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
