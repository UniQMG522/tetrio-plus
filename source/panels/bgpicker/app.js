let input = document.getElementById('input');
input.addEventListener('change', async evt => {
  let status = document.createElement('em');
  status.innerText = 'processing...';
  document.body.appendChild(status);

  for (let file of input.files) {
    var reader = new FileReader();
    reader.readAsDataURL(file, "UTF-8");
    reader.onerror = evt => alert('Failed to load background');

    let evt = await new Promise(res => reader.onload = res);
    let bgDataUrl = evt.target.result;

    let id = new Array(16)
      .fill(0)
      .map(e => {
        return String.fromCharCode(97 + Math.floor(Math.random() * 26));
      })
      .join('');

    let backgrounds = (await browser.storage.local.get('backgrounds')).backgrounds || [];
    backgrounds.push({ id: id, filename: file.name });
    browser.storage.local.set({ backgrounds });
    browser.storage.local.set({
      ['background-' + id]: evt.target.result.toString()
    });
  }

  window.close();
}, false);
setTimeout(() => input.click());
