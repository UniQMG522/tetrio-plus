(async () => {
  let res = await browser.storage.local.get('enableOSD');
  if (!res.enableOSD) return;
  let script = document.createElement('script');
  script.src = browser.runtime.getURL("source/injected/osd.js");
  document.head.appendChild(script);
})().catch(console.error);
