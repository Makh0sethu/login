/* Scene tour (Assets.tour): the presenter flies the map between the places where something is happening.
   Nothing moves on its own: next / previous / a scene's number / the whole map. The first scene zooms in over IN s; from
   there the camera pans straight to the next (PAN_MIN to PAN_MAX s, by distance); the whole map zooms out over OUT s. Scenes are listed ZESA first.
   As the zoom in starts, a scene with an act (a name in Assets.map.acts, its parts drawn inside <g data-act="name">)
   has its own animations restarted so the camera lands at its act's `at` (the truck pulling up, the drone about to lift
   off, the tanker nearing the jetty), and every other CSS animation on the map is paused until the zoom out starts.
   Choosing the scene already shown plays its action again. The zoom keeps one screen point fixed (the view width
   shrinks geometrically and the centre moves in step), so the scene grows out of where it sits on the whole map.
   Used by the sign-in page (index.html, in its map mode: M) and the map demo (demo/index.html); each page says how
   to show a view, and controls() adds the presenter's keys.
   Needs src/map.js (scene points come from its SITES and the local offsets the scenes use there). */
(function () {
  const A = window.Assets;
  const IN = 4, OUT = 4, PAN_MIN = 2.5, PAN_MAX = 6;

  // name, canvas point, width of map to show around it; zesa scenes come first
  function scenes() {
    const MAP = A.map, near = (k, x, y, z = 0) => { const o = MAP.site(k); return MAP.toC(o[0] + x, o[1] + y, z); };
    return [
      { act: 'crewREF', name: 'REF line crew at work — rural village', at: near('REF', -14, 4, 8), w: 150 },
      { zesa: true, act: 'crewCity', name: 'ZESA line crew at work — city back street', at: near('CITY', 142, -140, 8), w: 160 },
      { zesa: true, act: 'drone', name: 'ZESA pylon inspection drone — charging pad to the first pylon', at: [385, 432], w: 440 },
      { act: 'fuel', name: 'Petrotrade tanker refuelling Station #1 — suburb', at: near('SUB', -62, -6, 6), w: 170 },
      { name: 'Spatial data: surveyors tagging poles and meters — suburb', at: MAP.SITES.SUB, w: 320 },
      { name: 'Spatial data: surveyors tagging poles and buildings — city', at: near('CITY', 10, -140), w: 300 },
      { act: 'tanker', name: 'Oil tanker offloading at the Beira jetty', at: MAP.toC(-116, 657), w: 300 }
    ];
  }

  const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(2 - 2 * u, 3) / 2;
  // views are { w, cx, cy }: w map units across the screen, map point (cx, cy) at the screen centre
  function glide(a, b, u) {
    const e = ease(u), w = a.w * Math.pow(b.w / a.w, e), k = a.w === b.w ? e : (a.w - w) / (a.w - b.w);
    return { w, cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k };
  }

  /* Focus on scene sc in svg: restart its animations IN s before its act's `at` (each one at that point of its own loop)
     and pause every other CSS animation (the page styles #map.tour-focus and .tour-on). unfocus(svg) undoes it. */
  function focus(svg, sc, lead = IN) {
    unfocus(svg);
    // a restart in the past only works after the clock's 0, and the browser resets the clock to 0 when the page has
    // loaded, so the clock is moved an hour on here (everything moves together, so vehicles keep their timing)
    if (svg.getCurrentTime() < 3600) svg.setCurrentTime(svg.getCurrentTime() + 3600);
    svg.classList.add('tour-focus');
    if (!sc.act) return;
    const act = A.map.acts[sc.act];
    svg.querySelectorAll(`[data-act="${sc.act}"]`).forEach(g => {
      g.classList.add('tour-on');
      if (!act) return;
      g.querySelectorAll('animate,animateTransform,animateMotion,set').forEach(a => {
        let d; try { d = a.getSimpleDuration(); } catch (_) { return; }      // no finite loop: leave it be
        if (d > 0) a.beginElementAt(-(((act.at - lead) % d) + d) % d);
      });
    });
  }
  function unfocus(svg) {
    svg.classList.remove('tour-focus');
    svg.querySelectorAll('.tour-on').forEach(g => g.classList.remove('tour-on'));
  }

  /* o.home() the whole-map view, o.close(scene) the zoomed-in view, o.show(view) draws a view, o.caption(scene | null)
     shows or hides the scene's name, o.svg the map (to cue scenes; optional), o.here() the view on screen now (optional,
     for a page that can also be panned by hand). Returns { scenes, current, go(i), next(), prev(), home(), interrupt(),
     refresh(), onChange }: current is the scene index (-1 = whole map); interrupt() stops a flight where it is (the
     page's own pan / zoom took over); refresh() draws the current view again (after a resize). */
  function run(o) {
    const SCENES = scenes(), n = SCENES.length;
    let cur = -1, view = o.home(), legs = [], raf = 0;
    const here = () => o.here ? o.here() : view;

    // legs run one after another: { to() target view, dur s, start() when it begins }
    function step(now) {
      const leg = legs[0];
      if (!leg) { raf = 0; return; }
      if (!leg.t0) { leg.t0 = now; leg.a = here(); leg.b = leg.to(); leg.start(); }
      const u = Math.min(1, (now - leg.t0) / 1000 / leg.dur);
      o.show(view = glide(leg.a, leg.b, u));
      if (u >= 1) legs.shift();
      raf = requestAnimationFrame(step);
    }
    const out = () => ({ to: o.home, dur: OUT, start: () => { if (o.svg) unfocus(o.svg); o.caption(null); } });
    const into = sc => ({ to: () => o.close(sc), dur: IN, start: () => { if (o.svg) focus(o.svg, sc); o.caption(sc); } });
    // from one scene straight to the next: a pan (with whatever zoom change the two widths need), longer the further it goes
    const pan = sc => {
      const b = o.close(sc), a = here(), dur = Math.min(PAN_MAX, Math.max(PAN_MIN, 1.2 + 1.1 * Math.hypot(b.cx - a.cx, b.cy - a.cy) / Math.max(a.w, b.w)));
      return { to: () => o.close(sc), dur, start: () => { if (o.svg) focus(o.svg, sc, dur); o.caption(sc); } };
    };
    function go(i) {
      if (i === cur && i >= 0 && !legs.length) { if (o.svg) focus(o.svg, SCENES[i]); return; }   // play it again
      cancelAnimationFrame(raf);
      legs = i < 0 ? [out()] : cur >= 0 ? [pan(SCENES[i])] : [into(SCENES[i])];
      cur = i;
      if (t.onChange) t.onChange(cur);
      raf = requestAnimationFrame(step);
    }
    function interrupt() { cancelAnimationFrame(raf); raf = 0; legs = []; }
    const t = {
      scenes: SCENES, onChange: null, go, interrupt,
      get current() { return cur; },
      next: () => go(cur + 1 < n ? cur + 1 : -1),
      prev: () => go(cur < 0 ? n - 1 : cur - 1),
      home: () => go(-1),
      refresh() { if (!legs.length) o.show(view = cur >= 0 ? o.close(SCENES[cur]) : o.home()); }
    };
    return t;
  }

  /* The presenter's keys: right / PageDown next, left / PageUp previous, Home whole map, 1-9 a scene (presentation
     clickers send PageUp / PageDown), Esc o.exit() if given, else the whole map. They act only while o.active()
     (default always), and never on keys typed into a form field. */
  function controls(t, o = {}) {
    addEventListener('keydown', e => {
      if (o.active && !o.active() || e.target.closest && e.target.closest('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key, d = +k;
      if (k === 'ArrowRight' || k === 'PageDown') t.next();
      else if (k === 'ArrowLeft' || k === 'PageUp') t.prev();
      else if (k === 'Home') t.home();
      else if (k === 'Escape') (o.exit || t.home)();
      else if (d >= 1 && d <= t.scenes.length) t.go(d - 1);
      else return;
      e.preventDefault();
    });
  }

  A.tour = { run, controls, scenes, glide, focus, unfocus, IN, OUT };
})();
