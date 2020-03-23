let input = document.getElementById('input');
input.addEventListener('change', async evt => {

  for (let file of input.files) {
    var reader = new FileReader();
    reader.readAsDataURL(input.files[0], "UTF-8");
    reader.onerror = evt => alert('Failed to load song');

    let evt = await new Promise(res => reader.onload = res);
    let songDataUrl = evt.target.result;
    console.log("chose", file.name);

    let readableName = file.name.replace(/\..+$/, '').replace(/[-_]/g, ' ');
    let id = new Array(16)
      .fill(0)
      .map(e => {
        return String.fromCharCode(97 + Math.floor(Math.random() * 26));
      })
      .join('');

    let music = (await browser.storage.local.get('music')).music || [];
    music.push({
      id: id,
      filename: file.name,
      metadata: {
        name: readableName,
        jpname: readableName,
        artist: '<Unknown>',
        jpartist: '<Unknown>',
        genre: 'CALM',
        source: 'Custom song',
        loop: false,
        loopStart: 0,
        loopLength: 0
      }
    });
    browser.storage.local.set({ music });
    console.log("Loaded song", songDataUrl);
    browser.storage.local.set({ ['song-' + id]: songDataUrl.toString() });
  }

  window.close();
}, false);
setTimeout(() => input.click());
