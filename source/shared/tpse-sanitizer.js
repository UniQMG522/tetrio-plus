/**
 * @param {Object} data the data object to load
 * @param {Storage} storage A browser-storage-like object with 'set' method
 * @returns {String} user-readable summary of the import results
 *
 *
 * Relies on migrate.js
 */
async function sanitizeAndLoadTPSE(data, storage) {
  function parseBoolean(key) {
    return async bool => {
      if (typeof bool !== 'boolean') return 'ERROR: Expected boolean';
      await storage.set({ [key]: bool });
      return 'success';
    }
  }

  function electronOnly(callback) {
    return async value => {
      if (!browser.electron)
        return 'Ignored: This option is only for the desktop client';
      return await callback(value);
    }
  }

  function filterValues(object, path, whitelist) {
    for (let key of Object.keys(object)) {
      if (whitelist.indexOf(key) == -1) {
        return {
          success: false,
          error: `ERROR: Unexpected value at ${path}.${key}`
        }
      }
    }
    return { success: true };
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
    enableTouchControls: parseBoolean('enableTouchControls'),
    transparentBgEnabled: electronOnly(parseBoolean('transparentBgEnabled')),
    opaqueTransparentBackground: parseBoolean('opaqueTransparentBackground'),
    openDevtoolsOnStart: electronOnly(parseBoolean('openDevtoolsOnStart')),
    enableAllSongTweaker: parseBoolean('enableAllSongTweaker'),
    showLegacyOptions: parseBoolean('showLegacyOptions'),
    bypassBootstrapper: parseBoolean('bypassBootstrapper'),
    enableCustomMaps: parseBoolean('enableCustomMaps'),
    skin: async svgText => {
      let parser = new DOMParser();
      let svg = parser.parseFromString(svgText, 'application/xhtml+xml');

      let errs = [...svg.getElementsByTagName('parsererror')];
      if (errs.length > 0) {
        return 'ERROR: ' + errs.map(err => err.innerText).join(',');
      }

      await storage.set({ skin: svgText });
      return 'success';
    },
    skinPng: async dataUri => {
      if (typeof dataUri != 'string' || !/^data:image\/.+?;base64,/.test(dataUri))
        return `ERROR: Missing/invalid image ${bg.id}`
      await storage.set({ skinPng: dataUri });
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

      await storage.set({
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
      await storage.set(toSet);
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

      await storage.set({
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

        if (typeof song.override != 'string' && song.override !== null)
          return `ERROR: Expected string or null at [].override`;

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

        let genres = ['INTERFACE', 'CALM', 'BATTLE', 'DISABLED', 'OVERRIDE'];
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
          if (['id', 'filename', 'metadata', 'override'].indexOf(key) == -1)
            return `ERROR: Unexpected value at [].${key}`;

        let mp3 = importData['song-' + song.id];
        if (typeof mp3 != 'string' || !/^data:audio\/.+?;base64,/.test(mp3))
          return `ERROR: Missing/invalid songfile ${song.id}`

        toSet['song-' + song.id] = mp3;
      }

      toSet.music = JSON.parse(JSON.stringify(music));
      await storage.set(toSet);
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

        if (typeof node.x != 'number')
          return `ERROR: Expected number at [].x`;

        if (typeof node.y != 'number')
          return `ERROR: Expected number at [].y`;

        if (typeof node.effects != 'object')
          return `ERROR: Expected object at [].effects`;

        if (typeof node.effects.volume != 'number' || node.effects.volume < 0)
          return `ERROR: Expected positive number at [].effects.volume`;

        if (typeof node.effects.speed != 'number' || node.effects.speed < 0)
          return `ERROR: Expected positive number at [].effects.speed`;

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

          if (typeof trigger.locationMultiplier != 'number' || trigger.locationMultiplier < 0)
            return `ERROR: Expected positive number value at [].triggers[].locationMultiplier`;

          if (typeof trigger.crossfade != 'boolean')
            return `ERROR: Expected boolean value at [].triggers[].crossfade`;

          if (typeof trigger.crossfadeDuration != 'number' || trigger.crossfadeDuration < 0)
            return `ERROR: Expected positive number value at [].triggers[].crossfadeDuration`;

          if (typeof trigger.value != 'number' || trigger.value < 0)
            return `ERROR: Expected positive number value at [].triggers[].value`;

          if (['==', '!=', '>', '<'].indexOf(trigger.valueOperator) == -1)
            return `ERROR: Expected enum value at [].triggers[].valueOperator, got ${trigger.valueOperator}`;

          if (typeof trigger.anchor != 'object')
            return `ERROR: Expected object at [].triggers[].anchor`;

          if (typeof trigger.anchor.origin != 'object')
            return `ERROR: Expected object at [].triggers[].anchor.origin`;

          if (typeof trigger.anchor.target != 'object')
            return `ERROR: Expected object at [].triggers[].anchor.target`;

          if (typeof trigger.anchor.origin.x != 'number')
            return `ERROR: Expected number at [].triggers[].anchor.origin.x`;

          if (typeof trigger.anchor.origin.y != 'number')
            return `ERROR: Expected number at [].triggers[].anchor.origin.y`;

          if (typeof trigger.anchor.target.x != 'number')
            return `ERROR: Expected number at [].triggers[].anchor.target.x`;

          if (typeof trigger.anchor.target.y != 'number')
            return `ERROR: Expected number at [].triggers[].anchor.target.y`;

          let result1 = filterValues(trigger, '[].triggers[]', [
            'mode', 'target', 'event', 'preserveLocation', 'value',
            'valueOperator', 'anchor', 'crossfade', 'crossfadeDuration',
            'locationMultiplier'
          ]);
          if (!result1.success) return result1.error;

          let result2 = filterValues(trigger.anchor, '[].triggers[].anchor', [
            'origin', 'target'
          ]);
          if (!result2.success) return result2.error;

          let result3 = filterValues(
            trigger.anchor.origin,
            '[].triggers[].anchor.origin',
            [ 'x', 'y']
          );
          if (!result3.success) return result3.error;

          let result4 = filterValues(
            trigger.anchor.target,
            '[].triggers[].anchor.target',
            [ 'x', 'y']
          );
          if (!result4.success) return result4.error;
        }

        let result5 = filterValues(node, '[]', [
          'id', 'type', 'name', 'audio', 'triggers', 'hidden', 'x', 'y',
          'effects'
        ]);
        if (!result5.success) return result5.error;
      }

      toSet.musicGraph = JSON.stringify(graph);
      console.log("Set", toSet);
      await storage.set(toSet);
      return 'success';
    },
    touchControlConfig: async config => {
      try {
        config = JSON.parse(config);
      } catch(ex) {
        return `ERROR: Invalid json: ${ex}`
      }

      if (typeof config != 'object')
        return `ERROR: Expected object at $`;

      if (['touchpad', 'hybrid', 'keys'].indexOf(config.mode) == -1)
        return `ERROR: Expected enum value at $.mode`;

      if (typeof config.binding != 'object')
        return `ERROR: Expected object at $.binding`;

      if (typeof config.binding.L_left != 'string')
        return `ERROR: Expected string at $.binding.L_left`;
      if (typeof config.binding.L_right != 'string')
        return `ERROR: Expected string at $.binding.L_right`;
      if (typeof config.binding.L_up != 'string')
        return `ERROR: Expected string at $.binding.L_up`;
      if (typeof config.binding.L_down != 'string')
        return `ERROR: Expected string at $.binding.L_down`;
      if (typeof config.binding.R_left != 'string')
        return `ERROR: Expected string at $.binding.R_left`;
      if (typeof config.binding.R_right != 'string')
        return `ERROR: Expected string at $.binding.R_right`;
      if (typeof config.binding.R_up != 'string')
        return `ERROR: Expected string at $.binding.R_up`;
      if (typeof config.binding.R_down != 'string')
        return `ERROR: Expected string at $.binding.R_down`;

      if (!Array.isArray(config.keys))
        return `ERROR: Expected array at $.keys`;

      for (let key of config.keys) {
        if (typeof key.x != 'number')
          return `ERROR: Expected number at $.keys[].x`;
        if (typeof key.y != 'number')
          return `ERROR: Expected number at $.keys[].y`;
        if (typeof key.w != 'number')
          return `ERROR: Expected number at $.keys[].w`;
        if (typeof key.h != 'number')
          return `ERROR: Expected number at $.keys[].h`;
        if (['hover', 'tap'].indexOf(key.behavior) == -1)
          return `ERROR: Expected enum value at $.keys[].behavior`;
        if (typeof key.bind != 'string')
          return `ERROR: Expected string at $.keys[].bind`;

        let result1 = filterValues(key, '$.keys[]', [
          'x', 'y', 'w', 'h', 'behavior', 'bind'
        ]);
        if (!result1.success) return result1.error;
      }

      let result2 = filterValues(config, '$', [
        'mode', 'deadzone', 'binding', 'keys'
      ]);
      if (!result2.success) return result2.error;

      await storage.set({
        touchControlConfig: JSON.stringify(config)
      });
      return 'success';
    }
  }

  const results = [];
  let { from, to } = await migrate({
    get(keys) { return data }, // It's technically complient
    set(pairs) { Object.assign(data, pairs) }
  });
  if (from != to) {
    results.push(`[Data pack migrated from v${from} to v${to}]`)
  }

  for (let [name, importer] of Object.entries(importers)) {
    if (data[name] !== null && data[name] !== undefined) {
      results.push(name + ' | ' + await importer(data[name], data));
    } else {
      results.push(name + ' | Ignored: No data in pack');
    }
  }

  return results.join('\n');
}
