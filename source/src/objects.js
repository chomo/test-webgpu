// Pure, GPU-free shape parameters for the realistic set pieces.
// Used by world.js to build the meshes, and by tests/test.js.
// Torii: vermilion wooden shrine gate. Hut: log cabin. Eagle/bird: real
// birds, not the manta/fish shapes the first port reused.
function toriiParts() { return []; }
function hutLogs() { return { courses: 0, logR: 0, width: 0, depth: 0, wallH: 0, roofPitchDeg: 0, chimney: null }; }
function eagleWingChord(u) { return 0; }
function eagleWingSpan() { return 0; }
function birdWingChord(u) { return 0; }
function pineTrunkRadius(h, H) { return 0; }
function pineWhorlHeights(H) { return []; }

const api = { toriiParts, hutLogs, eagleWingChord, eagleWingSpan, birdWingChord, pineTrunkRadius, pineWhorlHeights };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.MountainObjects = api;
