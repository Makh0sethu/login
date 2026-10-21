/* Isometric scene helpers (globals shared by index.html and assets/*.js). */
/* ---------- isometric helpers ---------- */
const K = 0.866;
let P = (x, y, z = 0) => [(x - y) * K, (x + y) * 0.5 - z];
const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const poly = (a, fill, extra = '') => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
const T = (x, y, z, inner, extra = '') => { const [sx, sy] = P(x, y, z); return `<g transform="translate(${sx.toFixed(1)},${sy.toFixed(1)})" ${extra}>${inner}</g>`; };

// colour sets [top,left,right]
const C = {
  white:['#ffffff','#dfe7ef','#c7d3df'], grey:['#e9eef3','#c9d3dd','#b2bfcc'],
  dark:['#56626f','#3f4954','#323a44'], blue:['#4aa3df','#2f7fb8','#256a9c'],
  red:['#f06a5f','#d4493e','#b83a30'], green:['#4f9a5d','#2f6b3a','#265830'],
  gold:['#f2c35c','#d9a53c','#bf8f2c'], navy:['#4b5c9a','#34447a','#2b3866'],
  black:['#3a3f46','#23272c','#1b1e22'], water:['#7cc4ec','#5aa8d4','#4a94c0'],
  orange:['#ffb15c','#f08c2a','#d4741a'], glass:['#9fd3f2','#7bb9df','#62a3cb']
};

function box(x, y, z, w, d, h, c, extra = '') {
  return `<g ${extra}>` +
    poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], c[1]) +
    poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], c[2]) +
    poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], c[0]) + '</g>';
}
// window on the left face (plane y)
const winL = (x, y, z, w, h, fill, extra = '') => poly([P(x, y, z), P(x + w, y, z), P(x + w, y, z + h), P(x, y, z + h)], fill, extra);
// window on the right face (plane x)
const winR = (x, y, z, w, h, fill, extra = '') => poly([P(x, y, z), P(x, y + w, z), P(x, y + w, z + h), P(x, y, z + h)], fill, extra);

function cyl(x, y, z, r, h, c, extra = '') {
  const [cx, cy] = P(x, y, z), ry = r * 0.5;
  return `<g ${extra}><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="${c[2]}"/>` +
    `<rect x="${cx - r}" y="${cy - h}" width="${2 * r}" height="${h}" fill="${c[1]}"/>` +
    `<rect x="${cx + r * 0.25}" y="${cy - h}" width="${r * 0.75}" height="${h}" fill="${c[2]}" opacity=".55"/>` +
    `<ellipse cx="${cx}" cy="${cy - h}" rx="${r}" ry="${ry}" fill="${c[0]}"/></g>`;
}

// floating plate: x -a..a, y -b..b
function plate(a, b, top = '#f6f9fc') {
  const z0 = 0, t = 9;
  let s = poly([P(-a, b, -t), P(a, b, -t), P(a, b, 0), P(-a, b, 0)], '#cfd9e3') +
          poly([P(a, -b, -t), P(a, b, -t), P(a, b, 0), P(a, -b, 0)], '#b9c6d3') +
          poly([P(-a, -b, 0), P(a, -b, 0), P(a, b, 0), P(-a, b, 0)], top);
  for (let i = -a + 20; i < a; i += 20) s += `<polyline points="${pts([P(i, -b, 0), P(i, b, 0)])}" stroke="#e1e9f0" fill="none"/>`;
  for (let j = -b + 20; j < b; j += 20) s += `<polyline points="${pts([P(-a, j, 0), P(a, j, 0)])}" stroke="#e1e9f0" fill="none"/>`;
  return s;
}
const ground = (x, y, w, d, fill, z = 0.3) => poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], fill);
const wrap = (inner) => `<g transform="translate(210,130)">${inner}</g>`;
const label = (x, y, z, text, color = '#1d2b3a', size = 9, weight = 700, extra = '') => {
  const [sx, sy] = P(x, y, z);
  return `<text x="${sx}" y="${sy}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" ${extra}>${text}</text>`;
};

/* ---- shared detail helpers (plate / wrap / ground are used by the preview pages) ---- */
const lamp = (x, y, h = 26, col = '#ffe27a') => T(x, y, 0, `<rect x="-1" y="-${h}" width="2" height="${h}" fill="#7d8b99"/><path d="M0 -${h} h6" stroke="#7d8b99" stroke-width="1.6"/><circle cx="6" cy="-${h - 2}" r="6" fill="${col}" opacity=".35" class="glow"/><circle cx="6" cy="-${h - 2}" r="2.2" fill="${col}"/>`);
const person = (x, y, col) => T(x, y, 0, `<ellipse rx="3" ry="1.5" fill="#00000018"/><rect x="-2" y="-9" width="4" height="9" rx="1.5" fill="${col}"/><circle cy="-12" r="2.4" fill="#f1c9a0"/>`);
const fence = (x0, y0, x1, y1, h = 7) => {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 7)); let s = '';
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; s += `<polyline points="${pts([P(x, y, 0), P(x, y, h)])}" stroke="#8d9bab" stroke-width="1" fill="none"/>`; }
  return s + `<polyline points="${pts([P(x0, y0, h), P(x1, y1, h)])}" stroke="#8d9bab" stroke-width="1" fill="none"/><polyline points="${pts([P(x0, y0, h / 2), P(x1, y1, h / 2)])}" stroke="#b6c2cf" stroke-width=".7" fill="none"/>`;
};
const packet = (arr, dur, color, delay = 0) => `<circle r="2.6" fill="${color}" stroke="#fff" stroke-width=".8"><animateMotion dur="${dur}s" begin="${delay}s" repeatCount="indefinite" path="M${arr.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')}"/></circle>`;

