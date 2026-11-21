// Pure, GPU-free shape parameters for the realistic set pieces.
// Used by world.js to build the meshes, and by tests/test.js.
// Torii: vermilion wooden shrine gate. Hut: log cabin. Eagle/bird: real
// birds, not the manta/fish shapes the first port reused.
function toriiParts() {
  return [
    { kind: 'base', x: -2.2, y: 0.25, z: 0, w: 1.1, h: 0.5, d: 1.1 },
    { kind: 'base', x: 2.2, y: 0.25, z: 0, w: 1.1, h: 0.5, d: 1.1 },
    { kind: 'pillar', x: -2.2, y: 3.25, z: 0, w: 0.55, h: 6.5, d: 0.55, tilt: 0.03 },
    { kind: 'pillar', x: 2.2, y: 3.25, z: 0, w: 0.55, h: 6.5, d: 0.55, tilt: 0.03 },
    { kind: 'nuki', x: 0, y: 5.2, z: 0, w: 5.6, h: 0.4, d: 0.45 },
    { kind: 'gaku', x: 0, y: 5.9, z: 0, w: 0.9, h: 0.7, d: 0.2 },
    { kind: 'shimaki', x: 0, y: 6.35, z: 0, w: 7.2, h: 0.35, d: 0.8 },
    { kind: 'kasagi', x: 0, y: 6.9, z: 0, w: 8.4, h: 0.5, d: 0.9, rise: 0.45 },
  ];
}
function hutLogs() {
  return { courses: 11, logR: 0.28, width: 9, depth: 6, wallH: 3.08, roofPitchDeg: 35, chimney: { x: -2.5, z: 0, h: 1.2 } };
}
function eagleWingChord(u) {
  const a = Math.abs(u);
  return Math.max(0.08, 1 - 0.9 * Math.pow(a, 1.3));
}
function eagleWingSpan() { return 2; }
function birdWingChord(u) {
  return Math.max(0.05, 0.55 - 0.5 * Math.pow(Math.abs(u), 1.5));
}
function pineTrunkRadius(h, H) { return 0.34 * (1 - 0.75 * h / H) + 0.03 + 0.06 * Math.exp(-h / 2); }
function pineWhorlHeights(H) { return [0.16, 0.28, 0.40, 0.52, 0.64, 0.76, 0.86].map((f) => f * H); }
function pineBranchLength(t) { return 1.9 * (1 - 0.55 * t); }
function pineBranchDroop(t) { return 1.15 + 0.45 * (1 - t); }
function pineCrownProfile(t) { return (1 - 0.5 * t * t) * (0.85 + 0.15 * Math.sin(7 * t + 0.6)); }
function pineNeedleSpray() {
  return [
    { yaw: -0.5, tilt: -0.12, len: 0.62, wid: 0.4 },
    { yaw: -0.25, tilt: -0.05, len: 0.85, wid: 0.42 },
    { yaw: 0, tilt: 0, len: 1, wid: 0.45 },
    { yaw: 0.25, tilt: 0.05, len: 0.85, wid: 0.42 },
    { yaw: 0.5, tilt: 0.12, len: 0.62, wid: 0.4 },
  ];
}

const objectsApi = { toriiParts, hutLogs, eagleWingChord, eagleWingSpan, birdWingChord, pineTrunkRadius, pineWhorlHeights, pineBranchLength, pineBranchDroop, pineCrownProfile, pineNeedleSpray };
if (typeof module !== 'undefined' && module.exports) module.exports = objectsApi;
if (typeof window !== 'undefined') window.MountainObjects = objectsApi;
