/* Debug overlay for the map: grids, site names, and every road, vehicle, house, building, tank, pylon, pole and asset
   numbered by kind (r1, c1, h1 ...). Toggle with the bug button (bottom right), the ` key, or open the page with ?debug.
   Hover a label for its full name and coordinates; type a code (e.g. h12) to find it; click the map to copy the canvas
   pixel under the cursor (the format SITES in src/map.js uses). Reads Assets.map.debug, which render() fills in.
   Namespace: Assets.debug */
(function () {
  const A = window.Assets = window.Assets || {};
  const CX = 800, CY = 500, NS = 'http://www.w3.org/2000/svg';
  const f = n => (Math.round(n * 10) / 10).toString();

  // kind -> [panel label, colour]
  const KINDS = {
    c: ['Cars', '#e0245e'], t: ['Tankers', '#d9480f'], v: ['Vessels', '#0b7285'],
    r: ['Roads', '#c2255c'], l: ['Power lines', '#1c7ed6'],
    h: ['Houses + huts', '#2f9e44'], b: ['Buildings', '#5f3dc4'], k: ['Fuel tanks', '#e67700'],
    w: ['Wind turbines', '#0c8599'], p: ['Pylons', '#495057'], d: ['Distribution poles', '#795548'], a: ['Other assets', '#364fc7']
  };
  const LAYERS = [
    ['grid-world', 'World grid (x, y units)', false], ['grid-canvas', 'Canvas grid (px)', false], ['sites', 'Site names', true],
    ['k-r', 'Roads  r', true], ['k-l', 'Power lines  l', false], ['k-c', 'Cars  c', true], ['k-t', 'Tankers  t', true], ['k-v', 'Vessels  v', true],
    ['k-h', 'Houses + huts  h', true], ['k-b', 'Buildings  b', true], ['k-k', 'Fuel tanks  k', false], ['k-w', 'Wind turbines  w', true],
    ['k-p', 'Pylons  p', false], ['k-d', 'Distribution poles  d', false], ['k-a', 'Other assets  a', true], ['names', 'Asset names under codes', false]
  ];

  const css = `
  #dbg-btn{position:fixed;right:14px;bottom:14px;z-index:30;width:42px;height:42px;border-radius:50%;border:0;cursor:pointer;
    background:#1d2b3a;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.3);display:grid;place-items:center}
  #dbg-btn[aria-pressed=true]{background:#e0245e}
  #dbg-panel{position:fixed;right:14px;bottom:64px;z-index:30;width:250px;max-height:calc(100vh - 90px);overflow:auto;display:none;
    background:rgba(255,255,255,.94);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:10px 12px;font:12px/1.35 "Segoe UI",system-ui,sans-serif;color:#1d2b3a}
  #dbg-panel.on{display:block}
  #dbg-panel h4{font-size:12px;margin:4px 0 6px;text-transform:uppercase;letter-spacing:.05em}
  #dbg-panel label{display:flex;align-items:center;gap:6px;padding:1px 0;cursor:pointer}
  #dbg-panel .sw{width:10px;height:10px;border-radius:3px;flex:none}
  #dbg-panel .n{margin-left:auto;color:#5d6f82}
  #dbg-panel input[type=text]{width:100%;padding:5px 7px;border:1px solid #cfdae5;border-radius:6px;font:inherit;margin:4px 0}
  #dbg-pos,#dbg-find{font-family:Consolas,monospace;font-size:11px;background:#f1f4f7;border-radius:6px;padding:5px 7px;margin:4px 0;white-space:pre-wrap}
  #dbg .tag text{font:700 7.5px "Segoe UI",Arial,sans-serif;fill:#fff;text-anchor:middle;pointer-events:none}
  #dbg .tag text.nm{font-weight:600;font-size:6px;fill:#1d2b3a;stroke:#fff;stroke-width:2;paint-order:stroke}
  #dbg .tag{cursor:help}
  #dbg .tag.hit rect{stroke:#ffd43b;stroke-width:3}
  #dbg .tag.hit{animation:dbg-pop 1s ease-in-out 3}
  @keyframes dbg-pop{50%{transform:scale(1.8)}}
  #dbg .site text{font:800 11px "Segoe UI",Arial,sans-serif;fill:#1d2b3a;stroke:#fff;stroke-width:3;paint-order:stroke;text-anchor:middle}
  #dbg .gl text{font:600 6px Consolas,monospace;fill:#1c4f8a;stroke:#fff;stroke-width:1.6;paint-order:stroke}
  #dbg .gc text{font:600 7px Consolas,monospace;fill:#a61e4d;stroke:#fff;stroke-width:1.6;paint-order:stroke}
  #dbg:not(.names) .nm{display:none}`;

  let built = false, open = false;
  const root = () => document.querySelector('#map > g');

  // a numbered pill; with the full name below it and in the hover title
  function pill(code, kind, name, extra = '') {
    const w = code.length * 4.6 + 7, col = (KINDS[kind] || KINDS.a)[1];
    return `<g class="tag" data-code="${code}" ${extra}><title>${code} · ${name}</title><rect x="${f(-w / 2)}" y="-5.5" width="${f(w)}" height="11" rx="5.5" fill="${col}" stroke="#fff" stroke-width="1"/>` +
      `<text y="2.7">${code}</text><text class="nm" y="12">${name}</text></g>`;
  }
  const at = (x, y, z, inner) => { const p = P(x, y, z); return `<g transform="translate(${f(p[0])},${f(p[1])})">${inner}</g>`; };
  const canvasOf = (x, y) => { const p = P(x, y, 0); return [Math.round(p[0] + CX), Math.round(p[1] + CY)]; };
  const where = (x, y) => { const c = canvasOf(x, y); return `world ${Math.round(x)}, ${Math.round(y)} · canvas ${c[0]}, ${c[1]}`; };
  // point at a fraction of a polyline's length
  function along(pts, t) {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const d = t * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const u = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
  }

  function build() {
    const D = A.map && A.map.debug, g = root();
    if (!D || !g) return false;
    const layer = (id, inner) => `<g data-layer="${id}">${inner}</g>`;
    const out = {};
    const add = (id, s) => { out[id] = (out[id] || '') + s; };

    // world grid: lines every 50 units (every 100 darker), labels every 200
    let gw = '';
    for (let v = -1100; v <= 1100; v += 50) {
      const op = v % 100 ? .18 : .4, a = P(v, -1100), b = P(v, 1100), c = P(-1100, v), d = P(1100, v);
      gw += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}M${f(c[0])} ${f(c[1])}L${f(d[0])} ${f(d[1])}" stroke="#1c7ed6" stroke-width="${v ? .6 : 1.6}" opacity="${v ? op : .8}"/>`;
    }
    for (let x = -1000; x <= 1000; x += 200) for (let y = -1000; y <= 1000; y += 200) {
      const [cx, cy] = canvasOf(x, y); if (cx < -50 || cx > 1650 || cy < -50 || cy > 1050) continue;
      gw += at(x, y, 0, `<circle r="1.6" fill="#1c7ed6"/><text x="3" y="-3">${x},${y}</text>`);
    }
    add('grid-world', `<g class="gl">${gw}</g>`);
    // canvas grid: every 50 px (every 100 darker), labels every 100
    let gc = '';
    for (let x = 0; x <= 1600; x += 50) gc += `<path d="M${x - CX} ${-CY}V${CY}" stroke="#c2255c" stroke-width=".6" opacity="${x % 100 ? .15 : .35}"/>`;
    for (let y = 0; y <= 1000; y += 50) gc += `<path d="M${-CX} ${y - CY}H${CX}" stroke="#c2255c" stroke-width=".6" opacity="${y % 100 ? .15 : .35}"/>`;
    for (let x = 100; x < 1600; x += 100) for (let y = 100; y < 1000; y += 100) gc += `<text x="${x - CX + 2}" y="${y - CY - 2}">${x},${y}</text>`;
    add('grid-canvas', `<g class="gc">${gc}</g>`);

    // sites: crosshair at the anchor + full name
    Object.entries(A.map.SITES).forEach(([k, [cx, cy, name]]) => {
      add('sites', `<g class="site" transform="translate(${cx - CX},${cy - CY})"><title>${k}: ${name} · canvas ${cx}, ${cy}</title>` +
        `<path d="M-7 0H7M0 -7V7" stroke="#1d2b3a" stroke-width="1.6"/><circle r="3" fill="none" stroke="#1d2b3a" stroke-width="1.2"/><text y="-10">${name}</text></g>`);
    });

    // roads (world polylines) and power lines (wire height)
    const poly = (pts, z, col, dash) => `<polyline points="${pts.map(p => P(p[0], p[1], z)).map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="${dash}" opacity=".85"/>`;
    D.roads.forEach(r => {
      add('k-r', poly(r.pts, 0, KINDS.r[1], '6 4'));
      (r.code === 'r1' ? [.125, .375, .625, .875] : [.5]).forEach(t => { const [x, y] = along(r.pts, t); add('k-r', at(x, y, 0, pill(r.code, 'r', r.name))); });
    });
    D.lines.forEach(l => {
      add('k-l', poly(l.pts, 38, KINDS.l[1], '3 3'));
      const [x, y] = along(l.pts, .5); add('k-l', at(x, y, 38, pill(l.code, 'l', l.name)));
    });

    // moving things ride along with the vehicle (same animateMotion as its sprite)
    D.movers.forEach(m => { const k = m.code[0]; add('k-' + k, `<g><g transform="translate(0,-16)">${pill(m.code, k, m.name)}</g>${m.motion}</g>`); });
    // everything else where it stands
    D.marks.forEach(m => add('k-' + m.kind, at(m.x, m.y, m.z, `<g transform="translate(0,-9)">${pill(m.code, m.kind, m.name + '\n' + where(m.x, m.y))}</g>`)));

    const svg = `<g id="dbg">${LAYERS.filter(([id]) => id !== 'names').map(([id]) => layer(id, out[id] || '')).join('')}</g>`;
    g.insertAdjacentHTML('beforeend', svg);
    // the hover title shows name + coordinates; the visible name line only the name
    g.querySelectorAll('#dbg .tag text.nm').forEach(t => { t.textContent = t.textContent.split('\n')[0]; });
    built = true;
    return true;
  }

  function apply() {
    const d = document.getElementById('dbg'); if (!d) return;
    d.style.display = open ? '' : 'none';
    LAYERS.forEach(([id]) => {
      const on = document.getElementById('dbg-l-' + id).checked;
      if (id === 'names') d.classList.toggle('names', on);
      else { const l = d.querySelector(`[data-layer="${id}"]`); if (l) l.style.display = on ? '' : 'none'; }
    });
    document.querySelector('.page').style.visibility = open && document.getElementById('dbg-hideui').checked ? 'hidden' : '';
  }

  function toggle(force) {
    open = force ?? !open;
    if (open && !built && !build()) { open = false; return; }
    document.getElementById('dbg-panel').classList.toggle('on', open);
    document.getElementById('dbg-btn').setAttribute('aria-pressed', open);
    apply();
  }

  function find(q) {
    const out = document.getElementById('dbg-find');
    document.querySelectorAll('#dbg .tag.hit').forEach(t => t.classList.remove('hit'));
    q = q.trim().toLowerCase(); if (!q) { out.textContent = ''; return; }
    const hits = [...document.querySelectorAll('#dbg .tag')].filter(t => t.dataset.code.toLowerCase() === q);
    hits.forEach(t => {
      t.classList.add('hit');
      const layer = t.closest('[data-layer]'); if (layer && layer.style.display === 'none') { layer.style.display = ''; document.getElementById('dbg-l-' + layer.dataset.layer).checked = true; }
    });
    out.textContent = hits.length ? hits[0].querySelector('title').textContent : 'no match';
  }

  function ui() {
    document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
    const counts = k => { const D = A.map && A.map.debug; return D ? (D.count[k] || 0) : ''; };
    const rows = LAYERS.map(([id, label, on]) => {
      const k = id.startsWith('k-') ? id[2] : null;
      return `<label><input type="checkbox" id="dbg-l-${id}" ${on ? 'checked' : ''}>${k ? `<span class="sw" style="background:${KINDS[k][1]}"></span>` : ''}${label}${k ? `<span class="n">${counts(k)}</span>` : ''}</label>`;
    }).join('');
    document.body.insertAdjacentHTML('beforeend',
      `<button id="dbg-btn" type="button" title="Debug overlay (\`)" aria-pressed="false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M9 4l1.5 2M15 4l-1.5 2M4 10h4M16 10h4M4 15h4M16 15h4M12 10v10"/></svg></button>` +
      `<div id="dbg-panel"><h4>Map debug</h4><div id="dbg-pos">move over the map</div>` +
      `<input type="text" id="dbg-q" placeholder="find a code: c3, h12, r4, w2 …"><div id="dbg-find"></div>` +
      `<label><input type="checkbox" id="dbg-hideui" checked>Hide sign-in page</label><h4>Layers</h4>${rows}</div>`);
    document.getElementById('dbg-btn').addEventListener('click', () => toggle());
    document.getElementById('dbg-panel').addEventListener('change', e => { if (e.target.type === 'checkbox') apply(); });
    document.getElementById('dbg-q').addEventListener('input', e => find(e.target.value));
    document.addEventListener('keydown', e => { if (e.key === '`' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) toggle(); });

    // cursor readout + click to copy the canvas pixel
    const map = document.getElementById('map'), pos = document.getElementById('dbg-pos');
    let last = null;
    window.addEventListener('mousemove', e => {
      if (!open) return;
      const pt = map.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const c = pt.matrixTransform(map.getScreenCTM().inverse()), w = A.map.G(c.x, c.y);
      last = [Math.round(c.x), Math.round(c.y)];
      pos.textContent = `canvas ${last[0]}, ${last[1]}\nworld  ${Math.round(w[0])}, ${Math.round(w[1])}\nclick map to copy canvas px`;
    });
    map.addEventListener('click', () => {
      if (!open || !last || !navigator.clipboard) return;
      navigator.clipboard.writeText(`[${last[0]}, ${last[1]}]`).then(() => { pos.textContent += `\ncopied [${last[0]}, ${last[1]}]`; }, () => {});
    });
    // counts are known once the map has rendered
    window.addEventListener('load', () => {
      LAYERS.forEach(([id]) => { if (!id.startsWith('k-')) return; const n = document.querySelector(`#dbg-l-${id} ~ .n`); if (n) n.textContent = counts(id[2]); });
      if (/[?&]debug\b/.test(location.search)) toggle(true);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();
  A.debug = { toggle, find };
})();
