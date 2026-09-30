// Moving clocks and the twin paradox (Earth's frame): light clocks built in their own rest frames and
// Lorentz-transformed, the moving ruler measured at one time, and the twins' flash counts.
const r = require('./load.js')('relativity');
let bad = 0;
const chk = (n, got, want, tol) => {
  const ok = Math.abs(got - want) <= (tol == null ? 1e-10 : tol) * Math.max(1, Math.abs(want)); if (!ok) bad++;
  console.log((ok ? '  ok   ' : '  FAIL ') + n.padEnd(64) + (+got).toPrecision(10) + '  vs ' + (+want).toPrecision(10));
};
const c = 0.299792458;   // m/ns
// a Lorentz boost of an event (t, x) into a frame moving at beta
const boost = (b, e) => { const g = r.gammaOf(b); return { t: g * (e.t - b * e.x / c), x: g * (e.x - b * c * e.t) }; };

console.log('A light clock built in its OWN rest frame, then Lorentz-transformed into a frame where it moves.');
console.log('Its tick events must come out with exactly the period and photon path the sim draws.');
const L0 = 1.5;
for (const b of [0.3, 0.6, 0.9, -0.6]) {
  // rest frame: the start mirror at x' = 0 (sideways) or the base at x' = 0 (upright); ticks at t' = n 2L0/c
  const restTicks = [0, 1, 2, 3].map(n => ({ t: n * 2 * L0 / c, x: 0 }));
  // the rest frame moves at +b in the lab, so lab = boost by -b
  const lab = restTicks.map(e => boost(-b, e));
  chk(`upright tick period at beta ${b}`, lab[1].t - lab[0].t, r.clockPeriod('up', L0, b, c, true));
  chk(`sideways (contracted) tick period at beta ${b}`, lab[2].t - lab[1].t, r.clockPeriod('side', L0, b, c, true));
  // the half-tick event: for the sideways clock the photon reaches the far mirror at t' = L0/c, x' = L0 (or -L0 if moving left)
  const far = boost(-b, { t: L0 / c, x: b >= 0 ? L0 : -L0 }), start = boost(-b, { t: 0, x: 0 });
  const dt = far.t - start.t, sep = Math.abs((far.x - start.x) - b * c * dt);   // far mirror's distance from the start mirror, both at lab time far.t
  const p = r.clockPhoton('side', L0, b, c, true, dt);
  chk(`   ...photon reaches the far mirror when the sim says (beta ${b})`, p.along, p.len, 1e-9);
  chk(`   ...and the far mirror is L0/gamma away in the lab (beta ${b})`, sep, L0 / r.gammaOf(b), 1e-9);
}
console.log('\nWithout contraction a sideways clock would run slow by a further factor gamma, and disagree with');
console.log('its upright twin riding alongside it - which is what the "don\'t shrink" toggle shows');
for (const b of [0.6, 0.9]) {
  // chase the mirrors by bisection, independently of the closed form
  // bisection that works whichever way the function slopes
  const L = L0, v = b * c, solve = f => { let lo = 0, hi = 1e6; const up = f(lo) < 0; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; (f(m) > 0) === up ? hi = m : lo = m; } return (lo + hi) / 2; };
  const t1 = solve(t => c * t - (L + v * t)), t2 = solve(t => (L + v * t1) - c * t - v * (t1 + t));   // chase out, then meet coming back
  chk(`uncontracted sideways period at beta ${b}, by bisection`, t1 + t2, r.clockPeriod('side', L0, b, c, false), 1e-12);
  chk(`   ...which is gamma times the upright one`, r.clockPeriod('side', L0, b, c, false) / r.clockPeriod('up', L0, b, c, true), r.gammaOf(b), 1e-12);
}

console.log('\nReciprocity: the platform clock\'s ticks, transformed into the train\'s frame, come out slow by gamma,');
console.log('exactly as the sim draws them when you ride with the train');
for (const b of [0.6, 0.95]) {
  const plat = [0, 1, 2].map(n => ({ t: n * 2 * L0 / c, x: 2.0 }));   // platform clock at rest at x = 2 m
  const tr = plat.map(e => boost(b, e));                              // the train frame moves at +b
  chk(`platform clock period seen from the train, beta ${b}`, tr[1].t - tr[0].t, r.clockPeriod('up', L0, -b, c, true));
}

