import AudioEditor from './AudioEditor.js'
const html = arg => arg.join(''); // NOOP, for editor integration.

const app = new Vue({
  template: html`
    <div id="app">
      <h1>Tetr.io+</h1>

      <hr>

      <div>
        <button @click="openImageChanger" title="Opens the skin changer window">
          Change skin
        </button>
        <button @click="resetSkin" title="Removes the existing custom skin">
          Remove skin
        </button>
      </div>

      <fieldset>
        <legend>Current skin</legend>
        <img
          title="This is the current block skin you are using."
          :src="skinUrl"
          v-if="skinUrl">
        <span id="noSkin" v-else>No skin set</span>
      </fieldset>

      <hr>

      <button @click="openSfxEditor" title="Opens the sfx editor tab">
        Open sfx editor
      </button>
      <div>
        <input type="checkbox" v-model="sfxEnabled" />
        <label
          @click="sfxEnabled = !sfxEnabled"
          title="Enables custom sound effects">
          Enable custom sfx (may break the game)
        </label>
      </div>
      <fieldset>
        <legend>Current sfx atlas</legend>
        <div v-if="!sfxEnabled">
          Custom sfx disabled
        </div>
        <audio
          v-else-if="sfxAtlasSrc"
          title="All the game's sound effects are loaded from this audio file."
          :src="sfxAtlasSrc"
          controls></audio>
        <div v-else>
          Custom sfx not set up
        </div>
      </fieldset>

      <hr>

      <fieldset v-if="editing">
        <legend>Audio Editor</legend>
        <audio-editor :targetSong="editing" @change="refreshSongs"/>
      </fieldset>

      <button @click="openMusicUploader" title="Opens the music uploader window">
        Add new music
      </button>
      <div>
        <input
          type="checkbox"
          v-model="musicEnabled" />
        <label
          @click="musicEnabled = !musicEnabled"
          title="Enables custom music">
          Enable custom music (may break the game)
        </label>
      </div>
      <div>
        <input
          type="checkbox"
          v-model="disableVanillaMusic"
          :disabled="!musicEnabled" />
        <label
          @click="disableVanillaMusic = !disableVanillaMusic"
          title="Removes the music's existing soundtrack">
          Disable built in music (may break the game)
        </label>
      </div>
      <div>
        <input
          type="checkbox"
          v-model="enableMissingMusicPatch"
          :disabled="!musicEnabled" />
        <label
          @click="enableMissingMusicPatch = !enableMissingMusicPatch"
          title="Stops softlocks associated with missing music">
          Enable missing music patch (may break the game)
        </label>
      </div>
      <div v-if="disableVanillaMusic && !enableMissingMusicPatch"
           class="missingMusicWarning">
        Missing songs may render the game unplayable. This often manifests as a
        softlock once a game starts where pieces won't fall. Make sure to set a
        specific song, have at least one 'calm' song and one 'battle' song, or
        enable the missing music patch above. If you see "**.ost[*] is
        undefined" in your console, these settings are causing it!
      </div>
      <fieldset>
        <legend>Custom music</legend>
        <div v-if="!musicEnabled">
          Custom music disabled
        </div>
        <div v-else-if="music.length == 0">
          No custom music
        </div>
        <div class="music" v-else v-for="song of music">
          <button @click="deleteSong(song)" title="Removes this song">
            Delete
          </button>
          <button @click="editSong(song)" title="Shows the editor for this song">
            Edit
          </button>
          <span class="songName" :title="JSON.stringify(song, null, 2)">
            {{ song.filename }}
          </span>
        </div>
      </fieldset>

      <hr>

      <fieldset>
        <legend>Just for fun...</legend>
        <div>
          <input type="checkbox" v-model="enableSpeens" />
          <label
            @click="enableSpeens = !enableSpeens"
            title="LARGE O SPIN TWO MANY TIMES">
            Enable april fools text (may break the game)
          </label>
        </div>
      </fieldset>

      <strong>Refresh your game after making any changes.</strong><br>
      <a href="https://gitlab.com/UniQMG/tetrio-plus">Source code and readme</a>
    </div>
  `,
  components: { AudioEditor },
  data: {
    cache: {
      skin: null,
      music: null,
      editingSrc: null,
      musicEnabled: null,
      disableVanillaMusic: null,
      enableMissingMusicPatch: null,
      sfxAtlasSrc: null,
      sfxEnabled: null,
      enableSpeens: null
    },
    editing: null
  },
  computed: {
    sfxAtlasSrc() {
      browser.storage.local.get('customSounds').then(({ customSounds }) => {
        if (this.cache.sfxAtlasSrc != customSounds)
          this.cache.sfxAtlasSrc = customSounds;
      });
      return this.cache.sfxAtlasSrc;
    },
    enableSpeens: {
      get() {
        browser.storage.local.get('enableSpeens').then(({ enableSpeens }) => {
          this.cache.enableSpeens = enableSpeens;
        });
        return this.cache.enableSpeens;
      },
      set(val) {
        browser.storage.local.set({ enableSpeens: val }).then(() => {
          this.cache.enableSpeens = val;
        });
      }
    },
    sfxEnabled: {
      get() {
        browser.storage.local.get('sfxEnabled').then(({ sfxEnabled }) => {
          this.cache.sfxEnabled = sfxEnabled;
        });
        return this.cache.sfxEnabled;
      },
      set(val) {
        browser.storage.local.set({ sfxEnabled: val }).then(() => {
          this.cache.sfxEnabled = val;
        });
      }
    },
    skinUrl() {
      browser.storage.local.get('skin').then(({ skin: newSkin }) => {
        if (newSkin != this.skin) this.cache.skin = newSkin;
      });
      if (!this.cache.skin) return false;
      return 'data:image/svg+xml;base64,' + btoa(this.cache.skin);
    },
    music() {
      browser.storage.local.get('music').then(({ music }) => {
        this.cache.music = music;
      });
      if (!this.cache.music) return [];
      return this.cache.music;
    },
    musicEnabled: {
      get() {
        browser.storage.local.get('musicEnabled').then(({ musicEnabled }) => {
          this.cache.musicEnabled = musicEnabled;
        });
        return this.cache.musicEnabled;
      },
      set(val) {
        browser.storage.local.set({ musicEnabled: val }).then(() => {
          this.cache.musicEnabled = val;
        });
      }
    },
    disableVanillaMusic: {
      get() {
        browser.storage.local.get('disableVanillaMusic').then(({ disableVanillaMusic }) => {
          this.cache.disableVanillaMusic = disableVanillaMusic;
        });
        return this.cache.disableVanillaMusic;
      },
      set(val) {
        browser.storage.local.set({ disableVanillaMusic: val }).then(() => {
          this.cache.disableVanillaMusic = val;
        });
      }
    },
    enableMissingMusicPatch: {
      get() {
        browser.storage.local.get('enableMissingMusicPatch').then(({
          enableMissingMusicPatch
        }) => {
          this.cache.enableMissingMusicPatch = enableMissingMusicPatch;
        });
        return this.cache.enableMissingMusicPatch;
      },
      set(val) {
        browser.storage.local.set({ enableMissingMusicPatch: val }).then(() => {
          this.cache.enableMissingMusicPatch = val;
        });
      }
    }
  },
  methods: {
    openSfxEditor() {
      browser.tabs.create({
        url: browser.extension.getURL('source/panels/sfxcomposer/index.html'),
        active: true
      });
    },
    openImageChanger() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL('source/panels/skinpicker/index.html'),
        width: 600,
        height: 285
      });
    },
    openMusicUploader() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL('source/panels/musicpicker/index.html'),
        width: 300,
        height: 50
      });
    },
    resetSkin() {
      browser.storage.local.remove(['skin']).then(() => this.cache.skin = null);
    },
    refreshSongs() {
      this.cache.songs = null;
      this.editing = null;
    },
    editSong(song) {
      this.editing = JSON.parse(JSON.stringify(song));
    },
    deleteSong(toDelete) {
      browser.storage.local.get('music').then(({ music }) => {
        music = music.filter(song => {
          if (song.id == toDelete.id) {
            browser.storage.local.remove('song-' + song.id);
            return false;
          }
          return true;
        });
        return browser.storage.local.set({ music });
      }).then(() => {
        return browser.storage.local.get('music');
      }).then(({ music }) => {
        this.cache.music = music;
      });
    }
  }
});

app.$mount('#app');
