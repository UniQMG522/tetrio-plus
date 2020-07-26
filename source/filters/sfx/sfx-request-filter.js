/*
  This filter rewrites requests for the /res/se.ogg file,
  replacing it with the user-configured custom sfx file.
*/

createRewriteFilter("Sfx Request", "https://tetr.io/sfx/tetrio.ogg", {
  enabledFor: async (storage, request) => {
    let {sfxEnabled} = await storage.get('sfxEnabled');
    if (!sfxEnabled) return false; // Custom sfx disabled

    let {customSoundAtlas} = await storage.get('customSoundAtlas');
    if (!customSoundAtlas) return false; // No custom sfx configured

    return true;
  },
  onStart: async (storage, url, src, callback) => {
    let { customSounds } = await storage.get('customSounds');
    callback({
      type: 'audio/ogg',
      data: customSounds,
      encoding: 'base64-data-url'
    });
    // filter.write(convertDataURIToBinary(customSounds));
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
