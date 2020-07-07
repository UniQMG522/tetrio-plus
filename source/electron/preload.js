(() => {
  const manifest = require('../../desktop-manifest.js');
  const browser = require('./electron-browser-polyfill');
  const path = require('path');
  const fs = require('fs');

  const { ipcRenderer } = require('electron');

  document.addEventListener('keydown', evt => {
    if (evt.altKey && evt.key == 'F4')
      ipcRenderer.send('tetrio-plus-cmd', 'destroy everything');

    if (evt.ctrlKey && evt.key == 't')
      ipcRenderer.send('tetrio-plus-cmd', 'create tetrio plus window');

    if (evt.ctrlKey && (evt.key == 'r' || evt.key == 'F5'))
      ipcRenderer.send('tetrio-plus-cmd', 'super force reload');
  });

  // FIXME
  // Temporary stopgap until I find a decent workaround to the whole
  // service worker issue
  navigator.serviceWorker.getRegistrations().then(async regs => {
    if (regs.length > 0) {
      for (let reg of regs)
        await reg.unregister();
      window.location.reload();
    }
  });

  console.log("tetrio-plus preload script running");
  browser.storage.local.get('version').then(({ version }) => {
    console.log("Data version " + version)
  });
  document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOMContentLoaded - Loading content scripts")
    let scripts = manifest.browser_specific_settings.desktop_client.preload_scripts;
    for (let script of scripts) {
      console.log("js:", script);
      let src = fs.readFileSync(path.join(__dirname, '../..', script), 'utf8');
      try {
        eval(src);
      } catch(ex) {
        console.error("Error executing content script " + src + ": ", ex);
      }
    }

    let css = manifest.browser_specific_settings.desktop_client.inject_css;
    for (let style of css) {
      console.log("css:", style);
      let src = fs.readFileSync(path.join(__dirname, '../..', style), 'utf8');
      let styleTag = document.createElement('style');
      styleTag.textContent = src;
      document.head.appendChild(styleTag);
    }
  });

  delete window.browser;

  class AutoCorsImage extends Image {
    constructor(...args) {
      super(...args);
      this.crossOrigin = "anonymous";
    }
  }
  window.Image = AutoCorsImage;
})();
