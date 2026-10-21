/* Road network: one closed isometric road loop that links the five scene tiles, with cars driving it.
   API: Assets.roads.mount(host, opts) -> { rebuild(), destroy() }
     host: positioned element the overlay fills (the .page wrapper); the overlay sits behind its content.
     opts.stops: [{ el, ax?, ay? }] tiles in loop order; (ax, ay) = plate centre as a fraction of el's box.
     opts.legs:  [{ first: 'x'|'y', k? }] one per stop (leg i runs stop i -> stop i+1);
                 first = which world axis the leg moves along first, k = number of zig-zag steps ('auto' fits under opts.ceil).
     opts.ceil:  element whose bottom edge the road must stay below (the header).
     opts.minWidth: below this viewport width the overlay hides (stacked mobile layout).
     opts.rails: [{ el, vb: [x, y, w, h], org: [x, y], proj: 'iso'|'oblique', from: [x, y], axis: 0|1, kind: 'coal'|'fuel', speed? }]
                 a track + looping train that starts inside a tile (el's svg, in that scene's own world units and
                 projection) and runs along +axis until it is off the page.
   The road is built in world (ground) coordinates where every leg is axis-aligned, so on screen it runs
   along the two iso diagonals and the cars can use the existing cars.js sprites:
   +x native (dir 1), -x native (dir -1), +y / -y = the same two mirrored horizontally.
   Traffic keeps left (Zimbabwe): one lane runs the loop forwards, the other backwards. */
