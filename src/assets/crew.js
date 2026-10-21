/* ZETDC line crew (Assets.crew): linemen in navy overalls, hi-vis vests and white hard hats, drawn in screen px
   around their feet (the line-cart poses around the point on the wire), plus a traffic cone.
   actor() moves one figure through a track of keyed poses on a loop timed like the vehicle it rides with. */
(function () {
  const A = window.Assets;
  const f = n => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? '0' : String(v); };
  const SKIN = '#6f4428', NAVY = '#2b3866', VEST = '#f08c2a', STRIPE = '#fff3c4', HAT = '#ffffff', HAT_SH = '#c9d3dd',
    BOOT = '#23272c', BELT = '#3a2a1c', CART = '#f2c230';
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
  // climbing the pole with spikes and a pole strap, seen from behind: hands and feet step up in turn
  const climb = () =>
    step(leg(-.8, -4.6, -1.4, -1.2), '0 0;0 -1.6;0 0', .8) + step(leg(.8, -4.6, 1.4, -1.2), '0 -1.6;0 0;0 -1.6', .8) +
    torso(0, true) + `<path d="M-2 -5.1Q-1.5 -6 -.8 -6.3M2 -5.1Q1.5 -6 .8 -6.3" stroke="${BELT}" stroke-width=".5" fill="none"/>` +
    step(arm(-1.8, -8, -1, -11.6), '0 -1.4;0 0;0 -1.4', .8) + step(arm(1.8, -8, 1, -11.6), '0 0;0 -1.4;0 0', .8) + head(0, true);
  // line cart riding the conductor: wheels on the wire at (0, 0), the lineman seated in a sling below
  const cart = (work) => {
    const frame = `<path d="M-2.4 -.9V2.2H2.4V-.9" stroke="${CART}" stroke-width=".8" fill="none" stroke-linejoin="round"/>` +
      `<circle cx="-1.5" cy="-.9" r=".9" fill="#3a3f46"/><circle cx="1.5" cy="-.9" r=".9" fill="#3a3f46"/>` +
      `<circle cx="-1.5" cy="-.9" r=".3" fill="#b2bfcc"/><circle cx="1.5" cy="-.9" r=".3" fill="#b2bfcc"/>`;
    const sling = ln(-1.6, 2.2, -1.4, 8.6, BELT, .4) + ln(1.6, 2.2, 1.4, 8.6, BELT, .4) + ln(-1.8, 8.6, 1.8, 8.6, BELT, .7);
    const y = 13;   // the seated body hangs with its hips at y 8.4
    const body = ln(-.4, 8.6, 2.2, 9.2, NAVY, 1.5) + leg(2.2, 9.2, 2.6, 12) + ln(.4, 8.6, 3, 9, NAVY, 1.5) + leg(3, 9, 3.4, 11.8) +
      `<g transform="translate(0 ${y})">${torso() + head()}</g>`;
    const arms = work
      ? arm(-1.8, 5, -1.6, 2.2) + swing(arm(1.8, 5, 2.8, .2) + `<path d="M2.8 .2l.9 -.9" stroke="#b2bfcc" stroke-width=".5"/>`, 1.8, 5, [0, -10, 0], .5)
      : step(arm(-1.8, 5, -1.6, 2.2), '0 0;0 1;0 0', .7) + step(arm(1.8, 5, 1.6, 2.2), '0 1;0 0;0 1', .7);
    // a spark of the crimping tool while it works on the conductor
    const glint = work ? `<g transform="translate(3.6 -.6)"><path d="M0 -1.6L.4 -.4L1.6 0L.4 .4L0 1.6L-.4 .4L-1.6 0L-.4 -.4Z" fill="#fff6c4"><animate attributeName="opacity" values="0;1;0;0" dur=".5s" repeatCount="indefinite"/></path></g>` : '';
    return frame + swing(sling + body + arms, 0, 0, [-4, 4, -4], 1.6) + glint;
  };
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

  A.crew = { stand, walk, crouch, spot, climb, cart, cone, actor, during };
})();
