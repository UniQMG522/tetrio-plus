/* Added by Jabster28 | MIT Licensed */
/* Modified by UniQMG */
(async () => {
  if (window.location.pathname != '/') return;
  let storage = await getDataSourceForDomain(window.location);
  let res = await storage.get('enableEmoteTab');
  if (!res.enableEmoteTab) return;

  let script = document.createElement('script');
  script.src = browser.runtime.getURL('source/injected/emote-tab.js');
  document.head.appendChild(script);
})().catch(console.error);
