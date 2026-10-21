# Asset style guide (for the login-page isometric scenes)

## Look we are aiming for (from the reference images in the project root)
- `example (1).jpg`: clean isometric 3D-render look. Off-white rounded slab base, faint grid, soft
  contact shadows, small realistic props (panel frames, bolts, cabinet doors, louvres).
- `db85ff1287...jpg`: crisp isometric vector. Silver/grey cylinders with a vertical
  highlight band, green accents, thin dark outlines on edges, panel seams.
- `example (3).jpg`: soft clay/3D render. Rounded corners, bevelled edges, saturated but soft blue.
- `example (4).jpg` and `b8858...jpg`: realistic white industrial forms, ribbed walls, pipes and orange valves.

Overall: **"premium isometric vector"**. Flat isometric geometry, but every surface reads as a
material because of gradients, edge highlights, seams, ambient occlusion and a little grain.

## Rules
1. **Use the scene helpers already in `index.html`.** They are globals: `P(x,y,z)` projection
   (NOIC swaps it for an oblique projection, so use `P` and never hard-code iso maths), `pts`, `poly`, `T`,
   `box`, `cyl`, `winL`, `winR`, `C` (colour sets `[top,left,right]`), `label`, `gtree`, `lamp`.
   Read them before you write anything. You may also write better versions inside your own file.
2. **Light comes from the top-left.** Top faces are lightest, left (+y) faces mid, right (+x) faces darkest.
   Cylinders: dark on the left edge → highlight band about 30% in from the left → darker on the right
   (a horizontal `linearGradient` in `objectBoundingBox` units).
3. **Material cues** (choose what fits):
   - Metal: banded gradient, thin 0.4–0.6px lighter top-edge line, rivet dots, weld seams, ribbing.
   - Concrete: flat mid-grey, subtle grain, darker stains near the base.
   - Glass: blue gradient plus a diagonal white reflection streak at 20–35% opacity.
   - Paint: slight gradient, darker 0.5px outline on the outer silhouette (`stroke` of about 15% black).
   - Ground: grass, soil, gravel or asphalt as `<pattern>` textures plus a low-opacity grain filter.
4. **Ambient occlusion.** Every object sitting on the ground gets a soft dark ellipse or polygon under or behind it
   (`#0b1e33` at 10–20% opacity, or `fill="url(#ao-soft)"`). Inside corners get a dark 1–2px strip.
5. **Edges.** Put a 0.5px highlight line on the top-front edges of boxes, which gives a bevel feel.
6. **Performance.** These SVGs animate continuously. **Do not** put `filter=` on many small elements.
   Filters (grain/blur) go only on a few large surfaces per scene. Prefer gradients and `<pattern>`.
   Keep each asset call under about 150 SVG elements.
7. **IDs.** All `<defs>` ids are global across the page. Prefix yours with your file's prefix
   (for example `silo-`, `ship-`, `trk-`, `car-`, `hs-`, `bld-`, `ter-`). Register them with `Assets.addDefs(...)`.
   Use `objectBoundingBox` gradients so one def serves every instance.
8. **Animation.** Keep the existing animation classes: `spin`, `puff`, `flow`, `bob`, `ring`, `glow`,
   `flick`, `pulse`. Do not add new `@keyframes` in CSS. If you need new motion, use SMIL (`<animate>`,
   `<animateTransform>`) inside your markup.
9. **No external assets, no images, no fonts.** Use pure SVG strings built by JS functions.
10. **Classic script, not an ES module** (the page is opened via `file://`). Wrap your file in
    `(function(){ ... })();` and attach your public API to `window.Assets`.

## Shared defs available from `src/core.js`
- `url(#ao-soft)`: radial gradient, a dark centre fading to transparent. Use it for contact shadows on ellipses.
- `url(#tx-grain)`: filter that adds subtle grain to a large filled shape.
- `url(#metal-h)`: horizontal silver cylinder gradient.
- `url(#glass-v)`: glass gradient.
- `url(#sheen)`: white diagonal highlight, 0→30%→0 opacity.
