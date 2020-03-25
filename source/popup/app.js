const html = arg => arg.join(''); // NOOP, for editor integration.

const AudioEditor = {
  template: html`
    <div>
      <div>
        <audio ref="player" :src="editingSrc" controls></audio>
      </div>
      <div style="font-family: monospace;">
        Current time: {{ msTime }}ms
      </div>
      <div>
        <button @click="setLoopStart()">Set loop start</button>
        <button @click="setLoopEnd()" :disabled="!canSetEnd">Set loop end</button>
      </div>
      <div>
        <label>Loop enabled</label>
        <input type="checkbox" v-model.boolean="song.metadata.loop"/>
      </div>
      <div>
        <label>Loop start (milliseconds)</label>
        <input type="number" v-model.number="song.metadata.loopStart"></input>
      </div>
      <div>
        <label>Loop length (milliseconds)</label>
        <input type="number" v-model.number="song.metadata.loopLength"></input>
      </div>
      <strong v-if="!song.metadata.loop">
        These still apply if looping is off, once you reach<br>
        {{ song.metadata.loopStart + song.metadata.loopLength }}ms your song
        will stop playing.
      </strong>
      <div>
        <label>Name</label>
        <input type="text" v-model="song.metadata.name"></input>
      </div>
      <div>
        <label>Name (jp)</label>
        <input type="text" v-model="song.metadata.jpname"></input>
      </div>
      <div>
        <label>Artist</label>
        <input type="text" v-model="song.metadata.artist"></input>
      </div>
      <div>
        <label>Artist (jp)</label>
        <input type="text" v-model="song.metadata.jpartist"></input>
      </div>
      <div>
        Genre
        <select v-model="song.metadata.genre">
          <option value="CALM">Calm</option>
          <option value="BATTLE">Battle</option>
          <option value="INTERFACE">Interface</option>
        </select>
      </div>
      <div>
        <button @click="saveChanges()">Save changes</button>
      </div>
    </div>
  `,
  props: ['targetSong'],
  data: () => ({
    localSong: null,
    cachedSrc: null,
    updateInterval: null,
    currentTime: 0
  }),
  mounted() {
    this.updateInterval = setInterval(() => {
      this.currentTime = this.$refs.player.currentTime;
    }, 16);
  },
  beforeDestroy() {
    clearInterval(this.updateInterval);
  },
  watch: {
    targetSong() {
      this.reloadSong();
    }
  },
  computed: {
    song() {
      if (!this.localSong) this.reloadSong();
      return this.localSong;
    },
    editingSrc() {
      let key = 'song-' + this.song.id;
      browser.storage.local.get(key).then(result => {
        this.cachedSrc = result[key];
      });
      return this.cachedSrc;
    },
    msTime() {
      return Math.floor(this.currentTime * 1000);
    },
    canSetEnd() {
      return this.msTime > this.song.metadata.loopStart;
    }
  },
  methods: {
    reloadSong() {
      this.localSong = JSON.parse(JSON.stringify(this.targetSong));
      console.log("New song -> ", this.song);
    },
    setLoopStart() {
      this.song.metadata.loop = true;
      this.song.metadata.loopStart = this.msTime;
    },
    setLoopEnd() {
      this.song.metadata.loop = true;
      this.song.metadata.loopLength = this.msTime - this.song.metadata.loopStart;
    },
    stopLooping() {
      this.song.metadata.loop = false;
      this.song.metadata.loopStart = 0;
      this.song.metadata.loopLength = 0;
    },
    saveChanges() {
      browser.storage.local.get('music').then(({ music }) => {
        let target = music.filter(song => song.id == this.song.id)[0];
        if (!target) {
          alert('Song not found?');
          return;
        }
        Object.assign(target, JSON.parse(JSON.stringify(this.song)));
        return browser.storage.local.set({ music });
      }).then(() => this.$emit('change'));
    }
  }
}

const app = new Vue({
  template: html`
    <div style="font-family: sans-serif">
      <h1 style="font-family: sans-serif; margin: 0px; font-size: 16pt;">
        Tetr.io+
      </h1>
      <div>
        <button @click="openImageChanger">Change skin</button>
        <button @click="resetSkin">Remove skin</button>
      </div>

      <fieldset>
        <legend>Current skin</legend>
        <img id="preview" :src="skinUrl" v-if="skinUrl">
        <span id="noSkin" v-else>No skin set</span>
      </fieldset>

      <button @click="openSfxEditor">Open sfx editor</button>
      <div>
        <input type="checkbox" v-model="sfxEnabled" />
        <label>Enable custom sfx (may break the game)</label>
      </div>
      <fieldset>
        <legend>Current sfx atlas</legend>
        <div v-if="!sfxEnabled">
          Custom sfx disabled
        </div>
        <audio :src="sfxAtlasSrc" v-else-if="sfxAtlasSrc" controls></audio>
        <div v-else>
          Custom sfx not set up
        </div>
      </fieldset>

      <fieldset v-if="editing">
        <legend>Audio Editor</legend>
        <audio-editor :targetSong="editing" @change="refreshSongs"/>
      </fieldset>

      <button @click="openMusicUploader">Add new music</button>
      <div>
        <input type="checkbox" v-model="musicEnabled" />
        <label>Enable custom music (may break the game)</label>
      </div>
      <div>
        <input type="checkbox" v-model="disableVanillaMusic" />
        <label>Disable built in music (may break the game)</label>
      </div>
      <div v-if="disableVanillaMusic">
        <strong>
          Missing songs may render the game unplayable.<br>
          Make sure to set a specific song or have at least one<br>
          'calm' song and one 'battle' song. If you see "Ae.ost[e]<br>
          is undefined" in your console, this setting is causing it!<br>
        </strong>
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
          <span style="font-family: monospace;">{{ song.filename }}</span>
          <button @click="editSong(song)">Edit</button>
          <button @click="deleteSong(song)">Delete</button>
        </div>
      </fieldset>
      <strong>Refresh your game after making any changes.</strong>
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
      sfxAtlasSrc: null,
      sfxEnabled: null
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
        width: 300,
        height: 50
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
      resetSkin.addEventListener('click', evt => {
        browser.storage.local.remove(['skin']).then(() => showCurrentSkin());
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
