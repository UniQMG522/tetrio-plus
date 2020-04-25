import OptionToggle from './OptionToggle.js';
import BackgroundEmbed from './BackgroundEmbed.js';
const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div>
      <button @click="openBgUploader" title="Opens the BG uploader window">
        Add local custom backgrounds
      </button>
      <div>
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

        <option-toggle storageKey="animatedBgEnabled" enabledIfKey="bgEnabled">
          Enable animated background (may break the game)
        </option-toggle>
        <option-toggle storageKey="animatedBgEnabled" mode="show">
          <option-toggle storageKey="bgEnabled" mode="show">
            <div class="extendedWarningText">
              <b>This feature is experimental and may be changed or removed.</b>
              Custom animated backgrounds are implemented differently from
              regular backgrounds, and you can't have more than one at a time.
              Animated backgrounds are incompatible with normal backgrounds,
              and Tetr.io+ custom backgrounds will not load while an animated
              background is enabled.
            </div>
          </option-toggle>
        </option-toggle>

        <fieldset>
          <legend>Custom backgrounds</legend>
          <option-toggle storageKey="bgEnabled" mode="hide">
            Custom backgrounds disabled
          </option-toggle>
          <option-toggle storageKey="bgEnabled" mode="show">
            <div v-if="backgrounds.length == 0">
              No custom backgrounds
            </div>
            <div class="background" v-else v-for="bg of backgrounds">
              <button @click="deleteBackground(bg)" title="Removes this background">
                Delete
              </button>
              <button @click="bg.preview = !bg.preview" title="Shows this background">
                Preview
              </button>
              <span class="bgName">
                {{ bg.background.filename }}
                <em v-if="bg.animated">animated</em>
              </span>
              <div v-if="bg.preview">
                <background-embed :background="bg.background"></background-embed>
              </div>
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
  mounted() {
    this.reloadBackgrounds();
  },
  computed: {
    backgrounds() {
      if (!this.cachedBackgrounds) return [];
      return this.cachedBackgrounds;
    }
  },
  methods: {
    togglePreview(bg) {

    },
    reloadBackgrounds() {
      return browser.storage.local.get([
        'backgrounds',
        'animatedBackground'
      ]).then(res => {
        this.cachedBackgrounds = [];
        if (res.backgrounds) {
          this.cachedBackgrounds.push(...res.backgrounds.map(background => ({
            background: background,
            animated: false,
            preview: false
          })));
        }
        if (res.animatedBackground) {
          this.cachedBackgrounds.push({
            background: res.animatedBackground,
            animated: true,
            preview: false
          });
        }
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
    deleteBackground(toDelete) {
      let delId = toDelete.background.id;

      browser.storage.local.get([
        'backgrounds',
        'animatedBackground'
      ]).then(({ backgrounds, animatedBackground }) => {
        if ((animatedBackground || {}).id == delId) {
          browser.storage.local.remove('animatedBackground');
          browser.storage.local.remove('background-' + animatedBackground.id)
        }

        backgrounds = (backgrounds || []).filter(bg => {
          if (bg.id == delId) {
            browser.storage.local.remove('background-' + bg.id);
            return false;
          }
          return true;
        });
        return browser.storage.local.set({ backgrounds });
      }).then(() => this.reloadBackgrounds());
    }
  }
}
