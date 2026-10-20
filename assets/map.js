/* One continuous isometric landscape for the login page.  Namespace: Assets.map, defs prefix: mp-
   Canvas is 1600x1000 (viewBox "0 0 1600 1000"); world origin sits at canvas (800,500).
   Layout: Victoria Falls on the top edge, dry Hwange plain + power station top-left, open road across the
   top centre, REF rural village top-right, Powertel city bottom-right, NOIC Msasa tanks bottom-centre,
   Mutare mountains and the Beira port/ocean bottom-left, Petrotrade stations in the suburb, city and on the ring.
   Positions are authored in canvas pixels and converted to world units with G(). Requires iso.js + asset files. */
(function () {
  const A = window.Assets = window.Assets || {};
  const CX = 800, CY = 500, K2 = 0.5773503;
  const f = n => { const v = Math.round(n * 10) / 10; return Object.is(v, -0) ? '0' : String(v); };
  // canvas px -> world (x,y) on the ground plane, and world -> canvas
  const G = (cx, cy) => { const sx = cx - CX, sy = cy - CY; return [sx * K2 + sy, sy - sx * K2]; };
  const toC = (x, y, z = 0) => { const p = P(x, y, z); return [p[0] + CX, p[1] + CY]; };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mat = () => { const o = P(0, 0, 0), ex = P(1, 0, 0), ey = P(0, 1, 0); return `matrix(${+(ex[0] - o[0]).toFixed(4)} ${+(ex[1] - o[1]).toFixed(4)} ${+(ey[0] - o[0]).toFixed(4)} ${+(ey[1] - o[1]).toFixed(4)} 0 0)`; };
  const Wg = (inner, extra = '') => `<g transform="${mat()}" ${extra}>${inner}</g>`;
  const at = (x, y, inner, extra = '') => { const p = P(x, y, 0); return `<g transform="translate(${f(p[0])},${f(p[1])})" ${extra}>${inner}</g>`; };
  const cw = list => list.map(c => G(c[0], c[1]));
  // smooth Catmull-Rom path through points
  function curve(p, closed = true) {
    const n = p.length, g = i => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  }
  const rr = (x0, y0, x1, y1, r) => `M${f(x0 + r)} ${f(y0)}H${f(x1 - r)}A${r} ${r} 0 0 1 ${f(x1)} ${f(y0 + r)}V${f(y1 - r)}A${r} ${r} 0 0 1 ${f(x1 - r)} ${f(y1)}H${f(x0 + r)}A${r} ${r} 0 0 1 ${f(x0)} ${f(y1 - r)}V${f(y0 + r)}A${r} ${r} 0 0 1 ${f(x0 + r)} ${f(y0)}Z`;
  const line = a => 'M' + a.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  const segDist = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((px - a[0]) * dx + (py - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
  const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

  A.addDefs(
    `<pattern id="mp-grass" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#8cc55c"/><path d="M2 3l.6-1.4M7 2.4l.5-1.3M4.4 8l.6-1.4M10 9.4l.5-1.2M1 11l.4-1" stroke="#76b14a" stroke-width=".7" stroke-linecap="round"/><path d="M5 4.6l.5-1.1M9.6 5.4l.4-1M2.4 6.6l.4-1" stroke="#a5d877" stroke-width=".6" stroke-linecap="round"/></pattern>` +
    `<pattern id="mp-lawn" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#9dd06a"/><path d="M0 0H10M0 5H10" stroke="#93c962" stroke-width="2.5"/></pattern>` +
    `<pattern id="mp-dry" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#d8c27f"/><path d="M2 4l.7-1.6M8.4 3l.6-1.5M5 10.4l.7-1.5M11.6 11.6l.6-1.4" stroke="#bfa35b" stroke-width=".8" stroke-linecap="round"/><circle cx="11" cy="6" r=".9" fill="#c9ad6c"/><circle cx="3" cy="12.4" r=".7" fill="#e6d49a"/><path d="M6 6.5l1.4.6 1-.8" stroke="#b9995a" stroke-width=".4" fill="none"/></pattern>` +
    `<pattern id="mp-dirt" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#d9b98a"/><circle cx="1.2" cy="1.4" r=".5" fill="#c49e6b"/><circle cx="4.2" cy="2.6" r=".4" fill="#ead2ad"/><circle cx="2.6" cy="4.6" r=".55" fill="#bf9764"/></pattern>` +
    `<pattern id="mp-crop" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#a77c4c"/><rect y="0" width="8" height="3.4" fill="#7fae4b"/><circle cx="2" cy="1.7" r="1.2" fill="#93c45a"/><circle cx="6" cy="1.7" r="1.2" fill="#93c45a"/></pattern>` +
    `<pattern id="mp-maize" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#b88a55"/><rect width="6" height="2.6" fill="#c9b04e"/><circle cx="3" cy="1.3" r="1" fill="#dcc35e"/></pattern>` +
    `<pattern id="mp-pave" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#e3e7eb"/><path d="M0 .3H16M.3 0V16" stroke="#cfd6dd" stroke-width=".6"/><circle cx="6" cy="9" r=".5" fill="#d3d9df"/></pattern>` +
    `<pattern id="mp-sea" width="40" height="22" patternUnits="userSpaceOnUse"><rect width="40" height="22" fill="#3d9ed6"/><path d="M3 6q4-2.6 8 0M22 16q4-2.6 8 0M28 4q3-2 6 0M8 17q3-2 6 0" stroke="#8fd0f2" stroke-width=".9" fill="none" stroke-linecap="round"/></pattern>` +
    `<pattern id="mp-river" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#4fb0e2"/><path d="M2 4q3-2 6 0M14 9q3-2 6 0" stroke="#9fdaf6" stroke-width=".8" fill="none" stroke-linecap="round"/></pattern>` +
    `<linearGradient id="mp-mtL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7d277"/><stop offset=".55" stop-color="#78b44f"/><stop offset="1" stop-color="#5d9d42"/></linearGradient>` +
    `<linearGradient id="mp-mtR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f9a45"/><stop offset=".6" stop-color="#3f7d38"/><stop offset="1" stop-color="#336c31"/></linearGradient>` +
    `<linearGradient id="mp-fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f8ff"/><stop offset=".6" stop-color="#bfe6fa"/><stop offset="1" stop-color="#ffffff"/></linearGradient>` +
    `<linearGradient id="mp-cliff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7f5c"/><stop offset="1" stop-color="#6e5539"/></linearGradient>` +
    `<linearGradient id="mp-rainbow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset=".25" stop-color="#ffd166"/><stop offset=".5" stop-color="#7bd88a"/><stop offset=".75" stop-color="#5ab0ff"/><stop offset="1" stop-color="#b48cff"/></linearGradient>` +
    `<radialGradient id="mp-dark"><stop offset="0" stop-color="#5f9f3e" stop-opacity=".45"/><stop offset="1" stop-color="#5f9f3e" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="mp-light"><stop offset="0" stop-color="#c4e88f" stop-opacity=".55"/><stop offset="1" stop-color="#c4e88f" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="mp-dryfade"><stop offset="0" stop-color="#e4cf8d" stop-opacity=".7"/><stop offset="1" stop-color="#e4cf8d" stop-opacity="0"/></radialGradient>`
  );

  /* ---------- artwork imported from exports/ (edited in Illustrator etc.) ----------
     List a manifest key here to draw that exported file instead of the JS asset. See docs/MAP.md. */
  const USE_EXPORTS = ['06-houses/school'];
  const swap = (name, x, y, fallback, opts) => (USE_EXPORTS.includes(name) && A.ex && A.ex.has(name)) ? A.ex.place(name, x, y, opts) : fallback();

  /* ---------- layout (world anchors) ---------- */
  const RING = 370;
  const HW = G(225, 380), REF = G(1290, 268), CITY = G(1330, 700), MSA = G(850, 730);
  const SUB = G(250, 588), BEIRA = [-26, 514], FER = [182, 424];
  const OCEAN = [[-60, 600], [40, 606], [110, 632], [168, 690], [205, 760], [228, 840], [240, 920], [246, 1060], [-60, 1060]];
  const DRY = [[-60, 90], [720, 90], [700, 190], [620, 250], [500, 300], [470, 400], [400, 470], [260, 500], [120, 480], [-60, 470]];
  /* ---------- the ring road ----------
     A rounded square at ±RING whose straight sides bend in and out. BEND holds [position along the side, offset] knots
     per side (offset > 0 = away from the card); the offset eases between knots with a cosine and is 0 at the corners.
     Keep the bends gentle (offset change / distance under ~0.3): vehicles keep their straight-axis sprites, so a steeper
     road shows them sliding sideways. Clearances: the city starts at x = 388, Hwange's pad at x = -380 (y 140..280),
     the suburb at y = 365 (x < -70), Feruka at y = 398, Victoria Falls' pool just outside the left side at y ≈ -150. */
  const RC = 70, SIDE = RING - RC;
  const SIDES = { top: [[0, -1], 0], right: [[1, 0], 1], bottom: [[0, 1], 0], left: [[-1, 0], 1] };   // outward normal, axis it runs along
  const BEND = {
    top:    [[-SIDE, 0], [-180, 26], [-30, -22], [120, 18], [228, -14], [SIDE, 0]],
    right:  [[-SIDE, 0], [-120, -24], [30, -10], [180, 24], [SIDE, 0]],
    bottom: [[-SIDE, 0], [-200, -26], [-90, 0], [20, 16], [150, -20], [SIDE, 0]],
    left:   [[-SIDE, 0], [-180, -24], [0, -18], [200, -28], [SIDE, 0]]     // inwards past Victoria Falls (the pool ends at canvas x ≈ 620)
  };
  const ease = (k, c) => {
    if (c <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (c <= k[i][0]) { const [c0, v0] = k[i - 1], [c1, v1] = k[i]; return v0 + (v1 - v0) * (1 - Math.cos(Math.PI * (c - c0) / (c1 - c0))) / 2; }
    return k[k.length - 1][1];
  };
  // ground point on a ring side at position c along it, `lat` further out (lanes, pylons)
  function side(name, c, lat = 0) {
    const [n, ax] = SIDES[name], off = RING + ease(BEND[name], c) + lat;
    return ax ? [n[0] * off, c] : [c, n[1] * off];
  }
  // a lane along one side from c0 to c1 (the direction of travel)
  const lane = (name, c0, c1, lat) => { const n = Math.ceil(Math.abs(c1 - c0) / 6), out = []; for (let i = 0; i <= n; i++) out.push(side(name, c0 + (c1 - c0) * i / n, lat)); return out; };
  const RING_PTS = (() => {
    const out = [];
    const arc = (cx, cy, a0) => { for (let a = 0; a < 90; a += 5) { const r = (a0 + a) * Math.PI / 180; out.push([cx + RC * Math.cos(r), cy + RC * Math.sin(r)]); } };
    for (let c = -SIDE; c < SIDE; c += 6) out.push(side('top', c));
    arc(SIDE, -SIDE, -90);
    for (let c = -SIDE; c < SIDE; c += 6) out.push(side('right', c));
    arc(SIDE, SIDE, 0);
    for (let c = SIDE; c > -SIDE; c -= 6) out.push(side('bottom', c));
    arc(-SIDE, SIDE, 90);
    for (let c = SIDE; c > -SIDE; c -= 6) out.push(side('left', c));
    arc(-SIDE, -SIDE, 180);
    return out;
  })();
  // the Beira port road winds down from the ring to the quay: x as a function of y
  const PORT_K = [[side('bottom', -60)[1], -60], [440, -46], [530, -74], [600, -60]];
  const portX = y => ease(PORT_K, y);
  const portLane = (y0, y1, lat) => { const n = Math.ceil(Math.abs(y1 - y0) / 6), out = []; for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; out.push([portX(y) + lat, y]); } return out; };

  /* branch roads (world polylines); the ring is RING_PTS. No dead ends: every road joins another one, runs off the
     map, or ends at the gate of the place it serves (Hwange, the depot, the quay). The REF village has no road: its
     ZESA truck drives a loop over open ground inside the village (see ref()). */
  const ROADS = [
    [side('left', 210), [HW[0] + 70, 210]],                           // into Hwange (ends at the plant gate)
    [side('right', CITY[1]), [CITY[0] + 380, CITY[1]]],               // city high street, out to the map edge
    [[SUB[0] - 260, SUB[1] + 60], [portX(SUB[1] + 60), SUB[1] + 60]], // suburb street, from off the left edge to the port road
    portLane(PORT_K[0][0], 600, 0),                                   // to Beira port
    [[MSA[0] + 10, MSA[1] + 30], side('bottom', MSA[0] + 10)]         // depot gate
  ];
  /* city street grid, local to CITY. It carries on past the town towards the right edge of the map
     (in local units the screen's right edge is at x - y ≈ 312 and its bottom at x + y ≈ 600, so streets run past those) */
  const CITY_ST = [
    [[-136, -130], [230, -130]], [[side('right', CITY[1] + 120)[0] - CITY[0], 120], [470, 120]], [[10, 240], [400, 240]],  // along x (high street y = 0 is ROADS[1])
    [[-90, -130], [-90, 120]], [[10, -130], [10, 240]], [[100, -260], [100, 560]],                     // town cross streets
    [[190, -170], [190, 460]], [[280, -80], [280, 360]], [[370, 10], [370, 260]]                       // out-of-town cross streets
  ];
  // out-of-town blocks with houses and gardens: [x0, y0, x1, y1]
  const CITY_RES = [[20, 250, 90, 320], [110, 250, 180, 320], [200, -120, 270, -10], [200, 130, 270, 230], [200, 250, 270, 320],
    [290, 10, 360, 110], [290, 130, 360, 230], [290, 250, 360, 320], [380, 130, 450, 230]];
  const PIPE = [[BEIRA[0] + 12, BEIRA[1] + 6], [150, BEIRA[1] + 6], [150, 190], [MSA[0] - 48, 190]];
  /* power lines: each a list of pylons, starting at Hwange power station (or at a pylon of a line it branches from) and
     running out to a region or off the edge of the map, so the flowing wires carry power out across the map */
  const loc = (o, x, y) => [o[0] + x, o[1] + y];
  const LINE_REF = [side('left', 130, 32), side('left', 40, 32), side('left', -60, 32), side('left', -260, 32), [-380, -380],
    side('top', -260, 32), side('top', -150, 32), side('top', -40, 32), loc(REF, -91, 75)];       // round the outside of the ring to the village
  const SOUTH = [HW[0] + 50, HW[1] + 84];                                                         // Hwange's south yard
  const LINE_MAIN = [SOUTH, [-325, 325], side('bottom', -230, -34), side('bottom', -120, -34), side('bottom', -10, -34), side('bottom', 100, -34),
    side('bottom', 200, -34), [325, 325], side('right', 230, -34), side('right', 120, -34), side('right', 10, -34), side('right', -100, -34), side('right', -200, -34),
    loc(CITY, -110, -155), loc(CITY, -10, -155), loc(CITY, 90, -155), loc(CITY, 232, -155), loc(CITY, 330, -155)];   // inside the ring, then through town off the right edge
  const LINES = [
    LINE_REF,
    LINE_MAIN,
    [loc(REF, -91, 75), loc(REF, 50, 96), loc(REF, 200, 10), loc(REF, 300, -40), loc(REF, 400, -90)],                 // on past the village, off the top right
    [SOUTH, [-430, 390], [-500, 425], [-570, 440]],                                                                    // past the suburb, off the left edge
    [[HW[0] - 108, HW[1] + 24], [HW[0] - 208, HW[1] + 28], [HW[0] - 308, HW[1] + 33]],                                 // west from Hwange, off the left edge
    [side('bottom', 200, -34), loc(MSA, 70, 40)],                                                                      // NOIC Msasa depot
    [side('bottom', 100, -34), [230, 400], [222, 470], [180, 560], [60, 578], [-35, 580]],                             // Feruka, then Beira port
    [[222, 470], [260, 600], [290, 740], [310, 860]]                                                                   // down the coast, off the bottom
  ];
  const PYLONS = LINES.flat().filter((p, i, a) => a.findIndex(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1) === i);

  /* ---------- small props ---------- */
  function pine(k, R) {
    const h = 20 * k, w = 7 * k, c = R() < .5 ? ['#3f8f45', '#2b6e36'] : ['#4c9a48', '#317a39'];
    return `<ellipse rx="${f(w * 1.1)}" ry="${f(w * .42)}" fill="#0b1e33" opacity=".16"/><rect x="-.9" y="${f(-4 * k)}" width="1.8" height="${f(4 * k)}" fill="#7a5a3a"/>` +
      `<path d="M0 ${f(-h)}L${f(w)} ${f(-3 * k)}L0 ${f(-2 * k)}Z" fill="${c[1]}"/><path d="M0 ${f(-h)}L${f(-w)} ${f(-3 * k)}L0 ${f(-2 * k)}Z" fill="${c[0]}"/>` +
      `<path d="M0 ${f(-h * 1.08)}L${f(w * .7)} ${f(-h * .5)}L0 ${f(-h * .45)}Z" fill="${c[1]}"/><path d="M0 ${f(-h * 1.08)}L${f(-w * .7)} ${f(-h * .5)}L0 ${f(-h * .45)}Z" fill="#5fae55"/>`;
  }
  function roundTree(k, R) {
    const g = R() < .5 ? ['#5aa84f', '#3f8a43', '#78c062'] : ['#66b04f', '#468f3c', '#8acb67'];
    return `<ellipse rx="${f(8 * k)}" ry="${f(3.2 * k)}" fill="#0b1e33" opacity=".16"/><rect x="-1.2" y="${f(-9 * k)}" width="2.4" height="${f(9 * k)}" fill="#86643f"/>` +
      `<circle cy="${f(-15 * k)}" r="${f(8 * k)}" fill="${g[1]}"/><circle cx="${f(-2.6 * k)}" cy="${f(-17 * k)}" r="${f(6 * k)}" fill="${g[0]}"/><circle cx="${f(-3.6 * k)}" cy="${f(-19.5 * k)}" r="${f(2.6 * k)}" fill="${g[2]}"/>`;
  }
  function acacia(k) {
    return `<ellipse rx="${f(10 * k)}" ry="${f(3 * k)}" fill="#0b1e33" opacity=".14"/><path d="M0 0L.6 ${f(-10 * k)}M.4 ${f(-7 * k)}L${f(-4 * k)} ${f(-12 * k)}M.5 ${f(-8 * k)}L${f(4 * k)} ${f(-12.5 * k)}" stroke="#6e5034" stroke-width="${f(1.4 * k)}" fill="none" stroke-linecap="round"/>` +
      `<ellipse cy="${f(-13.5 * k)}" rx="${f(11 * k)}" ry="${f(3.6 * k)}" fill="#5f8f3a"/><ellipse cx="${f(-2 * k)}" cy="${f(-14.6 * k)}" rx="${f(7.5 * k)}" ry="${f(2.2 * k)}" fill="#7eab4a"/>`;
  }
  function baobab(k) {
    return `<ellipse rx="${f(10 * k)}" ry="${f(3.4 * k)}" fill="#0b1e33" opacity=".16"/><path d="M${f(-4.5 * k)} 0C${f(-4 * k)} ${f(-8 * k)} ${f(-3 * k)} ${f(-14 * k)} ${f(-2.6 * k)} ${f(-17 * k)}L${f(2.6 * k)} ${f(-17 * k)}C${f(3 * k)} ${f(-14 * k)} ${f(4 * k)} ${f(-8 * k)} ${f(4.5 * k)} 0Z" fill="#9b7e63"/>` +
      `<path d="M${f(1 * k)} 0C${f(1.6 * k)} ${f(-8 * k)} ${f(2 * k)} ${f(-14 * k)} ${f(2.6 * k)} ${f(-17 * k)}L${f(4.5 * k)} 0Z" fill="#7d624b"/>` +
      `<path d="M${f(-2 * k)} ${f(-16 * k)}l${f(-5 * k)} ${f(-4 * k)}M0 ${f(-17 * k)}v${f(-5 * k)}M${f(2 * k)} ${f(-16 * k)}l${f(5 * k)} ${f(-3.5 * k)}" stroke="#8a6d52" stroke-width="${f(1.3 * k)}" stroke-linecap="round"/>` +
      `<ellipse cx="${f(-7 * k)}" cy="${f(-21 * k)}" rx="${f(4 * k)}" ry="${f(2.2 * k)}" fill="#7da24a"/><ellipse cy="${f(-23 * k)}" rx="${f(4.5 * k)}" ry="${f(2.4 * k)}" fill="#8fb556"/><ellipse cx="${f(7 * k)}" cy="${f(-20 * k)}" rx="${f(4 * k)}" ry="${f(2.2 * k)}" fill="#6f9442"/>`;
  }
  const bush = (k, col = '#5c9e45') => `<ellipse cx="0" cy="0" rx="${f(5 * k)}" ry="${f(2 * k)}" fill="#0b1e33" opacity=".13"/><circle cx="${f(-2 * k)}" cy="${f(-2.4 * k)}" r="${f(3 * k)}" fill="${col}"/><circle cx="${f(2 * k)}" cy="${f(-2 * k)}" r="${f(2.6 * k)}" fill="#4a8a3b"/><circle cx="${f(-2.8 * k)}" cy="${f(-3.4 * k)}" r="${f(1.2 * k)}" fill="#8ccc68"/>`;

  function pylon(x, y, h = 46) {
    return at(x, y, `<ellipse rx="7" ry="2.6" fill="#0b1e33" opacity=".12"/><path d="M-6 0L-1.2 -${h}M6 0L1.2 -${h}M-5 -8L4.4 -16L-3.8 -24L3.2 -32L-2.6 -40M5 -8L-4.4 -16L3.8 -24L-3.2 -32L2.6 -40M-11 -${h - 8}H11M-8 -${h - 2}H8" stroke="#7d8b99" stroke-width="1.2" fill="none"/>` +
      `<circle cx="-11" cy="-${h - 8}" r="1.3" fill="#c9d3dd"/><circle cx="11" cy="-${h - 8}" r="1.3" fill="#c9d3dd"/>`);
  }
  function wires(list, h = 46) {
    let s = '';
    for (let i = 0; i < list.length - 1; i++) {
      for (const dx of [-11, 11]) {
        const a = P(list[i][0], list[i][1], h - 8), b = P(list[i + 1][0], list[i + 1][1], h - 8);
        const d = `M${f(a[0] + dx)} ${f(a[1])}Q${f((a[0] + b[0]) / 2 + dx)} ${f((a[1] + b[1]) / 2 + 9)} ${f(b[0] + dx)} ${f(b[1])}`;
        s += `<path d="${d}" stroke="#5d6b78" stroke-width=".7" fill="none" opacity=".75"/>`;
        if (dx > 0) s += `<path d="${d}" stroke="#ffcf4d" stroke-width="1.4" fill="none" class="flow" opacity=".85"/>`;
      }
    }
    return s;
  }
  // vehicle that fades in/out at the ends of its straight run
  const fade = (inner, dur, begin) => `<g opacity="0">${inner}<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.07;.93;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;

  /* ---------- traffic ----------
     drive(items, kind, spec, pts, dur, begin): a 'car' (Assets.cars spec) or 'truck' (tanker spec) drives the world
     polyline pts at a steady speed. Sprites exist for the four axis headings only, so each run of the route that keeps
     one heading (a leg) shows the matching sprite: routes can turn corners, but should keep to gentle curves within a leg.
     Tankers are only drawn facing +x and +y, so give their routes in those directions. So that the vehicle passes in
     front of / behind whatever it drives by, every leg is cut into short pieces that each go into `items` at their own
     depth; each piece shows the moving sprite only while the vehicle is on its stretch.
     stops ({ pointIndex: seconds }) parks the vehicle at those route points; a route that ends where it starts loops
     without fading. */
  let vdefs = '', vn = 0;
  const PIECE = 45;
  const heading = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1]; return Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 1 : 3) : (dx >= 0 ? 0 : 2); };   // 0 +x, 1 +y, 2 -x, 3 -y
  // when a vehicle paced along the screen path pts reaches / leaves each point (s from its begin), given its stops
  function schedule(pts, dur, stops = {}) {
    const S = pts.map(p => P(p[0], p[1], 0)), cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
    const total = cum[cum.length - 1], parked = Object.values(stops).reduce((a, w) => a + w, 0), travel = dur - parked;
    const arrive = [], depart = [];
    let waited = 0;
    cum.forEach((c, i) => { arrive.push(c / total * travel + waited); waited += stops[i] || 0; depart.push(arrive[i] + (stops[i] || 0)); });
    return { cum, total, parked, arrive, depart };
  }
  function drive(items, kind, spec, pts, dur, begin, stops = {}) {
    const keep = pts.map((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-6);
    stops = Object.fromEntries(Object.entries(stops).map(([i, w]) => [keep.slice(0, +i + 1).filter(Boolean).length - 1, w]));
    pts = pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-6);
    const S = pts.map(p => P(p[0], p[1], 0)), wl = [0];
    for (let i = 1; i < pts.length; i++) wl.push(wl[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = wl[wl.length - 1], { cum, total, parked, arrive, depart } = schedule(pts, dur, stops), wait = i => stops[i] || 0;
    // tm maps a path fraction to the time the vehicle leaves it
    const tm = t => {
      if (!parked) return t;
      const d = t * total;
      let i = 1; while (i < cum.length - 1 && cum[i] < d - 1e-6) i++;
      if (Math.abs(d - cum[i]) < 1e-6) return depart[i] / dur;
      const u = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      return (depart[i - 1] + (arrive[i] - depart[i - 1]) * u) / dur;
    };
    const loop = Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-6;
    // legs: runs of segments with the same heading
    const legs = [];
    for (let i = 1; i < pts.length; i++) {
      const h = heading(pts[i - 1], pts[i]), last = legs[legs.length - 1];
      if (last && last.h === h) last.i1 = i; else legs.push({ h, i0: i - 1, i1: i });
    }
    // one sprite per heading used
    const ids = {};
    legs.forEach(({ h }) => {
      if (ids[h]) return;
      const alongY = h % 2 === 1, dir = h < 2 ? 1 : -1;
      if (kind === 'truck' && dir < 0) console.warn('map: tankers only face +x / +y, reverse this route', spec, pts[0], pts[pts.length - 1]);
      const o = Object.assign({}, spec, { dir, mirror: alongY });
      const v = parked ? 0 : len / dur, body = kind === 'truck' ? A.trucks.sprite(o, v) : A.cars.sprite(o, v);
      ids[h] = 'mp-v' + vn++;
      vdefs += `<g id="${ids[h]}">${alongY ? `<g transform="scale(-1,1)">${body}</g>` : body}</g>`;
    });
    // world point at a fraction of the screen path (animateMotion is paced along it)
    const atT = t => {
      const d = t * total;
      let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
      const u = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    };
    const timing = `dur="${dur}s" begin="${begin}s" repeatCount="indefinite"`;
    const keys = [];
    if (parked) cum.forEach((c, i) => { keys.push([c / total, arrive[i] / dur]); if (wait(i)) keys.push([c / total, depart[i] / dur]); });
    const kf = v => +Math.min(1, v).toFixed(4);
    const paced = parked ? `calcMode="linear" keyPoints="${keys.map(q => kf(q[0])).join(';')}" keyTimes="${keys.map(q => kf(q[1])).join(';')}"` : '';
    const motion = `<animateMotion ${timing} ${paced} path="M${S.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}"/>`;
    const k = v => +v.toFixed(4), single = legs.length === 1 && Math.round(len / PIECE) <= 1;
    legs.forEach(({ h, i0, i1 }) => {
      const a = cum[i0] / total, b = cum[i1] / total, n = Math.max(1, Math.round((wl[i1] - wl[i0]) / PIECE));
      for (let j = 0; j < n; j++) {
        const t0 = a + (b - a) * j / n, t1 = a + (b - a) * (j + 1) / n;
        let g = `<g><use href="#${ids[h]}"/>${motion}</g>`;
        if (!single) {
          const first = t0 < 1e-6, last = t1 > 1 - 1e-6, s0 = tm(t0), s1 = tm(t1);
          const [vals, keys] = first ? ['visible;hidden', `0;${k(s1)}`] : last ? ['hidden;visible', `0;${k(s0)}`] : ['hidden;visible;hidden', `0;${k(s0)};${k(s1)}`];
          g = `<g visibility="hidden">${g}<animate attributeName="visibility" values="${vals}" keyTimes="${keys}" calcMode="discrete" ${timing}/></g>`;
        }
        if (!loop && (tm(t0) < .07 || tm(t1) > .93)) g = fade(g, dur, begin);
        const m = atT((t0 + t1) / 2);
        items.push([m[0] + m[1], g]);
      }
    });
  }

  /* ---------- mountains (screen space, base at a canvas point) ---------- */
  function peak(x, y, w, h, R, tone = 0) {
    const pk = [x + w * (R() - .5) * .16, y - h];
    const L = [x - w / 2, y], Rt = [x + w / 2, y];
    const v = [pk[0] + w * (.04 + R() * .06), y + 1];
    const tex = A.textures && A.textures.has('mt-lit');
    const lit = tex ? 'url(#tx-mt-lit)' : tone ? '#6aa74a' : 'url(#mp-mtL)', shd = tex ? 'url(#tx-mt-shade)' : tone ? '#356f33' : 'url(#mp-mtR)';
    // concave lower slopes, rounded shoulders near the top
    const lPath = `M${f(L[0])} ${f(L[1])}C${f(x - w * .4)} ${f(y - h * .42)} ${f(pk[0] - w * .26)} ${f(pk[1] + h * .1)} ${f(pk[0] - w * .08)} ${f(pk[1] + h * .02)}Q${f(pk[0])} ${f(pk[1] - 2)} ${f(pk[0] + w * .03)} ${f(pk[1] + h * .01)}` +
      `C${f(pk[0] + w * .02)} ${f(pk[1] + h * .4)} ${f(v[0] - w * .06)} ${f(y - h * .3)} ${f(v[0])} ${f(v[1])}Z`;
    const rPath = `M${f(pk[0] + w * .03)} ${f(pk[1] + h * .01)}C${f(pk[0] + w * .26)} ${f(pk[1] + h * .12)} ${f(x + w * .4)} ${f(y - h * .4)} ${f(Rt[0])} ${f(Rt[1])}L${f(v[0])} ${f(v[1])}` +
      `C${f(v[0] - w * .06)} ${f(y - h * .3)} ${f(pk[0] + w * .02)} ${f(pk[1] + h * .4)} ${f(pk[0] + w * .03)} ${f(pk[1] + h * .01)}Z`;
    let s = `<path d="${lPath}" fill="${lit}"/><path d="${rPath}" fill="${shd}"/>`;
    if (tex) {
      // granite showing through near the summit, fading into the forest lower down
      s += `<path d="${lPath}" fill="url(#tx-rock-lit)" mask="url(#tx-topmask)"/><path d="${rPath}" fill="url(#tx-rock-shade)" mask="url(#tx-topmask)"/>`;
      s += `<path d="${lPath}" fill="url(#tx-faceshade)"/><path d="${rPath}" fill="url(#tx-faceshade)"/>`;
    } else {
      s += `<path d="M${f(pk[0] - w * .05)} ${f(pk[1] + h * .04)}Q${f(pk[0])} ${f(pk[1] - 1)} ${f(pk[0] + w * .03)} ${f(pk[1] + h * .03)}L${f(pk[0] + w * .02)} ${f(pk[1] + h * .22)}L${f(pk[0] - w * .1)} ${f(pk[1] + h * .2)}Z" fill="#c9bea6"/>`;
    }
    // far shoulders sit back in the haze
    if (tone) s += `<path d="${lPath}${rPath}" fill="#cfe6f2" opacity=".1"/>`;
    s += `<path d="${lPath}" fill="none" stroke="#173d20" stroke-opacity=".22" stroke-width=".8"/>`;
    // ridge highlight + gullies
    s += `<path d="M${f(pk[0] + w * .03)} ${f(pk[1] + h * .03)}C${f(pk[0] + w * .02)} ${f(pk[1] + h * .4)} ${f(v[0] - w * .06)} ${f(y - h * .3)} ${f(v[0])} ${f(v[1])}" stroke="#fff" stroke-opacity=".18" stroke-width="1" fill="none"/>`;
    s += `<path d="M${f(pk[0] - w * .12)} ${f(pk[1] + h * .3)}q${f(-w * .04)} ${f(h * .2)} ${f(-w * .1)} ${f(h * .32)}M${f(pk[0] + w * .14)} ${f(pk[1] + h * .34)}q${f(w * .05)} ${f(h * .18)} ${f(w * .12)} ${f(h * .3)}" stroke="#000" stroke-opacity=".12" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    return s;
  }
  function mountain(cx, cy, w, h, seed) {
    const R = rng(seed), x = cx - CX, y = cy - CY;
    let s = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w * .85)}" ry="${f(w * .24)}" fill="url(#mp-dark)"/>` +
      `<ellipse cx="${f(x + 6)}" cy="${f(y + 2)}" rx="${f(w * .62)}" ry="${f(w * .13)}" fill="#0b1e33" opacity=".16"/>`;
    // shoulder peaks behind, then the main peak, then a low foothill in front
    s += peak(x - w * .32, y - 4, w * .55, h * .62, R, 1) + peak(x + w * .34, y - 3, w * .5, h * .55, R, 1);
    s += peak(x, y, w, h, R);
    s += peak(x - w * .18, y + 3, w * .42, h * .3, R);
    let tr = '';
    for (let i = 0; i < Math.round(w / 12); i++) {
      const t = R(), side = R() < .5 ? -1 : 1;
      const tx = x + side * t * w * .5, ty = y + 2 - h * (.04 + R() * .22) * (1 - t);
      tr += `<g transform="translate(${f(tx)},${f(ty)})">${pine(.45 + R() * .25, R)}</g>`;
    }
    return s + tr;
  }

  /* rects: [x0, y0, x1, y1] canvas boxes the mountain body must stay out of (the sign-in card).
     Mountains are tall screen-space shapes, so anything on the ground behind them is hidden. Keep every road,
     the pipeline and the listed obstacles out of each silhouette: try the wanted spot, then the nearest clear spot
     (spiralling out up to `reach` px), shrinking the mountain if nothing fits. list: [cx, cy, w, h, seed] in canvas px.
     avoid: [cx, cy, rx, ry] canvas ellipses (tank farms, villages...). Returns the placed list. */
  function placeMountains(list, { box, avoid = [], rects = [], reach = 140, clear = 15 }) {
    const [bx0, by0, bx1, by1] = box, pts = [];
    for (const l of roadLines().filter(l => l !== PIPE_LINE)) for (let i = 0; i < l.length - 1; i++) {
      const a = toC(l[i][0], l[i][1]), b = toC(l[i + 1][0], l[i + 1][1]), n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5));
      for (let k = 0; k <= n; k++) { const p = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]; if (p[0] > bx0 - 200 && p[0] < bx1 + 200 && p[1] > by0 - 220 && p[1] < by1 + 40) pts.push(p); }
    }
    // silhouette: base half-width .62w tapering to the peak, plus the road half-width + clearance
    const inside = (px, py, cx, cy, w, h, pad) => { const up = cy - py; if (py > cy + 8 + pad || up > h + pad) return false; return Math.abs(px - cx) < .62 * w * Math.pow(1 - Math.min(1, Math.max(0, up) / h), .9) + pad; };
    const out = [];
    // peaks may overlap into a range, but not stack on the same spot
    const crowd = (cx, cy, w) => out.some(m => Math.abs(cx - m[0]) < .32 * (w + m[2]) && Math.abs(cy - m[1]) < 34);
    const hits = (cx, cy, w, h) => crowd(cx, cy, w) || pts.some(([px, py]) => inside(px, py, cx, cy, w, h, clear)) ||
      avoid.some(([ax, ay, rx, ry]) => [[0, 0], [-.4, 0], [.4, 0], [0, -.4], [-.25, -.2], [.25, -.2]].some(([u, v]) => (((cx + u * w) - ax) / rx) ** 2 + (((cy + v * h) - ay) / ry) ** 2 < 1)) ||
      rects.some(([x0, y0, x1, y1]) => cx + .42 * w > x0 && cx - .42 * w < x1 && cy > y0 && cy - .75 * h < y1) ||
      cx - .62 * w < bx0 || cx + .62 * w > bx1 || cy - h < by0 || cy > by1;
    for (const [cx, cy, w, h, sd] of list) {
      let got = null;
      for (const k of [1, .88, .76, .66, .56]) {
        const W = w * k, H = h * k;
        for (let r = 0; r <= reach && !got; r += 6) {
          for (let a = 0; a < 360 && !got; a += r ? Math.max(8, 360 / (r / 3)) : 360) {
            const x = cx + r * Math.cos(a * Math.PI / 180), y = cy + r * .6 * Math.sin(a * Math.PI / 180);
            if (!hits(x, y, W, H)) got = [x, y, W, H, sd];
          }
        }
        if (got) break;
      }
      if (got) out.push(got);
    }
    return out;
  }

  /* ---------- Victoria Falls (screen space) ---------- */
  function falls() {
    const S = (cx, cy) => [cx - CX, cy - CY];
    const p = (a) => a.map(c => S(c[0], c[1]));
    let s = '';
    // gorge walls + pool under the curtain
    s += `<path d="${curve(p([[410, 186], [600, 170], [620, 200], [612, 226], [560, 240], [470, 244], [418, 232], [404, 210]]))}" fill="url(#mp-cliff)"/>`;
    // gorge river: starts inside the pool (the pool covers its head) and cuts through the rim on its way west
    const gorge = curve(cw([[478, 228], [430, 228], [372, 236], [310, 222], [240, 236], [168, 218], [90, 230], [20, 214], [-60, 222]]), false);
    s += Wg(`<path d="${gorge}" stroke="#8f7454" stroke-width="30" fill="none" stroke-linecap="round"/><path d="${gorge}" stroke="#3a8fc4" stroke-width="16" fill="none" stroke-linecap="round"/>` +
      `<path d="${gorge}" stroke="#a9dcf5" stroke-width="1.4" fill="none" class="flow" opacity=".7"/>`);
    s += `<path d="${curve(p([[426, 212], [596, 196], [604, 214], [560, 230], [470, 234], [428, 226]]))}" fill="#3a8fc4"/>`;
    // curtain
    const lip = p([[425, 184], [470, 180], [520, 176], [560, 173], [596, 170]]);
    const bot = lip.map(q => [q[0], q[1] + 27]);
    s += `<path d="M${lip.map(q => f(q[0]) + ' ' + f(q[1])).join('L')}L${bot.slice().reverse().map(q => f(q[0]) + ' ' + f(q[1])).join('L')}Z" fill="url(#mp-fall)"/>`;
    for (let i = 0; i < 16; i++) {
      const k = i / 15, x = lip[0][0] + (lip[4][0] - lip[0][0]) * k, y = lip[0][1] + (lip[4][1] - lip[0][1]) * k;
      s += `<path d="M${f(x)} ${f(y + 1)}v25" stroke="${i % 2 ? '#ffffff' : '#a9dcf5'}" stroke-width="${i % 3 ? 1.1 : 1.8}" class="flow" style="animation-duration:${(.6 + (i % 4) * .12).toFixed(2)}s"/>`;
    }
    s += `<path d="M${lip.map(q => f(q[0]) + ' ' + f(q[1])).join('L')}" stroke="#ffffff" stroke-width="2" fill="none" opacity=".9"/>`;
    // spray + rainbow
    for (let i = 0; i < 7; i++) {
      const [mx, my] = S(440 + i * 24, 206 - i * 2);
      s += `<circle cx="${f(mx)}" cy="${f(my)}" r="${6 + (i % 3) * 2}" fill="#ffffff" opacity=".5" class="puff" style="animation-delay:${(i * .55).toFixed(2)}s;animation-duration:3.4s"/>`;
    }
    const [r0x, r0y] = S(455, 214), [r1x, r1y] = S(585, 202);
    s += `<path d="M${f(r0x)} ${f(r0y)}Q${f((r0x + r1x) / 2)} ${f(r0y - 70)} ${f(r1x)} ${f(r1y)}" stroke="url(#mp-rainbow)" stroke-width="5" fill="none" opacity=".3"/>`;
    return s;
  }

  /* ---------- regions (local coordinates around an anchor) ---------- */
  function hwange() {
    const S = A.silos;
    let s = '';
    s += S.coalPile(-74, 34, { w: 30, d: 20, h: 10 }) + S.coalPile(-40, 40, { w: 26, d: 16, h: 9 });
    s += S.coolingTower(-66, -38, { r: 15, h: 46 });
    s += S.coolingTower(-74, -4, { r: 15, h: 46 });
    s += S.stack(-36, -56, { h: 78, bands: true });
    s += S.boilerHouse(-30, -64, 16, 14, 34, { ductTo: [-36, -56] });
    s += box(-8, -54, 0, 28, 32, 24, C.white) + box(-8, -54, 24, 28, 32, 3, C.blue);
    s += winL(-2, -22, 7, 8, 9, '#7bb9df') + winL(10, -22, 7, 7, 9, '#7bb9df');
    s += label(6, -22, 4.5, 'HWANGE', '#256a9c', 4.2, 800);
    s += S.plantSilos(52, -42, { n: 3 });
    s += S.coalPile(4, 26, { w: 32, d: 18, h: 11 });
    // substation yard + control room
    s += fence(28, -2, 62, -2) + fence(62, -2, 62, 22) + fence(28, 22, 62, 22);
    [32, 44].forEach((xx, i) => { s += box(xx, 4, 0, 8, 8, 9, C.grey) + cyl(xx + 2, 6, 9, 1.3, 6, C.white) + cyl(xx + 5.5, 9, 9, 1.3, 6, C.white) + T(xx + 4, 8, 17, `<circle r="2" fill="#ffcf4d" class="glow" style="animation-delay:${i * .4}s"/>`); });
    s += box(-20, 42, 0, 18, 12, 10, C.white) + box(-21, 41, 10, 20, 14, 2, C.grey) + winL(-16, 54, 3, 4, 4, '#7bb9df') + winL(-9, 54, 3, 4, 4, '#7bb9df');
    s += `<polyline points="${pts([P(16, -30, 20), P(40, -10, 18), P(56, 10, 14)])}" stroke="#ffcf4d" stroke-width="1.8" fill="none" class="flow"/>`;
    s += person(-4, 60, '#f08c2a') + person(2, 62, '#e04a3f');
    return s;
  }

  // REF village, spread out, drawn as depth-sorted pieces like city() so the ZESA truck can drive around it
  function ref(put, go) {
    const H = A.houses;
    // homes along the back
    put(-72, H.house(-96, -86, 34, 22, 15, 13, C.white, [C.red[0], '#d4693e', '#a8502d'], true, 0, { variant: 0 }));
    put(-97, H.house(-30, -92, 30, 20, 13, 11, ['#ffffff', '#f6e7c7', '#e3d1a8'], [C.red[0], '#4f9a5d', '#2f6b3a'], true, .8, { variant: 1 }));
    put(-36, H.house(34, -84, 28, 20, 13, 11, C.white, [C.red[0], '#3d8fcf', '#2a6fa5'], true, 1.5, { variant: 2 }));
    // solar mini-grid
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const x = 86 + i * 11, y = -86 + j * 14;
      put(x + y + 9, poly([P(x, y, 3), P(x + 9, y, 3), P(x + 9, y + 9, 8), P(x, y + 9, 8)], '#2c5f9e', 'stroke="#9ec8ee" stroke-width=".6"') + poly([P(x, y, 3), P(x, y + 9, 8), P(x, y + 9, 5), P(x, y, 1)], '#1c3f6b'));
    }
    // water tank + windmill pump
    put(40, T(62, -22, 0, `<path d="M-6 0 L-4 -16 M6 0 L4 -16" stroke="#8a6a45" stroke-width="1.5"/>`) + cyl(62, -22, 16, 7, 12, C.blue));
    put(70, T(86, -16, 0, `<path d="M0 0V-24" stroke="#7d8b99" stroke-width="1.5"/><g transform="translate(0,-24)"><g class="spin"><path d="M0 0L-2 -9L2 -9Z M0 0L-9 2L-9 -2Z M0 0L2 9L-2 9Z M0 0L9 -2L9 2Z" fill="#c7d3df" stroke="#8d9bab" stroke-width=".5"/></g></g>`));
    // school
    put(-98, swap('06-houses/school', -128, 2, () => H.school(-128, 2, { delay: .3 })));
    // thatched huts, well apart
    [[2, 14], [30, 30], [-4, 50], [54, 54], [82, 30], [26, 76], [96, 72]].forEach(([x, y], i) => put(x + y, H.rondavel(x, y, { r: 7, lit: i % 2 === 0, delay: i * .4 })));
    // transformer pole + service drops (overhead, so drawn above the village)
    put(-64, T(-40, -24, 0, `<path d="M-4 0 L0 -50 L4 0 M-7 -40 H7 M-5 -47 H5" stroke="#7d8b99" stroke-width="1.8" fill="none"/><rect x="-5" y="-28" width="10" height="8" rx="1" fill="#b2bfcc"/><circle cy="-52" r="2.2" fill="#ffcf4d" class="glow"/>`));
    const top = P(-40, -24, 47);
    let drops = '';
    [P(-79, -64, 15), P(-15, -72, 13), P(48, -64, 13), P(2, 14, 12), P(-110, 12, 12)].forEach((p, i) => {
      drops += `<path d="M${f(top[0])} ${f(top[1])} Q${f((top[0] + p[0]) / 2)} ${f((top[1] + p[1]) / 2 + 10)} ${f(p[0])} ${f(p[1])}" stroke="#ffcf4d" stroke-width="1.4" fill="none" class="flow" style="animation-delay:${i * .15}s"/>`;
      drops += packet([top, p], 2 + i * .3, '#ffcf4d', i * .5);
    });
    put(300, drops);
    put(-16, person(-54, 36, '#e04a3f') + person(-50, 38, '#1f7fc0'));
    put(50, person(40, 10, '#f2c35c'));
    put(-76, lamp(-66, -10, 20)); put(-16, lamp(14, -30, 20));
    put(116, T(120, -4, 0, `<path d="M0 -6 l3 -4 l3 4z" fill="#8a6a45"/>`));
    // the ZESA truck does its rounds inside the village, stopping at the transformer, the solar mini-grid and the huts
    // (the loop keeps to open ground: right of the maize, left of the huts, clear of the crop fields at x -82..-30 / -150..-112)
    go('car', { livery: 'zetdc-truck' }, [[-20, -50], [100, -50], [152, -50], [152, 96], [40, 96], [-20, 96], [-20, -24], [-20, -50]], 34, -3,
      { 1: 4, 4: 4, 6: 4 });
  }

  function petroStation(seed = 0) {
    let s = '';
    s += box(-70, -58, 0, 62, 26, 26, C.white) + box(-72, -60, 26, 66, 30, 4, C.green);
    s += winL(-62, -32, 6, 14, 12, '#9fd3f2') + winL(-42, -32, 6, 14, 12, '#9fd3f2') + winL(-22, -32, 6, 14, 12, '#9fd3f2');
    for (let k = 0; k < 7; k++) s += poly([P(-70 + k * 8, -32, 19), P(-62 + k * 8, -32, 19), P(-62 + k * 8, -27, 15), P(-70 + k * 8, -27, 15)], k % 2 ? '#fff' : '#4f9a5d');
    s += winL(-14, -32, 0, 6, 15, '#7bb9df') + label(-38, -32, 30, 'SHOP', '#fff', 7, 800);
    s += box(-34, -2, 0, 56, 14, 3, C.grey);
    [[-24, 1], [2, 1]].forEach((p, i) => { s += box(p[0], p[1], 3, 10, 7, 20, i ? C.gold : C.green) + winL(p[0] + 2, p[1] + 7, 14, 6, 6, '#ffffff') + T(p[0] + 10, p[1] + 7, 14, `<path d="M0 0 q6 4 3 12" stroke="#23272c" stroke-width="1.6" fill="none"/>`); });
    [[-38, -6], [28, -6], [-38, 28], [28, 28]].forEach(p => s += box(p[0], p[1], 0, 3.5, 3.5, 34, C.white));
    s += box(-44, -10, 34, 80, 42, 4, C.green);
    s += `<polygon points="${pts([P(-44, 32, 38), P(36, 32, 38), P(36, 32, 36), P(-44, 32, 36)])}" fill="${C.gold[1]}"/>`;
    s += label(-4, 32, 36.6, 'PETROTRADE', '#fff', 6, 800, 'transform="skewY(30)" transform-origin="0 0"');
    s += box(54, -48, 0, 5, 5, 50, C.white) + box(46, -52, 42, 22, 13, 16, C.green) + box(46, -52, 58, 22, 13, 3, C.gold);
    s += winL(48, -39, 44, 18, 11, '#fff6d6') + label(57, -39, 46, 'P·T', '#2f6b3a', 8, 800, 'transform="skewY(30)"');
    s += T(-19, 5, 30, `<path d="M0 -8 C5 -2 5 3 0 4 C-5 3 -5 -2 0 -8Z" fill="#9ccf3a" class="pulse" style="animation-delay:${seed * .7}s"/>`);
    s += lamp(-60, 34, 22) + lamp(50, 34, 22);
    return s;
  }
  const petroPad = () => `<path d="${rr(-82, -68, 76, 44, 10)}" fill="url(#mp-pave)"/><path d="M-30 14H22V20H-30Z" fill="#e9edf1"/>`;

  function powertel() {
    let s = '';
    s += box(8, 12, 0, 34, 22, 14, C.white) + box(6, 10, 14, 38, 26, 3, C.blue) + box(6, 10, 17, 38, 26, 0.1, C.red);
    s += winL(14, 34, 3, 10, 8, '#7bb9df') + winL(28, 34, 3, 8, 8, '#7bb9df') + label(26, 34, 11.5, 'POWERTEL', '#1f5f8f', 4.4, 800);
    s += T(36, 16, 26, `<g transform="rotate(-25)"><ellipse rx="7" ry="9" fill="#fff" stroke="#9aa9b8" stroke-width="1"/><ellipse rx="3" ry="4" fill="#dfe7ef"/></g>`);
    const [tx, ty] = P(-4, -8, 0);
    s += `<g transform="translate(${f(tx)},${f(ty)})"><ellipse rx="18" ry="6" fill="#0b1e33" opacity=".14"/>` +
      `<path d="M-16 0 L0 -112 L16 0 M-12 -26 H12 M-9 -50 H9 M-6 -74 H6 M-12 -26 L9 -50 M12 -26 L-9 -50 M-9 -50 L6 -74 M9 -50 L-6 -74" stroke="#e04a3f" stroke-width="2" fill="none"/>` +
      `<path d="M-16 0 L0 -112 M16 0 L0 -112" stroke="#fff" stroke-width=".8" stroke-dasharray="6 6" fill="none"/>` +
      `<rect x="-9" y="-104" width="5" height="12" rx="1.5" fill="#fff" stroke="#9aa9b8" stroke-width=".7"/><rect x="4" y="-104" width="5" height="12" rx="1.5" fill="#fff" stroke="#9aa9b8" stroke-width=".7"/>` +
      `<path d="M-6 -78 a8 8 0 0 0 12 0Z" fill="#1f7fc0"/><circle cy="-114" r="3" fill="#e04a3f" class="glow"/>`;
    for (let i = 0; i < 3; i++) s += `<g class="ring" style="animation-delay:${i * .8}s"><ellipse cx="0" cy="-100" rx="22" ry="22" fill="none" stroke="#1f7fc0" stroke-width="2"/></g>`;
    s += '</g>';
    return s;
  }

  // city() and suburb() have traffic running between their buildings, so they are drawn as separate depth-sorted pieces:
  // put(local depth x + y, svg) and go(kind, spec, local route, dur, begin) (see drive())
  // City traffic runs on 12 s / 18 s laps (a shared 36 s cycle); the begin offsets are chosen so no two vehicles meet
  // at a crossing. Change a dur or begin here and they can collide again.
  function city(put, go) {
    const B = A.buildings, cars = A.cars;
    const blk = (seed, list) => B.blockParts(list, { seed }).forEach(b => put(b.k, b.svg));
    // fibre links from the tower, on the ground under everything
    const t0 = P(-46, -70, 2);
    [[P(39, -100, 2), '#1f7fc0'], [P(-42, 60, 2), '#e04a3f'], [P(39, 24, 2), '#1f7fc0']].forEach(([p, c], i) => {
      put(-1000, `<polyline points="${pts([t0, p])}" stroke="${c}" stroke-width="1.6" fill="none" class="flow" opacity=".8"/>` + packet([t0, p], 2.6 + i * .3, c, i * .6));
    });
    // far row (beyond the back street)
    blk(7, [[-78, -200, 22, 22, 30, 'apartment'], [-50, -196, 20, 20, 22, 'brick'], [24, -200, 24, 24, 44, 'glass'], [56, -196, 22, 22, 34, 'office']]);
    // back-left: Powertel compound
    put(-170, fence(-80, -118, -6, -118, 6) + fence(-80, -118, -80, -14, 6));
    put(-100, `<g transform="translate(${f(P(-46, -70)[0] - P(-4, -8)[0])},${f(P(-46, -70)[1] - P(-4, -8)[1])})">${powertel()}</g>`);
    // back-right: towers
    blk(3, [[24, -118, 26, 26, 64, 'glass'], [58, -112, 24, 24, 48, 'stepped'], [26, -78, 22, 22, 36, 'office'], [60, -74, 24, 22, 26, 'apartment']]);
    // traffic: high street (y = 0), cross streets (x = 10, x = 100), front street (y = 120)
    go('car', { livery: 'zetdc' }, [[-136, -4.5], [380, -4.5]], 18, -11);
    go('car', { livery: 'zetdc-truck' }, [[380, 4.5], [-136, 4.5]], 18, 0);
    go('car', { type: 'minibus', color: '#f2c230' }, [[14.5, -130], [14.5, 240]], 12, -1);
    go('car', { livery: 'zetdc' }, [[5.5, 240], [5.5, -130]], 12, -3.5);
    go('car', { livery: 'zera' }, [[104.5, -200], [104.5, 190]], 12, -11);
    go('car', { type: 'hatch', color: '#d4493e' }, [[470, 115.5], [-110, 115.5]], 18, -9.5);
    go('car', { type: 'ev', color: '#4f9a5d' }, [[-110, 124.5], [470, 124.5]], 18, -6);
    go('car', { type: 'suv', color: '#3a3f46' }, [[194.5, -170], [194.5, 400]], 18, -13.5);
    go('car', { type: 'pickup', color: '#f4f6f8' }, [[275.5, 330], [275.5, -80]], 12, -2);
    // front-left: Petrotrade #2
    put(22, `<g transform="translate(${f(P(-42, 64)[0])},${f(P(-42, 64)[1])}) scale(.62)">${petroStation(2)}</g>`);
    // front-right: ZESA depot + substation
    B.blockParts([[24, 14, 30, 20, 22, 'office']], { seed: 9 }).forEach(b => put(b.k, b.svg + label(39, 34, 15, 'ZESA', '#1f5f8f', 6, 800)));
    put(100, fence(62, 16, 92, 16) + fence(92, 16, 92, 60));
    [66, 78].forEach((xx, i) => { put(xx + 30, box(xx, 22, 0, 8, 8, 9, C.grey) + cyl(xx + 2, 24, 9, 1.3, 6, C.white) + cyl(xx + 5.5, 27, 9, 1.3, 6, C.white) + T(xx + 4, 26, 17, `<circle r="2" fill="#ffcf4d" class="glow" style="animation-delay:${i * .5}s"/>`)); });
    [[34, 52], [34, 66], [34, 80]].forEach(([x, y], i) => { put(x + y, at(x, y, cars.car({ livery: i === 1 ? 'zetdc-truck' : 'zetdc', dir: 1 }))); });
    blk(4, [[60, 70, 22, 18, 20, 'apartment'], [64, 94, 18, 14, 14, 'retail']]);
    // front row past the front street
    blk(11, [[-74, 132, 24, 18, 18, 'retail'], [-40, 134, 20, 16, 24, 'apartment'], [26, 132, 22, 18, 20, 'brick'], [58, 134, 24, 18, 16, 'retail']]);
    [[-96, -20], [-4, 20], [-96, 110]].forEach(([x, y]) => put(x + y, lamp(x, y, 22)));
    // edge of town: low-rise shops and offices, thinning out
    blk(13, [[116, -206, 26, 24, 30], [150, -200, 24, 22, 22]]);
    blk(17, [[116, -112, 26, 24, 34], [150, -106, 24, 22, 26], [118, -56, 24, 24, 24], [150, -50, 24, 22, 18]]);
    blk(19, [[116, 20, 26, 22, 22], [150, 24, 24, 20, 16], [118, 70, 24, 22, 20], [150, 74, 22, 20, 14]]);
    blk(29, [[118, 140, 24, 18, 16, 'retail'], [150, 142, 24, 18, 14, 'retail'], [118, 190, 24, 20, 18, 'brick'], [150, 194, 22, 18, 12, 'retail']]);
    blk(31, [[208, 20, 24, 20, 14, 'retail'], [240, 22, 24, 20, 12, 'brick'], [210, 66, 22, 22, 12, 'retail']]);
    // out of town: four houses per garden block, with trees
    const H = A.houses, R = rng(23);
    const walls = [C.white, ['#ffffff', '#f6e7c7', '#e3d1a8']], roofs = [['#d4693e', '#a8502d'], ['#3d8fcf', '#2a6fa5'], ['#4f9a5d', '#2f6b3a']];
    let n = 0;
    CITY_RES.forEach(([x0, y0, x1, y1]) => {
      [[x0 + 6, y0 + 8], [x0 + 40, y0 + 8], [x0 + 6, y1 - 24], [x0 + 40, y1 - 24]].forEach(([x, y]) => {
        put(x + 12 + y + 8, H.house(x, y, 24, 16, 11, 9, walls[n % 2], [C.red[0], ...roofs[n % 3]], n % 3 === 0, n * .25, { variant: n % 4 }));
        n++;
      });
      [[x0 + 35, (y0 + y1) / 2 + 4], [x1 - 4, (y0 + y1) / 2 - 2]].forEach(([x, y]) => put(x + y, at(x, y, roundTree(.75 + R() * .3, R))));
    });
    put(92, person(-20, 112, '#e04a3f') + person(-14, 114, '#1f7fc0'));
  }

  function suburb(put, go) {
    const H = A.houses;
    const W1 = ['#ffffff', '#f6e7c7', '#e3d1a8'];
    const homes = [
      [-118, -20, 24, 16, 11, 9, C.white, [C.red[0], '#d4693e', '#a8502d'], 0],
      [-122, 18, 24, 16, 11, 9, W1, [C.red[0], '#3d8fcf', '#2a6fa5'], 1],
      [86, -16, 22, 16, 11, 9, W1, [C.red[0], '#4f9a5d', '#2f6b3a'], 2],
      [96, 18, 22, 16, 11, 9, C.white, [C.red[0], '#d4693e', '#a8502d'], 3],
      [-110, 76, 24, 16, 11, 9, C.white, [C.red[0], '#4f9a5d', '#2f6b3a'], 1],
      [-70, 78, 24, 16, 11, 9, W1, [C.red[0], '#d4693e', '#a8502d'], 2],
      [-24, 80, 24, 16, 11, 9, C.white, [C.red[0], '#3d8fcf', '#2a6fa5'], 0],
      [22, 80, 24, 16, 11, 9, W1, [C.red[0], '#d4693e', '#a8502d'], 3],
      [68, 78, 24, 16, 11, 9, C.white, [C.red[0], '#4f9a5d', '#2f6b3a'], 1],
      [118, 80, 24, 16, 11, 9, W1, [C.red[0], '#3d8fcf', '#2a6fa5'], 2]
    ];
    const home = (h, solar, delay) => put(h[0] + h[2] / 2 + h[1] + h[3] / 2, H.house(h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], solar, delay, { variant: h[8] }));
    homes.filter(h => h[1] < 60).forEach((h, i) => home(h, i % 2 === 0, i * .3));
    homes.filter(h => h[1] >= 60).forEach((h, i) => home(h, i % 2 === 1, i * .4));
    put(4, `<g transform="translate(${f(P(0, 4)[0])},${f(P(0, 4)[1])}) scale(.62)">${petroStation(1)}</g>`);
    // street y = 60 traffic, up to the port road
    const end = portX(SUB[1] + 60) - SUB[0] - 10;
    const lap = 19, tankerRoute = [[-260, 55.5], [end, 55.5]];
    go('truck', { livery: 'petrotrade' }, tankerRoute, lap, -4);
    go('car', { livery: 'moepd' }, [[end, 64.5], [-260, 64.5]], lap, -1);
    // a car pulls in to fill up: it waits at the boom gate while the arm lifts, refuels at the pump (hose + gauge), then
    // rejoins the street. It drives at the tanker's speed on a two-lap cycle, so it always rejoins in the gap between tankers.
    const gate = [-42, 32], gateWait = 1.6, cycle = 2 * lap, B = -13;
    const fuelRoute = [[-260, 55.5], [-30, 55.5], [-30, 43], [-30, 16], [-10, 16], [34, 16], [34, 55.5], [end, 55.5]];
    const v = schedule(tankerRoute, lap).total / lap, fill = cycle - schedule(fuelRoute, 1).total / v - gateWait;
    const stops = { 2: gateWait, 4: fill }, { arrive, depart } = schedule(fuelRoute, cycle, stops);
    go('car', { type: 'sedan', color: '#c0392b' }, fuelRoute, cycle, B, stops);
    // boom gate: lifts as the car pulls up, drops once it is through (21 = from where it waits until its tail clears the arm)
    const up = arrive[2] - .3, clear = depart[2] + 21 / v + .3;
    const kt = [0, up, up + .6, up + 1.2, clear, clear + .6, clear + 1.2, cycle].map(t => +(t / cycle).toFixed(4)).join(';');
    const pv = P(gate[0], gate[1], 6), arm = [P(gate[0] + 19, gate[1], 6), P(gate[0] + 13.4, gate[1], 19.4), P(gate[0] + 1, gate[1], 25)];
    const seq = k => [0, 0, 1, 2, 2, 1, 0, 0].map(i => f(arm[i][k])).join(';');
    const swing = `<animate attributeName="x2" values="${seq(0)}" keyTimes="${kt}" dur="${cycle}s" begin="${B}s" repeatCount="indefinite"/><animate attributeName="y2" values="${seq(1)}" keyTimes="${kt}" dur="${cycle}s" begin="${B}s" repeatCount="indefinite"/>`;
    const line = extra => `<line x1="${f(pv[0])}" y1="${f(pv[1])}" x2="${f(arm[0][0])}" y2="${f(arm[0][1])}" stroke-linecap="round" ${extra}>${swing}</line>`;
    put(gate[0] + gate[1], box(gate[0] - 2, gate[1] - 2, 0, 4, 4, 8, C.white) + box(gate[0] - 2.5, gate[1] - 2.5, 8, 5, 5, 1.5, C.red) +
      line('stroke="#ffffff" stroke-width="2.4"') + line('stroke="#e04a3f" stroke-width="2.4" stroke-dasharray="3 3"'));
    // fuel hose from the pump to the car, and a gauge over the car, only while it is filling up
    const during = (inner) => `<g visibility="hidden">${inner}<animate attributeName="visibility" values="hidden;visible;hidden" keyTimes="0;${+(arrive[4] / cycle).toFixed(4)};${+(depart[4] / cycle).toFixed(4)}" calcMode="discrete" dur="${cycle}s" begin="${B}s" repeatCount="indefinite"/></g>`;
    const noz = P(-8.7, 9, 8.7), cap = P(-13, 11.8, 5);
    put(5, during(`<path d="M${f(noz[0])} ${f(noz[1])} Q${f((noz[0] + cap[0]) / 2)} ${f(Math.max(noz[1], cap[1]) + 6)} ${f(cap[0])} ${f(cap[1])}" stroke="#23272c" stroke-width="1.4" fill="none"/>` +
      `<path d="M${f(noz[0])} ${f(noz[1])} Q${f((noz[0] + cap[0]) / 2)} ${f(Math.max(noz[1], cap[1]) + 6)} ${f(cap[0])} ${f(cap[1])}" stroke="#9ccf3a" stroke-width=".9" fill="none" class="flow"/>`));
    const g = P(-10, 16, 26);
    put(400, during(`<g transform="translate(${f(g[0])},${f(g[1])})"><rect x="-11" y="-6" width="22" height="12" rx="6" fill="#ffffff" stroke="#2f6b3a" stroke-width="1"/>` +
      `<path d="M-6 -3 C-3.5 0 -3.5 2 -6 3 C-8.5 2 -8.5 0 -6 -3Z" fill="#e0a21c"/><rect x="-1" y="-1.6" width="9" height="3.2" rx="1.6" fill="#e3e8ec"/>` +
      `<rect x="-1" y="-1.6" width="0" height="3.2" rx="1.6" fill="#4f9a5d"><animate attributeName="width" values="0;0;9;9" keyTimes="0;${+(arrive[4] / cycle).toFixed(4)};${+((depart[4] - .4) / cycle).toFixed(4)};1" dur="${cycle}s" begin="${B}s" repeatCount="indefinite"/></rect></g>`));
    put(-8, lamp(-60, 52, 20)); put(92, lamp(40, 52, 20));
    put(10, person(-40, 50, '#f2c35c')); put(130, person(60, 70, '#e04a3f'));
  }

  function msasa() {
    let s = A.tanks.farm([[-30, -26, 13, 26, 1, 'PETROL'], [0, -26, 13, 26, 2, 'PETROL'], [30, -26, 13, 26, 3, 'DIESEL'],
      [-30, 6, 13, 26, 4, 'DIESEL'], [0, 6, 13, 26, 5, 'JET A1', { color: 'grey' }], [30, 6, 13, 26, 6, 'DIESEL', { color: 'grey' }]]);
    // loading gantry at the gate
    s += box(2, 30, 0, 3, 3, 20, C.gold) + box(18, 30, 0, 3, 3, 20, C.gold) + box(0, 28, 20, 24, 8, 3, C.gold) + label(12, 36, 22.5, 'NOIC', '#fff', 4.4, 800);
    s += at(12, 40, A.trucks.tanker({ livery: 'noic' }));
    return s;
  }

  function beira() {
    let s = A.tanks.farm([[0, -14, 11, 22, 31, 'PETROL'], [0, 14, 11, 22, 32, 'DIESEL', { color: 'grey' }]]);
    return s;
  }
  function quay() {
    // jetty from the shore into the sea, with a gantry crane
    let s = box(-74, 596, 0, 16, 60, 3, ['#d9dee3', '#b9c1c9', '#9aa4ae']);
    for (let y = 604; y < 656; y += 12) s += box(-74, y, -6, 2, 2, 6, C.dark);
    s += box(-72, 626, 3, 3, 3, 34, C.gold) + box(-62, 626, 3, 3, 3, 34, C.gold) + box(-74, 620, 37, 16, 16, 3, C.gold);
    s += box(-80, 640, 37, 4, 4, 2, C.dark) + T(-78, 642, 37, `<path d="M0 0V16" stroke="#23272c" stroke-width=".8"/>`);
    s += cyl(-66, 600, 3, 4, 12, C.black) + T(-66, 600, 18, `<circle r="4" fill="none" stroke="#e04a3f" stroke-width="1.6"/>`);
    return s;
  }
  function feruka() {
    return A.tanks.farm([[0, -12, 9, 18, 7, 'PETROL'], [0, 12, 9, 18, 8, 'DIESEL']], { pipes: false });
  }

  /* ---------- shipping ---------- */
  // world x of the sea shore at world y (east side of the ocean, from cw(OCEAN))
  const SHORE = [[-83, 603], [10, 670], [97, 743], [240, 880]];
  const shoreX = y => { for (let i = 1; i < SHORE.length; i++) if (y <= SHORE[i][1]) { const [x0, y0] = SHORE[i - 1], [x1, y1] = SHORE[i]; return x0 + (x1 - x0) * Math.max(0, (y - y0) / (y1 - y0)); } return SHORE[SHORE.length - 1][0]; };
  const screenPath = (a, b) => { const p = P(a[0], a[1]), q = P(b[0], b[1]); return `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`; };

  /* The oil tanker's round trip, TRIP seconds: away off the map, sails in heading +x and moors at the Beira jetty,
     offloads through a hose, turns and sails out heading +y (the +x drawing mirrored), and stays away until the next
     visit. Times in seconds; the tanker has no +y drawing of its own, so the turn is a short cross-fade. */
  function tankerRun() {
    const TRIP = 56, ARRIVE = 12, MOOR = 24, LEAVE = 38, TURN = 1.5, GONE = 52;
    const k = t => +(t / TRIP).toFixed(4), timing = `dur="${TRIP}s" repeatCount="indefinite"`;
    const ship = A.marine.tanker(0, 0, { wake: 6 });            // deck x 0..40, y 0..22, bow at +x
    const berth = [-136, 646], turned = [berth[0] + 9, berth[1] - 9];   // same hull centre after the turn
    const fadeOut = `<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;${k(LEAVE)};${k(LEAVE + TURN)};1" ${timing}/>`;
    const fadeIn = `<animate attributeName="opacity" values="0;0;1;1" keyTimes="0;${k(LEAVE)};${k(LEAVE + TURN)};1" ${timing}/>`;
    let s = `<g>${ship}<animateMotion path="${screenPath([-380, berth[1]], berth)}" keyPoints="0;0;1;1" keyTimes="0;${k(ARRIVE)};${k(MOOR)};1" calcMode="spline" keySplines="0 0 1 1;.25 .1 .25 1;0 0 1 1" ${timing}/>${fadeOut}</g>`;
    s += `<g opacity="0"><g transform="scale(-1,1)">${ship}</g><animateMotion path="${screenPath(turned, [turned[0], 900])}" keyPoints="0;0;1;1" keyTimes="0;${k(LEAVE + TURN)};${k(GONE)};1" calcMode="spline" keySplines="0 0 1 1;.5 0 .75 1;0 0 1 1" ${timing}/>${fadeIn}</g>`;
    // offloading: hose from the deck manifold to the jetty, oil flowing while moored
    const a = P(-112, 656, 9), b = P(-73, 650, 3.5);
    const hose = `M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f(Math.max(a[1], b[1]) + 8)} ${f(b[0])} ${f(b[1])}`;
    s += `<g opacity="0"><path d="${hose}" stroke="#23272c" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      `<path d="${hose}" stroke="#f2b632" stroke-width="1.1" fill="none" class="flow"/>` +
      `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${k(MOOR + .5)};${k(MOOR + 1)};${k(LEAVE - 1)};${k(LEAVE - .5)};1" ${timing}/></g>`;
    return s;
  }

  // a small motor boat heading +x, centred on its origin
  function boat(col) {
    const H = [[-7, -2.6], [4, -2.6], [8, 0], [4, 2.6], [-7, 2.6]], z = 2.2;
    const side = (a, b, fill, extra = '') => poly([P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], z), P(a[0], a[1], z)], fill, extra);
    let s = poly([P(-7, -2.2), P(-24, -6.5), P(-20, 0), P(-24, 6.5), P(-7, 2.2)], '#ffffff', 'opacity=".45"');      // wake
    s += side(H[4], H[3], col) + side(H[3], H[2], col) + side(H[3], H[2], '#0b1e33', 'opacity=".2"');
    s += poly(H.map(p => P(p[0], p[1], z)), '#f4f6f8');
    s += box(-4, -1.6, z, 5, 3.2, 2.6, C.white) + winR(1, -1.6, z + 1.2, 3.2, .9, '#3f7aa8');
    return `<g class="bob">${s}</g>`;
  }
  // small boats crossing the sea on random lanes, different on every load
  function boats(items) {
    const R = rng((Math.random() * 1e9) | 0), cols = ['#e04a3f', '#f2c35c', '#2f7fb8', '#4f9a5d', '#f08c2a', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      const alongY = R() < .4;
      let a, b;
      if (alongY) { const x = -230 + R() * 70; a = [x, 700]; b = [x, 1000]; }        // south, clear of the rig and the tanker's lane
      else { const y = 700 + R() * 170; a = [-480, y]; b = [shoreX(y) - 25, y]; }  // east towards the shore
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), dur = +(len / (10 + R() * 8)).toFixed(1), begin = -(R() * dur).toFixed(1);
      const body = boat(cols[i]);
      items.push([-1990 + i, fade(`<g>${alongY ? `<g transform="scale(-1,1)">${body}</g>` : body}<animateMotion path="${screenPath(a, b)}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`, dur, begin)]);
    }
  }

  /* ---------- pipeline ---------- */
  function pipeline() {
    let s = '';
    const pc = ['#d5dde5', '#aab6c2', '#8e9cab'];
    for (let i = 0; i < PIPE.length - 1; i++) {
      const [a, b] = [PIPE[i], PIPE[i + 1]];
      const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
      s += box(x0 - 2, y0 - 2, 3, x1 - x0 + 4, y1 - y0 + 4, 3.4, pc);
      const n = Math.floor(Math.max(x1 - x0, y1 - y0) / 22);
      for (let k = 1; k < n; k++) { const t = k / n; s += box(a[0] + (b[0] - a[0]) * t - 1, a[1] + (b[1] - a[1]) * t - 1, 0, 2, 2, 3, C.grey); }
    }
    const path = PIPE.map(p => P(p[0], p[1], 6.6));
    s += `<polyline points="${pts(path)}" stroke="#ffe03a" stroke-width="1.8" fill="none" class="flow" stroke-linejoin="round"/>`;
    [0, 3, 6].forEach(d => s += packet(path, 9, '#ffe03a', d));
    return s;
  }

  /* ---------- ground ---------- */
  function ground() {
    let w = '';
    // painted canvas textures (assets/textures.js) with the old patterns as fallback
    const TX = (n, fb) => A.textures ? A.textures.fill(n, fb) : fb;
    // soft edge: fading strokes of the same fill straddling the outline, so zones blend instead of cutting
    // widest stroke faintest, so the blend fades out instead of leaving a halo ring
    const feather = (d, fill, ws = [44, 28, 14], op = .3) => ws.map((sw, i) => `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${sw}" stroke-linejoin="round" opacity="${(op * (i + 1) / ws.length).toFixed(2)}"/>`).join('');
    const big = cw([[-80, -80], [1680, -80], [1680, 1080], [-80, 1080]]);
    w += `<path d="${line(big)}Z" fill="${TX('grass', 'url(#mp-grass)')}"/>`;
    // dry plain: yellowing grass band around it, then the dry ground with a feathered rim
    const dryD = curve(cw(DRY)), dryF = TX('dry', 'url(#mp-dry)');
    w += `<path d="${dryD}" fill="none" stroke="${TX('grass-dry', '#b9c46e')}" stroke-width="110" stroke-linejoin="round" opacity=".55"/>` +
      `<path d="${dryD}" fill="none" stroke="${TX('grass-dry', '#b9c46e')}" stroke-width="64" stroke-linejoin="round" opacity=".7"/>`;
    w += feather(dryD, dryF) + `<path d="${dryD}" fill="${dryF}"/>`;
    // land-use pads
    const pad = (o, x0, y0, x1, y1, r, fill, extra = '') => `<path d="${rr(o[0] + x0, o[1] + y0, o[0] + x1, o[1] + y1, r)}" fill="${fill}" ${extra}/>`;
    w += pad(HW, -100, -72, 72, 66, 16, '#c9bfae') + pad(HW, -96, -68, 68, 62, 13, TX('gravel', 'url(#ter-gravel)'));
    w += `<ellipse cx="${f(HW[0] - 36)}" cy="${f(HW[1] + 34)}" rx="56" ry="22" fill="url(#ter-coal)"/>`;
    { const yd = curve([[-153, -109], [0, -125], [153, -107], [161, 0], [135, 96], [0, 107], [-156, 91], [-166, 0]].map(p => [REF[0] + p[0], REF[1] + p[1]])), yf = TX('dirt', 'url(#mp-dirt)'); w += feather(yd, yf, [36, 22, 10], .28) + `<path d="${yd}" fill="${yf}" opacity=".92"/>`; }
    w += pad(REF, -82, 2, -30, 48, 4, 'url(#mp-crop)') + pad(REF, 104, 0, 144, 42, 4, 'url(#mp-maize)') + pad(REF, -150, 40, -112, 80, 4, 'url(#mp-crop)');
    [[-118, -220, -100, -140], [-80, -220, 0, -140], [20, -220, 90, -140], [-80, -120, 0, -10], [20, -120, 90, -10], [-80, 10, 0, 110], [20, 10, 90, 110],
     [-118, 130, -100, 200], [-80, 130, 0, 200], [20, 130, 90, 200], [110, -120, 180, -10], [110, 10, 180, 110], [110, 130, 180, 230], [110, -220, 180, -140], [200, 10, 270, 110]]
      .forEach(([x0, y0, x1, y1]) => { w += pad(CITY, x0 - 1.5, y0 - 1.5, x1 + 1.5, y1 + 1.5, 7, '#c6ced6') + pad(CITY, x0, y0, x1, y1, 6, 'url(#mp-pave)'); });
    // out-of-town gardens
    CITY_RES.forEach(([x0, y0, x1, y1]) => { w += pad(CITY, x0 - 1.5, y0 - 1.5, x1 + 1.5, y1 + 1.5, 7, '#c6ced6') + pad(CITY, x0, y0, x1, y1, 6, TX('lawn', 'url(#mp-lawn)')); });
    // city parks
    w += pad(CITY, -80, 134, -4, 152, 4, TX('lawn', 'url(#mp-lawn)'));
    w += pad(MSA, -58, -52, 56, 44, 12, '#cfc8ba') + pad(MSA, -55, -49, 53, 41, 10, TX('gravel', 'url(#ter-gravel)'));
    { const ld = curve([[-150, -40], [0, -36], [150, -30], [160, 60], [150, 104], [0, 110], [-150, 104], [-160, 40]].map(p => [SUB[0] + p[0], SUB[1] + p[1]])), lf = TX('lawn', 'url(#mp-lawn)'); w += feather(ld, lf, [30, 16], .3) + `<path d="${ld}" fill="${lf}"/>`; }
    w += `<g transform="translate(${f(SUB[0])},${f(SUB[1] + 4)}) scale(.62)">${petroPad()}</g>`;
    w += pad(BEIRA, -20, -32, 22, 32, 8, TX('gravel', 'url(#ter-gravel)')) + pad(FER, -16, -26, 16, 26, 6, TX('gravel', 'url(#ter-gravel)'));
    // ocean with beach, shallows
    const oc = curve(cw(OCEAN));
    w += `<clipPath id="mp-ocean-clip"><path d="${oc}"/></clipPath>`;
    w += `<path d="${oc}" fill="none" stroke="#ecd9a6" stroke-width="26" stroke-linejoin="round"/><path d="${oc}" fill="none" stroke="${TX('sand', '#f6e8c2')}" stroke-width="18" stroke-linejoin="round"/>`;
    w += `<path d="${oc}" fill="url(#mp-sea)"/>`;
    w += `<g clip-path="url(#mp-ocean-clip)"><path d="${oc}" fill="none" stroke="#86cdee" stroke-width="22"/><path d="${oc}" fill="none" stroke="#ffffff" stroke-width="3" opacity=".7" class="flow" style="animation-duration:3s"/></g>`;
    // Zambezi above the falls and the gorge below it
    const up = curve(cw([[540, 40], [590, 40], [588, 110], [600, 150], [597, 171], [512, 177], [425, 185], [470, 160], [530, 130], [538, 90]]));
    w += `<path d="${up}" fill="#e9dcb0" stroke="#e9dcb0" stroke-width="10" stroke-linejoin="round"/><path d="${up}" fill="url(#mp-river)"/>`;
    // (the gorge river below the falls is drawn in falls(), over the cliff, so it flows out of the pool)
    // roads: casing, asphalt, centre line
    const ring = line(RING_PTS) + 'Z';
    const branches = ROADS.map(line).join('');
    const cst = CITY_ST.map(seg => line(seg.map(p => [CITY[0] + p[0], CITY[1] + p[1]]))).join('');
    const all = ring + branches + cst;
    w += `<path d="${all}" fill="none" stroke="#e7ebef" stroke-width="22" stroke-linejoin="round" stroke-linecap="round"/>`;
    w += `<path d="${all}" fill="none" stroke="#6b7580" stroke-width="17" stroke-linejoin="round" stroke-linecap="round"/>`;
    w += `<path d="${all}" fill="none" stroke="#5d6772" stroke-width="1" stroke-linejoin="round" opacity=".6" transform="translate(0,0)"/>`;
    w += `<path d="${all}" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-dasharray="7 6" opacity=".9"/>`;
    let s = Wg(w);
    // soft colour variation on the grass (screen space)
    const R = rng(11);
    let v = '';
    for (let i = 0; i < 26; i++) {
      const cx = R() * 1600 - CX, cy = R() * 1000 - CY;
      v += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(70 + R() * 120)}" ry="${f(30 + R() * 50)}" fill="url(#mp-${R() < .5 ? 'dark' : 'light'})"/>`;
    }
    return s + v;
  }

  /* ---------- trees ---------- */
  function trees(items) {
    const R = rng(5);
    const oceanW = cw(OCEAN), dryW = cw(DRY);
    const zones = [ // canvas ellipses to keep clear
      [225, 365, 200, 120], [1290, 270, 270, 160], [850, 725, 160, 100], [250, 600, 230, 110], [330, 742, 50, 40], [585, 800, 40, 34],
      [515, 195, 140, 60], [800, 470, 210, 175]
    ];
    const rects = [[1035, 520, 1610, 900], [600, 95, 1050, 300], [320, 620, 640, 820]];
    const segsOf = l => l.slice(1).map((p, i) => [l[i], p]);
    const roadSegs = ROADS.concat(CITY_ST.map(seg => seg.map(p => [CITY[0] + p[0], CITY[1] + p[1]])), [PIPE]).flatMap(segsOf);
    const ringSegs = segsOf(RING_PTS.filter((p, i) => i % 2 === 0).concat([RING_PTS[0]]));
    const gorgeC = [[430, 228], [372, 236], [310, 222], [240, 236], [168, 218], [90, 230], [20, 214], [-60, 222]];
    let n = 0;
    for (let i = 0; i < 2600 && n < 360; i++) {
      const cx = R() * 1640 - 20, cy = 100 + R() * 930;
      if (zones.some(([zx, zy, rx, ry]) => ((cx - zx) / rx) ** 2 + ((cy - zy) / ry) ** 2 < 1)) continue;
      if (rects.some(([x0, y0, x1, y1]) => cx > x0 && cx < x1 && cy > y0 && cy < y1)) continue;
      const [x, y] = G(cx, cy);
      if (inPoly(x, y, oceanW)) continue;
      if (ringSegs.some(sg => segDist(x, y, sg[0], sg[1]) < 22)) continue;
      if (PYLONS.some(p => Math.hypot(p[0] - x, p[1] - y) < 14)) continue;
      if (roadSegs.some(sg => segDist(x, y, sg[0], sg[1]) < 18)) continue;
      if (gorgeC.some(g => Math.hypot(g[0] - cx, g[1] - cy) < 30)) continue;
      // keep a thin margin off the sea shore
      if (inPoly(...G(cx - 18, cy), oceanW) || inPoly(...G(cx, cy + 14), oceanW)) continue;
      const dry = inPoly(x, y, dryW);
      if (dry && R() < .55) continue;
      const k = .75 + R() * .5;
      let t;
      if (dry) t = R() < .35 ? baobab(k * .9) : R() < .6 ? acacia(k) : bush(k * .9, '#8a9e4a');
      else t = R() < .55 ? pine(k, R) : R() < .85 ? roundTree(k, R) : bush(k);
      items.push([x + y, at(x, y, t)]);
      n++;
    }
  }

  /* ---------- labels ---------- */
  function tag(cx, cy, text, size = 11, col = '#1d2b3a') {
    return `<text x="${f(cx - CX)}" y="${f(cy - CY)}" font-size="${size}" font-weight="800" fill="${col}" text-anchor="middle" letter-spacing="1.2" font-family="Segoe UI,Arial,sans-serif" stroke="#ffffff" stroke-width="3" stroke-opacity=".85" paint-order="stroke" stroke-linejoin="round">${text}</text>`;
  }

  /* ---------- clouds ---------- */
  // Puffy clouds drifting across the whole map with a soft shadow on the ground below.
  // Each one is [canvas y, scale, duration s, delay s]; the CSS class .drift moves them (index.html).
  function clouds() {
    const puff = (k) => [[0, 0, 46, 22], [-34, 6, 30, 16], [34, 5, 34, 17], [-12, -14, 28, 18], [18, -12, 26, 17]]
      .map(([x, y, rx, ry]) => `<ellipse cx="${f(x * k)}" cy="${f(y * k)}" rx="${f(rx * k)}" ry="${f(ry * k)}"/>`).join('');
    const list = [[150, 1, 95, -10], [330, .75, 120, -70], [560, 1.15, 105, -35], [760, .85, 130, -95], [890, 1, 110, -60]];
    let s = `<defs><filter id="cloudSoft" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
      <filter id="cloudShade" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs>`;
    list.forEach(([cy, k, dur, b]) => {
      s += `<g transform="translate(0,${f(cy - CY)})"><g class="drift" style="animation-duration:${dur}s;animation-delay:${b}s">` +
        `<g fill="#0e2233" opacity=".14" filter="url(#cloudShade)" transform="translate(${f(-40 * k)},${f(70 * k)}) scale(1,.55)">${puff(k)}</g>` +
        `<g fill="#ffffff" opacity=".88" filter="url(#cloudSoft)">${puff(k)}</g>` +
        `<g fill="#dfe8f0" opacity=".55" filter="url(#cloudSoft)" transform="translate(0,${f(8 * k)})">${puff(k * .8)}</g>` +
        `</g></g>`;
    });
    return `<g pointer-events="none">${s}</g>`;
  }

  /* ---------- assemble ---------- */
  function render() {
    vdefs = ''; vn = 0;
    let s = ground() + falls();
    s += pipeline();
    const items = [];
    const region = (o, inner, dz = 0) => items.push([o[0] + o[1] + dz, `<g transform="translate(${f(P(o[0], o[1])[0])},${f(P(o[0], o[1])[1])})">${inner}</g>`]);
    // a region drawn as separate depth-sorted pieces: fn(put(localDepth, svg), go(kind, spec, localRoute, dur, begin))
    const pieces = (o, fn) => fn((d, inner) => items.push([o[0] + o[1] + d, `<g transform="translate(${f(P(o[0], o[1])[0])},${f(P(o[0], o[1])[1])})">${inner}</g>`]),
      (kind, spec, route, dur, b, stops) => drive(items, kind, spec, route.map(p => [o[0] + p[0], o[1] + p[1]]), dur, b, stops));
    region(HW, hwange());
    pieces(REF, ref);
    pieces(CITY, city);
    region(MSA, msasa());
    pieces(SUB, suburb);
    region(BEIRA, beira());
    region(FER, feruka());
    items.push([-2000, quay()]);
    items.push([-1999, tankerRun()]);
    items.push([-1998, A.marine.rig(-290, 580, { scale: 1 })]);
    boats(items);
    // Mutare mountains (canvas bases)
    // obstacles the mountains must not cover (canvas ellipses): Beira + Feruka depots, Msasa, the suburb, the card
    const MT_AVOID = [[...toC(BEIRA[0], BEIRA[1]), 72, 46], [...toC(FER[0], FER[1]), 40, 30], [...toC(MSA[0], MSA[1]), 110, 70],
      [...toC(SUB[0], SUB[1] + 40), 190, 90]];
    const CARD = [600, 350, 1000, 660];   // the sign-in card on a 16:10 screen (canvas px)
    const MUTARE = placeMountains([[530, 650, 170, 140, 8], [610, 680, 130, 100, 13], [470, 690, 120, 92, 3], [420, 760, 100, 70, 21], [350, 745, 90, 60, 34], [500, 790, 90, 56, 47]],
      { box: [280, 520, 760, 900], avoid: MT_AVOID, rects: [CARD] });
    // a few hills around the falls
    const FALLS_HILLS = placeMountains([[660, 160, 120, 46, 41], [330, 130, 110, 40, 43]], { box: [200, 80, 760, 260], avoid: [[515, 200, 110, 50]] });
    MUTARE.concat(FALLS_HILLS).forEach(([cx, cy, w, h, sd]) => { const [x, y] = G(cx, cy); items.push([x + y, mountain(cx, cy, w, h, sd)]); });
    A.map.mountains = MUTARE.concat(FALLS_HILLS).map(m => m.map(v => Math.round(v)));
    const big = MUTARE.slice().sort((p, q) => q[3] - p[3])[0], MT_LABEL = big && [big[0], big[1] - big[3] - 10];
    // power-line pylons
    PYLONS.forEach(p => items.push([p[0] + p[1], pylon(p[0], p[1])]));
    // ring traffic (L = lane offset; + is the outer lane). Tankers are only drawn facing +x / +y
    // Vehicles sharing a lane or a junction share a lap time (top 18 s, left + Hwange 15 s / 3 s, port 8 s with the
    // 16 s bottom tankers) and are offset so they never meet; keep that when adding or retiming one.
    const L = 4.5, E = SIDE, car = (spec, pts, dur, b) => drive(items, 'car', spec, pts, dur, b), truck = (spec, pts, dur, b) => drive(items, 'truck', spec, pts, dur, b);
    car({ livery: 'zetdc' }, lane('top', -E, E, L), 18, 0);
    car({ livery: 'moepd' }, lane('top', E, -E, -L), 18, -6);
    truck({ livery: 'petrotrade' }, lane('top', -E, E, L), 18, -9);
    car({ livery: 'zera' }, lane('right', -E, E, L), 13, -2);
    car({ livery: 'zetdc-truck' }, lane('right', E, -E, -L), 12, -7);
    car({ type: 'sedan', color: '#2f7fb8' }, lane('left', E, -E, -L), 15, -14.5);
    car({ livery: 'zetdc' }, lane('left', -E, E, L), 15, -3.5);
    truck({ livery: 'noic' }, lane('bottom', -E, E, -L), 16, -3);
    car({ type: 'hatch', color: '#d4493e' }, lane('bottom', E, -E, L), 12, -1);
    truck({ livery: 'noic' }, lane('bottom', -E, E, -L), 16, -11);
    // Hwange access + port road traffic
    car({ livery: 'zetdc' }, [[ROADS[0][0][0], 214.5], [HW[0] + 70, 214.5]], 3, -2.5);
    truck({ livery: 'noic' }, portLane(PORT_K[0][0] + 6, 598, 4.5), 8, -1);
    car({ type: 'pickup', color: '#f4f6f8' }, portLane(598, PORT_K[0][0] + 6, -4.5), 8, -3.5);
    trees(items);
    items.sort((a, b) => a[0] - b[0]);
    s += `<defs>${vdefs}</defs>` + items.map(i => i[1]).join('');
    LINES.forEach(l => { s += wires(l); });
    s += clouds();
    // labels
    s += tag(300, 150, 'VICTORIA FALLS') + tag(215, 482, 'HWANGE POWER STATION') + tag(1290, 432, 'RURAL ELECTRIFICATION · REF') +
      tag(1250, 520, 'POWERTEL COMMUNICATIONS') + tag(930, 820, 'NOIC  ·  BEIRA → FERUKA → MSASA', 10) + tag(100, 598, 'BEIRA PORT', 10) +
      (MT_LABEL ? tag(MT_LABEL[0], MT_LABEL[1], 'MUTARE', 10) : '') + tag(580, 858, 'FERUKA', 9);
    return `<g transform="translate(${CX},${CY})">${s}</g>`;
  }

  // every road / pipeline polyline in world units (used to keep mountains off the roads)
  // (the pipeline is allowed to pass behind a mountain, so placeMountains skips it)
  const PIPE_LINE = PIPE;
  const roadLines = () => [RING_PTS.concat([RING_PTS[0]])].concat(ROADS, CITY_ST.map(seg => seg.map(p => [CITY[0] + p[0], CITY[1] + p[1]])), [PIPE_LINE]);
  A.map = { roadLines, render, G };
})();
