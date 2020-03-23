let input = document.getElementById('input');
input.addEventListener('change', evt => {
  var reader = new FileReader();
  reader.readAsText(input.files[0], "UTF-8");
  reader.onerror = function (evt) {
    alert("Failed to load image");
  }

  reader.onload = function(evt) {
    let svg = evt.target.result;
    browser.storage.local.set({ skin: svg });
    console.log("Setting skin", svg);
    window.close();
  }
}, false);
setTimeout(() => input.click());
