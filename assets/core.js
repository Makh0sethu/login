/* Shared asset registry + common SVG defs. Load before any other assets/*.js file. */
(function () {
  const defs = [];
  const Assets = window.Assets = window.Assets || {};
  Assets.addDefs = s => { defs.push(s); };
  // project-root-relative file URL for <image href>; preview pages set Assets.base = '../../'
  Assets.base = Assets.base || '';
  Assets.url = p => Assets.base + p.split('/').map(encodeURIComponent).join('/');
  Assets.defsMarkup = () => defs.join('');
  // inject one hidden <svg><defs> holding every registered def; call once after all asset files load
  Assets.mountDefs = () => {
    let host = document.getElementById('asset-defs');
    if (!host) {
      host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      host.id = 'asset-defs';
      host.setAttribute('width', '0'); host.setAttribute('height', '0');
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      document.body.prepend(host);
    }
    host.innerHTML = '<defs>' + Assets.defsMarkup() + '</defs>';
  };

  Assets.addDefs(
    `<radialGradient id="ao-soft"><stop offset="0" stop-color="#0b1e33" stop-opacity=".28"/><stop offset=".6" stop-color="#0b1e33" stop-opacity=".1"/><stop offset="1" stop-color="#0b1e33" stop-opacity="0"/></radialGradient>` +
    `<filter id="tx-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/>` +
    `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in" result="g"/>` +
    `<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge></filter>` +
    `<linearGradient id="metal-h" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#8f9caa"/><stop offset=".3" stop-color="#f4f7fa"/><stop offset=".55" stop-color="#cdd6df"/><stop offset="1" stop-color="#7d8a98"/></linearGradient>` +
    `<linearGradient id="glass-v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#bfe3f8"/><stop offset="1" stop-color="#5f9fcb"/></linearGradient>` +
    `<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".3"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>`
  );
})();
