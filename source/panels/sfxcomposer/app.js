const html = arg => arg.join(''); // NOOP, for editor integration.

const sampleRate = 44100;
const channels = 2;
const quality = 0.5;

let decoderCtx = new OfflineAudioContext({
  numberOfChannels: channels,
  length: sampleRate * 1,
  sampleRate: sampleRate
});

const app = new Vue({
  template: html`
    <!-- Error screen -->
    <div v-if="error">
      <h1>Error</h1>
      <pre>{{ error }}</pre>
      Try updating your plugin
    </div>

    <!-- Preload -->
    <div v-else-if="loading">
      <em>Please wait...</em>
    </div>

    <!-- Pre-decode -->
    <div v-else-if="!decodeStarted">
      <div v-if="editExisting">
        Starting from current configuration.
        Repeatedly editing your current configuration may degrade audio
        quality. It's recommended that you start fresh and re-upload all
        custom sound effects once you're satisfied with them.<br>
        <button @click="editExisting = false">Start fresh</button><br>
      </div>
      <div v-else>
        Starting from default configuration. This will overwrite any existing
        sound effects you have configured.<br>
        <button @click="editExisting = true" v-if="hasExisting">
          Edit existing configuration
        </button>
        <button disabled v-else>
          No existing configuration
        </button>
      </div>
      <hr>
      <button @click="decode()">Decode sfx atlas</button><br>
    </div>

    <!-- Editor -->
    <div v-else>
      <fieldset>
        <legend>sfx/tetrio.ogg</legend>
        <audio src="http://tetr.io/sfx/tetrio.ogg" controls></audio>
      </fieldset>
      <div v-if="decoding">
        Decoding: {{ decodeStatus }}...<br>
      </div>
      <div v-else-if="encoding">
        Encoding new sfx file...
      </div>
      <div v-else>
        <fieldset>
          <legend>Save changes</legend>
          <button @click="save">Re-encode and save changes</button><br>
          This may freeze your browser for a bit.
          <div v-if="encodeResult">
            Encode completed. Result:<br>
            <audio :src="encodeResult" controls></audio>
          </div>
        </fieldset>
        <fieldset>
          <legend>Replace multiple by filename</legend>
          <em>sfx name must match file name without extension.</em><br>
          <input type="file" @change="replaceMultiple($event)" accept="audio/*" multiple/>
        </fieldset>
      </div>

      <fieldset v-for="sprite of sprites">
        <legend>{{ sprite.name }}</legend>
        <div v-if="sprite.error" :title="sprite.error">
          Encountered an error while encoding this sprite.
          This sprite must be replaced or else it will be empty.<br>
          <button @click="sprite.showError = !sprite.showError">
            Show/hide
          </button>
          <pre v-if="sprite.showError">{{ sprite.error }}</pre>
        </div>
        <button @click="play(sprite)">Play</button>
        <span v-if="sprite.modified">
          ( Modified,
            Duration: <code>{{ sprite.duration.toFixed(3) }}s</code>
          )
        </span>
        <span v-else>
          (
            Duration: <code>{{ sprite.duration.toFixed(3) }}s</code>.
            Offset: <code>{{ sprite.offset.toFixed(3) }}s</code>
          )
        </span>

        <br>

        Replace:
        <input type="file" @change="replace($event, sprite)" accept="audio/*"/>
      </fieldset>
    </div>
  `,
  data: {
    error: null,

    loading: true,
    hasExisting: false,
    editExisting: false,

    decoding: false,
    decodeStarted: false,
    decodeStatus: "",

    encoding: false,
    encodeResult: null,

    audioContext: null,

    sprites: [],
  },
  async mounted() {
    let { customSounds } = await browser.storage.local.get('customSounds');
    this.hasExisting = !!customSounds;
    this.editExisting = !!customSounds;
    this.loading = false;

    this.audioContext = new AudioContext();
  },
  methods: {
    play(sprite) {
      let source = this.audioContext.createBufferSource();
      source.connect(this.audioContext.destination);
      source.buffer = sprite.buffer;
      source.start();
    },

    async save() {
      this.encoding = true;
      let encoder = new OggVorbisEncoder(sampleRate, channels, quality);

      let atlas = {};
      let currentOffset = 0;
      for (let { name, buffer } of this.sprites) {
        let duration = buffer.duration * 1000;
        let offset = currentOffset;
        currentOffset += duration;

        atlas[name] = [offset, duration];
        encoder.encode([
          buffer.getChannelData(0),
          buffer.numberOfChannels >= 2
            ? buffer.getChannelData(1) // use 2nd channel if stereo
            : buffer.getChannelData(0) // duplicate 1st channel if mono
        ]);
      }

      let blob = encoder.finish();
      let dataUrl = await new Promise(res => {
        let blobReader = new FileReader();
        blobReader.onload = evt => res(blobReader.result)
        blobReader.readAsDataURL(blob);
      });

      browser.storage.local.set({
        customSounds: dataUrl,
        customSoundAtlas: atlas
      });
      this.encodeResult = dataUrl;
      this.encoding = false;
    },

    async replace(evt, sprite) {
      let file = evt.target.files[0];
      if (!file) return;

      let reader = new FileReader();
      await new Promise(res => {
        reader.addEventListener('load', res);
        reader.readAsArrayBuffer(file);
      });

      let sfxBuffer = await decoderCtx.decodeAudioData(reader.result);
      sprite.buffer = sfxBuffer;
      sprite.duration = sprite.buffer.duration;
      sprite.offset = -1;
      sprite.modified = true;

      console.log("Sprite buffer replaced", sprite.buffer);

      // reset the handler
      evt.target.type = '';
      evt.target.type = 'file';
    },

    async replaceMultiple(evt) {
      let replaced = [];
      for (let file of evt.target.files) {
        let noExt = file.name.split('.').slice(0, -1).join('.');
        let sprite = this.sprites.filter(sprite => {
          return sprite.name == noExt;
        })[0];

        if (!sprite) {
          replaced.push(`FAILED: Unknown sound effect ${noExt}`)
          continue;
        }

        let reader = new FileReader();
        await new Promise(res => {
          reader.addEventListener('load', res);
          reader.readAsArrayBuffer(file);
        });

        let sfxBuffer = await decoderCtx.decodeAudioData(reader.result);
        sprite.buffer = sfxBuffer;
        sprite.duration = sprite.buffer.duration;
        sprite.offset = -1;
        sprite.modified = true;

        replaced.push(`Success: ${noExt}`)
      }
      alert(replaced.join('\n'));
      // reset the handler
      evt.target.type = '';
      evt.target.type = 'file';
    },

    async decode() {
      try {
        const rootUrl = browser.electron ? 'tetrio-plus://' : 'https://tetr.io/';

        this.decodeStarted = true;
        this.decoding = true;
        this.decodeStatus = "Starting";

        // Set sfx enabled flag temporarily, to fetch the appropriate content.
        let { sfxEnabled } = await browser.storage.local.get('sfxEnabled');
        await browser.storage.local.set({ sfxEnabled: this.editExisting });

        // Fetch sfx atlas json
        this.decodeStatus = "Fetching sound atlas (js/tetrio.js)";
        let srcRequest = await fetch(rootUrl + 'js/tetrio.js');
        let src = await srcRequest.text();
        let regex = /TETRIO_SE_SHEET\s*=\s*(?:({[^}]+})|.+?atob\("([A-Za-z0-9+/=]+)\"\))/;
        let match = regex.exec(src);
        if (!match) {
          this.error = 'Failed to find sound atlas.';
          return;
        }

        let json;
        if (match[1]) {
          json = match[1]
            // Replace quotes
            .replace(/'/g, `"`)
            // Quote unquoted keys
            .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":');
        } else if (match[2]) {
          console.log("Loading B64", match[2]);
          json = String.fromCharCode(
            ...new Uint16Array(new Uint8Array(
              [...atob(match[2])].map(v => v.charCodeAt(0))
            ).buffer)
          );
          console.log("Loaded json", json);
        }
        let atlas = JSON.parse(json);

        // Fetch sfx audio file
        this.decodeStatus = "Fetching sound buffer (sfx/tetrio.ogg)";
        let request = await fetch(rootUrl + 'sfx/tetrio.ogg');
        let encodedSfxBuffer = await request.arrayBuffer();

        // Reset the sfx enabled flag since we're now done fetching data
        await browser.storage.local.set({ sfxEnabled });

        this.decodeStatus = "Decoding sound buffer";
        let sfxBuffer = await decoderCtx.decodeAudioData(encodedSfxBuffer);

        for (let key of Object.keys(atlas)) {
          let [offset, duration] = atlas[key];
          // Convert milliseconds to seconds
          offset /= 1000; duration /= 1000;

          const ctx = new OfflineAudioContext({
            numberOfChannels: channels,
            length: sampleRate * duration,
            sampleRate: sampleRate
          });

          let source = ctx.createBufferSource();
          source.buffer = sfxBuffer;
          source.connect(ctx.destination);
          source.start(0, offset, duration);
          let audioBuffer = await ctx.startRendering();

          this.sprites.push({
            name: key,
            buffer: audioBuffer,
            offset,
            duration,
            modified: false
          });
        }

        this.decodeStatus = null;
        this.decoding = false;
      } catch(ex) {
        this.error = ex;
      }
    }
  }
});

app.$mount('#app');
