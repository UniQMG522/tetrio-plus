import AudioEditor from './AudioEditor.js';
import OptionToggle from './OptionToggle.js';
const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div class="component-wrapper">
      <div class="control-group">
        <button @click="openMusicUploader" title="Opens the music uploader window">
          Add new music
        </button>
        <button @click="openMusicGraphEditor()" title="Opens the music graph editor">
          Open music graph editor
        </button>
      </div>

      <div class="option-group">
        <option-toggle storageKey="musicEnabled">
          <span title="Enables custom music">
            Enable custom music
          </span>
        </option-toggle>
        <option-toggle storageKey="musicGraphEnabled" enabledIfKey="musicEnabled">
          <span title="Enables the music graph">
            Enable music graph
          </span>
        </option-toggle>
        <option-toggle storageKey="disableVanillaMusic" enabledIfKey="musicEnabled">
          <span title="Removes the game's existing soundtrack">
            Disable built in music
          </span>
          <option-toggle inline storageKey="musicEnabled" mode="show">
            <option-toggle inline storageKey="disableVanillaMusic" mode="show">
              <option-toggle inline storageKey="enableMissingMusicPatch" mode="hide">
                <span
                  class="warning-icon"
                  :title="(
                    'Missing songs may render the game unplayable. This ' +
                    'often manifests as a softlock once a game starts where ' +
                    'pieces won\\'t fall. Make sure to set a specific song, ' +
                    'have at least one \\'calm\\' song and one \\'battle\\' ' +
                    'song, or enable the missing music patch below.'
                  )"
                >⚠️</span>
              </option-toggle>
            </option-toggle>
          </option-toggle>
        </option-toggle>
        <div title="Prevents crashes when disabling built-in music">
          <option-toggle storageKey="enableMissingMusicPatch" enabledIfKey="musicEnabled">
            Enable missing music patch
          </option-toggle>
        </div>
      </div>

      <option-toggle storageKey="musicEnabled" mode="show">
        <hr />
        <div class="preview-group">
          <div v-if="music.length == 0">
            No custom music
          </div>
          <div class="song" v-else v-for="song of music">
            <button @click="deleteSong(song)" title="Removes this song">
              Delete
            </button>
            <button @click="editSong(song)" title="Shows the editor for this song">
              Edit
            </button>
            <span class="song-category">
              {{ song.metadata.genre.slice(0,1) }}
            </span>
            <span class="song-name" :title="JSON.stringify(song, null, 2)">
              {{ song.filename }}
            </span>
          </div>
        </div>
      </option-toggle>

      <fieldset class="section subsection" v-if="editing">
        <legend>Audio Editor</legend>
        <audio-editor :targetSong="editing" @change="refreshSongs"/>
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
    openMusicGraphEditor() {
      browser.tabs.create({
        url: browser.extension.getURL(
          'source/panels/musicgrapheditor/index.html'
        ),
        active: true
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
