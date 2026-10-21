/* REA rural houses: gabled homes, school block, thatched rondavel.
   Namespace: Assets.houses   Defs prefix: hs-
   All geometry goes through the global P(), called lazily (NOIC swaps P at runtime). */
(function () {
  const A = window.Assets = window.Assets || {};

  A.addDefs(
    `<pattern id="hs-plaster" width="6" height="5" patternUnits="userSpaceOnUse">` +
      `<circle cx="1" cy="1.2" r=".35" fill="#5b4a36" fill-opacity=".16"/><circle cx="4.2" cy="3.4" r=".3" fill="#5b4a36" fill-opacity=".13"/>` +
      `<circle cx="2.8" cy="4.2" r=".45" fill="#fff" fill-opacity=".28"/><rect x="3.5" y=".6" width="1.5" height=".3" fill="#5b4a36" fill-opacity=".09"/></pattern>` +
    `<linearGradient id="hs-wallshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3b2a18" stop-opacity=".18"/></linearGradient>` +
    `<linearGradient id="hs-roofshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".24"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>` +
    `<linearGradient id="hs-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6cf"/><stop offset=".5" stop-color="#ffd36b"/><stop offset="1" stop-color="#f2a93b"/></linearGradient>` +
    `<linearGradient id="hs-pv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a5592"/><stop offset=".5" stop-color="#1b3a69"/><stop offset="1" stop-color="#132a4f"/></linearGradient>` +
    `<linearGradient id="hs-thatch" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d5e31"/><stop offset=".3" stop-color="#dcb872"/><stop offset=".58" stop-color="#c09650"/><stop offset="1" stop-color="#6a4e27"/></linearGradient>` +
    `<linearGradient id="hs-mud" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a0704a"/><stop offset=".3" stop-color="#e2b88a"/><stop offset=".6" stop-color="#c8936a"/><stop offset="1" stop-color="#8a5a36"/></linearGradient>` +
    `<linearGradient id="hs-tank" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f4a2a"/><stop offset=".3" stop-color="#5aa268"/><stop offset=".55" stop-color="#3b7c48"/><stop offset="1" stop-color="#1c3f24"/></linearGradient>` +
    `<linearGradient id="hs-zflag" x1="0" y1="0" x2="0" y2="1">` +
      [['#2e9a48', 0], ['#ffd200', 1], ['#d8262e', 2], ['#1b1b1b', 3], ['#d8262e', 4], ['#ffd200', 5], ['#2e9a48', 6]]
        .map(([c, i]) => `<stop offset="${(i / 7).toFixed(3)}" stop-color="${c}"/><stop offset="${((i + 1) / 7).toFixed(3)}" stop-color="${c}"/>`).join('') +
    `</linearGradient>`
  );

  /* ---------- small helpers ---------- */
  const f = n => (+n).toFixed(1);
  const OL = 'stroke="#1b2633" stroke-opacity=".2" stroke-width=".5" stroke-linejoin="round"';
  const qd = a => 'M' + a.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + 'Z';
  const sg = (a, b) => `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`;
  const path = (d, attrs) => d ? `<path d="${d}" ${attrs}/>` : '';
  const SILL = ['#f4f1ea', '#d9d3c7', '#bfb8aa'];
  const CONC = ['#e4e1da', '#c8c3b8', '#aea89c'];
  const BRICK = ['#d08d6c', '#b0653f', '#934f30'];

  // shaded box with outline and top-front highlight
  function sbox(x, y, z, w, d, h, c, extra = '') {
    const L = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const R = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
    const Tp = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    return `<g ${extra}>` + poly(L, c[1], OL) + poly(R, c[2], OL) + poly(Tp, c[0], OL) +
      path(sg(P(x, y + d, z + h), P(x + w, y + d, z + h)) + sg(P(x + w, y + d, z + h), P(x + w, y, z + h)), 'stroke="#fff" stroke-opacity=".55" stroke-width=".45" fill="none"') + '</g>';
  }
  // soft contact shadow under a rectangular footprint, pushed toward +x (light from top-left)
  function ao(x, y, w, d, pad = 2.5, sx = 3) {
    return poly([P(x - pad * .4, y - pad * .4), P(x + w + pad + sx, y - pad * .4), P(x + w + pad + sx, y + d + pad), P(x - pad * .4, y + d + pad)], '#0b1e33', 'opacity=".09" stroke="#0b1e33" stroke-width="4" stroke-linejoin="round"') +
      poly([P(x - .5, y - .5), P(x + w + 1.2, y - .5), P(x + w + 1.2, y + d + 1), P(x - .5, y + d + 1)], '#0b1e33', 'opacity=".15"');
  }
  // fence run -> [posts d, rails d]
  function fenceRun(x0, y0, x1, y1, h = 5) {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4.5));
    let po = '';
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; po += sg(P(x, y, 0), P(x, y, h)); }
    const ra = sg(P(x0, y0, h - .8), P(x1, y1, h - .8)) + sg(P(x0, y0, h * .45), P(x1, y1, h * .45));
    return [po, ra];
  }
  const fenceDraw = runs => {
    let po = '', ra = '';
    runs.forEach(r => { const [a, b] = fenceRun(...r); po += a; ra += b; });
    return path(ra, 'stroke="#b39770" stroke-width=".5" fill="none"') + path(po, 'stroke="#7f5d3c" stroke-width=".95" stroke-linecap="round" fill="none"');
  };

  // windows ------------------------------------------------
  function winLeft(X, Y, z, ww, hh, delay, frame = '#f6f2ea') {
    let s = winL(X - .7, Y, z - .7, ww + 1.4, hh + 1.4, frame, OL);
    s += winL(X, Y, z, ww, hh, 'url(#hs-glow)', `class="flick" style="animation-delay:${f(delay)}s"`);
    s += winL(X, Y, z, ww * .24, hh, '#c9763e', 'opacity=".45"');
    s += path(sg(P(X + ww / 2, Y, z), P(X + ww / 2, Y, z + hh)) + sg(P(X, Y, z + hh * .58), P(X + ww, Y, z + hh * .58)), `stroke="${frame}" stroke-width=".6" fill="none"`);
    s += sbox(X - 1, Y, z - 1.5, ww + 2, 1, .8, SILL);
    return s;
  }
  function winRight(X, Y, z, ww, hh, delay, frame = '#f6f2ea') {
    let s = winR(X, Y - .7, z - .7, ww + 1.4, hh + 1.4, frame, OL);
    s += winR(X, Y, z, ww, hh, 'url(#hs-glow)', `class="flick" style="animation-delay:${f(delay)}s"`);
    s += path(sg(P(X, Y + ww / 2, z), P(X, Y + ww / 2, z + hh)) + sg(P(X, Y, z + hh * .58), P(X, Y + ww, z + hh * .58)), `stroke="${frame}" stroke-width=".6" fill="none"`);
    s += sbox(X, Y - 1, z - 1.5, 1, ww + 2, .8, SILL);
    return s;
  }
  function door(X, Y, ww, hh, col, delay) {
    let s = winL(X - .6, Y, 0, ww + 1.2, hh + .6, '#efe9dd', OL);
    s += winL(X, Y, 0, ww, hh, col, OL);
    s += path(qd([P(X + ww * .2, Y, hh * .55), P(X + ww * .8, Y, hh * .55), P(X + ww * .8, Y, hh * .9), P(X + ww * .2, Y, hh * .9)]) +
      qd([P(X + ww * .2, Y, hh * .1), P(X + ww * .8, Y, hh * .1), P(X + ww * .8, Y, hh * .45), P(X + ww * .2, Y, hh * .45)]), 'fill="none" stroke="#000" stroke-opacity=".22" stroke-width=".4"');
    const k = P(X + ww * .82, Y, hh * .5);
    s += `<circle cx="${f(k[0])}" cy="${f(k[1])}" r=".45" fill="#f2c35c"/>`;
    const l = P(X + ww / 2, Y, hh + 1.6);
    s += `<circle cx="${f(l[0])}" cy="${f(l[1])}" r="2.2" fill="#ffe9a8" opacity=".4" class="glow" style="animation-delay:${f(delay)}s"/><circle cx="${f(l[0])}" cy="${f(l[1])}" r=".7" fill="#fff4c8"/>`;
    return s;
  }

  // walls (left face + right face incl. gable)
  function walls(x, y, w, d, h, r, wall, o) {
    const xw = x + w, yd = y + d, ym = y + d / 2;
    const Lf = [P(x, yd, 0), P(xw, yd, 0), P(xw, yd, h), P(x, yd, h)];
    const Rf = [P(xw, y, 0), P(xw, yd, 0), P(xw, yd, h), P(xw, ym, h + r), P(xw, y, h)];
    let s = poly(Lf, wall[1], OL) + poly(Rf, wall[2], OL);
    s += poly(Lf, 'url(#hs-plaster)') + poly(Rf, 'url(#hs-plaster)');
    s += poly(Lf, 'url(#hs-wallshade)') + poly(Rf, 'url(#hs-wallshade)');
    // plinth
    s += path(qd([P(x, yd, 0), P(xw, yd, 0), P(xw, yd, 1.6), P(x, yd, 1.6)]) + qd([P(xw, y, 0), P(xw, yd, 0), P(xw, yd, 1.6), P(xw, y, 1.6)]), 'fill="#6b5641" opacity=".32"');
    // quoins
    if (o.quoins) {
      let q = '';
      for (let z = 1.6, k = 0; z + 1.9 <= h; z += 2.3, k++) {
        const a = k % 2 ? 1.6 : 2.6;
        q += qd([P(x, yd, z), P(x + a, yd, z), P(x + a, yd, z + 1.9), P(x, yd, z + 1.9)]);
        q += qd([P(xw - a, yd, z), P(xw, yd, z), P(xw, yd, z + 1.9), P(xw - a, yd, z + 1.9)]);
        const b = k % 2 ? 2.6 : 1.6;
        q += qd([P(xw, yd - b, z), P(xw, yd, z), P(xw, yd, z + 1.9), P(xw, yd - b, z + 1.9)]);
      }
      s += path(q, `fill="${o.quoinCol || '#b4704d'}" stroke="#7d4a30" stroke-opacity=".35" stroke-width=".3"`);
    }
    // corner highlight + eave shadow + gable barge shadow
    s += path(sg(P(xw, yd, 0), P(xw, yd, h)), 'stroke="#fff" stroke-opacity=".6" stroke-width=".5"');
    s += poly([P(x, yd, h - 2.2), P(xw, yd, h - 2.2), P(xw, yd, h), P(x, yd, h)], '#0b1e33', 'opacity=".16"');
    s += `<polyline points="${pts([P(xw, yd, h), P(xw, ym, h + r), P(xw, y, h)])}" fill="none" stroke="#0b1e33" stroke-opacity=".18" stroke-width="2.4" stroke-linejoin="round"/>`;
    return s;
  }

  // roof: back slope (call before walls) and front slope + trims (call after walls)
  function roofGeo(x, y, w, d, h, r, o) {
    const oh = o.oh ?? 2, e = o.eave ?? 2, ez = e * r / (d / 2);
    return { xa: x - oh, xb: x + w + oh, yF: y + d + e, yB: y - e, ze: h - ez, ym: y + d / 2, zr: h + r };
  }
  function roofBack(g, roof) {
    return poly([P(g.xa, g.yB, g.ze), P(g.xb, g.yB, g.ze), P(g.xb, g.ym, g.zr), P(g.xa, g.ym, g.zr)], roof[2], OL);
  }
  function roofFront(g, roof, o) {
    const F = [P(g.xa, g.yF, g.ze), P(g.xb, g.yF, g.ze), P(g.xb, g.ym, g.zr), P(g.xa, g.ym, g.zr)];
    let s = poly(F, roof[1], OL);
    const at = (u, v) => P(u, g.yF + (g.ym - g.yF) * v, g.ze + (g.zr - g.ze) * v);
    if (o.tile) {
      const n = Math.max(3, Math.round(Math.hypot(g.yF - g.ym, g.zr - g.ze) / 2.2));
      let dk = '', lt = '', tk = '';
      for (let i = 1; i < n; i++) {
        dk += sg(at(g.xa, i / n), at(g.xb, i / n));
        lt += sg(at(g.xa, i / n - .06), at(g.xb, i / n - .06));
      }
      for (let i = 0; i < n; i++)
        for (let u = g.xa + (i % 2 ? 1.6 : 3.2); u < g.xb - .5; u += 3.2) tk += sg(at(u, i / n), at(u, (i + 1) / n));
      s += path(dk, 'stroke="#000" stroke-opacity=".22" stroke-width=".55" fill="none"') +
        path(lt, 'stroke="#fff" stroke-opacity=".2" stroke-width=".4" fill="none"') +
        path(tk, 'stroke="#000" stroke-opacity=".13" stroke-width=".35" fill="none"');
    } else {
      let dk = '', lt = '', lap = '';
      for (let u = g.xa + 1.2; u < g.xb - .4; u += 1.5) { dk += sg(at(u, 0), at(u, 1)); lt += sg(at(u + .5, 0), at(u + .5, 1)); }
      for (let u = g.xa + 8; u < g.xb - 2; u += 8) lap += sg(at(u, 0), at(u, 1));
      lap += sg(at(g.xa, .5), at(g.xb, .5));
      s += path(dk, 'stroke="#000" stroke-opacity=".15" stroke-width=".45" fill="none"') +
        path(lt, 'stroke="#fff" stroke-opacity=".22" stroke-width=".35" fill="none"') +
        path(lap, 'stroke="#000" stroke-opacity=".2" stroke-width=".6" fill="none"');
    }
    s += poly(F, 'url(#hs-roofshade)');
    return s;
  }
  function roofTrim(g, roof, o) {
    const fa = o.fascia || '#f1ece2', fb = o.fasciaDark || '#d3cbbb';
    let s = '';
    // eave fascia board
    s += poly([P(g.xa, g.yF, g.ze), P(g.xb, g.yF, g.ze), P(g.xb, g.yF, g.ze - 1), P(g.xa, g.yF, g.ze - 1)], fa, OL);
    // barge boards on the +x gable
    s += poly([P(g.xb, g.yF, g.ze), P(g.xb, g.ym, g.zr), P(g.xb, g.ym, g.zr - 1), P(g.xb, g.yF, g.ze - 1)], fb, OL);
    s += poly([P(g.xb, g.ym, g.zr), P(g.xb, g.yB, g.ze), P(g.xb, g.yB, g.ze - 1), P(g.xb, g.ym, g.zr - 1)], fb, OL);
    // ridge cap
    s += path(sg(P(g.xa - .3, g.ym, g.zr + .2), P(g.xb + .3, g.ym, g.zr + .2)), `stroke="${roof[2]}" stroke-width="2.2" stroke-linecap="round"`);
    s += path(sg(P(g.xa, g.ym, g.zr + .8), P(g.xb, g.ym, g.zr + .8)), 'stroke="#fff" stroke-opacity=".4" stroke-width=".55"');
    // eave highlight
    s += path(sg(P(g.xa, g.yF, g.ze), P(g.xb, g.yF, g.ze)), 'stroke="#fff" stroke-opacity=".5" stroke-width=".5"');
    return s;
  }
  function solar(g, x, w, o) {
    const u0 = x + (o.solarFrom ?? 3), u1 = x + w - (o.solarTo ?? 3), v0 = .14, v1 = .8, lift = .7;
    const at = (u, v, l = lift) => P(u, g.yF + (g.ym - g.yF) * v, g.ze + (g.zr - g.ze) * v + l);
    const fr = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
    let s = poly([at(u0, v0, 0), at(u1, v0, 0), at(u1, v0), at(u0, v0)], '#56626f');
    s += poly(fr, '#cfd6de', OL);
    const iu0 = u0 + .5, iu1 = u1 - .5, iv0 = v0 + .05, iv1 = v1 - .05;
    s += poly([at(iu0, iv0), at(iu1, iv0), at(iu1, iv1), at(iu0, iv1)], 'url(#hs-pv)');
    let gd = '';
    const nc = Math.max(2, Math.round((iu1 - iu0) / 2.6));
    for (let i = 1; i < nc; i++) { const u = iu0 + (iu1 - iu0) * i / nc; gd += sg(at(u, iv0), at(u, iv1)); }
    for (let j = 1; j < 3; j++) { const v = iv0 + (iv1 - iv0) * j / 3; gd += sg(at(iu0, v), at(iu1, v)); }
    s += path(gd, 'stroke="#8fb6e6" stroke-opacity=".55" stroke-width=".35" fill="none"');
    // split into two modules
    s += path(sg(at((iu0 + iu1) / 2, iv0 - .05), at((iu0 + iu1) / 2, iv1 + .05)), 'stroke="#cfd6de" stroke-width=".7"');
    s += poly([at(iu0, iv0), at(iu1, iv0), at(iu1, iv1), at(iu0, iv1)], 'url(#sheen)');
    return s;
  }
  function chimney(x, y, w, d, h, r) {
    const cx = x + w * .2, cy = y + d * .22;
    let s = sbox(cx, cy, h + r * .35, 3, 3, r * .65 + 4.5, BRICK);
    const zt = h + r + 4.5;
    s += path(sg(P(cx, cy + 3, zt - 2.4), P(cx + 3, cy + 3, zt - 2.4)) + sg(P(cx + 3, cy, zt - 2.4), P(cx + 3, cy + 3, zt - 2.4)) +
      sg(P(cx, cy + 3, zt - 4.6), P(cx + 3, cy + 3, zt - 4.6)) + sg(P(cx + 3, cy, zt - 4.6), P(cx + 3, cy + 3, zt - 4.6)), 'stroke="#f2d2bf" stroke-opacity=".55" stroke-width=".35"');
    s += sbox(cx - .4, cy - .4, zt, 3.8, 3.8, .8, CONC);
    const t = P(cx + 1.5, cy + 1.5, zt + 2);
    s += `<circle cx="${f(t[0])}" cy="${f(t[1])}" r="2" fill="#eef2f6" opacity=".8" class="puff" style="animation-delay:${f(cx % 3 * .7)}s"/>`;
    return s;
  }
  function tankStand(tx, ty, legH = 9, rr = 4) {
    const [sx, sy] = P(tx, ty, 0);
    const inner =
      `<ellipse cx="2" cy="0" rx="${rr + 2.5}" ry="${(rr + 2.5) / 2}" fill="url(#ao-soft)"/>` +
      `<path d="M-${rr - .6} 0 L-${rr - 1} -${legH} M${rr - .6} 0 L${rr - 1} -${legH} M-1 1.6 L-1 -${legH - 1} M-${rr - .8} -${legH * .45} L${rr - .8} -${legH * .45} M-${rr - .8} -1 L${rr - .8} -${legH * .45}" stroke="#7d8b99" stroke-width=".9" fill="none"/>` +
      `<rect x="-${rr + .6}" y="-${legH + .8}" width="${2 * rr + 1.2}" height="1.2" fill="#8d9bab"/>` +
      `<ellipse cx="0" cy="-${legH + .8}" rx="${rr}" ry="${rr / 2}" fill="#1c3f24"/>` +
      `<rect x="-${rr}" y="-${legH + 8.8}" width="${2 * rr}" height="8" fill="url(#hs-tank)"/>` +
      `<path d="M-${rr} -${legH + 3.2} h${2 * rr} M-${rr} -${legH + 5.8} h${2 * rr}" stroke="#123018" stroke-opacity=".45" stroke-width=".45"/>` +
      `<ellipse cx="0" cy="-${legH + 8.8}" rx="${rr}" ry="${rr / 2}" fill="#4f9a5d" stroke="#2f6b3a" stroke-width=".4"/>` +
      `<ellipse cx="0" cy="-${legH + 9.1}" rx="${rr * .35}" ry="${rr * .17}" fill="#2f6b3a"/>`;
    return `<g transform="translate(${f(sx)},${f(sy)})">${inner}</g>`;
  }
  function carport(xw, y, d, h, roof) {
    const x0 = xw + 1.5, x1 = xw + 13, y0 = y + 1, y1 = Math.min(y + d - 1, y + 16), zt = h - 4;
    const post = (px, py) => path(sg(P(px, py, 0), P(px, py, zt)), 'stroke="#8d9bab" stroke-width="1.1"');
    let s = ao(x0, y0, x1 - x0, y1 - y0, 1.5, 1.5);
    s += post(x0 + .5, y0 + .5) + post(x1 - .5, y0 + .5);
    // car
    const cx = x0 + 2, cy = y0 + 2.5, cw = 8, cd = Math.min(14, y1 - y0 - 4);
    s += ao(cx, cy, cw, cd, 1, 1);
    s += sbox(cx, cy, .6, cw, cd, 2.6, ['#e8eef4', '#c3ccd6', '#a5b0bc']);
    s += sbox(cx + 1, cy + 3, 3.2, cw - 2, cd - 6, 2, ['#dfe6ee', '#7fa8c9', '#5e87a8']);
    s += path(sg(P(cx + cw, cy + 2, .4), P(cx + cw, cy + 2, 1.6)) + sg(P(cx + cw, cy + cd - 2, .4), P(cx + cw, cy + cd - 2, 1.6)) +
      sg(P(cx + 2, cy + cd, .4), P(cx + 2, cy + cd, 1.6)) + sg(P(cx + cw - 2, cy + cd, .4), P(cx + cw - 2, cy + cd, 1.6)), 'stroke="#23272c" stroke-width="1.6" stroke-linecap="round"');
    s += post(x0 + .5, y1 - .5) + post(x1 - .5, y1 - .5);
    // flat roof sheet
    s += poly([P(x0 - .5, y1 + .5, zt), P(x1 + .5, y1 + .5, zt), P(x1 + .5, y1 + .5, zt + .7), P(x0 - .5, y1 + .5, zt + .7)], roof[2], OL);
    s += poly([P(x1 + .5, y0 - .5, zt), P(x1 + .5, y1 + .5, zt), P(x1 + .5, y1 + .5, zt + .7), P(x1 + .5, y0 - .5, zt + .7)], roof[2], OL);
    s += poly([P(x0 - .5, y0 - .5, zt + .7), P(x1 + .5, y0 - .5, zt + .7), P(x1 + .5, y1 + .5, zt + .7), P(x0 - .5, y1 + .5, zt + .7)], roof[1], OL);
    let cl = '';
    for (let yy = y0 + .8; yy < y1; yy += 1.6) cl += sg(P(x0 - .5, yy, zt + .7), P(x1 + .5, yy, zt + .7));
    s += path(cl, 'stroke="#000" stroke-opacity=".14" stroke-width=".4"');
    return s;
  }
  function porch(px0, px1, yd, h, roof) {
    const dp = 5.5, zt0 = h - 2.2, zt1 = h - 4.2;
    let s = sbox(px0, yd, 0, px1 - px0, dp, .9, CONC);
    s += path(sg(P(px0 + .6, yd + dp - .6, .9), P(px0 + .6, yd + dp - .6, zt1)) + sg(P(px1 - .6, yd + dp - .6, .9), P(px1 - .6, yd + dp - .6, zt1)), 'stroke="#efe9dd" stroke-width="1.2"');
    const R = [P(px0 - .5, yd, zt0), P(px1 + .5, yd, zt0), P(px1 + .5, yd + dp, zt1), P(px0 - .5, yd + dp, zt1)];
    s += poly([P(px0 - .5, yd + dp, zt1), P(px1 + .5, yd + dp, zt1), P(px1 + .5, yd + dp, zt1 - .7), P(px0 - .5, yd + dp, zt1 - .7)], '#f1ece2', OL);
    s += poly([P(px1 + .5, yd, zt0), P(px1 + .5, yd + dp, zt1), P(px1 + .5, yd + dp, zt1 - .7), P(px1 + .5, yd, zt0 - .7)], '#d3cbbb', OL);
    s += poly(R, roof[1], OL);
    let cl = '';
    for (let u = px0 + .7; u < px1; u += 1.4) cl += sg(P(u, yd, zt0), P(u, yd + dp, zt1));
    s += path(cl, 'stroke="#000" stroke-opacity=".15" stroke-width=".4"') + poly(R, 'url(#hs-roofshade)');
    return s;
  }

  /* ---------- house ---------- */
  const DOORS = ['#7a4b2a', '#2f6b8f', '#8a3b32', '#4f6b3a'];
  function house(x, y, w, d, h, r, wall, roof, solarOn = true, delay = 0, opts = {}) {
    opts = opts || {};
    const v = ((opts.variant | 0) % 4 + 4) % 4;
    const o = {
      porch: v === 0, chimney: v !== 2, tank: v === 1, carport: v === 2, tile: v === 1 || v === 3, quoins: v === 1 || v === 3,
      ...opts
    };
    const xw = x + w, yd = y + d;
    const dw = 5, dh = Math.min(8.5, h - 3.5);
    const dx = o.doorAt != null ? x + o.doorAt : (o.porch ? x + w * .5 - dw / 2 : x + w * .42);
    const g = roofGeo(x, y, w, d, h, r, o);
    let s = '';
    // yard ground + back fence
    const m = o.yardMargin ?? 5, mxe = o.carport ? 15 : o.tank ? 10 : m;
    if (o.yard) {
      s += poly([P(x - m, y - m, .2), P(xw + mxe, y - m, .2), P(xw + mxe, yd + m, .2), P(x - m, yd + m, .2)], '#e6d6b4', 'opacity=".6"');
      s += fenceDraw([[x - m, y - m, xw + mxe, y - m], [x - m, y - m, x - m, yd + m]]);
    }
    s += ao(x, y, w, d);
    s += roofBack(g, roof);
    if (o.chimney) s += chimney(x, y, w, d, h, r);
    s += walls(x, y, w, d, h, r, wall, o);
    // windows on the long (left) face
    const ww = 5, wz = 3.6, wh = Math.min(6, h - 6);
    const wl = [x + 3.2, xw - 3.2 - ww];
    if (o.porch) { wl[0] = Math.min(wl[0], dx - 5.5 - ww); wl[1] = Math.max(wl[1], dx + dw + 5.5); }
    wl.forEach((wx, i) => { if (wx >= x + 1.5 && wx + ww <= xw - 1.5) s += winLeft(wx, yd, wz, ww, wh, delay + i * .6); });
    if (!o.carport) s += winRight(xw, y + d / 2 - 2.5, wz, 5, wh, delay + 1.2);
    s += door(dx, yd, dw, dh, o.doorCol || DOORS[v], delay + .3);
    if (o.porch) s += porch(dx - 4.5, dx + dw + 4.5, yd, h, roof);
    s += roofFront(g, roof, o);
    if (solarOn) s += solar(g, x, w, o);
    s += roofTrim(g, roof, o);
    if (!o.porch) s += sbox(dx - 1, yd, 0, dw + 2, 2, 1.1, CONC);
    if (o.tank) s += tankStand(xw + 4.5, y + 4);
    if (o.carport) s += carport(xw, y, d, h, roof);
    if (o.yard) {
      const gx0 = dx - 1.5, gx1 = dx + dw + 1.5;
      s += fenceDraw([[xw + mxe, y - m, xw + mxe, yd + m], [x - m, yd + m, gx0, yd + m], [gx1, yd + m, xw + mxe, yd + m]]);
    }
    return `<g class="hs-house">${s}</g>`;
  }

  /* ---------- school ---------- */
  function school(x = -92, y = 30, opts = {}) {
    opts = opts || {};
    if (x == null) x = -92; if (y == null) y = 30;
    const w = opts.w ?? 36, d = opts.d ?? 20, h = opts.h ?? 13, r = opts.r ?? 7;
    const wall = opts.wall || ['#fff3d6', '#f2dca8', '#dcc48a'];
    const roof = opts.roof || ['#f06a5f', '#c9473c', '#a8382f'];
    const delay = opts.delay ?? 0;
    const xw = x + w, yd = y + d;
    const o = { quoins: true, quoinCol: '#c98a62', tile: false, ...opts };
    const g = roofGeo(x, y, w, d, h, r, o);
    let s = ao(x, y, w, d + 6, 3, 4);
    s += roofBack(g, roof);
    s += walls(x, y, w, d, h, r, wall, o);
    // band of paint on the lower wall (school colours)
    s += poly([P(x, yd, 1.6), P(xw, yd, 1.6), P(xw, yd, 2.6), P(x, yd, 2.6)], '#4f7fb0', 'opacity=".55"') +
      poly([P(xw, y, 1.6), P(xw, yd, 1.6), P(xw, yd, 2.6), P(xw, y, 2.6)], '#3f6e9c', 'opacity=".55"');
    // window row + doors
    const doors = opts.doors || [w * .5 - 2.5];
    const slots = [];
    for (let wx = x + 2.5; wx + 4.5 <= xw - 2; wx += 6.6) slots.push(wx);
    let k = 0;
    slots.forEach(wx => {
      if (doors.some(dd => wx + 4.5 > x + dd - 1.2 && wx < x + dd + 6.2)) return;
      s += winLeft(wx, yd, 3, 4.5, 4.2, delay + (k++) * .5, '#f8f5ee');
    });
    doors.forEach((dd, i) => s += door(x + dd, yd, 5, 8, '#2f6b8f', delay + .25 + i * .4));
    s += winRight(xw, y + 3, 3, 4.5, 4.2, delay + 1.4) + winRight(xw, yd - 7.5, 3, 4.5, 4.2, delay + 1.9);
    // veranda
    const dp = 5.5, zt0 = h - 1.8, zt1 = h - 3.2;
    s += sbox(x - .5, yd, 0, w + 1, dp, .9, CONC);
    s += poly([P(x - .5, yd + dp, 0), P(xw + .5, yd + dp, 0), P(xw + .5, yd + dp + 1.2, 0), P(x - .5, yd + dp + 1.2, 0)], '#0b1e33', 'opacity=".1"');
    let posts = '';
    const np = Math.max(2, Math.round(w / 7));
    for (let i = 0; i <= np; i++) { const px = x + .3 + (w - .6) * i / np; posts += sg(P(px, yd + dp - .6, .9), P(px, yd + dp - .6, zt1)); }
    s += path(posts, 'stroke="#efe9dd" stroke-width="1.3"') + path(posts, 'stroke="#9e8f78" stroke-opacity=".5" stroke-width=".35" transform="translate(.5,0)"');
    const VR = [P(x - 1, yd, zt0), P(xw + 1, yd, zt0), P(xw + 1, yd + dp + .4, zt1), P(x - 1, yd + dp + .4, zt1)];
    s += poly([P(x - 1, yd + dp + .4, zt1), P(xw + 1, yd + dp + .4, zt1), P(xw + 1, yd + dp + .4, zt1 - .8), P(x - 1, yd + dp + .4, zt1 - .8)], '#f1ece2', OL);
    s += poly([P(xw + 1, yd, zt0), P(xw + 1, yd + dp + .4, zt1), P(xw + 1, yd + dp + .4, zt1 - .8), P(xw + 1, yd, zt0 - .8)], '#d3cbbb', OL);
    s += poly(VR, roof[1], OL);
    let cl = '';
    for (let u = x; u < xw; u += 1.5) cl += sg(P(u, yd, zt0), P(u, yd + dp + .4, zt1));
    s += path(cl, 'stroke="#000" stroke-opacity=".15" stroke-width=".4"') + poly(VR, 'url(#hs-roofshade)');
    // main roof
    s += roofFront(g, roof, o);
    s += roofTrim(g, roof, o);
    // water tank by the gable
    if (opts.tank !== false) s += tankStand(xw + 5.5, y + 5, 10, 4.2);
    // flag pole (SMIL wave)
    if (opts.flag !== false) {
      const fx = opts.flagX ?? xw + 6, fy = opts.flagY ?? yd + 7, fh = opts.flagH ?? 30;
      const [sx, sy] = P(fx, fy, 0);
      const d1 = 'M0 0 C4 -1.6 8 1.6 13 0 L13 8 C8 9.6 4 6.4 0 8 Z', d2 = 'M0 0 C4 1.4 8 -1.4 13 .7 L13 8.7 C8 6.6 4 9.4 0 8 Z';
      const fill = opts.flagColor || 'url(#hs-zflag)';
      s += `<g transform="translate(${f(sx)},${f(sy)})"><ellipse cx="1.5" cy=".5" rx="4" ry="2" fill="url(#ao-soft)"/>` +
        `<rect x="-1.6" y="-1.2" width="3.2" height="1.6" fill="#c8c3b8"/><rect x="-.65" y="-${fh}" width="1.3" height="${fh}" fill="url(#metal-h)"/>` +
        `<circle cy="-${fh + .6}" r=".9" fill="#f2c35c"/>` +
        `<g transform="translate(.6,-${fh - .5})"><path d="${d1}" fill="${fill}" stroke="#000" stroke-opacity=".15" stroke-width=".3">` +
        `<animate attributeName="d" values="${d1};${d2};${d1}" dur="2.2s" repeatCount="indefinite"/></path>` +
        (opts.flagColor ? '' : `<path d="M0 0 L5.4 4 L0 8 Z" fill="#fff" stroke="#1b1b1b" stroke-width=".35"/><polygon points="1.90 2.55 2.22 3.56 3.28 3.55 2.42 4.17 2.75 5.17 1.90 4.55 1.05 5.17 1.38 4.17 0.52 3.55 1.58 3.56" fill="#d8262e"/><circle cx="1.9" cy="4" r=".45" fill="#ffd200"/>`) +
        `</g></g>`;
    }
    // sign board
    if (opts.sign !== false) {
      const lines = opts.sign || ['PRIMARY', 'SCHOOL'];
      const bx = opts.signX ?? x + 2, by = opts.signY ?? yd + 10, bw = 15;
      s += poly([P(bx, by - .5, 0), P(bx + bw + 2, by - .5, 0), P(bx + bw + 2, by + 1.5, 0), P(bx, by + 1.5, 0)], '#0b1e33', 'opacity=".1"');
      s += path(sg(P(bx + 1.5, by, 0), P(bx + 1.5, by, 8.5)) + sg(P(bx + bw - 1.5, by, 0), P(bx + bw - 1.5, by, 8.5)), 'stroke="#7f5d3c" stroke-width="1.1"');
      s += poly([P(bx, by, 3.5), P(bx + bw, by, 3.5), P(bx + bw, by, 9), P(bx, by, 9)], '#f8f5ee', OL);
      s += poly([P(bx + .5, by, 4), P(bx + bw - .5, by, 4), P(bx + bw - .5, by, 8.5), P(bx + .5, by, 8.5)], '#1f5f8b');
      const o0 = P(0, 0, 0), ax = P(1, 0, 0);
      const a = ax[0] - o0[0], b = ax[1] - o0[1];
      lines.slice(0, 2).forEach((t, i) => {
        const c = P(bx + bw / 2, by, 7.6 - i * 2.4);
        s += `<text transform="matrix(${a.toFixed(3)},${b.toFixed(3)},0,1,${f(c[0])},${f(c[1])})" font-size="1.9" font-weight="800" fill="#fff" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" letter-spacing=".2">${t}</text>`;
      });
    }
    return `<g class="hs-school">${s}</g>`;
  }

  /* ---------- rondavel ---------- */
  function ring(cx, cy, rad, z, n) {
    const a = [];
    for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; a.push(P(cx + rad * Math.cos(t), cy + rad * Math.sin(t), z)); }
    return a;
  }
  // indices of the visible (front) half of a ring, ordered left -> right on screen
  function frontIdx(scr) {
    const n = scr.length;
    let lo = 0, hi = 0;
    scr.forEach((p, i) => { if (p[0] < scr[lo][0]) lo = i; if (p[0] > scr[hi][0]) hi = i; });
    const walk = (a, b) => { const r = [a]; let i = a; while (i !== b) { i = (i + 1) % n; r.push(i); } return r; };
    const a1 = walk(lo, hi), a2 = walk(hi, lo).reverse();
    const avg = arr => arr.reduce((s, i) => s + scr[i][1], 0) / arr.length;
    return avg(a1) >= avg(a2) ? a1 : a2;
  }
  function hull(p) {
    const a = p.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]);
    const cr = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]);
    const lo = [], up = [];
    for (const q of a) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = a.length - 1; i >= 0; i--) { const q = a[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function band(cx, cy, rad, z0, z1, n, idx) {
    const b = ring(cx, cy, rad, z0, n), t = ring(cx, cy, rad, z1, n);
    return idx.map(i => b[i]).concat(idx.slice().reverse().map(i => t[i]));
  }
  function rondavel(x, y, opts = {}) {
    opts = opts || {};
    const r = opts.r ?? 8, h = opts.h ?? 8, rh = opts.roofH ?? 10, oh = opts.overhang ?? 2.2, n = 32;
    const delay = opts.delay ?? 0;
    let s = '';
    // AO
    s += poly(ring(x + 2.2, y + .6, r + 2.6, 0, 24), '#0b1e33', 'opacity=".1" stroke="#0b1e33" stroke-width="3" stroke-linejoin="round"');
    s += poly(ring(x + .5, y + .3, r + .7, 0, 24), '#0b1e33', 'opacity=".14"');
    // wall
    const base = ring(x, y, r, 0, n), idx = frontIdx(base);
    s += poly(band(x, y, r, 0, h, n, idx), opts.wall || 'url(#hs-mud)', OL);
    s += poly(band(x, y, r, 0, h, n, idx), 'url(#hs-plaster)');
    s += poly(band(x, y, r + .05, 0, 2.2, n, idx), opts.dado || '#7a3f2a', 'opacity=".6"');
    s += poly(band(x, y, r + .05, h - 2.4, h, n, idx), '#2a1a0e', 'opacity=".28"');
    // front-most angle
    let fi = idx[0];
    idx.forEach(i => { if (base[i][1] > base[fi][1]) fi = i; });
    const tf = fi / n * Math.PI * 2;
    const at = (t, z, rad = r + .05) => P(x + rad * Math.cos(t), y + rad * Math.sin(t), z);
    const quad = (t0, t1, z0, z1) => [at(t0, z0), at((t0 + t1) / 2, z0), at(t1, z0), at(t1, z1), at((t0 + t1) / 2, z1), at(t0, z1)];
    // door (slightly to the right of front) + step
    const td = tf - .15;
    s += poly(quad(td - .36, td + .36, 0, 5.6), '#efe2c8', OL);
    s += poly(quad(td - .29, td + .29, 0, 5.1), opts.doorCol || '#5a3a22', OL);
    s += path(sg(at(td, 0, r + .1), at(td, 5.1, r + .1)), 'stroke="#000" stroke-opacity=".25" stroke-width=".35"');
    s += poly([at(td - .4, 0, r), at(td + .4, 0, r), at(td + .4, .8, r + 1.6), at(td - .4, .8, r + 1.6)], '#c8c3b8', OL);
    // window
    const tw = tf + .7;
    s += poly(quad(tw - .26, tw + .26, 2.2, 5), '#efe2c8', OL);
    s += poly(quad(tw - .2, tw + .2, 2.6, 4.6), opts.lit ? 'url(#hs-glow)' : '#3a2a1e', opts.lit ? `class="flick" style="animation-delay:${f(delay)}s"` : '');
    if (opts.lit) {
      const c = at(tw, 3.6, r + .6);
      s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="1.5" fill="#ffd36b" opacity=".3" class="glow" style="animation-delay:${f(delay)}s"/>`;
    }
    // thatch cone
    const zb = h - .8, apex = P(x, y, h + rh), rr = r + oh;
    const rim = ring(x, y, rr, zb, n);
    s += poly(hull(rim.concat([apex])), 'url(#hs-thatch)', 'stroke="#5e4320" stroke-opacity=".35" stroke-width=".5" stroke-linejoin="round"');
    const ridx = frontIdx(rim);
    let dk = '', lt = '';
    ridx.forEach((i, k) => {
      const tt = i / n * Math.PI * 2 + .09;
      const p = P(x + rr * Math.cos(tt), y + rr * Math.sin(tt), zb);
      const mid = (fr) => P(x + rr * (1 - fr) * Math.cos(tt), y + rr * (1 - fr) * Math.sin(tt), zb + fr * rh);
      if (k % 2) dk += sg(mid(.95), rim[i]); else dk += sg(mid(.35), rim[i]);
      lt += sg(mid(k % 3 ? .6 : .9), p);
    });
    s += path(dk, 'stroke="#5e4320" stroke-opacity=".45" stroke-width=".45" fill="none"');
    s += path(lt, 'stroke="#f6dfa4" stroke-opacity=".5" stroke-width=".35" fill="none"');
    // binding rings
    let bd = '';
    [.4, .72].forEach(fr => {
      const rg = ring(x, y, rr * (1 - fr), zb + fr * rh, n);
      bd += 'M' + ridx.map(i => f(rg[i][0]) + ' ' + f(rg[i][1])).join(' L');
    });
    s += path(bd, 'stroke="#6e5129" stroke-opacity=".55" stroke-width=".6" fill="none"');
    // ragged eave fringe
    let fr = '';
    ridx.forEach((i, k) => {
      const p = rim[i];
      fr += (k ? ' L' : 'M') + f(p[0]) + ' ' + f(p[1]);
      if (k < ridx.length - 1) { const q = rim[ridx[k + 1]]; fr += ' L' + f((p[0] + q[0]) / 2) + ' ' + f((p[1] + q[1]) / 2 + 1.1); }
    });
    s += path(fr, 'stroke="#7d5e31" stroke-width=".8" fill="none" stroke-linejoin="round"');
    // finial
    s += `<path d="M${f(apex[0])} ${f(apex[1] + 1)} V${f(apex[1] - 2.2)}" stroke="#4a3418" stroke-width="1.1" stroke-linecap="round"/>`;
    return `<g class="hs-rondavel">${s}</g>`;
  }

  A.houses = { house, school, rondavel };
})();
