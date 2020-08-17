/* Added by Jabster28 | MIT Licensed */
createRewriteFilter("Emote tabbing hooks", "https://tetr.io/js/tetrio.js", {
  enabledFor: async (storage, request) => {
    let res = await storage.get('enableEmoteTab');
    return res.enableEmoteTab;
  },
  onStop: async (storage, url, src, callback) => {
    /*
      This patch exposes the game's emote map as a global variable
      which is used for up to date emote suggestions.
    */
    let patched = false;
    let reg1 = /([a-zA-Z]*)={base:{awesome:.+?}}/;
    src = src.replace(reg1, (match, varName) => {
      console.log(match)
      console.log(varName)
      patched = true;
      return match + `;
        Object.defineProperty(window, "emoteMap", {
          get: () => ${varName}
        })
      `;
    });
    if (!patched) console.log('Emote tabbing hooks brooke, stage 1/3');

    callback({
      type: 'text/javascript',
      data: src,
      encoding: 'text'
    });
  }
})
