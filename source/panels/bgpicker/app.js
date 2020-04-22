let regular = document.getElementById('regular');
regular.addEventListener('change', async evt => {
  let status = document.createElement('em');
  status.innerText = 'processing...';
  document.body.appendChild(status);

  let backgrounds = (await browser.storage.local.get('backgrounds')).backgrounds || [];
  for (let file of evt.target.files) {
    var reader = new FileReader();
    reader.readAsDataURL(file, "UTF-8");
    reader.onerror = evt => alert('Failed to load background');
    await new Promise(res => reader.onload = res);

    let id = randomId();
    backgrounds.push({ id: id, filename: file.name });
    await browser.storage.local.set({
      ['background-' + id]: reader.result.toString()
    });
  }
  await browser.storage.local.set({ backgrounds });

  regular.type = '';
  regular.type = 'file';
  status.remove();
  window.close();
}, false);

let animated = document.getElementById('animated');
animated.addEventListener('change', async evt => {
  let status = document.createElement('em');
  status.innerText = 'processing...';
  document.body.appendChild(status);

  let reader = new FileReader();
  reader.readAsDataURL(evt.target.files[0], "UTF-8");
  reader.onerror = evt => alert('Failed to load background');
  await new Promise(res => reader.onload = res);

  let id = randomId();
  await browser.storage.local.set({
    animatedBackground: { id, filename: evt.target.files[0].name },
    ['background-' + id]: reader.result.toString()
  });

  animated.type = '';
  animated.type = 'file';
  status.remove();
  window.close();
});

function randomId() {
  return new Array(16).fill(0).map(e =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26))
  ).join('');
}
