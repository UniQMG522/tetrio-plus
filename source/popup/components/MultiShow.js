import cacheStorage from './SharedCache.js';
const html = arg => arg.join(''); // NOOP, for editor integration.


/**
 * MultiShow is a simplified version of OptionToggle that supports multiple keys
 * but is read-only. They share the same cache.
 */
export default {
  template: html`
    <div class="optionToggle" :style="style">
      <slot v-if="show"></slot>
    </div>
  `,
  props: {
    inline: {
      type: Boolean,
      default: false
    },
    // What storage keys to use
    storageKeys: {
      type: Array
    },
    // Whether to AND or OR the storage key values
    mode: {
      type: String,
      default: 'OR'
    }
  },
  data: () => ({
    cache: cacheStorage
  }),
  watch: {
    storageKeys: {
      immediate: true,
      handler(keys) {
        for (let key of keys)
          this.$set(this.cache, key, this.cache[key]);
      }
    }
  },
  computed: {
    style() {
      if (this.inline)
        return { display: 'inline' };
      return {};
    },
    show() {
      browser.storage.local.get(this.storageKeys).then(result => {
        for (let key of this.storageKeys)
          if (this.cache[key] != result[key])
            this.$set(this.cache, key, result[key]);
      });

      let values = this.storageKeys.map(key => !!this.cache[key]);
      if (values.length == 1) return values[0];
      return values.reduce((a,b) => this.mode == 'OR' ? (a || b) : (a && b));
    }
  }
}
