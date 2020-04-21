createRewriteFilter('SVG', 'https://tetr.io/res/minos.svg', {
  enabledFor: async request => {
    let { skin } = await browser.storage.local.get('skin');
    return !!skin;
  },
  onStop: async (request, filter, src) => {
    let { skin } = await browser.storage.local.get('skin');
    filter.write(new TextEncoder().encode(skin));
  }
});

// Tetrio uses a png texture instead of svg textures on low and medium graphics
// The PNGs are generated at upload-time
createRewriteFilter('PNG', 'https://tetr.io/res/minos.png', {
  enabledFor: async request => {
    let { skinPng } = await browser.storage.local.get('skinPng');
    return !!skinPng;
  },
  onStop: async (request, filter, src) => {
    let { skinPng } = await browser.storage.local.get('skinPng');
    let bin = convertDataURIToBinary(skinPng);
    filter.write(bin);
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
