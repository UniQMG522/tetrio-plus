const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div class="component-wrapper">
      <div class="control-group">
        <button @click="openImageChanger" title="Opens the skin changer window">
          Change skin
        </button>
        <button @click="resetSkin" title="Removes the existing custom skin">
          Remove skin
        </button>
      </div>

      <div class="preview-group">
        <img
          title="This is the current block skin you are using."
          class="skin"
          :src="skinUrl"
          v-if="skinUrl">
        <div class="no-skin" v-else>
          No skin set
        </div>
      </div>
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
      browser.storage.local.remove(['skin', 'skinPng']).then(() => {
        this.cachedSkin = null;
      });
    }
  }
}
