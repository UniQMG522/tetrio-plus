const html = arg => arg.join(''); // NOOP, for editor integration.

const app = new Vue({
  template: html`
    <div class="app">
      <div class="tools">
        <template v-for="itool of tools">
          <div
            @mousemove="clicking && (tool = itool)"
            @click="tool = itool"
            :class="{
              mino: true,
              tool: true,
              ['mino-' + itool]: true,
              ['active-tool']: tool == itool
            }"
          ></div>
          {{ itool }}<br>
        </template>
      </div>
      <div class="editor">
        <div v-for="row of map" class="row">
          <div
            v-for="el of row"
            class="mino"
            :class="'mino-' + el.mino"
            @mousemove="edit(el)"
            @click="el.mino = tool"
          ></div>
        </div>
      </div>
      <div>
        Paste this into the 'Custom Map String' field after editing and make
        sure to check the 'Use Custom Map' checkbox.<br>
        <textarea
          class="map-string"
          ref="mapstring"
          @input="loadMapString($event.target.value)"
        />
      </div>
    </div>
  `,
  data: {
    map: new Array(40).fill(0).map(el => new Array(10).fill(0).map(el => ({ mino: 'empty' }))),
    tools: ['i', 'o', 'l', 'j', 'z', 's', 't', 'empty', 'garbage'],
    tool: 'empty',
    removing: false,
    clicking: false,
    mapString: "",
    modified: false
  },
  watch: {
    mapString(val) {
      this.$refs.mapstring.value = val;
    }
  },
  methods: {
    startEditing() {
      this.clicking = true;
      this.modified = false;
    },
    endEditing() {
      this.clicking = false;
      if (this.modified) {
        this.recalculateMapString();
        this.modified = false;
      }
    },
    edit(elem) {
      if (!this.clicking) return;
      elem.mino = this.tool;
      this.modified = true;
    },
    recalculateMapString() {
      this.mapString = this.map.flatMap(row => {
        return row.map(el => {
          if (el.mino == 'empty') return '_';
          if (el.mino == 'garbage') return '#';
          return el.mino;
        });
      }).join('');
    },
    loadMapString(mapString) {
      let x = 0, y = 0;

      for (let char of mapString) {
        if (char == '_') this.map[y][x].mino = 'empty';
        else if (char == '#') this.map[y][x].mino = 'garbage';
        else if (char == 'i') this.map[y][x].mino = 'i';
        else if (char == 'l') this.map[y][x].mino = 'l';
        else if (char == 'j') this.map[y][x].mino = 'j';
        else if (char == 's') this.map[y][x].mino = 's';
        else if (char == 'z') this.map[y][x].mino = 'z';
        else if (char == 'o') this.map[y][x].mino = 'o';
        else if (char == 't') this.map[y][x].mino = 't';
        else continue;
        x++;
        if (x >= 10) {
          x = 0;
          y++;
        }
        if (y >= 40)
          return;
      }
    }
  }
});

document.addEventListener('mousedown', () => app.startEditing());
document.addEventListener('mouseup', () => app.endEditing());
app.recalculateMapString();
let match = /map=([^&]+)/.exec(window.location.search);
if (match) {
  app.loadMapString(decodeURIComponent(match[1]));
  app.recalculateMapString();
}
app.$mount('#app');
