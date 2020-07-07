(async () => {
  let res = await browser.storage.local.get('enableTouchControls');
  if (!res.enableTouchControls) return;
  let script = document.createElement('script');
  script.src = browser.runtime.getURL("source/injected/touch-controls.js");
  document.head.appendChild(script);
})().catch(console.error);
