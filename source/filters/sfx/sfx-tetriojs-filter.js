/*
  This filter rewrites the sfx atlas definition in tetrio.js
  in order to update the hardcoded offsets and durations with
  those from the user-configured sfx atlas.
*/

createRewriteFilter("Tetrio.js Sfx", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let {sfxEnabled} = await browser.storage.local.get('sfxEnabled');
    if (!sfxEnabled) return false; // Custom sfx disabled

    let {customSoundAtlas} = await browser.storage.local.get('customSoundAtlas');
    if (!customSoundAtlas) return false; // No custom sfx configured

    return true;
  },
  onStop: async (url, src, callback) => {
    let {customSoundAtlas} = await browser.storage.local.get('customSoundAtlas');

    let replaced = false;
    src = src.replace(
      /(TETRIO_SE_SHEET\s*=\s*){[^}]+}/,
      (fullmatch, varInit) => {
        let rewrite = `${varInit}${b64Recode(customSoundAtlas)}`;
        console.log(
          "Rewriting sound atlas definition",
          { from: fullmatch, to: rewrite }
        );
        replaced = true;
        return rewrite;
      }
    );

    console.log("Rewrite successful: " + replaced);
    if (!replaced) console.error(
      "Custom sfx rewrite failed. " +
      "Please update your plugin. "
    );

    callback({
      type: 'text/javascript',
      data: src,
      encoding: 'text'
    });

    // filter.write(new TextEncoder().encode(src));
  }
});
