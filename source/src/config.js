'use strict';
// Mountain Garden config + pure camera/quality logic (no browser globals except
// the values passed in, so node --test can cover it). LV: 0 High, 1 Medium, 2 Low.

const TARGET = Object.freeze({ width: 2560, height: 1440, avgMs: 11, maxMs: 16.7 });

// Preset viewpoints (position, look-at), keys 1-6. Same XZ layout as the original
// original poses, raised into the air above the valley floor and cloud sea.
const VIEWPOINTS = Object.freeze([
  [10, 1.3, 7, -9, -31, -10], // pine basin, looking at the torii hill
  [50, 1.3, 34, 58, -23, 8],  // lake shore, waterfall in view
  [-26, 2.2, -100, 0, -9, -108], // flower valley, sunset end
  [-55, 1.5, -18, -60, -30, 8],  // stone arch viewpoint
  [10, 1.2, -62, 6, -22, -90],   // mountain hut clearing
  [3, 1.6, 62, 1, -28, 100],     // ridge above the cloud sea
]);

// 60 s camera path (position + look-at, Catmull-Rom), matching the viewpoints.
const FLY = Object.freeze([
  [10, 1.3, 7, -9, -31, -10],
  [22, 0.5, 40, 48, -20, 45],
  [50, 1.3, 35, 58, -23, 8],
  [55, 0.8, 20, 60, -18, -10],
  [50, 0.2, -44, 10, -26, -80],
  [30, 0.5, -70, 4, -28, -90],
  [12, 1.0, -62, 6, -27, -90],
  [-16, 0.8, -84, 0, -22, -108],
  [-29, 0.6, -90, -44, -30, -60],
  [-53, 0.8, -50, -60, -28, -20],
  [-58, 1.0, -28, -60, -30, 0],
  [-60, 1.2, 10, -50, -28, 40],
  [-52, 1.0, 36, -20, -30, 44],
  [-22, 0.8, 43, 4, -32, 52],
  [3, 1.6, 62, 1, -28, 100],
]);
const FLY_DURATION_S = 60;

function isIOS(userAgent, platform, maxTouchPoints) {
  return /iPad|iPhone|iPod/.test(userAgent || '') ||
    (platform === 'MacIntel' && (maxTouchPoints || 0) > 1);
}

// env: { coarse, deviceMemory, hardwareConcurrency, isiOS, crashed }
// iOS has no deviceMemory: 6+ cores is the stand-in for "can try Medium".
function qualityFor(env) {
  let lv;
  if (env.crashed !== true && env.savedLevel !== undefined && env.savedLevel !== null && env.savedLevel !== '') {
    lv = +env.savedLevel;
  } else if (env.coarse) {
    lv = env.isiOS ? (env.hardwareConcurrency >= 6 ? 1 : 2)
      : (env.deviceMemory > 7 ? 1 : 2);
  } else {
    lv = env.deviceMemory <= 4 ? 2 : 0;
  }
  if (env.crashed && lv < 2) lv += 1;
  return lv;
}

function validateQuality(lv) { return lv === 0 || lv === 1 || lv === 2; }

// Yaw/pitch for a camera at (x,y,z) looking at (tx,ty,tz).
function aim(x, y, z, tx, ty, tz) {
  const dx = tx - x, dy = ty - y, dz = tz - z;
  return { yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) };
}

// One movement step. keys: {w,a,s,d,q,e,shift}. Returns a new [x,y,z].
// Yaw 0 faces -Z; Q sinks, E rises; Shift doubles speed.
function cameraStep(pos, yaw, pitch, keys, dt, speed) {
  const v = speed * dt * (keys.shift ? 2 : 1);
  const sy = Math.sin(yaw), cy = Math.cos(yaw);
  let x = pos[0], y = pos[1], z = pos[2];
  if (keys.w) { x -= sy * v; z -= cy * v; }
  if (keys.s) { x += sy * v; z += cy * v; }
  if (keys.a) { x -= cy * v; z += sy * v; }
  if (keys.d) { x += cy * v; z -= sy * v; }
  if (keys.q) y -= v;
  if (keys.e) y += v;
  return [x, y, z];
}

const api = { TARGET, VIEWPOINTS, FLY, FLY_DURATION_S, isIOS, qualityFor, validateQuality, aim, cameraStep };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.MountainConfig = api;
