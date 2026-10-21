/* Generation + distribution assets: wind turbine, solar array, hydro powerhouse, biogas plant, substation,
   distribution poles with pole-mounted transformers, and the GIS satellite.
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

  A.energy = { windTurbine, solarFarm, hydroHouse, biogas, substation, pole, poleWires, drop, satellite, satBeam, POLE_H };
})();
