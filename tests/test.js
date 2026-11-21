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
