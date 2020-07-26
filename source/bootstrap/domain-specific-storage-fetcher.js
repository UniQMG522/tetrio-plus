/*
  This file exposes a helper function and a cache for safely retrieving
  a content pack from a given url. It provides both objects/null and
  wrappers/fallback.
*/

if (typeof require == 'function') {
  browser = require('../electron/electron-browser-polyfill');
  fetch = require('node-fetch');
  sanitizeAndLoadTPSE = require('../shared/tpse-sanitizer');
}

const REQUEST_CACHE = {};
async function getDataForDomain(urlString) {
  try {
    let {
      allowURLPackLoader,
      whitelistedLoaderDomains
    } = await browser.storage.local.get([
      'allowURLPackLoader',
      'whitelistedLoaderDomains'
    ]);

    if (!allowURLPackLoader)
      throw 'URL pack loading is disabled';

    let { useContentPack } = new URL(urlString)
      .search
      .slice(1)
      .split('&')
      .map(e => e.split('='))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {})

    if (!useContentPack)
      throw 'URL does not specify a content pack';

    let url = new URL(useContentPack);

    if (whitelistedLoaderDomains.indexOf(url.origin) == -1)
      throw new Error('Domain not whitelisted');

    if (!REQUEST_CACHE[url]) {
      REQUEST_CACHE[url] = new Promise(async res => {
        let req = await fetch(url, { mode: 'cors' });
        let unsanitizedData = await req.json();

        let sanitizedData = {};
        let result = await sanitizeAndLoadTPSE(unsanitizedData, {
          async set(pairs) {
            Object.assign(sanitizedData, pairs);
          }
        });

        console.log("Loaded content pack from " + url + ". Result:\n" + result);
        res(sanitizedData);
      });

      // Empty cache after 10 minutes. This should be enough time to load
      // the page and then play a few games (since music isn't fetched until
      // its played). We don't want to store it for too long though - content
      // packs can become absolutely positively downright enourmous.
      setTimeout(() => {
        delete REQUEST_CACHE[url];
        console.log("Cleared cached request for", url)
      }, 10 * 60 * 1000);
    }

    return await REQUEST_CACHE[url];
  } catch(ex) {
    console.log(ex);
    return null;
  }
}

async function getDataSourceForDomain(urlString) {
  let data = await getDataForDomain(urlString);
  if (data) {
    return {
      async get(keys) {
        // Prevent infinite loops in some users that don't expect
        // the promise to resolve syncronously
        await new Promise(r => setTimeout(r));
        return data; // It's technically complient
      }
    }
  } else {
    return browser.storage.local;
  }
}

if (typeof module != 'undefined' && module.exports)
  module.exports = getDataSourceForDomain;
