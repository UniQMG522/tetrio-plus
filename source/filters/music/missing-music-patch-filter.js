/*
  This filter adds a default-value any time a song is accessed, which
  prevents some softlocks when hardcoded music is removed.
*/

createRewriteFilter("Missing Music Patch", "https://tetr.io/js/tetrio.js", {
  enabledFor: async url => {
    let cfgMMP = await browser.storage.local.get([
      'musicEnabled', 'enableMissingMusicPatch'
    ]);
    return cfgMMP.musicEnabled && cfgMMP.enableMissingMusicPatch;
  },
  onStop: async (url, src, callback) => {
    function insertInPatch($1) {
      return `(${$1} || {
        name: "<Tetr.io+ missing music patch>",
        jpname: "<Tetr.io+ missing music patch>",
        artist: "?",
        jpartist: "?",
        genre: 'INTERFACE',
        source: 'Tetr.io+',
        loop: false,
        loopStart: 0,
        loopLength: 0
      })`.replace(/\s+/g, ' ');
    }

    try {
      /*
        Targets an exact function match where a song is taken out of the songs
        object immediately before its wrapped into the /(\w+)\.ost/ object.
      */
      var patches = 0;
      src = src.replace(
        /(const (\w)={"kuchu.+?)(\2\[[A-Za-z]+\])/,
        (match, left, backref2, toPatch) => {
          patches++;
          return left + insertInPatch(toPatch);
        }
      )
      if (patches == 0)
        throw new Error(`Nowhere to apply missing music patch (1/2)`);

      /*
        Targets anywhere a song is referenced from the /\w+\.ost/ object
      */
      var patches = 0;
      src = src.replace(/(\w+\.ost\[\w+\])/g, (match, $1) => {
        patches++;
        return insertInPatch($1);
      });
      if (patches == 0)
        throw new Error(`Nowhere to apply missing music patch (2/2)`);
    } catch(ex) {
      console.log(`Missing music patch failed to apply`, ex);
    } finally {
      callback({
        type: 'text/javascript',
        data: src,
        encoding: 'text'
      });
    }
  }
});
