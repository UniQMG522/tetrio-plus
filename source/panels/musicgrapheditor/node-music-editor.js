const html = arg => arg.join(''); // NOOP, for editor integration.

const music = [];
browser.storage.local.get('music').then(({ music: newMusic }) => {
  if (newMusic) music.push(...newMusic);
});

export default {
  template: html`
    <div class="section" v-if="node.type != 'root'">
      Select audio:
      <select class="node-audio-selector" v-model="node.audio">
        <option :value="null">None</option>
        <option v-for="song of music" :value="song.id">
          {{ song.filename }}
        </option>
      </select>
      <div v-if="music.length == 0">
        (Add music in the main tetrio+ menu)
      </div>
      <div v-if="node.audio != null">
        <div class="form-control">
          Volume <input
            type="range"
            v-model.number="node.effects.volume"
            step="0.01"
            min="0"
            max="1"
          />
          <span class="form-control-value-display">
            {{(node.effects.volume*100).toFixed(0)}}%
          </span>
        </div>
        <div class="form-control">
          Speed <input
            type="number"
            v-model.number="node.effects.speed"
            step="0.01"
            min="0"
            max="10"
          />x
          <span v-if="node.effects.speed != 1" class="form-control-value-display">
            (affects pitch)
          </span>
        </div>
      </div>
    </div>
  `,
  props: ['node'],
  data: () => ({ music })
}
