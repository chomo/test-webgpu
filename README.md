# Mountain Garden

A real-time fantasy mountain scene in the browser, rendered with WebGPU.
Fly a free camera through pine forests, a sea of clouds, rock canyons,
a flower valley, a log mountain hut and a vermilion torii.

Based on [Noniv/abyssal-garden](https://github.com/Noniv/abyssal-garden) (MIT):
same WebGPU architecture, single self-contained `index.html`, everything
procedural, no Three.js/Babylon or other engines, no texture/model files.

## Run

Open `index.html` in a WebGPU-capable browser (Chrome/Edge on desktop,
or Safari on iOS/iPadOS 26+). No server or build step is needed to view it.

To rebuild from source:

```
cd source
node build.mjs        # minified index.html (99.9 kB, 39.8 kB gzipped)
node build.mjs --readable
```

## Controls

- WASD move, mouse look (pointer lock), Q/E down/up, Shift faster
- 1–6 viewpoints, Esc menu, M mute, H performance stats
- Touch: hold to fly, slide to steer, second finger faster, ▲▼ up/down
- Detail: Low / Medium / High (menu)

## iPhone

Portrait plays natively (no forced rotation), safe-area insets,
`viewport-fit=cover`, touch ▲▼ buttons, quality heuristic
(6+ CPU cores → Medium, otherwise Low), and a crash-downgrade that
drops one detail level after a failed load. WebGPU on iPhone/iPad
needs iOS/iPadOS 26+ in Safari; the error screen says so.

## Target

2560×1440, GPU frame ≤ 11 ms average, no frame > 16.7 ms in a
60 s scripted fly-through. Performance stats (H) use GPU timestamp
queries when the adapter supports them.

## Tests

```
node --test tests/test.js
```

40 tests: camera/quality/iOS config, viewpoints and fly path,
built-`index.html` regression checks (title, WGSL, controls,
iPhone support), realistic-object shape parameters (torii, hut,
eagle/bird wings, pine trunk/whorls), mountain-atmosphere
regression checks (no seabed/caustics/refraction left, sky-blue
and warm-sunset ambient, neutral aerial haze, dappled light),
and a headless mesh smoke
test (`node tests/mesh-smoke.mjs`) that builds the torii, hut,
eagle and bird meshes and checks them for finite vertices and
valid indices.

## Status / limitation

## Realistic objects

The first port only renamed the original's sea objects: the torii
was the stone whale fluke, the hut was the sunken ship, the eagle
was the manta ray and the birds were fish. They are now real
mountain objects, built procedurally in `source/src/world.js`
from the parameters in `source/src/objects.js`:

- Torii: two tapered pillars, nuki tie beam, gaku plaque, shimaki
  and an upturned kasagi, in vermilion lacquer.
- Hut: stacked log walls (11 courses), gabled roof at 35°,
  chimney, door at +x.
- Eagle: broad tapered wings with a real flap (span in the aux
  channel), fusiform body, head, beak, fanned tail; dark brown
  back, pale belly, white head and tail.
- Birds: slim body, tapered wings that flap, fanned tail.
- Pines: trunks taper from base to crown with a root flare and
  bark shading, branch whorls in seven tiers with visible
  drooping branch stems, and foliage as needle-cluster sprays
  (thin divergent blades, irregular crown profile, apical
  shoot) instead of smooth cones. Rocks keep their layered
  beds and gain snow on high up-facing surfaces.

## Mountain atmosphere

The first port kept the original's underwater look underneath the
mountain objects: a blue depth-fog, caustic light webs, a water
surface with refraction, and sun dimmed below y=0. The atmosphere
is now mountain air:

- Sky-blue ambient from above, warm ground bounce from below;
  in the sunset zone the light turns warm gold instead of purple.
- Fog is neutral aerial perspective (near clear blue, far warm
  haze), not underwater light absorption; the sun is no longer
  dimmed below the valley floor.
- Caustics are gone: the animated texture is now soft billow
  noise, and terrain/leaves/eagle get gentle dappled sunlight
  instead of a caustic web.
- The cloud sea is a cloud layer, not a water surface: no
  refraction, sky reflection only. The lake keeps its sky
  reflection and shore foam; the waterfall is unchanged.
- Rock keeps layered beds and snow, with moss instead of algae
  and autumn-crimson ground cover in the sunset zone instead of
  purple. Loading text and comments no longer mention the seabed.

WebGPU rendering was **not** verified in this environment: no WebGPU
adapter is available here, so the page shows only the menu and the
"No WebGPU adapter found" guidance. What was verified: node tests
(40/40), JS syntax of every source file, the esbuild bundle
(99.9 kB), the headless mesh smoke test, and the WebGPU-missing
error path. Verify the 3D scene on a WebGPU-capable Chrome/Edge
or iOS 26+ Safari.
