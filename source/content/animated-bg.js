(async () => {
  let res = await browser.storage.local.get('animatedBgEnabled');
  if (res.animatedBgEnabled) {
    let canvas = document.getElementById('pixi');
    canvas.style.backgroundImage = 'url(/res/bg/1.jpg?bgId=animated)';
    canvas.style.backgroundPosition = 'center';
    canvas.style.backgroundSize = 'cover';
  }
})().catch(console.error);
