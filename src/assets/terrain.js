/* Terrain / ground assets: Assets.terrain.{slab,power,noic,petro,ptel,rea}. Defs prefix: ter-.
   Ground patches are drawn in WORLD units inside a <g transform="matrix(...)"> built lazily from P,
   so the same code (and the same world-space <pattern>s) works for the iso and the NOIC oblique projection. */
(function () {
  const A = window.Assets = window.Assets || {};
  let uid = 0;

  /* ---------- small utils ---------- */
  const f = n => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? '0' : String(v); };
  const fm = n => { const v = +n.toFixed(4); return Object.is(v, -0) ? '0' : String(v); };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  // world-plane matrix at height z (maps world x,y to screen through the current P)
  const mat = (z = 0) => { const o = P(0, 0, z), ex = P(1, 0, z), ey = P(0, 1, z); return `matrix(${fm(ex[0] - o[0])} ${fm(ex[1] - o[1])} ${fm(ey[0] - o[0])} ${fm(ey[1] - o[1])} ${fm(o[0])} ${fm(o[1])})`; };
  const W = (inner, z = 0, extra = '') => `<g transform="${mat(z)}" ${extra}>${inner}</g>`;
  // world-space primitives (use inside W)
  const rr = (x0, y0, x1, y1, r) => {
    r = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
    return `M${f(x0 + r)} ${f(y0)}H${f(x1 - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x1)} ${f(y0 + r)}V${f(y1 - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x1 - r)} ${f(y1)}H${f(x0 + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x0)} ${f(y1 - r)}V${f(y0 + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x0 + r)} ${f(y0)}Z`;
  };
  const rect = (x, y, w, d, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(d)}" fill="${fill}" ${extra}/>`;
  const ell = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
  const segD = segs => segs.map(([x1, y1, x2, y2]) => `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`).join('');
  const stroke = (d, col, w, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" ${extra}/>`;
  // wobbly closed strip along x (world), for dirt paths / ragged edges
  const ragged = (x0, x1, y0, y1, amp, step, R) => {
    const top = [], bot = [];
    for (let x = x0; x <= x1 + 0.01; x += step) { top.push([x, y0 + (R() - .5) * 2 * amp]); bot.push([x, y1 + (R() - .5) * 2 * amp]); }
    return 'M' + top.concat(bot.reverse()).map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
  };
  const scatter = (R, n, x0, x1, y0, y1, ok = () => true) => {
    const out = []; let guard = 0;
    while (out.length < n && guard++ < n * 30) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (ok(x, y)) out.push([x, y, .55 + R() * .4]); }
    return out;
  };
  const inR = (x, y, x0, x1, y0, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

  /* ---------- screen-space sprinkles (one <path> each) ---------- */
  const tufts = (list, col) => {
    let d = '';
    for (const [x, y, k = 1] of list) {
      const [sx, sy] = P(x, y, 0);
      d += `M${f(sx - 2 * k)} ${f(sy)}Q${f(sx - 1.6 * k)} ${f(sy - 2.4 * k)} ${f(sx - 2.6 * k)} ${f(sy - 3.8 * k)}Q${f(sx - .6 * k)} ${f(sy - 2.4 * k)} ${f(sx - .1 * k)} ${f(sy - 1 * k)}` +
        `Q${f(sx + .2 * k)} ${f(sy - 3.4 * k)} ${f(sx + 1.3 * k)} ${f(sy - 4.6 * k)}Q${f(sx + 1.1 * k)} ${f(sy - 2 * k)} ${f(sx + 2 * k)} ${f(sy)}Z`;
    }
    return d ? `<path d="${d}" fill="${col}"/>` : '';
  };
  const dots = (list, col, r = 1, sq = .6, dy = 0) => {
    let d = '';
    for (const [x, y, k = 1] of list) { const [sx, sy] = P(x, y, 0), rx = r * k, ry = rx * sq; d += `M${f(sx - rx)} ${f(sy + dy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`; }
    return d ? `<path d="${d}" fill="${col}"/>` : '';
  };
  const stones = list => dots(list, '#0b1e33', 1.25, .55, .5).replace('<path', '<path opacity=".18"') + dots(list, '#c9c6bf', 1.1, .6) + dots(list, '#e9e7e2', .55, .55, -.35);

  /* ---------- defs (world-unit patterns; sizes are world units) ---------- */
  A.addDefs && A.addDefs(
    `<pattern id="ter-concrete" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#eef2f5"/><circle cx="4" cy="6" r=".35" fill="#d3dbe2"/><circle cx="15" cy="3" r=".3" fill="#cfd7df"/><circle cx="11" cy="15" r=".4" fill="#d6dde4"/><circle cx="19" cy="18" r=".3" fill="#fdfefe"/><circle cx="7" cy="19" r=".3" fill="#fdfefe"/><ellipse cx="17" cy="10" rx="3" ry="2" fill="#e4e9ee" opacity=".7"/></pattern>` +
    `<pattern id="ter-gravel" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#d3cec5"/><g fill="#b9b3a8"><ellipse cx="1.2" cy="1.4" rx=".8" ry=".6"/><ellipse cx="6.1" cy="2.3" rx=".6" ry=".5"/><ellipse cx="3.6" cy="6.8" rx=".9" ry=".6"/><ellipse cx="8.2" cy="7.4" rx=".5" ry=".4"/></g><g fill="#a49d91"><ellipse cx="4" cy="3.3" rx=".55" ry=".45"/><ellipse cx="7.4" cy="5" rx=".45" ry=".35"/><ellipse cx="1.3" cy="5.4" rx=".5" ry=".4"/></g><g fill="#ebe8e2"><ellipse cx="2.6" cy="2.6" rx=".45" ry=".35"/><ellipse cx="5.4" cy="5.6" rx=".5" ry=".35"/><ellipse cx="8" cy="1" rx=".35" ry=".3"/><ellipse cx=".6" cy="8.2" rx=".4" ry=".3"/></g></pattern>` +
    `<pattern id="ter-ballast" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#a0978a"/><g fill="#857c70"><ellipse cx="1" cy="1.2" rx=".8" ry=".6"/><ellipse cx="4.6" cy="2.4" rx=".7" ry=".5"/><ellipse cx="2.6" cy="5.4" rx=".8" ry=".6"/><ellipse cx="6.2" cy="6" rx=".5" ry=".4"/></g><g fill="#c2bbb0"><ellipse cx="3" cy="1" rx=".5" ry=".35"/><ellipse cx="5.8" cy="4" rx=".55" ry=".4"/><ellipse cx="1" cy="3.6" rx=".45" ry=".35"/><ellipse cx="4.4" cy="6.4" rx=".4" ry=".3"/></g></pattern>` +
    `<pattern id="ter-asphalt" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#8a949e"/><circle cx="1" cy="1" r=".35" fill="#7a848e"/><circle cx="3" cy="2.4" r=".3" fill="#9aa4ad"/><circle cx="1.8" cy="3.4" r=".25" fill="#727c86"/></pattern>` +
    `<pattern id="ter-grass" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#c3dda4"/><path d="M1 1.6l.5-1M3.6 2.2l.4-1.1M2.2 4.6l.5-1M4.8 5.2l.4-1" stroke="#a9cd86" stroke-width=".45" stroke-linecap="round"/><path d="M.4 3.4l.4-.9M5 .8l.4-.9M3 5.8l.3-.8" stroke="#d8ebc0" stroke-width=".4" stroke-linecap="round"/></pattern>` +
    `<pattern id="ter-savanna" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#dcd5a4"/><path d="M1 1.8l.5-1.1M4.2 2.6l.4-1.2M2.4 5.4l.5-1.1M5.8 6.2l.4-1" stroke="#c4b878" stroke-width=".45" stroke-linecap="round"/><circle cx="5.6" cy="4" r=".5" fill="#d2b88a"/><circle cx="1.2" cy="6" r=".4" fill="#cfb183"/><path d="M.4 4.2l.4-.9M6 1l.3-.9" stroke="#b9c487" stroke-width=".4" stroke-linecap="round"/></pattern>` +
    `<pattern id="ter-sand" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#efe4c4"/><circle cx="1" cy="1.4" r=".35" fill="#ddcca0"/><circle cx="3.6" cy="3.2" r=".3" fill="#f8f1de"/><circle cx="2.2" cy="4.2" r=".3" fill="#d8c597"/></pattern>` +
    `<pattern id="ter-tile" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#e8ecf0"/><path d="M0 .2H6M.2 0V6" stroke="#d2d9e0" stroke-width=".4"/><path d="M0 .65H6M.65 0V6" stroke="#f7f9fb" stroke-width=".3"/></pattern>` +
    `<pattern id="ter-dirt" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#dcc39c"/><circle cx="1" cy="1" r=".45" fill="#c7a679"/><circle cx="3.4" cy="2" r=".35" fill="#ecdcbf"/><circle cx="2.2" cy="3.8" r=".5" fill="#bf9a6c"/><circle cx="4.4" cy="4.4" r=".3" fill="#ead7b5"/></pattern>` +
    `<pattern id="ter-soil" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#ae6a43"/><circle cx="1" cy="1" r=".4" fill="#94552f"/><circle cx="3" cy="2.6" r=".35" fill="#c2825a"/><circle cx="1.6" cy="3.4" r=".3" fill="#8a4c2a"/></pattern>` +
    `<pattern id="ter-water" width="14" height="7" patternUnits="userSpaceOnUse"><rect width="14" height="7" fill="#86c6ea"/><path d="M1 2q2-1 4 0M8 5.5q2-1 4 0" stroke="#a8d9f4" stroke-width=".6" fill="none"/></pattern>` +
    // screen-space: grit/pebbles on earth side faces
    `<pattern id="ter-pebble" width="11" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#000" opacity=".16"/><circle cx="7.5" cy="1.2" r=".5" fill="#fff" opacity=".18"/><circle cx="5" cy="5" r="1" fill="#000" opacity=".12"/><circle cx="9.6" cy="4.4" r=".6" fill="#fff" opacity=".14"/><ellipse cx="1.5" cy="5.8" rx="1.2" ry=".6" fill="#000" opacity=".1"/></pattern>` +
    `<radialGradient id="ter-stain"><stop offset="0" stop-color="#3a3f45" stop-opacity=".34"/><stop offset=".55" stop-color="#3a3f45" stop-opacity=".14"/><stop offset="1" stop-color="#3a3f45" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ter-coal"><stop offset="0" stop-color="#1c1f23" stop-opacity=".5"/><stop offset=".6" stop-color="#1c1f23" stop-opacity=".2"/><stop offset="1" stop-color="#1c1f23" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ter-patch"><stop offset="0" stop-color="#9fc47c" stop-opacity=".55"/><stop offset="1" stop-color="#9fc47c" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ter-bare"><stop offset="0" stop-color="#d9bf93" stop-opacity=".9"/><stop offset=".7" stop-color="#d9bf93" stop-opacity=".5"/><stop offset="1" stop-color="#d9bf93" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="ter-sea" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5fa9d8"/><stop offset=".85" stop-color="#86c6ea"/><stop offset="1" stop-color="#b4def3"/></linearGradient>`
  );

  /* ---------- materials ---------- */
  const TOPS = {
    concrete: { fill: 'url(#ter-concrete)', bevel: '#dce3ea', side: '#e2e8ee' },
    grass: { fill: 'url(#ter-grass)', bevel: '#a8c886', side: '#e2e8ee' },
    savanna: { fill: 'url(#ter-savanna)', bevel: '#c9bd86', side: '#e2e8ee' },
    sand: { fill: 'url(#ter-sand)', bevel: '#e0cfa4', side: '#e2e8ee' },
    tile: { fill: 'url(#ter-tile)', bevel: '#d9e0e7', side: '#e2e8ee' }
  };
  const SOILS = {
    red: { base: '#b5643b', top: '#5e3f27', deep: '#9a4d2c', rock: '#7b6556' },
    brown: { base: '#a88257', top: '#6a5233', deep: '#8f6c46', rock: '#7d7366' }
  };

  /* ---------- rounded outline + visible side band ---------- */
  function outline(x0, y0, x1, y1, r, step = 9, seg = 6) {
    const out = [];
    const edge = (ax, ay, bx, by) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step)); for (let i = 0; i < n; i++) out.push([ax + (bx - ax) * i / n, ay + (by - ay) * i / n]); };
    const arc = (cx, cy, a0) => { for (let i = 0; i < seg; i++) { const t = (a0 + 90 * i / seg) * Math.PI / 180; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } };
    edge(x0 + r, y0, x1 - r, y0); arc(x1 - r, y0 + r, -90);
    edge(x1, y0 + r, x1, y1 - r); arc(x1 - r, y1 - r, 0);
    edge(x1 - r, y1, x0 + r, y1); arc(x0 + r, y1 - r, 90);
    edge(x0, y1 - r, x0, y0 + r); arc(x0 + r, y0 + r, 180);
    return out;
  }
  const area4 = (p, q) => {
    const a = [P(p[0], p[1], 0), P(q[0], q[1], 0), P(q[0], q[1], -1), P(p[0], p[1], -1)];
    let s = 0; for (let i = 0; i < 4; i++) { const u = a[i], v = a[(i + 1) % 4]; s += u[0] * v[1] - v[0] * u[1]; } return s;
  };
  function visibleRun(ol) {
    const N = ol.length, ref = Math.sign(area4([1, 0], [0, 0])), segs = [];
    for (let i = 0; i < N; i++) {
      const p = ol[i], q = ol[(i + 1) % N], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1;
      segs.push({ p, q, n: [dy / L, -dx / L], vis: area4(p, q) * ref > 1e-9 });
    }
    let s0 = segs.findIndex((g, i) => g.vis && !segs[(i - 1 + N) % N].vis);
    if (s0 < 0) s0 = 0;
    const run = []; let k = s0, acc = 0;
    while (segs[k % N].vis && run.length < N) { const g = segs[k % N]; run.push({ x: g.p[0], y: g.p[1], n: g.n, s: acc }); acc += Math.hypot(g.q[0] - g.p[0], g.q[1] - g.p[1]); k++; }
    const last = segs[(k - 1 + N) % N]; run.push({ x: last.q[0], y: last.q[1], n: null, s: acc });
    return run;
  }
  const zf = z => typeof z === 'function' ? z : () => z;
  const bandPts = (run, zt, zb) => { zt = zf(zt); zb = zf(zb); return pts(run.map(r => P(r.x, r.y, zt(r))).concat(run.slice().reverse().map(r => P(r.x, r.y, zb(r))))); };
  const wob = (amp, fr, ph) => r => amp * Math.sin(r.s * fr + ph) + amp * .45 * Math.sin(r.s * fr * 2.7 + ph * 1.7);

  function sides(run, o, t, bev, mat_) {
    const z0 = -bev, zB = -t, B = (zt, zb, fill, extra = '') => `<polygon points="${bandPts(run, zt, zb)}" fill="${fill}" ${extra}/>`;
    let s = '';
    if (o.earth) {
      const so = SOILS[o.soil] || SOILS.red, w1 = wob(.45, .16, 1), w2 = wob(.8, .07, 2), w3 = wob(.6, .1, 3), w4 = wob(.7, .12, 4);
      s += B(z0, zB, so.base);
      s += B(z0, r => z0 - 1.9 + w1(r), so.top);
      s += B(r => -t * .56 + w2(r), r => -t * .56 - 1.8 + w3(r), so.deep, 'opacity=".85"');
      s += B(r => zB + 2.6 + w4(r), zB, so.rock);
    } else s += B(z0, zB, o.sideColor || mat_.side);
    // side tints (e.g. the sea edge): [{x0,x1,fill}]
    (o.tints || []).forEach(tn => {
      const sub = run.filter(r => r.x >= tn.x0 - .01 && r.x <= tn.x1 + .01);
      if (sub.length > 1) s += `<polygon points="${bandPts(sub, z0, zB)}" fill="${tn.fill}" ${tn.extra || ''}/>`;
    });
    // per-face shading: light from top-left
    for (let i = 0; i < run.length - 1;) {
      const n = run[i].n; let j = i;
      while (j + 1 < run.length - 1 && run[j + 1].n[0] * n[0] + run[j + 1].n[1] * n[1] > .9995) j++;
      const dk = Math.max(.01, .12 + .1 * n[0] - .04 * n[1]);
      s += `<polygon points="${bandPts(run.slice(i, j + 2), z0, zB)}" fill="#0b1e33" opacity="${dk.toFixed(3)}"/>`;
      i = j + 1;
    }
    if (o.earth) s += B(z0 - 1.6, zB, 'url(#ter-pebble)');
    s += B(z0, z0 - .9, '#fff', `opacity="${o.earth ? .16 : .45}"`);
    s += B(zB + 3.2, zB, '#0b1e33', 'opacity=".06"') + B(zB + 1.4, zB, '#0b1e33', 'opacity=".1"');
    return s;
  }

  /* ---------- public: slab ---------- */
  // opts: top ('concrete'|'grass'|'savanna'|'sand'|'tile'), earth (bool), soil ('red'|'brown'), t (thickness),
  //       r (corner radius), bev (bevel width), grid (bool), gridStep, grain (bool, default true),
  //       topFill (override fill), tints ([{x0,x1,fill}] side colour ranges), inner (world-space markup, clipped to top),
  //       after (screen-space markup appended last), shadow (bool, default true)
  function slab(a, b, opts = {}) {
    const o = opts, m = TOPS[o.top] || TOPS.concrete;
    const t = o.t != null ? o.t : (o.earth ? 12 : 9), r = o.r != null ? o.r : 10, bev = o.bev != null ? o.bev : 2.2;
    const cid = 'ter-clip' + (++uid);
    let s = '';
    if (o.shadow !== false) {
      let sh = '';
      [[11, .045], [7, .06], [3.5, .08]].forEach(([g, op]) => sh += `<path d="${rr(-a - g + 6, -b - g + 5, a + g + 6, b + g + 5, r + g)}" fill="#0b1e33" opacity="${op}"/>`);
      s += W(sh, -t - 1);
    }
    s += sides(visibleRun(outline(-a, -b, a, b, r)), o, t, bev, m);
    s += W(`<path d="${rr(-a, -b, a, b, r)}" fill="${o.bevelColor || m.bevel}"/>`, -bev);
    const topD = rr(-a + bev, -b + bev, a - bev, b - bev, Math.max(1, r - bev));
    let top = `<clipPath id="${cid}"><path d="${topD}"/></clipPath>`;
    top += `<path d="${topD}" fill="${o.topFill || m.fill}"${o.grain === false ? '' : ' filter="url(#tx-grain)"'}/>`;
    if (o.grid) {
      const st = o.gridStep || 20, g = [];
      for (let x = -a + st; x < a - .1; x += st) g.push([x, -b, x, b]);
      for (let y = -b + st; y < b - .1; y += st) g.push([-a, y, a, y]);
      top += stroke(segD(g), '#c8d3de', .5, 'opacity=".6"');
    }
    if (o.inner) top += `<g clip-path="url(#${cid})">${o.inner}</g>`;
    top += `<path d="${topD}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".7"/>`;
    s += W(top, 0);
    return `<g class="ter-slab">${s}${o.after || ''}</g>`;
  }

  /* shared bits for the scene grounds */
  const road = (x0, x1, y0, y1, o = {}) => {
    let s = '';
    if (o.kerb !== false) s += rect(x0, y0 - 1.3, x1 - x0, y1 - y0 + 2.6, '#dfe5eb') + stroke(segD([[x0, y0 - 1.3, x1, y0 - 1.3], [x0, y1 + 1.3, x1, y1 + 1.3]]), '#b9c4ce', .4);
    s += rect(x0, y0, x1 - x0, y1 - y0, 'url(#ter-asphalt)');
    s += stroke(segD([[x0, y0 + .5, x1, y0 + .5]]), '#0b1e33', 1, 'opacity=".12"'); // AO under the kerb
    if (o.edges !== false) s += stroke(segD([[x0, y0 + 1.1, x1, y0 + 1.1], [x0, y1 - 1.1, x1, y1 - 1.1]]), '#f4f6f8', .45, 'opacity=".85"');
    if (o.dash != null) s += stroke(segD([[x0, o.dash, x1, o.dash]]), '#ffffff', .8, 'stroke-dasharray="6 5"');
    return s;
  };
  // raised kerb front face (screen space) along constant y, facing +y
  const kerbFace = (x0, x1, y, h = .9) => poly([P(x0, y, h), P(x1, y, h), P(x1, y, 0), P(x0, y, 0)], '#bcc6d0');
  // street grid: rects [x0, y0, x1, y1] (world, on the slab top); the long side sets the dash direction.
  // kerbs first, then asphalt + centre dashes, then plain asphalt over every crossing so the dashes stop there.
  function streets(S, o = {}) {
    const kerb = o.kerb || '#d3dae1';
    let w = S.map(([x0, y0, x1, y1]) => rect(x0 - 1.3, y0 - 1.3, x1 - x0 + 2.6, y1 - y0 + 2.6, kerb)).join('');
    w += S.map(([x0, y0, x1, y1]) => rect(x0, y0, x1 - x0, y1 - y0, 'url(#ter-asphalt)')).join('');
    w += stroke(segD(S.map(([x0, y0, x1, y1]) => x1 - x0 >= y1 - y0 ? [x0, (y0 + y1) / 2, x1, (y0 + y1) / 2] : [(x0 + x1) / 2, y0, (x0 + x1) / 2, y1])), '#fff', .7, 'stroke-dasharray="5 4"');
    S.forEach((a, i) => S.slice(i + 1).forEach(b => {
      const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]), x1 = Math.min(a[2], b[2]), y1 = Math.min(a[3], b[3]);
      if (x1 > x0 && y1 > y0) w += rect(x0, y0, x1 - x0, y1 - y0, 'url(#ter-asphalt)');
    }));
    return w;
  }
  const stainsW = list => list.map(([x, y, rx, ry, g]) => ell(x, y, rx, ry || rx * .6, `url(#${g || 'ter-stain'})`)).join('');

  /* ---------- 1. power station yard ---------- */
  function power(a = 95, b = 70) {
    const R = rng(11);
    let w = '';
    // paving joints (concrete slabs 16 x 16)
    const J = [], Jh = [];
    for (let x = -a + 16; x < a; x += 16) { J.push([x, -b, x, 56]); Jh.push([x + .5, -b, x + .5, 56]); }
    for (let y = -b + 16; y < 56; y += 16) { J.push([-a, y, a, y]); Jh.push([-a, y + .5, a, y + .5]); }
    w += stroke(segD(J), '#cfd7df', .45) + stroke(segD(Jh), '#fbfcfd', .35);
    // grass verges (back + right edges, and front strip beyond the road)
    w += rect(-a - 2, -b - 2, 2 * a + 4, 7, 'url(#ter-grass)') + rect(a - 6, -b - 2, 8, 58 + b, 'url(#ter-grass)') + rect(-a - 2, 68.3, 2 * a + 4, 6, 'url(#ter-grass)');
    w += stroke(segD([[-a, -b + 5, a - 6, -b + 5], [a - 6, -b + 5, a - 6, 56]]), '#b5c0ca', .8);
    // gravel beds: solar field + substation yard
    w += `<path d="${rr(-90, 18, -34, 56, 2)}" fill="url(#ter-gravel)" stroke="#b3ac9f" stroke-width=".9"/>`;
    w += `<path d="${rr(24, -14, 66, 10, 1.5)}" fill="url(#ter-gravel)" stroke="#b3ac9f" stroke-width=".8"/>`;
    // road with lane markings
    w += road(-a - 2, a + 2, 58, 67, { dash: 62.5 });
    // oil / coal stains
    w += stainsW([[8, -12, 7, 3], [36, -13, 5, 2.6], [-80, -13, 5, 3], [-81, 20, 6, 3.5], [-30, 62, 6, 2.5], [44, 63.5, 5, 2], [58, -31, 7, 5, 'ter-coal'], [52, -26, 4, 3, 'ter-coal'], [70, 16, 4, 2.5]]);
    // screen-space: tufts on verges + kerb face
    const tf = scatter(R, 26, -a, a, -b, b, (x, y) => (y < -b + 4) || (x > a - 5 && y < 56) || y > 68.5);
    const after = kerbFace(-a + 6, a - 6, 56.7) + tufts(tf, '#8fb46c') + tufts(tf.slice(0, 12).map(([x, y, k]) => [x + 1.5, y + 1, k * .8]), '#b2d18f');
    return slab(a, b, { top: 'concrete', inner: w, after });
  }

  /* ---------- 2. NOIC (oblique) ---------- */
  function noic(a = 212, b = 56, opts = {}) {
    const R = rng(23);
    let w = '';
    // beach + sea
    w += rect(-172, -b - 2, 14, 2 * b + 4, 'url(#ter-sand)');
    w += rect(-a - 2, -b - 2, a - 166 + 2, 2 * b + 4, 'url(#ter-sea)') + rect(-a - 2, -b - 2, a - 166 + 2, 2 * b + 4, 'url(#ter-water)', 'opacity=".55"');
    w += stroke(`M-166 ${-b - 2}V${b + 2}`, '#ffffff', 1.1, 'opacity=".85"') + stroke(`M-167.6 ${-b - 2}V${b + 2}`, '#ffffff', .5, 'opacity=".5" stroke-dasharray="4 3"');
    // dirt texture patches on the dry grass
    for (let i = 0; i < 9; i++) { const x = -150 + R() * 350, y = -30 + R() * 56; if (y > 26 && y < 47) continue; w += ell(x, y, 8 + R() * 10, 3 + R() * 3, 'url(#ter-dirt)', 'opacity=".55"'); }
    // depot / terminal concrete pads
    w += `<path d="${rr(-162, -38, -106, 26, 3)}" fill="url(#ter-concrete)" opacity=".82" stroke="#c4ccd3" stroke-width=".8"/>`;
    w += `<path d="${rr(50, -42, 108, 26, 3)}" fill="url(#ter-concrete)" opacity=".82" stroke="#c4ccd3" stroke-width=".8"/>`;
    w += `<path d="${rr(150, -42, 214, 26, 3)}" fill="url(#ter-concrete)" opacity=".82" stroke="#c4ccd3" stroke-width=".8"/>`;
    // rail ballast bed
    w += rect(-166, -44, a + 168, 9, 'url(#ter-ballast)') + stroke(segD([[-166, -44, a + 2, -44], [-166, -35, a + 2, -35]]), '#7c7366', .6);
    w += stroke(segD([[-166, -34.3, a + 2, -34.3]]), '#0b1e33', .9, 'opacity=".1"');
    // road
    w += road(-166, a + 2, 30, 44, { dash: 37 });
    // stains on the pads and road
    w += stainsW([[-134, -8, 6, 3], [80, -6, 6, 3], [196, -6, 6, 3.5], [-60, 37, 7, 2.5], [120, 38, 6, 2.5]]);
    // hills (screen space, behind everything)
    let hills = '';
    if (opts.hills !== false) {
      [[-128, 26, 0], [-92, 34, 1], [-52, 26, 0], [-14, 36, 1], [26, 24, 0], [118, 22, 1], [146, 28, 0]].forEach(([hx, hh, alt]) => {
        const lc = alt ? '#cdd9a8' : '#c2d39d', dc = alt ? '#adbf88' : '#a3b780';
        hills += T(hx, -53, 0,
          `<path d="M-32 0Q-13 -${hh} 0 -${hh - 4}Q16 -${hh + 4} 33 0Z" fill="${lc}"/>` +
          `<path d="M2 -${hh - 3.6}Q16 -${hh + 4} 33 0H6Q9 -${(hh * .5).toFixed(1)} 2 -${hh - 3.6}Z" fill="${dc}"/>` +
          `<path d="M-26 -3Q-13 -${hh - 2} -2 -${hh - 4.6}" stroke="#eef3d6" stroke-width=".8" fill="none" opacity=".7"/>` +
          `<path d="M-32 0H33" stroke="#0b1e33" stroke-width="1.2" opacity=".08"/>`);
      });
    }
    // dry grass tufts (screen space)
    const tf = scatter(R, 60, -158, a - 4, -b + 2, b - 2, (x, y) => !(y > -45 && y < -33) && !(y > 28 && y < 46) && !inR(x, y, -163, -104, -40, 28) && !inR(x, y, 48, 110, -44, 28) && !inR(x, y, 148, 214, -44, 28));
    const after = hills + tufts(tf, '#b5a868') + tufts(tf.filter((_, i) => i % 2).map(([x, y, k]) => [x + 1.8, y + .6, k * .8]), '#a4b06c') + stones(scatter(R, 14, -150, 200, 46, 54));
    return slab(a, b, { top: 'savanna', earth: true, soil: 'brown', r: 8, inner: w, after, tints: [{ x0: -a - 1, x1: -166, fill: '#4f97c6' }] });
  }

  /* ---------- 3. Petrotrade forecourt ---------- */
  function petro(a = 88, b = 70) {
    const R = rng(37);
    let w = '';
    // expansion joints (14-unit slabs) on the forecourt, sawn joints with a light lip
    const J = [], Jh = [];
    for (let x = -a + 14; x < 70; x += 14) { J.push([x, -b, x, 27]); J.push([x, 53, x, b]); Jh.push([x + .5, -b, x + .5, 27]); }
    for (let y = -b + 14; y < 27; y += 14) { J.push([-a, y, a, y]); Jh.push([-a, y + .5, a, y + .5]); }
    J.push([-a, 60, a, 60]);
    w += stroke(segD(J), '#c7d0d9', .5) + stroke(segD(Jh), '#fbfcfd', .35);
    // shop apron (tile) + grass strips at the back corners
    w += rect(-74, -33, 70, 7, 'url(#ter-tile)') + stroke(segD([[-74, -26, -4, -26]]), '#c3ccd5', .6);
    w += `<path d="${rr(-a - 4, -b - 4, -75, 16, 3)}" fill="url(#ter-grass)" stroke="#b9c3cc" stroke-width="1"/>`;
    // roads around the station: main road (front), service road (right side) and back lane
    w += road(-a - 2, a + 2, 28, 52, { dash: 40 });
    w += streets([[-a - 2, -b - 4, a + 2, -62], [70, -b - 4, 84, 29]]);
    // oil drips under/around the pumps and the lanes
    w += stainsW([[-19, 4.5, 5, 2.6], [7, 4.5, 5, 2.6], [-19, 16, 4, 2], [7, 16, 4, 2], [-19, -5, 3.5, 1.8], [7, -5, 3.5, 1.8], [-50, 40, 6, 2.4], [48, 34, 5, 2], [20, 46, 4, 1.8]]);
    const tf = scatter(R, 18, -a, a, -b, 16, (x, y) => x < -77 && y < 14 && y > -60);
    const after = kerbFace(-a + 6, 68.7, 26.7) + tufts(tf, '#8fb46c') + tufts(tf.slice(0, 8).map(([x, y, k]) => [x + 1.4, y + 1, k * .8]), '#b2d18f');
    return slab(a, b, { top: 'concrete', inner: w, after });
  }

  /* ---------- 4. Powertel city ---------- */
  function ptel(a = 88, b = 70) {
    const R = rng(51);
    let w = '';
    // building lots (slightly darker paving)
    [[-86, -66, -22, -30], [26, -66, 60, -30], [57, -19, 86, 5], [-86, -19, -53, 2], [6, 10, 44, 38], [-38, 10, -6, 52], [-36, -19, -10, -3]].forEach(([x0, y0, x1, y1]) => w += `<path d="${rr(x0, y0, x1, y1, 2)}" fill="#dfe4ea" stroke="#cfd6de" stroke-width=".6"/>`);
    // street grid: A front + C back (along x), B west + D east avenues (along y), E middle cross street
    w += streets([[-a - 2, 56, a + 2, 66], [-a - 2, -28, a + 2, -21], [-50, -28, -40, 66], [46, -28, 54, 66], [-50, 0, 54, 7]]);
    // stop lines + zebra crossings
    w += stroke(segD([[-50, 55.2, -40, 55.2], [46, 55.2, 54, 55.2], [-39.2, -28, -39.2, -21], [-39.2, 0, -39.2, 7], [45.2, 0, 45.2, 7]]), '#fff', .9);
    let z = ''; for (let i = 0; i < 6; i++) z += `M${f(-37 + i * 1.8)} 57.2h1v7.6h-1Z` + `M${f(33 + i * 1.8)} 57.2h1v7.6h-1Z`;
    w += `<path d="${z}" fill="#fbfcfd"/>`;
    // park
    w += `<path d="${rr(57, 10, 86, 52, 4)}" fill="url(#ter-grass)" stroke="#c9d1d9" stroke-width="1.2"/>`;
    w += stroke('M57 30Q66 22 71 32T86 40', '#eadfc4', 2.6, 'stroke-linecap="round"') + stroke('M57 30Q66 22 71 32T86 40', '#d7c8a6', .4);
    w += ell(76, 18, 5, 3.4, '#8fcbea', 'stroke="#d9e2ea" stroke-width=".8"');
    w += ell(66, 44, 7, 4, 'url(#ter-patch)');
    // manholes
    [[-45, 20], [-45, 40], [22, 61], [70, 61], [-70, -24.5], [20, -24.5], [50, 30], [10, 3.5], [50, -10]].forEach(([x, y]) => w += `<circle cx="${x}" cy="${y}" r="2.1" fill="#78828d" stroke="#a2acb6" stroke-width=".5"/><path d="M${x - 1.3} ${y}h2.6M${x} ${y - 1.3}v2.6" stroke="#5f6974" stroke-width=".35"/>`);
    w += stainsW([[-45, 30, 3, 1.4], [-10, 62, 5, 2], [40, -24, 4, 1.8]]);
    const tf = scatter(R, 14, 59, 85, 11, 51, (x, y) => Math.abs(y - (30 + (x - 57) * .3)) > 3);
    const after = tufts(tf, '#8fb46c') + dots(scatter(R, 7, 59, 84, 12, 50), '#f2c35c', .7) + dots(scatter(R, 5, 59, 84, 12, 50), '#f06a5f', .7);
    return slab(a, b, { top: 'tile', inner: w, after });
  }

  /* ---------- 5. REA rural ---------- */
  function rea(a = 92, b = 66, opts = {}) {
    const R = rng(71);
    let w = '';
    // grass colour variation + bare yards in front of the houses
    for (let i = 0; i < 7; i++) w += ell(-80 + R() * 160, -60 + R() * 120, 14 + R() * 12, 7 + R() * 6, 'url(#ter-patch)');
    [[-43, -16, 16], [13, -22, 14], [59, -12, 12], [-24, 50, 13], [-74, 54, 14]].forEach(([x, y, r]) => w += ell(x, y, r, r * .45, 'url(#ter-bare)'));
    // dirt path with wheel ruts
    w += `<path d="${ragged(-a - 4, a + 4, 6, 18, .8, 8, R)}" fill="url(#ter-dirt)"/>`;
    w += `<path d="${ragged(-a - 4, a + 4, 5.4, 6.4, .5, 8, R)}" fill="#a9c58a" opacity=".6"/>`;
    const rutPts = y => { const p = [[-a - 4, y]]; for (let x = -a + 6; x <= a + 6; x += 10) p.push([x, y + (R() - .5) * .8]); return p; };
    const rutD = (p, dy) => 'M' + p.map(q => f(q[0]) + ' ' + f(q[1] + dy)).join('L');
    const r1 = rutPts(9.4), r2 = rutPts(14.6);
    w += stroke(rutD(r1, 0) + rutD(r2, 0), '#b38e62', 1.3, 'stroke-linejoin="round"') + stroke(rutD(r1, .9) + rutD(r2, .9), '#efdfc1', .5);
    // ploughed field: furrows with light/shadow ridges (rows run along y)
    w += `<path d="${rr(38, 24, 90, 58, 2)}" fill="url(#ter-soil)" stroke="#8e5232" stroke-width=".7"/>`;
    const ridge = [], shade = [], crop = [];
    for (let x = 39.5; x < 89.5; x += 3.5) { ridge.push([x, 25, x, 57]); shade.push([x + 1.3, 25, x + 1.3, 57]); }
    for (let i = 0; i < 7; i++) crop.push([40 + i * 7, 26, 40 + i * 7, 56]);
    w += stroke(segD(shade), '#7a4123', .9, 'opacity=".75"') + stroke(segD(ridge), '#cf9068', 1, 'opacity=".9"');
    if (opts.crops !== false) w += stroke(segD(crop), '#5f9e4a', 1.8, 'stroke-dasharray="1.6 1.4"');
    w += stroke(segD([[38, 59, 90, 59], [91, 24, 91, 59]]), '#0b1e33', 1.2, 'opacity=".08"');
    // screen-space: tufts, stones, flowers
    const free = (x, y) => !(y > 4 && y < 20) && !inR(x, y, 36, 92, 22, 60);
    const tf = scatter(R, 40, -a + 2, a - 2, -b + 2, b - 2, free);
    const fl = scatter(R, 18, -a + 4, a - 4, -b + 4, b - 4, free);
    const after = tufts(tf, '#a8745c') + tufts(tf.filter((_, i) => i % 2).map(([x, y, k]) => [x + 1.6, y + .8, k * .75]), '#a9cf84') +
      stones(scatter(R, 16, -a + 3, a - 3, 4, 20).concat(scatter(R, 6, -a + 4, a - 4, -b + 4, b - 4, free))) +
      dots(fl.slice(0, 7), '#ffffff', .8) + dots(fl.slice(7, 13), '#f2c35c', .8) + dots(fl.slice(13), '#e86a8a', .8);
    return slab(a, b, { top: 'grass', earth: true, soil: 'red', inner: w, after });
  }

  A.terrain = { slab, power, noic, petro, ptel, rea };
})();
