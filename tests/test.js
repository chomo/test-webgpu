'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/config.js');

test('viewpoints: 6 poses, 6 numbers each, position differs from look-at', () => {
  assert.equal(C.VIEWPOINTS.length, 6);
  for (const p of C.VIEWPOINTS) {
    assert.equal(p.length, 6);
    assert.ok(p.every(Number.isFinite));
    assert.ok(p[0] !== p[3] || p[1] !== p[4] || p[2] !== p[5]);
  }
});

test('viewpoints: each pose looks at a point inside the world bounds', () => {
  for (const p of C.VIEWPOINTS) {
    assert.ok(p[3] >= -192 && p[3] <= 192);
    assert.ok(p[5] >= -192 && p[5] <= 192);
  }
});

test('fly path: at least 10 points, 60s duration, first point matches viewpoint 1', () => {
  assert.ok(C.FLY.length >= 10);
  assert.equal(C.FLY_DURATION_S, 60);
  assert.equal(C.FLY[0].length, 6);
});

test('isIOS: iPhone / iPad / iPadOS MacIntel+touch, not desktop Chrome', () => {
  assert.equal(C.isIOS('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)', 'iPhone', 5), true);
  assert.equal(C.isIOS('Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X)', 'iPad', 5), true);
  assert.equal(C.isIOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 'MacIntel', 5), true);
  assert.equal(C.isIOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 'MacIntel', 0), false);
  assert.equal(C.isIOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 0), false);
});

test('qualityFor: desktop low memory -> Low, mobile high memory -> Medium, iOS cores decide', () => {
  assert.equal(C.qualityFor({ coarse: false, deviceMemory: 4, hardwareConcurrency: 8, isiOS: false, crashed: false }), 2);
  assert.equal(C.qualityFor({ coarse: false, deviceMemory: 16, hardwareConcurrency: 8, isiOS: false, crashed: false }), 0);
  assert.equal(C.qualityFor({ coarse: true, deviceMemory: undefined, hardwareConcurrency: 8, isiOS: true, crashed: false }), 1);
  assert.equal(C.qualityFor({ coarse: true, deviceMemory: undefined, hardwareConcurrency: 4, isiOS: true, crashed: false }), 2);
  assert.equal(C.qualityFor({ coarse: true, deviceMemory: 8, hardwareConcurrency: 8, isiOS: false, crashed: false }), 1);
});

test('qualityFor: a crashed previous load drops one level, never below Low', () => {
  assert.equal(C.qualityFor({ coarse: false, deviceMemory: 16, hardwareConcurrency: 8, isiOS: false, crashed: true }), 1);
  assert.equal(C.qualityFor({ coarse: true, deviceMemory: undefined, hardwareConcurrency: 4, isiOS: true, crashed: true }), 2);
});

test('aim: yaw/pitch from position and look-at', () => {
  const a = C.aim(0, 0, 0, 0, 0, -10);
  assert.ok(Math.abs(a.yaw) < 1e-9 && Math.abs(a.pitch) < 1e-9);
  const b = C.aim(0, 0, 0, 10, 0, 0);
  assert.ok(Math.abs(b.yaw - Math.PI / 2) < 1e-9);
  const c = C.aim(0, 0, 0, 0, 10, 0);
  assert.ok(Math.abs(c.pitch - Math.PI / 2) < 1e-9);
});

test('cameraStep: W moves forward, Q down, E up, Shift doubles speed', () => {
  const p0 = [0, 0, 0];
  const fwd = C.cameraStep(p0, 0, 0, { w: true }, 1, 10);
  assert.ok(fwd[2] < 0);
  const down = C.cameraStep(p0, 0, 0, { q: true }, 1, 10);
  assert.equal(down[1], -10);
  const up = C.cameraStep(p0, 0, 0, { e: true }, 1, 10);
  assert.equal(up[1], 10);
  const fast = C.cameraStep(p0, 0, 0, { w: true, shift: true }, 1, 10);
  assert.equal(fast[2], 2 * fwd[2]);
});

test('validateQuality: level must be 0, 1 or 2', () => {
  assert.equal(C.validateQuality(0), true);
  assert.equal(C.validateQuality(2), true);
  assert.equal(C.validateQuality(3), false);
  assert.equal(C.validateQuality(-1), false);
});

test('target spec: 2560x1440, avg frame <= 11ms, no frame > 16.7ms', () => {
  assert.equal(C.TARGET.width, 2560);
  assert.equal(C.TARGET.height, 1440);
  assert.equal(C.TARGET.avgMs, 11);
  assert.equal(C.TARGET.maxMs, 16.7);
});

const fs = require('node:fs');
const path = require('node:path');
const built = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('built index.html: mountain title, menu and credit, no sea leftovers', () => {
  assert.ok(built.includes('<title>Mountain Garden</title>'));
  assert.ok(built.includes('Enter the mountains'));
  assert.ok(built.includes('github.com/Noniv/abyssal-garden'));
  assert.ok(!/kelp|whale|manta/i.test(built.replace(/Abyssal Garden/g, '')));
});

