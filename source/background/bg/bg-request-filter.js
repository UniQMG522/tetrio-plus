/*
  This filter rewrites requests for background images with a given
  query parameter and replaces them with user-specified backgrounds.
*/

createRewriteFilter("Bg Request", "https://tetr.io/res/bg/*", {
  enabledFor: async request => {
    let match = /\?bgId=([^&]+)/.exec(request.url);
    if (!match) {
      console.log("[Bg Request filter] Ignoring, no bg ID:", request.url);
      return false;
    }
    return true;
  },
  onStart: async (request, filter) => {
    let [_, bgId] = /\?bgId=([^&]+)/.exec(request.url);
    console.log("[Bg Request filter] Background ID", bgId);

    if (bgId == 'animated') {
      let res = await browser.storage.local.get('animatedBackground');
      let animBg = res.animatedBackground;
      if (!animBg) return;
      let key = 'background-' + animBg.id;
      let value = await browser.storage.local.get(key);
      filter.write(convertDataURIToBinary(value[key]));
      return;
    }

    if (bgId == 'transparent') {
      let pixel = browser.extension.getURL('resources/transparent.png');
      let value = await (await fetch(pixel)).arrayBuffer();
      filter.write(value);
      return;
    }

    let key = `background-${bgId}`;
    let value = await browser.storage.local.get(key);
    filter.write(convertDataURIToBinary(value[key]));
  }
});


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
