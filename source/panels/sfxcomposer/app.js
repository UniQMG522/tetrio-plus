/new Howl\({\s*src:\s*'res\/se\.ogg',\s*sprite:\s*({[\S\s]+?})/;
const html = arg => arg.join(''); // NOOP, for editor integration.

const sampleRate = 44100;
const channels = 2;
const quality = 0.5;

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
      This may freeze your browser for a bit.
    </div>

    <!-- Editor -->
    <div v-else>
      <fieldset>
        <legend>res/se.ogg</legend>
        <audio src="http://tetr.io/res/se.ogg" controls></audio>
      </fieldset>
      <div v-if="decoding">
        Decoding <code>res/se.ogg</code>...<br>
      </div>
      <div v-else-if="encoding">
        Encoding new sfx file...
      </div>
      <div v-else>
        <button @click="save">Re-encode and save changes</button>
        <fieldset>
          <legend>Replace multiple by filename</legend>
          <em>sfx name must match file name without extension.</em><br>
          <input type="file" @change="replaceMultiple($event, sprite)" accept="audio/*" multiple/>
        </fieldset>
        <div v-if="encodeResult">
          Encode completed. Result:
          <audio :src="encodeResult" controls></audio>
        </div>
      </div>

      <fieldset v-for="sprite of sprites">
        <legend>{{ sprite.name }}</legend>
        <audio :src="sprite.src" controls></audio><br>
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
    encoding: false,
    encodeResult: null,

    sprites: [],
  },
  async mounted() {
    let { customSounds } = await browser.storage.local.get('customSounds');
    this.hasExisting = !!customSounds;
    this.editExisting = !!customSounds;
    this.loading = false;
  },
  methods: {
    async save() {
      this.encoding = true;
      let decoderCtx = new OfflineAudioContext({
        numberOfChannels: channels,
        length: sampleRate * 1,
        sampleRate: sampleRate
      });

      let encoder = new OggVorbisEncoder(sampleRate, channels, quality);

      let atlas = {};
      let currentOffset = 0;
      for (let { name, src } of this.sprites) {
        let encodedSfxBuffer = await (await fetch(src)).arrayBuffer();
        let sfxBuffer = await decoderCtx.decodeAudioData(encodedSfxBuffer);
        console.log(sfxBuffer);
        let duration = sfxBuffer.duration * 1000;
        let offset = currentOffset;
        currentOffset += duration;

        atlas[name] = [offset, duration];
        encoder.encode([
          sfxBuffer.getChannelData(0),
          encodedSfxBuffer.numberOfChannels >= 2
            ? sfxBuffer.getChannelData(1)
            : sfxBuffer.getChannelData(0)
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

    replace(evt, sprite) {
      let file = evt.target.files[0];
      if (!file) return;

      let reader = new FileReader();
      reader.addEventListener('load', () => {
        sprite.src = reader.result;
        // reset the handler
        evt.target.type = '';
        evt.target.type = 'file';
      });
      reader.readAsDataURL(file);
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
          reader.readAsDataURL(file);
        });
        sprite.src = reader.result;
        replaced.push(`Success: ${noExt}`)
      }
      alert(replaced.join('\n'));
      // reset the handler
      evt.target.type = '';
      evt.target.type = 'file';
    },

    async decode() {
      try {
        this.decodeStarted = true;
        this.decoding = true;

        // Set sfx enabled flag temporarily, to fetch the appropriate content.
        let { sfxEnabled } = await browser.storage.local.get('sfxEnabled');
        await browser.storage.local.set({ sfxEnabled: this.editExisting });

        // Fetch sfx atlas json
        let srcRequest = await fetch('https://tetr.io/js/tetrio.js');
        let src = await srcRequest.text();
        let regex = /new Howl\({\s*src:\s*["']res\/se\.ogg["'],\s*sprite:\s*({[\S\s]+?})/;
        let match = regex.exec(src);
        if (!match) {
          this.error = 'Failed to find sound atlas.';
          return;
        }
        let json = match[1]
          // Quote unquoted keys
          .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":');
        let atlas = JSON.parse(json);

        // Fetch sfx audio file
        let request = await fetch('https://tetr.io/res/se.ogg');
        let encodedSfxBuffer = await request.arrayBuffer();

        // Reset the sfx enabled flag since we're now done fetching data
        await browser.storage.local.set({ sfxEnabled });

        let decoderCtx = new OfflineAudioContext({
          numberOfChannels: channels,
          length: sampleRate * 1,
          sampleRate: sampleRate
        });
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

          const encoder = new OggVorbisEncoder(sampleRate, channels, quality);
          encoder.encode([
            audioBuffer.getChannelData(0),
            audioBuffer.getChannelData(1)
          ]);
          let blob = encoder.finish();

          this.sprites.push({
            name: key,
            src: URL.createObjectURL(blob)
          });
        }

        this.decoding = false;
      } catch(ex) {
        this.error = ex;
      }
    }
  }
});

app.$mount('#app');
