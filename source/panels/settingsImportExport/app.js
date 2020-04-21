function parseBoolean(key) {
  return async bool => {
    if (typeof bool !== 'boolean') return 'ERROR: Expected boolean';
    await browser.storage.local.set({ [key]: bool });
    return 'success';
  }
}

const importers = {
  sfxEnabled: parseBoolean('sfxEnabled'),
  musicEnabled: parseBoolean('musicEnabled'),
  disableVanillaMusic: parseBoolean('disableVanillaMusic'),
  enableMissingMusicPatch: parseBoolean('enableMissingMusicPatch'),
  enableSpeens: parseBoolean('enableSpeens'),
  enableOSD: parseBoolean('enableOSD'),
  bgEnabled: parseBoolean('bgEnabled'),
  skin: async svgText => {
    let parser = new DOMParser();
    let svg = parser.parseFromString(svgText, 'application/xhtml+xml');

    let errs = [...svg.getElementsByTagName('parsererror')];
    if (errs.length > 0) {
      return 'ERROR: ' + errs.map(err => err.innerText).join(',');
    }

    await browser.storage.local.set({ skin: svgText });
    return 'success';
  },
  skinPng: async dataUri => {
    if (typeof dataUri != 'string' || !/^data:image\/.+?;base64,/.test(dataUri))
      return `ERROR: Missing/invalid image ${bg.id}`
    await browser.storage.local.set({ skinPng: dataUri });
    return 'success';
  },
  customSoundAtlas: async (atlas, importData) => {
    if (typeof atlas != 'object') return `ERROR: Expected object`;
    for (let [key, value] of Object.entries(atlas)) {
      if (!Array.isArray(value))
        return `ERROR: Expected array at ${key}`;

      if (value.length != 2)
        return `ERROR: Expected length 2 at ${key}`;

      if (typeof value[0] != 'number')
        return `ERROR: Expected number at ${key}[0]`;
    }

    let ogg = importData['customSounds'];
    if (typeof ogg != 'string' || !/^data:audio\/.+?;base64,/.test(ogg))
      return `ERROR: Missing/invalid sound atlas soundfile`

    await browser.storage.local.set({
      customSoundAtlas: JSON.parse(JSON.stringify(atlas)),
      customSounds: ogg
    });
    return 'success';
  },
  backgrounds: async (backgrounds, importData) => {
    let toSet = {};

    if (!Array.isArray(backgrounds)) return `ERROR: Expected array`;
    for (let bg of backgrounds) {
      if (typeof bg.id != 'string')
        return `ERROR: Expected string at [].id`;

      if (typeof bg.filename != 'string')
        return `ERROR: Expected string at [].filename`;

      let img = importData['background-' + bg.id];
      if (typeof img != 'string' || !/^data:image\/.+?;base64,/.test(img))
        return `ERROR: Missing/invalid image ${bg.id}`

      toSet['background-' + bg.id] = img;
    }

    toSet.backgrounds = JSON.parse(JSON.stringify(backgrounds));
    await browser.storage.local.set(toSet);
    return 'success';
  },
  music: async (music, importData) => {
    let toSet = {};

    if (!Array.isArray(music)) return `ERROR: Expected array`;
    for (let song of music) {
      if (typeof song.id != 'string')
        return `ERROR: Expected string at [].id`;

      if (typeof song.filename != 'string')
        return `ERROR: Expected string at [].filename`;

      if (typeof song.metadata != 'object' || !song.metadata)
        return `ERROR: Expected object at [].metadata`;

      if (typeof song.metadata.name != 'string')
        return `ERROR: Expected string at [].metadata.name`;

      if (typeof song.metadata.jpname != 'string')
        return `ERROR: Expected string at [].metadata.jpname`;

      if (typeof song.metadata.artist != 'string')
        return `ERROR: Expected string at [].metadata.artist`;

      if (typeof song.metadata.jpartist != 'string')
        return `ERROR: Expected string at [].metadata.jpartist`;

      if (typeof song.metadata.source != 'string')
        return `ERROR: Expected string at [].metadata.source`;

      if (['INTERFACE', 'CALM', 'BATTLE'].indexOf(song.metadata.genre) === -1)
        return `ERROR: Unknown genre at [].metadata.genre`;

      if (typeof song.metadata.loop != 'boolean')
        return `ERROR: Expected boolean at [].metadata.loop`;

      if (typeof song.metadata.loopStart != 'number')
        return `ERROR: Expected boolean at [].metadata.loopStart`;

      if (typeof song.metadata.loopLength != 'number')
        return `ERROR: Expected boolean at [].metadata.loopLength`;

      for (let key of Object.keys(song.metadata)) {
        if (
          [
            'name', 'jpname', 'artist', 'jpartist', 'genre', 'source', 'loop',
            'loopStart', 'loopLength'
          ].indexOf(key) == -1
        ) return `ERROR: Unexpected value at [].metadata.${key}`;
      }

      for (let key of Object.keys(song))
        if (['id', 'filename', 'metadata'].indexOf(key) == -1)
          return `ERROR: Unexpected value at [].${key}`;

      let mp3 = importData['song-' + song.id];
      if (typeof mp3 != 'string' || !/^data:audio\/.+?;base64,/.test(mp3))
        return `ERROR: Missing/invalid songfile ${song.id}`

      toSet['song-' + song.id] = mp3;
    }

    toSet.music = JSON.parse(JSON.stringify(music));
    await browser.storage.local.set(toSet);
    return 'success';
  }
}

