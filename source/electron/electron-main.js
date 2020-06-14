const { app, BrowserWindow, protocol } = require('electron');
const browser = require('./electron-browser-polyfill.js');
const https = require('https');
const path = require('path');
const vm = require('vm');
const fs = require('fs');

const manifest = require('../../desktop-manifest.js');

let mainWindow = new Promise(res => {
  module.exports = res;
});

const greenlog = (...args) => console.log(
  "\u001b[32mGL>",
  ...args,
  "\u001b[37m"
);

protocol.registerSchemesAsPrivileged([{
  scheme: 'tetrio-plus',
  privileges: {
    secure: true,
    supportFetchAPI: true,
    bypassCSP: true,
    corsEnabled: true
  }
}, {
  scheme: 'tetrio-plus-internal',
  privileges: {
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true
  }
}]);

function matchesGlob(glob, string) {
  return new RegExp(
    '^' +
    glob
      .split('*')
      .map(seg => seg.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
      .join('.+') +
    '$'
  ).test(string);
}

app.whenReady().then(async () => {
  let rewriteHandlers = [];
  protocol.registerBufferProtocol('tetrio-plus', (req, callback) => {
    (async () => {
      greenlog("tetrio plus request", req.method, req.url);
      let url = 'https://tetr.io/' + req.url.substring('tetrio-plus://'.length);

      let handlers = rewriteHandlers.filter(handler => {
        return matchesGlob(handler.url, url);
      });

      // greenlog("Filtered potential handlers", rewriteHandlers, '->', handlers);

      let contentType = null;
      let data = null;

      // Used to fetch data from the source (https://tetr.io/) later on
      // if data isn't already provided internally.
      async function fetchData() {
        data = await new Promise(resolve => https.get(url, response => {
          contentType = response.headers['content-type'];
          greenlog("http response");
          let raw = [];
          response.setEncoding('utf8');
          response.on('data', chunk => raw.push(chunk))
          response.on('end', () => resolve(raw.join('')));
        }));
        greenlog("Fetched", data.slice(0, 100));
      }

      function filterCallback(response) {
        let { type, data: newData, encoding } = response;
        if (type) contentType = type;

        switch(encoding || 'text') {
          case 'text':
            data = newData;
            break;

          case 'base64-data-url':
            data = Buffer.from(newData.split('base64,')[1], 'base64');
            greenlog("Rewrote b64 data url to", data);
            break;

          default:
            throw new Error('Unknown encoding');
        }
      };

      for (let handler of handlers) {
        greenlog("Testing handler", handler.name);

        if (!await handler.options.enabledFor(url)) {
          greenlog("Not enabled!");
          continue;
        }

        if (handler.options.onStart) {
          greenlog("Start-handling it!", handler.name);
          // If data is a Buffer, it has a 'buffer' property which is an
          // Uint8Array-like. Offer that for browser compatibility.
          await handler.options.onStart(
            url,
            (data && data.buffer) || data,
            filterCallback
          );
        }

        if (handler.options.onStop) {
          // 'onStart' is run before data is fetched in the browser, so data
          // isn't fetched until an onStop is ran. If a handler ran before that,
          // there'll already be generated data, so no need to fetch from source.
          if (!data) await fetchData();
          greenlog("Stop-handling it!", handler.name);
          await handler.options.onStop(url, data.buffer || data, filterCallback);
        }
      }

      // If there's no handlers at all, no data will have been fetched
      // Fetch it now if that's the case
      if (!data) await fetchData();
      let finalWrite = typeof data == 'string'
        ? Buffer.from(data, 'utf8')
        : data;
      greenlog("Writing data", contentType, typeof data, finalWrite);
      callback({
        data: finalWrite,
        mimeType: contentType
      });
      greenlog("Wrote data!");
    })().catch(greenlog);
  });
  protocol.registerFileProtocol('tetrio-plus-internal', (req, callback) => {
    // greenlog("tetrio plus internal request", req.method, req.url);
    // greenlog(filepath);
    let relpath = req.url.substring('tetrio-plus-internal://'.length);
    let filepath = path.join(__dirname, '../..', relpath);
    callback({ path: filepath });
  });

  /* Not a security measure! */
  let context = vm.createContext({
    mainWindow: await mainWindow,
    rewriteHandlers,
    greenlog,
    browser,
    app,
    setTimeout,
    TextEncoder: class { encode(val) { return val } }, // noop polyfill
    // https://gist.github.com/jmshal/b14199f7402c8f3a4568733d8bed0f25
    atob(a) { return Buffer.from(a, 'base64').toString('binary'); },
    btoa(b) { return Buffer.from(b).toString('base64'); },
  });

  greenlog("loading tetrio plus scripts");
  let scripts = manifest.browser_specific_settings.desktop_client.scripts;
  for (let script of scripts) {
    let js = fs.readFileSync(path.join(__dirname, '../..', script));
    try {
      vm.runInContext(js, context);
    } catch(ex) {
      greenlog("Error while executing script", script, ex);
    }
  }

  let mainContents = (await mainWindow).webContents;
  mainContents.on('dom-ready', async evt => {
    mainContents.openDevTools();
  });

  let tp = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'electron-browser-polyfill.js')
    }
  });
  tp.loadURL(`tetrio-plus-internal://source/popup/index.html`);
  tp.webContents.on('dom-ready', () => {
    // tp.webContents.openDevTools();
  });
}).catch(greenlog);
