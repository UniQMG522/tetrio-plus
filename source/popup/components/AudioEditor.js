const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div>
      <div>
        <audio ref="player" :src="editingSrc" controls></audio>
      </div>
      <div style="font-family: monospace;">
        Current time: {{ msTime }}ms
      </div>
      <div>
        <button
          @click="setLoopStart()"
          title="Sets the loop start point to the current position of the player">
          Set loop start
        </button>
        <button
          @click="setLoopEnd()"
          :disabled="!canSetEnd"
          title="Sets the loop end point to the current position of the player">
          Set loop end
        </button>
      </div>
      <div>
        <label @click="song.metadata.loop = !song.metadata.loop">
          Loop enabled
        </label>
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
        These still apply when looping is off, once you reach<br>
        {{ song.metadata.loopStart + song.metadata.loopLength }}ms your song
        will stop playing.
      </strong>
      <div title="The name of the song">
        <label>Name</label>
        <input type="text" v-model="song.metadata.name"></input>
      </div>
      <div title="The japanese name of the song">
        <label>Name (jp)</label>
        <input type="text" v-model="song.metadata.jpname"></input>
      </div>
      <div title="The name of the song artist">
        <label>Artist</label>
        <input type="text" v-model="song.metadata.artist"></input>
      </div>
      <div title="The japanese name of the song artist">
        <label>Artist (jp)</label>
        <input type="text" v-model="song.metadata.jpartist"></input>
      </div>
      <div title="The genre determines where the song will play">
        <label>Genre</label>
        <select v-model="song.metadata.genre">
          <option value="CALM">Calm</option>
          <option value="BATTLE">Battle</option>
          <option value="INTERFACE">Interface</option>
          <option value="DISABLED">Disabled/Music graph only</option>
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
