/* Fuel tanker trucks with rounded (capsule) tanks.  Namespace: Assets.trucks, defs prefix: trk-
 * Projection-agnostic: everything goes through the global P(x,y,z) lazily, so it works in both the
 * isometric scenes and the NOIC oblique projection.  Drawn around the local origin, heading +x. */
(function () {
  const A = window.Assets = window.Assets || {};
  const f = n => (+n).toFixed(2).replace(/\.?0+$/, '') || '0';

  /* ---------- palettes ---------- */
  // tank barrel gradient stops (top -> bottom across the barrel), dome rim, default stripe/label colours
  const TANK = {
    white:  { s: ['#d5dee7', '#ffffff', '#eef3f7', '#c3cfdb', '#8492a2'], stripe: '#d4493e', text: '#b83a30' },
    silver: { s: ['#a3afbc', '#f6f8fb', '#d3dbe3', '#a3afbc', '#66737f'], stripe: '#2f7fb8', text: '#1f5f8f' },
    green:  { s: ['#3f8a4d', '#93d49f', '#55a063', '#2f6b3a', '#1b4423'], stripe: '#f2c35c', text: '#ffe7a8' },
    yellow: { s: ['#e3ae33', '#ffe9a0', '#f4c75f', '#d09a2a', '#8e6316'], stripe: '#23272c', text: '#5a3d08' },
    // polished white/silver with a strong specular band (used by the liveries)
    polished: { stops: [[0, '#b8c3ce'], [.1, '#e8edf2'], [.17, '#ffffff'], [.23, '#ffffff'], [.29, '#d6dee6'], [.38, '#f4f7fa'],
      [.62, '#dde4ea'], [.84, '#97a4b2'], [.94, '#7b8896'], [1, '#a9b5c1']], stripe: '#e0b23a', text: '#1f6b33' }
  };
  const CAB = {
    red:   ['#f27b70', '#d4493e', '#b13a30'],
    gold:  ['#f5cb6c', '#d9a53c', '#b98a2a'],
    blue:  ['#5aaee6', '#2f7fb8', '#24689a'],
    white: ['#ffffff', '#e1e8ef', '#c4d0dc']
  };

  let defs = '';
  for (const k in TANK) {
    const s = TANK[k].s;
    if (TANK[k].stops) { defs += `<linearGradient id="trk-tank-${k}" x1="0" y1="0" x2="0" y2="1">${TANK[k].stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`; continue; }
    defs += `<linearGradient id="trk-tank-${k}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${s[0]}"/><stop offset=".2" stop-color="${s[1]}"/><stop offset=".36" stop-color="${s[2]}"/>` +
      `<stop offset=".74" stop-color="${s[3]}"/><stop offset=".93" stop-color="${s[4]}"/><stop offset="1" stop-color="${s[3]}"/></linearGradient>`;
  }
  defs +=
    // dome rounding overlay: bright spot top-left, dark rim
    `<radialGradient id="trk-dome" cx=".38" cy=".34" r=".72"><stop offset="0" stop-color="#fff" stop-opacity=".45"/>` +
    `<stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#0b1e33" stop-opacity=".08"/><stop offset="1" stop-color="#0b1e33" stop-opacity=".3"/></radialGradient>` +
    // paint sheen for flat cab faces
    `<linearGradient id="trk-paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/>` +
    `<stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>` +
    // tyre + hub
    `<radialGradient id="trk-tyre" cx=".42" cy=".4" r=".6"><stop offset=".55" stop-color="#3a3f46"/><stop offset=".8" stop-color="#23272c"/><stop offset="1" stop-color="#121417"/></radialGradient>` +
    `<radialGradient id="trk-hub" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#f4f7fa"/><stop offset=".6" stop-color="#b9c4cf"/><stop offset="1" stop-color="#7d8a98"/></radialGradient>` +
    `<linearGradient id="trk-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdeaf9"/><stop offset=".55" stop-color="#7fb8dc"/><stop offset="1" stop-color="#3f7aa6"/></linearGradient>` +
    `<linearGradient id="trk-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5d70"/><stop offset=".5" stop-color="#1f2a35"/><stop offset="1" stop-color="#121a22"/></linearGradient>` +
    `<linearGradient id="trk-shine" x1="0" y1="0" x2="1" y2="1"><stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset=".38" stop-color="#fff" stop-opacity=".55"/>` +
    `<stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity=".25"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  A.addDefs(defs);

  /* ---------- geometry helpers (all lazy: they call the current global P) ---------- */
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  // linear parts of the current projection
  function basis() {
    const o = P(0, 0, 0), ex = sub(P(1, 0, 0), o), ey = sub(P(0, 1, 0), o), ez = sub(P(0, 0, 1), o);
    // view direction d with P(d) = 0, oriented towards the viewer (z > 0)
    const r1 = [ex[0], ey[0], ez[0]], r2 = [ex[1], ey[1], ez[1]];
    let d = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
    if (d[2] < 0) d = d.map(v => -v);
    const L = Math.hypot(ex[0], ex[1]), u = [ex[0] / L, ex[1] / L], v = [-u[1], u[0]];
    return { o, ex, ey, ez, d, u, v };
  }
  // convex hull (monotone chain)
  function hull(p) {
    p = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // group whose local frame is (axis, across-axis) so objectBoundingBox gradients band along the tank
  const axisFrame = (B, screenPts, fill, extra = '') =>
    `<g transform="matrix(${f(B.u[0])},${f(B.u[1])},${f(B.v[0])},${f(B.v[1])},0,0)"><polygon points="${pts(screenPts.map(p => [p[0] * B.u[0] + p[1] * B.u[1], p[0] * B.v[0] + p[1] * B.v[1]]))}" fill="${fill}" ${extra}/></g>`;
  // group whose local frame is the vertical x-z plane at y (frame x = world x, frame y = -world z);
  // flip: frame x = -world x, for artwork on a tanker the caller mirrors with scale(-1,1), so its text still reads left to right
  const xzFrame = (B, x, y, z, inner, flip) => {
    const [ox, oy] = P(x, y, z), k = flip ? -1 : 1;
    return `<g transform="matrix(${f(k * B.ex[0])},${f(k * B.ex[1])},${f(-B.ez[0])},${f(-B.ez[1])},${f(ox)},${f(oy)})">${inner}</g>`;
  };
  // horizontal x-y plane at z
  const xyFrame = (B, x, y, z, inner) => {
    const [ox, oy] = P(x, y, z);
    return `<g transform="matrix(${f(B.ex[0])},${f(B.ex[1])},${f(B.ey[0])},${f(B.ey[1])},${f(ox)},${f(oy)})">${inner}</g>`;
  };

  /* ---------- the tanker ---------- */
  // tank cross-section: ellipse centred (y=YC, z=ZC), half-width RY, half-height RZ
  const YC = 0.5, RY = 3.2, RZ = 3.05, ZC = 2.55 + RZ;
  const XR = -16, XB0 = -14.5, XB1 = 5.7, XF = 7.3;    // rear tip, barrel start/end, front tip
  const ring = (x, s, n = 24) => { const a = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; a.push(P(x, YC + RY * s * Math.cos(t), ZC + RZ * s * Math.sin(t))); } return a; };
  const surf = (x, t, s = 1) => P(x, YC + RY * s * Math.cos(t), ZC + RZ * s * Math.sin(t));
  // dome samples between barrel end xb and tip xt
  const dome = (xb, xt) => { let a = []; [0, .45, .72, .88, .97].forEach(k => a = a.concat(ring(xb + (xt - xb) * k, Math.sqrt(1 - k * k)))); a.push(P(xt, YC, ZC)); return a; };

  function wheel(B, x, spin, far) {
    const r = 1.65, zc = 1.65;
    let s = xzFrame(B, x, far ? -3 : 3.25, zc, `<circle r="${r}" fill="#15181c"/>`);   // tyre depth
    if (far) return s + xzFrame(B, x, -2.6, zc, `<circle r="${r}" fill="#23272c"/><circle r=".8" fill="#59636e"/>`);
    let rot = `<circle r=".22" cx=".5" fill="#56616c"/><circle r=".22" cx="-.25" cy=".43" fill="#56616c"/><circle r=".22" cx="-.25" cy="-.43" fill="#56616c"/>` +
      `<path d="M-.95 0H.95" stroke="#fff" stroke-opacity=".35" stroke-width=".18"/>`;
    if (spin) rot = `<g>${rot}<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="${f(spin)}s" repeatCount="indefinite"/></g>`;
    s += xzFrame(B, x, 4, zc,
      `<circle r="${r}" fill="url(#trk-tyre)"/><circle r="1.02" fill="url(#trk-hub)" stroke="#5c6772" stroke-width=".15"/>${rot}<circle r=".28" fill="#3a4049"/>` +
      `<path d="M-2.15 .15A2.15 2.15 0 0 1 2.15 .15" stroke="#2b3036" stroke-width=".75" fill="none"/>`);
    return s;
  }

  /* liveries: preset tank/cab/cab-style + side artwork */
  const LIVERY = {
    petrotrade: { tank: 'polished', cab: 'white', cabStyle: 'man', pin: '#e0b23a' },
    noic:       { tank: 'polished', cab: 'red', cabStyle: 'classic', pin: '#1f5fae' }
  };
  const FONT = 'font-family="Segoe UI,Arial,sans-serif"';
  const DROP = (k, col) => `<path d="M0 ${f(-1.25 * k)}C${f(.85 * k)} ${f(-.25 * k)} ${f(.85 * k)} ${f(.55 * k)} 0 ${f(.62 * k)}C${f(-.85 * k)} ${f(.55 * k)} ${f(-.85 * k)} ${f(-.25 * k)} 0 ${f(-1.25 * k)}Z" fill="${col}"/>` +
    `<path d="M${f(-.3 * k)} ${f(-.1 * k)}C${f(-.35 * k)} ${f(.25 * k)} ${f(-.15 * k)} ${f(.4 * k)} ${f(.1 * k)} ${f(.42 * k)}" stroke="#fff" stroke-opacity=".7" stroke-width="${f(.14 * k)}" fill="none"/>`;
  // side artwork in the tank-side frame (frame x = world x, frame y = -world z), centred on 0
  const ART = {
    petrotrade: () =>
      `<text x="-1.05" y=".9" font-size="2.7" font-weight="900" font-style="italic" text-anchor="end" textLength="6.6" lengthAdjust="spacingAndGlyphs" fill="#1f6b33" ${FONT}>PETRO</text>` +
      `<g transform="translate(0,-.05)">${DROP(1.45, '#3c9a3e')}</g>` +
      `<text x="1.05" y=".9" font-size="2.7" font-weight="900" font-style="italic" text-anchor="start" textLength="6.6" lengthAdjust="spacingAndGlyphs" fill="#e0a21c" ${FONT}>TRADE</text>` +
      `<text x="-1.6" y="1.95" font-size="1.1" font-style="italic" font-weight="600" text-anchor="middle" textLength="9.6" lengthAdjust="spacingAndGlyphs" fill="#1f6b33" ${FONT}>experience the difference</text>`,
    noic: () =>
      `<text x="-1.75" y="1.15" font-size="3.3" font-weight="900" text-anchor="end" fill="#1f5fae" ${FONT}>N</text>` +
      `<circle r="1.25" fill="#fff" stroke="#1f5fae" stroke-width=".55"/>` +
      `<path d="M0 -1C-.55 -1 -1 -.55 -1 0C-1 .55 -.55 1 0 1C-.55 1 -.55 0 0 0C.55 0 .55 -1 0 -1Z" fill="#f2b632"/>` +
      `<circle cy="-.5" r=".17" fill="#1f5fae"/><circle cy=".5" r=".17" fill="#f2b632"/>` +
      `<text x="1.75" y="1.15" font-size="3.3" font-weight="900" text-anchor="start" fill="#1f5fae" ${FONT}>IC</text>`
  };

  function tanker(opts = {}) {
    const B = basis();
    const LV = LIVERY[opts.livery] || null;
    const tankId = TANK[opts.tank] ? opts.tank : (LV ? LV.tank : 'white');
    const tk = TANK[tankId], ck = CAB[opts.cab] || CAB[LV ? LV.cab : 'red'];
    const cabStyle = opts.cabStyle || (LV ? LV.cabStyle : 'classic');
    const stripe = opts.stripe || tk.stripe, txtCol = opts.labelColor || tk.text;
    const spin = opts._spin || 0;
    const dz = B.d, va = Math.atan2(dz[2] / RZ, dz[1] / RY);   // centre of the visible arc of a ring
    const arc = (x, k = 1, n = 14) => { const a = []; for (let i = 0; i <= n; i++) a.push(surf(x, va - Math.PI / 2 + Math.PI * i / n, k)); return a; };
    const line = (a, col, w, extra = '') => `<polyline points="${pts(a)}" stroke="${col}" stroke-width="${w}" fill="none" ${extra}/>`;
    const segs = (list, col, w, extra = '') => `<path d="${list.map(a => 'M' + a.map(p => f(p[0]) + ' ' + f(p[1])).join('L')).join('')}" stroke="${col}" stroke-width="${w}" fill="none" ${extra}/>`;
    const zTop = ZC + RZ;
    let s = '';

    // contact shadow
    s += xyFrame(B, 0, 0, 0, `<ellipse cx="0" cy=".5" rx="18" ry="6.5" fill="url(#ao-soft)"/><ellipse cx="0" cy=".5" rx="16" ry="4.2" fill="#0b1e33" opacity=".1"/>`);
    // far-side wheels, chassis rails
    [-12, -8.3, 12.6].forEach(x => s += wheel(B, x, 0, true));
    s += box(-15.6, -1.4, 1.1, 24, 3.8, 1.3, ['#5b6672', '#3a424b', '#2c333a']);
    // rear ladder: behind the rear dome, so drawn before the tank (only the part outside the tank shows)
    if (LV) {
      const xl = -16.5, ya = 1.4, yb = 2.6, zl0 = 1.4, zl1 = zTop + 0.7, rungs = [];
      for (let z = zl0 + 0.6; z < zl1 - 0.2; z += 0.85) rungs.push([P(xl, ya, z), P(xl, yb, z)]);
      s += segs([[P(xl, ya, zl0), P(xl, ya, zl1), P(-14.8, ya, zl1)], [P(xl, yb, zl0), P(xl, yb, zl1), P(-14.8, yb, zl1)]], '#7d8a97', .32, 'stroke-linejoin="round"') + segs(rungs, '#9aa7b4', .22);
    }
    s += box(-16.4, -3, 0.9, 0.8, 7, 1.3, ['#4a535d', '#2f363d', '#23292f']);           // rear bumper
    s += poly([P(-16.4, 4, 1.3), P(-15.6, 4, 1.3), P(-15.6, 4, 1.9), P(-16.4, 4, 1.9)], '#e04a3f');   // tail lamp

    // ---- tank barrel (incl. rear dome silhouette) ----
    const bp = dome(XB0, XR).concat(ring(XB1, 1));
    s += axisFrame(B, hull(bp), `url(#trk-tank-${tankId})`, 'stroke="#0b1e33" stroke-opacity=".22" stroke-width=".35" stroke-linejoin="round"');
    const xs0 = XB0 + 0.3, xs1 = XB1 - 0.3;
    if (LV) {
      // specular streak along the upper barrel + pinstripe low on the side
      s += line([surf(XB0 + .6, va + 1.05), surf(XB1 - .2, va + 1.05)], '#fff', .55, 'stroke-opacity=".9" stroke-linecap="round"');
      s += line([surf(xs0, -1.05), surf(xs1, -1.05)], LV.pin, .3);
    } else {
      const t1 = -0.42, t2 = -0.2;
      s += poly([surf(xs0, t1), surf(xs1, t1), surf(xs1, t2), surf(xs0, t2)], stripe);
      s += line([surf(xs0, t2 + .05), surf(xs1, t2 + .05)], '#fff', .25, 'stroke-opacity=".5"');
    }
    // hoops / weld seams
    [XB0 + 0.15, -8.6, -2.4, XB1 - 0.1].forEach(x => {
      s += line(arc(x), '#0b1e33', .5, 'stroke-opacity=".18"') + line(arc(x + 0.35), '#fff', .3, 'stroke-opacity=".45"');
    });
    // side artwork / label in the near-side plane (x-z plane about 10deg up the side), matrix from P
    const tl = 0.17, yl = YC + RY * Math.cos(tl) + 0.05, zl = ZC + RZ * Math.sin(tl);
    const art = LV && ART[opts.livery];
    if (art) s += xzFrame(B, opts.livery === 'noic' ? -4.6 : -5.2, yl, zl - 0.1, art(), opts.mirror);
    if (opts.label && !art) {
      const n = String(opts.label).length, w = Math.min(12.5, n * 1.6);
      s += xzFrame(B, -3.6, yl, zl - 0.95, `<text x="0" y="0" font-size="2.6" font-weight="800" text-anchor="middle" textLength="${f(w)}" lengthAdjust="spacingAndGlyphs" fill="${txtCol}" ${FONT}>${opts.label}</text>`, opts.mirror);
    }
    // hazard diamond placard (rear of the side for plain trucks, front of the side for liveries)
    {
      const yp = YC + RY * Math.cos(0.05) + 0.05, zp = ZC + 0.15, xp = LV ? 4.3 : -12.7, h = LV ? .85 : 1.25;
      s += poly([P(xp - h, yp, zp), P(xp, yp, zp - h), P(xp + h, yp, zp), P(xp, yp, zp + h)], '#ffffff', 'stroke="#23272c" stroke-width=".18"');
      s += poly([P(xp - h * .72, yp, zp), P(xp, yp, zp - h * .72), P(xp + h * .72, yp, zp), P(xp, yp, zp + h * .72)], '#f08c2a');
      s += line([P(xp - h * .5, yp, zp + .05), P(xp + h * .5, yp, zp + .05)], '#23272c', .14);
    }
    // front dome (faces the viewer in both projections)
    const dp = hull(dome(XB1, XF));
    s += axisFrame(B, dp, `url(#trk-tank-${tankId})`, 'stroke="#0b1e33" stroke-opacity=".22" stroke-width=".35" stroke-linejoin="round"');
    s += axisFrame(B, dp, 'url(#trk-dome)');
    s += line(arc(XB1), '#0b1e33', .45, 'stroke-opacity=".22"');

    // ---- top walkway, compartment hatches, guard rail ----
    const zt = zTop + 0.08, wx0 = LV ? -14.2 : -13.6, wx1 = LV ? 5.2 : 4.6;
    s += poly([P(wx0, -0.5, zt), P(wx1, -0.5, zt), P(wx1, 1.5, zt), P(wx0, 1.5, zt)], '#a7b2bd', 'stroke="#6f7c89" stroke-width=".2"');
    s += line([P(wx0 + .2, 0.5, zt), P(wx1 - .2, 0.5, zt)], '#7d8a97', .9, 'stroke-dasharray=".25 .45"');
    (LV ? [-11.6, -7.2, -2.8, 1.6] : [-10.6, -5.3, 0]).forEach(x => {
      const c = (z, r) => { const a = []; for (let i = 0; i < 14; i++) { const t = i / 14 * Math.PI * 2; a.push(P(x + r * Math.cos(t), 0.5 + r * Math.sin(t), z)); } return a; };
      s += poly(c(zt + 0.15, 1.0), '#6f7c89') + poly(c(zt + 0.5, .95), '#dfe6ed', 'stroke="#8d99a6" stroke-width=".15"') + (LV ? '' : poly(c(zt + 0.55, .45), '#b9c4cf'));
    });
    const zr = zt + 1.35;
    if (LV) {
      // guard rails along both edges of the full walkway, posts at even spacing
      const posts = [];
      for (let i = 0; i <= 6; i++) { const x = wx0 + (wx1 - wx0) * i / 6; posts.push([P(x, -0.6, zt), P(x, -0.6, zr)], [P(x, 1.6, zt), P(x, 1.6, zr)]); }
      s += segs([[P(wx0, -0.6, zr), P(wx1, -0.6, zr)]], '#6f7c89', .32) + segs(posts, '#6f7c89', .24) + segs([[P(wx0, 1.6, zr), P(wx1, 1.6, zr)]], '#8d99a6', .34);
    } else {
      s += line([P(-13.6, -0.5, zt), P(-13.6, -0.5, zr), P(4.6, -0.5, zr), P(4.6, -0.5, zt)], '#6f7c89', .32, 'stroke-linejoin="round"');
      s += line([P(-4.5, -0.5, zt), P(-4.5, -0.5, zr)], '#6f7c89', .28);
    }

    // ---- near-side rear wheels + side lockers ----
    [-12, -8.3].forEach(x => s += wheel(B, x, spin, false));
    if (LV) {
      const lk = ['#dfe6ed', '#aab5c0', '#8d99a6'];
      [[-6.3, 7.6], [-16, -13.9]].forEach(([a, b]) => {
        s += box(a, 2.6, 0.9, b - a, 1.4, 1.9, lk);
        s += poly([P(a, 4.01, 2.8), P(b, 4.01, 2.8), P(b, 4.01, 0.9), P(a, 4.01, 0.9)], 'url(#trk-paint)');
        s += line([P(a + .1, 4.02, 2.2), P(b - .1, 4.02, 2.2)], LV.pin, .22);
      });
      s += segs([[P(-1.6, 4.03, 1.1), P(-1.6, 4.03, 2.6)], [P(3.0, 4.03, 1.1), P(3.0, 4.03, 2.6)]], '#6f7c89', .16);   // locker door seams
    } else {
      s += box(-6.2, 2.6, 1.0, 4.2, 1.4, 1.6, ['#c9d3dd', '#9aa7b4', '#7d8a98']);         // valve/hose cabinet
    }

    // ---- cab ----
    s += cabStyle === 'man' ? cabMAN(B, ck, opts.livery, line, segs, opts.mirror) : cabClassic(ck, line);
    // front near wheel + near mirror
    s += wheel(B, 12.6, spin, false);
    const zm0 = cabStyle === 'man' ? 8.2 : 7.1;
    s += line([P(15.4, 4, zm0), P(16, 4.8, zm0)], '#23272c', .45) + line([P(16, 4.8, zm0 + .3), P(16, 4.8, zm0 - 1.7)], '#23272c', .7);
    return s;
  }

  // classic sloped-windscreen cab (round 1 look)
  function cabClassic(ck, line) {
    const [ct, cl] = ck, x0 = 8.4, x1 = 16, xr = 15.1, y0 = -3, y1 = 4, zb = 1.2, zm = 5.2, zh = 8.7;
    let s = cyl(7.95, -2.2, 3.2, 0.42, 7.4, ['#c9d3dd', '#8d99a6', '#5c6772']);             // exhaust stack
    s += line([P(15.4, -3, 7.1), P(16, -3.8, 7.1), P(16, -3.8, 5.8)], '#23272c', .55, 'stroke-linejoin="round"'); // far mirror
    s += box(x0, y0, zb, x1 - x0, y1 - y0, zm - zb, ck);
    const L = [P(x0, y1, zm), P(x1, y1, zm), P(xr, y1, zh), P(x0, y1, zh)];
    s += poly(L, cl) + poly(L, 'url(#trk-paint)');
    s += poly([P(x1, y0, zm), P(x1, y1, zm), P(xr, y1, zh), P(xr, y0, zh)], '#2a3138');
    const G = [P(x1 - .05, y0 + .45, zm + .35), P(x1 - .05, y1 - .45, zm + .35), P(xr + .12, y1 - .45, zh - .35), P(xr + .12, y0 + .45, zh - .35)];
    s += poly(G, 'url(#trk-glass)') + poly(G, 'url(#trk-shine)');
    s += poly([P(x0, y0, zh), P(xr, y0, zh), P(xr, y1, zh), P(x0, y1, zh)], ct);
    s += line([P(x0, y1, zh), P(xr, y1, zh), P(xr, y0, zh)], '#fff', .4, 'stroke-opacity=".7"');
    [-1.6, 0.5, 2.6].forEach(y => s += poly([P(xr - .5, y - .35, zh + .05), P(xr - .1, y - .35, zh + .05), P(xr - .1, y + .35, zh + .05), P(xr - .5, y + .35, zh + .05)], '#ffb15c'));
    const W = [P(11.6, y1, zm + .55), P(15.2, y1, zm + .55), P(xr - .55, y1, zh - .55), P(11.6, y1, zh - .55)];
    s += poly(W, 'url(#trk-glass)') + poly(W, 'url(#trk-shine)');
    s += line([P(11.1, y1, zb + .5), P(11.1, y1, zh - .3)], '#0b1e33', .2, 'stroke-opacity=".3"');
    s += poly([P(x0, y1, zb), P(x1, y1, zb), P(x1, y1, zm), P(x0, y1, zm)], 'url(#trk-paint)');
    s += poly([P(x1, y0, zb), P(x1, y1, zb), P(x1, y1, zm), P(x1, y0, zm)], 'url(#trk-paint)');
    s += line([P(x0, y1, zm), P(x1, y1, zm), P(x1, y0, zm)], '#fff', .3, 'stroke-opacity=".45"');
    s += poly([P(x1 + .02, -0.9, 2.3), P(x1 + .02, 1.9, 2.3), P(x1 + .02, 1.9, 4.6), P(x1 + .02, -0.9, 4.6)], '#2f363d');
    [3.0, 3.6, 4.2].forEach(z => s += line([P(x1 + .03, -0.7, z), P(x1 + .03, 1.7, z)], '#8d99a6', .18));
    [[-2.6, -1.4], [2.4, 3.6]].forEach(([a, b]) => {
      s += poly([P(x1 + .03, a, 2.5), P(x1 + .03, b, 2.5), P(x1 + .03, b, 3.4), P(x1 + .03, a, 3.4)], '#fff6c8', 'stroke="#8d99a6" stroke-width=".15"');
    });
    s += box(x1, y0 - .2, 0.9, 0.7, y1 - y0 + .4, 1.3, ['#9aa7b4', '#56616c', '#3a424b']);
    s += box(9.2, y1, 1.3, 1.8, 0.4, 1.4, ['#8d99a6', '#56616c', '#3a424b']);
    return s;
  }

  // tall square cab (MAN TGS style): near-vertical dark windscreen, sun visor, wide grille, bumper lamps, door logo
  function cabMAN(B, ck, livery, line, segs, mirror) {
    const [ct, cl, cr] = ck, x0 = 8.4, x1 = 16, xr = 15.7, y0 = -3, y1 = 4, zb = 1.2, zw = 5.6, zh = 9.6;
    let s = cyl(7.95, -2.2, 3.2, 0.42, 7.6, ['#c9d3dd', '#8d99a6', '#5c6772']);
    s += line([P(15.6, -3, 8.2), P(16.1, -3.8, 8.2), P(16.1, -3.8, 6.5)], '#23272c', .55, 'stroke-linejoin="round"');
    s += box(x0, y0, zb - .3, x1 - x0, y1 - y0, 1.1, ['#4a535d', '#3a424b', '#2c333a']);     // dark skirt
    const L = [P(x0, y1, zb + .8), P(x1, y1, zb + .8), P(x1, y1, zw), P(xr, y1, zh), P(x0, y1, zh)];
    s += poly(L, cl) + poly(L, 'url(#trk-paint)');
    const FL = [P(x1, y0, zb + .8), P(x1, y1, zb + .8), P(x1, y1, zw), P(x1, y0, zw)];
    s += poly(FL, cr) + poly(FL, 'url(#trk-paint)');
    s += poly([P(x1, y0, zw), P(x1, y1, zw), P(xr, y1, zh), P(xr, y0, zh)], cr);
    const G = [P(x1 - .03, y0 + .35, zw + .3), P(x1 - .03, y1 - .35, zw + .3), P(xr + .05, y1 - .35, zh - 1.15), P(xr + .05, y0 + .35, zh - 1.15)];
    s += poly(G, 'url(#trk-dark)') + poly(G, 'url(#trk-shine)', 'opacity=".55"');
    s += poly([P(xr + .02, y0 + .2, zh - .45), P(xr + .02, y1 - .2, zh - .45), P(xr + .02, y1 - .2, zh - 1.0), P(xr + .02, y0 + .2, zh - 1.0)], '#2a3138');   // sun visor
    s += poly([P(x0, y0, zh), P(xr, y0, zh), P(xr, y1, zh), P(x0, y1, zh)], ct, 'stroke="#8d99a6" stroke-width=".22" stroke-linejoin="round"');
    s += poly(L, 'none', 'stroke="#8d99a6" stroke-width=".22" stroke-linejoin="round"');
    s += line([P(x1, y1, zb + .8), P(x1, y1, zw), P(xr, y1, zh)], '#0b1e33', .2, 'stroke-opacity=".2"');
    const W = [P(12.0, y1, 6.4), P(15.5, y1, 6.4), P(15.25, y1, 8.9), P(12.0, y1, 8.9)];
    s += poly(W, 'url(#trk-dark)') + poly(W, 'url(#trk-shine)', 'opacity=".5"');
    s += segs([[P(11.5, y1 + .01, 2.4), P(11.5, y1 + .01, 9.2)], [P(15.9, y1 + .01, 2.4), P(11.5, y1 + .01, 2.4)]], '#0b1e33', .18, 'stroke-opacity=".28"');
    if (livery === 'petrotrade') {
      s += xzFrame(B, 13.7, y1 + .02, 4.6, `<g transform="translate(-1.6,-.1)">${DROP(.55, '#3c9a3e')}</g>` +
        `<text x="-.9" y=".25" font-size=".8" font-weight="900" font-style="italic" textLength="3.4" lengthAdjust="spacingAndGlyphs" fill="#1f6b33" ${FONT}>PETRO<tspan fill="#e0a21c">TRADE</tspan></text>` +
        `<path d="M-2.2 1.2H2.6" stroke="#e0b23a" stroke-width=".18"/>`, mirror);
    }
    s += poly([P(x1 + .02, -1.6, 2.6), P(x1 + .02, 2.6, 2.6), P(x1 + .02, 2.6, 5.0), P(x1 + .02, -1.6, 5.0)], '#2f363d');
    s += segs([3.2, 3.8, 4.4].map(z => [P(x1 + .03, -1.4, z), P(x1 + .03, 2.4, z)]), '#aab5c0', .2);
    s += box(x1 - .1, y0 - .2, 0.8, 0.8, y1 - y0 + .4, 1.6, ['#c9d3dd', '#8d99a6', '#6f7c89']);
    [[-2.7, -1.3], [2.3, 3.7]].forEach(([a, b]) => {
      s += poly([P(x1 + .72, a, 1.7), P(x1 + .72, b, 1.7), P(x1 + .72, b, 2.2), P(x1 + .72, a, 2.2)], '#fff6c8', 'stroke="#56616c" stroke-width=".12"');
    });
    s += box(9.2, y1, 1.3, 1.8, 0.4, 1.4, ['#8d99a6', '#56616c', '#3a424b']);           // step
    return s;
  }

  function drive(x0, y0, x1, y1, dur, begin = 0, opts = {}) {
    const a = P(x0, y0, 0), b = P(x1, y1, 0);
    const dist = Math.hypot(x1 - x0, y1 - y0) || 1;
    const spin = opts.spin === false ? 0 : (2 * Math.PI * 1.65) / (dist / dur);
    const bg = typeof begin === 'number' ? begin + 's' : begin;
    return `<g>${tanker(Object.assign({}, opts, { _spin: spin }))}<animateMotion dur="${dur}s" begin="${bg}" repeatCount="indefinite" path="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}"/></g>`;
  }

  // the tanker alone, wheels spinning to match `speed` (world units / s), for callers that move it themselves
  const sprite = (opts, speed) => tanker(Object.assign({}, opts, { _spin: speed > 0 ? 2 * Math.PI * 1.65 / speed : 0 }));

  A.trucks = { tanker, drive, sprite };
})();
