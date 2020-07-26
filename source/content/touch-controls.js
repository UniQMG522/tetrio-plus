(async () => {
  let storage = await getDataSourceForDomain(window.location);
  let res = await storage.get('enableTouchControls');
  if (!res.enableTouchControls) return;
  let script = document.createElement('script');
  script.src = browser.runtime.getURL("source/injected/touch-controls.js");
  document.head.appendChild(script);

  async function dispatchConfig() {
    let { touchControlConfig: config } = await storage.get(
      'touchControlConfig'
    );
    if (config) {
      config = JSON.parse(config);
    } else {
      config = {
        mode: 'touchpad',
        deadzone: 100,
        binding: {
          L_left: 'moveLeft',
          L_right: 'moveRight',
          L_up: 'hardDrop',
          L_down: 'softDrop',
          R_left: 'rotateCCW',
          R_right: 'rotateCW',
          R_up: 'rotate180',
          R_down: 'hold'
        },
        keys: []
      }
    };
    window.dispatchEvent(new CustomEvent("touchControlConfig", {
      detail: JSON.stringify(config)
    }));
  }

  window.addEventListener("getTouchControlConfig", dispatchConfig, false);

})().catch(console.error);
