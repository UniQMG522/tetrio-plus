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

        let strings = {
          'bgEnabled': 'custom block skin',
          'animatedBgEnabled': 'animated backgrounds',
          'transparentBgEnabled': 'transparent background',
          'opaqueTransparentBackground': 'opaque background layer',
          'musicEnabled': 'custom music',
          'musicGraphEnabled': 'music graph',
          'disableVanillaMusic': 'disable built-in music',
          'enableMissingMusicPatch': 'missing music patch',
          'sfxEnabled': 'custom sfx',
          'skin': 'custom block skins',
          'enableCustomMaps': 'custom maps',
          'enableOSD': 'key display',
          'enableTouchControls': 'touch controls',
          'bypassBootstrapper': 'bootstrap.js bypass',
          'openDevtoolsOnStart': 'automatic devtools',
          'debugBreakTheGame': 'DEBUG: INTENTIONALLY BREAK THE GAME'
        }

        let config = await browser.storage.local.get(Object.keys(strings));
        let features = [];

        for (let [key, str] of Object.entries(strings))
          if (config[key]) features.push(str);

        console.log(config, Object.entries(strings), features);

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
