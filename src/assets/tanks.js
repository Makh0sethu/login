/* NOIC fuel storage tanks (white fixed-roof tanks with logo, spiral stair, roof handrail) and tank farms
   with a concrete bund wall and an interconnecting manifold.
   Namespace: Assets.tanks   Defs prefix: tnk-
   Everything is built from the global P() lazily, so it works in the iso and the NOIC oblique projection. */
(function () {
  const Assets = window.Assets = window.Assets || {};
  const PI = Math.PI;
  const f = n => (+n).toFixed(1);
  const f3 = n => (+n).toFixed(3);
  const sp = a => a.map(p => f(p[0]) + ',' + f(p[1])).join(' ');
  const pg = (a, fill, extra = '') => `<polygon points="${sp(a)}" fill="${fill}" ${extra}/>`;
  const pl = (a, stroke, w, extra = '') => `<polyline points="${sp(a)}" fill="none" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
  const seg = (a, b) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  const FONT = 'font-family="Segoe UI,Arial,sans-serif"';
  const BLUE = '#2d5f94', GOLD = '#e6a530', RED = '#d3362d';

  /* ---------- defs ---------- */
  const lin = (id, stops, v = false) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}">` +
    stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('') + '</linearGradient>';
  Assets.addDefs(
    lin('tnk-body-white', [[0, '#b3c0cd'], [.07, '#d8e0e8'], [.3, '#ffffff'], [.5, '#f2f5f8'], [.78, '#d2dbe4'], [1, '#a4b2c0']]) +
    lin('tnk-body-grey', [[0, '#95a2b0'], [.08, '#bcc7d2'], [.3, '#e8edf2'], [.52, '#d0d8e0'], [.8, '#aab6c2'], [1, '#85929f']]) +
    lin('tnk-band', [[0, '#121518'], [.3, '#4c545d'], [.5, '#363d45'], [1, '#101316']]) +
    lin('tnk-roof', [[0, '#ffffff'], [1, '#d5dde5']], true) +
    lin('tnk-wall', [[0, '#d9d5cc'], [1, '#bdb8ad']], true) +
    `<pattern id="tnk-gravel" patternUnits="userSpaceOnUse" width="4" height="3">` +
    `<circle cx=".8" cy=".7" r=".35" fill="#8f8a80" opacity=".45"/><circle cx="2.9" cy="2.1" r=".3" fill="#ffffff" opacity=".5"/>` +
    `<circle cx="2.2" cy=".4" r=".22" fill="#6f6a62" opacity=".4"/></pattern>`
  );

  const PAL = {
    white: { body: 'url(#tnk-body-white)', roof: ['#dde4eb', '#e9eef3', '#f7f9fb'] },
    grey: { body: 'url(#tnk-body-grey)', roof: ['#c9d2db', '#d7dee5', '#e4e9ee'] }
  };
  PAL.silver = PAL.grey;

  /* ---------- projection-agnostic cylinder geometry ----------
     alpha = angle around the tank measured from the face pointing at the viewer
     (-PI/2 = left silhouette, 0 = front centre, +PI/2 = right silhouette). */
  function geo(x, y, r) {
    const o = P(0, 0, 0), a = P(1, 0, 0), b = P(0, 1, 0);
    const ex = [a[0] - o[0], a[1] - o[1]], ey = [b[0] - o[0], b[1] - o[1]];
    const tR = Math.atan2(ey[0], ex[0]), tm = tR + PI / 2;
    const sg = (Math.cos(tm) * ex[1] + Math.sin(tm) * ey[1]) > 0 ? 1 : -1;
    const th = al => tR + sg * (PI / 2 - al);
    const at = (al, z, rr = r) => { const t = th(al); return P(x + rr * Math.cos(t), y + rr * Math.sin(t), z); };
    const arc = (a0, a1, z, rr = r, n = 24) => { const out = []; for (let i = 0; i <= n; i++) out.push(at(a0 + (a1 - a0) * i / n, z, rr)); return out; };
    const full = (z, rr = r, n = 36) => { const out = []; for (let i = 0; i < n; i++) { const t = i / n * 2 * PI; out.push(P(x + rr * Math.cos(t), y + rr * Math.sin(t), z)); } return out; };
    // affine frame that lays flat content (local x = arc length, local y = down) onto the curved face
    const frame = (s0, z) => {
      const al = s0 / r, e = 0.004, p = at(al, z), q = at(al + e, z);
      return `matrix(${f3((q[0] - p[0]) / (e * r))} ${f3((q[1] - p[1]) / (e * r))} 0 1 ${f(p[0])} ${f(p[1])})`;
    };
    return { at, arc, full, frame };
  }

  /* ---------- the vector NOIC logo (flat coords, baseline at 0) ---------- */
  function logo(g, r, h, zb) {
    const L = [['N', .74], ['O', .8], ['I', .32], ['C', .66]], gap = .06;
    const em = L.reduce((t, l) => t + l[1], 0) + gap * (L.length - 1);
    const fs = Math.min(1.45 * r / em, h * .27), W = em * fs;
    let s = '', cx = -W / 2;
    L.forEach(([ch, w]) => {
      const c = cx + w * fs / 2, m = g.frame(c, zb);
      if (ch === 'O') {
        const ri = .19 * fs;
        s += `<g transform="${m}"><circle cy="${f3(-.36 * fs)}" r="${f3(.29 * fs)}" fill="none" stroke="${BLUE}" stroke-width="${f3(.14 * fs)}"/>` +
          `<path transform="translate(0 ${f3(-.36 * fs)}) rotate(-35)" d="M0 ${f3(-ri)}A${f3(ri)} ${f3(ri)} 0 0 1 0 ${f3(ri)}A${f3(ri / 2)} ${f3(ri / 2)} 0 0 1 0 0A${f3(ri / 2)} ${f3(ri / 2)} 0 0 0 0 ${f3(-ri)}Z" fill="${GOLD}"/></g>`;
      } else {
        s += `<text transform="${m}" font-size="${f3(fs)}" font-weight="800" text-anchor="middle" textLength="${f3(w * fs * .92)}" lengthAdjust="spacingAndGlyphs" fill="${BLUE}" ${FONT}>${ch}</text>`;
      }
      cx += (w + gap) * fs;
    });
    s += `<text transform="${g.frame(0, zb - fs * .42)}" font-size="${f3(fs * .27)}" font-weight="600" text-anchor="middle" textLength="${f3(W * .62)}" lengthAdjust="spacingAndGlyphs" fill="${GOLD}" ${FONT}>Driving Progress</text>`;
    return { s, fs };
  }

  /* ---------- one tank ---------- */
  function tank(x, y, opts) {
    const o = Object.assign({ r: 11, h: 22, num: '', product: 'PETROL', logo: true, stairs: true, color: 'white', valves: true }, opts || {});
    const r = o.r, h = o.h, g = geo(x, y, r), pal = PAL[o.color] || PAL.white;
    const H = PI / 2, band = Math.max(1.4, h * .075);
    let s = '';
    // ambient occlusion
    s += pg(g.full(0, r * 1.5, 24), 'url(#ao-soft)');
    s += pg(g.full(0, r + .7, 24), '#0b1e33', 'opacity=".16"');
    // shell, base band, plate seams
    s += pg(g.arc(-H, H, 0).concat(g.arc(H, -H, h)), pal.body, 'stroke="#0b1e33" stroke-opacity=".2" stroke-width=".4"');
    s += pg(g.arc(-H, H, 0).concat(g.arc(H, -H, band)), 'url(#tnk-band)');
    s += pl(g.arc(-H, H, band, r, 18), '#ffffff', .3, 'opacity=".25"');
    let seams = '';
    [-1.2, -.8, -.4, 0, .4, .8, 1.2].forEach(a => seams += seg(g.at(a, band), g.at(a, h)));
    [.3, .55, .8].forEach(k => seams += 'M' + g.arc(-H, H, h * k, r, 16).map(p => f(p[0]) + ' ' + f(p[1])).join(' L'));
    s += `<path d="${seams}" fill="none" stroke="#40546a" stroke-opacity=".13" stroke-width=".25"/>`;
    // foam / level riser on the left
    const rs0 = g.at(-1.38, 0, r + .8), rs1 = g.at(-1.38, h + 1, r + .8);
    s += `<path d="${seg(rs0, rs1)}" stroke="#8695a4" stroke-width=".9"/><path d="${seg(rs0, rs1)}" stroke="#f5f8fa" stroke-width=".45"/>`;
    // logo + tank number / product
    if (o.logo) s += logo(g, r, h, h * .64).s;
    const ls = Math.min(r * .26, h * .14), lx = -.92 * r;
    if (o.num !== '' && o.num != null) s += `<text transform="${g.frame(lx, h * .42)}" font-size="${f3(ls)}" font-weight="800" text-anchor="middle" fill="${RED}" ${FONT}>${o.num}</text>`;
    if (o.product) s += `<text transform="${g.frame(lx, h * .42 - ls * .95)}" font-size="${f3(ls * .62)}" font-weight="800" text-anchor="middle" textLength="${f3(Math.min(ls * .62 * .7 * o.product.length, r * .7))}" lengthAdjust="spacingAndGlyphs" fill="${RED}" ${FONT}>${o.product}</text>`;
    // domed fixed roof
    const d = r * .13;
    s += pg(g.full(h), pal.roof[0], 'stroke="#8e9cab" stroke-width=".35"');
    s += pg(g.full(h + d * .5, r * .7, 28), pal.roof[1]);
    s += pg(g.full(h + d * .85, r * .38, 20), pal.roof[2]);
    const ap = P(x, y, h + d);
    s += `<rect x="${f(ap[0] - .7)}" y="${f(ap[1] - 1.3)}" width="1.4" height="1.3" fill="#9aa7b4"/>`;
    // roof perimeter handrail
    const rr = r - .35, rh = 2.4;
    let posts = '';
    for (let i = 0; i < 20; i++) { const t = i / 20 * 2 * PI, a = P(x + rr * Math.cos(t), y + rr * Math.sin(t), h); posts += `M${f(a[0])} ${f(a[1])}v${-rh}`; }
    s += `<path d="${posts}" stroke="#4a5561" stroke-width=".3"/>`;
    s += pg(g.full(h + rh / 2, rr), 'none', 'stroke="#4a5561" stroke-opacity=".5" stroke-width=".22"');
    s += pg(g.full(h + rh, rr), 'none', 'stroke="#323b45" stroke-width=".38"');
    // spiral stair across the visible face
    if (o.stairs) {
      const a0 = -.35, a1 = 1.42, z0 = .4, ri = r + .25, ro = r + 2.1, m = 22;
      const al = t => a0 + (a1 - a0) * t, zz = t => z0 + (h - z0) * t;
      const inner = [], outer = [], rail = [], shade = [];
      for (let i = 0; i <= m; i++) {
        const t = i / m;
        inner.push(g.at(al(t), zz(t), ri)); outer.push(g.at(al(t), zz(t), ro)); rail.push(g.at(al(t), zz(t) + 3, ro));
        if (zz(t) > 1.6) shade.push(g.at(al(t), zz(t) - 1.4, r));
      }
      if (shade.length > 1) s += pl(shade, '#0b1e33', 1.3, 'stroke-opacity=".13"');
      s += pg(inner.concat(outer.slice().reverse()), '#3a434d', 'opacity=".8"');
      // top landing
      s += pg([g.at(a1, h, ri), g.at(a1 + .16, h, ri), g.at(a1 + .16, h, ro), g.at(a1, h, ro)], '#4a5561');
      const n = Math.max(8, Math.round(h / 1.25));
      let tr = '', ps = '';
      for (let i = 0; i <= n; i++) {
        const t = i / n; tr += seg(g.at(al(t), zz(t), ri), g.at(al(t), zz(t), ro));
        if (i % 2 === 0) { const p = g.at(al(t), zz(t), ro); ps += `M${f(p[0])} ${f(p[1])}v-3`; }
      }
      s += `<path d="${tr}" stroke="#c4ccd4" stroke-width=".3"/>`;
      s += pl(inner, '#262c33', .35) + pl(outer, '#262c33', .5);
      s += `<path d="${ps}" stroke="#2b323a" stroke-width=".28"/>` + pl(rail, '#2b323a', .38);
    }
    // red valves / pipe stubs at the base
    if (o.valves) {
      [-.8, .12].forEach(a => {
        const p0 = g.at(a, 1.6, r), p1 = g.at(a, 1.6, r + 3.2), e = g.at(a, 1.6, r + 2.1);
        s += `<path d="${seg(p0, p1)}" stroke="#b52d25" stroke-width="1.3"/>` +
          `<path d="M${f(e[0])} ${f(e[1])}v-2.2" stroke="#e04a3f" stroke-width=".5"/>` +
          `<ellipse cx="${f(e[0])}" cy="${f(e[1] - 2.4)}" rx=".95" ry=".45" fill="none" stroke="#e04a3f" stroke-width=".45"/>`;
      });
    }
    return `<g>${s}</g>`;
  }

  /* ---------- a tank farm with bund wall and manifold ---------- */
  function farm(list, opts) {
    const o = Object.assign({ bund: true, pad: 5, wallH: 3, pipes: true, extend: 4, tank: {} }, opts || {});
    const items = list.map(a => ({ x: a[0], y: a[1], r: a[2] || 11, h: a[3] || 22, num: a[4] != null ? a[4] : '', product: a[5] || 'PETROL', extra: a[6] || {} }))
      .sort((a, b) => (a.y - b.y) || (a.x - b.x));
    if (!items.length) return '';
    const pad = o.pad, t = 1.6, wh = o.wallH;
    const x0 = Math.min(...items.map(i => i.x - i.r)) - pad, x1 = Math.max(...items.map(i => i.x + i.r)) + pad;
    const y0 = Math.min(...items.map(i => i.y - i.r)) - pad, y1 = Math.max(...items.map(i => i.y + i.r)) + pad;
    const CON = ['#e6e3dc', '#cbc7be', '#b4b0a7'];
    const yh = y1 - pad * .55, zh = 1.3;
    const pipe = (a, b) => pl([a, b], '#6f7b87', 1.5, 'stroke-linecap="round"') + pl([a, b], '#e3e8ed', .55, 'stroke-linecap="round"');
    const valve = (x, y) => { const e = P(x, y, zh); return `<path d="M${f(e[0])} ${f(e[1])}v-2" stroke="#e04a3f" stroke-width=".5"/><ellipse cx="${f(e[0])}" cy="${f(e[1] - 2.2)}" rx=".95" ry=".45" fill="none" stroke="#e04a3f" stroke-width=".45"/>`; };
    let s = '';
    if (o.bund) {
      const fl = [P(x0, y0, .2), P(x1, y0, .2), P(x1, y1, .2), P(x0, y1, .2)];
      s += pg(fl, '#d4d6d6') + pg(fl, 'url(#tnk-gravel)');
      s += box(x0, y0, 0, x1 - x0, t, wh, CON) + box(x0, y0, 0, t, y1 - y0, wh, CON);
    }
    items.forEach(i => {
      s += tank(i.x, i.y, Object.assign({ r: i.r, h: i.h, num: i.num, product: i.product }, o.tank, i.extra));
      if (o.pipes && i.y + i.r < yh - .5) s += pipe(P(i.x, i.y + i.r, zh), P(i.x, yh, zh));
    });
    if (o.pipes) {
      const xa = x0 + (o.bund ? t : 0) - o.extend, xb = x1 - (o.bund ? t : 0) + o.extend;
      s += pipe(P(xa, yh, zh), P(xb, yh, zh));
      items.forEach(i => s += valve(i.x, yh));
    }
    if (o.bund) {
      s += box(x1 - t, y0, 0, t, y1 - y0, wh, CON) + box(x0, y1 - t, 0, x1 - x0, t, wh, CON);
      s += pl([P(x0, y1, wh), P(x1, y1, wh), P(x1, y0, wh)], '#ffffff', .4, 'opacity=".7"');
    }
    return `<g>${s}</g>`;
  }

  Assets.tanks = { tank, farm };
})();
