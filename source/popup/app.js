import AudioEditor from './components/AudioEditor.js'
import OptionToggle from './components/OptionToggle.js'
import BackgroundEmbed from './components/BackgroundEmbed.js';
import ThemeManager from './components/ThemeManager.js';
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
      <div title="Enables custom sound effects">
        <option-toggle storageKey="sfxEnabled">
          Enable custom sfx (may break the game)
        </option-toggle>
      </div>
      <fieldset>
        <legend>Current sfx atlas</legend>
        <option-toggle storageKey="sfxEnabled" mode="hide">
          Custom sfx disabled
        </option-toggle>
        <option-toggle storageKey="sfxEnabled" mode="show">
          <div v-if="!sfxAtlasSrc">
            Custom sfx not set up
          </div>
          <audio
            v-else
            title="All the game's sound effects are loaded from this audio file."
            :src="sfxAtlasSrc"
            controls></audio>
        </option-toggle>
      </fieldset>

      <hr>

      <fieldset v-if="editing">
        <legend>Audio Editor</legend>
        <audio-editor :targetSong="editing" @change="refreshSongs"/>
      </fieldset>

      <button @click="openMusicUploader" title="Opens the music uploader window">
        Add new music
      </button>
      <div title="Enables custom music">
        <option-toggle storageKey="musicEnabled">
          Enable custom music (may break the game)
        </option-toggle>
      </div>
      <div title="Removes the game's existing soundtrack">
        <option-toggle storageKey="disableVanillaMusic" enabledIfKey="musicEnabled">
          Disable built in music (may break the game)
        </option-toggle>
      </div>
      <div title="Removes the game's existing soundtrack">
        <option-toggle storageKey="enableMissingMusicPatch" enabledIfKey="musicEnabled">
          Enable missing music patch (may break the game)
        </option-toggle>
      </div>

      <option-toggle storageKey="musicEnabled" mode="show">
        <option-toggle storageKey="disableVanillaMusic" mode="show">
          <option-toggle storageKey="enableMissingMusicPatch" mode="hide">
            <div class="missingMusicWarning">
              Missing songs may render the game unplayable. This often manifests
              as a softlock once a game starts where pieces won't fall. Make
              sure to set a specific song, have at least one 'calm' song and one
              'battle' song, or enable the missing music patch above. If you see
              "**.ost[*] is undefined" in your console, these settings are
              causing it!
            </div>
          </option-toggle>
        </option-toggle>
      </option-toggle>

      <fieldset>
        <legend>Custom music</legend>
        <option-toggle storageKey="musicEnabled" mode="hide">
          Custom music disabled
        </option-toggle>
        <option-toggle storageKey="musicEnabled" mode="show">
          <div v-if="music.length == 0">
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
        </option-toggle>
      </fieldset>

      <hr>

      <button @click="openBgUploader" title="Opens the BG uploader window">
        Add local custom backgrounds
      </button>
      <div title="Enables custom backgrounds">
        <option-toggle storageKey="bgEnabled">
          Enable local custom backgrounds (may break the game)
        </option-toggle>
        <option-toggle storageKey="bgEnabled" mode="show">
          <div class="extendedWarningText">
            Tetrio already supports custom backgrounds. This feature serves them
            from the extension instead of requiring an external file host. This
            option will be overriden by a custom background set through the
            game's options menu.
          </div>
        </option-toggle>
        <fieldset>
          <legend>Custom backgrounds</legend>
          <option-toggle storageKey="bgEnabled" mode="hide">
            Custom music disabled
          </option-toggle>
          <option-toggle storageKey="bgEnabled" mode="show">
            <div v-if="backgrounds.length == 0">
              No custom backgrounds
            </div>
            <div class="background" v-else v-for="bg of backgrounds">
              <button @click="deleteBackground(bg)" title="Removes this background">
                Delete
              </button>
              <span class="bgName">
                {{ bg.filename }}
              </span>
              <br />
              <background-embed :background="bg"></background-embed>
            </div>
          </option-toggle>
        </fieldset>
      </div>

      <hr>

      <fieldset>
        <legend>Miscellaneous options</legend>
        <div title="LARGE O SPEEN TWO MANY TIMES">
          <option-toggle storageKey="enableSpeens">
            Enable april fools text (may break the game)
          </option-toggle>
          <theme-manager />
        </div>
      </fieldset>

      <strong>Refresh your game after making any changes.</strong><br>
      <a href="https://gitlab.com/UniQMG/tetrio-plus">Source code and readme</a>
    </div>
  `,
  components: { AudioEditor, OptionToggle, BackgroundEmbed, ThemeManager },
  data: {
    cache: {
      skin: null,
      music: null,
      editingSrc: null,
      sfxAtlasSrc: null,
      backgrounds: null
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
    backgrounds() {
      browser.storage.local.get('backgrounds').then(({ backgrounds }) => {
        this.cache.backgrounds = backgrounds;
      });
      if (!this.cache.backgrounds) return [];
      return this.cache.backgrounds;
    }
  },
  methods: {
    openSfxEditor() {
      browser.tabs.create({
        url: browser.extension.getURL('source/panels/sfxcomposer/index.html'),
        active: true
      });
    },
    openBgUploader() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL('source/panels/bgpicker/index.html'),
        width: 600,
        height: 285
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
    deleteBackground(toDelete) {
      browser.storage.local.get('backgrounds').then(({ backgrounds }) => {
        backgrounds = backgrounds.filter(bg => {
          if (bg.id == toDelete.id) {
            browser.storage.local.remove('background-' + bg.id);
            return false;
          }
          return true;
        });
        return browser.storage.local.set({ backgrounds });
      }).then(() => {
        return browser.storage.local.get('backgrounds');
      }).then(({ backgrounds }) => {
        this.cache.backgrounds = backgrounds;
      });
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
