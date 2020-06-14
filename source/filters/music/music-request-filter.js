/*
  This filter rewrites the binary music files based on a
  query parameter added by the music-tetriojs-filter script
  in order to load user-specified custom music.
*/

createRewriteFilter("Music Request", "https://tetr.io/res/bgm/*", {
  enabledFor: async url => {
    let match = /\?song=([^&]+)/.exec(url);
    if (!match) {
      console.log("[Music Request filter] Ignoring, no song ID:", url);
      return false;
    }
    return true;
  },
  onStart: async (url, src, callback) => {
    let [_, songId] = /\?song=([^&]+)/.exec(url);
    console.log("[Music Request filter] Song ID", songId);

    let key = `song-${songId}`;
    let value = (await browser.storage.local.get(key))[key];
    callback({
      type: 'audio/mpeg',
      data: value,
      encoding: 'base64-data-url'
    });
    // filter.write(convertDataURIToBinary(value[key]));
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
