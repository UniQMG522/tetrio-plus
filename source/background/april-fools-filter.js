/*
  This filter rewrites some language definitions to what they
  were during Tetrio's 2020 April Fools event.
*/

const aprilFoolsSpeens = JSON.stringify({
  cleartypes: ["ZERO", "ONE", "TWO", "THREE", "FOUR"],
  tspins: {
    mini: "tiny %%PIECE%%-speen",
    normal: "large %%PIECE%%-speen"
  },
  extra: {
    btb: "many times",
    clear: "VERY\nNICE"
  },
  longTypeNames: {
    "40l": "40 LINES",
    blitz: "BLITZ",
    custom: "CUSTOM GAME"
  },
  gameMissions: {
    "40l": "CLEAR 40 LINES!",
    blitz: "TWO-MINUTE BLITZ",
    "40 LINES": "CLEAR 40 LINES!",
    BLITZ: "TWO-MINUTE BLITZ"
  }
});

createRewriteFilter("April Fools", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let { enableSpeens } = await browser.storage.local.get('enableSpeens');
    return enableSpeens;
  },
  onStop: async (request, filter, src) => {
    /*
      The target text contains nested brackets but ends on a double-bracket,
      so while this regex is a bit more fragile than others in this project
      it works well enough (for the importance of this feature, at least).
    */
    let regex = /(const \w+\s*=)\s*{(\s*cleartypes.+?)}\s*}/;
    src = src.replace(regex, (match, $1) => {
      patched = true;
      console.log("Rewriting april fools text", {
        from: match,
        to: $1 + aprilFoolsSpeens
      });
      return $1 + aprilFoolsSpeens;
    });

    if (!patched)
      console.log('Failed to apply april fools filter');

    filter.write(new TextEncoder().encode(src));
  }
});
