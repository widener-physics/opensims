// Loads a simulation's physics core straight out of the page that ships, so the tests check exactly
// the code that runs in the browser rather than a copy of it. In each page the core sits between two
// comments, "---- physics core" and "---- end of core"; it must not touch the page (no document,
// no canvas), which is what lets it run here under Node with nothing else installed.
'use strict';
const fs = require('fs'), path = require('path');

module.exports = function load(slug) {
  const file = path.join(__dirname, '..', 'sims', slug + '.html');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const i = lines.findIndex(l => l.includes('---- physics core')), j = lines.findIndex(l => l.includes('---- end of core'));
  if (i < 0 || j < i) throw new Error(slug + '.html has no marked physics core');
  const indent = lines[i].match(/^\s*/)[0].length;
  const code = lines.slice(i, j + 1).map(l => l.slice(Math.min(indent, l.match(/^\s*/)[0].length))).join('\n');
  // Hand back everything the block defines at its top level. Rather than parse declarations, try every
  // identifier that appears in it: only names in scope at the end of the block resolve (names local to a
  // function do not), and anything that is really a global, such as Math, is skipped.
  const RESERVED = new Set(('break case catch class const continue debugger default delete do else export extends false finally for ' +
    'function if import in instanceof let new null return super switch this throw true try typeof var void while with yield await ' +
    'enum implements interface package private protected public static arguments eval undefined NaN Infinity').split(' '));
  const ids = [...new Set(code.match(/[A-Za-z_$][\w$]*/g))].filter(n => !RESERVED.has(n) && !(n in globalThis));
  const grab = ids.map(n => 'try { out.' + n + ' = ' + n + '; } catch (e) {}').join('\n');
  return new Function("'use strict';\n" + code + '\nconst out = {};\n' + grab + '\nreturn out;')();
};
