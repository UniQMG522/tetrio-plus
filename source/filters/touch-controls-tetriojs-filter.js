createRewriteFilter("Touch control hooks", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let res = await browser.storage.local.get('enableTouchControls');
    return res.enableTouchControls;
  },
  onStop: async (url, src, callback) => {
    /*
      This patch exposes the game's key map as a global variable which is used
      to dispatch touch-to-key events with the correct bindings
    */
    let patched = false;
    let reg1 = /let\s*(\w+)\s*={moveLeft[^}]+}/;
    src = src.replace(reg1, (match, varName) => {
      patched = true;
      return match + `;
        Object.defineProperty(window, "keyMap", {
          get: () => ${varName}
        })
      `;
    });
    if (!patched) console.log('Touch control hooks broke, stage 1/3');

    callback({
      type: 'text/javascript',
      data: src,
      encoding: 'text'
    });
    // filter.write(new TextEncoder().encode(src));
  }
})
