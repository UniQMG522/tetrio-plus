browser.runtime.onConnect.addListener(port => {
  console.log("New content script connection");
  port.onMessage.addListener(async (msg, sender) => {
    console.log(msg);
    switch (msg.type) {
      case 'openMapEditor':
        browser.tabs.create({
          url: browser.extension.getURL('source/panels/mapeditor/index.html') +
               '?map=' + encodeURIComponent(msg.map),
          active: true
        });
        break;

      case 'showPageAction':
        if (browser.pageAction)
          browser.pageAction.show(sender.sender.tab.id);
        break;

      case 'getInfoString':
        let manifestUri = browser.runtime.getURL('manifest.json');
        let manifest = await (await fetch(manifestUri)).json();
        let version = manifest.version;

        let config = await browser.storage.local.get([
          'bgEnabled',
          'musicEnabled',
          'animatedBgEnabled',
          'disableVanillaMusic',
          'enableMissingMusicPatch',
          'enableSpeens',
          'sfxEnabled',
          'skin',
          'enableOSD',
          'enableTouchControls'
        ]);

        let features = [];

        if (config.skin)
          features.push('custom block skin');

        if (config.musicEnabled) {
          features.push('custom music');

          if (config.disableVanillaMusic)
            features.push('disable built-in music');

          if (config.enableMissingMusicPatch)
            features.push('missing music patch');
        }

        if (config.sfxEnabled)
          features.push('custom sfx');

        if (config.bgEnabled)
          features.push('backgrounds');

        if (config.animatedBgEnabled)
          features.push('animated backgrounds');

        if (config.enableOSD)
          features.push('key OSD');

        if (config.enableTouchControls)
          features.push('enableTouchControls');

        let featureString = features.length > 0
          ? features.join(', ')
          : 'none';

        let { name } = await browser.runtime.getBrowserInfo();

        port.postMessage({
          type: 'getInfoStringResult',
          value: `Tetr.io+ v${version} on ${name}. Features enabled: ${featureString}`
        });
        break;

      default:
        throw new Error('Unknown message type ' + msg.type);
    }
  });
});
