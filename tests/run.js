// Runs every test file in this folder and reports each one. Exits non-zero if any check fails.
//   node tests/run.js            one line per file
//   node tests/run.js --verbose  every check
'use strict';
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const verbose = process.argv.includes('--verbose');
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
let failed = 0;
for (const f of files) {
  const t0 = Date.now(), r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || ''), lines = out.trim().split('\n');
  const passes = lines.filter(l => /^\s*(ok|PASS)\b/.test(l)).length, fails = lines.filter(l => /^\s*FAIL\b/.test(l)).length;
  const good = r.status === 0 && fails === 0;
  if (!good) failed++;
  console.log((good ? 'pass  ' : 'FAIL  ') + f.replace('.test.js', '').padEnd(28) + String(passes).padStart(4) + ' checks passed' +
    (fails ? ', ' + fails + ' failed' : '') + '   (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (verbose || !good) console.log(out.replace(/^/gm, '      '));
}
console.log(failed ? '\n' + failed + ' of ' + files.length + ' test files FAILED' : '\nall ' + files.length + ' test files passed');
process.exitCode = failed ? 1 : 0;
