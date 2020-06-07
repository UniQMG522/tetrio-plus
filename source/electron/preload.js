(() => {
  const manifest = require('../../manifest.json');
  const browser = require('./electron-browser-polyfill');
  const path = require('path');
  const fs = require('fs');

  console.log("tetrio-plus preload script running");
  document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOMContentLoaded - Loading content scripts")
    let scripts = manifest.browser_specific_settings.desktop_client.preload_scripts;
    for (let script of scripts) {
      console.log("js:", script);
      let src = fs.readFileSync(path.join(__dirname, '../..', script), 'utf8');
      eval(src);
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
