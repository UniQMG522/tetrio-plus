import OptionToggle from './components/OptionToggle.js'
import ThemeManager from './components/ThemeManager.js';
import SkinChanger from './components/SkinChanger.js';
import SfxManager from './components/SfxManager.js';
import MusicManager from './components/MusicManager.js';
import BackgroundManager from './components/BackgroundManager.js';
const html = arg => arg.join(''); // NOOP, for editor integration.

const app = new Vue({
  template: html`
    <div id="app">
      <h1>Tetr.io+</h1>
      <hr>

      <skin-changer /><hr>
      <sfx-manager /><hr>
      <music-manager /><hr>
      <background-manager /><hr>

      <fieldset>
        <legend>Miscellaneous options</legend>
        <div title="LARGE O SPEEN TWO MANY TIMES">
          <option-toggle storageKey="enableSpeens">
            Enable april fools text (may break the game)
          </option-toggle>
        </div>
        <div title="Shows what keys are pressed, for streaming or recording. Works on replays too!">
          <option-toggle storageKey="enableOSD">
            Enable key OSD (may break the game)
          </option-toggle>
        </div>
        <div title="Changes the look of Tetr.io+ based on your browser theme. May look awful with some themes.">
          <theme-manager />
        </div>
        <div>
          <button @click="openSettingsIO" title="Opens the settings import/export dialog">
            Import/export settings
          </button>
        </div>

      </fieldset>

      <strong>Hard refresh (<kbd>ctrl-F5</kbd>) Tetrio after making changes.</strong><br>
      <a href="https://gitlab.com/UniQMG/tetrio-plus">Source code and readme</a>
    </div>
  `,
  components: {
    OptionToggle,
    ThemeManager,
    SkinChanger,
    SfxManager,
    MusicManager,
    BackgroundManager
  },
  data: {
  },
  computed: {
  },
  methods: {
    openSettingsIO() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL(
          'source/panels/settingsImportExport/index.html'
        ),
        width: 600,
        height: 285
      });
    }
  }
});

app.$mount('#app');
