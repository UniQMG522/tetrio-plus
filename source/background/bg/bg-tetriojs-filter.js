/*
  This filter rewrites the bg definition in tetrio.js
  in order to add support for custom backgrounds served
  from the extension.
*/

createRewriteFilter("Tetrio.js BG", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let res = await browser.storage.local.get([
      'animatedBackground',
      'animatedBgEnabled',
      'backgrounds',
      'bgEnabled'
    ]);
    if (!res.bgEnabled) return false;

    let numBackgrounds = 0;
    if (res.animatedBgEnabled && res.animatedBackground)
      numBackgrounds++;
    else if (res.backgrounds)
      numBackgrounds += res.backgrounds.length;

    if (numBackgrounds == 0) return false; // no backgrounds
    return true;
  },
  onStop: async (request, filter, src) => {
    let res = await browser.storage.local.get([
      'animatedBgEnabled',
      'animatedBackground',
      'backgrounds'
    ]);

    let backgrounds = [];
    if (res.animatedBgEnabled && res.animatedBackground) {
      backgrounds.push({ id: 'transparent' });
    } else if (res.backgrounds) {
      backgrounds.push(...res.backgrounds)
    }

    let replaced = false;
    src = src.replace(
      /(let \w+=)(\[["']\.\.\/res\/bg.+?\])/,
      (fullmatch, varInit, value) => {
        let newData = JSON.stringify(backgrounds.map(bg => {
          return `../res/bg/1.jpg?bgId=${bg.id}`
        }));
        let rewrite = varInit + b64Recode(newData);
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

    filter.write(new TextEncoder().encode(src));
  }
});
