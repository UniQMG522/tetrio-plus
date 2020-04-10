console.log("Tetr.io+ is installed");
document.body.style.border = "5px solid red";

let port = browser.runtime.connect({ name: 'info-channel' });
port.postMessage({ type: 'getInfoString' });

port.onMessage.addListener(msg => {
  console.log(msg.value);
});

let jsLoadErr = document.getElementById("js_load_error");
if (!jsLoadErr) {
  console.error("[Tetr.io+] Can't find '#js_load_error'?");
} else {
  let div = document.createElement('div');
  jsLoadErr.appendChild(div);

  let header = document.createElement('h2');
  header.innerText = "Tetr.io+ is enabled";
  header.style.fontSize = '1.5rem';
  header.style.fontWeight = '500';
  header.style.color = 'red';
  div.appendChild(header);

  function paragraph(text) {
    let p = document.createElement('p');
    p.innerText = text;
    div.appendChild(p);
    return p;
  }

  paragraph(
    "Do not report errors to tetrio or osk while using Tetr.io+. " +
    "Try the following first:"
  );
  paragraph(
    "• Refreshing the page. There's a known out of memory bug on " +
    "initial load that can be fixed by refreshing."
  );
  paragraph("• Disabling options labelled as 'May break the game'");
  paragraph("• Removing Tetr.io+")

  port.onMessage.addListener(msg => {
    if (msg.type != 'getInfoStringResult') return;
    let p = paragraph(msg.value);
    p.style.color = '#666';
    p.style.fontSize = '1rem';
  });
}


let f8menu = document.getElementById('devbuildid');
if (!f8menu) {
  console.log("[Tetr.io+] Can't find '#devbuildid'?")
} else {
  let div = document.createElement('div');
  f8menu.parentNode.insertBefore(div, f8menu.nextSibling);

  div.innerText = `Tetr.io+ enabled`;
  div.style.fontFamily = 'PFW';

  port.onMessage.addListener(msg => {
    if (msg.type != 'getInfoStringResult') return;
    div.innerText = msg.value;
  });
}
