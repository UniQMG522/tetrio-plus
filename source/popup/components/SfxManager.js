import OptionToggle from './OptionToggle.js'
const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div>
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
    </div>
  `,
  data: () => ({ cachedSfxAtlasSrc: null }),
  components: { OptionToggle },
  computed: {
    sfxAtlasSrc() {
      browser.storage.local.get('customSounds').then(({ customSounds }) => {
        if (this.cachedSfxAtlasSrc != customSounds)
          this.cachedSfxAtlasSrc = customSounds;
      });
      return this.cachedSfxAtlasSrc;
    },
  },
  methods: {
    openSfxEditor() {
      browser.tabs.create({
        url: browser.extension.getURL('source/panels/sfxcomposer/index.html'),
        active: true
      });
    },
  }
}
