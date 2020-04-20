import AudioEditor from './AudioEditor.js';
import OptionToggle from './OptionToggle.js';
const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div>
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
    </div>
  `,
  data: () => ({
    cache: {
      music: null,
      editingSrc: null,
    },
    editing: null
  }),
  components: { AudioEditor, OptionToggle },
  computed: {
    music() {
      browser.storage.local.get('music').then(({ music }) => {
        this.cache.music = music;
      });
      if (!this.cache.music) return [];
      return this.cache.music;
    }
  },
  methods: {
    openMusicUploader() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL('source/panels/musicpicker/index.html'),
        width: 300,
        height: 50
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
}
