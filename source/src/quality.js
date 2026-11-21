// ============================================================================
// quality level, chosen before anything is built
// ============================================================================
// LV: 0 High, 1 Medium, 2 Low. Medium and Low keep every 2nd / 4th leaf, glint and pebble and bake fewer shadows;
// Low also drops anti-aliasing and uses coarser meshes, cheaper filtering and fewer light shaft steps.
// localStorage.mountain = "level,pixels,detail". mountainLoad is set while the world is built: still set on the next
// visit means that load crashed the tab, so this one runs a level lower.
const mob = matchMedia('(pointer:coarse)').matches, mem = navigator.deviceMemory;
// iOS: Safari — and every iOS browser, all WebKit under the hood — has no deviceMemory and no userAgentData.
// iPadOS 13+ reports as MacIntel, so check touch points too. iOS 26+ devices are iPhone 11 / A13 or newer,
// so 6 CPU cores is a usable stand-in for "can try Medium" (a crashed load still drops a level, see below).
const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const keep = (k, v) => { try { localStorage[k] = v; } catch {} };
let SV = [], LV, bad;
try { SV = (localStorage.mountain || '').split(','); bad = localStorage.mountainLoad; } catch {}
LV = SV[0] ? +SV[0] : mob ? (isiOS ? (navigator.hardwareConcurrency >= 6 ? 1 : 2) : mem > 7 ? 1 : 2) : mem <= 4 ? 2 : 0;
if (bad && LV < 2) { SV = [++LV]; keep('mountain', LV); }
const THIN = 1 << LV, SHADOW = LV ? 2048 : 4096, AA = LV > 1 ? 1 : 4, WATER = LV > 1 ? 256 : 512, RAYN = LV > 1 ? 12 : 34;
