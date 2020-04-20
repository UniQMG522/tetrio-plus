const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div>
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
    </div>
  `,
  data: () => ({ cachedSkin: null }),
  computed: {
    skinUrl() {
      browser.storage.local.get('skin').then(({ skin: newSkin }) => {
        if (newSkin != this.cachedSkin) this.cachedSkin = newSkin;
      });
      if (!this.cachedSkin) return false;
      return 'data:image/svg+xml;base64,' + btoa(this.cachedSkin);
    }
  },
  methods: {
    openImageChanger() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL('source/panels/skinpicker/index.html'),
        width: 600,
        height: 285
      });
    },
    resetSkin() {
      browser.storage.local.remove(['skin']).then(() => this.cachedSkin = null);
    }
  }
}
