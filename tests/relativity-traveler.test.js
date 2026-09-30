// Moving clocks and the twin paradox (the traveler's frame): two inertial frames joined at the turnaround,
// the jump in Earth's 'now', and every flash still moving at c.
const r = require('./load.js')('relativity');
let bad = 0;
const chk = (n, got, want, tol) => {
  const ok = Math.abs(got - want) <= (tol == null ? 1e-9 : tol) * Math.max(1, Math.abs(want)); if (!ok) bad++;
  console.log((ok ? '  ok   ' : '  FAIL ') + n.padEnd(66) + (+got).toPrecision(10) + '  vs ' + (+want).toPrecision(10));
};
const tw = r.twins(0.8, 8), half = tw.tau / 2;
console.log('the traveler is at rest at x = 0 in whichever frame he is in, and his clock reads that frame\'s time');
for (const tau of [0, 1.7, 4, 6, 6.0001, 8.3, 12]) {
  const t = tau * tw.g, x = tw.x(t), F = r.shipFrame(tw, tau), e = F.tf(t, x);
  chk(`tau ${tau}: his position`, e.x, 0, 1e-9);
  chk(`tau ${tau}: frame time = his own age`, e.t, tau, 1e-9);
}
console.log('\nEarth\'s clock as the traveler reckons it "now"');
chk('at launch', r.shipFrame(tw, 0).earthNow, 0);
chk('just before the turnaround (tau/gamma = 3.6)', r.shipFrame(tw, half).earthNow, 3.6);
chk('just after it: gamma^2 beta^2 ... = T(1+beta^2)/2 = 16.4', r.shipFrame(tw, half + 1e-12).earthNow, 16.4, 1e-9);
chk('the jump is T beta^2 = 12.8', r.shipFrame(tw, half + 1e-12).earthNow - r.shipFrame(tw, half).earthNow, 12.8, 1e-9);
chk('at the reunion', r.shipFrame(tw, tw.tau).earthNow, 20);
chk('out: Earth\'s clock runs slow by gamma in his frame', (r.shipFrame(tw, 5).earthNow - r.shipFrame(tw, 2).earthNow) / 3, 1 / tw.g);
chk('back: and slow by gamma again', (r.shipFrame(tw, 11).earthNow - r.shipFrame(tw, 8).earthNow) / 3, 1 / tw.g);
console.log('\ndistances in his frame');
chk('the star at launch is D/gamma away', r.shipFrame(tw, 0).star, tw.D / tw.g);
chk('Earth at the turnaround, outbound frame: -D/gamma', r.shipFrame(tw, half).earth, -tw.D / tw.g);
chk('...and in the return frame, the same distance', r.shipFrame(tw, half + 1e-12).earth, -tw.D / tw.g, 1e-9);
chk('Earth recedes at beta', (r.shipFrame(tw, 4).earth - r.shipFrame(tw, 2).earth) / 2, -0.8);
chk('Earth approaches at beta', (r.shipFrame(tw, 10).earth - r.shipFrame(tw, 8).earth) / 2, 0.8);
console.log('\nflashes on his "now" slice');
// a hair either side of the turnaround (Earth's 2nd flash lands on him exactly AT the turnaround at these numbers)
const eps = 1e-7;
const n0 = r.flashesNow(tw, half - eps).list.filter(f => f.from === 'earth'), n1 = r.flashesNow(tw, half + eps).list.filter(f => f.from === 'earth');
chk('Earth flashes in flight just before the turnaround (2 is about to land)', n0.length, 2, 0);
chk('...the one landing is right at the ship', Math.abs(n0.find(f => f.n === 2).x) < 1e-6 ? 1 : 0, 1, 0);
chk('...just after: flashes sent between her ages 3.6 and 16.4 now count as sent', n1.length, 14, 0);
console.log('         before: n = ' + n0.map(f => f.n).join(',') + '   after: n = ' + n1.map(f => f.n).join(','));
// Positions of flashes in flight are NOT continuous across the switch: the same ray crosses the new
// "now" at a later point of its path. What is exact on either slice: a flash's distance equals the time
// until it reaches him in that frame - after the switch, its real arrival; before it, when it would
// have caught him had he kept flying away (at age k*n on the outbound Doppler clock).
const f3a = n0.find(f => f.n === 3), f3b = n1.find(f => f.n === 3), arr3 = tw.earthFlashes.find(f => f.sent === 3).ageArr;
chk('flash 3 before the switch: distance = time until it would catch him going out', -f3a.x, tw.k * 3 - (half - eps), 1e-6);
chk('flash 3 after the switch: distance = time until it really arrives', -f3b.x, arr3 - (half + eps), 1e-6);
console.log(`         so it jumps from ${(-f3a.x).toFixed(2)} ly behind him to ${(-f3b.x).toFixed(2)} ly: he has turned round into it`);
// each Earth flash reaches him (x = 0) exactly at the age the Earth-frame calculation gives
let worst = 0;
// (the last flash leaves Earth at the reunion itself, so it is never in flight; skip it)
tw.earthFlashes.filter(f => f.tArr - f.sent > 1e-9).forEach(f => { const tau = f.ageArr - 1e-9, g = r.flashesNow(tw, tau).list.find(q => q.from === 'earth' && q.n === f.sent); if (g) worst = Math.max(worst, Math.abs(g.x)); else if (f.ageArr > 1e-6) { bad++; console.log('  FAIL flash', f.sent, 'not in flight just before it arrives'); } });
chk('every Earth flash is at his position just as it arrives (worst |x|)', worst, 0, 1e-6);
// light moves at c on his slices
{ const a = r.flashesNow(tw, 2).list, b = r.flashesNow(tw, 2.5).list;
  a.forEach(f => { const g = b.find(q => q.from === f.from && q.n === f.n); if (g) { const v = (g.x - f.x) / 0.5; if (Math.abs(Math.abs(v) - 1) > 1e-9) { bad++; console.log('  FAIL flash speed', v); } } });
  console.log('  ok   every flash moves at exactly c in his frame'); }
// the count he has received is frame-independent and continuous; so is the count Earth has received
for (const [b, D] of [[0.5, 3], [0.95, 10], [0.6, 4.5]]) {
  const t = r.twins(b, D), h = t.tau / 2;
  chk(`beta ${b}: reckoned Earth age jumps by T beta^2`, r.shipFrame(t, h + 1e-12).earthNow - r.shipFrame(t, h).earthNow, t.T * b * b, 1e-8);
  chk(`   ...and 2 (tau/2)/gamma + T beta^2 = T`, 2 * h / t.g + t.T * b * b, t.T);
}
console.log(bad ? `\n${bad} FAILURES` : '\nall checks passed');
process.exitCode = bad ? 1 : 0;
