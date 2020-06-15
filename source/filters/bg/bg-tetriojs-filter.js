/*
  This filter rewrites the bg definition in tetrio.js
  in order to add support for custom backgrounds served
  from the extension.
*/

createRewriteFilter("Tetrio.js BG", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let res = await browser.storage.local.get([
      'transparentBgEnabled',
      'animatedBackground',
      'animatedBgEnabled',
      'backgrounds',
      'bgEnabled'
    ]);

    if (res.transparentBgEnabled)
      return true;

    if (!res.bgEnabled) return false;
    if (res.animatedBgEnabled && res.animatedBackground)
      return true;
    if (res.backgrounds && res.backgrounds.length > 0)
      return true;

    return false;
  },
  onStop: async (url, src, callback) => {
    let res = await browser.storage.local.get([
      'transparentBgEnabled',
      'animatedBgEnabled',
      'animatedBackground',
      'backgrounds'
    ]);

    let backgrounds = [];
    if (res.transparentBgEnabled) {
      backgrounds.push({ id: 'transparent' });
    } else if (res.animatedBgEnabled && res.animatedBackground) {
      backgrounds.push({ id: 'transparent' });
    } else if (res.backgrounds) {
      backgrounds.push(...res.backgrounds)
    }

    let replaced = false;
    src = src.replace(
      /(let \w+=)(\[["']\.\.\/res\/bg.+?\])/,
      (fullmatch, varInit, value) => {
        let rewrite = varInit + b64Recode(backgrounds.map(bg => {
          return `../res/bg/1.jpg?bgId=${bg.id}`
        }));
        console.log(
          "Rewriting backgrounds definition",
          { from: fullmatch, to: rewrite }
        );
        replaced = true;
        return rewrite;
      }
    );

    if (!replaced) console.error(
      "Custom background rewrite failed. " +
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
