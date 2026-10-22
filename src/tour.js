/* Scene tour (Assets.tour): the map flies between the places where something is happening.
   One lap: whole map for OUT s, zoom into a scene for IN s, stay there for HOLD s, zoom back out for BACK s.
   Each round shows every ZESA scene first, then the others, in random order; a scene with rounds: n is in one round in n.
   As the zoom in starts, a scene with an act (a name in Assets.map.acts, its parts drawn inside <g data-act="name">)
   has its own animations restarted so the camera lands at its act's `at` (the truck pulling up, the drone about to lift
   off, the tanker nearing the jetty), and every other CSS animation on the map is paused until the zoom out starts.
   The zoom keeps one screen point fixed (the view width shrinks geometrically and the centre moves in step), so the
   scene grows out of where it sits on the whole map.
   Used by the sign-in page (index.html) and the map demo (demo/index.html); each page says how to show a view.
   Needs src/map.js (scene points come from its SITES and the local offsets the scenes use there). */
(function () {
  const A = window.Assets;
  const OUT = 8, IN = 4, HOLD = 8, BACK = 4;

  // name, canvas point, width of map to show around it; zesa = shown first in every round
  function scenes() {
    const MAP = A.map, near = (k, x, y, z = 0) => { const o = MAP.site(k); return MAP.toC(o[0] + x, o[1] + y, z); };
    return [
      { zesa: true, act: 'crewREF', name: 'ZESA line crew at work — REF village', at: near('REF', -14, 4, 8), w: 150 },
      { zesa: true, act: 'crewCity', name: 'ZESA line crew at work — city back street', at: near('CITY', 142, -140, 8), w: 160 },
      { zesa: true, act: 'drone', name: 'ZESA pylon inspection drone — charging pad to the first pylon', at: [385, 432], w: 440 },
      { name: 'Spatial data: surveyors tagging poles and meters — suburb', at: MAP.SITES.SUB, w: 320 },
      { name: 'Spatial data: surveyors tagging poles and buildings — city', at: near('CITY', 10, -140), w: 300 },
      { act: 'tanker', rounds: 2, name: 'Oil tanker offloading at the Beira jetty', at: MAP.toC(-116, 657), w: 300 }
    ];
  }

  const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(2 - 2 * u, 3) / 2;
  // views are { w, cx, cy }: w map units across the screen, map point (cx, cy) at the screen centre
  function glide(a, b, u) {
    const e = ease(u), w = a.w * Math.pow(b.w / a.w, e), k = a.w === b.w ? e : (a.w - w) / (a.w - b.w);
    return { w, cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k };
  }
  const shuffle = list => list.sort(() => Math.random() - .5);

  /* Focus on scene sc in svg: restart its animations IN s before its act's `at` (each one at that point of its own loop)
     and pause every other CSS animation (the page styles #map.tour-focus and .tour-on). unfocus(svg) undoes it. */
  function focus(svg, sc) {
    svg.classList.add('tour-focus');
    if (!sc.act) return;
    const parts = svg.querySelectorAll(`[data-act="${sc.act}"]`), act = A.map.acts[sc.act];
    parts.forEach(g => {
      g.classList.add('tour-on');
      if (!act) return;
      g.querySelectorAll('animate,animateTransform,animateMotion,set').forEach(a => {
        let d; try { d = a.getSimpleDuration(); } catch (_) { return; }      // no finite loop: leave it be
        if (d > 0) a.beginElementAt(-(((act.at - IN) % d) + d) % d);
      });
    });
  }
  function unfocus(svg) {
    svg.classList.remove('tour-focus');
    svg.querySelectorAll('.tour-on').forEach(g => g.classList.remove('tour-on'));
  }

  /* o.home() the zoomed-out view, o.close(scene) the zoomed-in view, o.show(view) draws a view,
     o.caption(scene | null) shows or hides the scene's name, o.svg the map (to cue scenes; optional).
     Returns { start(from), stop(), refresh() }: start() begins a lap zoomed out; start(view) begins with the zoom out
     from that view (a resumed tour); refresh() draws the current view again (after a resize). */
  function run(o) {
    const SCENES = scenes();
    let bag = [], round = 0, last = null, lap = null, raf = 0;
    // a scene is cued by restarting its animations in the past, which the browser only allows after the clock's 0, so
    // the map's clock starts an hour on (everything moves together, so vehicles keep their timing with each other)
    if (o.svg && o.svg.getCurrentTime() < 3600) o.svg.setCurrentTime(o.svg.getCurrentTime() + 3600);
    function pick() {
      if (!bag.length) {
        const due = SCENES.filter(sc => !sc.rounds || round % sc.rounds === 0);
        round++;
        bag = shuffle(due.filter(sc => sc.zesa)).concat(shuffle(due.filter(sc => !sc.zesa)));
        if (bag[0] === last && bag.length > 1) bag.push(bag.shift());
      }
      return last = bag.shift();
    }
    function tick(now) {
      raf = requestAnimationFrame(tick);
      let t = (now - lap.t0) / 1000;
      if (t >= OUT + IN + HOLD + BACK) { lap = { t0: now, scene: pick(), phase: -1 }; t = 0; }
      const there = lap.from || o.close(lap.scene);
      const phase = t < OUT ? 0 : t < OUT + IN ? 1 : t < OUT + IN + HOLD ? 2 : 3;
      if (phase === 1) o.show(glide(o.home(), there, (t - OUT) / IN));
      else if (phase === 3) o.show(glide(there, o.home(), (t - OUT - IN - HOLD) / BACK));
      else if (phase !== lap.phase) o.show(phase ? there : o.home());      // a hold: draw the view once, then leave it
      if (phase !== lap.phase) {
        if (o.svg && phase === 1 && lap.scene && !lap.cued) { lap.cued = true; focus(o.svg, lap.scene); }
        if (o.svg && phase === 3) unfocus(o.svg);
        o.caption(phase === 1 || phase === 2 ? lap.scene : null);
      }
      lap.phase = phase;
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; lap = null; o.caption(null); if (o.svg) unfocus(o.svg); }
    function start(from) {
      stop();
      const now = performance.now();
      lap = from ? { t0: now - (OUT + IN + HOLD) * 1000, scene: null, from, phase: -1 } : { t0: now, scene: pick(), phase: -1 };
      raf = requestAnimationFrame(tick);
    }
    return { start, stop, refresh() { if (lap) lap.phase = -1; } };
  }

  A.tour = { run, scenes, glide, focus, unfocus, OUT, IN, HOLD, BACK };
})();
