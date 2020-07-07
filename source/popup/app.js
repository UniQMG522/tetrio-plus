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
      <h1>
        TETR.IO PLUS
        <span class="version">
          v{{version}} | <a
            class="wiki"
            href="https://gitlab.com/UniQMG/tetrio-plus/wikis"
            @click="openSource($event)"
          >Wiki</a>
        </span>
      </h1>

      <fieldset class="section">
        <legend>Skins</legend>
        <skin-changer />
      </fieldset>
      <fieldset class="section">
        <legend>Sound effects</legend>
        <sfx-manager />
      </fieldset>
      <fieldset class="section">
        <legend>Music</legend>
        <music-manager />
      </fieldset>
      <fieldset class="section">
        <legend>Backgrounds</legend>
        <background-manager />
      </fieldset>
      <fieldset class="section">
        <legend>Miscellaneous</legend>
        <div class="option-group">
          <option-toggle storageKey="enableCustomMaps">
            <span :title="(
              'Enables using custom maps for singleplayer. Open the editor ' +
              'and set the map string under solo -> custom -> meta.'
            )">
              Enable custom maps
            </span>
          </option-toggle>
          <option-toggle storageKey="enableOSD">
            <span :title="(
              'Shows what keys are pressed, for streaming or recording. ' +
              'Works on replays too!'
            )">
              Enable key OSD
            </span>
          </option-toggle>
          <option-toggle storageKey="enableTouchControls">
            <span :title="(
              'Allows you to control the game using touch inputs. Inputs ' +
              'are mapped to two virtual joysticks on each side of the page. ' +
              'Left up = harddrop, left down = softdrop, left left = move left ' +
              'left right = move right. right up = 180 spin, right left = ccw ' +
              'spin, right right = cw spin, right down = hold.'
            )">
              Enable touch controls
            </span>
          </option-toggle>
          <option-toggle storageKey="bypassBootstrapper">
            <span :title="(
              'Disables integrity checks on the tetrio.js file and loads ' +
              'it directly. Fixes stacktraces but may make the anticheat ' +
              'angery.'
            )">
              Bypass bootstrapper
            </span>
          </option-toggle>
          <option-toggle storageKey="openDevtoolsOnStart" v-if="isElectron">
            <span :title="(
              'Opens the developer tools as soon as the game launches. ' +
              'Works even if you can\\'t open them via hotkey'
            )">
              Open devtools automatically
            </span>
          </option-toggle>
          <theme-manager v-if="!isElectron" />
        </div>
        <div class="control-group">
          <button @click="openSettingsIO" title="Opens the settings manager">
            Manage data
          </button>
        </div>
      </fieldset>
      <fieldset class="section legendless">
        <strong>Hard refresh (<kbd>ctrl-F5</kbd>) Tetrio after making changes.</strong><br>
        <a href="https://gitlab.com/UniQMG/tetrio-plus" @click="openSource($event)">
          Source code and readme
        </a>
      </fieldset>
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
    isElectron() {
      return !!browser.electron;
    },
    version() {
      return browser.runtime.getManifest().version;
    }
  },
  methods: {
    openSettingsIO() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL(
          'source/panels/settingsImportExport/index.html'
        ),
        width: 600,
        height: 520
      });
    },
    openSource(evt) {
      if (this.isElectron) {
        evt.preventDefault();
        openInBrowser(evt.target.href);
      }
    }
  }
});

app.$mount('#app');
