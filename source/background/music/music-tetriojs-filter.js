/*
  This filter rewrites the hardcoded music definition object in
  the tetrio.js source file to facillitate adding new music.
*/
createRewriteFilter("Tetrio.js Music", "https://tetr.io/js/tetrio.js", {
  enabledFor: async request => {
    let { musicEnabled } = await browser.storage.local.get('musicEnabled');
    return musicEnabled;
  },
  onStop: async (request, filter, src) => {
    let { disableVanillaMusic } = await browser.storage.local.get('disableVanillaMusic');
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

    /**
     * This replacer function locates the songs defined in the source code
     * and the music pools which come immediately after. It attempts to parse
     * the songs (They're not quite json) and add in custom songs.
     */
    src = src.replace(
      /(const \w+=)({"kuchu.+?(?:(?:{.+?},?)+(?:["A-Za-z\-:]+)?)+?})(,\w+=)({.+?})/,
      (fullmatch, musicVar, musicJson, musicpoolVar, musicpoolJson) => {
        // Attempt to sanitize the json into actual json
        let sanitizedMusicJson = musicJson
          // What is with these true/false constants?
          .replace(/!0/g, 'true')
          .replace(/!1/g, 'false')
          // Quote unquoted keys
          .replace(
            /(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g,
            '$1"$3":'
          );

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

        let rewrite = (
          musicVar +
          `JSON.parse(atob("${btoa(JSON.stringify(JSON.parse(newMusicJson)))}"))` +
          musicpoolVar +
          `JSON.parse(atob("${btoa(JSON.stringify(JSON.parse(newMusicPoolJson)))}"))`
        );
        console.log(
          "Rewriting music definition",
          { from: fullmatch, to: rewrite }
        );
        replaced = true;
        return rewrite;
      }
    );

    console.log("Rewrite successful: " + replaced);
    if (!replaced) console.error(
      "Custom music rewrite failed. " +
      "Please update your plugin. "
    );

    filter.write(new TextEncoder().encode(src));
  }
});
