/*
*/
createRewriteFilter("Music graph hooks", "https://tetr.io/bootstrap.js", {
  enabledFor: async url => {
    let res = await browser.storage.local.get([
      'bypassBootstrapper'
    ]);
    return res.bypassBootstrapper;
  },
  onStop: async (url, src, callback) => {
    callback({
      type: 'text/javascript',
      data: `
        (() => {
          console.log('Bypassed bootstrap.js');
          let script = document.createElement('script');
          script.src = '/js/tetrio.js';
          document.head.appendChild(script);
        })();
      `,
      encoding: 'text'
    });
  }
})
