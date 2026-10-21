/* Export the energy assets drawn by src/assets/energy.js as standalone SVG files in art/svg/09-energy/.
   Usage (from the project root):  node tools/export-energy.js   then   node tools/build-exports-manifest.js

   Each file's viewBox is the asset's own frame (0,0 = its ground anchor, or the satellite's body), drawn at 4x pixel size,
   like the other files in art/svg. The map's CSS animations (spinning rotors, glowing lights, flowing current) are
   copied into each file as a <style>, so they keep moving when the map draws the file with <image>.
   Do not re-run this over a file you have edited in Illustrator etc.: it overwrites it. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), outDir = path.join(root, 'art', 'svg', '09-energy');

// frames [x, y, w, h]: the drawing's bounding box padded by 6 units, plus room for the animations
// (the rotor's full sweep, the biogas exhaust puff, the satellite's pulsing footprint)
const FRAMES = {
  'wind-turbine-a': [-42, -112, 84, 120],
  'wind-turbine-b': [-42, -112, 84, 120],
  'wind-turbine-c': [-42, -112, 84, 120],
  'solar-plant': [-66.6, -20, 154, 100],
  'hydro-powerhouse': [-27.8, -24.2, 69.3, 56.2],
  'biogas-plant': [-32.8, -75, 78.6, 111],
  'substation': [-51, -24, 115.9, 87.8],
  'distribution-pole': [-11.6, -30, 23.2, 37.2],
  'distribution-pole-transformer': [-11.6, -30, 23.2, 37.2],
  'gis-satellite': [-43, -28.5, 345, 201.5]
};

// load the asset scripts into one shared global scope (iso.js declares its helpers as top-level consts)
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const src = ['src/core.js', 'src/iso.js', 'src/assets/energy.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
vm.runInContext(src + '\n;this.__defs = Assets.defsMarkup(); this.__E = Assets.energy;', ctx);
const E = ctx.__E, defsAll = ctx.__defs;

const DRAW = {
  'wind-turbine-a': () => E.windTurbine(0, 0, { h: 72, dur: 4.5 }),
  'wind-turbine-b': () => E.windTurbine(0, 0, { h: 72, dur: 5.2, delay: 1.4 }),
  'wind-turbine-c': () => E.windTurbine(0, 0, { h: 72, dur: 5.9, delay: 2.6 }),
  'solar-plant': () => E.solarFarm(),
  'hydro-powerhouse': () => E.hydroHouse(),
  'biogas-plant': () => E.biogas(),
  'substation': () => E.substation({ w: 64, d: 48 }),
  'distribution-pole': () => E.pole(0, 0),
  'distribution-pole-transformer': () => E.pole(0, 0, { tx: true }),
  'gis-satellite': () => E.satBeam(240, 140, 50) + E.satellite()
};

// the map's animation classes (from index.html)
const STYLE = `<style>
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes rise{0%{transform:translateY(0) scale(.6);opacity:0}25%{opacity:.85}100%{transform:translateY(-40px) scale(1.5);opacity:0}}
@keyframes flow{to{stroke-dashoffset:-24}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
@keyframes ring{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.7);opacity:0}}
@keyframes glow{0%,100%{opacity:.35}50%{opacity:1}}
.spin{animation:spin 3.5s linear infinite}
.puff{animation:rise 4s ease-out infinite;transform-box:fill-box;transform-origin:center}
.flow{stroke-dasharray:6 6;animation:flow .8s linear infinite}
.bob{animation:bob 2.4s ease-in-out infinite}
.ring{animation:ring 2.4s ease-out infinite;transform-box:fill-box;transform-origin:center}
.glow{animation:glow 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`;

// pick the <defs> entries a drawing references (url(#id) / href="#id")
const defsById = {};
for (const m of defsAll.matchAll(/<(\w+) id="([^"]+)"[\s\S]*?<\/\1>/g)) defsById[m[2]] = m[0];
const usedDefs = body => [...new Set([...body.matchAll(/(?:url\(#|href="#)([\w-]+)/g)].map(m => m[1]))].filter(id => defsById[id]).map(id => defsById[id]).join('');

fs.mkdirSync(outDir, { recursive: true });
for (const [name, draw] of Object.entries(DRAW)) {
  const body = draw(), [x, y, w, h] = FRAMES[name];
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg viewBox="${x} ${y} ${w} ${h}" xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * 4)}" height="${Math.round(h * 4)}">` +
    `${STYLE}<defs>${usedDefs(body)}</defs>${body}</svg>\n`;
  fs.writeFileSync(path.join(outDir, name + '.svg'), svg);
}
console.log('wrote', Object.keys(DRAW).length, 'files to', path.relative(root, outDir));
