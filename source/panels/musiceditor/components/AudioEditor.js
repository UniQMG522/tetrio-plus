const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div class="audioeditor" v-if="!song">
      Pick a song!
    </div>
    <div class="audioeditor" v-else>
      <button class="finish" @click="$emit('done')">×</button>
      <audio ref="player" :src="editingSrc" controls></audio>
      <div class="timer" style="font-family: monospace;">
        Current time: {{ msTime }}ms
      </div>
      <div class="control-group">
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
      <div class="option-pairs-group">
        <div class="option-pair">
          <label @click="song.metadata.loop = !song.metadata.loop">
            Loop enabled
          </label>
          <input type="checkbox" v-model.boolean="song.metadata.loop"/>
        </div>
        <div class="option-pair">
          <label>Loop start (ms)</label>
          <input type="number" v-model.number="song.metadata.loopStart"></input>
        </div>
        <div class="option-pair">
          <label>Loop length (ms)</label>
          <input type="number" v-model.number="song.metadata.loopLength"></input>
        </div>
        <div class="option-pair" title="The name of the song">
          <label>Name</label>
          <input type="text" v-model="song.metadata.name"></input>
        </div>
        <div class="option-pair" title="The japanese name of the song">
          <label>Name (jp)</label>
          <input type="text" v-model="song.metadata.jpname"></input>
        </div>
        <div class="option-pair" title="The name of the song artist">
          <label>Artist</label>
          <input type="text" v-model="song.metadata.artist"></input>
        </div>
        <div class="option-pair" title="The japanese name of the song artist">
          <label>Artist (jp)</label>
          <input type="text" v-model="song.metadata.jpartist"></input>
        </div>
        <div class="option-pair" title="The genre determines where the song will play">
          <label>Genre</label>
          <select v-model="song.metadata.genre">
            <option value="CALM">Calm</option>
            <option value="BATTLE">Battle</option>
            <option value="INTERFACE">Interface</option>
            <option value="OVERRIDE">Override</option>
            <option value="DISABLED">Disabled/Music graph only</option>
          </select>
        </div>
        <div class="option-pair" v-if="song.metadata.genre == 'OVERRIDE'">
          <label>Override</label>
          <select v-model="song.override">
            <option value="null">Nothing</option>
            <option :value="key" v-for="[key, song] of Object.entries(builtin)">
              {{ song.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
  `,
  props: ['song', 'builtin'],
  data: () => ({
    cachedSrc: null,
    updateInterval: null,
    currentTime: 0
  }),
  mounted() {
    this.updateInterval = setInterval(() => {
      if (!this.$refs.player) return;
      this.currentTime = this.$refs.player.currentTime;
    }, 16);
  },
  beforeDestroy() {
    clearInterval(this.updateInterval);
  },
  computed: {
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
    }
  }
}
