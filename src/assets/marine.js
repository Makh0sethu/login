/* Marine assets for the NOIC scene: oil tanker, offshore rig, textured sea.
   Namespace: Assets.marine   Defs prefix: ship-
   All geometry goes through the global P() lazily, so it works in iso and in the NOIC oblique projection. */
(function () {
  const Assets = window.Assets = window.Assets || {};

  Assets.addDefs(
    `<linearGradient id="ship-sea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a6dcf5"/><stop offset=".55" stop-color="#7cc4ec"/><stop offset="1" stop-color="#4f9fcf"/></linearGradient>` +
    `<pattern id="ship-wavepat" width="22" height="9" patternUnits="userSpaceOnUse"><path d="M1 5 q2.5 -2.2 5 0 t5 0" stroke="#ffffff" stroke-width=".7" fill="none" opacity=".45"/><path d="M12 9.5 q2.5 -2.2 5 0" stroke="#2f7fb8" stroke-width=".6" fill="none" opacity=".25"/><path d="M12 1 q2 -1.6 4 0" stroke="#ffffff" stroke-width=".5" fill="none" opacity=".3"/></pattern>` +
    `<linearGradient id="ship-white" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe7ef"/></linearGradient>` +
    `<linearGradient id="ship-glass" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a4b6b"/><stop offset=".5" stop-color="#3f7aa8"/><stop offset="1" stop-color="#1e3550"/></linearGradient>` +
    `<linearGradient id="ship-deck" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#6a9a7c"/><stop offset="1" stop-color="#4b7a5f"/></linearGradient>` +
    `<radialGradient id="ship-flame" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff6c2"/><stop offset=".35" stop-color="#ffd23f"/><stop offset=".75" stop-color="#ff7a1f"/><stop offset="1" stop-color="#e0401a" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ship-halo"><stop offset="0" stop-color="#ffb347" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ship-smoke"><stop offset="0" stop-color="#9aa6b2" stop-opacity=".85"/><stop offset="1" stop-color="#c9d3dd" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="ship-hullsheen" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".16"/><stop offset=".35" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".12"/></linearGradient>` +
    `<linearGradient id="ship-refl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#14304d" stop-opacity=".38"/><stop offset="1" stop-color="#14304d" stop-opacity="0"/></linearGradient>`
  );

  /* ---------- small utilities ---------- */
  const f1 = n => (+n).toFixed(1);
  const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const dk = (c, t) => mix(c, '#000000', t);
  const lt = (c, t) => mix(c, '#ffffff', t);
  const ptsS = a => a.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
  const pg = (a, fill, extra = '') => `<polygon points="${ptsS(a)}" fill="${fill}" ${extra}/>`;
  const pl = (a, stroke, w, extra = '') => `<polyline points="${ptsS(a)}" stroke="${stroke}" stroke-width="${w}" fill="none" ${extra}/>`;
  // direction toward the viewer for the current projection (null vector of P), normalised to z>0
  function viewDir() {
    const o = P(0, 0, 0), ex = P(1, 0, 0), ey = P(0, 1, 0), ez = P(0, 0, 1);
    const a = [ex[0] - o[0], ex[1] - o[1]], b = [ey[0] - o[0], ey[1] - o[1]], c = [ez[0] - o[0], ez[1] - o[1]];
    const det = (u, v) => u[0] * v[1] - u[1] * v[0];
    let v = [det(b, c), det(c, a), det(a, b)];
    if (v[2] < 0) v = v.map(n => -n);
    return v;
  }
  // a local frame: (lx,ly,lz) -> screen, with origin (ox,oy) and uniform scale
  const frame = (ox, oy, s = 1) => (x, y, z = 0) => P(ox + x * s, oy + y * s, z * s);

  // box in a local frame with a bevel highlight on the top-front edges
  function bx(Q, x, y, z, w, d, h, c, extra = '', hl = true) {
    let s = `<g ${extra}>` +
      pg([Q(x, y + d, z), Q(x + w, y + d, z), Q(x + w, y + d, z + h), Q(x, y + d, z + h)], c[1]) +
      pg([Q(x + w, y, z), Q(x + w, y + d, z), Q(x + w, y + d, z + h), Q(x + w, y, z + h)], c[2]) +
      pg([Q(x, y, z + h), Q(x + w, y, z + h), Q(x + w, y + d, z + h), Q(x, y + d, z + h)], c[0]);
    if (hl) s += pl([Q(x, y + d, z + h), Q(x + w, y + d, z + h), Q(x + w, y, z + h)], '#ffffff', .5, 'opacity=".6"');
    return s + '</g>';
  }
  // vertical cylinder in a local frame (screen radius r*scale)
  function cy(Q, x, y, z, r, h, c, sc = 1) {
    const [cx, cyy] = Q(x, y, z), R = r * sc, H = h * sc;
    return `<ellipse cx="${f1(cx)}" cy="${f1(cyy)}" rx="${f1(R)}" ry="${f1(R * .5)}" fill="${c[2]}"/>` +
      `<rect x="${f1(cx - R)}" y="${f1(cyy - H)}" width="${f1(2 * R)}" height="${f1(H)}" fill="url(#metal-h)"/>` +
      `<rect x="${f1(cx - R)}" y="${f1(cyy - H)}" width="${f1(2 * R)}" height="${f1(H)}" fill="${c[1]}" opacity=".45"/>` +
      `<ellipse cx="${f1(cx)}" cy="${f1(cyy - H)}" rx="${f1(R)}" ry="${f1(R * .5)}" fill="${c[0]}"/>`;
  }
  // lattice member between two local 3D points: two chords + zigzag bracing, one path
  function lattice(Q, a, b, w, col, sw = .6, step = 1.3) {
    const A = Q(...a), B = Q(...b);
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
    const px = -dy / L * w / 2, py = dx / L * w / 2;
    const n = Math.max(2, Math.round(L / (w * step)));
    let d = `M${f1(A[0] + px)} ${f1(A[1] + py)}L${f1(B[0] + px)} ${f1(B[1] + py)}M${f1(A[0] - px)} ${f1(A[1] - py)}L${f1(B[0] - px)} ${f1(B[1] - py)}M${f1(A[0] + px)} ${f1(A[1] + py)}`;
    for (let i = 1; i <= n; i++) { const t = i / n, sg = i % 2 ? -1 : 1; d += `L${f1(A[0] + dx * t + px * sg)} ${f1(A[1] + dy * t + py * sg)}`; }
    return `<path d="${d}" stroke="${col}" stroke-width="${sw}" fill="none" stroke-linejoin="round"/>`;
  }
  // circle in the ground plane (z) as a projected polygon, relative to its own centre
  function ringPts(r, z = 0, n = 18) {
    const o = P(0, 0, z), a = [];
    for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, p = P(Math.cos(t) * r, Math.sin(t) * r, z); a.push([p[0] - o[0], p[1] - o[1]]); }
    return a;
  }
  // expanding SMIL ripple on the water at a screen point
  function ripple(sx, sy, r, dur, delay, sw = .8) {
    return `<g transform="translate(${f1(sx)},${f1(sy)})"><polygon points="${ptsS(ringPts(r))}" fill="none" stroke="#ffffff" stroke-width="${sw}" opacity="0">` +
      `<animateTransform attributeName="transform" type="scale" values=".45;1.35" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="0;.85;0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></polygon></g>`;
  }
  // clip a plan polygon to x >= x0 (one Sutherland-Hodgman pass)
  function clipX(poly2, x0) {
    const out = [];
    for (let i = 0; i < poly2.length; i++) {
      const a = poly2[i], b = poly2[(i + 1) % poly2.length], ia = a[0] >= x0, ib = b[0] >= x0;
      if (ia) out.push(a);
      if (ia !== ib) { const t = (x0 - a[0]) / (b[0] - a[0]); out.push([x0, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }
  // vertical prism sides between two plan outlines (lower at z0, upper at z1); back faces culled
  function prismSides(lo, hi, z0, z1, base, v) {
    const n = lo.length, cxm = hi.reduce((s, p) => s + p[0], 0) / n, cym = hi.reduce((s, p) => s + p[1], 0) / n;
    let s = '';
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, a = hi[i], b = hi[j];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]); const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      const mx = (a[0] + b[0]) / 2 - cxm, my = (a[1] + b[1]) / 2 - cym;
      if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
      if (nx * v[0] + ny * v[1] <= 0.001) continue;
      const col = base[0] === '#' ? dk(base, .06 + .1 * Math.max(0, ny) + .3 * Math.max(0, nx)) : base;
      s += pg([P(lo[i][0], lo[i][1], z0), P(lo[j][0], lo[j][1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)], col);
    }
    return s;
  }
  const lerpPoly = (a, b, t) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);
  // edges of a plan outline that face the viewer, as polylines at height z
  function visibleEdges(o, z, v) {
    const n = o.length, cxm = o.reduce((s, p) => s + p[0], 0) / n, cym = o.reduce((s, p) => s + p[1], 0) / n, runs = [];
    let cur = null;
    for (let i = 0; i < n; i++) {
      const a = o[i], b = o[(i + 1) % n];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]);
      if (nx * ((a[0] + b[0]) / 2 - cxm) + ny * ((a[1] + b[1]) / 2 - cym) < 0) { nx = -nx; ny = -ny; }
      if (nx * v[0] + ny * v[1] > 0.001) { if (!cur) { cur = [P(a[0], a[1], z)]; runs.push(cur); } cur.push(P(b[0], b[1], z)); } else cur = null;
    }
    // join a run that wraps around the start
    if (runs.length > 1 && o.length) {
      const first = runs[0], last = runs[runs.length - 1];
      if (last[last.length - 1][0] === first[0][0] && last[last.length - 1][1] === first[0][1]) { runs[0] = last.concat(first.slice(1)); runs.pop(); }
    }
    return runs;
  }

  /* ---------- TANKER ---------- */
  function tanker(x, y, opts = {}) {
    const len = opts.len || 40, beam = opts.beam || 22, bob = opts.bob !== false;
    const hb = beam / 2, cyM = y + hb, Hd = opts.freeboard || 8, rake = Math.min(4, len * .08);
    const v = viewDir(), W = (a, b, c = 0) => P(a, b, c), Q = frame(0, 0, 1);
    const bowStart = x + len * .66;
    // deck outline in plan, going round the hull
    const deck = [
      [x, y + 2.2], [x + 1.6, y + .3], [x + 3, y], [bowStart, y],
      [x + len * .82, y + hb * .22], [x + len * .94, y + hb * .62], [x + len, cyM],
      [x + len * .94, y + beam - hb * .62], [x + len * .82, y + beam - hb * .22], [bowStart, y + beam],
      [x + 3, y + beam], [x + 1.6, y + beam - .3], [x, y + beam - 2.2]
    ];
    // waterline: bow raked back
    const wl = deck.map(([px, py]) => px > bowStart ? [px - rake * (px - bowStart) / (x + len - bowStart), py + (py - cyM) * -.04] : [px + .4 * (px < x + 2 ? 1 : 0), py]);
    const zB = 2.3; // top of the red boot-top band
    const mid = lerpPoly(wl, deck, zB / Hd);

    let water = '', s = '';
    // --- reflection, shadow and wake (outside the bobbing group)
    water += pg(wl.map(p => W(p[0] + .6, p[1] + .8, 0)), '#0b1e33', 'opacity=".16"');
    {
      const vis = visibleEdges(wl, 0, v);
      vis.forEach(run => {
        const lower = run.map(p => [p[0], p[1] + Hd * .9]).reverse();
        water += pg(run.concat(lower), 'url(#ship-refl)');
      });
      // superstructure reflection (faint white)
      const a = W(x + 2, y + beam, 0), b = W(x + 10, y + beam, 0);
      water += pg([a, b, [b[0], b[1] + 10], [a[0], a[1] + 10]], '#ffffff', 'opacity=".14"');
    }
    // wake: V of foam trailing astern, plus drifting ripples
    {
      const sl = W(x - 1, y + 3, 0), sr = W(x - 1, y + beam - 3, 0), sc = W(x - 1, cyM, 0);
      const wk = opts.wake == null ? 22 : opts.wake, l2 = W(x - wk, y - wk * .18, 0), r2 = W(x - wk, y + beam + wk * .18, 0), c2 = W(x - wk * 1.18, cyM, 0);
      water += `<path d="M${f1(sl[0])} ${f1(sl[1])} Q${f1(sc[0])} ${f1(sc[1])} ${f1(sr[0])} ${f1(sr[1])} L${f1(r2[0])} ${f1(r2[1])} Q${f1(c2[0])} ${f1(c2[1])} ${f1(l2[0])} ${f1(l2[1])}Z" fill="#ffffff" opacity=".22"/>`;
      const dir = W(-10, 0, 0), o = W(0, 0, 0), dv = [dir[0] - o[0], dir[1] - o[1]];
      for (let i = 0; i < 4; i++) {
        const yy = y + 3 + (beam - 6) * (i / 3), p0 = W(x - 3, yy - 2, 0), p1 = W(x - 3, yy + 2, 0), pm = W(x - 5, yy, 0);
        water += `<path d="M${f1(p0[0])} ${f1(p0[1])} Q${f1(pm[0])} ${f1(pm[1])} ${f1(p1[0])} ${f1(p1[1])}" stroke="#ffffff" stroke-width="1" fill="none" stroke-linecap="round" opacity="0">` +
          `<animateTransform attributeName="transform" type="translate" values="0 0;${f1(dv[0] * 1.6)} ${f1(dv[1] * 1.6)}" dur="3.2s" begin="${(i * .8).toFixed(1)}s" repeatCount="indefinite"/>` +
          `<animate attributeName="opacity" values="0;.9;0" dur="3.2s" begin="${(i * .8).toFixed(1)}s" repeatCount="indefinite"/></path>`;
      }
      // bow wave ripples
      const bw = W(x + len - rake + 1, cyM, 0);
      water += ripple(bw[0], bw[1], 4, 2.6, 0) + ripple(bw[0], bw[1], 4, 2.6, 1.3);
    }

    // --- hull: red boot-top band, dark topsides
    s += prismSides(wl, mid, 0, zB, '#d0463b', v);
    s += prismSides(mid, deck, zB, Hd, '#2c3d52', v);
    s += prismSides(mid, deck, zB, Hd, 'url(#ship-hullsheen)', v);
    visibleEdges(deck, Hd, v).forEach(r => s += pl(r, '#e9eef3', .7));          // sheer line
    visibleEdges(mid, zB, v).forEach(r => s += pl(r, '#f4f7fa', .45, 'opacity=".7"')); // boot-top line
    // draft marks at the bow and a painted name band
    { const a = W(x + len * .74, y + beam, 1), b = W(x + len * .74, y + beam, 6);
      s += `<path d="M${f1(a[0])} ${f1(a[1])}V${f1(b[1])}" stroke="#ffffff" stroke-width=".6" stroke-dasharray=".6 .9" opacity=".8"/>`; }
    // deck
    s += pg(deck.map(p => W(p[0], p[1], Hd)), 'url(#ship-deck)');
    s += pg(deck.map(p => W(p[0], p[1], Hd)), 'none', 'stroke="#2f4f3d" stroke-width=".4" stroke-opacity=".5"');
    // forecastle (raised bow deck)
    {
      const fx = x + len * .86, fo = clipX(deck, fx), h = 1.6;
      s += prismSides(fo, fo, Hd, Hd + h, '#2c3d52', v);
      s += pg(fo.map(p => W(p[0], p[1], Hd + h)), '#6f9c80');
      visibleEdges(fo, Hd + h, v).forEach(r => s += pl(r, '#e9eef3', .6));
      const m0 = W(x + len * .93, cyM, Hd + h), m1 = W(x + len * .93, cyM, Hd + h + 7);
      s += `<path d="M${f1(m0[0])} ${f1(m0[1])}V${f1(m1[1])}" stroke="#e9eef3" stroke-width=".8"/><circle cx="${f1(m1[0])}" cy="${f1(m1[1])}" r="1" fill="#ffd36b" class="glow"/>`;
      const wd = W(x + len * .89, cyM - 3, Hd + h);
      s += `<rect x="${f1(wd[0] - 1.6)}" y="${f1(wd[1] - 1.4)}" width="3.2" height="1.6" rx=".5" fill="#56626f"/>`;
    }
    // hatch domes along the deck (tank tops)
    for (let i = 0; i < 4; i++) {
      const hxp = x + 14 + i * (len * .66 - 14) / 3.4, p = W(hxp, cyM + 4.5, Hd);
      s += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="1.4" ry=".8" fill="#3f6a52"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1] - .4)}" rx="1" ry=".55" fill="#9cc4ad"/>`;
    }
    // longitudinal cargo pipes
    const pE = x + len * .84;
    [[cyM - 4.2, '#b6c2cf'], [cyM - 2.8, '#d5dde5'], [cyM + 2.2, '#b6c2cf']].forEach(([py, c]) => {
      s += pl([W(x + 11, py, Hd + .8), W(pE, py, Hd + .8)], '#56626f', 1.3, 'stroke-linecap="round"');
      s += pl([W(x + 11, py, Hd + 1), W(pE, py, Hd + 1)], c, .6);
    });
    // catwalk on the centreline with posts and rail
    {
      const c0 = x + 11, c1 = x + len * .86, zc = Hd + 2.6;
      for (let px = c0; px <= c1; px += 4.5) s += pl([W(px, cyM, Hd), W(px, cyM, zc)], '#8d9bab', .5);
      s += pg([W(c0, cyM - .8, zc), W(c1, cyM - .8, zc), W(c1, cyM + .8, zc), W(c0, cyM + .8, zc)], '#c9d3dd');
      s += pl([W(c0, cyM + .8, zc), W(c1, cyM + .8, zc)], '#8d9bab', .5);
      s += pl([W(c0, cyM + .8, zc + 1.4), W(c1, cyM + .8, zc + 1.4)], '#e9eef3', .4);
    }
    // midship manifold: transverse pipes, valves and a platform
    const mx = x + len * .5;
    s += bx(Q, mx - 2.6, y + 1.2, Hd, 5.2, beam - 2.4, .5, ['#9aa6b2', '#7d8a98', '#6b7886'], '', false);
    [-1.6, 0, 1.6].forEach((o, i) => {
      s += pl([W(mx + o, y + 1, Hd + 1.6), W(mx + o, y + beam - 1, Hd + 1.6)], '#56626f', 1.3, 'stroke-linecap="round"');
      s += pl([W(mx + o, y + 1, Hd + 1.8), W(mx + o, y + beam - 1, Hd + 1.8)], i === 1 ? '#f2c35c' : '#d5dde5', .55);
      const e = W(mx + o, y + beam - 1, Hd + 1.6);
      s += `<circle cx="${f1(e[0])}" cy="${f1(e[1])}" r=".95" fill="#e04a3f" stroke="#8e2a22" stroke-width=".3"/>`;
    });
    // loading derrick (kingpost, boom, topping lift, hose)
    {
      const kb = W(mx - 4, cyM - 5, Hd), kt = W(mx - 4, cyM - 5, Hd + 13), bt = W(mx + 1, y + beam + 1, Hd + 9);
      const bb = W(mx - 4, cyM - 5, Hd + 3), hose = W(mx + 1, y + beam - 1, Hd + 2);
      s += `<path d="M${f1(kb[0])} ${f1(kb[1])}V${f1(kt[1])}" stroke="#d9a53c" stroke-width="1.6"/><path d="M${f1(kb[0] - .4)} ${f1(kb[1])}V${f1(kt[1])}" stroke="#f2c35c" stroke-width=".5"/>`;
      s += `<path d="M${f1(bb[0])} ${f1(bb[1])}L${f1(bt[0])} ${f1(bt[1])}" stroke="#d9a53c" stroke-width="1.1" stroke-linecap="round"/>`;
      s += `<path d="M${f1(kt[0])} ${f1(kt[1])}L${f1(bt[0])} ${f1(bt[1])}" stroke="#56626f" stroke-width=".35"/>`;
      s += `<path d="M${f1(bt[0])} ${f1(bt[1])}Q${f1(bt[0] + 1.5)} ${f1((bt[1] + hose[1]) / 2)} ${f1(hose[0])} ${f1(hose[1])}" stroke="#23272c" stroke-width=".9" fill="none"/>`;
    }
    // aft superstructure
    {
      const sx0 = x + 1.6, sx1 = x + 10, sy0 = y + 3, sy1 = y + beam - 3, z0 = Hd, hS = 12;
      const wh = ['url(#ship-white)', '#dfe7ef', '#c4d0dc'];
      // funnel first (it sits behind the bridge)
      const fx0 = x + 1.4, fy0 = cyM - 2.6;
      s += bx(Q, fx0, fy0, z0 + hS, 4, 5.2, 9, ['#f4f7fa', '#dfe7ef', '#c7d3df'], '', false);
      s += bx(Q, fx0, fy0, z0 + hS + 5, 4, 5.2, 2.4, ['#f06a5f', '#d4493e', '#b83a30'], '', false);
      s += bx(Q, fx0, fy0, z0 + hS + 7.4, 4, 5.2, 1.6, C.black, '', false);
      // smoke
      const ft = W(fx0 + 2, cyM, z0 + hS + 10);
      [0, 1.3, 2.6].forEach((d, i) => s += `<circle cx="${f1(ft[0] - i)}" cy="${f1(ft[1] - 3 - i * 2)}" r="${2.4 + i * .6}" fill="url(#ship-smoke)" class="puff" style="animation-delay:${d}s"/>`);
      // accommodation block
      s += bx(Q, sx0, sy0, z0, sx1 - sx0, sy1 - sy0, hS, wh);
      for (let k = 0; k < 3; k++) {
        const zz = z0 + 2.4 + k * 3.2;
        // forward face (plane x = sx1) and side face (plane y = sy1)
        s += pl([W(sx1, sy0 + 1, zz), W(sx1, sy1 - 1, zz)], '#3f6f96', 1.1, 'stroke-dasharray="1.4 .9"');
        s += pl([W(sx0 + 1, sy1, zz), W(sx1 - 1, sy1, zz)], '#3f6f96', 1.1, 'stroke-dasharray="1.4 .9"');
      }
      // deck lines
      [4, 8].forEach(dz => s += pl([W(sx0, sy1, z0 + dz - .6), W(sx1, sy1, z0 + dz - .6), W(sx1, sy0, z0 + dz - .6)], '#b2bfcc', .35));
      // lifeboat on the side
      s += bx(Q, sx0 + 1.2, sy1, z0 + 4.2, 6, 1.6, 2, ['#ffb15c', '#f08c2a', '#d4741a'], '', false);
      // bridge deck with wings
      const bx0 = x + 5, bz = z0 + hS;
      s += bx(Q, bx0, y + .6, bz, sx1 - bx0 + .6, beam - 1.2, 3.2, wh);
      s += pg([W(sx1 + .6, y + 1.2, bz + 1.2), W(sx1 + .6, y + beam - 1.2, bz + 1.2), W(sx1 + .6, y + beam - 1.2, bz + 2.6), W(sx1 + .6, y + 1.2, bz + 2.6)], 'url(#ship-glass)');
      s += pg([W(bx0 + .8, y + beam - .6, bz + 1.2), W(sx1, y + beam - .6, bz + 1.2), W(sx1, y + beam - .6, bz + 2.6), W(bx0 + .8, y + beam - .6, bz + 2.6)], 'url(#ship-glass)');
      s += pg([W(sx1 + .6, y + 1.2, bz + 1.2), W(sx1 + .6, y + beam * .45, bz + 1.2), W(sx1 + .6, y + beam * .45, bz + 2.6)], '#ffffff', 'opacity=".22"');
      // radar mast
      const m0 = W(bx0 + 2.2, cyM, bz + 3.2), m1 = W(bx0 + 2.2, cyM, bz + 9);
      s += `<path d="M${f1(m0[0])} ${f1(m0[1])}V${f1(m1[1])}" stroke="#56626f" stroke-width=".8"/>` +
        `<path d="M${f1(m1[0] - 2.6)} ${f1(m1[1] + 2)}h5.2" stroke="#3a3f46" stroke-width=".9"/>` +
        `<circle cx="${f1(m1[0])}" cy="${f1(m1[1])}" r=".9" fill="#e04a3f" class="glow"/>`;
      // stern flag staff
      const fs = W(x + .4, cyM, Hd), fe = W(x + .4, cyM, Hd + 6);
      s += `<path d="M${f1(fs[0])} ${f1(fs[1])}V${f1(fe[1])}" stroke="#56626f" stroke-width=".5"/><path d="M${f1(fe[0])} ${f1(fe[1])}l-3.4 .9l3.4 .9Z" fill="#2f7fb8"/>`;
    }
    // foam line hugging the waterline (front side)
    visibleEdges(wl, 0, v).forEach(r => s += pl(r, '#ffffff', 1.3, 'stroke-linecap="round" opacity=".85"') +
      `<polyline points="${ptsS(r.map(p => [p[0], p[1] + 1.2]))}" stroke="#ffffff" stroke-width=".7" fill="none" stroke-dasharray="2 2"><animate attributeName="stroke-dashoffset" values="0;-8" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".4;.9;.4" dur="2.4s" repeatCount="indefinite"/></polyline>`);

    return `<g>${water}${bob ? `<g class="bob">${s}</g>` : s}</g>`;
  }

  /* ---------- OFFSHORE RIG ---------- */
  // footprint: x .. x+34*scale, y .. y+30*scale, height ~70*scale
  function rig(x, y, opts = {}) {
    const sc = opts.scale || 1, Q = frame(x, y, sc), v = viewDir();
    const S = n => f1(n * sc);
    const legs = [[3, 3], [31, 3], [3, 27], [31, 27]];
    const zD = 20, hD = 7, zT = zD + hD; // deck hull bottom / top
    const legTop = 58, yel = '#e8b23a', yelD = '#b8862a';
    const depth = (lx, ly) => lx * v[0] + ly * v[1];
    let water = '', s = '';

    // water: shadow, reflections, ripples
    water += pg([Q(-1, 1, 0), Q(36, 1, 0), Q(36, 32, 0), Q(-1, 32, 0)], '#0b1e33', 'opacity=".1"');
    legs.forEach(([lx, ly], i) => {
      const p = Q(lx, ly, 0);
      water += `<path d="M${f1(p[0])} ${f1(p[1])}v${S(12)}" stroke="${yelD}" stroke-width="${S(3)}" opacity=".2"/>`;
      const rr = ringPts(5 * sc);
      [0].forEach(dl => water += `<g transform="translate(${f1(p[0])},${f1(p[1])})"><polygon points="${ptsS(rr)}" fill="none" stroke="#ffffff" stroke-width=".8" opacity="0">` +
        `<animateTransform attributeName="transform" type="scale" values=".4;1.3" dur="2.8s" begin="${(dl + i * .35).toFixed(2)}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="0;.85;0" dur="2.8s" begin="${(dl + i * .35).toFixed(2)}s" repeatCount="indefinite"/></polygon></g>`);
      water += `<g transform="translate(${f1(p[0])},${f1(p[1])})"><polygon points="${ptsS(ringPts(2.4 * sc))}" fill="#ffffff" opacity=".55"/></g>`;
    });

    const leg = (lx, ly, z0, z1) => {
      const a = Q(lx, ly, z0), b = Q(lx, ly, z1), w = 3.2 * sc;
      return `<rect x="${f1(a[0] - w / 2)}" y="${f1(b[1])}" width="${f1(w)}" height="${f1(a[1] - b[1])}" fill="${yel}" opacity=".18"/>` +
        lattice(Q, [lx, ly, z0], [lx, ly, z1], w, yelD, .6 * sc, 1.1);
    };
    // lower legs (water to deck)
    legs.slice().sort((p, q) => depth(...p) - depth(...q)).forEach(([lx, ly]) => s += leg(lx, ly, 0, zD));
    // deck hull with yellow edge stripe and rubbing strakes
    s += bx(Q, 0, 0, zD, 34, 30, hD, ['#e4e9ee', '#b9c3cc', '#9aa6b2']);
    s += pg([Q(0, 30, zT - 1.6), Q(34, 30, zT - 1.6), Q(34, 30, zT - .8), Q(0, 30, zT - .8)], yel);
    s += pg([Q(34, 0, zT - 1.6), Q(34, 30, zT - 1.6), Q(34, 30, zT - .8), Q(34, 0, zT - .8)], yelD);
    s += pl([Q(0, 30, zD + 2.4), Q(34, 30, zD + 2.4), Q(34, 0, zD + 2.4)], '#8d9bab', S(.5));
    s += pg([Q(.6, .6, zT), Q(33.4, .6, zT), Q(33.4, 29.4, zT), Q(.6, 29.4, zT)], '#cfd8e0');

    // above-deck items, painter-sorted by depth
    const items = [];
    legs.forEach(([lx, ly]) => items.push([depth(lx, ly), bx(Q, lx - 3, ly - 3, zT, 6, 6, 5, ['#f2c35c', '#d9a53c', '#bf8f2c']) + leg(lx, ly, zT + 5, legTop) +
      (() => { const t = Q(lx, ly, legTop); return `<circle cx="${f1(t[0])}" cy="${f1(t[1])}" r="${S(1)}" fill="#e04a3f" class="glow"/>`; })()]));
    // drilling derrick on a substructure
    {
      const cxD = 18, cyD = 8, b0 = 4.5, b1 = 1.2, z0 = zT + 6, z1 = 70;
      let d = bx(Q, cxD - 6, cyD - 5.5, zT, 12, 11, 6, ['#dfe5ea', '#b9c3cc', '#9aa6b2']);
      d += pg([Q(cxD - 6, cyD + 5.5, zT + 2), Q(cxD + 6, cyD + 5.5, zT + 2), Q(cxD + 6, cyD + 5.5, zT + 3), Q(cxD - 6, cyD + 5.5, zT + 3)], '#e04a3f');
      const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      const at = (k, z, r) => Q(cxD + c[k][0] * r, cyD + c[k][1] * r, z);
      let path = '';
      c.forEach((_, k) => { const a = at(k, z0, b0), b = at(k, z1, b1); path += `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`; });
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const z = z0 + (z1 - z0) * i / n, r = b0 + (b1 - b0) * i / n;
        path += 'M' + [0, 1, 2, 3, 0].map(k => { const p = at(k, z, r); return f1(p[0]) + ' ' + f1(p[1]); }).join('L');
        if (i < n) {
          const z2 = z0 + (z1 - z0) * (i + 1) / n, r2 = b0 + (b1 - b0) * (i + 1) / n;
          // X bracing on the two faces toward the viewer (+y face: corners 3-2, +x face: corners 1-2)
          [[3, 2], [1, 2]].forEach(([p, q]) => {
            const A = at(p, z, r), B = at(q, z2, r2), C2 = at(q, z, r), D = at(p, z2, r2);
            path += `M${f1(A[0])} ${f1(A[1])}L${f1(B[0])} ${f1(B[1])}M${f1(C2[0])} ${f1(C2[1])}L${f1(D[0])} ${f1(D[1])}`;
          });
        }
      }
      d += `<path d="${path}" stroke="#c0392b" stroke-width="${S(.55)}" fill="none" stroke-linejoin="round"/>`;
      d += bx(Q, cxD - 1.6, cyD - 1.6, z1, 3.2, 3.2, 2, ['#f4f7fa', '#dfe7ef', '#c7d3df'], '', false);
      const top = Q(cxD, cyD, z1 + 2);
      d += `<path d="M${f1(top[0])} ${f1(top[1])}v${S(-4)}" stroke="#56626f" stroke-width="${S(.5)}"/><circle cx="${f1(top[0])}" cy="${f1(top[1] - 4 * sc)}" r="${S(1.1)}" fill="#e04a3f" class="glow"/>`;
      // drill line inside the tower
      const dl0 = Q(cxD, cyD, z0), dl1 = Q(cxD, cyD, z1 - 2);
      d += `<path d="M${f1(dl0[0])} ${f1(dl0[1])}V${f1(dl1[1])}" stroke="#3a3f46" stroke-width="${S(.4)}"/>`;
      // pipe rack beside it
      d += bx(Q, cxD + 6.5, cyD - 4, zT, 3, 8, 1.4, ['#9aa6b2', '#7d8a98', '#6b7886'], '', false);
      items.push([depth(cxD, cyD), d]);
    }
    // process modules and storage tanks (back-right)
    items.push([depth(27, 13), bx(Q, 23.5, 10, zT, 7, 5.5, 5, ['#e9eef3', '#c9d3dd', '#b2bfcc']) +
      pl([Q(23.5, 15.5, zT + 2.5), Q(30.5, 15.5, zT + 2.5)], '#4aa3df', S(.9)) +
      cy(Q, 27.5, 7, zT, 1.8, 6, ['#f4f7fa', '#c9d3dd', '#9aa6b2'], sc) + cy(Q, 31, 8.5, zT, 1.4, 5, ['#f4f7fa', '#c9d3dd', '#9aa6b2'], sc)]);
    // accommodation block with helipad on top
    {
      const ax0 = 7, ay0 = 16, aw = 12, ad = 12, ah = 12;
      let a = bx(Q, ax0, ay0, zT, aw, ad, ah, ['url(#ship-white)', '#dfe7ef', '#c4d0dc']);
      for (let k = 0; k < 3; k++) {
        const zz = zT + 2.6 + k * 3.4;
        a += pl([Q(ax0 + 1, ay0 + ad, zz), Q(ax0 + aw - 1, ay0 + ad, zz)], '#3f6f96', S(1.1), `stroke-dasharray="${S(1.4)} ${S(.9)}"`);
        a += pl([Q(ax0 + aw, ay0 + 1, zz), Q(ax0 + aw, ay0 + ad - 1, zz)], '#3f6f96', S(1.1), `stroke-dasharray="${S(1.4)} ${S(.9)}"`);
      }
      // lifeboats (orange capsules) on the side
      [1, 6].forEach(o => a += bx(Q, ax0 + o, ay0 + ad, zT + 1, 4.2, 1.6, 1.8, ['#ffb15c', '#f08c2a', '#d4741a'], '', false));
      // helideck: octagon on short legs
      const hcx = ax0 + aw / 2, hcy = ay0 + ad / 2, hz = zT + ah + 2.2, R = 8;
      const oct = [], octLo = [];
      for (let i = 0; i < 8; i++) { const t = (i + .5) / 8 * Math.PI * 2; oct.push([hcx + Math.cos(t) * R, hcy + Math.sin(t) * R]); }
      [[-3.5, -3.5], [3.5, -3.5], [3.5, 3.5], [-3.5, 3.5]].forEach(([ox, oy]) => a += pl([Q(hcx + ox, hcy + oy, zT + ah), Q(hcx + ox, hcy + oy, hz)], '#8d9bab', S(.7)));
      a += prismSides(oct.map(p => [p[0] * sc + x, p[1] * sc + y]), oct.map(p => [p[0] * sc + x, p[1] * sc + y]), (hz - .9) * sc, hz * sc, '#9aa6b2', v);
      a += pg(oct.map(p => Q(p[0], p[1], hz)), '#3e4a56');
      const inner = oct.map(([px, py]) => Q(hcx + (px - hcx) * .62, hcy + (py - hcy) * .62, hz));
      a += pg(inner, 'none', `stroke="#f2c35c" stroke-width="${S(.7)}"`);
      a += pg(oct.map(p => Q(p[0], p[1], hz)), 'none', `stroke="#ffffff" stroke-width="${S(.45)}" stroke-dasharray="${S(1.2)} ${S(1)}"`);
      // the "H" laid flat on the deck
      const H = (u, w) => Q(hcx + u, hcy + w, hz);
      a += `<path d="M${H(-1.8, -2.2).map(f1).join(' ')}L${H(-1.8, 2.2).map(f1).join(' ')}M${H(1.8, -2.2).map(f1).join(' ')}L${H(1.8, 2.2).map(f1).join(' ')}M${H(-1.8, 0).map(f1).join(' ')}L${H(1.8, 0).map(f1).join(' ')}" stroke="#ffffff" stroke-width="${S(.9)}"/>`;
      items.push([depth(hcx, hcy), a]);
    }
    // pedestal crane with lattice boom (front-right)
    {
      const px = 23, py = 26;
      let c = cy(Q, px, py, zT, 2, 8, ['#f2c35c', '#d9a53c', '#bf8f2c'], sc);
      c += bx(Q, px - 2.2, py - 2.2, zT + 8, 4.4, 4.4, 3, ['#f2c35c', '#d9a53c', '#bf8f2c']);
      const root = [px + 1.5, py, zT + 10], tip = [px + 20, py - 3, zT + 18];
      c += lattice(Q, root, tip, 1.8 * sc, '#bf8f2c', .5 * sc, 1.2);
      const t = Q(...tip), k = Q(px, py, zT + 14), hk = Q(tip[0], tip[1], zT + 12);
      c += `<path d="M${f1(k[0])} ${f1(k[1])}L${f1(t[0])} ${f1(t[1])}" stroke="#56626f" stroke-width="${S(.35)}"/>`;
      c += `<path d="M${f1(t[0])} ${f1(t[1])}V${f1(hk[1])}" stroke="#3a3f46" stroke-width="${S(.35)}"/><rect x="${f1(hk[0] - .9 * sc)}" y="${f1(hk[1])}" width="${S(1.8)}" height="${S(1.6)}" fill="#e04a3f"/>`;
      items.push([depth(px, py), c]);
    }
    items.sort((a, b) => a[0] - b[0]).forEach(it => s += it[1]);

    // flare boom off the back-right corner with an animated flame
    {
      const root = [33, 4, zT + 2], tip = [46, -4, zT + 18];
      let f = lattice(Q, root, tip, 2 * sc, '#8d9bab', .55 * sc, 1.2);
      const t = Q(...tip);
      f += `<circle cx="${f1(t[0])}" cy="${f1(t[1] - 4 * sc)}" r="${S(9)}" fill="url(#ship-halo)" class="glow"/>`;
      f += `<g transform="translate(${f1(t[0])},${f1(t[1])}) scale(${sc})"><g class="flick">` +
        `<path d="M0 0 C-4 -3 -3 -8 0 -13 C1 -9 4 -8 3 -4 C5 -6 5 -9 4 -11 C7 -7 6 -2 0 0Z" fill="url(#ship-flame)"/>` +
        `<path d="M0 -.5 C-1.6 -2 -1.2 -5 0 -7 C.8 -5 2 -3.4 0 -.5Z" fill="#fff6c2"/></g></g>`;
      f += `<circle cx="${f1(t[0])}" cy="${f1(t[1])}" r="${S(.9)}" fill="#56626f"/>`;
      // a wisp of smoke above the flare
      f += `<circle cx="${f1(t[0] + 2 * sc)}" cy="${f1(t[1] - 15 * sc)}" r="${S(3)}" fill="url(#ship-smoke)" class="puff"/>`;
      s += f;
    }
    return `<g>${water}${s}</g>`;
  }

  /* ---------- SEA ---------- */
  // opts.shore: which edge meets land and gets a foam line: 'x1' (default), 'x0', 'y0', 'y1' or 'none'
  function sea(x0, y0, x1, y1, opts = {}) {
    const z = .2, shore = opts.shore || 'x1';
    const quad = [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)];
    let s = pg(quad, 'url(#ship-sea)', opts.grain === false ? '' : 'filter="url(#tx-grain)"');
    s += pg(quad, 'url(#ship-wavepat)');
    // gentle depth band near the far edge
    s += pg([P(x0, y0, z), P(x1, y0, z), P(x1, y0 + (y1 - y0) * .18, z), P(x0, y0 + (y1 - y0) * .18, z)], '#ffffff', 'opacity=".12"');
    // drifting highlights
    const w = x1 - x0, d = y1 - y0, n = Math.max(4, Math.min(12, Math.round(w * d / 450)));
    for (let i = 0; i < n; i++) {
      const fx = ((i * 0.618034) % 1) * .8 + .1, fy = ((i * 0.381966 + .13) % 1) * .84 + .08;
      const p = P(x0 + w * fx, y0 + d * fy, z), L = 4 + (i % 3) * 2, dur = 5 + (i % 4) * 1.3, dl = (i * .9) % 4;
      s += `<path d="M${f1(p[0] - L / 2)} ${f1(p[1])} q${f1(L / 4)} -1.6 ${f1(L / 2)} 0 t${f1(L / 2)} 0" stroke="#ffffff" stroke-width="${i % 2 ? .9 : 1.2}" fill="none" stroke-linecap="round" opacity=".7">` +
        `<animateTransform attributeName="transform" type="translate" values="0 0;3 -.8;0 0" dur="${dur.toFixed(1)}s" begin="-${dl.toFixed(1)}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values=".15;.85;.15" dur="${(dur * .8).toFixed(1)}s" begin="-${dl.toFixed(1)}s" repeatCount="indefinite"/></path>`;
    }
    // shore foam
    const edge = { x1: [[x1, y0], [x1, y1]], x0: [[x0, y0], [x0, y1]], y0: [[x0, y0], [x1, y0]], y1: [[x0, y1], [x1, y1]] }[shore];
    if (edge) {
      const a = P(edge[0][0], edge[0][1], z), b = P(edge[1][0], edge[1][1], z);
      const off = shore === 'x1' ? -2.5 : shore === 'x0' ? 2.5 : 0, offy = shore === 'y1' ? -2 : shore === 'y0' ? 2 : 0;
      s += pl([a, b], '#ffffff', 2, 'stroke-linecap="round" opacity=".75"');
      s += `<polyline points="${ptsS([[a[0] + off, a[1] + offy], [b[0] + off, b[1] + offy]])}" stroke="#ffffff" stroke-width="1" fill="none" stroke-dasharray="3 4" stroke-linecap="round"><animate attributeName="stroke-dashoffset" values="0;-14" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values=".3;.8;.3" dur="3.6s" repeatCount="indefinite"/></polyline>`;
    }
    return `<g>${s}</g>`;
  }

  Assets.marine = { tanker, rig, sea };
})();
