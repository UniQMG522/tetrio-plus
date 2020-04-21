function onReadFile(input, asText, callback) {
  input.addEventListener('change', evt => {
    var reader = new FileReader();

    if (asText) reader.readAsText(input.files[0], "UTF-8")
    else reader.readAsDataURL(input.files[0], "UTF-8");

    reader.onerror = function (evt) {
      alert("Failed to load image");
    }

    reader.onload = function(evt) {
      callback(evt.target.result);
    }
  }, false);
}

async function setSkin(svg) {
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  canvas.width = 372;
  canvas.height = 30;

  let img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], {
    type: "image/svg+xml;charset=utf-8"
  }));
  img.onerror = console.error;
  await new Promise(res => img.onload = res);

  ctx.drawImage(img, 0, 0, 372, 30);

  let skinPng = canvas.toDataURL('image/png');
  await browser.storage.local.set({ skin: svg, skinPng });
}

onReadFile(document.getElementById('tetrio-svg'), true, async svg => {
  await setSkin(svg);
  window.close();
});

onReadFile(document.getElementById('tetrio-png'), false, async png => {
  let placeholder = browser.extension.getURL('resources/template.svg');
  let template = await (await fetch(placeholder)).text();
  let svg = template.replace('<!--custom-image-embed-->', png);
  await setSkin(svg);
  window.close();
});

onReadFile(document.getElementById('jstris-png'), false, async png => {
  let img  = new Image();
  let pr = new Promise(res => img.onload = res);
  img.onerror = () => alert('Failed to load image');
  img.src = png
  await pr;

  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  canvas.width = img.width * 12/9;
  canvas.height = img.height;

  // Jstris format: Garbage, Ghost, ROYGBIV
  // Tetrio format: ROYGBIV, Ghost, Garbage, Garbage 2, Dark garbage, Top-out warning
  let shuffle = [2, 3, 4, 5, 6, 7, 8, 1, 0, 0, 0, 0];
  let step = img.height;
  for (let i = 0; i < 12; i++) {
    ctx.drawImage(
      img,
      shuffle[i]*step, 0, step, step,
      i*step, 0, step, step
    )
  }

  let tetrioPng = canvas.toDataURL();
  let placeholder = browser.extension.getURL('resources/template.svg');
  let template = await (await fetch(placeholder)).text();
  let svg = template.replace('<!--custom-image-embed-->', tetrioPng);
  await setSkin(svg);
  window.close();
});
