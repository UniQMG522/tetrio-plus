const html = arg => arg.join(''); // NOOP, for editor integration.
import TableView from './components/TableView.js';
import ListView from './components/ListView.js';

const app = new Vue({
  template: html`
    <div>
      <header>
        <button class="tab" v-for="itab of tabs" @click="tab = itab">
          {{ itab.name }}
        </button>
      </header>
      <keep-alive>
        <component
          :is="tab.component"
          :music="music"
          :builtin="builtin"
          @save="save"
          @deleteSong="deleteSong"
        />
      </keep-alive>
    </div>
  `,
  data: {
    tabs: [
      { name: 'List View', component: ListView },
      { name: 'Table View', component: TableView }
    ],
    tab: null,
    music: [],
    builtin: null,
    builtinError: null,
    deleteOnSave: [],
    saveTimeout: null
  },
  created() {
    this.tab = this.tabs[0];
  },
  async mounted() {
    let cfg = await browser.storage.local.get('music');
    this.music = cfg.music || [];

    try {

      const rootUrl = browser.electron ? 'tetrio-plus://tetrio-plus/' : 'https://tetr.io/';
      let url = rootUrl + 'js/tetrio.js?tetrio-plus-bypass=true';
      let tetriojs = await (await fetch(url)).text();

      // most of this is stolen from `music-tetriojs-filter.js`
      let regex = /(const \w+=)({"kuchu.+?(?:(?:{.+?},?)+(?:["A-Za-z\-:]+)?)+?})(,\w+=)({.+?})/;
      let match = regex.exec(tetriojs);
      if (!match) throw new Error(`no match`);

      let [$, musicVar, musicJson, musicpoolVar, musicpoolJson] = match;
      this.builtin = JSON.parse(this.sanitizeJson(musicJson));
    } catch(ex) {
      this.builtinError = ex;
    }
  },
  watch: {
    music: {
      deep: true,
      handler() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
          this.save();
          this.saveTimeout = null;
        }, 250);
      }
    }
  },
  methods: {
    sanitizeJson(json) {
      return json
        .replace(/!0/g, 'true')
        .replace(/!1/g, 'false')
        .replace(
          /(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g,
          '$1"$3":'
        );
    },
    save() {
      return browser.storage.local.set({
        music: JSON.parse(JSON.stringify(this.music)) // de-Vue the object
      }).then(() => {
        return browser.storage.local.remove(this.deleteOnSave);
      }).then(() => {
        this.deleteOnSave.length = 0;
      }).catch(ex => {
        alert('Failed to save changes: ' + ex);
      })
    },
    deleteSong(song) {
      this.$emit('delete', song);
      let index = this.music.indexOf(song);
      this.music.splice(this.music.indexOf(song), 1);
      this.deleteOnSave.push('song-' + song.id);
    }
  }
})

app.$mount('#app');
window.app = app;
