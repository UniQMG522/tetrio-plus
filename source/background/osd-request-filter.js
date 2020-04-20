createRewriteFilter("OSD hooks", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let res = await browser.storage.local.get('enableOSD');
    return res.enableOSD;
  },
  onStop: async (request, filter, src) => {
    /*
      This patch exposes the game's key map as a global variable
      It's not actually used in the current implementation
    */
    let patched = false;
    let reg1 = /let\s*(\w+)\s*={moveLeft[^}]+}/;
    src = src.replace(reg1, (match, varName) => {
      patched = true;
      return match + `;
        Object.defineProperty(window, "keyMap", {
          get: () => ${varName}
        })
      `;
    });
    if (!patched) console.log('OSD hooks filter broke, stage 1/3');

    /*
      This patch emits a custom event when a new board is initialized
    */
    patched = false;
    let reg2 = /(bindEventSource:\s*function\((\w+)\)\s*{)([^}]+})/;
    src = src.replace(reg2, (match, pre, varName, post) => {
      patched = true;
      return (
        pre + `
        document.dispatchEvent(new CustomEvent('tetrio-plus-on-game', {
          detail: ${varName}
        }));` +
        post
      );
    });
    if (!patched) console.log('OSD hooks filter broke, stage 2/3');

    /*
      This patch fixes an assignment to constant bug(?) in tetrio source
      It replaces `o = o.filter(t => t !== e)`, where o is a const variable.
      I'm guessing this is a build tool artefact or something.
    */
    patched = false;
    let reg3 = /(unbind:\s*function\s*\((\w+)\)){(\w+)=\3.filter[^}]+}/;
    src = src.replace(reg3, (match, pre, argName, varName) => {
      patched = true;
      return (
        pre + `{
          let index = ${varName}.indexOf(${argName});
          if (index != -1) ${varName}.splice(index, 1);
        }`
      )
    });
    if (!patched) console.log('OSD hooks filter broke, stage 3/3');

    filter.write(new TextEncoder().encode(src));
  }
})
