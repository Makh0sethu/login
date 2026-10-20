/* Coal silos, silo battery with conveyor + gallery, and coal stockpiles.
   Namespace: Assets.silos   Defs prefix: silo-
   All geometry goes through the global P() lazily, so it works with the iso and the NOIC oblique projection. */
(function () {
  const Assets = window.Assets = window.Assets || {};
  const TAU = Math.PI * 2;
  const f = n => (+n).toFixed(1);
  const sp = a => a.map(p => f(p[0]) + ',' + f(p[1])).join(' ');
  const pg = (a, fill, extra = '') => `<polygon points="${sp(a)}" fill="${fill}" ${extra}/>`;
  const dLine = a => 'M' + a.map(p => f(p[0]) + ' ' + f(p[1])).join(' L');

  /* ---------- defs ---------- */
  const lin = (id, stops, v = false) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}">` +
    stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('') + '</linearGradient>';
  Assets.addDefs(
    lin('silo-b-concrete', [[0, '#8a8c8c'], [.28, '#e4e3df'], [.36, '#e9e8e4'], [.55, '#c9c8c3'], [.82, '#a3a39f'], [1, '#7c7d7c']]) +
    lin('silo-b-steel', [[0, '#7a8794'], [.27, '#eef3f7'], [.33, '#ffffff'], [.5, '#c9d2db'], [.8, '#94a1ae'], [1, '#6a7785']]) +
    lin('silo-b-green', [[0, '#264f2e'], [.28, '#77bb83'], [.34, '#86c491'], [.55, '#4f9a5d'], [.82, '#367343'], [1, '#22472a']]) +
    lin('silo-r-concrete', [[0, '#a5a7a6'], [.35, '#e6e5e1'], [.7, '#bdbcb7'], [1, '#90918f']]) +
    lin('silo-r-steel', [[0, '#9aa6b2'], [.35, '#f7f9fb'], [.7, '#cbd3db'], [1, '#8794a1']]) +
    lin('silo-r-green', [[0, '#9aa6b2'], [.35, '#eef2f5'], [.7, '#c3ccd5'], [1, '#86929f']]) +
    lin('silo-skirt', [[0, '#6f7882'], [.3, '#b9c1c8'], [.6, '#9aa3ac'], [1, '#626b75']]) +
    lin('silo-streak', [[0, '#3a3228', .6], [.5, '#3a3228', .25], [1, '#3a3228', 0]], true) +
    lin('silo-stain', [[0, '#2c2a26', 0], [1, '#2c2a26', .42]], true) +
    lin('silo-coal', [[0, '#3a3e44'], [.28, '#5a6068'], [.55, '#2e3237'], [1, '#1b1d21']]) +
    lin('silo-cv', [[0, '#d7dee5'], [1, '#aab6c2']], true) +
    `<pattern id="silo-coal-tx" patternUnits="userSpaceOnUse" width="5" height="3.6" patternTransform="rotate(-18)">` +
    `<path d="M.6 1.1 L1.2 .5 L1.8 1 L1.3 1.5Z" fill="#8a9097" opacity=".35"/>` +
    `<path d="M3.1 2.7 L3.7 2.2 L4.3 2.6 L3.8 3.2Z" fill="#0e0f11" opacity=".55"/>` +
    `<circle cx="4" cy=".7" r=".3" fill="#a3a9b0" opacity=".35"/>` +
    `<circle cx="1.6" cy="2.9" r=".35" fill="#121315" opacity=".5"/></pattern>`
  );

  /* ---------- projection-agnostic geometry ---------- */
  // screen basis of the current P, angles of the cylinder silhouette tangents and the front arc sweep
  function basis() {
    const o = P(0, 0, 0), a = P(1, 0, 0), b = P(0, 1, 0), c = P(0, 0, 1);
    const ux = a[0] - o[0], uy = a[1] - o[1], vx = b[0] - o[0], vy = b[1] - o[1], wx = c[0] - o[0], wy = c[1] - o[1];
    const tR = Math.atan2(vx, ux), tL = tR + Math.PI, tY = Math.atan2(vy, uy);
    const d = (((tY - tL) % TAU) + TAU) % TAU;
    // view vector (world direction towards the viewer) = null space of the projection rows
    let view = [vx * wy - wx * vy, wx * uy - ux * wy, ux * vy - vx * uy];
    if (view[2] < 0) view = view.map(q => -q);
    return { tL, sweep: d < Math.PI ? Math.PI : -Math.PI, view, depth: (x, y) => P(x, y, 0)[1] };
  }
  // point on the front half of a vertical cylinder; t=0 left tangent, t=1 right tangent
  const arcPt = (B, x, y, z, r, t) => { const a = B.tL + t * B.sweep; return P(x + r * Math.cos(a), y + r * Math.sin(a), z); };
  const arc = (B, x, y, z, r, t0 = 0, t1 = 1, n = 18) => { const o = []; for (let i = 0; i <= n; i++) o.push(arcPt(B, x, y, z, r, t0 + (t1 - t0) * i / n)); return o; };
  const ring = (x, y, z, rx, ry, n = 32) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push(P(x + rx * Math.cos(a), y + ry * Math.sin(a), z)); } return o; };
  function hull(p) {
    p = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // convex hexahedron: c = 8 world corners (bottom 4 then matching top 4); col = [top,left(+y),right(+x)]
  function prism(B, c, col, extra = '') {
    const cen = [0, 1, 2].map(k => c.reduce((s, q) => s + q[k], 0) / 8);
    const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    let s = '';
    for (const fc of faces) {
      const q = fc.map(i => c[i]);
      const e1 = [0, 1, 2].map(k => q[1][k] - q[0][k]), e2 = [0, 1, 2].map(k => q[2][k] - q[0][k]);
      let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const fcn = [0, 1, 2].map(k => q.reduce((s2, p) => s2 + p[k], 0) / 4 - cen[k]);
      if (n[0] * fcn[0] + n[1] * fcn[1] + n[2] * fcn[2] < 0) n = n.map(v => -v);
      if (n[0] * B.view[0] + n[1] * B.view[1] + n[2] * B.view[2] <= 1e-6) continue;
      const L = Math.hypot(n[0], n[1], n[2]) || 1;
      const fill = n[2] / L > 0.6 ? col[0] : (n[1] >= n[0] ? col[1] : col[2]);
      s += pg(q.map(p => P(p[0], p[1], p[2])), fill, extra);
    }
    return s;
  }
  const boxC = (x, y, z, w, d, h) => [[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
  // tiny deterministic random from a seed
  const rnd = seed => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  /* ---------- single silo ---------- */
  const ROOF_K = { cone: 0.5, dome: 0.42 };
  function silo(x, y, opts = {}) {
    const r = opts.r != null ? opts.r : 9, h = opts.h != null ? opts.h : 48;
    const color = ['concrete', 'steel', 'green'].includes(opts.color) ? opts.color : 'concrete';
    const cone = opts.cone !== false;
    const B = basis(), R = rnd(Math.abs(Math.round(x * 31 + y * 17)) + 7);
    const skH = Math.min(8, h * 0.16), z0 = 0;
    let s = '';
    // AO contact shadow (biased right/back, away from the top-left light)
    const c0 = P(x, y, 0), hw = Math.abs(arcPt(B, x, y, 0, r, 1)[0] - arcPt(B, x, y, 0, r, 0)[0]) / 2;
    s += `<ellipse cx="${f(c0[0] + hw * 0.25)}" cy="${f(c0[1] + 1)}" rx="${f(hw * 1.75)}" ry="${f(hw * 0.8)}" fill="url(#ao-soft)"/>`;
    // base skirt / hopper house (slightly wider concrete drum)
    const rs = r + 1.2;
    s += pg(arc(B, x, y, z0, rs).concat(arc(B, x, y, z0 + skH, rs).reverse()), 'url(#silo-skirt)', 'stroke="#00000026" stroke-width=".5"');
    s += pg(ring(x, y, z0 + skH, rs, rs, 28), '#8e98a2');
    // discharge opening with the hopper cone visible inside
    const oL = arcPt(B, x, y, 0, rs, 0.38), oR = arcPt(B, x, y, 0, rs, 0.62);
    const oT = skH * 0.82, ow = oR[0] - oL[0];
    s += `<path d="M${f(oL[0])} ${f(oL[1])} V${f(oL[1] - oT * 0.6)} Q${f(oL[0] + ow / 2)} ${f(Math.min(oL[1], oR[1]) - oT * 1.05)} ${f(oR[0])} ${f(oR[1] - oT * 0.6)} V${f(oR[1])}Z" fill="#2b3036"/>`;
    s += `<path d="M${f(oL[0] + ow * 0.18)} ${f(oL[1] - oT * 0.62)} L${f(oR[0] - ow * 0.18)} ${f(oR[1] - oT * 0.62)} L${f(oL[0] + ow * 0.56)} ${f((oL[1] + oR[1]) / 2 - oT * 0.15)} L${f(oL[0] + ow * 0.44)} ${f((oL[1] + oR[1]) / 2 - oT * 0.15)}Z" fill="#6c7680"/>`;
    // body
    const zb = z0 + skH, zt = h;
    s += pg(arc(B, x, y, zb, r, 0, 1, 24).concat(arc(B, x, y, zt, r, 0, 1, 24).reverse()), `url(#silo-b-${color})`, 'stroke="#0000002e" stroke-width=".5"');
    // steel: vertical corrugation ribs
    if (color !== 'concrete') {
      let d = '';
      for (let i = 1; i < 16; i++) { const a = arcPt(B, x, y, zb, r, i / 16), b = arcPt(B, x, y, zt, r, i / 16); d += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; }
      s += `<path d="${d}" stroke="#0000001c" stroke-width=".55" fill="none"/>`;
    } else {
      // concrete: slipform pour lines (faint)
      let d = '';
      for (let z = zb + 3; z < zt - 1; z += 3) d += dLine(arc(B, x, y, z, r, 0.02, 0.98, 10));
      s += `<path d="${d}" stroke="#00000010" stroke-width=".4" fill="none"/>`;
    }
    // horizontal ring bands (dark seam + light lip)
    let bd = '', bl = '';
    const nb = Math.max(3, Math.round((zt - zb) / 9));
    for (let i = 1; i < nb; i++) {
      const z = zb + (zt - zb) * i / nb;
      bd += dLine(arc(B, x, y, z, r + 0.15, 0, 1, 14));
      bl += dLine(arc(B, x, y, z - 0.7, r + 0.15, 0.06, 0.62, 8));
    }
    s += `<path d="${bd}" stroke="#1d2a36" stroke-opacity=".32" stroke-width="1" fill="none"/>`;
    s += `<path d="${bl}" stroke="#fff" stroke-opacity=".45" stroke-width=".5" fill="none"/>`;
    // vertical highlight band
    s += pg(arc(B, x, y, zb, r, 0.27, 0.34, 3).concat(arc(B, x, y, zt, r, 0.27, 0.34, 3).reverse()), '#fff', `opacity="${color === 'concrete' ? .18 : .28}"`);
    // grime streaks from the eave + stain at the foot
    let gd = '';
    for (let i = 0; i < 6; i++) {
      const t = 0.08 + i * 0.16 + R() * 0.06, len = (zt - zb) * (0.25 + R() * 0.45);
      const a = arcPt(B, x, y, zt - 0.5, r, t), b = arcPt(B, x, y, zt - len, r, t);
      gd += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`;
    }
    s += `<path d="${gd}" stroke="url(#silo-streak)" stroke-width="${f(Math.max(0.9, r * 0.13))}" stroke-linecap="round" fill="none"/>`;
    s += pg(arc(B, x, y, zb, r, 0, 1, 14).concat(arc(B, x, y, zb + Math.min(9, h * 0.2), r, 0, 1, 14).reverse()), 'url(#silo-stain)');
    // caged ladder on the lit front-left
    const lb = arcPt(B, x, y, 1, rs, 0.2), lt = arcPt(B, x, y, zt, r, 0.2);
    const lx = lb[0], ly0 = lb[1], ly1 = lt[1];
    let rd = `M${f(lx - 1.1)} ${f(ly0)} V${f(ly1 - 2)} M${f(lx + 1.1)} ${f(ly0)} V${f(ly1 - 2)}`, rg = '';
    for (let yy = ly0 - 2; yy > ly1; yy -= 2.4) rg += `M${f(lx - 1.1)} ${f(yy)} H${f(lx + 1.1)}`;
    let cg = '';
    for (let yy = ly0 - 8; yy > ly1 + 1; yy -= 5) cg += `M${f(lx - 2.2)} ${f(yy)} a2.2 1.1 0 0 0 4.4 0`;
    cg += `M${f(lx - 2.2)} ${f(ly0 - 8)} V${f(ly1 + 1)} M${f(lx + 2.2)} ${f(ly0 - 8)} V${f(ly1 + 1)}`;
    s += `<path d="${rg}" stroke="#56626f" stroke-width=".45" fill="none"/><path d="${rd}" stroke="#46525e" stroke-width=".6" fill="none"/>`;
    s += `<path d="${cg}" stroke="#46525e" stroke-opacity=".75" stroke-width=".45" fill="none"/>`;
    // eave ring + roof
    const k = cone ? ROOF_K.cone : ROOF_K.dome, rh = r * k;
    s += pg(ring(x, y, zt, r + 0.5, r + 0.5, 32), '#7d8893');
    let roofPts;
    if (cone) roofPts = ring(x, y, zt + 0.6, r + 0.5, r + 0.5, 32).concat([P(x, y, zt + 0.6 + rh)]);
    else { roofPts = []; for (let j = 0; j <= 6; j++) { const ph = j / 6 * Math.PI / 2, rr = (r + 0.5) * Math.cos(ph); roofPts = roofPts.concat(rr > 0.2 ? ring(x, y, zt + 0.6 + rh * Math.sin(ph), rr, rr, 24) : [P(x, y, zt + 0.6 + rh)]); } }
    s += pg(arc(B, x, y, zt, r + 0.5, 0, 1, 16).concat(arc(B, x, y, zt + 0.6, r + 0.5, 0, 1, 16).reverse()), '#5f6a75');
    s += pg(hull(roofPts), `url(#silo-r-${color})`, 'stroke="#00000033" stroke-width=".5"');
    if (cone) {
      const ap = P(x, y, zt + 0.6 + rh); let sd = '';
      for (let i = 1; i < 8; i++) { const e = arcPt(B, x, y, zt + 0.6, r + 0.5, i / 8); sd += `M${f(ap[0])} ${f(ap[1])} L${f(e[0])} ${f(e[1])}`; }
      s += `<path d="${sd}" stroke="#00000018" stroke-width=".5" fill="none"/>`;
    } else {
      s += `<path d="${dLine(arc(B, x, y, zt + 0.6 + rh * 0.55, (r + 0.5) * 0.83, 0, 1, 14))}" stroke="#00000018" stroke-width=".5" fill="none"/>`;
    }
    // roof edge guard-rail (front half) with posts
    let gr = dLine(arc(B, x, y, zt + 2.6, r + 0.4, 0, 1, 16));
    for (let i = 0; i <= 6; i++) { const a = arcPt(B, x, y, zt + 0.6, r + 0.4, i / 6); gr += `M${f(a[0])} ${f(a[1])} V${f(a[1] - 2)}`; }
    s += `<path d="${gr}" stroke="#4f5b67" stroke-width=".5" fill="none"/>`;
    // roof hatch (small raised box toward the viewer's left)
    const hz = zt + 0.6 + rh * (1 - 5 / (r + 0.5));
    s += prism(B, boxC(x - 1.3, y + 3.6, hz - 0.3, 2.6, 2.6, 1.5), ['#e6ebf0', '#b9c3cd', '#98a4b0']);
    s += `<g>${pg([P(x - 1.3, y + 3.6, hz + 1.2), P(x + 1.3, y + 3.6, hz + 1.2), P(x + 1.3, y + 6.2, hz + 1.2), P(x - 1.3, y + 6.2, hz + 1.2)], '#f4c13d', 'stroke="#b8891d" stroke-width=".3"')}</g>`;
    return `<g class="silo">${s}</g>`;
  }
  // apex height for gallery placement
  const siloTop = (r, h, cone) => h + 0.6 + r * (cone ? ROOF_K.cone : ROOF_K.dome);

  /* ---------- coal stockpile ---------- */
  function pileRings(x, y, w, d, hh) {
    const rings = [];
    for (let i = 0; i <= 6; i++) {
      const e = i / 6;
      rings.push(ring(x, y, hh * Math.sin(e * Math.PI / 2), Math.max(0.6, w / 2 * (1 - e * 0.72)), Math.max(0.4, d / 2 * (1 - e * 0.9)), 28));
    }
    return rings;
  }
  function coalPile(x, y, opts = {}) {
    const w = opts.w != null ? opts.w : 30, d = opts.d != null ? opts.d : 20, h = opts.h != null ? opts.h : 12;
    const R = rnd(Math.abs(Math.round(x * 13 + y * 29)) + 3);
    const rings = pileRings(x, y, w, d, h);
    const all = [].concat(...rings);
    const c = P(x, y, 0), ex = ring(x, y, 0, w / 2, d / 2, 16).map(p => p[0]);
    const hw = (Math.max(...ex) - Math.min(...ex)) / 2;
    let s = `<ellipse cx="${f(c[0] + hw * 0.08)}" cy="${f(c[1] + 1.5)}" rx="${f(hw * 1.18)}" ry="${f(hw * 0.5)}" fill="url(#ao-soft)"/>`;
    // dark soil/coal-dust apron on the ground
    s += pg(ring(x, y, 0.15, w / 2 + 2, d / 2 + 2, 28), '#2f3236', 'opacity=".14"');
    const H = hull(all);
    s += pg(H, 'url(#silo-coal)', 'stroke="#0d0e10" stroke-opacity=".5" stroke-width=".5"');
    s += pg(hull([].concat(...rings.slice(2))), '#ffffff', 'opacity=".05"');
    s += pg(hull([].concat(...rings.slice(4))), '#ffffff', 'opacity=".06"');
    s += pg(H, 'url(#silo-coal-tx)', 'opacity=".9"');
    // slump furrows running down the front
    const B = basis(); let fd = '';
    for (let i = 0; i < 7; i++) {
      const t = 0.1 + i * 0.13 + R() * 0.05, a = (B.tL + t * B.sweep);
      const top = P(x + w / 2 * 0.35 * Math.cos(a), y + d / 2 * 0.2 * Math.sin(a), h * (0.8 + R() * 0.15));
      const bot = P(x + w / 2 * 0.95 * Math.cos(a), y + d / 2 * 0.95 * Math.sin(a), 0.6);
      fd += `M${f(top[0])} ${f(top[1])} Q${f((top[0] + bot[0]) / 2 + 1)} ${f((top[1] + bot[1]) / 2)} ${f(bot[0])} ${f(bot[1])}`;
    }
    s += `<path d="${fd}" stroke="#0b0c0e" stroke-opacity=".45" stroke-width=".6" fill="none"/>`;
    // ridge highlight
    const rt = rings[6];
    s += `<path d="${dLine([rt[14], rt[0]])}" stroke="#8a9098" stroke-opacity=".5" stroke-width=".7" fill="none"/>`;
    // loose lumps around the toe
    let ld = '';
    for (let i = 0; i < 9; i++) {
      const a = R() * TAU, k = 1.02 + R() * 0.16, p = P(x + w / 2 * k * Math.cos(a), y + d / 2 * k * Math.sin(a), 0.2), sz = 0.6 + R() * 0.6;
      ld += `M${f(p[0] - sz)} ${f(p[1])} L${f(p[0])} ${f(p[1] - sz)} L${f(p[0] + sz)} ${f(p[1] - sz * 0.2)} L${f(p[0] + sz * 0.3)} ${f(p[1] + sz * 0.5)}Z`;
    }
    s += `<path d="${ld}" fill="#24272b"/>`;
    if (opts.dust) s += T(x, y, h, `<g class="puff"><circle r="4" fill="#8d9096" opacity=".45"/></g><g class="puff" style="animation-delay:2s"><circle cx="2" r="3" fill="#9a9da2" opacity=".4"/></g>`);
    return `<g class="coal-pile">${s}</g>`;
  }

  /* ---------- battery: 3 silos + gallery + transfer tower + inclined conveyor + stockpile ---------- */
  function battery(x, y, opts = {}) {
    const gap = opts.gap != null ? opts.gap : 20, r = opts.r != null ? opts.r : 9, h = opts.h != null ? opts.h : 48;
    const cone = opts.cone !== false, color = opts.color || 'concrete';
    const tw = 7, tx = x + gap + r + 4.5, ty = y;  // transfer tower at the +x end of the row
    const pile = opts.pileAt || [tx, y - 30];       // default: 30 units in -y, behind the tower so the conveyor reads
    const pw = opts.pileW != null ? opts.pileW : 16, pd = opts.pileD != null ? opts.pileD : 20, ph = opts.pileH != null ? opts.pileH : 10;
    const B = basis();
    const gz = siloTop(r, h, cone) + 1.2;          // gallery floor
    const gH = 4.2, gW = 5;                        // gallery height / width
    const pileBehind = B.depth(pile[0], pile[1]) < B.depth(x, y);
    // conveyor: from pile edge to the tower face that faces the pile
    const ez = gz + 0.8, E = [tx, ty + (pile[1] < ty ? -tw / 2 : tw / 2)];
    let ux = E[0] - pile[0], uy = E[1] - pile[1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const pr = 1 / Math.sqrt((ux / (pw / 2)) ** 2 + (uy / (pd / 2)) ** 2);
    const S = [pile[0] + ux * (pr + 1.5), pile[1] + uy * (pr + 1.5)], sz = 2.2;
    const nx = -uy * 2.2, ny = ux * 2.2, ch = 3.6;
    const cvC = [[S[0] - nx, S[1] - ny, sz], [E[0] - nx, E[1] - ny, ez], [E[0] + nx, E[1] + ny, ez], [S[0] + nx, S[1] + ny, sz],
                 [S[0] - nx, S[1] - ny, sz + ch], [E[0] - nx, E[1] - ny, ez + ch], [E[0] + nx, E[1] + ny, ez + ch], [S[0] + nx, S[1] + ny, sz + ch]];
    // which long side faces the viewer
    const side = (nx * B.view[0] + ny * B.view[1]) > 0 ? 1 : -1;
    const at = (t, off, dz) => { const px = S[0] + (E[0] - S[0]) * t + nx * off, py = S[1] + (E[1] - S[1]) * t + ny * off; return P(px, py, sz + (ez - sz) * t + dz); };

    let conveyor = '';
    // trestle legs
    let leg = '';
    [0.22, 0.45, 0.68, 0.88].forEach(t => {
      [-1, 1].forEach(o => { const a = at(t, o, 0), gx = S[0] + (E[0] - S[0]) * t + nx * o * 1.6, gy = S[1] + (E[1] - S[1]) * t + ny * o * 1.6, b = P(gx, gy, 0); leg += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; });
      const a = at(t, -1, 0), b = P(S[0] + (E[0] - S[0]) * t + nx * 1.6, S[1] + (E[1] - S[1]) * t + ny * 1.6, 0); leg += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`;
    });
    conveyor += `<path d="${leg}" stroke="#6f7c89" stroke-width=".8" fill="none"/>`;
    // tail hopper at the pile
    conveyor += prism(B, boxC(S[0] - 2.8, S[1] - 2.8, 0, 5.6, 5.6, 3), ['#8b96a1', '#5f6a75', '#4c5661']);
    conveyor += prism(B, cvC, ['#e9eef3', '#c4ced8', '#a9b6c3'], 'stroke="#00000022" stroke-width=".4"');
    // belt slot on the visible side, coal riding up it
    const slot = [at(0.04, side * 1.02, 0.9), at(0.97, side * 1.02, 0.9), at(0.97, side * 1.02, 2.5), at(0.04, side * 1.02, 2.5)];
    conveyor += pg(slot, '#2a3138');
    const belt = [at(0.04, side * 0.98, 1.25), at(0.97, side * 0.98, 1.25)];
    conveyor += `<path d="${dLine(belt)}" stroke="#4a525b" stroke-width=".9" fill="none" class="flow"/>`;
    let ribs = '';
    for (let t = 0.1; t < 0.96; t += 0.09) { const a = at(t, side * 1.02, 0), b = at(t, side * 1.02, ch); ribs += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; }
    conveyor += `<path d="${ribs}" stroke="#8795a3" stroke-width=".45" fill="none"/>`;
    const bp = dLine([at(0.04, side * 0.98, 2), at(0.97, side * 0.98, 2)]);
    const dur = 4.5;
    for (let i = 0; i < 6; i++) conveyor += `<path d="M-1 .3 L-.4 -.7 L.8 -.5 L1 .4 L0 .8Z" fill="#17191c"><animateMotion dur="${dur}s" begin="-${f(i * dur / 6)}s" repeatCount="indefinite" path="${bp}"/></path>`;
    // roof ridge highlight
    conveyor += `<path d="${dLine([at(0, 0, ch), at(1, 0, ch)])}" stroke="#fff" stroke-opacity=".6" stroke-width=".5" fill="none"/>`;
    // loading dust at the tail
    conveyor += T(S[0], S[1], 4, `<g class="puff"><circle r="3.4" fill="#8f9297" opacity=".45"/></g><g class="puff" style="animation-delay:1.9s"><circle cx="1.5" r="2.6" fill="#a2a5a9" opacity=".4"/></g>`);

    // transfer tower
    const tH = gz + gH + 5;
    let tower = `<ellipse cx="${f(P(tx, ty)[0] + 2)}" cy="${f(P(tx, ty)[1] + 1)}" rx="9" ry="4" fill="url(#ao-soft)"/>`;
    tower += prism(B, boxC(tx - tw / 2, ty - tw / 2, 0, tw, tw, tH), ['#eef2f6', '#d3dbe3', '#b4c0cc'], 'stroke="#00000022" stroke-width=".4"');
    // steel frame lines + louvre band on visible faces
    let fr = '';
    for (let z = 6; z < gz; z += 7) { fr += dLine([P(tx - tw / 2, ty + tw / 2, z), P(tx + tw / 2, ty + tw / 2, z), P(tx + tw / 2, ty - tw / 2, z)]); }
    fr += dLine([P(tx + tw / 2, ty + tw / 2, 0), P(tx + tw / 2, ty + tw / 2, tH)]);
    tower += `<path d="${fr}" stroke="#8a97a5" stroke-width=".5" fill="none"/>`;
    tower += pg([P(tx - tw / 2 + 1, ty + tw / 2, gz), P(tx + tw / 2 - 1, ty + tw / 2, gz), P(tx + tw / 2 - 1, ty + tw / 2, gz + gH), P(tx - tw / 2 + 1, ty + tw / 2, gz + gH)], '#7bb9df', 'opacity=".9"');
    tower += pg([P(tx + tw / 2, ty - tw / 2 + 1, gz), P(tx + tw / 2, ty + tw / 2 - 1, gz), P(tx + tw / 2, ty + tw / 2 - 1, gz + gH), P(tx + tw / 2, ty - tw / 2 + 1, gz + gH)], '#5f9fcb', 'opacity=".9"');
    tower += pg([P(tx - tw / 2 + 1.5, ty + tw / 2, 0), P(tx - tw / 2 + 4, ty + tw / 2, 0), P(tx - tw / 2 + 4, ty + tw / 2, 5), P(tx - tw / 2 + 1.5, ty + tw / 2, 5)], '#56626f');
    tower += prism(B, boxC(tx - tw / 2 - 0.4, ty - tw / 2 - 0.4, tH, tw + 0.8, tw + 0.8, 1), ['#c0392b', '#a83226', '#8f2a20']);
    tower += T(tx + 1, ty - 1, tH + 1, `<circle r="1" fill="#ff5a4a" class="glow"/>`);

    // silos back-to-front
    const xs = [x - gap, x, x + gap].sort((a, b) => B.depth(a, y) - B.depth(b, y));
    let silos = '';
    xs.forEach(xx => { silos += silo(xx, y, { r, h, color, cone }); });

    // top gallery linking the roofs
    const gx0 = x - gap - 3, gx1 = tx - tw / 2;
    let gal = '';
    let posts = '';
    [x - gap, x, x + gap].forEach(xx => { const a = P(xx, y, siloTop(r, h, cone) - 0.3), b = P(xx, y, gz); posts += `M${f(a[0] - 1)} ${f(a[1])} L${f(b[0] - 1)} ${f(b[1])} M${f(a[0] + 1)} ${f(a[1])} L${f(b[0] + 1)} ${f(b[1])}`; });
    gal += `<path d="${posts}" stroke="#56626f" stroke-width=".8" fill="none"/>`;
    gal += prism(B, boxC(gx0, y - gW / 2, gz, gx1 - gx0, gW, gH), ['#f3f6f9', '#d6dee6', '#b9c5d1'], 'stroke="#00000022" stroke-width=".4"');
    gal += prism(B, boxC(gx0, y - gW / 2 - 0.3, gz + gH, gx1 - gx0, gW + 0.6, 0.8), ['#4aa3df', '#2f7fb8', '#256a9c']);
    gal += `<path d="${dLine([P(gx0 + 1.5, y + gW / 2, gz + gH * 0.55), P(gx1 - 1, y + gW / 2, gz + gH * 0.55)])}" stroke="#7bb9df" stroke-width="1.6" stroke-dasharray="3 1.6" fill="none"/>`;
    gal += `<path d="${dLine([P(gx0, y + gW / 2, gz + 0.1), P(gx1, y + gW / 2, gz + 0.1), P(gx1, y - gW / 2, gz + 0.1)])}" stroke="#ffffff" stroke-opacity=".7" stroke-width=".5" fill="none"/>`;

    const pileS = coalPile(pile[0], pile[1], { w: pw, d: pd, h: ph });
    const out = pileBehind ? pileS + conveyor + silos + gal + tower : silos + gal + tower + conveyor + pileS;
    return `<g class="silo-battery">${out}</g>`;
  }


  /* =====================================================================
     Round 2: coal-plant equipment (cooling tower, stack, boiler house, plant silo row)
     ===================================================================== */
  Assets.addDefs(
    lin('silo-ct', [[0, '#8a8478'], [.22, '#d9d3c6'], [.34, '#e8e3d8'], [.55, '#c8c1b3'], [.8, '#a39c8f'], [1, '#7c766b']]) +
    lin('silo-ct-in', [[0, '#3b3832'], [.6, '#57534b'], [1, '#6e695f']], true) +
    lin('silo-stk', [[0, '#8d9092'], [.28, '#eceeee'], [.4, '#f3f4f4'], [.62, '#c6c9cb'], [1, '#808487']]) +
    lin('silo-wx', [[0, '#75726c'], [.26, '#cdc9c1'], [.36, '#d8d4cc'], [.6, '#aba79f'], [.84, '#8b8881'], [1, '#6a6762']]) +
    lin('silo-wx-roof', [[0, '#a29e97'], [.4, '#d9d6cf'], [1, '#97938c']]) +
    lin('silo-steam', [[0, '#ffffff'], [1, '#dfe5ec']], true) +
    `<pattern id="silo-mottle" patternUnits="userSpaceOnUse" width="11" height="9">` +
    `<ellipse cx="3" cy="2.5" rx="2.4" ry="1.2" fill="#4a4033" opacity=".09"/>` +
    `<ellipse cx="8.5" cy="6.5" rx="1.8" ry="2.2" fill="#4a4033" opacity=".07"/>` +
    `<ellipse cx="7" cy="1.5" rx="1.4" ry=".8" fill="#ffffff" opacity=".12"/></pattern>`
  );

  // vertical solid of revolution with radius profile rf(z); returns the silhouette polygon
  function revolve(B, x, y, z0, z1, rf, n = 14) {
    const L = [], Rt = [];
    for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n, r = rf(z); L.push(arcPt(B, x, y, z, r, 0)); Rt.push(arcPt(B, x, y, z, r, 1)); }
    return arc(B, x, y, z0, rf(z0), 0, 1, 18).concat(Rt.slice(1, -1), arc(B, x, y, z1, rf(z1), 0, 1, 18).reverse(), L.slice(1, -1).reverse());
  }
  const shadowEl = (B, x, y, r, k = 1.6) => {
    const c = P(x, y, 0), hw = Math.abs(arcPt(B, x, y, 0, r, 1)[0] - arcPt(B, x, y, 0, r, 0)[0]) / 2;
    return `<ellipse cx="${f(c[0] + hw * 0.22)}" cy="${f(c[1] + 1)}" rx="${f(hw * k)}" ry="${f(hw * k * 0.46)}" fill="url(#ao-soft)"/>`;
  };
  const vlines = (B, x, y, z0, z1, rf, ts, n = 8) => ts.map(t => { const a = []; for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; a.push(arcPt(B, x, y, z, rf(z), t)); } return dLine(a); }).join('');
  const steamBlobs = (cx, cy, s, delays) => delays.map((d, i) => {
    const dx = ((i % 3) - 1) * s * 0.35, rr = s * (0.42 + (i % 2) * 0.12);
    return `<g class="puff" style="animation-delay:${d}s;animation-duration:5s"><circle cx="${f(cx + dx)}" cy="${f(cy - s * 0.2)}" r="${f(rr)}" fill="url(#silo-steam)" opacity=".92"/></g>`;
  }).join('');

  /* ---------- hyperboloid cooling tower ---------- */
  function coolingTower(x, y, opts = {}) {
    const r = opts.r != null ? opts.r : 22, h = opts.h != null ? opts.h : 60, steam = opts.steam !== false;
    const B = basis();
    const legH = Math.max(2.5, h * 0.06), rw = r * 0.62, zw = h * 0.65;
    const c = zw / Math.sqrt((r / rw) ** 2 - 1);
    const rf = z => rw * Math.sqrt(1 + ((z - zw) / c) ** 2);
    const rt = rf(h);
    let s = shadowEl(B, x, y, r, 1.45);
    // basin kerb + dark gap under the shell
    s += pg(ring(x, y, 0.2, r + 1.6, r + 1.6, 36), '#b9b3a7');
    s += pg(arc(B, x, y, 0.2, r, 0, 1, 20).concat(arc(B, x, y, legH, rf(legH), 0, 1, 20).reverse()), '#2f2d29');
    // X-column legs
    let lg = ''; const nl = 18;
    for (let i = 0; i < nl; i++) {
      const a0 = arcPt(B, x, y, 0.2, r - 0.4, i / nl), a1 = arcPt(B, x, y, legH, rf(legH) - 0.3, (i + 1) / nl);
      const b0 = arcPt(B, x, y, 0.2, r - 0.4, (i + 1) / nl), b1 = arcPt(B, x, y, legH, rf(legH) - 0.3, i / nl);
      lg += `M${f(a0[0])} ${f(a0[1])} L${f(a1[0])} ${f(a1[1])} M${f(b0[0])} ${f(b0[1])} L${f(b1[0])} ${f(b1[1])}`;
    }
    s += `<path d="${lg}" stroke="#cfc8ba" stroke-width="1" fill="none"/>`;
    // shell
    const shell = revolve(B, x, y, legH, h, rf, 16);
    s += pg(shell, 'url(#silo-ct)', 'stroke="#00000030" stroke-width=".5"') + pg(shell, 'url(#silo-mottle)');
    // faint vertical weathering streaks + construction lifts
    const ts = []; for (let i = 1; i < 14; i++) ts.push(i / 14 + (i % 3) * 0.008);
    s += `<path d="${vlines(B, x, y, legH, h, rf, ts)}" stroke="#4a4438" stroke-opacity=".09" stroke-width=".8" fill="none"/>`;
    let lifts = '';
    for (let k = 1; k < 6; k++) { const z = legH + (h - legH) * k / 6; lifts += dLine(arc(B, x, y, z, rf(z), 0.01, 0.99, 16)); }
    s += `<path d="${lifts}" stroke="#3b362e" stroke-opacity=".1" stroke-width=".5" fill="none"/>`;
    // darker staining under the rim
    s += pg(arc(B, x, y, h - h * 0.12, rf(h - h * 0.12), 0, 1, 16).concat(arc(B, x, y, h, rt, 0, 1, 16).reverse()), '#5a5246', 'opacity=".16"');
    // rim lip + inner wall
    s += pg(ring(x, y, h, rt + 0.9, rt + 0.9, 36), '#ddd7cb', 'stroke="#8a8478" stroke-width=".5"');
    s += pg(ring(x, y, h + 0.1, rt - 0.4, rt - 0.4, 36), 'url(#silo-ct-in)');
    s += `<path d="${dLine(arc(B, x, y, h + 0.1, rt - 0.4, 0, 1, 18))}" stroke="#2a2723" stroke-width=".7" fill="none"/>`;
    if (steam) {
      const tp = P(x, y, h), S2 = rt * 1.25;
      // static billowing plume leaning downwind (+screen x), then rising puffs on top
      const bl = [[-0.3, 0.25, 0.5, '#e6ecf1'], [0.32, 0.35, 0.55, '#dde4eb'], [0, 0.75, 0.62, '#f4f7fa'], [0.45, 1.15, 0.66, '#e9eef3'], [0.05, 1.5, 0.7, '#ffffff'], [0.6, 1.95, 0.62, '#f2f5f8'], [0.3, 2.35, 0.55, '#ffffff']];
      s += '<g>' + bl.map(([dx, dz, rr, cl], i) => `<circle cx="${f(tp[0] + dx * S2)}" cy="${f(tp[1] - dz * S2)}" r="${f(rr * S2)}" fill="${cl}" opacity="${f(0.97 - i * 0.06)}"/>`).join('') +
        `<circle cx="${f(tp[0] + 0.55 * S2)}" cy="${f(tp[1] - 0.25 * S2)}" r="${f(0.4 * S2)}" fill="#c9d2db" opacity=".45"/></g>`;
      s += steamBlobs(tp[0] + 0.4 * S2, tp[1] - 2.2 * S2, S2, [0, -1.25, -2.5, -3.75]);
    }
    return `<g class="silo-cooling-tower">${s}</g>`;
  }

  /* ---------- tall chimney stack ---------- */
  function stack(x, y, opts = {}) {
    const r = opts.r != null ? opts.r : 3.5, h = opts.h != null ? opts.h : 80, bands = !!opts.bands, smoke = opts.smoke !== false;
    const B = basis(), rf = z => r * (1 - 0.25 * z / h);
    let s = shadowEl(B, x, y, r, 1.9);
    s += prism(B, boxC(x - r - 1.2, y - r - 1.2, 0, 2 * r + 2.4, 2 * r + 2.4, 2.2), ['#d9dcdf', '#b9bec3', '#9da3a9']);
    const body = revolve(B, x, y, 2.2, h, rf, 6);
    s += pg(body, 'url(#silo-stk)', 'stroke="#00000030" stroke-width=".5"') + pg(body, 'url(#silo-mottle)');
    // slipform lifts
    let lf = ''; for (let z = 10; z < h - 6; z += 10) lf += dLine(arc(B, x, y, z, rf(z), 0, 1, 8));
    s += `<path d="${lf}" stroke="#000" stroke-opacity=".1" stroke-width=".4" fill="none"/>`;
    const band = (z0, z1, fill, op = 1) => pg(revolve(B, x, y, z0, z1, rf, 1), fill, `opacity="${op}"`);
    if (bands) { for (let i = 0; i < 5; i++) { const z0 = h * 0.78 + i * h * 0.044; s += band(z0, z0 + h * 0.022, '#d4493e'); } }
    s += band(h - Math.max(2, h * 0.04), h, '#3f3b37');
    s += band(h * 0.6, h * 0.605, '#5d6166', .7); // platform ring
    s += pg(ring(x, y, h, rf(h), rf(h), 20), '#1f1d1b');
    s += T(x, y, h, `<circle cx="${f(rf(h) * 0.9)}" r=".8" fill="#ff4a3a" class="glow"/>`);
    if (smoke) {
      const tp = P(x, y, h);
      s += [0, -1.6, -3.2].map(d => `<g class="puff" style="animation-delay:${d}s;animation-duration:4.8s"><circle cx="${f(tp[0] + 2)}" cy="${f(tp[1] - 3)}" r="${f(r * 1.3)}" fill="#c9ced4" opacity=".7"/></g>`).join('');
    }
    return `<g class="silo-stack">${s}</g>`;
  }

  /* ---------- boiler house ---------- */
  // (x,y) = min corner like box(); w along x, d along y, h up
  function boilerHouse(x, y, w, d, h, opts = {}) {
    const B = basis();
    const col = opts.color || ['#f4e08e', '#e8c95a', '#cfae3f'];
    const cc = P(x + w / 2, y + d / 2);
    let s = `<ellipse cx="${f(cc[0] + 2)}" cy="${f(cc[1] + 2)}" rx="${f((w + d) * 0.62)}" ry="${f((w + d) * 0.3)}" fill="url(#ao-soft)"/>`;
    const duct = opts.ductTo; // [x,y] of a stack
    const ductZ = opts.ductZ != null ? opts.ductZ : h * 0.55;
    let ductS = '';
    if (duct) {
      const cx = x + w / 2, cy = y + d / 2, dx = duct[0] - cx, dy = duct[1] - cy;
      const along = Math.abs(dx) >= Math.abs(dy);
      const c = along ? boxC(dx > 0 ? x + w : duct[0], cy - 2, ductZ, Math.abs(dx) - w / 2, 4, 4) : boxC(cx - 2, dy > 0 ? y + d : duct[1], ductZ, 4, Math.abs(dy) - d / 2, 4);
      ductS = prism(B, c, ['#b9bec3', '#9aa1a8', '#80878e'], 'stroke="#00000022" stroke-width=".4"');
      const front = (along ? Math.sign(dx) * B.view[0] : Math.sign(dy) * B.view[1]) > 0;
      if (!front) { s += ductS; ductS = ''; }
    }
    const h1 = h * 0.72, inset = Math.min(w, d) * 0.18;
    s += prism(B, boxC(x, y, 0, w, d, h1), col, 'stroke="#00000022" stroke-width=".4"');
    s += prism(B, boxC(x + inset, y + inset * 0.6, h1, w - inset * 1.6, d - inset * 1.2, h - h1), col, 'stroke="#00000022" stroke-width=".4"');
    // cladding ribs on visible faces
    const ribs = (x0, y0, x1, y1, z0, z1, step) => {
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / step)); let dd = '';
      for (let i = 1; i < n; i++) { const t = i / n, a = P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0), b = P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z1); dd += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; }
      return dd;
    };
    const ux = x + w - inset * 0.6, uy = y + d - inset * 0.6;
    let rd = '';
    if (B.view[1] > 0) rd += ribs(x, y + d, x + w, y + d, 0, h1, 1.8) + ribs(x + inset, uy, ux, uy, h1, h, 1.8);
    if (B.view[0] > 0) rd += ribs(x + w, y, x + w, y + d, 0, h1, 1.8) + ribs(ux, y + inset * 0.6, ux, uy, h1, h, 1.8);
    s += `<path d="${rd}" stroke="#8a6d1c" stroke-opacity=".28" stroke-width=".5" fill="none"/>`;
    // window strips
    const wins = (x0, y0, x1, y1, z) => { const n = Math.max(2, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 4)); let q = ''; for (let i = 0; i < n; i++) { const t0 = (i + 0.3) / n, t1 = (i + 0.7) / n; const a = P(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0, z), b = P(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1, z); q += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; } return q; };
    let wd = '';
    [0.3, 0.62].forEach(k => { if (B.view[1] > 0) wd += wins(x, y + d, x + w, y + d, h1 * k); if (B.view[0] > 0) wd += wins(x + w, y, x + w, y + d, h1 * k); });
    s += `<path d="${wd}" stroke="#4a6f8c" stroke-width="1.6" fill="none"/>`;
    s += `<path d="${dLine([P(x, y + d, h1), P(x + w, y + d, h1), P(x + w, y, h1)])}" stroke="#fff" stroke-opacity=".6" stroke-width=".5" fill="none"/>`;
    // roof plant
    s += prism(B, boxC(x + w * 0.55, y + d * 0.35, h, 3, 3, 2.5), ['#cfd4d9', '#a9b0b7', '#8f979f']);
    s += prism(B, boxC(x + w * 0.3, y + d * 0.4, h, 2.4, 2.4, 1.6), ['#cfd4d9', '#a9b0b7', '#8f979f']);
    return `<g class="silo-boiler">${s}${ductS}</g>`;
  }

  /* ---------- plant silo row (coal_silos_plant.jpg) ---------- */
  // weathered concrete silo on a steel-frame hopper base with a feeder valve
  function hopperSilo(B, x, y, r, h, hb, R, ladder) {
    let s = shadowEl(B, x, y, r, 1.55);
    const q = r * 0.82, lq = r * 0.78, frame = '#4b4f54';
    const legs = [[x - lq, y - lq], [x + lq, y - lq], [x + lq, y + lq], [x - lq, y + lq]];
    const dep = legs.map(p => B.depth(p[0], p[1])), fi = dep.indexOf(Math.max(...dep));
    const legD = i => { const a = P(legs[i][0], legs[i][1], 0), b = P(legs[i][0], legs[i][1], hb); return `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; };
    s += `<path d="${[0, 1, 2, 3].filter(i => i !== fi).map(legD).join('')}" stroke="${frame}" stroke-width="1.1" fill="none"/>`;
    // hopper frustum + panel band
    s += prism(B, [[x - 1.4, y - 1.4, 2.4], [x + 1.4, y - 1.4, 2.4], [x + 1.4, y + 1.4, 2.4], [x - 1.4, y + 1.4, 2.4], [x - q, y - q, hb - 3], [x + q, y - q, hb - 3], [x + q, y + q, hb - 3], [x - q, y + q, hb - 3]], ['#7a7f84', '#666b70', '#55595e']);
    s += prism(B, boxC(x - q, y - q, hb - 3, 2 * q, 2 * q, 3), ['#8d9196', '#7d8186', '#696d72'], 'stroke="#2e3135" stroke-width=".35"');
    s += `<path d="${dLine([P(x - q, y + q, hb - 1.5), P(x + q, y + q, hb - 1.5), P(x + q, y - q, hb - 1.5)])}" stroke="#7b4a2c" stroke-opacity=".55" stroke-width=".6" fill="none"/>`;
    // feeder valve + handwheel
    const v = P(x, y, 1.6);
    s += `<rect x="${f(v[0] - 1)}" y="${f(v[1] - 1.2)}" width="2" height="2.4" fill="#3a3d41"/><circle cx="${f(v[0] + 1.6)}" cy="${f(v[1])}" r="1.2" fill="none" stroke="#9a5a33" stroke-width=".6"/>`;
    // front leg + bracing
    const fl = legs[fi], bL = legs[(fi + 1) % 4], bR = legs[(fi + 3) % 4];
    let br = legD(fi);
    [bL, bR].forEach(o => { const a = P(fl[0], fl[1], 0.5), b = P(o[0], o[1], hb - 3.2), c2 = P(o[0], o[1], 0.5), d2 = P(fl[0], fl[1], hb - 3.2); br += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])} M${f(c2[0])} ${f(c2[1])} L${f(d2[0])} ${f(d2[1])}`; });
    s += `<path d="${br}" stroke="${frame}" stroke-width=".9" fill="none"/>`;
    // shell with board-form seams
    const zb = hb, zt = h;
    const body = arc(B, x, y, zb, r, 0, 1, 20).concat(arc(B, x, y, zt, r, 0, 1, 20).reverse());
    s += pg(body, 'url(#silo-wx)', 'stroke="#00000030" stroke-width=".5"') + pg(body, 'url(#silo-mottle)');
    let seams = '', strong = '', i = 1;
    for (let z = zb + 2.4; z < zt - 0.5; z += 2.4, i++) { if (i % 4) seams += dLine(arc(B, x, y, z, r, 0.02, 0.98, 10)); else strong += dLine(arc(B, x, y, z, r + 0.1, 0, 1, 12)); }
    s += `<path d="${seams}" stroke="#2e2a24" stroke-opacity=".12" stroke-width=".4" fill="none"/><path d="${strong}" stroke="#2e2a24" stroke-opacity=".28" stroke-width=".7" fill="none"/>`;
    s += pg(arc(B, x, y, zb, r, 0.26, 0.33, 2).concat(arc(B, x, y, zt, r, 0.26, 0.33, 2).reverse()), '#fff', 'opacity=".14"');
    let gd = '';
    for (let k = 0; k < 7; k++) { const t = 0.06 + k * 0.14 + R() * 0.05, len = (zt - zb) * (0.2 + R() * 0.55), a = arcPt(B, x, y, zt - 0.3, r, t), b = arcPt(B, x, y, zt - len, r, t); gd += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; }
    s += `<path d="${gd}" stroke="url(#silo-streak)" stroke-width="${f(r * 0.16)}" stroke-linecap="round" fill="none"/>`;
    s += pg(arc(B, x, y, zb, r, 0, 1, 12).concat(arc(B, x, y, zb + 6, r, 0, 1, 12).reverse()), 'url(#silo-stain)');
    if (ladder) {
      const lb = arcPt(B, x, y, zb, r, 0.18), lt = arcPt(B, x, y, zt, r, 0.18);
      let rg = `M${f(lb[0] - 1)} ${f(lb[1])} V${f(lt[1] - 2)} M${f(lb[0] + 1)} ${f(lb[1])} V${f(lt[1] - 2)}`;
      for (let yy = lb[1] - 2; yy > lt[1]; yy -= 2.2) rg += `M${f(lb[0] - 1)} ${f(yy)} H${f(lb[0] + 1)}`;
      s += `<path d="${rg}" stroke="#3f4347" stroke-width=".45" fill="none"/>`;
    }
    // flat roof with guard-rail
    s += pg(ring(x, y, zt, r + 0.4, r + 0.4, 30), 'url(#silo-wx-roof)', 'stroke="#5d5a54" stroke-width=".5"');
    let gr = dLine(arc(B, x, y, zt + 2, r + 0.2, 0, 1, 14));
    for (let k = 0; k <= 6; k++) { const a = arcPt(B, x, y, zt, r + 0.2, k / 6); gr += `M${f(a[0])} ${f(a[1])} V${f(a[1] - 2)}`; }
    s += `<path d="${gr}" stroke="#4a4d51" stroke-width=".45" fill="none"/>`;
    return s;
  }
  // covered belt conveyor between world points S=[x,y,z] and E; lumps travel S -> E
  function beltRun(B, S, E, o = {}) {
    const hw = o.w != null ? o.w / 2 : 2, ch = o.ch != null ? o.ch : 3.2, col = o.col || ['#b5babf', '#999fa5', '#80868c'];
    let ux = E[0] - S[0], uy = E[1] - S[1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const nx = -uy * hw, ny = ux * hw;
    const c = [[S[0] - nx, S[1] - ny, S[2]], [E[0] - nx, E[1] - ny, E[2]], [E[0] + nx, E[1] + ny, E[2]], [S[0] + nx, S[1] + ny, S[2]],
      [S[0] - nx, S[1] - ny, S[2] + ch], [E[0] - nx, E[1] - ny, E[2] + ch], [E[0] + nx, E[1] + ny, E[2] + ch], [S[0] + nx, S[1] + ny, S[2] + ch]];
    const side = (nx * B.view[0] + ny * B.view[1]) > 0 ? 1 : -1;
    const at = (t, off, dz) => P(S[0] + (E[0] - S[0]) * t + nx * off, S[1] + (E[1] - S[1]) * t + ny * off, S[2] + (E[2] - S[2]) * t + dz);
    let s = '';
    if (o.legs) {
      let lg = '';
      o.legs.forEach(t => {
        const wx = S[0] + (E[0] - S[0]) * t, wy = S[1] + (E[1] - S[1]) * t, wz = S[2] + (E[2] - S[2]) * t;
        [-1, 1].forEach(k => { const a = P(wx + nx * k, wy + ny * k, wz), b = P(wx + nx * k * 1.5, wy + ny * k * 1.5, 0); lg += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; });
        for (let z = wz - 6; z > 2; z -= 6) { const a = P(wx - nx * 1.3, wy - ny * 1.3, z), b = P(wx + nx * 1.3, wy + ny * 1.3, z - 4); lg += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; }
      });
      s += `<path d="${lg}" stroke="#4b4f54" stroke-width=".7" fill="none"/>`;
    }
    s += prism(B, c, col, 'stroke="#00000026" stroke-width=".4"');
    s += pg([at(0.03, side * 1.02, 0.8), at(0.97, side * 1.02, 0.8), at(0.97, side * 1.02, 2.2), at(0.03, side * 1.02, 2.2)], '#262a2f');
    let rb = ''; for (let t = 0.06; t < 0.97; t += 0.07) { const a = at(t, side * 1.02, 0), b = at(t, side * 1.02, ch); rb += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; }
    s += `<path d="${rb}" stroke="#000" stroke-opacity=".14" stroke-width=".4" fill="none"/>`;
    s += `<path d="${dLine([at(0, 0, ch), at(1, 0, ch)])}" stroke="#fff" stroke-opacity=".45" stroke-width=".5" fill="none"/>`;
    const bp = dLine([at(0.03, side * 0.98, 1.6), at(0.97, side * 0.98, 1.6)]), dur = o.dur || 4, n = o.n || 4;
    for (let i = 0; i < n; i++) s += `<path d="M-.9 .3 L-.4 -.6 L.7 -.5 L.9 .4 L0 .7Z" fill="#141518"><animateMotion dur="${dur}s" begin="-${f(i * dur / n)}s" repeatCount="indefinite" path="${bp}"/></path>`;
    return s;
  }
  // lattice tower: 4 posts + X bracing on the visible faces
  function lattice(B, x, y, a, z1) {
    const cs = [[x - a, y - a], [x + a, y - a], [x + a, y + a], [x - a, y + a]];
    let p = ''; cs.forEach(c => { const u = P(c[0], c[1], 0), v = P(c[0], c[1], z1); p += `M${f(u[0])} ${f(u[1])} L${f(v[0])} ${f(v[1])}`; });
    let b = '';
    const faces = []; if (B.view[1] > 0) faces.push([cs[3], cs[2]]); if (B.view[0] > 0) faces.push([cs[1], cs[2]]);
    faces.forEach(([m, n]) => { for (let z = 0; z < z1 - 0.5; z += 6) { const z2 = Math.min(z1, z + 6); const q = [P(m[0], m[1], z), P(n[0], n[1], z2), P(n[0], n[1], z), P(m[0], m[1], z2)]; b += `M${f(q[0][0])} ${f(q[0][1])} L${f(q[1][0])} ${f(q[1][1])} M${f(q[2][0])} ${f(q[2][1])} L${f(q[3][0])} ${f(q[3][1])} M${f(q[3][0])} ${f(q[3][1])} L${f(q[1][0])} ${f(q[1][1])}`; } });
    return `<path d="${b}" stroke="#565a5f" stroke-width=".45" fill="none"/><path d="${p}" stroke="#3f4347" stroke-width="1" fill="none"/>`;
  }
  // corrugated gable shed (ridge along x)
  function shed(B, x, y, w, d, h, rh) {
    const cc = P(x + w / 2, y + d / 2);
    let s = `<ellipse cx="${f(cc[0] + 2)}" cy="${f(cc[1] + 1)}" rx="${f((w + d) * 0.6)}" ry="${f((w + d) * 0.27)}" fill="url(#ao-soft)"/>`;
    s += prism(B, boxC(x, y, 0, w, d, h), ['#a7acb1', '#8f959b', '#7a8086'], 'stroke="#00000026" stroke-width=".4"');
    if (B.view[1] > 0) s += pg([P(x + 1, y + d, 0), P(x + w - 1, y + d, 0), P(x + w - 1, y + d, h * 0.45), P(x + 1, y + d, h * 0.45)], '#2d3136');
    if (B.view[0] > 0) s += pg([P(x + w, y + 1.5, 0), P(x + w, y + d - 1.5, 0), P(x + w, y + d - 1.5, h * 0.6), P(x + w, y + 1.5, h * 0.6)], '#3a3e43');
    const ym = y + d / 2, o = 0.8;
    if (B.view[0] > 0) s += pg([P(x + w, y, h), P(x + w, y + d, h), P(x + w, ym, h + rh)], '#7a8086');
    s += pg([P(x - o, y - o, h - 0.3), P(x + w + o, y - o, h - 0.3), P(x + w + o, ym, h + rh), P(x - o, ym, h + rh)], '#8c9298');
    s += pg([P(x - o, y + d + o, h - 0.3), P(x + w + o, y + d + o, h - 0.3), P(x + w + o, ym, h + rh), P(x - o, ym, h + rh)], '#b2b7bc', 'stroke="#00000026" stroke-width=".4"');
    let cr = ''; const n = Math.round(w / 1.4);
    for (let i = 1; i < n; i++) { const xx = x - o + (w + 2 * o) * i / n, a = P(xx, y + d + o, h - 0.3), b = P(xx, ym, h + rh); cr += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; }
    s += `<path d="${cr}" stroke="#000" stroke-opacity=".13" stroke-width=".4" fill="none"/>`;
    s += `<path d="${dLine([P(x - o, ym, h + rh), P(x + w + o, ym, h + rh)])}" stroke="#e3e6e9" stroke-width=".6" fill="none"/>`;
    return s;
  }
  function switchRoom(B, x, y, w = 5, d = 4, h = 4) {
    const cc = P(x + w / 2, y + d / 2);
    let s = `<ellipse cx="${f(cc[0] + 1)}" cy="${f(cc[1] + 1)}" rx="${f(w + 1)}" ry="${f(d * 0.7)}" fill="url(#ao-soft)"/>`;
    s += prism(B, boxC(x, y, 0, w, d, h), ['#c9cdd1', '#b3b8bd', '#979da3'], 'stroke="#00000026" stroke-width=".4"');
    s += prism(B, boxC(x - 0.3, y - 0.3, h, w + 0.6, d + 0.6, 0.6), ['#8e9399', '#767c82', '#62686e']);
    if (B.view[1] > 0) s += pg([P(x + 1, y + d, 0), P(x + 2.4, y + d, 0), P(x + 2.4, y + d, 3), P(x + 1, y + d, 3)], '#4b5057');
    return s;
  }
  // dirt truck tracks: world-space quadratic curves [start, control, end] sampled through P
  function tracks(list) {
    let wide = '', tyre = '';
    list.forEach(([a, c, b]) => {
      const q = []; for (let i = 0; i <= 14; i++) { const t = i / 14, u = 1 - t; q.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
      wide += dLine(q.map(p => P(p[0], p[1], 0.15)));
      [-1.1, 1.1].forEach(k => { tyre += dLine(q.map((p, i) => { const n1 = q[Math.min(i + 1, 14)], p1 = q[Math.max(i - 1, 0)], dx = n1[0] - p1[0], dy = n1[1] - p1[1], L = Math.hypot(dx, dy) || 1; return P(p[0] - dy / L * k, p[1] + dx / L * k, 0.2); })); });
    });
    return `<path d="${wide}" stroke="#8f7a5e" stroke-opacity=".26" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="${tyre}" stroke="#6e5a42" stroke-opacity=".35" stroke-width=".6" fill="none"/>`;
  }

  // anchor (x,y) = centre of the footprint (about x-37..x+37, y-19..y+22); silos run along x at y-10
  function plantSilos(x, y, opts = {}) {
    const n = Math.max(2, Math.min(5, opts.n != null ? opts.n : 4));
    const r = opts.r != null ? opts.r : 7, h = opts.h != null ? opts.h : 40, hb = opts.hopperH != null ? opts.hopperH : 8;
    const B = basis(), R = rnd(Math.abs(Math.round(x * 7 + y * 11)) + 5);
    const sy = y - 10, x0 = x - 37 + r + 1;
    const gap = Math.min(2 * r + 1.6, (56 - 2 * r) / (n - 1));       // row always fits x-36..x+21
    const sx = i => x0 + i * gap;
    const tx = sx(n - 1) + r + 6, ta = 3;                            // lattice tower + transfer house
    const gz = h + 2.8, tH = gz - 0.5;
    const shX = x - 16, shY = y + 6, shW = 15, shD = 11, shH = 8;    // crusher shed
    const pile = [x - 29, y + 13];
    let s = tracks([
      [[x - 22, y + 22], [x - 14, y + 2], [x + 6, y + 4]],
      [[x + 36, y + 21], [x + 10, y + 18], [x - 2, y + 10]],
      [[x - 37, y + 3], [x - 24, y + 4], [x - 18, y + 21]]
    ]);
    const idx = []; for (let i = 0; i < n; i++) idx.push(i);
    idx.sort((a, b) => B.depth(sx(a), sy) - B.depth(sx(b), sy)).forEach(i => { s += hopperSilo(B, sx(i), sy, r, h, hb, R, i === 0); });
    // gallery across the tops (coal travels from the transfer house toward the first silo)
    let posts = '';
    for (let i = 0; i < n; i++) { const a = P(sx(i), sy, h), b = P(sx(i), sy, gz); posts += `M${f(a[0] - .8)} ${f(a[1])} L${f(b[0] - .8)} ${f(b[1])} M${f(a[0] + .8)} ${f(a[1])} L${f(b[0] + .8)} ${f(b[1])}`; }
    s += `<path d="${posts}" stroke="#3f4347" stroke-width=".8" fill="none"/>`;
    s += beltRun(B, [tx - ta - 0.5, sy, gz], [sx(0) - r * 0.4, sy, gz], { w: 4.4, ch: 3.8, n: 4, dur: 5 });
    s += `<path d="${dLine([P(sx(0) - r * 0.4, sy + 3.2, gz + 1.6), P(tx - ta, sy + 3.2, gz + 1.6)])}" stroke="#4a4d51" stroke-width=".45" fill="none"/>`;
    // lattice tower + transfer house
    const tc = P(tx, sy);
    s += `<ellipse cx="${f(tc[0] + 1.5)}" cy="${f(tc[1] + 1)}" rx="7" ry="3.2" fill="url(#ao-soft)"/>`;
    s += lattice(B, tx, sy, ta, tH);
    s += prism(B, boxC(tx - 4.2, sy - 4.2, tH, 8.4, 8.4, 7.5), ['#a9aeb3', '#8f959b', '#777d83'], 'stroke="#00000030" stroke-width=".4"');
    s += prism(B, boxC(tx - 4.6, sy - 4.6, tH + 7.5, 9.2, 9.2, 0.7), ['#6e7379', '#5d6268', '#4d5258']);
    let crg = ''; for (let k = 1; k < 8; k++) { const a = P(tx - 4.2 + k * 1.05, sy + 4.2, tH), b = P(tx - 4.2 + k * 1.05, sy + 4.2, tH + 7.5); crg += `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`; }
    s += `<path d="${crg}" stroke="#000" stroke-opacity=".12" stroke-width=".4" fill="none"/>`;
    s += pg([P(tx + 4.2, sy - 1.2, tH + 2.5), P(tx + 4.2, sy + 1.2, tH + 2.5), P(tx + 4.2, sy + 1.2, tH + 5), P(tx + 4.2, sy - 1.2, tH + 5)], '#4b5a66');
    s += `<path d="${dLine([P(tx - 4.6, sy + 4.6, tH), P(tx + 4.6, sy + 4.6, tH), P(tx + 4.6, sy - 4.6, tH)])}" stroke="#3f4347" stroke-width=".6" fill="none"/>`;
    // coal pile -> feed belt -> crusher shed -> inclined conveyor -> transfer house
    s += coalPile(pile[0], pile[1], { w: 12, d: 13, h: 7 });
    s += beltRun(B, [pile[0] + 5, pile[1], 1.2], [shX + 0.5, shY + shD / 2, shH - 3], { w: 2.6, ch: 2, n: 2, dur: 3 });
    s += shed(B, shX, shY, shW, shD, shH, 3);
    s += beltRun(B, [shX + shW * 0.7, shY + shD / 2, shH + 2.2], [tx - 1, sy + 4.2, tH + 1], { w: 4, ch: 3.4, n: 5, dur: 4.5, legs: [0.3, 0.6] });
    s += switchRoom(B, tx - 6, y + 9) + switchRoom(B, x + 16, y + 15, 6, 4, 4);
    s += T(shX + shW / 2, shY + shD / 2, shH + 4, `<g class="puff" style="animation-duration:5s"><circle r="3" fill="#8f9297" opacity=".35"/></g>`);
    return `<g class="silo-plant">${s}</g>`;
  }

  Assets.silos = { silo, battery, coalPile, coolingTower, stack, boilerHouse, plantSilos };
})();
