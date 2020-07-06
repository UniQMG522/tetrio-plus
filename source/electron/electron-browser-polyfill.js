(() => {
  let electron = typeof window != 'undefined' && window?.process?.versions?.electron;
  let node = typeof module != 'undefined' && module.exports;
  if (electron || node) {
    console.log("Running under electron - polyfilling browser");

    // provided by tetrio desktop
    const Store = require('electron-store');
    const store = new Store({ name: 'tetrio-plus' });

    const electron = require('electron');
    const path = require('path');
    const fs = require('fs');

    // onConnect listeners. Since the content scripts
    // run in the same context while under electron,
    // these are fully syncronous
    let globalListeners = [];
    let connections = [];

    const browser = {
      electron: true,
      runtime: {
        getURL(relative) {
          let absolute = 'tetrio-plus-internal://' + relative;
          console.log(relative, absolute);
          return absolute;
        },
        getManifest() {
          return require('../../desktop-manifest.js');
        },
        onConnect: {
          addListener(callback) {
            callback({
              onMessage: {
                addListener(listener) {
                  globalListeners.push(listener)
                }
              },
              postMessage(msg) {
                for (let connection of connections)
                  for (let listener of connection.listeners)
                    listener(msg);
              }
            })
          }
        },
        connect() {
          let connection = {
            listeners: [],
            postMessage(msg) {
              for (let listener of globalListeners)
                listener(msg);
            },
            onMessage: {
              addListener(listener) {
                connection.listeners.push(listener);
              }
            }
          };
          connections.push(connection);
          return connection;
        }
      },
      theme: {
        async getCurrent() {
          return null;
        },
        onUpdated: {
          addListener() { /* /dev/null */},
          removeListener() { /* /dev/null */ }
        }
      },
      extension: {
        getURL(relative) {
          return browser.runtime.getURL(relative);
        }
      },
      windows: {
        create({ type, url, width, height }) {
          console.log("Create", url);
          let panel = new electron.remote.BrowserWindow({
            width,
            height,
            webPreferences: {
              preload: path.join(__dirname, 'electron-browser-polyfill.js')
            }
          });
          panel.loadURL(url);
          panel.on('closed', () => {
            window.location.reload();
          });
        }
      },
      tabs: {
        create({ url, active }) {
          browser.windows.create({ type: null, url, width: 800, height: 800 });
        }
      },
      storage: {
        local: {
          async get(keys) {
            if (typeof keys == 'string') keys = [keys];

            let values = {};
            for (let key of keys)
              values[key] = store.get(key);

            // Prevent infinite loops in some users that don't expect
            // the promise to resolve syncronously
            await new Promise(r => setTimeout(r, 100));
            return values;
          },
          async set(vals) {
            store.set(vals);
          },
          async remove(keys) {
            if (typeof keys == 'string') keys = [keys];
            for (let key of keys) store.delete(key);
          },
          async clear() {
            store.clear();
          }
        }
      }
    };


    if (typeof module != 'undefined' && module.exports)
      module.exports = browser;
    if (typeof window != 'undefined')
      window.browser = browser;
  }
})();
