console.log("Music filter enabled");
browser.webRequest.onBeforeRequest.addListener(
  request => {
    console.log("[Music filter] Filtering", request.url);

    let filter = browser.webRequest.filterResponseData(request.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    let originalData = [];
    filter.ondata = event => {
      let str = decoder.decode(event.data, {stream: true});
      originalData.push(str);
    }

    const musicMatcher = /(const \w+=)({"kuchu.+?(?:(?:{.+?},?)+(?:["A-Za-z\-:]+)?)+?})(,\w+=)({.+?})/;
    filter.onstop = async evt => {
      let src = originalData.join('');

      let { musicEnabled } = await browser.storage.local.get('musicEnabled');
      if (!musicEnabled) {
        console.log("Custom music disabled, not rewriting data");
        filter.write(encoder.encode(src));
        filter.close();
        return;
      }

      let { disableVanillaMusic } = await browser.storage.local.get('disableVanillaMusic');

      console.log("Rewriting data");
      let songs = (await browser.storage.local.get('music')).music || [];
      let newSongObject = {};
      for (let song of songs) {
        /*
          Inject the song ID as a url query parameter on top of an existing song
          This is done so we get correct headers, the song chosen is arbitrary
          The song song ID is intercepted in the next webRequest handler and
          mapped to the correct custom song content

          Tetr.io concatenates the song name as `/res/bgm/${songname}.mp3`, so
          we add an extra query parameter to "comment out" the extra .mp3
        */
        newSongObject[
          `akai-tsuchi-wo-funde.mp3?song=${song.id}&tetrioplusinjectioncomment=`
        ] = song.metadata;
      }

      let replaced = false;
      let offset = 0;
      /**
       * This replacer function locates the songs defined in the source code
       * and the music pools which come immediately after. It attempts to parse
       * the songs (They're not quite json) and add in custom songs.
       */
      src = src.replace(musicMatcher, (
        fullmatch, musicVar, musicJson, musicpoolVar, musicpoolJson
      ) => {
        // Attempt to sanitize the json into actual json
        let sanitizedMusicJson = musicJson
          // What is with these true/false constants?
          .replace(/!0/g, 'true')
          .replace(/!1/g, 'false')
          // Quote unquoted keys
          .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":');

        let music;
        if (disableVanillaMusic) {
          music = {};
        } else {
          try {
            music = JSON.parse(sanitizedMusicJson);
          } catch(ex) {
            console.error(
              'Failed to parse sanitized music pool json',
              sanitizedMusicJson, ex
            );
            return musicVar + musicJson + musicpoolVar + musicpoolJson;
          }
        }
        Object.assign(music, newSongObject);
        let newMusicJson = JSON.stringify(music);

        let newMusicPool = { random: [], calm: [], battle: [] };
        for (let songkey of Object.keys(music)) {
          let song = music[songkey];
          switch (song.genre) {
            case 'INTERFACE':
              break;

            case 'CALM':
              newMusicPool.random.push(songkey);
              newMusicPool.calm.push(songkey);
              break;

            case 'BATTLE':
              newMusicPool.random.push(songkey);
              newMusicPool.battle.push(songkey);
              break;

            default:
              console.log("Unknown genre", song.genre, song);
              break;
          }
        }
        let newMusicPoolJson = JSON.stringify(newMusicPool);

        let rewrite = musicVar + newMusicJson + musicpoolVar + newMusicPoolJson;
        console.log("Rewriting", fullmatch, "to", rewrite);
        replaced = true;
        return rewrite;
      });

      console.log("Rewrite successful: " + replaced);
      if (!replaced) console.error(
        "Custom music rewrite failed. " +
        "Please update your plugin. "
      );



      let cfgMMP = await browser.storage.local.get('enableMissingMusicPatch');
      if (cfgMMP.enableMissingMusicPatch) {
        // Adds a default value any time a song is grabbed from the OST object
        let patches = 0;
        src = src.replace(/(\w+\.ost\[\w+\])/g, (match, $1) => {
          patches++;
          return `(${$1} || {
            name: "<Tetr.io+ missing music patch>",
            jpname: "<Tetr.io+ missing music patch>",
            artist: "?",
            jpartist: "?",
            genre: 'INTERFACE',
            source: 'Tetr.io+',
            loop: false,
            loopStart: 0,
            loopLength: 0
          })`.replace(/\s+/g, ' ');
        });
        console.log(`Missing music patch applied to ${patches} locations.`);
      }

      filter.write(encoder.encode(src));
      filter.close();
    }

    return {};
  },
  { urls: ["https://tetr.io/js/tetrio.js"] },
  ["blocking"]
)

browser.webRequest.onBeforeRequest.addListener(
  request => {
    let match = /\?song=([^&]+)/.exec(request.url);
    if (!match) {
      console.log("Not filtering", request.url, "(no song id)");
      return {};
    }

    let songId = match[1];
    console.log("[Music filter] Filtering", request.url, { songId });
    let filter = browser.webRequest.filterResponseData(request.requestId);

    filter.onstart = () => {
      let key = 'song-' + songId;
      browser.storage.local.get(key).then(val => {
        console.log("Writing");
        filter.write(convertDataURIToBinary(val[key]));
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
  { urls: ["https://tetr.io/res/bgm/*"] },
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
