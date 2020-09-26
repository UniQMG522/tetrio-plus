/* Added by Jabster28 | MIT Licensed */
(async () => {
  if (window.location.pathname != '/') return;
  let storage = await getDataSourceForDomain(window.location);
  let res = await storage.get('enableEmoteTab');
  if (!res.enableEmoteTab) return;
  let script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/gh/nol13/fuzzball.js/dist/fuzzball.umd.min.js"
  document.head.appendChild(script);
  script = document.createElement('script');



  script.src = browser.runtime.getURL("source/injected/emote-tab.js");
  document.head.appendChild(script);
})().catch(console.error);