console.log('\nThe moving ruler: find both ends at the same lab time via the Lorentz transformation');
for (const b of [0.5, 0.8, 0.99]) {
  // ruler at rest in the train frame from x' = 0 to x' = L0; lab sees the frame moving at +b
  const ends = [0, L0].map(xp => tLab => { const g = r.gammaOf(b); const tp = (tLab / g) - b * xp / c; return g * (xp + b * c * tp); });
  chk(`measured length at beta ${b}`, ends[1](7.3) - ends[0](7.3), L0 / r.gammaOf(b));
}

console.log('\n===== the twin paradox =====');
const tw = r.twins(0.8, 8);
console.log(`beta 0.8, star 8 ly away: gamma ${tw.g.toFixed(4)}, k ${tw.k.toFixed(4)}, Earth ages ${tw.T} yr, traveler ${tw.tau.toFixed(4)} yr`);
chk('Earth time for the trip', tw.T, 20); chk('traveler time', tw.tau, 12);
chk('traveler receives one Earth flash per birthday of Earth: total', tw.earthFlashes.length, 20, 0);
chk('Earth receives one flash per traveler birthday: total', tw.shipFlashes.length, 12, 0);
// every Earth flash must actually reach the traveler before or at the reunion, and in order
chk('last Earth flash arrives at the reunion', tw.earthFlashes.at(-1).tArr, tw.T, 1e-9);
chk('last traveler flash arrives at the reunion', tw.shipFlashes.at(-1).tArr, tw.T, 1e-9);
// rates: receding, one flash every k of your own years; approaching, one every 1/k
const eo = tw.earthFlashes.filter(f => f.tArr <= tw.T / 2 + 1e-9), ei = tw.earthFlashes.filter(f => f.tArr > tw.T / 2 + 1e-9);
chk('traveler outbound: Earth flashes k of his years apart', eo[1].ageArr - eo[0].ageArr, tw.k);
chk('traveler inbound: 1/k apart', ei[1].ageArr - ei[0].ageArr, 1 / tw.k);
chk('traveler receives how many on the way out', eo.length, 2, 0);
const so = tw.shipFlashes.filter(f => f.tArr <= tw.earthSwitch + 1e-9), si = tw.shipFlashes.filter(f => f.tArr > tw.earthSwitch + 1e-9);
chk('Earth, before the switch: traveler flashes k years apart', so[1].tArr - so[0].tArr, tw.k);
chk('Earth, after: 1/k apart', si[1].tArr - si[0].tArr, 1 / tw.k);
chk('Earth sees the switch at T/2 + D', tw.earthSwitch, 18);
chk('Earth receives how many before the switch', so.length, 6, 0);
// each flash really is on the light cone: it travels exactly as far as the time it takes
tw.earthFlashes.forEach(f => { if (Math.abs((f.tArr - f.sent) - tw.x(f.tArr)) > 1e-9) { bad++; console.log('  FAIL Earth flash off the light cone', f); } });
tw.shipFlashes.forEach(f => { if (Math.abs((f.tArr - f.tSent) - f.xSent) > 1e-9) { bad++; console.log('  FAIL ship flash off the light cone', f); } });
console.log('  ok   every flash travels at exactly c (checked all ' + (tw.earthFlashes.length + tw.shipFlashes.length) + ')');
// the traveler's proper time, integrated independently of the gamma formula: d tau = sqrt(dt^2 - dx^2)
{ let s = 0, n = 200000; for (let i = 0; i < n; i++) { const t0 = tw.T * i / n, t1 = tw.T * (i + 1) / n, dx = tw.x(t1) - tw.x(t0); s += Math.sqrt((t1 - t0) ** 2 - dx * dx); }
  chk('traveler age by integrating the interval along the path', s, tw.tau, 1e-9); }
console.log('\nother speeds: the counting identities hold for any trip');
for (const [b, D] of [[0.5, 3], [0.6, 4.5], [0.95, 10], [0.2, 2]]) {
  const t = r.twins(b, D);
  chk(`beta ${b}, D ${D}: flashes Earth receives = traveler's age`, t.shipFlashes.length, Math.floor(t.tau + 1e-9), 0);
  chk(`   (tau/2)/k + (tau/2)k = Earth's age`, (t.tau / 2) / t.k + (t.tau / 2) * t.k, t.T);
}
console.log(bad ? `\n${bad} FAILURES` : '\nall checks passed');
process.exitCode = bad ? 1 : 0;
