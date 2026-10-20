/* City buildings for the Powertel scene. Namespace: Assets.buildings. Defs prefix: bld-.
   building(x, y, w, d, h, opts) -> SVG string. Stands at (x,y,0), footprint w (x) by d (y), height h.
   opts: { style: 'glass'|'office'|'apartment'|'stepped'|'retail'|'brick', delay = 0, seed = 0, lit = style default }
   block(list, opts) -> all buildings sorted back-to-front. list: [[x,y,w,d,h,style?], ...]
   Uses the global P lazily, so it follows NOIC's oblique projection too. */
(function () {
  const A = window.Assets = window.Assets || {};

  A.addDefs(
    `<linearGradient id="bld-glassL" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#c4e6fa"/><stop offset=".45" stop-color="#7ab7e0"/><stop offset="1" stop-color="#3b78ab"/></linearGradient>` +
    `<linearGradient id="bld-glassR" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#8fc4e8"/><stop offset=".5" stop-color="#4b8bbf"/><stop offset="1" stop-color="#28598a"/></linearGradient>` +
    `<linearGradient id="bld-refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="bld-win" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#7d9cbc"/><stop offset=".5" stop-color="#4a6788"/><stop offset="1" stop-color="#2c4260"/></linearGradient>` +
    `<linearGradient id="bld-ribbon" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#9cc3e2"/><stop offset=".35" stop-color="#5f86ab"/><stop offset="1" stop-color="#344c69"/></linearGradient>` +
    `<linearGradient id="bld-lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c2"/><stop offset=".6" stop-color="#ffd36b"/><stop offset="1" stop-color="#f6b443"/></linearGradient>` +
    `<linearGradient id="bld-shop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8"/><stop offset=".7" stop-color="#ffe0a0"/><stop offset="1" stop-color="#f2bf6a"/></linearGradient>` +
    `<linearGradient id="bld-wood" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6e4a2e"/><stop offset=".3" stop-color="#b98a5e"/><stop offset=".6" stop-color="#946a44"/><stop offset="1" stop-color="#5c3d25"/></linearGradient>` +
    `<pattern id="bld-brickL" patternUnits="userSpaceOnUse" width="3.4" height="1.3" patternTransform="skewY(30)"><path d="M0 0H3.4M0 .65H3.4M0 0V.65M1.7 .65V1.3" stroke="#4e1f12" stroke-opacity=".38" stroke-width=".2" fill="none"/></pattern>` +
    `<pattern id="bld-brickR" patternUnits="userSpaceOnUse" width="3.4" height="1.3" patternTransform="skewY(-30)"><path d="M0 0H3.4M0 .65H3.4M0 0V.65M1.7 .65V1.3" stroke="#3e170c" stroke-opacity=".4" stroke-width=".2" fill="none"/></pattern>`
  );

  /* ---------- small utilities ---------- */
  const rnd = (s, i) => { const v = Math.sin((s + 1) * 127.1 + i * 311.7 + s * i * 0.0131) * 43758.5453; return v - Math.floor(v); };
  const f = v => v.toFixed(1);
  const OL = 'stroke="#0b1e33" stroke-opacity=".18" stroke-width=".5" stroke-linejoin="round"';

  // the two visible faces as 1-D frames: a = position along the face, z = height, o = outward offset
  function faces(x, y, w, d) {
    return {
      L: { a0: x, a1: x + w, pt: (a, z, o = 0) => P(a, y + d + o, z) },   // left face, plane y+d, outward +y
      R: { a0: y, a1: y + d, pt: (a, z, o = 0) => P(x + w + o, a, z) }    // right face, plane x+w, outward +x
    };
  }
  const quad = (F, a0, a1, z0, z1, o = 0) => [F.pt(a0, z0, o), F.pt(a1, z0, o), F.pt(a1, z1, o), F.pt(a0, z1, o)];
  const dq = q => 'M' + q.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
  const seg = (p, q) => `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`;
  const path = (d, attrs) => d ? `<path d="${d}" ${attrs}/>` : '';
  const top4 = (x, y, w, d, z) => [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)];
  function cols(a0, a1, cw, pad) {
    const L = a1 - a0 - 2 * pad, n = Math.max(1, Math.floor(L / cw)), st = a0 + pad + (L - n * cw) / 2, out = [];
    for (let i = 0; i < n; i++) out.push(st + i * cw);
    return out;
  }
  function floors(z0, z1, fh) { const out = []; for (let z = z0; z + fh <= z1 + 0.01; z += fh) out.push(z); return out; }

  // lit/unlit split: unlit quads in one path, lit quads in 4 staggered flicker buckets
  function lights(c, quads, prob, litFill = 'url(#bld-lit)', extra = '') {
    let un = '';
    const b = ['', '', '', ''];
    quads.forEach(q => { if (c.r() < prob) b[Math.floor(c.r() * 4)] += dq(q); else un += dq(q); });
    const lit = b.map((d, i) => d ? `<path d="${d}" fill="${litFill}" ${extra} class="flick" style="animation-delay:${(c.dl + i * 0.8 + c.r() * 0.7).toFixed(2)}s"/>` : '').join('');
    return { un, lit };
  }

  /* ---------- shared building parts ---------- */
  function ao(x, y, w, d) {
    return poly(top4(x - 1.6, y - 1.6, w + 6, d + 6, 0), '#0b1e33', 'opacity=".07"') +
      poly(top4(x - 0.6, y - 0.6, w + 2.4, d + 2.4, 0), '#0b1e33', 'opacity=".13"');
  }
  // the two visible walls (+ a dark strip at the ground for ambient occlusion)
  function shell(x, y, w, d, z0, z1, fl, fr, base = true) {
    const F = faces(x, y, w, d);
    let s = poly(quad(F.L, F.L.a0, F.L.a1, z0, z1), fl, OL) + poly(quad(F.R, F.R.a0, F.R.a1, z0, z1), fr, OL);
    if (base) s += path(dq(quad(F.L, F.L.a0, F.L.a1, z0, z0 + 3.5)) + dq(quad(F.R, F.R.a0, F.R.a1, z0, z0 + 3.5)), 'fill="#0b1e33" opacity=".07"') +
      path(dq(quad(F.L, F.L.a0, F.L.a1, z0, z0 + 1.1)) + dq(quad(F.R, F.R.a0, F.R.a1, z0, z0 + 1.1)), 'fill="#0b1e33" opacity=".12"');
    return s;
  }
  // light bevel on the top-front edges and the front corner
  function edges(x, y, w, d, z0, z1) {
    return path(seg(P(x, y + d, z1), P(x + w, y + d, z1)) + seg(P(x + w, y + d, z1), P(x + w, y, z1)) + seg(P(x + w, y + d, z0 + 0.5), P(x + w, y + d, z1)),
      'stroke="#fff" stroke-opacity=".6" stroke-width=".5" fill="none" stroke-linecap="round"');
  }
  // roof slab; with `inner` it gets a parapet ring and a sunken membrane
  function roofTop(x, y, w, d, z, top, inner, wallL = '#c3ccd6', wallR = '#aab5c1') {
    let s = poly(top4(x, y, w, d, z), top, OL);
    if (inner && w > 3 && d > 3) {
      const i = 0.9, pz = 0.9;
      s += poly(top4(x + i, y + i, w - 2 * i, d - 2 * i, z), inner) +
        poly([P(x + i, y + i, z), P(x + w - i, y + i, z), P(x + w - i, y + i, z - pz), P(x + i + pz, y + i, z - pz)], wallL) +
        poly([P(x + i, y + i, z), P(x + i, y + d - i, z), P(x + i, y + d - i, z - pz), P(x + i, y + i + pz, z - pz)], wallR);
    }
    return s;
  }

  /* ---------- rooftop clutter ---------- */
  function acUnit(px, py, z) {
    const [cx, cy] = P(px + 1.3, py + 1, z + 1.4);
    return box(px, py, z, 2.6, 2, 1.4, ['#f3f6f9', '#d3dbe3', '#b3becb']) +
      `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="1" ry=".55" fill="#66727f"/>`;
  }
  function tank(px, py, z, r, hh, wood) {
    const [gx, gy] = P(px, py, z), cy = gy - 1.4, rx = r * 1.22, ry = r * 0.66;
    let s = `<path d="M${f(gx - rx * .7)} ${f(gy - .3)}V${f(cy)}M${f(gx + rx * .7)} ${f(gy - .3)}V${f(cy)}M${f(gx)} ${f(gy + .3)}V${f(cy)}" stroke="#6b7682" stroke-width=".55"/>` +
      `<ellipse cx="${f(gx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${wood ? '#5c3d25' : '#7d8a98'}"/>` +
      `<rect x="${f(gx - rx)}" y="${f(cy - hh)}" width="${f(2 * rx)}" height="${f(hh)}" fill="url(#${wood ? 'bld-wood' : 'metal-h'})"/>`;
    if (wood) s += `<path d="M${f(gx - rx)} ${f(cy - hh * .35)}h${f(2 * rx)}M${f(gx - rx)} ${f(cy - hh * .75)}h${f(2 * rx)}" stroke="#4a301c" stroke-width=".3" opacity=".6"/>` +
      `<path d="M${f(gx - rx - .2)} ${f(cy - hh)}L${f(gx)} ${f(cy - hh - r * 1.1)}L${f(gx + rx + .2)} ${f(cy - hh)}Z" fill="#6f4a2d"/>`;
    else s += `<ellipse cx="${f(gx)}" cy="${f(cy - hh)}" rx="${f(rx)}" ry="${f(ry)}" fill="#eef2f6" stroke="#9aa7b4" stroke-width=".3"/>`;
    return s;
  }
  function antenna(px, py, z, hh, dl) {
    const [cx, cy] = P(px, py, z);
    return `<path d="M${f(cx)} ${f(cy)}V${f(cy - hh)}M${f(cx - 1.4)} ${f(cy - hh * .45)}h2.8M${f(cx - 1)} ${f(cy - hh * .7)}h2M${f(cx - 2)} ${f(cy)}L${f(cx)} ${f(cy - hh * .3)}L${f(cx + 2)} ${f(cy)}" stroke="#7b8896" stroke-width=".55" fill="none"/>` +
      `<circle cx="${f(cx)}" cy="${f(cy - hh)}" r="1.1" fill="#ff5a4e" class="glow" style="animation-delay:${dl.toFixed(2)}s"/>`;
  }
  function penthouse(px, py, z, pw, pd, ph) {
    return box(px, py, z, pw, pd, ph, ['#eef2f5', '#cfd8e0', '#b5c1cc']) +
      winL(px + pw * 0.55, py + pd, z, Math.min(1.4, pw * 0.3), ph * 0.75, '#4a6788') +
      poly(top4(px - 0.2, py - 0.2, pw + 0.4, pd + 0.4, z + ph + 0.01), '#dde4ea', OL);
  }
  function helipad(cx, cy, z, r) {
    const ring = (rr) => { const a = []; for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; a.push(P(cx + rr * Math.cos(t), cy + rr * Math.sin(t), z)); } return a; };
    return poly(ring(r), '#4c5763', 'stroke="#2f3943" stroke-width=".4"') +
      poly(ring(r * 0.8), 'none', 'stroke="#f2c35c" stroke-width=".5" stroke-dasharray="1.2 .9"') +
      path(seg(P(cx - r * .3, cy - r * .38, z), P(cx - r * .3, cy + r * .38, z)) + seg(P(cx + r * .3, cy - r * .38, z), P(cx + r * .3, cy + r * .38, z)) + seg(P(cx - r * .3, cy, z), P(cx + r * .3, cy, z)),
        'stroke="#fff" stroke-width=".9" stroke-linecap="round" fill="none"');
  }
  // z is the membrane level; picks items from the seed and sorts them back-to-front
  function clutter(c, x, y, w, d, z, kind) {
    const m = 1.8, ix = x + m, iy = y + m, iw = w - 2 * m, id = d - 2 * m, it = [];
    if (iw < 4 || id < 4) return '';
    const pad = c.h >= 34 && Math.min(w, d) >= 16 && (kind === 'glass' || kind === 'office' || kind === 'stepped');
    if (pad) {
      const r = Math.min(iw, id) * 0.33;
      it.push({ k: -1e9, s: helipad(ix + iw * 0.6, iy + id * 0.6, z + 0.05, r) });
      it.push({ k: ix + iy, s: acUnit(ix, iy, z) });
      it.push({ k: ix + iw + iy, s: antenna(ix + iw - 0.6, iy + 0.6, z, 10, c.dl + 0.4) });
    } else {
      const wood = kind === 'brick';
      if (kind !== 'retail' && iw > 7 && id > 6) it.push({ k: ix + iy + 1, s: penthouse(ix, iy, z, Math.min(5, iw * 0.4), Math.min(4, id * 0.35), 2.6) });
      if (c.r() > 0.35 || kind === 'brick' || kind === 'apartment') { const tx = ix + iw * 0.78, ty = iy + id * 0.3; it.push({ k: tx + ty, s: tank(tx, ty, z, wood ? 1.6 : 1.4, wood ? 2.8 : 2.4, wood) }); }
      it.push({ k: ix + iw * 0.15 + iy + id * 0.62, s: acUnit(ix + iw * 0.12, iy + id * 0.55, z) });
      if (iw > 8) it.push({ k: ix + iw * 0.5 + iy + id * 0.75, s: acUnit(ix + iw * 0.48, iy + id * 0.7, z) });
      if (c.h >= 24 && c.r() > 0.4) it.push({ k: ix + iw * 0.9 + iy + id * 0.9, s: antenna(ix + iw * 0.92, iy + id * 0.9, z, 6 + c.r() * 4, c.dl + 0.9) });
    }
    return it.sort((a, b) => a.k - b.k).map(o => o.s).join('');
  }

  /* ---------- styles ---------- */
  function sGlass(c) {
    const { x, y, w, d, h } = c, F = faces(x, y, w, d), zc = h - 1.6;
    let s = shell(x, y, w, d, 0, h, 'url(#bld-glassL)', 'url(#bld-glassR)');
    [F.L, F.R].forEach((Fc, fi) => {
      const len = Fc.a1 - Fc.a0, n = Math.max(2, Math.round(len / 2.6)), st = len / n;
      const nf = Math.max(2, Math.round((zc - 2.6) / 3.2)), fs = (zc - 2.6) / nf;
      let mul = '', spd = '';
      const cells = [];
      for (let i = 1; i < n; i++) mul += seg(Fc.pt(Fc.a0 + i * st, 0.3), Fc.pt(Fc.a0 + i * st, zc));
      for (let j = 0; j < nf; j++) {
        const z = 2.6 + j * fs;
        spd += dq(quad(Fc, Fc.a0, Fc.a1, z + fs - 0.5, z + fs));
        for (let i = 0; i < n; i++) cells.push(quad(Fc, Fc.a0 + i * st + 0.25, Fc.a0 + (i + 1) * st - 0.25, z + 0.35, z + fs - 0.7));
      }
      const L = lights(c, cells, c.lit, 'url(#bld-lit)', 'fill-opacity=".8"');
      s += path(spd, 'fill="#163a5e" fill-opacity=".3"') + L.lit +
        path(mul, 'stroke="#eaf6ff" stroke-opacity=".55" stroke-width=".35" fill="none"') +
        poly(quad(Fc, Fc.a0, Fc.a1, zc * 0.45, zc), 'url(#bld-refl)');
      // diagonal sheen streaks
      const zb = Math.max(0.6, zc - zc * 0.75), p = fi ? [.6, .76, .3, .14] : [.48, .64, .18, .02], p2 = fi ? [.82, .87, .52, .47] : [.72, .77, .42, .37];
      const streak = q => [Fc.pt(Fc.a0 + len * q[0], zc), Fc.pt(Fc.a0 + len * q[1], zc), Fc.pt(Fc.a0 + len * q[2], zb), Fc.pt(Fc.a0 + len * q[3], zb)];
      s += poly(streak(p), '#fff', `opacity="${fi ? '.12' : '.22'}"`) + poly(streak(p2), '#fff', `opacity="${fi ? '.08' : '.15'}"`);
      // lobby: darker glass + doors
      s += poly(quad(Fc, Fc.a0, Fc.a1, 0, 2.6), '#1d3550', 'opacity=".45"');
      if (!fi) s += poly(quad(Fc, Fc.a0 + len * .4, Fc.a0 + len * .6, 0, 2.1), 'url(#bld-lit)', 'opacity=".85"');
    });
    s += poly(quad(F.L, F.L.a0, F.L.a1, zc, h), '#35546f') + poly(quad(F.R, F.R.a0, F.R.a1, zc, h), '#28445e');
    s += edges(x, y, w, d, 0, h) + roofTop(x, y, w, d, h, '#d5e0ea', '#7e8c9a', '#9aa8b6', '#83919f');
    return s + clutter(c, x, y, w, d, h - 0.9, 'glass');
  }

  function sOffice(c) {
    const { x, y, w, d, h } = c, F = faces(x, y, w, d);
    const pal = [['#eef1f4', '#dde3e9', '#c2cbd5'], ['#f4efe6', '#e2d9cb', '#c9bdaa'], ['#e9eef1', '#d3dce2', '#b8c4cd']][Math.floor(c.r() * 3)];
    let s = shell(x, y, w, d, 0, h, pal[1], pal[2]);
    const fh = 3.6, zs = 4.6;
    [F.L, F.R].forEach((Fc, fi) => {
      const len = Fc.a1 - Fc.a0, nc = Math.max(2, Math.round((len - 2) / 2.4)), cw = (len - 2) / nc;
      let rib = '', mul = '', lip = '';
      const cells = [];
      // lobby
      rib += dq(quad(Fc, Fc.a0 + 0.8, Fc.a1 - 0.8, 0.3, 3.6));
      floors(zs, h - 1.4, fh).forEach(z => {
        const z0 = z + 1.0, z1 = z + 2.9;
        rib += dq(quad(Fc, Fc.a0 + 1, Fc.a1 - 1, z0, z1));
        lip += seg(Fc.pt(Fc.a0 + 0.6, z1 + 0.15, 0), Fc.pt(Fc.a1 - 0.6, z1 + 0.15, 0));
        for (let i = 0; i < nc; i++) {
          const a = Fc.a0 + 1 + i * cw;
          if (i) mul += seg(Fc.pt(a, z0), Fc.pt(a, z1));
          cells.push(quad(Fc, a + 0.15, a + cw - 0.15, z0 + 0.15, z1 - 0.1));
        }
      });
      const L = lights(c, cells, c.lit);
      s += path(rib, 'fill="url(#bld-ribbon)"') + L.lit +
        path(mul, 'stroke="#e9eef3" stroke-opacity=".7" stroke-width=".3" fill="none"') +
        path(lip, `stroke="#fff" stroke-opacity=".75" stroke-width=".45" fill="none"`);
      if (!fi) {
        const m = (Fc.a0 + Fc.a1) / 2;
        s += poly(quad(Fc, m - 1.6, m + 1.6, 0.3, 3.1), 'url(#bld-lit)') +
          poly([Fc.pt(m - 2.4, 3.6, 0), Fc.pt(m + 2.4, 3.6, 0), Fc.pt(m + 2.4, 3.6, 1.8), Fc.pt(m - 2.4, 3.6, 1.8)], '#f7f9fb', OL);
      }
      // lobby reflection
      s += poly(quad(Fc, Fc.a0 + 0.8, Fc.a1 - 0.8, 0.3, 3.6), 'url(#sheen)');
    });
    // top cornice band
    s += poly(quad(F.L, F.L.a0, F.L.a1, h - 1, h), pal[0], 'opacity=".9"') + poly(quad(F.R, F.R.a0, F.R.a1, h - 1, h), pal[1]);
    s += edges(x, y, w, d, 0, h) + roofTop(x, y, w, d, h, pal[0], '#a3aeb9', pal[1], pal[2]);
    return s + clutter(c, x, y, w, d, h - 0.9, 'office');
  }

  function sApartment(c) {
    const { x, y, w, d, h } = c, F = faces(x, y, w, d);
    const pal = [['#fff8ee', '#f1e2cb', '#d8c3a6'], ['#f2f6ef', '#d8e3d0', '#bccbb3'], ['#fbf0ec', '#eed5cd', '#d5b8ae']][Math.floor(c.r() * 3)];
    let s = shell(x, y, w, d, 0, h, pal[1], pal[2]);
    const fh = 4, zs = 4.4, cw = 4.4;
    let slabT = '', slabF = '', rail = '', railTop = '', acF = '', acT = '', acS = '', acG = '';
    // ground floor: plinth band, entrance on the left face
    s += path(dq(quad(F.L, F.L.a0, F.L.a1, 0, 4)) + dq(quad(F.R, F.R.a0, F.R.a1, 0, 4)), 'fill="#5a4632" opacity=".08"');
    const m = (F.L.a0 + F.L.a1) / 2;
    s += poly(quad(F.L, m - 1.4, m + 1.4, 0.2, 3.2), '#3c4f63') + poly(quad(F.L, m - 1.1, m + 1.1, 0.2, 2.9), 'url(#bld-lit)', 'opacity=".75"') +
      poly([F.L.pt(m - 2, 3.5, 0), F.L.pt(m + 2, 3.5, 0), F.L.pt(m + 2, 3.5, 1.6), F.L.pt(m - 2, 3.5, 1.6)], '#fff', OL);
    [F.L, F.R].forEach((Fc, fi) => {
      const cells = [];
      const cs = cols(Fc.a0, Fc.a1, cw, 0.6);
      floors(zs, h - 1.2, fh).forEach(z => {
        cs.forEach((a, i) => {
          const bal = !fi && i % 2 === 0;
          if (bal) {
            cells.push(quad(Fc, a + 0.9, a + cw - 0.9, z + 0.2, z + 3.1));
            const a0 = a + 0.4, a1 = a + cw - 0.4, o = 1.8;
            slabT += dq([Fc.pt(a0, z, 0), Fc.pt(a1, z, 0), Fc.pt(a1, z, o), Fc.pt(a0, z, o)]);
            slabF += dq(quad(Fc, a0, a1, z - 0.45, z, o)) + dq([Fc.pt(a1, z - 0.45, 0), Fc.pt(a1, z - 0.45, o), Fc.pt(a1, z, o), Fc.pt(a1, z, 0)]);
            rail += dq(quad(Fc, a0, a1, z, z + 1.6, o)) + dq([Fc.pt(a1, z, 0), Fc.pt(a1, z, o), Fc.pt(a1, z + 1.6, o), Fc.pt(a1, z + 1.6, 0)]);
            railTop += seg(Fc.pt(a0, z + 1.6, o), Fc.pt(a1, z + 1.6, o)) + seg(Fc.pt(a1, z + 1.6, o), Fc.pt(a1, z + 1.6, 0));
          } else {
            cells.push(quad(Fc, a + 1.1, a + cw - 1.1, z + 1.1, z + 3.1));
            if (fi && c.r() < 0.45) { // AC unit under the window
              const b0 = a + cw / 2 - 0.9, b1 = b0 + 1.8, z0 = z + 0.1, z1 = z + 0.95, o = 0.9;
              acF += dq(quad(Fc, b0, b1, z0, z1, o));
              acT += dq([Fc.pt(b0, z1, 0), Fc.pt(b1, z1, 0), Fc.pt(b1, z1, o), Fc.pt(b0, z1, o)]);
              acS += dq([Fc.pt(b1, z0, 0), Fc.pt(b1, z0, o), Fc.pt(b1, z1, o), Fc.pt(b1, z1, 0)]);
              acG += seg(Fc.pt(b0 + 0.3, z0 + 0.3, o), Fc.pt(b1 - 0.5, z0 + 0.3, o)) + seg(Fc.pt(b0 + 0.3, z0 + 0.55, o), Fc.pt(b1 - 0.5, z0 + 0.55, o));
            }
          }
        });
      });
      const L = lights(c, cells, c.lit);
      // window reveal shadow, then glass
      s += path(L.un, 'fill="url(#bld-win)" stroke="#fff" stroke-width=".35" stroke-opacity=".8"') + L.lit;
    });
    s += path(acS, 'fill="#b9c3cd"') + path(acF, 'fill="#e4e9ee"') + path(acT, 'fill="#f8fafc"') + path(acG, 'stroke="#7d8a98" stroke-width=".22" fill="none"');
    s += path(slabT, 'fill="#ffffff"') + path(slabF, `fill="${pal[2]}"`) +
      path(rail, 'fill="#dff0fb" fill-opacity=".45" stroke="#8ea0b2" stroke-width=".25"') + path(railTop, 'stroke="#f7fafc" stroke-width=".5" fill="none"');
    s += edges(x, y, w, d, 0, h) + roofTop(x, y, w, d, h, pal[0], '#b9b2a6', pal[1], pal[2]);
    return s + clutter(c, x, y, w, d, h - 0.9, 'apartment');
  }

  function sStepped(c) {
    const { x, y, w, d, h } = c, mn = Math.min(w, d);
    const pal = [['#f5f1e8', '#e0d8c7', '#c6bba6'], ['#eef1f5', '#d6dde6', '#bcc6d2']][Math.floor(c.r() * 2)];
    const tiers = h >= 30 ? [[0, .5], [.15, .78], [.29, 1]] : [[0, .62], [.18, 1]];
    let s = '', zb = 0, plant = '';
    tiers.forEach(([inF, hF], ti) => {
      const ins = mn * inF, tx = x + ins, ty = y + ins, tw = w - 2 * ins, td = d - 2 * ins, zt = h * hF, last = ti === tiers.length - 1;
      const F = faces(tx, ty, tw, td);
      s += shell(tx, ty, tw, td, zb, zt, pal[1], pal[2], ti === 0);
      [F.L, F.R].forEach(Fc => {
        const cells = [];
        let fin = '';
        const cs = cols(Fc.a0, Fc.a1, 3, 0.8);
        cs.forEach((a, i) => { if (i) fin += seg(Fc.pt(a, zb + 0.4), Fc.pt(a, zt - 1)); });
        floors(zb + (ti ? 0.8 : 3.2), zt - 1.2, 3.4).forEach(z => cs.forEach(a => cells.push(quad(Fc, a + 0.7, a + 2.3, z + 0.5, z + 2.9))));
        const L = lights(c, cells, c.lit);
        s += path(L.un, 'fill="url(#bld-win)"') + L.lit + path(fin, 'stroke="#fff" stroke-opacity=".55" stroke-width=".55" fill="none"');
        s += poly(quad(Fc, Fc.a0, Fc.a1, zt - 1, zt), pal[0], 'opacity=".85"');
        if (!ti) { const m = (Fc.a0 + Fc.a1) / 2; s += poly(quad(Fc, m - 1.5, m + 1.5, 0.2, 2.8), 'url(#bld-lit)', 'opacity=".8"'); }
      });
      if (last) { // lit crown band
        s += poly(quad(F.L, F.L.a0, F.L.a1, zt - 0.8, zt - 0.3), 'url(#bld-lit)', 'class="flick"') + poly(quad(F.R, F.R.a0, F.R.a1, zt - 0.8, zt - 0.3), 'url(#bld-lit)', 'opacity=".8" class="flick" style="animation-delay:.6s"');
      }
      s += edges(tx, ty, tw, td, zb, zt) + roofTop(tx, ty, tw, td, zt, pal[0], last ? '#9aa4ae' : '#cbd2c4', pal[1], pal[2]);
      if (last) {
        s += clutter(c, tx, ty, tw, td, zt - 0.9, 'stepped');
        if (h < 34 || mn < 16) s += antenna(tx + tw / 2, ty + td / 2, zt, 9, c.dl);
      } else { // terrace planters along the front edges, drawn after the upper tiers
        plant += box(tx + tw - 1.2, ty + 0.4, zt, 1, td - 1.6, 0.9, ['#7fbf6a', '#5f9e4f', '#4d8641']) +
          box(tx + 0.4, ty + td - 1.2, zt, tw - 1.6, 1, 0.9, ['#86c46f', '#64a352', '#4f8a42']);
      }
      zb = zt;
    });
    return s + plant;
  }

  function sRetail(c) {
    const { x, y, w, d, h } = c, F = faces(x, y, w, d);
    const sc = [['#e04a3f', '#b83a30'], ['#1f7fc0', '#17669b'], ['#2f9a5d', '#257a49'], ['#f08c2a', '#c96f1b']][Math.floor(c.r() * 4)];
    const pal = [['#fbf8f3', '#ece5da', '#d4cabc'], ['#eef3f7', '#dbe3ea', '#c1ccd7']][Math.floor(c.r() * 2)];
    let s = shell(x, y, w, d, 0, h, pal[1], pal[2]);
    [F.L, F.R].forEach((Fc, fi) => {
      const a0 = Fc.a0 + 0.8, a1 = Fc.a1 - 0.8, len = a1 - a0;
      // shopfront: warm interior, shelving silhouettes, mullions, reflection
      s += poly(quad(Fc, a0, a1, 0.3, 6.2), 'url(#bld-shop)', `class="flick" style="animation-delay:${(c.dl + fi * 1.1).toFixed(2)}s"`);
      let shelf = '', mul = '', lt = '';
      for (let a = a0 + 0.6; a + 1.6 < a1; a += 2.6) shelf += dq(quad(Fc, a, a + 1.6, 0.3, 2.2 + c.r() * 1.4));
      for (let a = a0 + 3; a < a1 - 0.5; a += 3) mul += seg(Fc.pt(a, 0.3), Fc.pt(a, 6.2));
      mul += seg(Fc.pt(a0, 4.9), Fc.pt(a1, 4.9));
      s += path(shelf, 'fill="#8a5a3a" opacity=".28"') + path(mul, 'stroke="#55606c" stroke-width=".35" fill="none"') +
        poly(quad(Fc, a0, a1, 0.3, 6.2), 'url(#sheen)') +
        poly(quad(Fc, a0, a1, 4.9, 6.2), '#0b1e33', 'opacity=".18"');
      if (!fi) { const m = Fc.a0 + (Fc.a1 - Fc.a0) * 0.3; s += poly(quad(Fc, m - 1, m + 1, 0.3, 4.6), '#34495e', 'opacity=".75"'); }
      // signage band with "lettering"
      s += poly(quad(Fc, Fc.a0 + 0.4, Fc.a1 - 0.4, 7.2, 9.4), sc[fi]);
      const nl = Math.max(2, Math.floor((len - 3) / 1.1)), ls = Fc.a0 + 0.4 + ((Fc.a1 - Fc.a0 - 0.8) - nl * 1.1) / 2;
      for (let i = 0; i < nl; i++) if (c.r() > 0.15) lt += dq(quad(Fc, ls + i * 1.1 + 0.15, ls + i * 1.1 + 0.85, 7.75, 8.85));
      s += path(lt, 'fill="#fff" opacity=".92"') + path(seg(Fc.pt(Fc.a0 + 0.4, 9.4), Fc.pt(Fc.a1 - 0.4, 9.4)), 'stroke="#fff" stroke-opacity=".5" stroke-width=".4"');
      // striped awning
      const n = Math.max(3, Math.round(len / 1.3)), sw = len / n;
      let sa = '', sb = '';
      for (let i = 0; i < n; i++) {
        const a = a0 + i * sw, q = dq([Fc.pt(a, 6.9, 0), Fc.pt(a + sw, 6.9, 0), Fc.pt(a + sw, 5.6, 2.4), Fc.pt(a, 5.6, 2.4)]);
        if (i % 2) sb += q; else sa += q;
      }
      s += path(sa, `fill="${sc[0]}"`) + path(sb, 'fill="#fbfbf8"') +
        poly(quad(Fc, a0, a1, 5.0, 5.6, 2.4), sc[1]) +
        poly([Fc.pt(a1, 6.9, 0), Fc.pt(a1, 5.6, 2.4), Fc.pt(a1, 5.0, 2.4)], sc[1]);
      // upper floors
      if (h > 13) {
        const cells = [];
        cols(Fc.a0, Fc.a1, 3.8, 0.6).forEach(a => floors(10.4, h - 1.2, 3.8).forEach(z => cells.push(quad(Fc, a + 0.9, a + 2.9, z + 0.6, z + 3))));
        const L = lights(c, cells, c.lit);
        s += path(L.un, 'fill="url(#bld-win)" stroke="#fff" stroke-width=".3" stroke-opacity=".7"') + L.lit;
      }
    });
    s += edges(x, y, w, d, 0, h) + roofTop(x, y, w, d, h, pal[0], '#a9b2bb', pal[1], pal[2]);
    return s + clutter(c, x, y, w, d, h - 0.9, 'retail');
  }

  function sBrick(c) {
    const { x, y, w, d, h } = c, F = faces(x, y, w, d);
    const pal = [['#c46d50', '#b8664c', '#96492f'], ['#a8573f', '#9f523c', '#7d3c29'], ['#d9b48a', '#cfa577', '#ad8256']][Math.floor(c.r() * 3)];
    let s = shell(x, y, w, d, 0, h, pal[1], pal[2]);
    s += poly(quad(F.L, F.L.a0, F.L.a1, 1.4, h - 1.2), 'url(#bld-brickL)') + poly(quad(F.R, F.R.a0, F.R.a1, 1.4, h - 1.2), 'url(#bld-brickR)');
    // stone plinth + cornice
    s += poly(quad(F.L, F.L.a0, F.L.a1, 0, 1.4), '#d6cdc1') + poly(quad(F.R, F.R.a0, F.R.a1, 0, 1.4), '#b9afa3');
    [F.L, F.R].forEach((Fc, fi) => {
      const cells = [];
      let stone = '', frame = '';
      const cs = cols(Fc.a0, Fc.a1, 4, 0.6);
      floors(2, h - 1.6, 4).forEach((z, fl) => cs.forEach((a, i) => {
        const a0 = a + 0.9, a1 = a + 3.1;
        if (!fi && fl === 0 && i === Math.floor(cs.length / 2)) { // door
          s += poly(quad(Fc, a0 - 0.1, a1 + 0.1, 1.4, 4.4), '#5b3a26') + poly(quad(Fc, a0 + 0.2, a1 - 0.2, 1.4, 4.1), 'url(#bld-lit)', 'opacity=".6"');
          stone += dq(quad(Fc, a0 - 0.4, a1 + 0.4, 4.4, 5));
          return;
        }
        cells.push(quad(Fc, a0, a1, z + 0.7, z + 3.1));
        stone += dq(quad(Fc, a0 - 0.3, a1 + 0.3, z + 3.1, z + 3.6)) + dq(quad(Fc, a0 - 0.2, a1 + 0.2, z + 0.35, z + 0.7));
        const am = (a0 + a1) / 2;
        frame += seg(Fc.pt(am, z + 0.7), Fc.pt(am, z + 3.1)) + seg(Fc.pt(a0, z + 2.1), Fc.pt(a1, z + 2.1));
      }));
      const L = lights(c, cells, c.lit);
      s += path(L.un, 'fill="url(#bld-win)"') + L.lit + path(frame, 'stroke="#f6f1ea" stroke-width=".3" fill="none"') + path(stone, 'fill="#f1e9de"');
      s += poly(quad(Fc, Fc.a0, Fc.a1, h - 1.2, h), fi ? '#d8cfc3' : '#efe8dd') + path(seg(Fc.pt(Fc.a0, h - 1.25), Fc.pt(Fc.a1, h - 1.25)), 'stroke="#3e1a0e" stroke-opacity=".3" stroke-width=".45"');
    });
    s += edges(x, y, w, d, 0, h) + roofTop(x, y, w, d, h, '#efe8dd', '#8e8a86', '#cfc4b6', '#b3a798');
    // chimney stack
    if (w > 10 && d > 10) s += box(x + 2, y + d - 4.5, h - 0.9, 1.8, 1.8, 3.4, [pal[0], pal[1], pal[2]]) + box(x + 1.8, y + d - 4.7, h + 2.5, 2.2, 2.2, 0.5, ['#efe8dd', '#d6cdc1', '#b9afa3']);
    return s + clutter(c, x, y, w, d - 4, h - 0.9, 'brick');
  }

  const STYLES = { glass: sGlass, office: sOffice, apartment: sApartment, stepped: sStepped, retail: sRetail, brick: sBrick };
  const LIT = { glass: 0.25, office: 0.35, apartment: 0.3, stepped: 0.3, retail: 0.3, brick: 0.3 };

  function building(x, y, w, d, h, opts = {}) {
    const style = STYLES[opts.style] ? opts.style : 'office';
    const seed = +opts.seed || 0;
    const c = { x, y, w, d, h, dl: +opts.delay || 0, sd: seed, i: 0, lit: opts.lit != null ? opts.lit : LIT[style] };
    c.r = () => rnd(seed, c.i++);
    return `<g class="bld bld-${style}">` + ao(x, y, w, d) + STYLES[style](c) + '</g>';
  }

  // [[x,y,w,d,h,style?], ...] -> sorted back-to-front by footprint centre (x+y)
  // the buildings of block() one by one, as { k: depth (x + y of the centre), svg }, for callers that sort them with other things
  function blockParts(list, opts = {}) {
    const seed = +opts.seed || 0, dl = +opts.delay || 0;
    const tall = ['glass', 'stepped', 'office'], mid = ['office', 'apartment', 'brick', 'glass'], low = ['retail', 'brick', 'apartment'];
    let prev = '';
    const items = list.map((b, i) => {
      let st = b[5];
      if (!st) {
        const set = b[4] >= 34 ? tall : b[4] >= 24 ? mid : low;
        let k = Math.floor(rnd(seed + 7, i) * set.length);
        if (set[k] === prev) k = (k + 1) % set.length;
        st = set[k];
      }
      prev = st;
      return { k: b[0] + b[2] / 2 + b[1] + b[3] / 2, b, st, i };
    });
    return items.map(o => ({ k: o.k, svg: building(o.b[0], o.b[1], o.b[2], o.b[3], o.b[4], { style: o.st, delay: dl + o.i * 0.37, seed: seed * 31 + o.i * 7 + 1 }) }));
  }
  const block = (list, opts) => blockParts(list, opts).sort((a, b) => a.k - b.k).map(o => o.svg).join('');

  A.buildings = { building, block, blockParts, styles: Object.keys(STYLES) };
})();
