let input = document.getElementById('input');
input.addEventListener('change', async evt => {
  let status = document.createElement('em');
  status.innerText = 'processing...';
  document.body.appendChild(status);

  for (let file of input.files) {
    var reader = new FileReader();
    reader.readAsDataURL(file, "UTF-8");
    reader.onerror = evt => alert('Failed to load song');

    let evt = await new Promise(res => reader.onload = res);
    let songDataUrl = evt.target.result;
    console.log("chose", file.name);

    let id = new Array(16)
      .fill(0)
      .map(e => {
        return String.fromCharCode(97 + Math.floor(Math.random() * 26));
      })
      .join('');

    let audio = new Audio();
    audio.src = songDataUrl;
    await new Promise(res => {
      audio.addEventListener('canplaythrough', res);
      audio.load();
    });
    let loopLength = Math.floor(audio.duration * 1000);

    let readableName = file.name.replace(/\..+$/, '');
    let artist = '<Unknown>';
    // Set up artist when name is of the form "Artist - Song name"
    let match = /^(.+?)\s+-\s+(.+?)$/.exec(readableName);
    if (match) {
      artist = match[1];
      readableName = match[2];
    }
    // Remove extra underscores and dashes, and multiple spaces
    readableName = readableName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

    let music = (await browser.storage.local.get('music')).music || [];
    music.push({
      id: id,
      filename: file.name,
      metadata: {
        name: readableName,
        jpname: readableName,
        artist: artist,
        jpartist: artist,
        genre: 'CALM',
        source: 'Custom song',
        loop: true,
        loopStart: 0,
        loopLength: loopLength
      }
    });
    browser.storage.local.set({ music });
    console.log("Loaded song", songDataUrl);
    browser.storage.local.set({ ['song-' + id]: songDataUrl.toString() });
  }

  window.close();
}, false);
setTimeout(() => input.click());
