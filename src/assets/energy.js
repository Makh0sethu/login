/* Generation + distribution assets: wind turbine, solar array, hydro powerhouse, biogas plant, substation,
   distribution poles with pole-mounted transformers, the GIS satellite, and the spatial data chain
   (field collectors, the booster ground station, radio links).
   Namespace: Assets.energy   Defs prefix: en-
   All functions return SVG strings in the local iso frame (origin = ground anchor) unless noted. P is read lazily. */
(function () {
  const A = window.Assets = window.Assets || {};
  const f = n => { const v = Math.round(n * 10) / 10; return Object.is(v, -0) ? '0' : String(v); };
  const ln = (a, b, stroke, w, extra = '') => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
  const CONCRETE = ['#eef0f2', '#d3d8dd', '#b9c0c8'];
  const STEEL = '#8d9bab';
  // text painted on a wall facing +y (runs along x): skewed to the wall from its own anchor
  const faceLabel = (x, y, z, text, color, size) => T(x, y, z, `<text font-size="${size}" font-weight="800" fill="${color}" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" transform="skewY(30)">${text}</text>`);

  A.addDefs(
    `<linearGradient id="en-tower" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef2f6"/><stop offset=".56" stop-color="#cfd8e1"/><stop offset="1" stop-color="#b9c5d1"/></linearGradient>` +
    `<linearGradient id="en-blade" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d5dee7"/></linearGradient>` +
    `<linearGradient id="en-pv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b5d9b"/><stop offset=".5" stop-color="#1f4a80"/><stop offset="1" stop-color="#173a66"/></linearGradient>` +
    `<linearGradient id="en-foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".45" stop-color="#e9b33c"/><stop offset="1" stop-color="#b9821f"/></linearGradient>` +
    `<linearGradient id="en-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe0ff" stop-opacity=".55"/><stop offset="1" stop-color="#7fe0ff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="en-dome" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9cc78a"/><stop offset=".6" stop-color="#5f9659"/><stop offset="1" stop-color="#3f6f3f"/></radialGradient>` +
    `<linearGradient id="en-pipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e9ef"/><stop offset=".5" stop-color="#a9b6c3"/><stop offset="1" stop-color="#7d8b99"/></linearGradient>`
  );

  /* ---------- wind turbine (rotor faces the viewer) ---------- */
  function windTurbine(x, y, opts = {}) {
    const h = opts.h ?? 70, L = h * .46, delay = opts.delay ?? 0, dur = opts.dur ?? 5;
    const blade = `<path d="M0 0C1.8 ${f(-L * .18)} 2.6 ${f(-L * .55)} .5 ${f(-L)}L-.5 ${f(-L)}C-1.2 ${f(-L * .6)} -1.6 ${f(-L * .2)} 0 0Z" fill="url(#en-blade)" stroke="#aebccb" stroke-width=".4"/>`;
    let s = `<ellipse rx="9" ry="3.6" fill="#0b1e33" opacity=".16"/><ellipse rx="5.5" ry="2.4" fill="#cfd5db"/>`;
    // tapered tower, door, mid-height band
    s += `<path d="M-2.8 0L-1.1 ${-h}H1.1L2.8 0Z" fill="url(#en-tower)"/>`;
    s += `<rect x="-1" y="-4.2" width="2" height="3.6" rx=".6" fill="#7d8b99"/>`;
    // nacelle (pointing at the viewer, slightly left), hub
    s += `<path d="M-2.6 ${-h - 2.4}h7.6a2.2 2.2 0 0 1 0 4.4h-7.6Z" fill="#e9eef3" stroke="#b2bfcc" stroke-width=".4"/>`;
    s += `<circle cx="6.4" cy="${-h - 2.6}" r="1" fill="#e04a3f" class="glow" style="animation-delay:${delay}s"/>`;
    s += `<g transform="translate(-2.8,${-h})"><g class="spin" style="animation-duration:${dur}s;animation-delay:${-delay}s">` +
      blade + `<g transform="rotate(120)">${blade}</g><g transform="rotate(240)">${blade}</g></g>` +
      `<circle r="2.1" fill="#f4f7fa" stroke="#aebccb" stroke-width=".5"/></g>`;
    return T(x, y, 0, s);
  }

  /* ---------- solar array: `rows` rows of tilted panels, each `len` long along x, starting at local (0,0) ---------- */
  function solarFarm(opts = {}) {
    const rows = opts.rows ?? 4, len = opts.len ?? 64, gap = opts.gap ?? 15, d = 9, zh = 8, zl = 3;
    const W = len, D = (rows - 1) * gap + d;
    let s = poly([P(-8, -8, .2), P(W + 22, -8, .2), P(W + 22, D + 8, .2), P(-8, D + 8, .2)], '#d6d0b9', 'opacity=".9"');
    s += fence(-8, -8, W + 22, -8, 6) + fence(-8, -8, -8, D + 8, 6);
    for (let j = 0; j < rows; j++) {
      const y = j * gap;
      // legs
      for (let x = 2; x < len; x += 12) s += ln(P(x, y + 1, 0), P(x, y + 1, zh - .6), '#6f7b88', .9) + ln(P(x, y + d - 1, 0), P(x, y + d - 1, zl + .4), '#6f7b88', .9);
      // panel face + front lip
      s += poly([P(0, y + d, zl), P(len, y + d, zl), P(len, y + d, zl - .9), P(0, y + d, zl - .9)], '#142c4c');
      s += poly([P(0, y, zh), P(len, y, zh), P(len, y + d, zl), P(0, y + d, zl)], 'url(#en-pv)', 'stroke="#c4d8ee" stroke-width=".5"');
      let g = '';
      for (let x = 4; x < len; x += 4) g += `M${f(P(x, y, zh)[0])} ${f(P(x, y, zh)[1])}L${f(P(x, y + d, zl)[0])} ${f(P(x, y + d, zl)[1])}`;
      const m0 = P(0, y + d / 2, (zh + zl) / 2), m1 = P(len, y + d / 2, (zh + zl) / 2);
      g += `M${f(m0[0])} ${f(m0[1])}L${f(m1[0])} ${f(m1[1])}`;
      s += `<path d="${g}" stroke="#6f9dd0" stroke-width=".35" opacity=".8"/>`;
      s += poly([P(0, y, zh), P(len, y, zh), P(len, y + d, zl), P(0, y + d, zl)], 'url(#sheen)');
    }
    // inverter + transformer kiosk
    s += box(W + 6, 4, 0, 10, 8, 8, CONCRETE) + box(W + 6, 4, 8, 10, 8, 1, C.green) + winR(W + 16, 6, 2, 4, 4, '#7d8b99');
    s += box(W + 7, 18, 0, 8, 7, 6, C.grey) + T(W + 11, 21, 7.5, `<circle r="1.6" fill="#ffcf4d" class="glow"/>`);
    s += label(W + 11, 12, 10, 'PV', '#2f6b3a', 4.5, 800);
    s += fence(-8, D + 8, W + 22, D + 8, 6) + fence(W + 22, -8, W + 22, D + 8, 6);
    return s;
  }

  /* ---------- hydro powerhouse at the foot of the falls (local 0,0 = back-left corner) ---------- */
  function hydroHouse(opts = {}) {
    const w = opts.w ?? 30, d = opts.d ?? 18, h = opts.h ?? 15;
    let s = `<ellipse cx="${f(P(w / 2, d / 2)[0])}" cy="${f(P(w / 2, d / 2)[1] + 3)}" rx="${f(w * .9)}" ry="${f(w * .32)}" fill="#0b1e33" opacity=".14"/>`;
    s += box(0, 0, 0, w, d, h, CONCRETE);
    s += box(-1, -1, h, w + 2, d + 2, 2.2, C.blue);
    // tall turbine-hall windows on the front (y = d) face, louvres on the side
    for (let i = 0; i < 4; i++) s += winL(3 + i * 7, d, 2.5, 4.5, 6.5, 'url(#glass-v)');
    for (let i = 0; i < 3; i++) s += winR(w, 3 + i * 5, 6, 3, 6, '#9aa7b4');
    s += faceLabel(w / 2, d, 10.2, 'HYDRO', '#1f5f8f', 4.4);
    // step-up transformer on the side
    s += box(w + 4, 2, 0, 9, 7, 7, ['#9fb0a4', '#7d907f', '#6b7d6e']);
    for (let i = 0; i < 3; i++) s += cyl(w + 6 + i * 2.6, 5, 7, .8, 4, C.white);
    s += T(w + 8.5, 5.5, 12, `<circle r="1.8" fill="#ffcf4d" class="glow"/>`);
    return s;
  }

  /* ---------- biogas plant: two membrane digesters, gas line, generator shed, flare ---------- */
  function biogas(opts = {}) {
    const dome = (x, y, r) => T(x, y, 0, `<ellipse rx="${r + 2}" ry="${f(r * .5 + 1)}" fill="#0b1e33" opacity=".14"/><ellipse rx="${r + .8}" ry="${f(r * .5 + .4)}" fill="#c9bfae"/>` +
      `<path d="M${-r} 0A${r} ${f(r * .82)} 0 0 1 ${r} 0A${r} ${f(r * .5)} 0 0 1 ${-r} 0Z" fill="url(#en-dome)"/>` +
      `<path d="M${f(-r * .55)} ${f(-r * .5)}q${f(r * .3)} ${f(-r * .25)} ${f(r * .7)} ${f(-r * .28)}" stroke="#d7efc8" stroke-width="1" fill="none" opacity=".7" stroke-linecap="round"/>`);
    let s = '';
    // feed pit
    s += box(-2, 22, 0, 8, 7, 2.2, ['#8a6a45', '#6e5034', '#5a412a']) + poly([P(-1, 23, 2.3), P(5, 23, 2.3), P(5, 28, 2.3), P(-1, 28, 2.3)], '#6b4f2c');
    s += dome(4, 6, 9) + dome(22, 16, 7.5);
    // gas pipe from the domes to the generator shed
    const pipe = [P(4, 6, 7), P(4, -4, 7), P(36, -4, 7), P(36, 6, 5)], pipe2 = [P(22, 16, 6), P(36, 16, 6), P(36, 6, 5)];
    [pipe, pipe2].forEach(p => { s += `<polyline points="${pts(p)}" stroke="#bf8f2c" stroke-width="1.6" fill="none" stroke-linejoin="round"/><polyline points="${pts(p)}" stroke="#ffe08a" stroke-width=".7" fill="none" class="flow"/>`; });
    // generator shed
    s += box(32, 2, 0, 14, 12, 9, CONCRETE) + box(31, 1, 9, 16, 14, 1.6, C.green) + winL(35, 14, 2, 5, 5.5, '#7d8b99');
    s += faceLabel(39, 14, 8.4, 'BIOGAS', '#2f6b3a', 3.4);
    s += cyl(44, 4, 10.6, .9, 5, C.dark) + T(44, 4, 17, `<circle r="2.2" fill="#ffffff" opacity=".5" class="puff"/>`);
    // flare stack
    s += cyl(-6, 4, 0, .9, 20, C.grey) + T(-6, 4, 20, `<path d="M0 -6C2.4 -3 2 -.6 0 0C-2 -.6 -2.4 -3 0 -6Z" fill="#f08c2a" class="glow"/><path d="M0 -3.6C1 -2 .9 -.6 0 -.2C-.9 -.6 -1 -2 0 -3.6Z" fill="#ffe27a"/>`);
    return s;
  }

  /* ---------- substation (local 0..w along x, 0..d along y). Incoming / outgoing gantries on the back corners ---------- */
  function substation(opts = {}) {
    const w = opts.w ?? 64, d = opts.d ?? 48, name = opts.name ?? 'SUBSTATION';
    let s = poly([P(-2, -2, .2), P(w + 2, -2, .2), P(w + 2, d + 2, .2), P(-2, d + 2, .2)], '#b9b3a3') + poly([P(0, 0, .3), P(w, 0, .3), P(w, d, .3), P(0, d, .3)], '#d2ccbb');
    s += fence(0, 0, w, 0, 7) + fence(0, 0, 0, d, 7);
    // steel gantries carrying the busbars
    const post = (x, y, h) => ln(P(x, y, 0), P(x, y, h), STEEL, 1.3) + ln(P(x - .8, y, 0), P(x, y, h * .7), STEEL, .6);
    [[6, 6], [6, 26], [w - 10, 6], [w - 10, 26]].forEach(([x, y]) => { s += post(x, y, 24); });
    s += ln(P(6, 6, 24), P(6, 26, 24), STEEL, 1.4) + ln(P(w - 10, 6, 24), P(w - 10, 26, 24), STEEL, 1.4);
    for (let k = 0; k < 3; k++) {
      const y = 10 + k * 6;
      s += ln(P(6, y, 21), P(w - 10, y, 21), '#5d6b78', .7);
      s += ln(P(6, y, 21), P(w - 10, y, 21), '#ffcf4d', .6, 'class="flow" opacity=".7"');
    }
    // breakers + isolators along the bay
    for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) {
      const x = 14 + i * 9, y = 10 + k * 6;
      s += box(x - 1, y - 1, 0, 2, 2, 3, C.grey) + cyl(x, y, 3, .9, 8, C.white) + ln(P(x, y, 11), P(x, y, 21), '#5d6b78', .5);
    }
    // two power transformers with radiators and bushings
    const tx = (x, y, i) => {
      let t = box(x, y, 0, 13, 10, 11, ['#9fb0a4', '#7d907f', '#6b7d6e']);
      for (let k = 1; k < 6; k++) t += ln(P(x + k * 2.2, y + 10, 1.5), P(x + k * 2.2, y + 10, 9.5), '#5d6e60', .9);
      t += box(x + 1, y + 1, 11, 11, 3, 3, ['#8ea092', '#728575', '#627464']);
      for (let k = 0; k < 3; k++) t += cyl(x + 3 + k * 3.5, y + 7, 11, 1, 6, ['#e9eef3', '#b07b55', '#9a6643']);
      return t + T(x + 6.5, y + 6, 20, `<circle r="2.2" fill="#ffcf4d" class="glow" style="animation-delay:${i * .6}s"/>`);
    };
    s += tx(12, 32, 0) + tx(32, 32, 1);
    // control room
    s += box(w - 16, d - 16, 0, 14, 12, 8, CONCRETE) + box(w - 17, d - 17, 8, 16, 14, 1.4, C.blue) + winL(w - 13, d - 4, 2, 4, 3.6, '#7bb9df') + winL(w - 7, d - 4, 2, 3, 5.5, '#7d8b99');
    s += fence(0, d, w, d, 7) + fence(w, 0, w, d, 7);
    // name board on the front fence
    s += poly([P(4, d + .2, 1.2), P(30, d + .2, 1.2), P(30, d + .2, 6.4), P(4, d + .2, 6.4)], '#ffffff', 'stroke="#1f5f8f" stroke-width=".5"');
    s += faceLabel(17, d + .2, 2.4, name, '#1f5f8f', 3.4);
    return s;
  }

  /* ---------- distribution: wooden poles, pole-mounted transformers, conductors and service drops ---------- */
  const POLE_H = 24;
  function pole(x, y, opts = {}) {
    const h = opts.h ?? POLE_H;
    let s = `<ellipse rx="3" ry="1.2" fill="#0b1e33" opacity=".14"/>`;
    s += `<path d="M0 0V${-h}" stroke="#7a5a3a" stroke-width="1.5"/><path d="M.4 0V${-h}" stroke="#5f442b" stroke-width=".5"/>`;
    s += `<path d="M-5.5 ${-h + 2}H5.5" stroke="#6e5034" stroke-width="1.2"/>`;
    s += [-5, 0, 5].map(dx => `<rect x="${dx - .6}" y="${-h + .2}" width="1.2" height="1.6" rx=".4" fill="#e9eef3"/>`).join('');
    if (opts.tx) {
      // pole-mounted transformer can + bushings
      s += `<rect x="-3.4" y="${-h + 6}" width="6.8" height="7.5" rx="1.6" fill="#b2bfcc" stroke="#7d8b99" stroke-width=".5"/><rect x="-3.4" y="${-h + 7}" width="2.6" height="5.5" fill="#dfe7ef" opacity=".7"/>` +
        `<path d="M-1.6 ${-h + 6}V${-h + 4.2}M1.6 ${-h + 6}V${-h + 4.2}" stroke="#e9eef3" stroke-width="1"/>` +
        `<circle cy="${-h + 9.5}" r="1.1" fill="#ffcf4d" class="glow" style="animation-delay:${opts.delay ?? 0}s"/>`;
    }
    return T(x, y, 0, s);
  }
  // three sagging conductors between consecutive poles (list of local [x,y]), screen offsets match the crossarm
  function poleWires(list, opts = {}) {
    const h = (opts.h ?? POLE_H) - 2, live = opts.live ?? true;
    let s = '';
    for (let i = 0; i < list.length - 1; i++) {
      const a = P(list[i][0], list[i][1], h), b = P(list[i + 1][0], list[i + 1][1], h), sag = 2.5 + Math.hypot(b[0] - a[0], b[1] - a[1]) * .03;
      [-5, 0, 5].forEach(dx => {
        const d = `M${f(a[0] + dx)} ${f(a[1])}Q${f((a[0] + b[0]) / 2 + dx)} ${f((a[1] + b[1]) / 2 + sag)} ${f(b[0] + dx)} ${f(b[1])}`;
        s += `<path d="${d}" stroke="#3f4954" stroke-width=".5" fill="none" opacity=".8"/>`;
        if (live && dx === 0) s += `<path d="${d}" stroke="#ffcf4d" stroke-width=".8" fill="none" class="flow" opacity=".7"/>`;
      });
    }
    return s;
  }
  // service drop from a pole top [x,y] to a point on a building [x,y,z]
  function drop(from, to, delay = 0, h = POLE_H) {
    const a = P(from[0], from[1], h - 3), b = P(to[0], to[1], to[2]);
    const d = `M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f(Math.max(a[1], b[1]) + 3)} ${f(b[0])} ${f(b[1])}`;
    return `<path d="${d}" stroke="#3f4954" stroke-width=".45" fill="none" opacity=".8"/><path d="${d}" stroke="#ffcf4d" stroke-width=".7" fill="none" class="flow" opacity=".75" style="animation-delay:${delay}s"/>`;
  }

  /* ---------- GIS satellite (screen space, centred on its body) + its scanning beam ---------- */
  function satellite() {
    const wing = (sx) => {
      const x0 = sx * 7, x1 = sx * 31;
      let g = `<path d="M${x0} -5L${x1} -9L${x1} 3L${x0} 7Z" fill="url(#en-pv)" stroke="#c4d8ee" stroke-width=".6"/>`;
      for (let k = 1; k < 6; k++) { const x = x0 + (x1 - x0) * k / 6, t = k / 6; g += `<path d="M${f(x)} ${f(-5 - 4 * t)}V${f(7 - 4 * t)}" stroke="#6f9dd0" stroke-width=".4"/>`; }
      g += `<path d="M${x0} 1L${x1} -3" stroke="#6f9dd0" stroke-width=".4"/><path d="M${sx * 4} 1H${x0}" stroke="#b2bfcc" stroke-width="1.2"/>`;
      return g;
    };
    let s = wing(-1) + wing(1);
    // foil-wrapped bus (a small iso box)
    s += `<path d="M-6 -6L0 -9L6 -6L6 4L0 7L-6 4Z" fill="url(#en-foil)" stroke="#a87a1e" stroke-width=".5"/><path d="M0 -3V7M-6 -6L0 -3L6 -6" stroke="#a87a1e" stroke-width=".5" fill="none"/>` +
      `<path d="M-4 -2l2 1M-4 1l2 1M2 0l2-1" stroke="#fff3c4" stroke-width=".5" opacity=".7"/>`;
    // earth-pointing dish + antenna
    s += `<path d="M0 7V10" stroke="#b2bfcc" stroke-width="1"/><ellipse cy="11.5" rx="5" ry="2" fill="#f4f7fa" stroke="#9aa9b8" stroke-width=".5"/><path d="M0 11.5V14" stroke="#7d8b99" stroke-width=".7"/>`;
    s += `<path d="M2 -8L4 -15" stroke="#9aa9b8" stroke-width=".6"/><circle cx="4" cy="-15.5" r="1" fill="#e04a3f" class="glow"/>`;
    return `<g class="bob" style="animation-duration:5s">${s}</g>`;
  }
  // beam from the satellite (0,0) down to a ground point (dx,dy) on screen, with a sweeping footprint
  function satBeam(dx, dy, rx = 46) {
    const ry = rx * .42;
    let s = `<path d="M-3 14L${f(dx - rx)} ${f(dy)}A${rx} ${f(ry)} 0 0 0 ${f(dx + rx)} ${f(dy)}L3 14Z" fill="url(#en-beam)"><animate attributeName="opacity" values=".35;.8;.35" dur="4s" repeatCount="indefinite"/></path>`;
    s += `<ellipse cx="${f(dx)}" cy="${f(dy)}" rx="${rx}" ry="${f(ry)}" fill="#7fe0ff" fill-opacity=".1" stroke="#7fe0ff" stroke-width="1.2" stroke-dasharray="4 3" opacity=".8"/>`;
    s += `<g transform="translate(${f(dx)},${f(dy)})"><g class="ring"><ellipse rx="${rx * .7}" ry="${f(ry * .7)}" fill="none" stroke="#a9ecff" stroke-width="1.2"/></g></g>`;
    // a data packet riding back up
    s += `<circle r="1.8" fill="#ffffff" stroke="#3aa8d8" stroke-width=".7"><animateMotion dur="2.4s" repeatCount="indefinite" path="M${f(dx)} ${f(dy)}L0 14"/></circle>`;
    return s;
  }

  /* ---------- spatial data: field collectors, the booster ground station, the radio links ---------- */
  // a parabolic dish in screen px around its mount point, its face turned by rot degrees (0 = facing straight up)
  function dish(r, rot = 0) {
    return `<path d="M0 0L${f(-r * .3)} ${f(r * .55)}M0 0L${f(r * .3)} ${f(r * .55)}" stroke="#7d8b99" stroke-width=".8"/>` +
      `<g transform="rotate(${rot})"><path d="M${-r} 0A${r} ${f(r * .55)} 0 0 0 ${r} 0Z" fill="#c9d3dd" stroke="#9aa9b8" stroke-width=".5"/>` +
      `<ellipse rx="${r}" ry="${f(r * .32)}" fill="#f4f7fa" stroke="#9aa9b8" stroke-width=".5"/>` +
      `<path d="M0 0V${f(-r * .8)}" stroke="#7d8b99" stroke-width=".6"/><circle cy="${f(-r * .85)}" r=".9" fill="#56626f"/></g>`;
  }
  // an expanding radio ring at an antenna tip (screen px), looping
  const pulse = (x, y, col, delay) => `<circle cx="${f(x)}" cy="${f(y)}" r="1" fill="none" stroke="${col}" stroke-width=".8">` +
    `<animate attributeName="r" values="1;7" dur="1.6s" begin="${delay}s" repeatCount="indefinite"/>` +
    `<animate attributeName="opacity" values=".9;0" dur="1.6s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
  // heights of each collector's antenna tip (local z), where its uplink starts
  const COLLECTOR_TOP = { rover: 15, logger: 23 };
  // spatial data collector at (x, y): 'rover' = a surveyor at a tripod GNSS receiver with a field tablet,
  // 'logger' = an unattended data-logger mast (solar panel, cabinet, whip antenna)
  function collector(x, y, kind = 'rover', delay = 0) {
    let s = `<ellipse rx="8" ry="3" fill="#0b1e33" opacity=".15"/>`;
    if (kind === 'rover') {
      s += `<path d="M-4.5 1L0 -11M4 1L0 -11M-.5 2.5L0 -11" stroke="#d9a53c" stroke-width=".9"/>` +
        `<rect x="-.6" y="-13" width="1.2" height="2.4" fill="#56626f"/><ellipse cy="-13.4" rx="3.2" ry="1.2" fill="#f4f7fa" stroke="#9aa9b8" stroke-width=".5"/>` +
        `<path d="M0 -14.2V-15" stroke="#56626f" stroke-width=".6"/>`;
      // the surveyor: hi-vis vest, white hard hat, tablet glowing
      s += `<g transform="translate(7,1)"><path d="M-1 -4.6L-1.2 -.4M1 -4.6L1.2 -.4" stroke="#2b3866" stroke-width="1.5" stroke-linecap="round"/>` +
        `<rect x="-2" y="-8.6" width="4" height="4.4" rx="1" fill="#f08c2a"/><path d="M-2 -6.6h4" stroke="#fff3c4" stroke-width=".55"/>` +
        `<path d="M-1.8 -7.6L-3.6 -6.4" stroke="#2b3866" stroke-width="1.1" stroke-linecap="round"/>` +
        `<rect x="-5.6" y="-7.8" width="2.6" height="1.9" rx=".3" fill="#23272c"/><rect x="-5.3" y="-7.5" width="2" height="1.3" fill="#7fe0ff" class="glow"/>` +
        `<circle cy="-9.9" r="1.45" fill="#6f4428"/><path d="M-1.7 -10.3a1.7 1.6 0 0 1 3.4 0z" fill="#ffffff"/></g>`;
    } else {
      s += `<rect x="-.7" y="-20" width="1.4" height="20" fill="#8d9bab"/>` +
        `<path d="M-6 -17L3 -21L3 -16L-6 -12Z" fill="url(#en-pv)" stroke="#c4d8ee" stroke-width=".5"/>` +
        `<rect x="-3.4" y="-10" width="5.6" height="6.4" rx=".6" fill="#e9eef3" stroke="#9aa9b8" stroke-width=".5"/><path d="M2.2 -9.4V-4.2" stroke="#b2bfcc" stroke-width=".6"/>` +
        `<circle cx="-1.6" cy="-8.4" r=".6" fill="#4f9a5d" class="glow" style="animation-delay:${delay}s"/>` +
        `<path d="M.4 -20V-23" stroke="#56626f" stroke-width=".6"/>`;
    }
    s += pulse(0, -COLLECTOR_TOP[kind], '#3aa8d8', delay);
    return T(x, y, 0, s);
  }
  // booster ground station (local frame): a fenced gravel pad with an equipment shelter, a satellite dish taking the
  // downlink and a lattice mast whose microwave dish relays to the head office. BOOSTER gives the two link ends (local x, y, z).
  const BOOSTER = { dish: [10, 10, 14], mw: [-6, -6, 52] };
  function booster() {
    const H = 60;
    let s = `<ellipse cy="2" rx="30" ry="13" fill="#0b1e33" opacity=".12"/>` +
      poly([P(-18, -16, .2), P(22, -16, .2), P(22, 22, .2), P(-18, 22, .2)], '#d3d8dd', 'stroke="#b9c0c8" stroke-width=".6"');
    s += fence(-18, -16, 22, -16, 6) + fence(-18, -16, -18, 22, 6);
    // lattice mast: tapered legs, cross bracing, red/white top bands, beacon
    const leg = z => 4.4 - 3.2 * z / H;
    let m = `<path d="M-4.4 0L-1.2 ${-H}M4.4 0L1.2 ${-H}" stroke="#8d9bab" stroke-width=".9"/>`;
    for (let z = 0; z < H - 4; z += 6) m += `<path d="M${f(-leg(z))} ${-z}L${f(leg(z + 6))} ${-z - 6}M${f(leg(z))} ${-z}L${f(-leg(z + 6))} ${-z - 6}" stroke="#b2bfcc" stroke-width=".45"/>`;
    m += `<path d="M-1.9 ${-H + 10}H1.9V${-H + 4}H-1.9Z" fill="#e04a3f"/><path d="M-1.6 ${-H + 4}H1.6V${-H}H-1.6Z" fill="#ffffff"/>` +
      `<path d="M0 ${-H}V${-H - 6}" stroke="#56626f" stroke-width=".6"/><circle cy="${-H - 6.5}" r="1.2" fill="#e04a3f" class="glow"/>`;
    // microwave drum pointing right-down towards the city, and a panel antenna
    m += `<g transform="translate(2.4,${-H + 8})"><rect x="0" y="-2.6" width="2" height="5.2" fill="#c9d3dd"/><ellipse cx="2" rx="1.6" ry="3.2" fill="#f4f7fa" stroke="#9aa9b8" stroke-width=".5"/></g>` +
      `<rect x="-4.4" y="${-H + 12}" width="1.6" height="5" rx=".4" fill="#e9eef3" stroke="#9aa9b8" stroke-width=".4"/>`;
    s += T(-6, -6, 0, m);
    // equipment shelter with a door and an aircon unit
    s += box(-14, 6, 0, 12, 10, 8, C.white) + winL(-11, 16, 0, 3, 5.6, '#7d8b99') + winR(-2, 9, 3.5, 3, 2.4, '#b2bfcc');
    // the satellite dish on its pedestal, tipped up-left at the satellite
    const [dx, dy] = P(10, 10, 6);
    s += cyl(10, 10, 0, 1.8, 6, C.grey) + `<g transform="translate(${f(dx)},${f(dy)})">${dish(8, -38)}</g>`;
    s += fence(22, -16, 22, 22, 6) + fence(-18, 22, 22, 22, 6);
    return s;
  }
  // a radio link between two screen points: a faint beam, a dashed core running a -> b and n data packets riding it
  function link(a, b, col, dur = 2.4, delay = 0, n = 2) {
    const d = `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
    let s = `<path d="${d}" stroke="${col}" stroke-width="4" opacity=".2" fill="none"/>` +
      `<path d="${d}" stroke="${col}" stroke-width="1.2" stroke-dasharray="3 4" fill="none" opacity=".95"><animate attributeName="stroke-dashoffset" from="14" to="0" dur=".8s" repeatCount="indefinite"/></path>`;
    for (let i = 0; i < n; i++) s += `<circle r="2.2" fill="#ffffff" stroke="${col}" stroke-width="1"><animateMotion dur="${dur}s" begin="${f(delay - i * dur / n)}s" repeatCount="indefinite" path="${d}"/></circle>`;
    return `<g pointer-events="none">${s}</g>`;
  }

  /* ---------- pylon inspection: pilots, charging pad, the drone and its mission ---------- */
  A.addDefs(`<linearGradient id="en-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3dffb0" stop-opacity=".6"/><stop offset="1" stop-color="#3dffb0" stop-opacity=".12"/></linearGradient>`);
  // a ZETDC lineman (same overalls, vest and white hat as Assets.crew) flying the drone: 'remote' holds the controller,
  // 'viewer' holds the monitor tablet and points up at the drone. Screen px around the feet.
  function pilot(kind = 'remote', delay = 0) {
    const arm = (a, b, c, d) => `<path d="M${a} ${b}L${c} ${d}" stroke="#2b3866" stroke-width="1.1" stroke-linecap="round" fill="none"/>`;
    const leg = (x1, x2) => `<path d="M${x1 * .8} -4.6L${x2} -.4" stroke="#2b3866" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="${x2}" cy="-.4" rx=".9" ry=".5" fill="#23272c"/>`;
    let g = `<ellipse rx="2.4" ry=".9" fill="#0b1e33" opacity=".18"/>` + leg(-1, -1) + leg(1, 1) +
      `<rect x="-2" y="-8.6" width="4" height="4.4" rx="1" fill="#f08c2a"/><path d="M-2 -6.6h4" stroke="#fff3c4" stroke-width=".55"/><path d="M-2 -4.5h4" stroke="#3a2a1c" stroke-width=".6"/>`;
    if (kind === 'phone') {      // a surveyor tagging a location: phone held out in front, screen glowing
      g += arm(-1.8, -8, -1, -6.4) + arm(1.8, -8, 1.6, -6.4) +
        `<rect x="-1.5" y="-8.6" width="3" height="3.4" rx=".5" fill="#23272c"/><rect x="-1.1" y="-8.2" width="2.2" height="2.6" fill="#7fe0ff" class="glow" style="animation-delay:${delay}s"/>`;
    } else if (kind === 'remote') {
      g += arm(-1.8, -8, -2.2, -6.2) + arm(1.8, -8, 2.2, -6.2) +
        `<rect x="-3" y="-7.2" width="6" height="2.6" rx=".6" fill="#23272c"/><circle cx="-1.6" cy="-5.9" r=".7" fill="#7d8b99"/><circle cx="1.6" cy="-5.9" r=".7" fill="#7d8b99"/>` +
        `<path d="M-2.4 -7.2L-3.4 -9.6M2.4 -7.2L3.4 -9.6" stroke="#23272c" stroke-width=".5"/><circle cx="3.4" cy="-9.8" r=".5" fill="#4f9a5d" class="glow" style="animation-delay:${delay}s"/>`;
    } else {
      g += arm(-1.8, -8, -2.2, -6) + arm(1.8, -8, 4.2, -12.4) + `<circle cx="4.2" cy="-12.4" r=".55" fill="#6f4428"/>` +
        `<rect x="-5" y="-8" width="4.6" height="3.4" rx=".5" fill="#23272c"/><rect x="-4.6" y="-7.6" width="3.8" height="2.6" fill="#7fe0ff" class="glow" style="animation-delay:${delay}s"/>`;
    }
    return g + `<circle cy="-9.9" r="1.45" fill="#6f4428"/><path d="M-1.7 -10.3a1.7 1.6 0 0 1 3.4 0z" fill="#fff"/><path d="M-2.1 -10.3h4.2" stroke="#c9d3dd" stroke-width=".5"/>`;
  }
  /* ---------- ZESA crest + the flags flown at the power stations ---------- */
  A.addDefs(`<clipPath id="en-crest-clip"><path d="M-34 -20L-34 16Q-33 36 0 48Q33 36 34 16L34 -20L18 -25L0 -21L-18 -25Z"/></clipPath>`);
  // the ZESA coat of arms redrawn as vectors (same colours as logos/zesa.png): bird on a tower over a shield of sky,
  // green land, river waves and a torch burst, with the yellow ribbon. Centred on (0, 0), about 100 wide and 140 tall.
  function zesaCrest() {
    const N = '#000080', shield = 'M-34 -20L-34 16Q-33 36 0 48Q33 36 34 16L34 -20L18 -25L0 -21L-18 -25Z';
    const star = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8, r = i % 2 ? 6 : 12; return f(18 + r * Math.cos(a)) + ' ' + f(24 + r * Math.sin(a)); }).join(' ');
    return `<g transform="translate(0,-4)">` +
      `<rect x="-6" y="-46" width="12" height="26" fill="#ffff00" stroke="${N}" stroke-width="2.4"/><ellipse cx="2" cy="-53" rx="13" ry="7" fill="#ffff00" stroke="${N}" stroke-width="2.4"/><circle cx="-8" cy="-60" r="4.6" fill="#ffff00" stroke="${N}" stroke-width="2.2"/>` +
      `<g clip-path="url(#en-crest-clip)"><rect x="-40" y="-30" width="80" height="26" fill="#00ffff"/><rect x="-40" y="-4" width="80" height="12" fill="#00ff00"/>` +
      `<rect x="-40" y="8" width="40" height="46" fill="#ffff00"/><path d="M-40 18Q-30 12 -20 18T0 18M-40 29Q-30 23 -20 29T0 29M-40 40Q-30 34 -20 40T0 40" stroke="${N}" stroke-width="3.4" fill="none"/>` +
      `<rect x="0" y="8" width="40" height="46" fill="#ff0000"/><polygon points="${star}" fill="#ffffff"/><rect x="15" y="22" width="6" height="14" fill="#ffff00" stroke="${N}" stroke-width="1.6"/></g>` +
      `<path d="${shield}" fill="none" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M-50 42Q-25 58 0 54Q25 58 50 42L50 62Q25 76 0 70Q-25 76 -50 62Z" fill="#ffff00" stroke="${N}" stroke-width="3.4" stroke-linejoin="round"/></g>`;
  }
  // charging pad (local iso frame, centred on its anchor): a dark slab with a yellow edge and the ZESA crest
  function dronePad() {
    const [bx, by] = P(0, 0, .5);
    return `<ellipse cy="1" rx="14" ry="7" fill="#0b1e33" opacity=".14"/>` +
      poly([P(-10, -10, .4), P(10, -10, .4), P(10, 10, .4), P(-10, 10, .4)], '#56626f', 'stroke="#f2c230" stroke-width=".8"') +
      poly([P(-8.4, -8.4, .5), P(8.4, -8.4, .5), P(8.4, 8.4, .5), P(-8.4, 8.4, .5)], '#f4f7fa') +
      `<g transform="translate(${f(bx)},${f(by)}) scale(.17,.1)">${zesaCrest()}</g>`;
  }
  // a pole with the Zimbabwe flag and a ZESA flag, streaming to the right and rippling (screen px around the foot of the pole)
  function flags(delay = 0) {
    const H = 34, W = 14, Hh = 9, GAP = W + 1.5, wave = (d, amp) => `<animateTransform attributeName="transform" type="skewY" values="0;${-amp};0;${amp};0" dur="2.6s" begin="${d}s" repeatCount="indefinite"/>`;
    const zim = () => {
      const colours = ['#1b8a3a', '#ffd200', '#d4211f', '#000000', '#d4211f', '#ffd200', '#1b8a3a'], sh = Hh / 7;
      return colours.map((c, i) => `<rect x="0" y="${f(i * sh)}" width="${W}" height="${f(sh + .15)}" fill="${c}"/>`).join('') +
        `<path d="M0 0L4.6 ${Hh / 2}L0 ${Hh}Z" fill="#ffffff" stroke="#000" stroke-width=".35"/><circle cx="1.5" cy="${Hh / 2}" r=".8" fill="#d4211f"/><circle cx="1.7" cy="${Hh / 2}" r=".3" fill="#ffd200"/>`;
    };
    // the ZESA flag: navy bands left and right, a white band between them with the logo centred on it
    // (logos/zesa-flag.png, logos/zesa.png (3118 x 3975) cut down to 240 px tall)
    const BAND = W * .29, WB = W - 2 * BAND, LW = WB - .4, LH = LW * 3975 / 3118;
    const zesa = () => `<rect x="0" y="0" width="${W}" height="${Hh}" fill="#2b2a6b"/><rect x="${BAND}" y="0" width="${f(WB)}" height="${Hh}" fill="#ffffff"/>` +
      `<image href="${A.url('logos/zesa-flag.png')}" x="${f((W - LW) / 2)}" y="${f((Hh - LH) / 2)}" width="${f(LW)}" height="${f(LH)}" preserveAspectRatio="xMidYMid meet"/>`;
    const pole = x => `<path d="M${x} 0V${-H - 1}" stroke="#b2bfcc" stroke-width=".9"/><circle cx="${x}" cy="${-H - 1.4}" r="1" fill="#f2c230"/>`;
    const cloth = (x, y, inner, d, amp) => `<g transform="translate(${x},${y})"><g>${wave(d, amp)}${inner}</g></g>`;
    return `<ellipse cx="3" cy="1" rx="10" ry="3" fill="#0b1e33" opacity=".16"/>` + pole(0) + pole(-GAP) +
      cloth(.4, -H, zim(), delay, 5) + cloth(.4 - GAP, -H, zesa(), delay + .7, 5);
  }
  // the quadcopter in screen px around its body: rotors flicker, a camera ball hangs underneath
  function droneBody() {
    const rotor = (x, y, d) => `<g transform="translate(${x},${y})"><ellipse rx="5.2" ry="1.9" fill="#dfe7ef" opacity=".42"/>` +
      `<g><path d="M-5 0H5" stroke="#3f4954" stroke-width=".7"/><animateTransform attributeName="transform" type="scale" values="1 1;.25 1;1 1" dur=".16s" begin="${d}s" repeatCount="indefinite"/></g><circle r=".8" fill="#56626f"/></g>`;
    return `<path d="M-9 -2.6L9 2.6M9 -2.6L-9 2.6" stroke="#3f4954" stroke-width="1.3" stroke-linecap="round"/>` +
      rotor(-9, -2.6, 0) + rotor(9, -2.6, .05) + rotor(-9, 2.6, .09) + rotor(9, 2.6, .02) +
      `<path d="M-3.4 -1.8L0 -3.8L3.4 -1.8L3.4 1.2L0 3L-3.4 1.2Z" fill="#f4f7fa" stroke="#9aa9b8" stroke-width=".5"/><path d="M-3.4 -1.8L0 -.2L3.4 -1.8M0 -.2V3" stroke="#f08c2a" stroke-width=".7" fill="none"/>` +
      `<path d="M0 3V4" stroke="#56626f" stroke-width=".8"/><circle cy="5" r="1.4" fill="#23272c" stroke="#7d8b99" stroke-width=".4"/><circle cx=".4" cy="5.2" r=".5" fill="#7fe0ff"/>` +
      `<circle cx="-2.6" cy="2" r=".7" fill="#e04a3f" class="glow"/><circle cx="2.6" cy="2" r=".7" fill="#4f9a5d" class="glow" style="animation-delay:.5s"/>`;
  }
  /* The whole inspection as one looping SMIL timeline (every part shares it, so they stay in step): the drone sits on its
     pad, rises, flies to each of o.pylons in turn and hovers over it while scanning, goes on to o.turn (if given) and comes back, lands and charges for
     2 s, lifts off again, flies away and fades out. Each pylon's top glows only while the drone is over it, with a
     tick as it moves on. o.pad = [x, y], o.pylons = [[x, y], ...] (pylon height o.h), o.away = [x, y, z].
     Returns SVG in screen px, to draw above the wires. */
  function droneMission(o) {
    const h = o.h || 46, Z = h + 18, [px, py] = o.pad, pyl = o.pylons, REST = 2.5;
    const keys = [], k = (t, x, y, z) => keys.push([t, x, y, z]), hold = [];   // hold: [arrive, leave] over each pylon
    const SPEED = 38, leg = (x0, y0, x1, y1) => Math.max(2, Math.hypot(x1 - x0, y1 - y0) / SPEED);   // world units per second
    let cx = px, cy = py;
    k(0, px, py, REST); k(2, px, py, REST); k(5, px, py, Z);
    let t = 5;
    pyl.forEach(([x, y, ph = h]) => { const ta = t + leg(cx, cy, x, y), te = ta + 2; k(ta, x, y, ph + 18); k(te, x, y, ph + 18); hold.push([ta, te]); t = te; cx = x; cy = y; });
    // optional turning point beyond the last pylon (the wind plant): the drone circles over it for a few seconds
    if (o.turn) { const [x, y, z] = o.turn, ta = t + leg(cx, cy, x, y), te = ta + 3.5; k(ta, x, y, z); k(te, x, y, z); t = te; cx = x; cy = y; }
    const tBack = t + leg(cx, cy, px, py), tLand = tBack + 2.2, tCharged = tLand + 2, tUp = tCharged + 2, tGone = tUp + 5.2, DUR = Math.ceil(tGone + 5);
    k(tBack, px, py, Z); k(tLand, px, py, REST); k(tCharged, px, py, REST); k(tUp, px, py, 36); k(tGone, ...o.away); k(DUR, ...o.away);
    const kt = fr => fr.map(q => (q[0] / DUR).toFixed(4)).join(';');
    const move = proj => `<animateTransform attributeName="transform" type="translate" calcMode="spline" values="${keys.map(q => proj(q).map(f).join(' ')).join(';')}" keyTimes="${kt(keys)}" keySplines="${Array(keys.length - 1).fill('.45 0 .55 1').join(';')}" dur="${DUR}s" repeatCount="indefinite"/>`;
    // an attribute over time: [[t, value], ...], linear between points (two close times make a jump)
    const track = (attr, pairs) => {
      const ps = pairs.slice().sort((a, b) => a[0] - b[0]);
      if (ps[0][0] > 0) ps.unshift([0, ps[0][1]]);
      if (ps[ps.length - 1][0] < DUR) ps.push([DUR, ps[ps.length - 1][1]]);
      return `<animate attributeName="${attr}" values="${ps.map(q => q[1]).join(';')}" keyTimes="${kt(ps)}" dur="${DUR}s" repeatCount="indefinite"/>`;
    };
    const charging = [[tLand, 0], [tLand + .3, 1], [tCharged - .2, 1], [tCharged + .2, 0]];
    const flying = [[0, 0], [.6, 1], [tGone - 1.8, 1], [tGone, 0]];
    let s = `<ellipse rx="7" ry="2.6" fill="#0b1e33" opacity="0">${track('opacity', flying.map(([a, v]) => [a, v * .16]))}${move(q => P(q[1], q[2], 0))}</ellipse>`;
    // glowing pylon tops: a scan box while the drone is over it, then a steady glow and a tick
    pyl.forEach(([x, y, ph = h], i) => {
      const [ta, te] = hold[i], arms = `M-2.9 -${ph - 16}L-1.2 -${ph}M2.9 -${ph - 16}L1.2 -${ph}M-11 -${ph - 8}H11M-8 -${ph - 2}H8`;
      const scanning = [[ta - .3, 0], [ta + .2, 1], [ta + .6, .5], [ta + 1, 1], [ta + 1.4, .55], [te - .1, .9], [te + .5, 0]];   // lit only while the drone is over it
      const ticked = [[te - .6, 0], [te - .2, 1], [te + .6, 1], [te + 1, 0]];
      s += T(x, y, 0, `<g opacity="0">${track('opacity', scanning)}` +
        `<rect x="-13" y="${-(ph + 5)}" width="26" height="22" rx="6" fill="#3dffb0" fill-opacity=".2" stroke="#3dffb0" stroke-width=".9" stroke-dasharray="3 2"/>` +
        `<path d="${arms}" stroke="#3dffb0" stroke-width="2" stroke-linecap="round" fill="none"/><path d="${arms}" stroke="#fff" stroke-width=".6" stroke-linecap="round" fill="none"/>` +
        `<circle cx="-11" cy="-${ph - 8}" r="1.9" fill="#fff" stroke="#3dffb0" stroke-width=".8"/><circle cx="11" cy="-${ph - 8}" r="1.9" fill="#fff" stroke="#3dffb0" stroke-width=".8"/>` +
        `<path d="M-13 0H13" stroke="#fff" stroke-width=".9" opacity=".9"><animateTransform attributeName="transform" type="translate" values="0 -${ph + 4};0 -${ph - 16};0 -${ph + 4}" dur=".9s" repeatCount="indefinite"/></path></g>` +
        `<g opacity="0" transform="translate(18,-${ph + 6})">${track('opacity', ticked)}<circle r="4.2" fill="#2fbf71" stroke="#fff" stroke-width=".8"/><path d="M-2 0l1.5 1.6 2.8-3.2" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`);
    });
    // charging ring on the pad
    s += T(px, py, 0, `<ellipse rx="9" ry="4.4" fill="none" stroke="#ffd34d" stroke-width="1.2" opacity="0">${track('opacity', charging)}<animate attributeName="rx" values="6;11;6" dur=".8s" repeatCount="indefinite"/><animate attributeName="ry" values="3;5.3;3" dur=".8s" repeatCount="indefinite"/></ellipse>`);
    // the drone: follows the keyframes, bobs, shows its scan beam while hovering and a bolt while charging
    const beam = hold.flatMap(([a, b]) => [[a - .2, 0], [a + .3, 1], [b - .1, 1], [b + .2, 0]]);
    s += `<g opacity="0">${track('opacity', flying)}${move(q => P(q[1], q[2], q[3]))}<g class="bob" style="animation-duration:1.6s">` +
      `<path d="M-2 4L-13 19Q0 24 13 19L2 4Z" fill="url(#en-scan)" opacity="0">${track('opacity', [[0, 0]].concat(beam))}</path>` + droneBody() +
      `<path d="M1 -8L-3 -1.6H-.4L-1.4 5L3 -2H.4Z" fill="#ffd34d" stroke="#b8860b" stroke-width=".4" opacity="0">${track('opacity', charging)}</path></g></g>`;
    return s;
  }

  A.energy = { windTurbine, solarFarm, hydroHouse, biogas, substation, pole, poleWires, drop, satellite, satBeam, POLE_H,
    dish, collector, COLLECTOR_TOP, booster, BOOSTER, link, pilot, dronePad, droneMission, zesaCrest, flags };
})();
