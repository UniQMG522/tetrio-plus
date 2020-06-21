function parseBoolean(key) {
  return async bool => {
    if (typeof bool !== 'boolean') return 'ERROR: Expected boolean';
    await browser.storage.local.set({ [key]: bool });
    return 'success';
  }
}

function electronOnly(callback) {
  return async value => {
    if (!browser.electron)
      return 'ERROR: This option is only for the desktop client';
    return await callback(value);
  }
}

const importers = {
  sfxEnabled: parseBoolean('sfxEnabled'),
  musicEnabled: parseBoolean('musicEnabled'),
  musicGraphEnabled: parseBoolean('musicGraphEnabled'),
  disableVanillaMusic: parseBoolean('disableVanillaMusic'),
  enableMissingMusicPatch: parseBoolean('enableMissingMusicPatch'),
  enableOSD: parseBoolean('enableOSD'),
  bgEnabled: parseBoolean('bgEnabled'),
  animatedBgEnabled: parseBoolean('animatedBgEnabled'),
  transparentBgEnabled: electronOnly(parseBoolean('transparentBgEnabled')),
  openDevtoolsOnStart: electronOnly(parseBoolean('openDevtoolsOnStart')),
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
      if (typeof bg.id != 'string' || !/^[a-z]+$/.test(bg.id))
        return `ERROR: Expected lowercase alphabetical string at [].id`;

      if (typeof bg.filename != 'string')
        return `ERROR: Expected alphabetical string at [].filename`;

      if (Object.keys(bg).length != 2)
        return `ERROR: Unexpected extra keys at []`;

      let img = importData['background-' + bg.id];
      if (typeof img != 'string' || !/^data:image\/.+?;base64,/.test(img))
        return `ERROR: Missing/invalid image ${bg.id}`

      toSet['background-' + bg.id] = img;
    }

    toSet.backgrounds = JSON.parse(JSON.stringify(backgrounds));
    await browser.storage.local.set(toSet);
    return 'success';
  },
  animatedBackground: async (bg, importData) => {
    if (typeof bg != 'object') return `ERROR: Expected object`;
    if (typeof bg.id != 'string' || !/^[a-z]+$/.test(bg.id))
      return `ERROR: Expected lowercase alphabetical string at id`;

    if (typeof bg.filename != 'string')
      return `ERROR: Expected alphabetical string at filename`;

    if (Object.keys(bg).length != 2)
      return `ERROR: Unexpected extra keys`;

    let img = importData['background-' + bg.id];
    if (typeof img != 'string' || !/^data:image\/.+?;base64,/.test(img))
      return `ERROR: Missing/invalid image ${bg.id}`

    await browser.storage.local.set({
      animatedBackground: bg,
      ['background-' + bg.id]: img
    });
    return 'success';
  },
  music: async (music, importData) => {
    let toSet = {};

    if (!Array.isArray(music)) return `ERROR: Expected array`;
    for (let song of music) {
      if (typeof song.id != 'string' || !/^[a-z]+$/.test(song.id))
        return `ERROR: Expected lowercase alphabetical string at [].id`;

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

      let genres = ['INTERFACE', 'CALM', 'BATTLE', 'DISABLED'];
      if (genres.indexOf(song.metadata.genre) === -1)
        return `ERROR: Unknown genre at [].metadata.genre`;

      if (typeof song.metadata.loop != 'boolean')
        return `ERROR: Expected boolean at [].metadata.loop`;

      if (typeof song.metadata.loopStart != 'number')
        return `ERROR: Expected number at [].metadata.loopStart`;

      if (typeof song.metadata.loopLength != 'number')
        return `ERROR: Expected number at [].metadata.loopLength`;

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
  },
  musicGraph: async (graph, importData) => {
    let toSet = {};

    try {
      graph = JSON.parse(graph);
    } catch(ex) {
      return `ERROR: Invalid json: ${ex}`
    }

    if (!Array.isArray(graph)) return `ERROR: Expected array`;
    for (let node of graph) {
      if (typeof node.id != 'number')
        return `ERROR: Expected number at [].id`;

      if (['normal', 'root'].indexOf(node.type) == -1)
        return `ERROR: Expected enum value at [].type`;

      if (typeof node.name != 'string')
        return `ERROR: Expected string at [].name`;

      if (node.audio !== null) {
        if (typeof node.audio != 'string')
          return `ERROR: Expected string or null at [].audio`;

        let mp3 = importData['song-' + node.audio];
        if (typeof mp3 != 'string' || !/^data:audio\/.+?;base64,/.test(mp3))
          return `ERROR: Missing/invalid songfile ${node.audio}`;
        toSet['song-' + node.audio] = mp3;
      }

      if (typeof node.hidden != 'boolean')
        return `ERROR: Expected boolean value at [].hidden`;

      if (!Array.isArray(node.triggers))
        return `ERROR: Expected array at [].triggers`;

      for (let trigger of node.triggers) {
        if (['fork', 'goto', 'kill', 'random'].indexOf(trigger.mode) == -1)
          return `ERROR: Expected enum value at [].triggers[].mode`;

        if (typeof trigger.target != 'number')
          return `ERROR: Expected number value at [].triggers[].target`;

        if (typeof trigger.event != 'string')
          return `ERROR: Expected string value at [].triggers[].event`;

        if (typeof trigger.preserveLocation != 'boolean')
          return `ERROR: Expected boolean value at [].triggers[].preserveLocation`;

        if (typeof trigger.value != 'number' || trigger.value < 0)
          return `ERROR: Expected positive number value at [].triggers[].value`;

        if (['==', '!=', '>', '<'].indexOf(trigger.valueOperator) == -1)
          return `ERROR: Expected enum value at [].triggers[].valueOperator, got ${trigger.valueOperator}`;

        let allowed = [
          'mode', 'target', 'event', 'preserveLocation', 'value',
          'valueOperator'
        ];
        for (let key of Object.keys(trigger))
          if (allowed.indexOf(key) == -1)
            return `ERROR: Unexpected value at [].triggers[].${key}`;
      }

      let allowed = ['id', 'type', 'name', 'audio', 'triggers', 'hidden'];
      for (let key of Object.keys(node))
        if (allowed.indexOf(key) == -1)
          return `ERROR: Unexpected value at [].${key}`;
    }

    toSet.musicGraph = JSON.stringify(graph);
    console.log("Set", toSet);
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

  let exportKeys = [];
  let elems = document.getElementsByClassName('export-toggle');
  for (let elem of elems) {
    if (elem.checked) {
      exportKeys.push(...elem.getAttribute('data-export').split(','));
    }
  }

  let config = await browser.storage.local.get(exportKeys);

  if (config.animatedBackground) {
    let key = 'background-' + config.animatedBackground.id;
    Object.assign(config, await browser.storage.local.get(key));
  }

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

document.getElementById('clearData').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all your Tetr.io+ data?')) {
    browser.storage.local.clear().then(() => {
      alert('Data cleared');
    });
  }
})
