/*
*/
createRewriteFilter("Music graph hooks", "https://tetr.io/js/tetrio.js", {
  enabledFor: async (storage, url) => {
    let res = await storage.get([
      'musicEnabled', 'musicGraphEnabled'
    ]);
    return res.musicEnabled && res.musicGraphEnabled;
  },
  onStop: async (storage, url, src, callback) => {
    try {
      /**
       * This regex locates the variable holding the 'full'/'tiny' value and
       * one holding something related to board location for use by the next rgx
       */
      var rgx = /playIngame\(['"`]warning['"`],(\w+),(\w+)/;
      var match = rgx.exec(src);
      if (!match) {
        console.error('Music graph hooks broken (setup/?)');
      } else {
        const typeVar = match[1];
        const spatialVar = match[2];
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
              detail: {
                type: ${arg1},
                text: ${arg2},
                spatialization:${spatialVar}
              }
            }));` +
            funcBody
          )
        });
        if (!match) {
          console.error('Music graph hooks broken (text)');
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
              detail: {
                name: ${arg1},
                args: [...arguments]
              }
            }));`
          )
        });
        if (!match) {
          console.error('Music graph hooks broken (sfx)');
        }

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
                detail: {
                  height,
                  type:${typeVar},
                  spatialization:${spatialVar}
                }
              }));
              return height;
            })()` + postmatch
          );
        });
        if (!match) {
          console.error('Music graph hooks broken (height)');
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