document.getElementById('import').addEventListener('change', async evt => {
  let status = document.createElement('div');
  status.innerText = 'working on import...';
  document.body.appendChild(status);

  var reader = new FileReader();

  reader.readAsText(evt.target.files[0], "UTF-8");

  reader.onerror = function (evt) {
    alert("Failed to load content pack");
  }

  try {
    let result = await new Promise(res => {
      reader.onload = evt => res(evt.target.result);
    });

    let data = JSON.parse(result);
    let results = [];
    for (let [name, importer] of Object.entries(importers)) {
      if (data[name] !== null && data[name] !== undefined) {
        results.push(name + ' | ' + await importer(data[name], data));
      } else {
        results.push(name + ' | Ignored: No data in pack');
      }
    }

    alert(results.join('\n'));
  } catch(ex) {
    alert("Failed to load content pack! See the console for more details");
    console.error("Failed to load content pack: ", ex);
    console.error(
      "If your content pack is more than a few hundred megabytes, the parser " +
      "may be running out of memory."
    );
  } finally {
    // reset the handler
    evt.target.type = '';
    evt.target.type = 'file';
    status.remove();
  }
});

document.getElementById('export').addEventListener('click', async evt => {
  let status = document.createElement('div');
  status.innerText = 'working on export...';
  document.body.appendChild(status);

  let config = await browser.storage.local.get([
    'skin',
    'skinPng',

    'sfxEnabled',
    'customSoundAtlas',
    'customSounds',

    'musicEnabled',
    'disableVanillaMusic',
    'enableMissingMusicPatch',
    'music',

    'enableSpeens',
    'enableOSD',

    'backgrounds',
    'bgEnabled'
  ]);

  if (config.backgrounds) {
    let bgIds = config.backgrounds.map(({ id }) => 'background-' + id);
    let bgs = await browser.storage.local.get(bgIds);
    Object.assign(config, bgs);
  }

  if (config.music) {
    let musicIds = config.music.map(({ id }) => 'song-' + id);
    let songs = await browser.storage.local.get(musicIds);
    Object.assign(config, songs);
  }

  console.log("Encoding data...");
  let json = JSON.stringify(config, null, 2);
  let blob = new Blob([json], { type: 'application/json' });

  console.log("Offering download...");
  // https://stackoverflow.com/questions/3665115/18197341#18197341
  let a = document.createElement('a');
  a.setAttribute('href', URL.createObjectURL(blob));
  a.setAttribute('download', 'tetrio-plus-settings-export.tpse');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  status.remove();
});
