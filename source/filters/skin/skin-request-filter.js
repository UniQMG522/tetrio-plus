createRewriteFilter('SVG', 'https://tetr.io/res/minos.svg', {
  enabledFor: async (storage, url) => {
    let { skinSvg } = await storage.get('skinSvg');
    return !!skinSvg;
  },
  onStop: async (storage, url, src, callback) => {
    let { skinSvg } = await storage.get('skinSvg');
    callback({ type: 'image/svg+xml', data: skinSvg, encoding: 'text' });
  }
});

// Tetrio uses a png texture instead of svg textures on low and medium graphics
// The PNGs are generated at upload-time. The animated texture atlas is also
// fetched through here if the 'animated' query parameter is set.
createRewriteFilter('PNG', 'https://tetr.io/res/minos.png*', {
  enabledFor: async (storage, url) => {
    let animated = /[\?\&]animated/.test(url);
    if (animated) {
      return !!(await storage.get('skinAnim')).skinAnim;
    } else {
      return !!(await storage.get('skinPng')).skinPng;
    }
  },
  onStop: async (storage, url, src, callback) => {
    let animated = /[\?\&]animated/.test(url);
    if (animated) {
      let { skinAnim } = await storage.get('skinAnim');
      callback({
        type: 'image/png',
        data: skinAnim,
        encoding: 'base64-data-url'
      });
    } else {
      let { skinPng } = await storage.get('skinPng');
      callback({
        type: 'image/png',
        data: skinPng,
        encoding: 'base64-data-url'
      });
    }
  }
});
