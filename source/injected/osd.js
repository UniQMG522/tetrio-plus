/*
  This has to be an injected script and not a content script because
  DOM events appear to stringify objects passed to them only for content
  scripts, and I need to call a function on an event's detail object
*/
(() => {
  [...document.getElementsByClassName('tetrio-plus-osd')].forEach(c => c.remove());

  let osd = document.createElement('div');
  osd.classList.toggle('tetrio-plus-osd', true);
  document.body.appendChild(osd);

  let buttons = [];
  let buttonMap = {};
  function button(name, tetrioName, icon) {
    let elem = document.createElement('div');
    elem.classList.toggle('tetrio-plus-osd-key', true);
    elem.classList.toggle(name, true);
    elem.style.gridArea = name;
    elem.innerText = icon;
    osd.appendChild(elem);
    buttons.push(elem);
    buttonMap[tetrioName] = elem;
  }

  button('left', 'moveLeft', '🡠');
  button('right', 'moveRight', '🡢');
  button('softdrop', 'softDrop', '🡣');
  button('harddrop', 'hardDrop', '⮇');
  button('spin-cw', 'rotateCW', '↻');
  button('spin-ccw', 'rotateCCW', '↺');
  button('spin-180', 'rotate180', '⟳');
  button('hold', 'hold', '♻');

  let handleContainer = document.createElement('div');
  handleContainer.classList.toggle('tetrio-plus-osd-handle-container');
  osd.appendChild(handleContainer);

  let dragHandle = document.createElement('div');
  dragHandle.classList.toggle('tetrio-plus-osd-drag-handle');
  dragHandle.innerText = '✢';
  handleContainer.appendChild(dragHandle);

  let resizeHandle = document.createElement('div');
  resizeHandle.classList.toggle('tetrio-plus-osd-resize-handle');
  resizeHandle.innerText = '🡦';
  handleContainer.appendChild(resizeHandle);

  // too lazy to write hooks back to browser storage from an injected script
  let x = +localStorage.tp_osd_x || 40;
  let y = +localStorage.tp_osd_y || 40;
  let w = +localStorage.tp_osd_w || 180;
  let h = +localStorage.tp_osd_h || 90;
  const minWidth = 100;
  const minHeight = 50;

  function resize() {
    let _x = x, _y = y, _w = w, _h = h;
    if (_w < minWidth) _w = minWidth;
    if (_h < minHeight) _h = minHeight;

    osd.style.left = _x + 'px';
    osd.style.top = _y + 'px';
    osd.style.width = _w + 'px';
    osd.style.height = _h + 'px';

    let fontSize = Math.min(Math.floor(_w/6), Math.floor(_h/2)) - 4;
    for (let button of buttons) {
      button.style.fontSize = fontSize + 'px';
    }
  }
  resize();

  let dragging = false;
  let resizing = false;
  let lastMouseX = 0, lastMouseY = 0;
  osd.addEventListener('mousedown', evt => {
    lastMouseX = evt.clientX;
    lastMouseY = evt.clientY;
    dragging = true;
  });
  resizeHandle.addEventListener('mousedown', evt => {
    lastMouseX = evt.clientX;
    lastMouseY = evt.clientY;
    resizing = true;
  });
  document.body.addEventListener('mousemove', evt => {
    if (resizing) {
      w += evt.clientX - lastMouseX;
      h += evt.clientY - lastMouseY;
      resize();
    } else if (dragging) {
      x += evt.clientX - lastMouseX;
      y += evt.clientY - lastMouseY;
      resize();
    }
    lastMouseX = evt.clientX;
    lastMouseY = evt.clientY;
  });
  document.body.addEventListener('mouseup', evt => {
    dragging = false;
    resizing = false;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (w < minWidth) w = minWidth;
    if (h < minHeight) h = minHeight;
    if (x > window.innerWidth - w) x = window.innerWidth - w;
    if (y > window.innerHeight - h) y = window.innerHeight - h;
    if (w > window.innerWidth) w = window.innerWidth;
    if (h > window.innerHeight) w = window.innerHeight;
    localStorage.tp_osd_x = x;
    localStorage.tp_osd_y = y;
    localStorage.tp_osd_w = w;
    localStorage.tp_osd_h = h;
    resize();
  });

  function onGameKey(obj) {
    if (obj.type == 'end') {
      buttons.forEach(el => el.classList.toggle('active', false));
      return;
    }

    let elem = buttonMap[obj.data.key];
    if (!elem) return;

    switch (obj.type) {
      case 'keyup':
        elem.classList.toggle('active', false);
        break;
      case 'keydown':
        elem.classList.toggle('active', true);
        break;
    }
  }

  let game = null;
  document.addEventListener('tetrio-plus-on-game', evt => {
    // If a game has a socket, its someone else's board
    // Singleplayer, replay, and own boards in multiplayer have no sockets
    if (evt.detail.socket()) return;
    if (game) game.unbind(onGameKey);
    buttons.forEach(el => el.classList.toggle('active', false));
    game = evt.detail;
    game.bind(onGameKey);
    // console.log("Bound game", game);
  });
})();
