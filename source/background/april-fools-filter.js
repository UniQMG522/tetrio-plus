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

browser.webRequest.onBeforeRequest.addListener(
  async request => {
    let result = await browser.storage.local.get('enableSpeens');
    if (result.enableSpeens) {
      console.log("[Speen filter] Filtering", request.url);
      let filter = browser.webRequest.filterResponseData(request.requestId);
      let decoder = new TextDecoder("utf-8");
      let encoder = new TextEncoder();

      let originalData = [];
      filter.ondata = event => {
        let str = decoder.decode(event.data, {stream: true});
        originalData.push(str);
      }
      filter.onstop = async evt => {
        let src = originalData.join('');
        let patched = false;

        /*
          The target text contains nested brackets but ends on a double-bracket,
          so while this regex is a bit more fragile than others in thsi project
          it works well enough (for the importance of this feature, at least). 
        */
        let regex = /(const \w+\s*=)\s*{(\s*cleartypes.+?)}\s*}/;
        src = src.replace(regex, (match, $1) => {
          patched = true;
          console.log("Rewrote\n" + match + "\nto\n" + $1 + aprilFoolsSpeens)
          return $1 + aprilFoolsSpeens;
        });

        if (!patched)
          console.log('Failed to apply april fools filter');

        filter.write(encoder.encode(src));
        filter.close();
      }
    }
  },
  { urls: ["https://tetr.io/js/tetrio.js"] },
  ["blocking"]
);
