createRewriteFilter('SVG', 'https://tetr.io/res/minos.svg', {
  enabledFor: async request => {
    let { skin } = await browser.storage.local.get('skin');
    return !!skin;
  },
  onStop: async (request, filter, src) => {
    let { skin } = await browser.storage.local.get('skin');
    filter.write(new TextEncoder().encode(skin));
  }
});
