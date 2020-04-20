import OptionToggle from './OptionToggle.js';
import BackgroundEmbed from './BackgroundEmbed.js';
const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div>
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
    </div>
  `,
  data: () => ({
    cachedBackgrounds: null
  }),
  components: {
    BackgroundEmbed,
    OptionToggle
  },
  computed: {
    backgrounds() {
      browser.storage.local.get('backgrounds').then(({ backgrounds }) => {
        if (backgrounds != this.cachedBackgrounds)
          this.cachedBackgrounds = backgrounds;
      });
      if (!this.cachedBackgrounds) return [];
      return this.cachedBackgrounds;
    }
  },
  methods: {
    openBgUploader() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL('source/panels/bgpicker/index.html'),
        width: 600,
        height: 285
      });
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
        this.cachedBackgrounds = backgrounds;
      });
    }
  }
}
