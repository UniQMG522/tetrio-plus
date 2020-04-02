const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <img class="custom-background" :src="src"></img>
  `,
  props: ['background'],
  data: () => ({
    src: null
  }),
  watch: {
    'background.id': {
      immediate: true,
      handler(val) {
        let key = 'background-' + val;
        browser.storage.local.get(key).then(result => {
          this.src = result[key];
        });
      }
    }
  }
}
