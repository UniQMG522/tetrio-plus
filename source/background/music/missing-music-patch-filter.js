/*
  This filter adds a default-value any time a song is accessed, which
  prevents some softlocks when hardcoded music is removed.
*/

createRewriteFilter("Missing Music Patch", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let cfgMMP = await browser.storage.local.get([
      'musicEnabled', 'enableMissingMusicPatch'
    ]);
    return cfgMMP.musicEnabled && cfgMMP.enableMissingMusicPatch;
  },
  onStop: async (request, filter, src) => {
    let patches = 0;
    src = src.replace(/(\w+\.ost\[\w+\])/g, (match, $1) => {
      patches++;
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
    });
    console.log(`Missing music patch applied to ${patches} locations.`);

    filter.write(new TextEncoder().encode(src));
  }
});
