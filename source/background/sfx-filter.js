console.log("Sfx filter enabled");
browser.webRequest.onBeforeRequest.addListener(
  request => {
    console.log("[Sfx filter] Filtering", request.url);

    let filter = browser.webRequest.filterResponseData(request.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    let originalData = [];
    filter.ondata = event => {
      let str = decoder.decode(event.data, {stream: true});
      originalData.push(str);
    }

    const regex = /(new Howl\({\s*src:\s*["']res\/se\.ogg["'],\s*sprite:\s*)({[\S\s]+?})/;
    filter.onstop = async evt => {
      let src = originalData.join('');

      let { sfxEnabled } = await browser.storage.local.get('sfxEnabled');
      if (!sfxEnabled) {
        console.log("Custom sfx disabled, not rewriting data");
        filter.write(encoder.encode(src));
        filter.close();
        return;
      }

      let { customSoundAtlas } = await browser.storage.local.get('customSoundAtlas');
      if (!customSoundAtlas) {
        console.log("No custom sfx, not rewriting data");
        filter.write(encoder.encode(src));
        filter.close();
        return;
      }

      let replaced = false;
      src = src.replace(regex, (fullmatch, howlInit, atlas) => {
        let rewrite = howlInit + JSON.stringify(customSoundAtlas);
        console.log("Rewriting", fullmatch, "to", rewrite);
        replaced = true;
        return rewrite;
      });

      console.log("Rewrite successful: " + replaced);
      if (!replaced) console.error(
        "Custom sfx rewrite failed. " +
        "Please update your plugin. "
      );

      filter.write(encoder.encode(src));
      filter.close();
    }

    return {};
  },
  { urls: ["https://tetr.io/js/tetrio.js"] },
  ["blocking"]
)

browser.webRequest.onBeforeRequest.addListener(
  async request => {
    let { sfxEnabled } = await browser.storage.local.get('sfxEnabled');
    if (!sfxEnabled) {
      console.log("Custom sfx disabled, not rewriting data");
      return;
    }

    let { customSounds } = await browser.storage.local.get('customSounds');
    if (!customSounds) {
      console.log("No custom sfx, not rewriting data");
      filter.write(encoder.encode(src));
      filter.close();
      return;
    }

    console.log("[Sfx filter] Filtering", request.url);
    let filter = browser.webRequest.filterResponseData(request.requestId);

    filter.onstart = () => {
      browser.storage.local.get('customSounds').then(({ customSounds }) => {
        console.log("Writing");
        filter.write(convertDataURIToBinary(customSounds));
        console.log("Written");
        filter.close();
      });
    }

    filter.onstop = () => {
      console.log("Ended");
    }

    filter.onerror = console.error;

    return {};
  },
  { urls: ["https://tetr.io/res/se.ogg"] },
  ["blocking"]
)

// https://gist.github.com/borismus/1032746
var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
  var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  var base64 = dataURI.substring(base64Index);
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for(i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}
