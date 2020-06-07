createRewriteFilter('SVG', 'https://tetr.io/res/minos.svg', {
  enabledFor: async url => {
    let { skin } = await browser.storage.local.get('skin');
    return !!skin;
  },
  onStop: async (url, src, callback) => {
    let { skin } = await browser.storage.local.get('skin');
    callback({ type: 'image/svg+xml', data: skin, encoding: 'text' });
    // filter.write(new TextEncoder().encode(skin));
  }
});

// Tetrio uses a png texture instead of svg textures on low and medium graphics
// The PNGs are generated at upload-time
createRewriteFilter('PNG', 'https://tetr.io/res/minos.png', {
  enabledFor: async url => {
    let { skinPng } = await browser.storage.local.get('skinPng');
    return !!skinPng;
  },
  onStop: async (url, src, callback) => {
    let { skinPng } = await browser.storage.local.get('skinPng');
    callback({
      type: 'image/png',
      data: skinPng,
      encoding: 'base64-data-url'
    });
    // let bin = convertDataURIToBinary(skinPng);
    // filter.write(bin);
  }
});

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
