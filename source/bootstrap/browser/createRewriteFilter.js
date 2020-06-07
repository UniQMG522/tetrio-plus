/**
 * @param {string} name
 * @param {string} url
 * @param {Object} options
 * @param {Function<Filter, boolean>} options.enabledFor
 * @param {Function<Request, Filter, string?>} options.onStart
 * @param {Function<Request, Filter, string?>} options.onStop
 * @param {boolean} options.ignoreSource if true, doesn't pass the original
 *   source as {#options.onStop}'s second parameter
 */
function createRewriteFilter(name, url, options) {
  browser.webRequest.onBeforeRequest.addListener(
    async request => {

      if (options.enabledFor) {
        let enabled = await options.enabledFor(request);
        if (!enabled) {
          console.log(`[${name} filter] Disabled, ignoring ${url}`);
          return;
        }
      }

      console.log(`[${name} filter] Filtering ${url}`);

      if (options.onStart || options.onStop) {
        let filter = browser.webRequest.filterResponseData(request.requestId);
        let decoder = new TextDecoder("utf-8");

        if (options.onStart) {
          filter.onstart = async evt => {
            await options.onStart(request, filter);
            // Close the filter now if there's no onStop handler to close it.
            if (!options.onStop)
              filter.close();
          }
        }

        let originalData = [];
        filter.ondata = event => {
          if (!options.ignoreSource) {
            let str = decoder.decode(event.data, { stream: true });
            originalData.push(str);
          }
        }

        if (options.onStop) {
          filter.onstop = async evt => {
            await options.onStop(
              request,
              filter,
              options.ignoreSource
                ? null
                : originalData.join('')
            );
            filter.close();
          }
        }
      }
    },
    { urls: [url] },
    ["blocking"]
  )
}
