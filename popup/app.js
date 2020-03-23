let openImageChanger = document.getElementById('openImageChanger');
openImageChanger.addEventListener('click', evt => {
  browser.windows.create({
    type: 'detached_panel',
    url: browser.extension.getURL('panels/filepicker/index.html'),
    width: 300,
    height: 50
  });
});

let resetSkin = document.getElementById('resetSkin');
resetSkin.addEventListener('click', evt => {
  browser.storage.sync.remove(['skin']).then(() => showCurrentSkin());
});

let preview = document.getElementById('preview');
let noSkin = document.getElementById('noSkin');
function showCurrentSkin() {
  browser.storage.sync.get('skin').then(({ skin }) => {
    if (!skin) {
      noSkin.style.display = 'default';
      console.log("No skin", skin);
      preview.src = '';
      return;
    }
    noSkin.style.display = 'none';
    console.log("Got skin", skin);

    let blob = new Blob([skin], {type: 'image/svg+xml'});
    let url = URL.createObjectURL(blob);
    preview.src = url;
    preview.addEventListener('load', () => {
      URL.revokeObjectURL(url);
    }, { once: true })
  });
}
showCurrentSkin();
