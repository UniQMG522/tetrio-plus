const html = arg => arg.join(''); // NOOP, for editor integration.

/**
 * This is a storage object shared among all instances of
 * OptionToggle and used to cache respones from the storage
 * object reactively.
 */
const cacheStorage = {};

/**
 * A watcher that ensures a value is set reactively
 * __ob__ is an interval vue value thats set on
 * objects made reactive.
 */
const ensureReactive = {
  immediate: true,
  handler(val) {
    this.$set(this.cache, val, this.cache[val]);
  }
};

export default {
  template: html`
    <div class="optionToggle" @click="toggleValue">
      <div v-if="optionValue && mode == 'show'">
        <slot></slot>
      </div>
      <div v-else-if="!optionValue && mode == 'hide'">
        <slot></slot>
      </div>
      <div v-else-if="mode == 'toggle'">
        <input type="checkbox" v-model="optionValue" v-if="!disabled" />
        <input type="checkbox" value="false" v-else disabled />
        <slot></slot>
      </div>
    </div>
  `,
  props: {
    /**
     * What storage key to use
     */
    storageKey: String,
    /**
     * Mode determines what this toggle does:
     * - toggle: Shows a checkbox that toggles the value
     * - show: Shows the content if the value is true
     * - hide: Hides the content if the value is true
     */
    mode: {
      type: String,
      default: 'toggle'
    },
    /**
     * Checks another storage value to see if the checkbox should be disabled.
     * Toggle mode only.
     */
    enabledIfKey: {
      type: String,
      default: ""
    },
    /**
     * Inverts the enabled status of the checkbox based on enabledIfKey
     */
    invertEnabled: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    cache: cacheStorage
  }),
  watch: {
    storageKey: ensureReactive,
    enabledIfKey: ensureReactive
  },
  methods: {
    toggleValue() {
      if (this.disabled) return;
      if (this.mode != 'toggle') return;
      this.optionValue = !this.optionValue;
    }
  },
  computed: {
    optionValue: {
      get() {
        browser.storage.local.get(this.storageKey).then(result => {
          if (this.cache[this.storageKey] != result[this.storageKey])
            this.cache[this.storageKey] = result[this.storageKey];
        });
        return this.cache[this.storageKey];
      },
      set(val) {
        browser.storage.local.set({ [this.storageKey]: val }).then(() => {
          this.cache[this.storageKey] = val;
        });
      }
    },
    disabled() {
      if (!this.enabledIfKey) return false;
      browser.storage.local.get(this.enabledIfKey).then(result => {
        this.cache[this.enabledIfKey] = result[this.enabledIfKey];
      });
      let value = this.cache[this.enabledIfKey];
      return this.invertEnabled ? !!value : !value;
    }
  }
}
