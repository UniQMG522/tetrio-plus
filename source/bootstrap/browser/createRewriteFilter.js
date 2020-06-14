/**
 * @param {string} name
 * @param {string} url
 * @param {Object} options
 * @param {Function<Filter, boolean>} options.enabledFor
 * @param {Function<Request, Filter, string?>} options.onStart
 * @param {Function<Request, Filter, string?>} options.onStop
 */
function createRewriteFilter(name, url, options) {
  browser.webRequest.onBeforeRequest.addListener(
    async request => {

      if (options.enabledFor) {
        let enabled = await options.enabledFor(request.url);
        if (!enabled) {
          console.log(`[${name} filter] Disabled, ignoring ${url}`);
          return;
        }
      }

      console.log(`[${name} filter] Filtering ${url}`);

      if (options.onStart || options.onStop) {
        let filter = browser.webRequest.filterResponseData(request.requestId);
        let decoder = new TextDecoder("utf-8");
        function callback({ type, data, encoding }) {
          switch(encoding || 'text') {
            case 'base64-data-url':
              filter.write(convertDataURIToBinary(data));
              break;
            case 'text':
              filter.write(new TextEncoder().encode(data));
              break;
            default:
              throw new Error('Unknown encoding');
          }
        }

        if (options.onStart) {
          filter.onstart = async evt => {
            await options.onStart(request.url, null, callback);
            // Close the filter now if there's no onStop handler to close it.
            if (!options.onStop)
              filter.close();
          }
        }

        // Potential future BUG: We're assuming onStop will only be called
        // with textual data, but in the future we might want to process binary
        // data in transit.
        let originalData = [];
        filter.ondata = event => {
          let str = decoder.decode(event.data, { stream: true });
          originalData.push(str);
        }

        if (options.onStop) {
          filter.onstop = async evt => {
            await options.onStop(request.url, originalData.join(''), callback);
            filter.close();
          }
        }
      }
    },
    { urls: [url] },
    ["blocking"]
  )
}

// https://gist.github.com/borismus/1032746
var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
  var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  var base64 = dataURI.substring(base64Index);
  var raw = atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for(i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}
