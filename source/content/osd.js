(async () => {
  if (window.location.pathname != '/') return;
  let storage = await getDataSourceForDomain(window.location);
  let res = await storage.get('enableOSD');
  if (!res.enableOSD) return;
  let script = document.createElement('script');
  script.src = browser.runtime.getURL("source/injected/osd.js");
  document.head.appendChild(script);

  window.addEventListener("getBaseIconURL", function dispatchConfig() {
    window.dispatchEvent(new CustomEvent("baseIconURL", {
      detail: browser.runtime.getURL(`resources/osd/`)
    }));
  }, false);
})().catch(console.error);
