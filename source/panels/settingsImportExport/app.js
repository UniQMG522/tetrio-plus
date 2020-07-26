let match = /install=([^=]+)/.exec(new URL(window.location).search);
if (match) {
  console.log(match);
  let url = decodeURIComponent(match[1]);

  for (let el of document.querySelectorAll("fieldset:not(#url-importer)"))
    el.style.display = 'none';

  let a = document.getElementById('url-anchor');
  a.href = url;
  a.innerText = url;

  document.getElementById('url-importer').style.display = 'block';
  document.getElementById('import-from-url').addEventListener('click', async () => {
    console.log('Installing ' + url);
    let status = document.createElement('div');
    status.innerText = 'working on import...';
    document.body.appendChild(status);

    try {
      let data = await (await fetch(url)).json();
      alert(await sanitizeAndLoadTPSE(data, browser.storage.local));
    } catch(ex) {
      alert("Failed to load content pack! See the console for more details");
      console.error("Failed to load content pack: ", ex);
      console.error(
        "If your content pack is more than a few hundred megabytes, the " +
        "parser may be running out of memory."
      );
    } finally {
      status.remove();
    }
  });
}

document.getElementById('import').addEventListener('change', async evt => {
  let status = document.createElement('div');
  status.innerText = 'working on import...';
  document.body.appendChild(status);

  var reader = new FileReader();
  reader.readAsText(evt.target.files[0], "UTF-8");
  reader.onerror = () => alert("Failed to load content pack");

  try {
    let result = await new Promise(res => {
      reader.onload = evt => res(evt.target.result);
    });
    const data = JSON.parse(result);
    alert(await sanitizeAndLoadTPSE(data, browser.storage.local));
  } catch(ex) {
    alert("Failed to load content pack! See the console for more details");
    console.error("Failed to load content pack: ", ex);
    console.error(
      "If your content pack is more than a few hundred megabytes, the " +
      "parser may be running out of memory."
    );
  } finally {
    // reset the handler
    evt.target.type = '';
    evt.target.type = 'file';
    status.remove();
  }
});

document.getElementById('export').addEventListener('click', async evt => {
  let status = document.createElement('div');
  status.innerText = 'working on export...';
  document.body.appendChild(status);

  let exportKeys = [];
  let elems = document.getElementsByClassName('export-toggle');
  for (let elem of elems) {
    if (elem.checked) {
      exportKeys.push(...elem.getAttribute('data-export').split(','));
    }
  }

  let config = await browser.storage.local.get(exportKeys);

  if (config.animatedBackground) {
    let key = 'background-' + config.animatedBackground.id;
    Object.assign(config, await browser.storage.local.get(key));
  }

  if (config.backgrounds) {
    let bgIds = config.backgrounds.map(({ id }) => 'background-' + id);
    let bgs = await browser.storage.local.get(bgIds);
    Object.assign(config, bgs);
  }

  if (config.music) {
    let musicIds = config.music.map(({ id }) => 'song-' + id);
    let songs = await browser.storage.local.get(musicIds);
    Object.assign(config, songs);
  }

  console.log("Encoding data...");
  let json = JSON.stringify(config, null, 2);
  let blob = new Blob([json], { type: 'application/json' });

  console.log("Offering download...");
  // https://stackoverflow.com/questions/3665115/18197341#18197341
  let a = document.createElement('a');
  a.setAttribute('href', URL.createObjectURL(blob));
  a.setAttribute('download', 'tetrio-plus-settings-export.tpse');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  status.remove();
});

document.getElementById('clearData').addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all your Tetr.io+ data?')) {
    await browser.storage.local.clear();
    await browser.storage.local.set({
      version: browser.runtime.getManifest().version
    });
    alert('Data cleared');
  }
})
