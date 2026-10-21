/* Scene tour (Assets.tour): the map flies between the places where something is happening.
   One lap: whole map for at least OUT s, zoom into a scene for IN s, stay there for HOLD s, zoom back out for BACK s.
   Each round shows every ZESA scene first, then the others; a scene with rounds: n is in one round in n.
   Scenes with an act (a name in Assets.map.acts) are timed so the zoom in ends while their action is running, with
   at least HOLD s of it left: the whole-map wait stretches past OUT when needed, and of the scenes due, the one whose
   action comes soonest goes next. A scene that would keep the map zoomed out more than SLOW s past OUT gives way to
   one that is ready (taking the next round's scenes if none left in this one is) and keeps its place for a later lap.
   Scenes without an act are busy all the time.
   The zoom keeps one screen point fixed (the view width shrinks geometrically and the centre moves in step), so the
   scene grows out of where it sits on the whole map.
   Used by the sign-in page (index.html) and the map demo (demo/index.html); each page says how to show a view.
   Needs src/map.js (scene points come from its SITES and the local offsets the scenes use there). */
(function () {
  const A = window.Assets;
  const OUT = 8, IN = 4, HOLD = 8, BACK = 4, SLOW = 12;

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

  /* o.home() the zoomed-out view, o.close(scene) the zoomed-in view, o.show(view) draws a view,
     o.caption(scene | null) shows or hides the scene's name, o.clock() the map's SMIL time in seconds
     (svg.getCurrentTime(); without it nothing is timed). Returns { start(from), stop(), refresh() }:
     start() begins a lap zoomed out; start(view) begins with the zoom out from that view (a resumed tour);
     refresh() draws the current view again (after a resize). */
  function run(o) {
    const SCENES = scenes();
    let bag = [], round = 0, last = null, lap = null, raf = 0;   // bag: [{ sc, rank }], rank = 2 x round (+1 if not ZESA)
    // seconds from now until the zoom in may start, so it ends while sc's action has HOLD s left (at least OUT)
    function wait(sc) {
      const act = sc.act && o.clock && A.map.acts[sc.act];
      if (!act || !act.every) return OUT;
      const now = o.clock(), early = now + OUT + IN;                  // the earliest the zoom in can end
      const s0 = act.start + Math.floor((early - act.start) / act.every) * act.every;
      const at = early <= s0 + Math.max(0, act.dur - HOLD) ? early : s0 + act.every;
      return at - IN - now;
    }
    // add the next round: its ZESA scenes, then the rest (a scene still waiting in the bag keeps its earlier place)
    function refill() {
      const due = SCENES.filter(sc => (!sc.rounds || round % sc.rounds === 0) && !bag.some(b => b.sc === sc));
      bag.push(...shuffle(due.filter(sc => sc.zesa)).map(sc => ({ sc, rank: 2 * round })),
        ...shuffle(due.filter(sc => !sc.zesa)).map(sc => ({ sc, rank: 2 * round + 1 })));
      round++;
    }
    // the earliest-ranked scene that is ready soon enough, soonest first (never the last one twice running)
    function pick() {
      const options = () => bag.filter(b => b.sc !== last || bag.length === 1).map(b => ({ ...b, wait: wait(b.sc) }));
      if (!bag.length) refill();
      let opts = options();
      if (!opts.some(b => b.wait <= OUT + SLOW)) { refill(); opts = options(); }
      const ready = opts.filter(b => b.wait <= OUT + SLOW);
      const best = (ready.length ? ready : opts).sort((p, q) => p.rank - q.rank || p.wait - q.wait)[0];
      bag.splice(bag.findIndex(b => b.sc === best.sc), 1);
      last = best.sc;
      return { scene: best.sc, out: best.wait };
    }
    function tick(now) {
      raf = requestAnimationFrame(tick);
      let t = (now - lap.t0) / 1000;
      if (t >= lap.out + IN + HOLD + BACK) { lap = { t0: now, ...pick(), phase: -1 }; t = 0; }
      const there = lap.from || o.close(lap.scene), a = lap.out;
      const phase = t < a ? 0 : t < a + IN ? 1 : t < a + IN + HOLD ? 2 : 3;
      if (phase === 1) o.show(glide(o.home(), there, (t - a) / IN));
      else if (phase === 3) o.show(glide(there, o.home(), (t - a - IN - HOLD) / BACK));
      else if (phase !== lap.phase) o.show(phase ? there : o.home());      // a hold: draw the view once, then leave it
      if (phase !== lap.phase) o.caption(phase === 1 || phase === 2 ? lap.scene : null);
      lap.phase = phase;
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; lap = null; o.caption(null); }
    function start(from) {
      stop();
      const now = performance.now();
      lap = from ? { t0: now - (OUT + IN + HOLD) * 1000, out: OUT, scene: null, from, phase: -1 } : { t0: now, ...pick(), phase: -1 };
      raf = requestAnimationFrame(tick);
    }
    return { start, stop, refresh() { if (lap) lap.phase = -1; } };
  }

  A.tour = { run, scenes, glide, OUT, IN, HOLD, BACK };
})();