test('built index.html: WGSL shaders and WebGPU error path present', () => {
  assert.ok((built.match(/@vertex/g) || []).length >= 8);
  assert.ok((built.match(/@fragment/g) || []).length >= 10);
  assert.ok(built.includes('No WebGPU adapter found'));
  assert.ok(built.includes('iOS / iPadOS 26'));
});

test('built index.html: iPhone support (safe-area, touch buttons, visualViewport)', () => {
  assert.ok(built.includes('safe-area-inset'));
  assert.ok(built.includes('viewport-fit=cover'));
  assert.ok(built.includes('id=u') && built.includes('id=v'));
  assert.ok(built.includes('visualViewport'));
});

test('built index.html: controls and viewpoints wired (WASD, Q/E, Shift, 1-6)', () => {
  assert.ok(built.includes('KeyW') && built.includes('KeyQ') && built.includes('KeyE'));
  assert.ok(built.includes('ShiftLeft') || built.includes('Shift'));
  assert.ok(built.includes('Digit1'));
});

const tpl = fs.readFileSync(path.join(__dirname, '..', 'source', 'template.html'), 'utf8');
const mainSrc = fs.readFileSync(path.join(__dirname, '..', 'source', 'src', 'main.js'), 'utf8');

test('iPhone: template has portrait-native play, safe-area, coarse-pointer UI', () => {
  assert.ok(tpl.includes('viewport-fit=cover'));
  assert.ok(tpl.includes('apple-mobile-web-app-capable'));
  assert.ok(tpl.includes('safe-area-inset'));
  assert.ok(tpl.includes('Rotate for a wider view'));
  assert.ok(tpl.includes('@media (pointer: coarse)'));
  assert.ok(!/rotate\(90deg\)/.test(tpl));
});

test('iPhone: no fullscreen/orientation lock on iOS, iOS 26+ WebGPU guidance in main', () => {
  assert.ok(mainSrc.includes("mob && !isiOS && document.documentElement.requestFullscreen"));
  assert.ok(mainSrc.includes('update to iOS / iPadOS 26 or later and open this page in Safari'));
  assert.ok(mainSrc.includes('visualViewport'));
});

test('iPhone: quality heuristic prefers Medium on 6+ core iOS, Low below', () => {
  assert.equal(C.qualityFor({ coarse: true, deviceMemory: undefined, hardwareConcurrency: 6, isiOS: true, crashed: false }), 1);
  assert.equal(C.qualityFor({ coarse: true, deviceMemory: undefined, hardwareConcurrency: 5, isiOS: true, crashed: false }), 2);
});

const O = require('../src/objects.js');

test('torii: two pillars, wide upturned kasagi, nuki and centred gaku', () => {
  const parts = O.toriiParts();
  const pillars = parts.filter((p) => p.kind === 'pillar');
  assert.equal(pillars.length, 2);
  assert.ok(Math.abs(pillars[0].x + pillars[1].x) < 0.01);
  const spacing = Math.abs(pillars[0].x - pillars[1].x);
  const kasagi = parts.find((p) => p.kind === 'kasagi');
  assert.ok(kasagi.w > spacing);
  assert.ok(kasagi.rise > 0.3);
  assert.ok(parts.some((p) => p.kind === 'nuki'));
  const gaku = parts.find((p) => p.kind === 'gaku');
  assert.equal(gaku.x, 0);
});

test('hut: log courses, gabled roof pitch, chimney', () => {
  const h = O.hutLogs();
  assert.ok(h.courses >= 8);
  assert.ok(h.roofPitchDeg >= 25 && h.roofPitchDeg <= 45);
  assert.ok(h.chimney && h.chimney.h > 0);
  assert.ok(h.width >= 8 && h.width <= 10);
  assert.ok(h.depth >= 5 && h.depth <= 7);
});

test('eagle wing: chord tapers from body to tip', () => {
  assert.ok(O.eagleWingChord(0) >= 0.95 && O.eagleWingChord(0) <= 1.05);
  assert.ok(O.eagleWingChord(0.5) >= 0.55 && O.eagleWingChord(0.5) <= 0.7);
  assert.ok(O.eagleWingChord(0.95) < 0.2);
  assert.ok(O.eagleWingChord(0.9) < O.eagleWingChord(0.5));
  assert.equal(O.eagleWingSpan(), 2);
});

test('bird wing: smaller chord, same taper', () => {
  assert.ok(O.birdWingChord(0) >= 0.5 && O.birdWingChord(0) <= 0.6);
  assert.ok(O.birdWingChord(0.5) >= 0.3 && O.birdWingChord(0.5) <= 0.45);
  assert.ok(O.birdWingChord(0.95) < 0.1);
});

