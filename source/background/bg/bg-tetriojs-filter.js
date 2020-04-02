/*
  This filter rewrites the bg definition in tetrio.js
  in order to add support for custom backgrounds served
  from the extension.
*/

createRewriteFilter("Tetrio.js BG", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let {bgEnabled} = await browser.storage.local.get('bgEnabled');
    if (!bgEnabled) return false; // Custom backgrounds disabled
    let {backgrounds} = await browser.storage.local.get('backgrounds');
    if (!backgrounds || backgrounds.length == 0) return false; // no backgrounds
    return true;
  },
  onStop: async (request, filter, src) => {
    let {backgrounds} = await browser.storage.local.get('backgrounds');

    let replaced = false;
    src = src.replace(
      /(let \w+=)(\[["']\.\.\/res\/bg.+?\])/,
      (fullmatch, varInit, value) => {
        let rewrite = varInit + JSON.stringify(backgrounds.map(bg => {
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

    console.log("Rewrite successful: " + replaced);
    if (!replaced) console.error(
      "Custom background rewrite failed. " +
      "Please update your plugin. "
    );

    filter.write(new TextEncoder().encode(src));
  }
});
