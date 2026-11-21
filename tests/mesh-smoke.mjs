// Headless smoke test for the set-piece meshes: builds meshTorii, meshHut,
// meshEagle and meshBird in a VM (world.js lives under source/, whose
// package.json has "type": "module", so it cannot be require()d from the
// CommonJS test suite) and checks the built geometry is finite, indexed
// within range, and that the eagle's aux channel still carries the span
// coordinate the flap shader needs. Exit non-zero on any failure.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ Math, console, JSON });
const load = (p) => vm.runInContext(fs.readFileSync(p, 'utf8'), ctx);
load(path.join(root, 'source', 'src', 'math.js'));
load(path.join(root, 'source', 'src', 'objects.js'));
const world = fs.readFileSync(path.join(root, 'source', 'src', 'world.js'), 'utf8');
for (const name of ['meshTorii', 'meshHut', 'meshEagle', 'meshBird']) {
  const i = world.indexOf('function ' + name + '()');
  let j = world.indexOf('\nfunction ', i + 10);
  if (j < 0) j = world.length;
  vm.runInContext(world.slice(i, j), ctx);
}
const out = vm.runInContext(`
(function () {
  const res = [];
  for (const name of ['meshTorii', 'meshHut', 'meshEagle', 'meshBird']) {
    const m = name === 'meshTorii' ? eval(name + '()') : eval(name + '().build()');
    const n = m.nv, f = new Float32Array(m.vb), s8 = new Int8Array(m.vb);
    let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9], nan = 0, badIdx = 0, maxAux = 0;
    for (let k = 0; k < n; k++) {
      for (let a = 0; a < 3; a++) { const v = f[k * 4 + a]; if (!isFinite(v)) nan++; if (v < min[a]) min[a] = v; if (v > max[a]) max[a] = v; }
      maxAux = Math.max(maxAux, Math.abs(s8[k * 16 + 15] / 127));
    }
    for (let q = 0; q < m.ib.length; q++) if (m.ib[q] >= n) badIdx++;
    res.push({ name, verts: n, tris: m.ib.length / 3, min, max, nan, badIdx, maxAux: +maxAux.toFixed(3) });
  }
  return JSON.stringify(res);
})()`, ctx);
const res = JSON.parse(out);
let fail = 0;
for (const r of res) {
  console.log(r.name, 'verts', r.verts, 'tris', r.tris, 'bounds', JSON.stringify(r.min), JSON.stringify(r.max), 'nan', r.nan, 'badIdx', r.badIdx, 'maxAux', r.maxAux);
  if (r.verts < 10 || r.nan || r.badIdx) fail = 1;
}
const eagle = res.find((r) => r.name === 'meshEagle');
if (!eagle || eagle.maxAux < 0.9) { console.error('eagle aux span missing'); fail = 1; }
const torii = res.find((r) => r.name === 'meshTorii');
if (!torii || torii.max[0] - torii.min[0] < 7 || torii.max[1] < 7) { console.error('torii too small'); fail = 1; }
process.exit(fail);
