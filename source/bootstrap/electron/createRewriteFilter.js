// global rewriteHandlers

function matchesGlob(glob, string) {
  return new RegExp(
    '^' +
    glob
      .split('*')
      .map(seg => seg.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
      .join('.+') +
    '$'
  ).test(string);
}

mainWindow.webContents.session.webRequest.onBeforeRequest(
  { urls: ['https://tetr.io/*'] },
  (request, callback) => {
    (async () => {
      greenlog(`onBeforeRequest: Considering ${request.url}...`);

      // FIXME:
      // Temporary stopgap until I find a decent workaround to the whole
      // service worker issue
      if (/sw.js\/?$/.test(request.url)) {
        greenlog("Blocked service worker.")
        callback({ cancel: true });
        return;
      }

      for (let { name, url, options } of rewriteHandlers) {
        if (!matchesGlob(url, request.url)) continue;

        if (options.enabledFor) {
          let enabled = await options.enabledFor(request.url);
          if (!enabled) {
            greenlog(`[${name} filter] Disabled, ignoring ${request.url}`);
            continue;
          }
        }

        greenlog(`[${name} filter] Filtering ${request.url}`);
        let relative = request.url.substring('https://tetr.io/'.length);
        callback({
          redirectURL: 'tetrio-plus://tetrio-plus/' + relative
        });
        return;
      }

      callback({});
    })().catch(ex => {
      greenlog("Err", ex);
      callback({});
    })
  }
)

function createRewriteFilter(name, url, options) {
  greenlog("[Sandboxed] createRewriteFilter", name, url, Object.keys(options));
  rewriteHandlers.push({ name, url, options });
}
