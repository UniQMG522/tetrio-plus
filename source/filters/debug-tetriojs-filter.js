createRewriteFilter("Break the game hooks", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let res = await browser.storage.local.get('debugBreakTheGame');
    return res.debugBreakTheGame;
  },
  onStart: async (url, src, callback) => {
    callback({
      type: 'text/javascript',
      data: `console.log("` +
        `TETRIO PLUS> ` +
        `The game is intentionally broken. ` +
        `Turn off the 'Break the game' option.` +
      `")`,
      encoding: 'text'
    });
  }
})
