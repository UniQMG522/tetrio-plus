const html = arg => arg.join(''); // NOOP, for editor integration.
import filehelper from './filehelper.js';

import * as tetriosvg from './loaders/tetrio-svg.js';
import * as tetrioraster from './loaders/tetrio-raster.js';
import * as tetrioanim from './loaders/tetrio-animated.js';
import * as jstrisraster from './loaders/jstris-raster.js';
import * as jstrisanim from './loaders/jstris-animated.js';
const loaders = [
  tetriosvg, tetrioraster, tetrioanim, jstrisraster, jstrisanim
].map(e => ({...e}));

const app = new Vue({
  template: html`
    <div>
      <div>
        <fieldset>
          <legend>Loader</legend>
          <div>
            <input type="radio" :value="null" v-model="loader"/>
            Automatic
          </div>

          <div v-for="i of loaders">
            <input type="radio" :value="i" v-model="loader"/>
            {{ i.name }}: {{ i.desc }}
          </div>
        </fieldset>
      </div>
      <fieldset v-if="!loader || extrainputs.delay">
        <legend>Animated skin options</legend>
        <div>
          Delay (frames):
          <input type="number" v-model.number="delay" min="1">
        </div>
        <div>
          Loop start:
          <input type="number" v-model.number="loopStart" min="0">
        </div>
        <div>
          <input type="checkbox" v-model="synchronized" />
          Synchronized
        </div>
        <div>
          <input type="checkbox" v-model="combine" />
          Combine frames
        </div>
      </fieldset>
      <fieldset>
        <legend>Upload</legend>
        <div>
          <input ref="files" type="file" accept="image/*" multiple />
        </div>
      </fieldset>
      <button @click="load">Set skin</button>
    </div>
  `,
  data: {
    loader: null,
    delay: 30,
    loopStart: 0,
    synchronized: true,
    combine: true,
    loaders: loaders
  },
  computed: {
    extrainputs() {
      if (!this.loader) return {};
      return this.loader.extrainputs.reduce((obj, input) => {
        obj[input] = true;
        return obj;
      }, {});
    }
  },
  methods: {
    async load() {
      let files = await filehelper(this.$refs.files);
      for (let file of files) {
        file.image = new Image();
        file.image.src = file.data;
        file.image.onerror = () => alert('Failed to load image');
        await new Promise(res => file.image.onload = res);
      }

      console.log("Files", files);
      if (!this.loader) {
        for (let file of files) {
          let aspect = file.image.width / file.image.height;
          if (aspect == 12.4 || aspect == 9) continue;
          alert(
            `Unknown aspect ratio ${aspect}. ` +
            'Tetrio format is 12.4, Jstris format is 9. This skin isn\'t ' +
            'formatted correctly, but choosing the closest option may work.'
          );
          return;
        }
      }

      if (!this.loader) {
        let loaders = this.loaders.filter(loader => loader.test(files));
        console.log("Applicable loaders", loaders.map(loader => loader.name));
        if (loaders.length !== 1) {
          alert(
            'Unable to determine format. This is probably a bug, but you can ' +
            'try setting the loader manually.'
          );
          return;
        }
        await loaders[0].load(files);
      } else {
        await this.loader.load(files);
      }
      alert('Skin set!');
    }
  }
});
app.$mount('#app');
window.app = app;
