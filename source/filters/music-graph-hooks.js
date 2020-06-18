/*
*/
createRewriteFilter("Test hooks", "https://tetr.io/js/tetrio.js", {
  enabledFor: async url => {
    let res = await browser.storage.local.get([
      'musicEnabled', 'musicGraphEnabled'
    ]);
    return res.musicEnabled && res.musicGraphEnabled;
  },
  onStop: async (url, src, callback) => {
    try {
      /**
       * This regex targets a function that handles text creation and turns it
       * into a global hook for other scripts to consume.
       */
      var match = false;
      var rgx = /(function \w+\((\w+),\s*(\w+)\)\s*{)(.{0,50}video.actiontext)/i;
      src = src.replace(rgx, ($, funcDef, arg1, arg2, funcBody) => {
        match = true;
        return (
          funcDef +
          `document.dispatchEvent(new CustomEvent('tetrio-plus-actiontext', {
            detail: { type: ${arg1}, text: ${arg2} }
          }));` +
          funcBody
        )
      });
      if (!match) {
        console.error('Test hooks broke (1/2)');
        return;
      }

      /**
       * This regex targets a function that plays sound effects and turns it
       * into a global hook for other scripts to consume.
       */
      var match = false;
      var rgx = /playIngame:\s*function\((\w+),[^)]+\)\s*{/i;
      src = src.replace(rgx, ($, arg1) => {
        match = true;
        return (
          $ +
          `document.dispatchEvent(new CustomEvent('tetrio-plus-actionsound', {
            detail: { name: ${arg1}, args: [...arguments] }
          }));`
        )
      });
      if (!match) {
        console.error('Test hooks broke (2/2)');
        return;
      }
    } finally {
      callback({
        type: 'text/javascript',
        data: src,
        encoding: 'text'
      });
    }
  }
})
