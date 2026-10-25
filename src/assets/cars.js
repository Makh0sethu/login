/* Cars: shaped isometric road vehicles + branded fleet liveries.
   API: Assets.cars.car(opts), Assets.cars.drive(x0, y0, x1, y1, dur, begin, opts), Assets.cars.sprite(opts, speed)
   Types: sedan, hatch, ev, suv, pickup, minibus, truck.  Liveries: moepd, zera, zetdc, zetdc-truck, ref-truck.
   Local frame: origin = centre of the footprint on the ground, heading +x (dir 1) or -x (dir -1).
   Cars: footprint about x -9..9, y -5..5, height up to ~12.5. Truck: x -12..12, y -5.2..5.2, height ~12.8.
   Everything goes through the global P, so it also works with the NOIC oblique P. */
(function () {
  const Assets = window.Assets = window.Assets || {};

  Assets.addDefs(
    `<linearGradient id="car-side-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".22" stop-color="#fff" stop-opacity=".06"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>` +
    `<linearGradient id="car-refl" x1="0" y1="0" x2="1" y2=".35"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="car-top-sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="car-end-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>` +
    `<linearGradient id="car-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff3fd"/><stop offset=".45" stop-color="#86bddf"/><stop offset=".5" stop-color="#4d82ab"/><stop offset="1" stop-color="#2e5f86"/></linearGradient>` +
    `<linearGradient id="car-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset=".16" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".6"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".54" stop-color="#fff" stop-opacity=".3"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="car-rim" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#cfd7df"/><stop offset="1" stop-color="#6f7c88"/></radialGradient>` +
    `<radialGradient id="car-tyre" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="#3a4047"/><stop offset=".85" stop-color="#2a2f35"/><stop offset="1" stop-color="#16191d"/></radialGradient>` +
    `<radialGradient id="car-halo-w"><stop offset="0" stop-color="#fff8cf" stop-opacity=".95"/><stop offset=".4" stop-color="#ffe9a0" stop-opacity=".45"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="car-halo-r"><stop offset="0" stop-color="#ff6b5a" stop-opacity=".9"/><stop offset=".4" stop-color="#ff3b2e" stop-opacity=".4"/><stop offset="1" stop-color="#ff3b2e" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="car-wood" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#e2b07a"/><stop offset=".7" stop-color="#c38c55"/><stop offset="1" stop-color="#8f6237"/></radialGradient>` +
    `<clipPath id="car-circ" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>`
  );

  /* ---------- colour + geometry helpers ---------- */
  const okHex = c => typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c);
  const rgb = c => { c = c.slice(1); if (c.length === 3) c = c.split('').map(h => h + h).join(''); const n = parseInt(c, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const lt = (c, k) => mix(c, '#ffffff', k), dk = (c, k) => mix(c, '#000000', k);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const n1 = v => (Math.abs(v) < 0.05 ? 0 : v).toFixed(1);
  const f2 = v => (+v).toFixed(2);
  // keep the part of polygon [x,z][] where fn(p) >= 0 (Sutherland-Hodgman, one half-plane)
  function clip(poly, fn) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], fa = fn(a), fb = fn(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }
  const band = (poly, z0, z1) => clip(clip(poly, p => p[1] - z0), p => z1 - p[1]);
  const xband = (poly, x0, x1) => clip(clip(poly, p => p[0] - x0), p => x1 - p[0]);
  // inset a convex polygon by d
  function inset(poly, d) {
    const n = poly.length, cx = poly.reduce((a, p) => a + p[0], 0) / n, cz = poly.reduce((a, p) => a + p[1], 0) / n;
    const lines = poly.map((a, i) => {
      const b = poly[(i + 1) % n]; let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
      if (nx * (cx - a[0]) + nz * (cz - a[1]) < 0) { nx = -nx; nz = -nz; }
      return { p: [a[0] + nx * d, a[1] + nz * d], d: [b[0] - a[0], b[1] - a[1]] };
    });
    const out = [];
    for (let i = 0; i < n; i++) {
      const L1 = lines[(i - 1 + n) % n], L2 = lines[i];
      const den = L1.d[0] * L2.d[1] - L1.d[1] * L2.d[0];
      if (Math.abs(den) < 1e-9) { out.push(L2.p); continue; }
      const t = ((L2.p[0] - L1.p[0]) * L2.d[1] - (L2.p[1] - L1.p[1]) * L2.d[0]) / den;
      out.push([L1.p[0] + L1.d[0] * t, L1.p[1] + L1.d[1] * t]);
    }
    return out;
  }
  // x where the horizontal line z crosses the profile: max (front) or min (rear)
  function xAtZ(prof, z, front) {
    let best = front ? -1e9 : 1e9;
    for (let i = 0; i < prof.length; i++) {
      const a = prof[i], b = prof[(i + 1) % prof.length];
      if ((a[1] - z) * (b[1] - z) <= 0 && a[1] !== b[1]) { const x = a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]); best = front ? Math.max(best, x) : Math.min(best, x); }
    }
    return Math.abs(best) > 1e8 ? (front ? Math.max(...prof.map(p => p[0])) : Math.min(...prof.map(p => p[0]))) : best;
  }

  /* ---------- projection basis derived from the current P (iso or oblique) ---------- */
  function basis() {
    const o = P(0, 0, 0), ex = P(1, 0, 0), ey = P(0, 1, 0), ez = P(0, 0, 1);
    const X = [ex[0] - o[0], ex[1] - o[1]], Y = [ey[0] - o[0], ey[1] - o[1]], Z = [ez[0] - o[0], ez[1] - o[1]];
    const r1 = [X[0], Y[0], Z[0]], r2 = [X[1], Y[1], Z[1]];
    let v = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
    if (v[2] < 0) v = v.map(a => -a);           // towards the viewer
    return { X, Y, Z, v };
  }
  const mtx = (U, V, c) => `matrix(${U[0].toFixed(3)},${U[1].toFixed(3)},${V[0].toFixed(3)},${V[1].toFixed(3)},${c[0].toFixed(2)},${c[1].toFixed(2)})`;

  /* ---------- vehicle definitions (local frame, heading +x) ----------
     body: convex side profile [x,z] (lower body); cab: convex greenhouse profile, base first at the rear
     W / Wc: half widths; taper: greenhouse tumblehome; hl/tl: head/tail light z range; gr: grille z range;
     bp: bumper top z; wheels: x; r: wheel radius; seams: door gap x; pillars: B/C pillar x */
  const TYPES = {
    sedan: {
      W: 4.5, Wc: 3.9, taper: 0.55, r: 2.05, wheels: [5.6, -5.6], seams: [4.0, 0.9, -4.1], pillars: [0.9],
      body: [[-8.3, 1.3], [-8.9, 1.8], [-9, 3.2], [-8.9, 4.6], [-8.5, 5.3], [-7.6, 5.75], [-5.6, 5.85], [4.0, 5.75], [6.4, 5.45], [8.0, 5.0], [8.8, 4.5], [9, 3.8], [9, 2.2], [8.6, 1.5], [8.0, 1.3]],
      cab: [[-5.6, 5.8], [-4.0, 8.6], [-3.0, 9.55], [-2.2, 9.85], [0.6, 9.85], [1.5, 9.5], [4.0, 5.75]],
      hl: [3.6, 4.6], tl: [4.0, 5.1], gr: [2.7, 3.6], bp: 2.6
    },
    hatch: {
      W: 4.3, Wc: 3.7, taper: 0.5, r: 1.95, wheels: [4.9, -4.9], seams: [3.0, -2.0], pillars: [-2.0],
      body: [[-7.0, 1.3], [-7.5, 1.8], [-7.6, 3.5], [-7.5, 5.3], [-7.2, 5.95], [3.4, 5.85], [5.4, 5.4], [6.9, 4.8], [7.5, 4.1], [7.6, 3.4], [7.6, 2.1], [7.1, 1.3]],
      cab: [[-7.2, 5.9], [-6.8, 8.8], [-6.2, 9.8], [-5.2, 10.05], [-0.2, 10.05], [0.8, 9.6], [3.4, 5.85]],
      hl: [3.6, 4.6], tl: [4.2, 5.4], gr: [2.6, 3.5], bp: 2.5
    },
    ev: {
      W: 4.4, Wc: 3.8, taper: 0.55, r: 2.0, wheels: [5.3, -5.3], seams: [2.6, -1.6, -5.2], pillars: [-1.6],
      body: [[-7.8, 1.4], [-8.3, 1.9], [-8.4, 3.6], [-8.2, 5.2], [-7.7, 5.8], [2.8, 5.8], [5.2, 5.35], [7.2, 4.7], [8.2, 3.9], [8.4, 3.0], [8.3, 2.1], [7.8, 1.4]],
      cab: [[-7.7, 5.8], [-6.6, 8.9], [-5.6, 9.75], [-4.2, 10.0], [-1.0, 10.0], [0.4, 9.5], [2.8, 5.8]],
      hl: [3.7, 4.6], tl: [4.3, 5.3], gr: [2.4, 3.1], bp: 2.3
    },
    suv: {
      W: 4.8, Wc: 4.35, taper: 0.45, r: 2.4, wheels: [5.8, -5.8], seams: [4.8, 0.6, -4.3], pillars: [0.6, -4.6], rails: true, plastic: true,
      body: [[-8.4, 1.7], [-8.9, 2.2], [-9, 6.0], [-8.7, 6.55], [5.0, 6.65], [7.0, 6.4], [8.4, 5.9], [8.9, 5.3], [9, 4.4], [9, 2.4], [8.5, 1.7]],
      cab: [[-8.7, 6.6], [-8.5, 11.2], [-8.1, 11.75], [-7.2, 11.95], [1.8, 11.95], [2.8, 11.6], [5.0, 6.65]],
      hl: [4.6, 5.6], tl: [4.8, 6.0], gr: [3.2, 4.8], bp: 3.0
    },
    pickup: {
      W: 4.7, Wc: 4.2, taper: 0.4, r: 2.3, wheels: [5.8, -5.8], seams: [4.3, -2.2], pillars: [], plastic: true,
      body: [[-8.4, 1.7], [-8.9, 2.2], [-9, 6.0], [-8.8, 6.3], [4.4, 6.3], [6.6, 6.05], [8.3, 5.6], [8.9, 5.0], [9, 4.2], [9, 2.4], [8.5, 1.7]],
      cab: [[-2.2, 6.3], [-2.0, 10.5], [-1.6, 10.95], [-0.8, 11.1], [1.6, 11.1], [2.4, 10.7], [4.4, 6.3]],
      hl: [4.3, 5.2], tl: [4.4, 5.6], gr: [3.1, 4.6], bp: 3.0, bed: [-8.7, -2.6]
    },
    minibus: {
      W: 4.6, Wc: 4.6, taper: 0.3, r: 2.1, wheels: [6.0, -6.0], seams: [7.6, 4.6, 0.2], pillars: [4.6, 0.2, -4.4], stripe: true,
      body: [[-8.4, 1.4], [-8.9, 1.9], [-9, 6.2], [8.0, 6.2], [8.7, 5.6], [9, 4.6], [9, 2.1], [8.5, 1.4]],
      cab: [[-9, 6.2], [-8.9, 12.0], [-8.5, 12.45], [5.4, 12.45], [6.2, 12.0], [8.0, 6.2]],
      hl: [4.0, 5.0], tl: [4.4, 5.8], gr: [2.8, 3.8], bp: 2.6
    },
    // cab-over utility truck; the load bed is built separately (see drawTruckBed)
    truck: {
      W: 5.0, Wc: 4.9, taper: 0.3, r: 2.6, wheels: [8.6], rearWheel: -6.2, seams: [11.3, 5.2], pillars: [], plastic: true, L: 12,
      body: [[4.8, 2.0], [4.4, 2.4], [4.4, 8.4], [11.6, 8.4], [12.0, 7.6], [12.1, 4.0], [12.1, 2.6], [11.7, 2.0]],
      cab: [[4.4, 8.4], [4.5, 12.2], [4.9, 12.6], [10.9, 12.6], [11.4, 12.2], [11.6, 8.4]],
      hl: [3.5, 4.5], tl: [3.2, 3.9], gr: [4.8, 7.2], bp: 3.0
    }
  };

  const ZESA = ['#d7262e', '#f2c230', '#1f3f99'], REF = ['#d7262e', '#3b2a8c', '#2e9e48'];   // REF: the logo's red arc, blue and green swoosh
  const LIVERIES = {
    moepd: { type: 'suv', color: '#f4f6f8' },
    zera: { type: 'ev', color: '#c6cdd4' },
    zetdc: { type: 'pickup', color: '#f6f7f8', rack: true },
    'zetdc-truck': { type: 'truck', color: '#f6f7f8' },
    'ref-truck': { type: 'truck', color: '#f6f7f8' }
  };

  /* ---------- the vehicle ---------- */
  function car(opts = {}) {
    const liv = LIVERIES[opts.livery] ? opts.livery : null;
    opts = Object.assign({}, liv ? LIVERIES[liv] : {}, opts);
    if (liv && !okHex(arguments[0] && arguments[0].color)) opts.color = LIVERIES[liv].color;
    const typeName = TYPES[opts.type] ? opts.type : 'sedan';
    const t = TYPES[typeName];
    const s = opts.dir === -1 ? -1 : 1;
    const col = okHex(opts.color) ? opts.color : '#4f7fe0';
    const z0 = opts.z != null ? +opts.z : 0.4;
    const B = basis();
    const W = t.W, Wc = t.Wc, r = t.r;
    const cTop = lt(col, 0.32), cSide = col, cEnd = dk(col, 0.22), cLine = dk(col, 0.45), cHi = lt(col, 0.7);
    const plastic = '#2f353c';
    const edge = `stroke="${dk(col, 0.4)}" stroke-width=".3" stroke-linejoin="round" stroke-opacity=".5"`;
    const Q = (x, y, z) => P(s * x, y, z + z0);        // local -> screen
    const W3 = (x, y, z) => P(x, y, z + z0);           // world-x -> screen
    const shade = (nx, nz, top, side, end) => nx >= 0 ? mix(top, end, clamp(nx / (nx + Math.max(nz, 0.0001)))) : mix(top, side, clamp(-nx * 0.8));
    const sideAt = (prof, y) => prof.map(([x, z]) => Q(x, y, z));
    // side-plane groups: text (never mirrored, reads left->right) and art (mirrored with the car)
    // opts.mirror: the caller flips the car with scale(-1,1) (to drive along y), so text runs the other way to stay readable
    const tX = opts.mirror ? [-B.X[0], -B.X[1]] : B.X;
    const textM = (x, y, z) => mtx(tX, [-B.Z[0], -B.Z[1]], Q(x, y, z));
    const artM = (y) => mtx([s * B.X[0], s * B.X[1]], [-B.Z[0], -B.Z[1]], Q(0, y, 0));
    const sideText = (x, y, z, str, attrs) => `<g transform="${textM(x, y, z)}"><text text-anchor="middle" ${attrs}>${str}</text></g>`;
    const isTruck = typeName === 'truck';
    const L = t.L || Math.max(...t.body.map(p => Math.abs(p[0])));
    const Lr = isTruck ? -12 : Math.min(...t.body.map(p => p[0]));
    let o = '';

    // strips of a convex profile extruded across y (wf: half width at height z)
    function strips(prof, wf) {
      const wp = prof.map(([x, z]) => [s * x, z]);
      const cx = wp.reduce((a, p) => a + p[0], 0) / wp.length, cz = wp.reduce((a, p) => a + p[1], 0) / wp.length;
      const out = [];
      for (let i = 0; i < wp.length; i++) {
        const a = wp[i], b = wp[(i + 1) % wp.length];
        let nx = b[1] - a[1], nz = -(b[0] - a[0]);
        const len = Math.hypot(nx, nz) || 1; nx /= len; nz /= len;
        if (nx * (a[0] - cx) + nz * (a[1] - cz) < 0) { nx = -nx; nz = -nz; }
        if (len > 1e-6 && nx * B.v[0] + nz * B.v[2] > 1e-6) out.push({ a, b, nx, nz, wa: wf(a[1]), wb: wf(b[1]) });
      }
      return out;
    }
    const quad = (st, ins = 0, t0 = 0, t1 = 1) => {
      const ax = st.a[0] + (st.b[0] - st.a[0]) * t0, az = st.a[1] + (st.b[1] - st.a[1]) * t0;
      const bx = st.a[0] + (st.b[0] - st.a[0]) * t1, bz = st.a[1] + (st.b[1] - st.a[1]) * t1;
      const wa = st.wa + (st.wb - st.wa) * t0 - ins, wb = st.wa + (st.wb - st.wa) * t1 - ins;
      return [W3(ax, -wa, az), W3(bx, -wb, bz), W3(bx, wb, bz), W3(ax, wa, az)];
    };
    // simple world-space box with the three visible faces: [top, +y, +x]
    const boxW = (xa, ya, za, xb, yb, zb, c, extra = '') =>
      poly([W3(xa, yb, za), W3(xb, yb, za), W3(xb, yb, zb), W3(xa, yb, zb)], c[1], extra) +
      poly([W3(xb, ya, za), W3(xb, yb, za), W3(xb, yb, zb), W3(xb, ya, zb)], c[2], extra) +
      poly([W3(xa, ya, zb), W3(xb, ya, zb), W3(xb, yb, zb), W3(xa, yb, zb)], c[0], extra);
    const boxL = (x0, x1, ya, yb, za, zb, c, extra) => { const a = s * x0, b = s * x1; return boxW(Math.min(a, b), ya, za, Math.max(a, b), yb, zb, c, extra); };
    const discY = (x, y, z, rad, fill, extra = '') => `<circle r="${f2(rad)}" fill="${fill}" transform="${mtx(B.X, B.Z, Q(x, y, z))}" ${extra}/>`;

    // ---- soft shadow ----
    const cxS = (L + Lr) / 2, hl = (L - Lr) / 2;
    o += `<g transform="${mtx(B.X, B.Y, Q(cxS + 0.8 * s, 0.7, 0))}"><circle r="1" transform="scale(${(hl + 3).toFixed(1)},${(W + 2.8).toFixed(1)})" fill="url(#ao-soft)"/></g>`;
    o += poly([Q(Lr + 0.6, -W + 0.4, 0), Q(L - 0.6, -W + 0.4, 0), Q(L - 0.4, W + 0.7, 0), Q(Lr + 0.4, W + 0.7, 0)], '#0b1e33', 'opacity=".22"');

    // ---- far-side tyres ----
    t.wheels.concat(isTruck ? [t.rearWheel] : []).forEach(xw => { o += discY(xw, -W + 0.6, r, r, '#15181c'); });

    // ---- wheel (near side) ----
    const spinDur = opts.spin ? (typeof opts.spin === 'number' ? opts.spin : 0.7) : 0;
    function wheel(xw, yFace, dual) {
      let w = '';
      const M = (y) => mtx(B.X, B.Z, Q(xw, y, r));
      [yFace - 1.6, yFace - 1.05, yFace - 0.5].forEach(y => { w += `<circle r="${r}" fill="#1a1d21" transform="${M(y)}"/>`; });
      if (dual) w += `<circle r="${r}" fill="#23272c" transform="${M(yFace - 0.15)}"/>`;
      let spokes = '';
      for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5; spokes += `M${f2(r * 0.12 * Math.cos(a))} ${f2(r * 0.12 * Math.sin(a))}L${f2(r * 0.54 * Math.cos(a))} ${f2(r * 0.54 * Math.sin(a))}`; }
      const rot = spinDur ? `<animateTransform attributeName="transform" type="rotate" from="0" to="${s === 1 ? -360 : 360}" dur="${spinDur.toFixed(2)}s" repeatCount="indefinite"/>` : '';
      w += `<g transform="${M(yFace + (dual ? 0.1 : 0))}"><circle r="${r}" fill="url(#car-tyre)"/><circle r="${f2(r * 0.97)}" fill="none" stroke="#4a5058" stroke-width=".18"/>` +
        `<circle r="${f2(r * 0.62)}" fill="url(#car-rim)"/><circle r="${f2(r * 0.54)}" fill="#3b4249"/>` +
        `<g><path d="${spokes}" stroke="#dfe5eb" stroke-width="${f2(r * 0.17)}" stroke-linecap="round"/>${rot}</g>` +
        `<circle r="${f2(r * 0.62)}" fill="none" stroke="#eef2f5" stroke-width=".18"/><circle r="${f2(r * 0.15)}" fill="#f4f7fa" stroke="#7d8a98" stroke-width=".15"/></g>`;
      return w;
    }
    function arch(xw, zBot, flare) {
      const ra = r + 0.5, arc = [];
      for (let k = 0; k <= 12; k++) { const a = Math.PI * k / 12; arc.push([xw + ra * Math.cos(a), r + ra * Math.sin(a)]); }
      let a = poly(arc.concat([[xw - ra, zBot - 0.02], [xw + ra, zBot - 0.02]]).map(([x, z]) => Q(x, W + 0.03, z)), '#15191e');
      a += `<polyline points="${pts(arc.map(([x, z]) => Q(xw + (x - xw) * 1.06, W + 0.05, r + (z - r) * 1.06)))}" fill="none" stroke="${flare ? plastic : cLine}" stroke-width="${flare ? 0.7 : 0.5}" stroke-linecap="round"/>`;
      return a;
    }

    // ---- lower body (any convex profile) ----
    function lowerBody(prof, WW, stripeFn) {
      let b = '';
      strips(prof, () => WW).forEach(st => {
        b += poly(quad(st), shade(st.nx, st.nz, cTop, cSide, cEnd), edge);
        if (st.nz > 0.5) b += poly(quad(st), 'url(#car-top-sh)');
        else if (st.nx > 0.9) b += poly(quad(st), 'url(#car-end-sh)');
      });
      const side = sideAt(prof, WW);
      b += poly(side, cSide, edge);
      if (stripeFn) b += stripeFn(prof, WW);
      b += poly(side, 'url(#car-side-sh)') + poly(side, 'url(#car-refl)');
      // crisp shoulder highlight + crease below it
      const zTopMax = Math.max(...prof.map(p => p[1]));
      const upper = prof.filter(p => p[1] > zTopMax - 1.6);
      b += `<polyline points="${pts(upper.map(([x, z]) => Q(x, WW + 0.03, z - 0.12)))}" fill="none" stroke="${cHi}" stroke-width=".55" stroke-linecap="round" stroke-linejoin="round"/>`;
      const xs = upper.map(p => p[0]), xa = Math.min(...xs) + 0.8, xb = Math.max(...xs) - 1.0;
      b += `<polyline points="${pts([Q(xa, WW + 0.03, zTopMax - 1.25), Q(xb, WW + 0.03, zTopMax - 1.45)])}" stroke="${dk(col, 0.18)}" stroke-width=".3" stroke-opacity=".7" fill="none"/>`;
      // darker sill + bumper corners
      const zBot = Math.min(...prof.map(p => p[1]));
      const sill = band(prof, zBot - 1, zBot + 0.85);
      if (sill.length > 2) b += poly(sideAt(sill, WW + 0.02), t.plastic ? plastic : dk(col, 0.3), 'opacity=".9"');
      const xMax = Math.max(...prof.map(p => p[0])), xMin = Math.min(...prof.map(p => p[0]));
      [[xMax - 1.1, xMax + 1], [xMin - 1, xMin + 1.1]].forEach(([a, c]) => {
        const bp = band(xband(prof, a, c), zBot - 1, t.bp);
        if (bp.length > 2) b += poly(sideAt(bp, WW + 0.02), t.plastic ? plastic : dk(col, 0.14));
      });
      return b;
    }

    // ---- end panel (visible +x world end): lights, grille, bumper, plate ----
    function endPanel(prof, WW) {
      let e = '';
      const front = s === 1;
      if (isTruck && !front) return '';                 // truck tail end is drawn with the load bed
      const xe = z => (front ? xAtZ(prof, z, true) : xAtZ(prof, z, false)) * s + 0.05;   // world x on the visible nose/tail
      const zBot = Math.min(...prof.map(p => p[1]));
      const rectE = (y0, y1, za, zb, fill, extra = '') => poly([W3(xe(za), y0, za), W3(xe(za), y1, za), W3(xe(zb), y1, zb), W3(xe(zb), y0, zb)], fill, extra);
      e += rectE(-WW + 0.1, WW - 0.1, zBot + 0.15, t.bp, t.plastic ? plastic : dk(col, 0.3), 'opacity=".92"');      // bumper
      e += `<polyline points="${pts([W3(xe(t.bp), -WW + 0.3, t.bp), W3(xe(t.bp), WW - 0.3, t.bp)])}" stroke="${cHi}" stroke-width=".3" fill="none"/>`;
      e += rectE(-1.15, 1.15, zBot + 0.35, zBot + 0.35 + 0.75, '#f6f8fa', 'stroke="#8d99a6" stroke-width=".15"');       // plate
      const [l0, l1] = front ? t.hl : t.tl;
      if (front) {
        const [g0, g1] = t.gr;
        e += rectE(-WW + 2.1, WW - 2.1, g0, g1, '#20252b', 'stroke="#aab4be" stroke-width=".3"');
        for (let k = 1; k < 4; k++) { const z = g0 + (g1 - g0) * k / 4; e += `<polyline points="${pts([W3(xe(z) + 0.02, -WW + 2.3, z), W3(xe(z) + 0.02, WW - 2.3, z)])}" stroke="#5d6873" stroke-width=".22" fill="none"/>`; }
        e += rectE(-0.45, 0.45, (g0 + g1) / 2 - 0.3, (g0 + g1) / 2 + 0.3, '#dfe5eb');                                  // badge
      } else {
        e += `<polyline points="${pts([W3(xe(l0 - 0.2), -WW + 1.9, l0 - 0.2), W3(xe(l0 - 0.2), WW - 1.9, l0 - 0.2)])}" stroke="${cLine}" stroke-width=".3" fill="none"/>`;
      }
      [[WW - 1.9, WW - 0.3], [-WW + 0.3, -WW + 1.9]].forEach(([y0, y1]) => {
        e += rectE(y0, y1, l0, l1, front ? '#e9eef3' : '#b8231d', `stroke="${front ? '#6f7c88' : '#7a1612'}" stroke-width=".22"`);
        e += rectE(y0 + 0.25, y1 - 0.3, l0 + 0.22, l1 - 0.25, front ? '#ffffff' : '#ff6f5f');
        if (front) e += rectE(y0 + 0.2, y1 - 0.2, l0 + 0.05, l0 + 0.2, '#ffb347');                                     // DRL / indicator strip
        if (opts.glow) {
          const c = W3(xe((l0 + l1) / 2), (y0 + y1) / 2, (l0 + l1) / 2);
          e += `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${front ? 3 : 2.4}" fill="url(#car-halo-${front ? 'w' : 'r'})" class="glow"/>`;
        }
      });
      // light wraps on the near side (front: clear/amber, rear: red)
      const fx = z => xAtZ(prof, z, true), rx = z => xAtZ(prof, z, false);
      e += poly([Q(fx(t.hl[0]) - 1.1, WW + 0.04, t.hl[0]), Q(fx(t.hl[0]) - 0.05, WW + 0.04, t.hl[0]), Q(fx(t.hl[1]) - 0.05, WW + 0.04, t.hl[1]), Q(fx(t.hl[1]) - 0.8, WW + 0.04, t.hl[1])], '#fff6d2', 'stroke="#c99a3a" stroke-width=".2"');
      if (!isTruck) e += poly([Q(rx(t.tl[0]) + 0.05, WW + 0.04, t.tl[0]), Q(rx(t.tl[0]) + 1.0, WW + 0.04, t.tl[0]), Q(rx(t.tl[1]) + 0.9, WW + 0.04, t.tl[1]), Q(rx(t.tl[1]) + 0.05, WW + 0.04, t.tl[1])], '#c8261f', 'stroke="#7a1612" stroke-width=".2"');
      return e;
    }

    // ---- doors: seams + handles ----
    function doors(prof, WW, zBelt) {
      let d = '';
      const zBot = Math.min(...prof.map(p => p[1]));
      const seams = t.seams.slice().sort((a, b) => b - a);
      seams.forEach(xs => { d += `<polyline points="${pts([Q(xs, WW + 0.04, zBot + 0.85), Q(xs, WW + 0.04, zBelt - 0.12)])}" stroke="${cLine}" stroke-width=".3" stroke-opacity=".8" fill="none"/>`; });
      d += `<polyline points="${pts([Q(seams[seams.length - 1], WW + 0.04, zBot + 0.9), Q(seams[0], WW + 0.04, zBot + 0.9)])}" stroke="${cLine}" stroke-width=".25" stroke-opacity=".5" fill="none"/>`;
      for (let i = 0; i < seams.length - 1; i++) {
        const hx = seams[i + 1] + 0.45, hz = zBelt - 1.0;
        d += poly([Q(hx, WW + 0.05, hz), Q(hx + 1.0, WW + 0.05, hz), Q(hx + 1.0, WW + 0.05, hz + 0.32), Q(hx, WW + 0.05, hz + 0.32)], dk(col, 0.28), `stroke="${cHi}" stroke-width=".12"`);
      }
      return d;
    }

    // ---- greenhouse ----
    function cabin(prof, WC, taper) {
      let c = '';
      const zb = Math.min(...prof.map(p => p[1])), zr = Math.max(...prof.map(p => p[1]));
      const wf = z => WC - taper * clamp((z - zb) / (zr - zb));
      strips(prof, wf).forEach(st => {
        if (st.nz >= 0.62) {
          c += poly(quad(st), shade(st.nx, st.nz, cTop, cSide, cEnd), edge) + poly(quad(st), 'url(#car-top-sh)');
        } else {
          c += poly(quad(st), shade(st.nx, st.nz, cTop, cSide, cEnd), edge);
          const g = quad(st, 0.45, 0.08, 0.94);
          c += poly(g, shade(st.nx, st.nz, '#c4e6f7', '#78afd5', '#4a80aa'), 'stroke="#1c2730" stroke-width=".3"') + poly(g, 'url(#car-sheen)');
        }
      });
      if (t.rails) {
        const xa = Math.min(...prof.filter(p => p[1] > zr - 0.3).map(p => p[0])), xb = Math.max(...prof.filter(p => p[1] > zr - 0.3).map(p => p[0]));
        [-wf(zr) + 0.5, wf(zr) - 0.5].forEach(yy => { c += `<polyline points="${pts([Q(xa + 0.3, yy, zr + 0.45), Q(xb - 0.3, yy, zr + 0.45)])}" stroke="#2f363d" stroke-width=".6" stroke-linecap="round" fill="none"/>`; });
      }
      c += poly(prof.map(([x, z]) => Q(x, wf(z), z)), cSide, edge) + poly(prof.map(([x, z]) => Q(x, wf(z), z)), 'url(#car-side-sh)');
      const win = inset(prof, 0.5);
      const wP = a => a.map(([x, z]) => Q(x, wf(z) + 0.03, z));
      c += poly(wP(win), 'url(#car-glass)', 'stroke="#1c2730" stroke-width=".35"') + poly(wP(win), 'url(#car-sheen)');
      t.pillars.forEach(px => { const pp = xband(win, px - 0.38, px + 0.38); if (pp.length > 2) c += poly(wP(pp), '#2a3036'); });
      // roof-edge highlight
      const top = prof.filter(p => p[1] > zr - 0.5);
      c += `<polyline points="${pts(top.map(([x, z]) => Q(x, wf(z) + 0.02, z - 0.1)))}" stroke="${cHi}" stroke-width=".45" fill="none" stroke-linecap="round"/>`;
      // wing mirror
      const fb = prof.reduce((a, p) => (p[1] <= zb + 0.3 && p[0] > a[0] ? p : a), [-1e9, 0]);
      const mx = fb[0] - 0.7, mz = zb + 0.45, mOut = WC + 1.0;
      const mxF = s === 1 ? mx : mx - 0.9;
      c += poly([Q(mxF, WC, mz), Q(mxF, mOut, mz), Q(mxF, mOut, mz + 0.9), Q(mxF, WC, mz + 0.9)], s === 1 ? dk(col, 0.25) : '#2a3036');
      c += poly([Q(mx, WC, mz + 0.9), Q(mx, mOut, mz + 0.9), Q(mx - 0.9, mOut, mz + 0.9), Q(mx - 0.9, WC, mz + 0.9)], cTop);
      c += poly([Q(mx, mOut, mz), Q(mx - 0.9, mOut, mz), Q(mx - 0.9, mOut, mz + 0.9), Q(mx, mOut, mz + 0.9)], cSide, edge);
      return c;
    }

    // ---- livery art painted on the lower-body side (drawn inside lowerBody, before the shading overlays) ----
    const zesaBand = (z0b, z1b, cols = ZESA) => (prof, WW) => {
      let b = '';
      const h = (z1b - z0b) / 3;
      cols.forEach((c, i) => { const p = band(prof, z1b - h * (i + 1), z1b - h * i); if (p.length > 2) b += poly(sideAt(p, WW + 0.01), c); });
      return b;
    };
    let stripeFn = null;
    if (t.stripe) {
      const sc = okHex(opts.stripe) ? opts.stripe : '#f2b233';
      stripeFn = (prof, WW) => { const p = band(prof, 3.6, 4.3); return p.length > 2 ? poly(sideAt(p, WW + 0.01), sc, 'opacity=".9"') : ''; };
    }
    if (liv === 'zetdc') stripeFn = zesaBand(4.3, 5.25);
    if (liv === 'zetdc-truck') stripeFn = zesaBand(6.0, 6.9);
    if (liv === 'ref-truck') stripeFn = zesaBand(6.0, 6.9, REF);

    function liveryArt() {
      let a = '';
      const yS = W + 0.06;
      if (liv === 'zera') {
        a += `<g transform="${artM(yS)}" fill="none" stroke-linecap="round">` +
          `<path d="M7.6 -4.5C4.6 -4.1 2.2 -2.9 -1.4 -2.5C-3.6 -2.3 -5.4 -2.6 -6.6 -3.2" stroke="#2e9e48" stroke-width=".42"/>` +
          `<path d="M7.3 -4.95C4.4 -4.6 2.0 -3.5 -0.8 -3.15" stroke="#8cc63f" stroke-width=".28"/>` +
          `<path d="M6.9 -4.0C4.6 -3.4 2.5 -2.3 0.2 -2.0" stroke="#58b947" stroke-width=".22"/>` +
          `<path d="M-4.8 -2.4C-5.6 -3.4 -6.3 -4.4 -6.4 -5.1" stroke="#2e9e48" stroke-width=".3"/>` +
          `<ellipse cx="-6.3" cy="-4.05" rx=".95" ry="1.1" fill="#5cb947" stroke="none"/><ellipse cx="-6.5" cy="-4.35" rx=".45" ry=".5" fill="#a6dc6e" stroke="none"/>` +
          `<path d="M-6.0 -5.1v-.6M-6.6 -5.1v-.6" stroke="#2e7d3a" stroke-width=".22"/></g>`;
        const tx = -0.1;
        a += sideText(tx, yS, 4.85, '100% Electric', 'font-size=".6" font-weight="800" fill="#1f7a3d" font-family="Segoe UI,Arial,sans-serif"');
        a += sideText(tx, yS, 4.25, 'Zero Emissions', 'font-size=".4" font-weight="700" fill="#2e8a46" font-family="Segoe UI,Arial,sans-serif"');
        a += sideText(tx, yS, 2.75, 'ZERA', 'font-size="1.15" font-weight="900" fill="#4a3d32" letter-spacing=".08" font-family="Segoe UI,Arial,sans-serif"');
      }
      if (liv === 'moepd') {
        const seams = t.seams.slice().sort((p, q) => q - p);
        const lx = (seams[0] + seams[1]) / 2 - 0.7, lz = 4.6, rr = 1.3;
        if (opts.logo === false) {
          a += `<g transform="${textM(lx, yS, lz)}">` +
            `<circle r="${rr}" fill="#d9a53c" stroke="#8a6a1e" stroke-width=".1"/><circle r="${f2(rr * 0.68)}" fill="#fff"/>` +
            `<path d="M0 0V-${f2(rr * 0.66)}A${f2(rr * 0.66)} ${f2(rr * 0.66)} 0 0 0 -${f2(rr * 0.66)} 0Z" fill="#f6d24a"/>` +
            `<path d="M0 0H${f2(rr * 0.66)}A${f2(rr * 0.66)} ${f2(rr * 0.66)} 0 0 0 0 -${f2(rr * 0.66)}Z" fill="#2f6fb8"/>` +
            `<path d="M0 0H-${f2(rr * 0.66)}A${f2(rr * 0.66)} ${f2(rr * 0.66)} 0 0 0 0 ${f2(rr * 0.66)}Z" fill="#c8302c"/>` +
            `<path d="M-${f2(rr * 0.66)} 0H${f2(rr * 0.66)}M0 -${f2(rr * 0.66)}V${f2(rr * 0.66)}" stroke="#1d2b3a" stroke-width=".08"/></g>`;
        } else {
          const href = Assets.url ? Assets.url('logos/moepd.png') : 'logos/moepd.png';
          a += `<g transform="${textM(lx, yS, lz)}"><circle r="${f2(rr + 0.08)}" fill="#fff" stroke="#c9d2db" stroke-width=".08"/>` +
            `<image href="${href}" x="-${rr}" y="-${rr}" width="${2 * rr}" height="${2 * rr}" preserveAspectRatio="xMidYMid slice" clip-path="url(#car-circ)"/></g>`;
        }
        a += sideText((seams[1] + seams[2]) / 2 + 0.25, yS, 4.75, 'GOVERNMENT OF ZIMBABWE', 'font-size=".34" font-weight="700" fill="#2b3a4a" font-family="Segoe UI,Arial,sans-serif"');
      }
      if (liv === 'zetdc') {
        const seams = t.seams.slice().sort((p, q) => q - p);
        a += sideText((seams[0] + seams[1]) / 2 - 0.9, yS, 2.95, 'ZETDC', 'font-size="1.1" font-weight="700" font-style="italic" fill="#1f3f99" font-family="Times New Roman,Georgia,serif"');
      }
      if (liv === 'zetdc-truck') {
        a += sideText(8.0, yS, 7.15, 'ZETDC', 'font-size=".95" font-weight="700" font-style="italic" fill="#1f3f99" font-family="Times New Roman,Georgia,serif"');
      }
      if (liv === 'ref-truck') {
        a += sideText(8.0, yS, 7.15, 'REF', 'font-size=".95" font-weight="700" fill="#3b2a8c" font-family="Times New Roman,Georgia,serif"');
      }
      return a;
    }

    // ---- pickup load bed ----
    function pickupBed() {
      let b = '';
      const zt = Math.max(...t.body.map(p => p[1])), zf = zt - 2, m = 0.5;
      const xa = Math.min(s * t.bed[0], s * t.bed[1]) + m, xb = Math.max(s * t.bed[0], s * t.bed[1]) - m;
      const ya = -W + m, yb = W - m;
      b += poly([W3(xa, ya, zt), W3(xb, ya, zt), W3(xb, yb, zt), W3(xa, yb, zt)], '#3a4148');
      b += poly([W3(xa, ya, zt), W3(xb, ya, zt), W3(xb - 2, ya, zf), W3(xa, ya, zf)], dk(col, 0.3));
      b += poly([W3(xa, ya, zt), W3(xa, yb, zt), W3(xa, yb - 2, zf), W3(xa, ya, zf)], dk(col, 0.45));
      for (let k = 1; k < 5; k++) { const yy = ya + (yb - 2 - ya) * k / 5; b += `<polyline points="${pts([W3(xa, yy, zf), W3(xb - 2, yy, zf)])}" stroke="#262b31" stroke-width=".3" fill="none"/>`; }
      b += `<polyline points="${pts([W3(xa, yb, zt), W3(xb, yb, zt), W3(xb, ya, zt)])}" fill="none" stroke="${cHi}" stroke-width=".45"/>`;
      b += `<polyline points="${pts([W3(xa, ya, zt), W3(xb, ya, zt)])}" fill="none" stroke="${cHi}" stroke-width=".3" stroke-opacity=".7"/>`;
      return b;
    }
    // ---- roll bar + ladder rack (zetdc) ----
    function rack() {
      const zt = Math.max(...t.body.map(p => p[1])), zr = Math.max(...t.cab.map(p => p[1]));
      const xf = t.cab[0][0] - 0.5, xr = t.bed[0] + 0.3, zTop = zr - 0.3, yy = W - 0.45;
      const ln = (pp, w = 0.45, c = '#1d2126') => `<polyline points="${pts(pp)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      let k = '';
      // far side first
      k += ln([Q(xf, -yy, zt), Q(xf, -yy, zTop)]) + ln([Q(xf - 2.4, -yy, zt), Q(xf, -yy, zTop - 1.6)]) + ln([Q(xr, -yy, zt), Q(xr, -yy, zTop)]);
      k += ln([Q(xf, -yy, zTop), Q(xr, -yy, zTop)]);
      k += ln([Q(xf, -yy, zTop), Q(xf, yy, zTop)], 0.6) + ln([Q(xr, -yy, zTop), Q(xr, yy, zTop)], 0.5);
      k += ln([Q(xf, -yy, zTop - 0.9), Q(xf, yy, zTop - 0.9)], 0.35);
      // near side
      k += ln([Q(xf, yy, zt), Q(xf, yy, zTop)]) + ln([Q(xf - 2.4, yy, zt), Q(xf, yy, zTop - 1.6)]) + ln([Q(xr, yy, zt), Q(xr, yy, zTop)]);
      k += ln([Q(xf, yy, zTop), Q(xr, yy, zTop)]);
      k += ln([Q(xf, yy, zTop + 0.12), Q(xr, yy, zTop + 0.12)], 0.15, '#6c7680');
      return k;
    }

    // ---- truck load bed (deck, dropsides, cargo) ----
    function truckBed() {
      let b = '';
      const alu = ['#e3e8ed', '#c4cdd6', '#aab5c0'], head = ['#d0d7de', '#b2bdc8', '#98a5b2'];
      const zd = 5.4, zdt = 6.0, zw = 7.9, th = 0.28;
      const xa = Math.min(s * -12, s * 3.9), xb = Math.max(s * -12, s * 3.9);
      // rear bumper (far end when heading +x), chassis rails + rear wheel
      if (s === 1) b += boxL(-12.1, -11.6, -W + 0.3, W - 0.3, 2.4, 3.3, ['#3a4047', '#2b3036', '#22262b']);
      b += boxL(-11.6, 4.6, -2.4, 2.4, 2.6, zd, ['#3a4047', '#2b3036', '#22262b']);
      b += wheel(t.rearWheel, W - 0.4, true);
      b += `<polyline points="${pts([Q(t.rearWheel - 3.0, W - 0.2, zd - 0.05), Q(t.rearWheel + 3.0, W - 0.2, zd - 0.05)])}" stroke="#1f2327" stroke-width=".6" fill="none"/>`;
      // deck
      b += boxW(xa, -W, zd, xb, W, zdt, ['#9aa3ac', '#7f8a95', '#6c7681']);
      // far dropside and the far-x wall
      b += boxW(xa, -W, zdt, xb, -W + th, zw, alu);
      const headX = s === 1 ? xb - th : xa, tailX = s === 1 ? xa : xb - th;
      const farX = xa, nearX = xb - th;
      const wallX = (x, hgt, c) => boxW(x, -W, zdt, x + th, W, hgt, c);
      b += wallX(farX, farX === headX ? zw + 2.4 : zw, farX === headX ? head : alu);
      // cargo
      if (opts.cargo !== 'none' && opts.cargo !== 'ladder') {
        const dx = -4.6, dz = zdt + 2.35, R = 2.35;
        b += discY(dx, -1.9, dz, R, '#8f6237') + discY(dx, -1.75, dz, R, 'url(#car-wood)');
        [-1.4, -0.7, 0, 0.7, 1.4].forEach(y => { b += discY(dx, y, dz, 1.55, y > 1 ? '#3a3f45' : '#2a2e33'); });
        b += discY(dx, 1.4, dz, 1.55, 'none', 'stroke="#596169" stroke-width=".15" stroke-dasharray=".3 .25"');
        b += discY(dx, 1.75, dz, R, '#8f6237') + discY(dx, 1.9, dz, R, 'url(#car-wood)');
        b += discY(dx, 1.92, dz, R * 0.75, 'none', 'stroke="#9a6a3c" stroke-width=".12"') + discY(dx, 1.93, dz, 0.45, '#4a3420');
      }
      // near-x wall and near dropside (outer face carries ribs + stripe)
      b += wallX(nearX, nearX === headX ? zw + 2.4 : zw, nearX === headX ? head : alu);
      b += boxW(xa, W - th, zdt, xb, W, zw, alu);
      const yO = W + 0.02;
      for (let x = xa + 2; x < xb - 0.5; x += 2.2) b += `<polyline points="${pts([W3(x, yO, zdt + 0.1), W3(x, yO, zw - 0.1)])}" stroke="#97a3af" stroke-width=".25" fill="none"/>`;
      const h3 = 0.32;
      ZESA.forEach((c, i) => { b += poly([W3(xa + 0.3, yO, zw - 0.55 - h3 * i), W3(xb - 0.3, yO, zw - 0.55 - h3 * i), W3(xb - 0.3, yO, zw - 0.55 - h3 * (i + 1)), W3(xa + 0.3, yO, zw - 0.55 - h3 * (i + 1))], c); });
      b += sideText(-4.2, yO, zdt + 0.35, 'ZETDC', 'font-size=".95" font-weight="700" font-style="italic" fill="#1f3f99" font-family="Times New Roman,Georgia,serif"');
      // rear bumper + tail lights (visible when the truck heads -x)
      if (s === -1) {
        b += boxL(-12.1, -11.6, -W + 0.3, W - 0.3, 2.4, 3.3, ['#3a4047', '#2b3036', '#22262b']);
        const ex = 12.12;
        [[W - 1.7, W - 0.4], [-W + 0.4, -W + 1.7]].forEach(([y0, y1]) => {
          b += poly([W3(ex, y0, 2.6), W3(ex, y1, 2.6), W3(ex, y1, 3.15), W3(ex, y0, 3.15)], '#d8322b', 'stroke="#7a1612" stroke-width=".2"');
          if (opts.glow) { const c = W3(ex, (y0 + y1) / 2, 2.9); b += `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2.4" fill="url(#car-halo-r)" class="glow"/>`; }
        });
        b += poly([W3(ex, -1.1, 3.3), W3(ex, 1.1, 3.3), W3(ex, 1.1, 4.1), W3(ex, -1.1, 4.1)], '#f6f8fa', 'stroke="#8d99a6" stroke-width=".15"');
      }
      return b;
    }
    function ladder() {
      if (opts.cargo !== 'ladder') return '';
      const zl = 13.4, ya = -1.2, yb = 1.2, x0 = -11.4, x1 = 10.8;
      let l = '';
      const ln = (pp, w, c) => `<polyline points="${pts(pp)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
      [[4.0, 10.3], [10.6, 12.6], [-11.4, 7.9]].forEach(([x, zz]) => { [ya - 0.6, yb + 0.6].forEach(y => { l += ln([Q(x, y, zz), Q(x, y, zl)], 0.35, '#2b3036'); }); l += ln([Q(x, ya - 0.6, zl), Q(x, yb + 0.6, zl)], 0.35, '#2b3036'); });
      l += ln([Q(x0, ya, zl + 0.2), Q(x1, ya, zl + 0.2)], 0.4, '#a9b4bf');
      for (let x = x0 + 0.6; x < x1; x += 1.3) l += ln([Q(x, ya, zl + 0.2), Q(x, yb, zl + 0.2)], 0.22, '#c3ccd5');
      l += ln([Q(x0, yb, zl + 0.2), Q(x1, yb, zl + 0.2)], 0.4, '#d5dde4');
      return l;
    }

    /* ---------- assemble ---------- */
    const zBot = Math.min(...t.body.map(p => p[1]));
    const zBelt = Math.min(...t.cab.map(p => p[1]));
    const front = () => {
      let f = lowerBody(t.body, W, stripeFn) + doors(t.body, W, zBelt) + liveryArt();
      t.wheels.forEach(xw => { f += arch(xw, zBot, t.plastic) + wheel(xw, W - 0.25); });
      f += endPanel(t.body, W);
      return f;
    };
    if (isTruck) {
      const cabPart = () => front() + cabin(t.cab, Wc, t.taper);
      o += s === 1 ? truckBed() + cabPart() : cabPart() + truckBed();
      o += ladder();
    } else {
      o += front();
      if (t.bed) o += pickupBed();
      const rk = t.bed && opts.rack ? rack() : '';
      o += s === 1 ? rk + cabin(t.cab, Wc, t.taper) : cabin(t.cab, Wc, t.taper) + rk;
    }
    return `<g class="car car-${typeName}${liv ? ' car-' + liv : ''}">${o}</g>`;
  }

  /* ---------- animated drive between two ground points ---------- */
  function drive(x0, y0, x1, y1, dur, begin = 0, opts = {}) {
    const dx = x1 - x0;
    const dir = dx < 0 ? -1 : 1;
    const typ = opts.type || (LIVERIES[opts.livery] || {}).type;
    const t = TYPES[typ] || TYPES.sedan;
    const dist = Math.hypot(dx, y1 - y0);
    const o2 = Object.assign({}, opts, { dir });
    if (o2.spin === undefined && dur > 0 && dist > 0) o2.spin = 2 * Math.PI * t.r / (dist / dur);
    const a = P(x0, y0, 0), b = P(x1, y1, 0);
    const beg = typeof begin === 'number' ? begin + 's' : String(begin);
    const rep = opts.repeat != null ? opts.repeat : 'indefinite';
    return `<g>${car(o2)}<animateMotion dur="${dur}s" begin="${beg}" repeatCount="${rep}" path="M${n1(a[0])} ${n1(a[1])} L${n1(b[0])} ${n1(b[1])}"/></g>`;
  }

  // the car alone, wheels spinning to match `speed` (world units / s), for callers that move it themselves
  function sprite(opts, speed) {
    const t = TYPES[opts.type || (LIVERIES[opts.livery] || {}).type] || TYPES.sedan;
    return car(Object.assign({}, opts, speed > 0 ? { spin: 2 * Math.PI * t.r / speed } : {}));
  }

  Assets.cars = { car, drive, sprite, types: Object.keys(TYPES), liveries: Object.keys(LIVERIES) };
})();
