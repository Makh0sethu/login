/* Painted ground textures for the map.  Namespace: Assets.textures, defs prefix: tx-
   Each texture is painted once at load time on a <canvas> (tileable fractal noise + strokes such as
   grass blades, cracks and pebbles), saved as a JPEG data URL and registered as an SVG <pattern> in
   world units. The map draws its ground inside the world matrix, so the tiles come out foreshortened
   to the isometric view. Because they are plain images, they cost nothing per animation frame.
   Load after core.js and before Assets.mountDefs().

   Patterns: tx-grass, tx-grass-dry (transition), tx-lawn, tx-dry, tx-dirt, tx-sand, tx-gravel, tx-field-soil */
(function () {
  const A = window.Assets = window.Assets || {};
  if (typeof document === 'undefined' || !document.createElement) return;

  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  // tileable fractal value noise over a size x size tile; returns Float32Array in 0..1
  function fbm(size, R, base = 4, octaves = 5, gain = .5) {
    const out = new Float32Array(size * size);
    let amp = 1, total = 0;
    for (let o = 0; o < octaves; o++) {
      const cells = base << o, g = new Float32Array(cells * cells);
      for (let i = 0; i < g.length; i++) g[i] = R();
      const k = cells / size;
      for (let y = 0; y < size; y++) {
        const gy = y * k, y0 = gy | 0, ty = smooth(gy - y0), r0 = (y0 % cells) * cells, r1 = ((y0 + 1) % cells) * cells;
        for (let x = 0; x < size; x++) {
          const gx = x * k, x0 = gx | 0, tx = smooth(gx - x0), c0 = x0 % cells, c1 = (x0 + 1) % cells;
          out[y * size + x] += amp * lerp(lerp(g[r0 + c0], g[r0 + c1], tx), lerp(g[r1 + c0], g[r1 + c1], tx), ty);
        }
      }
      total += amp; amp *= gain;
    }
    for (let i = 0; i < out.length; i++) out[i] /= total;
    return out;
  }
  // map noise through colour stops [[t, '#hex'], ...]
  function colourise(ctx, size, n, stops, contrast = 1.6) {
    const img = ctx.createImageData(size, size), d = img.data, S = stops.map(([t, c]) => [t, hex(c)]);
    for (let i = 0; i < n.length; i++) {
      const v = Math.max(0, Math.min(1, (n[i] - .5) * contrast + .5));
      let j = 0; while (j < S.length - 2 && v > S[j + 1][0]) j++;
      const [t0, c0] = S[j], [t1, c1] = S[j + 1], t = Math.max(0, Math.min(1, (v - t0) / (t1 - t0 || 1)));
      d[i * 4] = lerp(c0[0], c1[0], t); d[i * 4 + 1] = lerp(c0[1], c1[1], t); d[i * 4 + 2] = lerp(c0[2], c1[2], t); d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  // draw fn at (x,y) and at its wrapped copies so strokes tile seamlessly
  function wrapDraw(size, x, y, m, fn) {
    for (const ox of [0, -size, size]) for (const oy of [0, -size, size]) {
      const X = x + ox, Y = y + oy;
      if (X > -m && X < size + m && Y > -m && Y < size + m) fn(X, Y);
    }
  }
  function blades(ctx, size, R, n, cols, len = [3, 8], wid = [.8, 1.4], lean = .35) {
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = R() * size, y = R() * size, L = lerp(len[0], len[1], R()), a = -Math.PI / 2 + (R() - .5) * 2 * lean;
      ctx.strokeStyle = cols[(R() * cols.length) | 0]; ctx.lineWidth = lerp(wid[0], wid[1], R());
      wrapDraw(size, x, y, 12, (X, Y) => { ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(X + Math.cos(a) * L * .5 + (R() - .5), Y + Math.sin(a) * L * .5, X + Math.cos(a) * L, Y + Math.sin(a) * L); ctx.stroke(); });
    }
  }
  function blobs(ctx, size, R, n, cols, r = [1, 3], sq = 1) {
    for (let i = 0; i < n; i++) {
      const x = R() * size, y = R() * size, rr = lerp(r[0], r[1], R());
      ctx.fillStyle = cols[(R() * cols.length) | 0];
      wrapDraw(size, x, y, rr + 2, (X, Y) => { ctx.beginPath(); ctx.ellipse(X, Y, rr, rr * sq, R() * Math.PI, 0, Math.PI * 2); ctx.fill(); });
    }
  }
  function stones(ctx, size, R, n, base, r = [1.2, 3]) {
    for (let i = 0; i < n; i++) {
      const x = R() * size, y = R() * size, rr = lerp(r[0], r[1], R()), c = base[(R() * base.length) | 0];
      wrapDraw(size, x, y, rr + 3, (X, Y) => {
        ctx.fillStyle = 'rgba(40,30,20,.28)'; ctx.beginPath(); ctx.ellipse(X + .7, Y + .9, rr, rr * .75, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X, Y, rr, rr * .75, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(X - rr * .3, Y - rr * .3, rr * .4, rr * .3, 0, 0, Math.PI * 2); ctx.fill();
      });
    }
  }
  function cracks(ctx, size, R, n, col, w = 1) {
    ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      let x = R() * size, y = R() * size, a = R() * Math.PI * 2;
      const pts = [[x, y]], steps = 4 + (R() * 6 | 0);
      for (let s = 0; s < steps; s++) { a += (R() - .5) * 1.4; const L = 4 + R() * 9; x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push([x, y]); }
      ctx.lineWidth = w * (.6 + R() * .8);
      wrapDraw(size, pts[0][0], pts[0][1], 80, (X, Y) => { const dx = X - pts[0][0], dy = Y - pts[0][1]; ctx.beginPath(); pts.forEach(([px, py], k) => k ? ctx.lineTo(px + dx, py + dy) : ctx.moveTo(px + dx, py + dy)); ctx.stroke(); });
    }
  }

  // tree canopy seen from above at a slant: dark shadow below-right, crown, light rim top-left
  function canopy(ctx, size, R, n, cols, shadow, light, r = [2, 4]) {
    for (let i = 0; i < n; i++) {
      const x = R() * size, y = R() * size, rr = lerp(r[0], r[1], R()), c = cols[(R() * cols.length) | 0];
      wrapDraw(size, x, y, rr * 2 + 2, (X, Y) => {
        ctx.fillStyle = shadow; ctx.beginPath(); ctx.ellipse(X + rr * .5, Y + rr * .6, rr, rr * .9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X, Y, rr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = light; ctx.beginPath(); ctx.arc(X - rr * .35, Y - rr * .4, rr * .45, 0, Math.PI * 2); ctx.fill();
      });
    }
  }
  // rock strata: wavy near-horizontal bedding lines + vertical fractures + a few boulders
  function strata(ctx, size, R, dark, lightC) {
    ctx.lineCap = 'round';
    for (let y = 4; y < size; y += 9 + R() * 8) {
      const ph = R() * 6, amp = 1 + R() * 2.5;
      for (const [col, dy, lw] of [[dark, 0, 1.1], [lightC, 1.4, .8]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        for (let x = -4; x <= size + 4; x += 6) ctx.lineTo(x, y + dy + Math.sin(x / size * Math.PI * 2 * 3 + ph) * amp);
        ctx.stroke();
      }
    }
    cracks(ctx, size, R, 40, dark, .9);
    stones(ctx, size, R, 40, ['#a89c88', '#8c8170', '#c4baa6'], [1.2, 3]);
  }

  function paint(size, fn) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    fn(ctx, size);
    return c.toDataURL('image/jpeg', .86);
  }

  const T = {
    grass: { px: 512, w: 150, seed: 11, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 3, 6), [[0, '#5f9d3a'], [.35, '#79b34b'], [.6, '#8cc55c'], [.85, '#a2d36d'], [1, '#b4dc7c']]);
      blobs(ctx, s, R, 260, ['rgba(60,110,35,.22)', 'rgba(70,125,40,.18)'], [4, 11], .7);
      blades(ctx, s, R, 5200, ['rgba(52,105,32,.55)', 'rgba(64,122,40,.5)', 'rgba(178,222,120,.55)', 'rgba(150,205,96,.5)']);
      blobs(ctx, s, R, 70, ['#fff7d6', '#ffe27a', '#f6f1ff'], [.8, 1.3]);
    } },
    'grass-dry': { px: 512, w: 150, seed: 12, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 3, 6), [[0, '#8f9a48'], [.4, '#a9b45c'], [.7, '#c1c272'], [1, '#d6cf8a']]);
      blades(ctx, s, R, 4200, ['rgba(110,120,50,.55)', 'rgba(150,145,70,.5)', 'rgba(215,210,140,.55)', 'rgba(120,150,60,.5)']);
      blobs(ctx, s, R, 160, ['rgba(160,130,80,.25)'], [2, 6], .7);
    } },
    lawn: { px: 256, w: 64, seed: 13, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 5), [[0, '#86c257'], [.5, '#9dd06a'], [1, '#b2dc7e']], 1.2);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(40,90,20,.07)'; ctx.fillRect(i * s / 4, 0, s / 4, s); }
      blades(ctx, s, R, 2600, ['rgba(70,130,45,.4)', 'rgba(190,230,140,.45)'], [2, 4.5], [.7, 1.1], .25);
    } },
    dry: { px: 512, w: 170, seed: 14, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 3, 6), [[0, '#bf9a57'], [.3, '#cfaf6c'], [.6, '#dcc07f'], [.85, '#e7d194'], [1, '#efdca6']]);
      blobs(ctx, s, R, 120, ['rgba(160,110,60,.18)', 'rgba(255,240,200,.18)'], [6, 18], .6);
      cracks(ctx, s, R, 120, 'rgba(120,82,40,.32)', 1.1);
      blades(ctx, s, R, 900, ['rgba(140,128,60,.55)', 'rgba(170,150,80,.5)', 'rgba(120,135,60,.45)'], [3, 7], [.8, 1.2], .5);
      stones(ctx, s, R, 160, ['#b9a68a', '#a89478', '#cdbb9c'], [1, 2.6]);
    } },
    dirt: { px: 256, w: 70, seed: 15, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 5), [[0, '#b88b58'], [.45, '#cfa673'], [.8, '#ddbb8c'], [1, '#e8cda4']]);
      blobs(ctx, s, R, 900, ['rgba(120,80,40,.3)', 'rgba(255,240,210,.3)'], [.6, 1.6]);
      stones(ctx, s, R, 50, ['#b5a189', '#c9b79d'], [.9, 2]);
      cracks(ctx, s, R, 18, 'rgba(110,75,40,.22)', .9);
    } },
    sand: { px: 256, w: 70, seed: 16, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 5), [[0, '#e2cb93'], [.5, '#efdfb3'], [1, '#f9efd4']], 1.3);
      ctx.strokeStyle = 'rgba(190,160,100,.28)'; ctx.lineWidth = 1.2;
      for (let y = 6; y < s; y += 11) { ctx.beginPath(); for (let x = 0; x <= s; x += 8) ctx.lineTo(x, y + Math.sin((x / s) * Math.PI * 4 + y) * 2.4); ctx.stroke(); }
      blobs(ctx, s, R, 600, ['rgba(170,140,90,.35)', 'rgba(255,255,255,.4)'], [.5, 1.1]);
    } },
    gravel: { px: 256, w: 60, seed: 17, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 5), [[0, '#a9a397'], [.5, '#c3bdb1'], [1, '#d8d3c9']], 1.2);
      stones(ctx, s, R, 1100, ['#b8b2a6', '#9f998d', '#d0cbc1', '#8f897e'], [1.1, 2.6]);
    } },
    // mountain faces (screen space): forest canopy on the slopes, granite near the tops
    'mt-lit': { px: 256, w: 110, seed: 21, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 5), [[0, '#5a9d40'], [.5, '#74b24e'], [1, '#97cb64']], 1.3);
      canopy(ctx, s, R, 1400, ['#4a8f38', '#5aa142', '#6db34c', '#8cc75c'], 'rgba(20,60,20,.3)', 'rgba(225,250,170,.55)', [2.2, 4.6]);
    } },
    'mt-shade': { px: 256, w: 110, seed: 22, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 5), [[0, '#1d4424'], [.5, '#27562b'], [1, '#336633']], 1.3);
      canopy(ctx, s, R, 1400, ['#1f4b26', '#26572a', '#2e6330', '#386e35'], 'rgba(5,20,10,.5)', 'rgba(130,180,110,.22)', [2.2, 4.6]);
    } },
    'rock-lit': { px: 256, w: 90, seed: 23, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 6), [[0, '#9d9180'], [.5, '#bdb29d'], [1, '#d9d0bd']], 1.5);
      strata(ctx, s, R, 'rgba(90,75,60,.35)', 'rgba(255,255,245,.35)');
    } },
    'rock-shade': { px: 256, w: 90, seed: 24, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 6), [[0, '#5f5649'], [.5, '#776c5c'], [1, '#8d8270']], 1.5);
      strata(ctx, s, R, 'rgba(40,32,25,.4)', 'rgba(200,190,170,.2)');
    } },
    'field-soil': { px: 256, w: 64, seed: 18, draw(ctx, s, R) {
      colourise(ctx, s, fbm(s, R, 4, 5), [[0, '#8f5f36'], [.5, '#a77446'], [1, '#bb8a58']], 1.2);
      blobs(ctx, s, R, 700, ['rgba(70,40,20,.35)', 'rgba(230,190,140,.3)'], [.6, 1.4]);
    } }
  };

  let defs = '';
  const made = {};
  for (const name in T) {
    const t = T[name], R = rng(t.seed);
    const url = paint(t.px, (ctx, s) => t.draw(ctx, s, R));
    if (!url) continue;
    made[name] = true;
    defs += `<pattern id="tx-${name}" width="${t.w}" height="${t.w}" patternUnits="userSpaceOnUse"><image href="${url}" width="${t.w}" height="${t.w}" preserveAspectRatio="none"/></pattern>`;
  }
  // rocky-top fade used by the mountains: opaque at the top of a shape, gone by 60% of its height
  defs += `<linearGradient id="tx-topfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".14" stop-color="#fff" stop-opacity=".8"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="tx-topmask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#tx-topfade)"/></mask>` +
    // soft daylight down each face: lighter at the top, slightly darker at the foot
    `<linearGradient id="tx-faceshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0b1e33" stop-opacity=".18"/></linearGradient>`;
  if (defs) A.addDefs(defs);
  // fill reference with a fallback colour if the canvas was unavailable
  A.textures = { has: n => !!made[n], fill: (n, fallback) => made[n] ? `url(#tx-${n})` : fallback };
})();