(function () {
  const Assets = window.Assets = window.Assets || {};
  const NS = 'http://www.w3.org/2000/svg';
  const toW = (sx, sy) => [sy + sx / (2 * K), sy - sx / (2 * K)];          // screen -> ground (inverse of P at z=0)
  const toS = (x, y) => P(x, y, 0);
  const f1 = v => v.toFixed(1);
  const sgn = v => (v > 0) - (v < 0);

  // axis-aligned staircase from a to b in k steps, moving along `first` then the other axis in each step
  function leg(a, b, first, k) {
    const out = [];
    for (let i = 0; i < k; i++) {
      const p = [a[0] + (b[0] - a[0]) * i / k, a[1] + (b[1] - a[1]) * i / k];
      const q = [a[0] + (b[0] - a[0]) * (i + 1) / k, a[1] + (b[1] - a[1]) * (i + 1) / k];
      out.push(p, first === 'x' ? [q[0], p[1]] : [p[0], q[1]]);
    }
    return out;
  }
  // drop repeated and collinear vertices of a closed rectilinear loop
  function clean(loop) {
    let pts = loop.filter((p, i) => { const q = loop[(i + 1) % loop.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5; });
    let changed = true;
    while (changed && pts.length > 3) {
      changed = false;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[(i - 1 + pts.length) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length];
        if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 1e-6) { pts.splice(i, 1); changed = true; break; }
      }
    }
    return pts;
  }
  const dirOf = (a, b) => [sgn(b[0] - a[0]), sgn(b[1] - a[1])];
  // the ground normal that points to the driver's left when travelling along d
  function leftOf(d) {
    const s0 = toS(0, 0), s1 = toS(d[0], d[1]);
    const hx = s1[0] - s0[0], hy = s1[1] - s0[1];               // screen heading (y down)
    const n = [-d[1], d[0]], sn = toS(n[0], n[1]);
    return (sn[0] - s0[0]) * hy + (sn[1] - s0[1]) * -hx > 0 ? n : [-n[0], -n[1]];
  }
  // offset a closed rectilinear loop sideways (positive = left of the travel direction)
  function offset(loop, d) {
    return loop.map((v, i) => {
      const a = loop[(i - 1 + loop.length) % loop.length], b = loop[(i + 1) % loop.length];
      const n1 = leftOf(dirOf(a, v)), n2 = leftOf(dirOf(v, b));
      return [v[0] + d * (n1[0] + n2[0]), v[1] + d * (n1[1] + n2[1])];
    });
  }
  const path = loop => 'M' + loop.map(p => toS(p[0], p[1]).map(f1).join(' ')).join(' L') + 'Z';

  /* ---------- railway ---------- */
  const OBLIQUE = (x, y, z = 0) => [x - y * 0.55, y * 0.7 - z];
  // world rect along an axis: u0..u1 along `axis`, -w/2..w/2 across, at cross-axis position c
  const along = (axis, c, u0, u1, w) => axis ? [[c - w / 2, u0], [c + w / 2, u0], [c + w / 2, u1], [c - w / 2, u1]] : [[u0, c - w / 2], [u1, c - w / 2], [u1, c + w / 2], [u0, c + w / 2]];
  const at = (axis, c, u, off = 0) => axis ? [c + off, u] : [u, c + off];
  function track(axis, c, u0, u1) {
    const ln = (a, b, col, w, extra = '') => `<polyline points="${pts([P(a[0], a[1]), P(b[0], b[1])])}" stroke="${col}" stroke-width="${w}" fill="none" ${extra}/>`;
    let s = poly(along(axis, c, u0, u1, 11).map(p => P(p[0], p[1], 0)), '#b8ae9f') + poly(along(axis, c, u0, u1, 8).map(p => P(p[0], p[1], 0.3)), '#9c9284');
    for (let u = u0; u < u1; u += 5.6) s += ln(at(axis, c, u, -4.2), at(axis, c, u, 4.2), '#6b5a48', 1.6);
    [-2.6, 2.6].forEach(o => { s += ln(at(axis, c, u0, o), at(axis, c, u1, o), '#5d6874', 1.1) + ln(at(axis, c, u0, o - .3), at(axis, c, u1, o - .3), '#d7dee5', .4); });
    return s;
  }
  // train with its nose at u = 0 heading +axis, cars trailing towards -u (cross-axis centre 0)
  function train(axis, kind) {
    const bx = (u, len, w, z, h, col) => axis ? box(-w / 2, u, z, w, len, h, col) : box(u, -w / 2, z, len, w, h, col);
    const parts = [];
    const loco = kind === 'fuel' ? C.red : C.green;
    // band painted on the side that faces the viewer (+y face when running along x, +x face along y)
    const band = (u, len, w, z0, z1, col) => poly(axis ? [P(w / 2, u, z0), P(w / 2, u + len, z0), P(w / 2, u + len, z1), P(w / 2, u, z1)] : [P(u, w / 2, z0), P(u + len, w / 2, z0), P(u + len, w / 2, z1), P(u, w / 2, z1)], col);
    parts.push(bx(-18, 18, 7, 1.2, 1.6, C.black) + bx(-17, 16, 6.4, 2.8, 6, loco) + bx(-16, 9, 6.6, 8.8, .8, C.gold) + bx(-6, 5, 6.6, 8.8, 3, C.white) + band(-17, 16, 6.4, 4.4, 5.4, C.gold[0]));
    for (let i = 0; i < 4; i++) {
      const u = -18 - (i + 1) * 15;
      let w = bx(u, 13, 6.6, 1.2, 1.6, C.black);
      if (kind === 'fuel') w += bx(u + .6, 11.8, 6, 2.8, 6, C.white) + band(u + .6, 11.8, 6.02, 5, 6.2, C.red[1]) + bx(u + 5, 3, 3, 8.8, 1, C.grey);
      else w += bx(u, 13, 6.8, 2.8, 5.6, C.dark) + bx(u + 1.5, 10, 5, 8.4, 1, C.black);
      parts.push(w);
    }
    return { svg: parts.reverse().join(''), len: 18 + 4 * 15 };
  }
  function rail(r, hr, W, H) {
    const rc = r.el.getBoundingClientRect(), [vx, vy, vw] = r.vb, k = rc.width / vw;
    const ox = rc.left - hr.left + (r.org[0] - vx) * k, oy = rc.top - hr.top + (r.org[1] - vy) * k;
    const base = P;
    if (r.proj === 'oblique') P = OBLIQUE;
    try {
      const axis = r.axis, c = r.from[axis ? 0 : 1], u0 = r.from[axis];
      const tr = train(axis, r.kind);
      let u1 = u0;                                   // run on until the point is off the page
      for (; u1 < u0 + 4000; u1 += 10) {
        const [px, py] = P(...at(axis, c, u1)), sx = ox + px * k, sy = oy + py * k;
        if (sx < -20 || sx > W + 20 || sy > H + 20) break;
      }
      const end = u1 + tr.len + 20, a = P(...at(axis, c, u0)), b = P(...at(axis, c, end));
      const dur = (end - u0) / (r.speed || 34);
      return `<g transform="translate(${f1(ox)},${f1(oy)}) scale(${k.toFixed(3)})">` + track(axis, c, u0 - tr.len, end) +
        `<g>${tr.svg}` +
        `<animateMotion dur="${dur.toFixed(1)}s" repeatCount="indefinite" path="M${a.map(f1).join(' ')} L${b.map(f1).join(' ')}"/></g></g>`;
    } finally { P = base; }
  }

  /* ---------- vehicles ---------- */
  const FLEET = [
    { livery: 'zetdc' }, { livery: 'moepd' }, { livery: 'zera' }, { livery: 'zetdc-truck' },
    { type: 'minibus', color: '#f2c230' }, { type: 'sedan', color: '#d4493e' }, { type: 'hatch', color: '#2f7fb8' },
    { type: 'suv', color: '#3a3f46' }, { type: 'ev', color: '#4f9a5d' }, { type: 'sedan', color: '#f4f6f8' }
  ];
  // heading -> variant: 0 +x, 1 +y, 2 -x, 3 -y
  const variantOf = d => d[0] > 0 ? 0 : d[1] > 0 ? 1 : d[0] < 0 ? 2 : 3;
  function vehicle(spec, scale) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'road-car');
    g.innerHTML = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dir, m]) =>
      `<g transform="scale(${m * scale},${scale})" style="display:none">${Assets.cars.car(Object.assign({ dir }, spec))}</g>`).join('');
    return { g, parts: [...g.children], v: -1 };
  }

  function mount(host, opts = {}) {
    const o = Object.assign({ width: 26, carScale: 1.15, speed: 52, perLane: 6, minWidth: 981 }, opts);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'road-net');
    svg.setAttribute('aria-hidden', 'true');
    host.prepend(svg);
    const railG = document.createElementNS(NS, 'g'), roadG = document.createElementNS(NS, 'g'), carG = document.createElementNS(NS, 'g');
    svg.append(railG, roadG, carG);
    let lanes = [], cars = [], raf = 0, last = 0;
    const still = matchMedia('(prefers-reduced-motion: reduce)');

    function build() {
      const hr = host.getBoundingClientRect();
      svg.setAttribute('width', hr.width); svg.setAttribute('height', host.scrollHeight);
      svg.setAttribute('viewBox', `0 0 ${f1(hr.width)} ${f1(host.scrollHeight)}`);
      if (innerWidth < o.minWidth) { svg.style.display = 'none'; lanes = []; return; }
      svg.style.display = '';
      railG.innerHTML = (o.rails || []).map(r => rail(r, hr, hr.width, host.scrollHeight)).join('');
      const anchors = o.stops.map(s => {
        const r = s.el.getBoundingClientRect();
        return toW(r.left - hr.left + r.width * (s.ax ?? 0.5), r.top - hr.top + r.height * (s.ay ?? 0.6));
      });
      const ceil = o.ceil ? o.ceil.getBoundingClientRect().bottom - hr.top + o.width : -1e9;
      let loop = [];
      anchors.forEach((a, i) => {
        const b = anchors[(i + 1) % anchors.length], L = o.legs[i];
        let k = L.k === 'auto' ? 1 : (L.k || 1), seg;
        for (; ; k++) {                       // add zig-zag steps until the leg stays below the ceiling
          seg = leg(a, b, L.first, k);
          if (L.k !== 'auto' || k > 8 || seg.every(p => toS(p[0], p[1])[1] >= ceil)) break;
        }
        loop.push(...seg);
      });
      loop = clean(loop);

      // road surface: curb band, asphalt, edge lines, centre dashes
      const hw = o.width / 2;
      const band = (d0, d1) => path(offset(loop, d0)) + ' ' + path(offset(loop, d1));
      roadG.innerHTML =
        `<path d="${band(hw + 3, -hw - 3)}" fill="#c3ccd6" fill-rule="evenodd" transform="translate(0,3)"/>` +
        `<path d="${band(hw + 3, -hw - 3)}" fill="#e8edf2" fill-rule="evenodd"/>` +
        `<path d="${band(hw, -hw)}" fill="#8f98a2" fill-rule="evenodd"/>` +
        `<path d="${path(offset(loop, hw - 2))}" fill="none" stroke="#eef2f5" stroke-width="1" opacity=".8"/>` +
        `<path d="${path(offset(loop, -hw + 2))}" fill="none" stroke="#eef2f5" stroke-width="1" opacity=".8"/>` +
        `<path d="${path(loop)}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="9 8" stroke-linejoin="round"/>`;

      // lanes: forward loop and reversed loop, each offset to its own left side
      const mk = pts => {
        const segs = []; let len = 0;
        pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], l = Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]); segs.push({ p, q, l, s: len, d: dirOf(p, q) }); len += l; });
        return { segs, len };
      };
      const lo = hw / 2;
      lanes = [mk(offset(loop, lo)), mk(offset(loop.slice().reverse(), lo))];
      if (!cars.length) {
        let n = 0;
        lanes.forEach((_, li) => { for (let i = 0; i < o.perLane; i++) { const c = vehicle(FLEET[n++ % FLEET.length], o.carScale); c.lane = li; c.u = i / o.perLane + li * 0.07; carG.append(c.g); cars.push(c); } });
      }
      place();
    }

    function place() {
      if (!lanes.length) return;
      cars.forEach(c => {
        const ln = lanes[c.lane], at = ((c.u % 1) + 1) % 1 * ln.len;
        const sg = ln.segs.find(s => at < s.s + s.l) || ln.segs[ln.segs.length - 1];
        const t = (at - sg.s) / (sg.l || 1), x = sg.p[0] + (sg.q[0] - sg.p[0]) * t, y = sg.p[1] + (sg.q[1] - sg.p[1]) * t;
        const [sx, sy] = toS(x, y);
        c.sy = sy;
        c.g.setAttribute('transform', `translate(${f1(sx)},${f1(sy)})`);
        const v = variantOf(sg.d);
        if (v !== c.v) { if (c.v >= 0) c.parts[c.v].style.display = 'none'; c.parts[v].style.display = ''; c.v = v; }
      });
      // painter's order: nearer (lower on screen) cars last
      const order = cars.slice().sort((a, b) => a.sy - b.sy);
      if (order.some((c, i) => carG.children[i] !== c.g)) order.forEach(c => carG.append(c.g));
    }

    function tick(t) {
      const dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
      if (lanes.length && !still.matches) {
        cars.forEach(c => { c.u += o.speed * dt / lanes[c.lane].len; });
        place();
      }
      raf = requestAnimationFrame(tick);
    }

    let pend = 0;
    const later = () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(build); };
    const ro = new ResizeObserver(later);
    ro.observe(host);
    addEventListener('resize', later);
    addEventListener('load', later);
    build();
    raf = requestAnimationFrame(tick);
    return {
      rebuild: build,
      destroy() { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('resize', later); svg.remove(); }
    };
  }

  Assets.roads = { mount, track, train };
})();
