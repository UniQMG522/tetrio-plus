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
        console.error('Music graph hooks broken (1/?)');
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
        console.error('Music graph hooks broken (2/?)');
      }

      /**
       * This regex locates the variable holding the 'full'/'tiny' value
       * for the next regex's usage
       */
      var rgx = /playIngame\(['"`]warning['"`],(\w+)/;
      var match = rgx.exec(src);
      if (!match) {
        console.error('Music graph hooks broken (3/?)');
      } else {
        const typeVar = match[1];

        /**
         * This regex targets a bit of the code that emits the 'warning' sound
         * effect, and uses it to emit an event for the current board height
         * plus incoming garbage height.
         */
        var match = false;
        var rgx = /(let\s*(\w)\s*=\s*\w+\(\).{0,100}\(\2\s*=)(.+)(\)>)/i;
        src = src.replace(rgx, ($, prematch, varName, expression, postmatch) => {
          match = true;
          return (
            `${prematch}(() => {
              let height = ${expression};
              document.dispatchEvent(new CustomEvent('tetrio-plus-actionheight', {
                detail: { height, type: ${typeVar} }
              }));
              return height;
            })()` + postmatch
          );
        });
        if (!match) {
          console.error('Music graph hooks broken (4/?)');
        }
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