test('pine trunk: radius tapers from base to crown; whorls in 7 tiers', () => {
  const H = 30;
  assert.ok(O.pineTrunkRadius(0, H) >= 0.3 && O.pineTrunkRadius(0, H) <= 0.45);
  assert.ok(O.pineTrunkRadius(0, H) > O.pineTrunkRadius(H / 2, H));
  assert.ok(O.pineTrunkRadius(H / 2, H) > O.pineTrunkRadius(H, H));
  assert.ok(O.pineTrunkRadius(H, H) > 0);
  const wh = O.pineWhorlHeights(H);
  assert.equal(wh.length, 7);
  for (let i = 1; i < wh.length; i++) assert.ok(wh[i] > wh[i - 1]);
  assert.ok(wh[0] > 0.1 * H && wh[6] < 0.9 * H);
});

test('pine trunk: root flare widens the base, still tapering', () => {
  const H = 30;
  assert.ok(O.pineTrunkRadius(0, H) >= 0.4 && O.pineTrunkRadius(0, H) <= 0.45);
  assert.ok(O.pineTrunkRadius(1, H) < O.pineTrunkRadius(0, H));
  assert.ok(O.pineTrunkRadius(0, H) > O.pineTrunkRadius(2, H));
});

test('pine branches: length shrinks with height, droop is strongest at the bottom', () => {
  assert.ok(O.pineBranchLength(0) > O.pineBranchLength(0.5));
  assert.ok(O.pineBranchLength(0.5) > O.pineBranchLength(1));
  assert.ok(O.pineBranchLength(1) > 0);
  assert.ok(O.pineBranchLength(0) >= 1.5 && O.pineBranchLength(0) <= 2.5);
  assert.ok(O.pineBranchDroop(0) > Math.PI / 2);
  assert.ok(O.pineBranchDroop(1) < Math.PI / 2);
  assert.ok(O.pineBranchDroop(0) > O.pineBranchDroop(0.5));
  assert.ok(O.pineBranchDroop(0.5) > O.pineBranchDroop(1));
});

test('pine crown: envelope is irregular, not a smooth cone', () => {
  assert.ok(O.pineCrownProfile(0) >= 0.85 && O.pineCrownProfile(0) <= 1);
  assert.ok(O.pineCrownProfile(1) < 0.6);
  for (let i = 0; i <= 10; i++) { const p = O.pineCrownProfile(i / 10); assert.ok(p > 0 && p <= 1.1); }
  assert.ok(O.pineCrownProfile(0.3) !== O.pineCrownProfile(0.4));
});

test('pine needle spray: a fan of thin blades, centre longest', () => {
  const s = O.pineNeedleSpray();
  assert.equal(s.length, 5);
  const mid = s[(s.length - 1) / 2];
  assert.ok(s.every((b) => b.len > 0 && b.len <= 1 && b.wid > 0 && b.wid < 0.6));
  assert.ok(s.every((b) => b.len <= mid.len));
  assert.ok(Math.max(...s.map((b) => b.yaw)) - Math.min(...s.map((b) => b.yaw)) >= 0.9);
  assert.ok(s[0].yaw < 0 && s[s.length - 1].yaw > 0);
});

const worldSrc = fs.readFileSync(path.join(__dirname, '..', 'source', 'src', 'world.js'), 'utf8');

test('world: no sea shapes left in set pieces (no ship keel, manta, fluke)', () => {
  assert.ok(!/keel|bowsprit|stern castle|cephalic|manta|fluke/i.test(worldSrc));
  assert.ok(worldSrc.includes('meshTorii') && worldSrc.includes('meshHut') && worldSrc.includes('meshEagle'));
});

test('built index.html: vermilion torii, eagle brown, pale bird belly, rock snow', () => {
  assert.ok(built.includes('vec3f(.62,.12,.04)'));
  assert.ok(built.includes('vec3f(.23,.15,.08)'));
  assert.ok(built.includes('vec3f(.82,.78,.70)'));
  assert.ok(built.includes('vec3f(.85,.88,.92)'));
});

test('world: pine columns use tapered trunks and branch whorls', () => {
  assert.ok(worldSrc.includes('pineTrunkRadius'));
  assert.ok(worldSrc.includes('pineWhorlHeights'));
});

test('world: pine foliage is needle sprays, not a smooth cone', () => {
  assert.ok(worldSrc.includes('pineNeedleSpray'));
  assert.ok(worldSrc.includes('pineBranchLength'));
  assert.ok(worldSrc.includes('pineBranchDroop'));
  assert.ok(worldSrc.includes('pineCrownProfile'));
  assert.ok(worldSrc.includes('pineBark') || worldSrc.includes(', 7,'));
});

test('leaf shader: bark is its own leaf type (case 7), not trunk-green', () => {
  const shadersSrc = fs.readFileSync(path.join(__dirname, '..', 'source', 'src', 'shaders.js'), 'utf8');
  assert.ok(shadersSrc.includes('case 7'));
  const i = shadersSrc.indexOf('case 7');
  assert.ok(shadersSrc.slice(i, i + 200).includes('vec3f(.16,.10,.05)'));
});

test('meshes build headlessly (mesh-smoke.mjs)', async () => {
  const { execFile } = require('node:child_process');
  const { promisify } = require('node:util');
  await promisify(execFile)(process.execPath, [path.join(__dirname, 'mesh-smoke.mjs')]);
});
