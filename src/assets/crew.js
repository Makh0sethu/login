/* ZETDC line crew (Assets.crew): linemen in navy overalls, hi-vis vests and white hard hats, drawn in screen px
   around their feet, plus the extension ladder they lean on a pole and a traffic cone.
   actor() moves one figure through a track of keyed poses on a loop timed like the vehicle it rides with. */
(function () {
  const A = window.Assets;
  const f = n => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? '0' : String(v); };
  const SKIN = '#6f4428', NAVY = '#2b3866', VEST = '#f08c2a', STRIPE = '#fff3c4', HAT = '#ffffff', HAT_SH = '#c9d3dd',
    BOOT = '#23272c', BELT = '#3a2a1c';
  const ln = (x1, y1, x2, y2, c, w) => `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const hand = (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r=".55" fill="${SKIN}"/>`;
  const arm = (x1, y1, x2, y2) => ln(x1, y1, x2, y2, NAVY, 1.1) + hand(x2, y2);
  const leg = (x1, y1, x2, y2) => ln(x1, y1, x2, y2, NAVY, 1.5) + `<ellipse cx="${f(x2)}" cy="${f(y2)}" rx=".9" ry=".5" fill="${BOOT}"/>`;
  // looped motion on a part: rotate about (cx, cy) through the angles, or step it by translate values
  const swing = (inner, cx, cy, a, dur, delay = 0) => `<g>${inner}<animateTransform attributeName="transform" type="rotate" values="${a.map(v => v + ' ' + cx + ' ' + cy).join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></g>`;
  const step = (inner, vals, dur, delay = 0) => `<g>${inner}<animateTransform attributeName="transform" type="translate" values="${vals}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></g>`;
  const shadow = `<ellipse rx="2.4" ry=".9" fill="#0b1e33" opacity=".18"/>`;
  const torso = (y = 0, back = false) => `<rect x="-2" y="${f(y - 8.6)}" width="4" height="4.4" rx="1" fill="${VEST}"/>` +
    `<path d="M-2 ${f(y - 6.6)}h4" stroke="${STRIPE}" stroke-width=".55"/>` + (back ? `<path d="M0 ${f(y - 8.4)}v1.6" stroke="${STRIPE}" stroke-width=".5"/>` : '') +
    `<path d="M-2 ${f(y - 4.5)}h4" stroke="${BELT}" stroke-width=".6"/>`;
  const head = (y = 0, back = false) => `<circle cy="${f(y - 9.9)}" r="1.45" fill="${back ? '#4a2e1c' : SKIN}"/>` +
    `<path d="M-1.7 ${f(y - 10.3)}a1.7 1.6 0 0 1 3.4 0z" fill="${HAT}"/><path d="M-2.1 ${f(y - 10.3)}h4.2" stroke="${HAT_SH}" stroke-width=".5"/>`;

  const stand = () => shadow + leg(-.8, -4.6, -1, -.4) + leg(.8, -4.6, 1, -.4) + torso() + arm(-2, -8, -2.5, -5) + arm(2, -8, 2.5, -5) + head();
  // walking: legs and arms swing in turn, the body bobs on each stride
  const walk = () => shadow +
    step(swing(leg(0, -4.6, 0, -.4), 0, -4.6, [-24, 24, -24], .56) + swing(leg(0, -4.6, 0, -.4), 0, -4.6, [24, -24, 24], .56) +
      swing(arm(-1.8, -8, -1.8, -5), -1.8, -8, [20, -20, 20], .56) + swing(arm(1.8, -8, 1.8, -5), 1.8, -8, [-20, 20, -20], .56) +
      torso() + head(), '0 0;0 -.45;0 0', .28);
  // crouched to set down / pick up a cone
  const crouch = () => shadow + leg(-.8, -2.8, -2, -1.2) + ln(-2, -1.2, -1, -.4, NAVY, 1.5) + leg(.8, -2.8, 1.6, -.4) +
    `<g transform="translate(0 1.8)">${torso() + head()}</g>` + arm(-2, -6.2, -3, -.8) + arm(2, -6.2, 1.2, -2.4);
  // ground spotter: radio in one hand, the other arm raised towards the pole
  const spot = () => shadow + leg(-.8, -4.6, -1, -.4) + leg(.8, -4.6, 1, -.4) + torso() +
    swing(arm(-2, -8, -3.4, -11.4), -2, -8, [0, -12, 0], 1.8) + arm(2, -8, 2.4, -5.4) +
    `<rect x="2" y="-6.6" width="1" height="1.8" rx=".3" fill="${BOOT}"/><path d="M2.8 -6.6v-1" stroke="${BOOT}" stroke-width=".3"/>` + head();
  // the extension ladder carried on the shoulder (a short side view of it)
  const shoulderLadder = `<path d="M-7 -9.9H6.5M-7 -8.5H6.5" stroke="#a9b4bf" stroke-width=".45"/>` +
    [-6, -4, -2, 0, 2, 4, 6].map(x => `<path d="M${x} -9.9V-8.5" stroke="#c3ccd5" stroke-width=".3"/>`).join('');
  const carry = () => walk() + shoulderLadder + hand(-1.2, -9.2) + hand(1.6, -9.2);
  // climbing the ladder, seen from behind: hands and feet step up the rungs in turn
  const climb = () =>
    step(leg(-.8, -4.6, -1.2, -1.2), '0 0;0 -1.6;0 0', .8) + step(leg(.8, -4.6, 1.2, -1.2), '0 -1.6;0 0;0 -1.6', .8) +
    torso(0, true) + step(arm(-1.8, -8, -1.2, -11.6), '0 -1.4;0 0;0 -1.4', .8) + step(arm(1.8, -8, 1.2, -11.6), '0 0;0 -1.4;0 0', .8) + head(0, true);
  // at the top of the ladder, working on the crossarm above his head: one hand holds on, the other works a tool
  // that sparks against the fitting
  const reach = () => leg(-.8, -4.6, -1.2, -.4) + leg(.8, -4.6, 1.2, -1.6) + torso(0, true) + arm(-1.8, -8, -1.4, -12.4) +
    swing(arm(1.8, -8, 2.6, -12.6) + `<path d="M2.6 -12.6l.8 -1" stroke="#b2bfcc" stroke-width=".55"/>`, 1.8, -8, [0, -14, 0], .55) + head(0, true) +
    `<g transform="translate(3.6 -14)"><path d="M0 -1.5L.4 -.4L1.5 0L.4 .4L0 1.5L-.4 .4L-1.5 0L-.4 -.4Z" fill="#fff6c4"><animate attributeName="opacity" values="0;1;0;0" dur=".55s" repeatCount="indefinite"/></path></g>`;
  // footing the ladder, seen from behind: both hands on the rails, looking up
  const hold = () => shadow + leg(-1, -4.6, -1.4, -.4) + leg(1, -4.6, 1.4, -.4) + torso(0, true) + arm(-1.9, -8, -1.3, -10.6) + arm(1.9, -8, 1.3, -10.6) + head(0, true);
  // the ladder leant against a pole, from its foot to its top (screen points)
  function ladder(foot, top) {
    const dx = top[0] - foot[0], dy = top[1] - foot[1], len = Math.hypot(dx, dy), nx = -dy / len * 1.3, ny = dx / len * 1.3;
    let s = ln(foot[0] - nx, foot[1] - ny, top[0] - nx, top[1] - ny, '#a9b4bf', .5) + ln(foot[0] + nx, foot[1] + ny, top[0] + nx, top[1] + ny, '#d5dde4', .5);
    for (let u = .06; u < 1; u += 2 / len) s += ln(foot[0] + dx * u - nx, foot[1] + dy * u - ny, foot[0] + dx * u + nx, foot[1] + dy * u + ny, '#c3ccd5', .3);
    return s;
  }
  const cone = () => `<ellipse rx="1.8" ry=".65" fill="#d4741a"/><path d="M-1.3 0L-.35 -3.6H.35L1.3 0Z" fill="${VEST}"/><path d="M-.9 -1.6H.9" stroke="#fff" stroke-width=".6"/>`;

  /* one figure on a loop of dur s (begin as its vehicle): track keys are [s, [sx, sy], pose]. It moves in straight lines
     from key to key and shows poses[pose] from each key until the next; it is hidden while the pose is null or not in
     poses, so one track can be split over several depth slots by giving each slot only some of the poses. */
  function actor(track, poses, dur, begin) {
    const k = track.slice().sort((a, b) => a[0] - b[0]);
    if (k[0][0] > 0) k.unshift([0, k[0][1], null]);
    if (k[k.length - 1][0] < dur) k.push([dur, k[k.length - 1][1], null]);
    const kt = [];
    k.forEach((q, i) => kt.push(i ? Math.max(q[0] / dur, kt[i - 1] + 1e-4) : 0));
    kt[kt.length - 1] = 1;
    const timing = `dur="${dur}s" begin="${begin}s" repeatCount="indefinite"`, keyTimes = kt.map(v => +v.toFixed(5)).join(';');
    let s = '';
    for (const name in poses) {
      if (!k.some(q => q[2] === name)) continue;
      s += `<g visibility="hidden">${poses[name]}<animate attributeName="visibility" values="${k.map(q => q[2] === name ? 'visible' : 'hidden').join(';')}" keyTimes="${keyTimes}" calcMode="discrete" ${timing}/></g>`;
    }
    return `<g>${s}<animateTransform attributeName="transform" type="translate" values="${k.map(q => f(q[1][0]) + ' ' + f(q[1][1])).join(';')}" keyTimes="${keyTimes}" ${timing}/></g>`;
  }
  // inner shown only from t0 to t1 s of each dur s loop
  const during = (inner, t0, t1, dur, begin) =>
    `<g visibility="hidden">${inner}<animate attributeName="visibility" values="hidden;visible;hidden" keyTimes="0;${+(t0 / dur).toFixed(5)};${+(t1 / dur).toFixed(5)}" calcMode="discrete" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;

  /* ---------- ribbon cutting: an official in a black suit, guests and the ribbon, all on one loop of dur s with the cut
     at cut s (begin 0, so the scene tour can restart them together) ---------- */
  const kt = (dur, ...ts) => ts.map(t => +(t / dur).toFixed(4)).join(';');
  // the official: black suit, white shirt, red tie, scissors in the raised right hand; they snip twice, cut, then lower the arm
  function official(dur = 12, cut = 4) {
    const SUIT = '#1e2126', sleeve = (x1, y1, x2, y2) => ln(x1, y1, x2, y2, SUIT, 1.2) + hand(x2, y2);
    const blade = a => `<path d="M0 0L2.6 ${a}" stroke="#d5dde4" stroke-width=".45" stroke-linecap="round"/>`;
    const scissors = `<g transform="translate(4.6 -6.2)"><circle cx="-.5" cy=".5" r=".55" fill="none" stroke="#d4211f" stroke-width=".35"/>` +
      `<circle cx=".2" cy=".9" r=".55" fill="none" stroke="#d4211f" stroke-width=".35"/>${blade(-.3)}` +
      `<g>${blade(.3)}<animateTransform attributeName="transform" type="rotate" values="0;0;-28;0;-28;0;0" keyTimes="${kt(dur, 0, cut - 1.4, cut - 1.1, cut - .8, cut - .4, cut, dur)}" dur="${dur}s" repeatCount="indefinite"/></g></g>`;
    const arm = `<g>${sleeve(1.8, -8, 4.4, -6.2)}${scissors}<animateTransform attributeName="transform" type="rotate" values="0 1.8 -8;0 1.8 -8;55 1.8 -8;55 1.8 -8;0 1.8 -8" keyTimes="${kt(dur, 0, cut + 1.6, cut + 2.2, dur - .8, dur)}" dur="${dur}s" repeatCount="indefinite"/></g>`;
    return shadow + leg(-.8, -4.6, -1, -.4).replace(new RegExp(NAVY, 'g'), SUIT) + leg(.8, -4.6, 1, -.4).replace(new RegExp(NAVY, 'g'), SUIT) +
      `<rect x="-2.1" y="-8.8" width="4.2" height="4.8" rx="1" fill="${SUIT}"/><path d="M-.9 -8.8L0 -6.6L.9 -8.8Z" fill="#fff"/><path d="M0 -8.4L-.35 -6.9L0 -6.3L.35 -6.9Z" fill="#c8202a"/>` +
      sleeve(-2, -8, -2.5, -5) + arm + `<circle cy="-9.9" r="1.45" fill="${SKIN}"/><path d="M-1.45 -10.2a1.45 1.4 0 0 1 2.9 0z" fill="#1b1e22"/>`;
  }
  // a guest in their own colours, arms down until the cut, then clapping for a few seconds
  function guest(col, dur = 12, cut = 4, delay = 0) {
    const sl = (x1, y1, x2, y2) => ln(x1, y1, x2, y2, col, 1.1) + hand(x2, y2);
    const body = shadow + leg(-.8, -4.6, -1, -.4).replace(new RegExp(NAVY, 'g'), '#3a3f46') + leg(.8, -4.6, 1, -.4).replace(new RegExp(NAVY, 'g'), '#3a3f46') +
      `<rect x="-2" y="-8.6" width="4" height="4.6" rx="1" fill="${col}"/><circle cy="-9.9" r="1.45" fill="${SKIN}"/><path d="M-1.45 -10.2a1.45 1.4 0 0 1 2.9 0z" fill="#23272c"/>`;
    const clap = step(sl(-1.8, -8, -.5, -6.6), '0 0;-.5 0;0 0', .3, delay) + step(sl(1.8, -8, .5, -6.6), '0 0;.5 0;0 0', .3, delay);
    return body + during(sl(-2, -8, -2.5, -5) + sl(2, -8, 2.5, -5), 0, cut + .2, dur, 0) + during(sl(-2, -8, -2.5, -5) + sl(2, -8, 2.5, -5), cut + 3.4 + delay, dur, dur, 0) +
      during(clap, cut + .2, cut + 3.4 + delay, dur, 0);
  }
  /* the ribbon on two gold posts, from screen point a to b (around a's foot); at the cut both halves drop from their posts
     to the ground and a burst of confetti goes up, then everything is reset unseen at the end of the loop */
  function ribbon(b, dur = 12, cut = 4, h = 8) {
    const post = ([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.3" ry=".5" fill="#bf8f2c"/>` + ln(x, y, x, y - h, '#d9a53c', .9) + `<circle cx="${f(x)}" cy="${f(y - h - .4)}" r=".8" fill="#f2c35c"/>`;
    const A0 = [0, -h + .4], B0 = [b[0], b[1] - h + .4], M = [B0[0] / 2, B0[1] / 2 + 1.2];
    // each half swings down about its post top until its free end rests on the ground along the line between the posts
    const half = (p, side) => {
      const dx = M[0] - p[0], dy = M[1] - p[1], len = Math.hypot(dx, dy), th = Math.atan2(dy, dx) * 180 / Math.PI;
      const D = [side * b[0], side * b[1]], q = [0, h - .4], dd = D[0] ** 2 + D[1] ** 2, qd = q[1] * D[1];
      const disc = qd * qd - dd * (q[1] * q[1] - len * len), t = disc > 0 ? (-qd + Math.sqrt(disc)) / dd : 0;
      const want = Math.atan2(q[1] + t * D[1], q[0] + t * D[0]) * 180 / Math.PI;
      let r = want - th; r = ((r + 540) % 360) - 180;
      const rot = a => f(a) + ' ' + f(p[0]) + ' ' + f(p[1]);
      const sag = [p[0] + dx / 2, p[1] + dy / 2 + .8];
      return `<g><path d="M${f(p[0])} ${f(p[1])}Q${f(sag[0])} ${f(sag[1])} ${f(M[0] - side * .3)} ${f(M[1])}" stroke="#d4211f" stroke-width="1.1" fill="none"/>` +
        `<animateTransform attributeName="transform" type="rotate" values="${[0, 0, r * 1.12, r * .94, r, r, 0, 0].map(rot).join(';')}" keyTimes="${kt(dur, 0, cut, cut + .45, cut + .7, cut + .9, dur - .5, dur - .45, dur)}" dur="${dur}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="${kt(dur, 0, dur - 1.2, dur - .7, dur - .3, dur)}" dur="${dur}s" repeatCount="indefinite"/></g>`;
    };
    const bow = `<g transform="translate(${f(M[0])} ${f(M[1])})"><path d="M0 0L-1.8 -1.1L-1.8 1.1ZM0 0L1.8 -1.1L1.8 1.1Z" fill="#c8202a"/><circle r=".55" fill="#f2c35c"/>` +
      `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="${kt(dur, 0, cut, cut + .05, dur - .3, dur)}" dur="${dur}s" repeatCount="indefinite"/></g>`;
    const COLS = ['#f2c35c', '#d4211f', '#1b8a3a', '#4aa3df', '#ffffff', '#f08c2a'];
    let confetti = '';
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i / 13 - .5) * 2.2, dist = 5 + (i * 7 % 5), ux = Math.cos(a) * dist, uy = Math.sin(a) * dist;
      const end = `${f(M[0] + ux * 1.6)} ${f(M[1] + 2 + (i % 3))}`;
      confetti += `<rect x="-.45" y="-.3" width=".9" height=".6" fill="${COLS[i % COLS.length]}" opacity="0">` +
        `<animateTransform attributeName="transform" type="translate" values="${f(M[0])} ${f(M[1])};${f(M[0])} ${f(M[1])};${f(M[0] + ux)} ${f(M[1] + uy - 4)};${end};${end}" keyTimes="${kt(dur, 0, cut, cut + .6, cut + 2.8, dur)}" dur="${dur}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="${kt(dur, 0, cut, cut + .05, cut + 2.4, cut + 3, dur)}" dur="${dur}s" repeatCount="indefinite"/></rect>`;
    }
    return post([0, 0]) + post(b) + half(A0, 1) + half(B0, -1) + bow + confetti;
  }

  A.crew = { stand, walk, carry, crouch, spot, climb, reach, hold, ladder, cone, actor, during, official, guest, ribbon };
})();
