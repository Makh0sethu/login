# Common brief for asset agents

Project: `C:\Users\Mahosethu\Desktop\login`. `index.html` is a login page with 5 animated isometric
SVG scenes: power station, NOIC fuel pipeline (wide, **oblique** projection), Petrotrade fuel station,
Powertel telecoms city, and REA rural electrification. The scenes are built from JS string helpers.

Your job: build ONE asset file (`src/assets/<name>.js`) that is more realistic and more textured than the
current flat shapes, in the style of the reference images. The main session wires it into the page.

## Read first
- `docs/STYLE.md`: the art rules. Follow them.
- `src/iso.js`: the helpers (`P`, `pts`, `poly`, `T`, `box`, `cyl`, `winL`, `winR`, `C`, `label`, `gtree`, `lamp`).
- `src/core.js`: the `window.Assets` registry, `Assets.addDefs`, and the shared defs.
- `index.html`: the scene functions where your asset is used today. See your specific notes.
- The reference images (no longer in the project; ask for them if you need them): `example (1).jpg`, `example (3).jpg`, `example (4).jpg`,
  `db85ff1287db3a12318dbcd260c74d47.jpg`, `Screenshot 2026-10-19 224725.png`.

## Hard rules
- Write **only** `src/assets/<name>.js` and `src/assets/preview/<name>.html`. Do **not** edit `index.html`,
  `iso.js`, `core.js` or other agents' files.
- Use a classic script wrapped in an IIFE. Attach the public API to `window.Assets` (namespace given below).
  The functions return SVG markup strings. Call `P` and the other helpers lazily, inside your functions,
  never at load time, because the NOIC scene swaps `P` for an oblique projection at runtime.
- Prefix every `<defs>` id with your prefix and register them through `Assets.addDefs(...)` at load time.
  Defs are mounted once into a hidden `<svg>` by `Assets.mountDefs()`. Inline-SVG `url(#id)`
  references across the page resolve against it.
- Coordinates are world units: x goes right-down, y goes left-down, z goes up. One unit is roughly
  1px at scale. Match the sizes in the current scene code so the result drops in.
- Keep the element count sensible (see STYLE.md §6). No filters on small repeated parts.
- Keep the API signature exactly as specified, so the main session can wire it without reading your code.
  You may add optional `opts` fields.

## Preview + verification (required)
1. Create `src/assets/preview/<name>.html`. It loads `../core.js`, `../iso.js`, `../<name>.js`, copies the CSS
   animation keyframes/classes from `index.html` (lines with `@keyframes` and `.spin` … `.pulse`),
   calls `Assets.mountDefs()`, and renders every variant of your asset on a light background
   (`#eef3f8`) in `<svg>` tiles with `overflow:visible`. Include one tile that uses the NOIC oblique
   projection: temporarily set `P = (x, y, z = 0) => [x - y * 0.55, y * 0.7 - z];`, render, then restore.
2. Run `node --check src/assets/<name>.js`.
3. Smoke-test in Node. Load `core.js`, `iso.js` and your file into one `vm` context with a stub
   `window`/`document`, then call every API function. Assert that it returns a non-empty string with
   balanced `<g>`/`</g>` tags and no `NaN` or `undefined` in it.
4. If you have browser tools, open the preview (`file:///C:/Users/Mahosethu/Desktop/login/src/assets/preview/<name>.html`),
   screenshot it and iterate on the look. Aim for the reference quality: gradients, seams, highlights, AO shadows.

## Report back (keep it short)
Give the exact API (function signatures plus opts), the anchor point and footprint of each asset in world units,
which existing scene code it replaces, and anything the main session must know to wire it in.
