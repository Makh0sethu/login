// builds the map-only pan/zoom demo into dist-demo/index.html:  node tools/build-demo.js   (needs: npm install)
// One self-contained file: every script demo/index.html loads, plus its own inline script, bundled into one minified
// script (console calls dropped, no source map), the CSS minified, and the only files the map draws inlined as data: URIs:
// the art/svg files listed in USE_EXPORTS (src/map.js) and logos/moepd.png (the MoEPD SUV livery, src/assets/cars.js).
// No art/png files are used by the map, so none ship. Keep KEEP in step with USE_EXPORTS.
const fs = require('fs'), path = require('path'), esbuild = require('esbuild');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'dist-demo');
const KEEP = k => k === '06-houses/school' || k.startsWith('09-energy/');
const read = rel => fs.readFileSync(path.join(root, rel));
const dataUri = (rel, type) => `data:${type};base64,${read(rel).toString('base64')}`;

let html = read('demo/index.html').toString();

// the files the map draws, keyed by the path Assets.url() is asked for (see src/core.js)
global.window = {};
require(path.join(root, 'art/manifest.js'));
const all = window.Assets.exportsManifest, man = {}, files = { 'logos/moepd.png': dataUri('logos/moepd.png', 'image/png') };
Object.keys(all).filter(KEEP).forEach(k => { const { png, ...e } = all[k]; man[k] = e; files[e.svg] = dataUri(e.svg, 'image/svg+xml'); });

// classic scripts share one global scope, so they are concatenated into a single function scope, in page order
const parts = [`window.Assets = { files: ${JSON.stringify(files)} };`];
html = html.replace(/<script src="([^"]+)"><\/script>\n?/g, (m, src) => {
  parts.push(src === 'art/manifest.js' ? `window.Assets.exportsManifest = ${JSON.stringify(man)};` : read(src).toString());
  return '';
});
html = html.replace(/<script>([\s\S]*?)<\/script>/, (m, js) => { parts.push(js); return '<script>@@JS@@</script>'; });
const js = esbuild.transformSync(`(function () {\n${parts.join('\n;\n')}\n})();`,
  { minify: true, drop: ['console', 'debugger'], legalComments: 'none', target: ['chrome90', 'safari14'] }).code.trim();
html = html.replace(/<style>([\s\S]*?)<\/style>/, (m, css) => `<style>${esbuild.transformSync(css, { loader: 'css', minify: true }).code.trim()}</style>`);
html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace('@@JS@@', () => js.replace(/<\/script/gi, '<\\/script'));

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log(`dist-demo/index.html: ${(html.length / 1024).toFixed(0)} KB`);
