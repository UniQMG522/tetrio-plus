(() => {
  let touches = [];
  let keymap = {
    hardDrop: false,
    softDrop: false,
    moveLeft: false,
    moveRight: false,
    rotateCW: false,
    rotateCCW: false,
    rotate180: false,
    hold: false
  }

  function updateTouchElements(touchObj) {
    touchObj.origin.style.left = touchObj.originX + 'px';
    touchObj.origin.style.top = touchObj.originY + 'px';
    touchObj.indicator.style.left = touchObj.x + 'px';
    touchObj.indicator.style.top = touchObj.y + 'px';
  }

  function addTouch(evt) {
    for (let touch of evt.changedTouches) {
      let origin = document.createElement('div');
      origin.classList.add('touch-indicator');
      origin.classList.add('touch-origin');
      document.body.appendChild(origin);

      let indicator = document.createElement('div');
      indicator.classList.add('touch-indicator');
      indicator.classList.add('touch-position');
      document.body.appendChild(indicator);

      let touchObj = {
        originX: touch.pageX,
        originY: touch.pageY,
        origin: origin,
        indicator: indicator,
        x: touch.pageX,
        y: touch.pageY,
        identifier: touch.identifier,
        side: touch.pageX < window.innerWidth/2 ? 'left' : 'right',
        touch: touch
      };

      touches.push(touchObj);
      updateTouchElements(touchObj);
    }
  }

  function removeTouch(evt) {
    for (let touch of touches) {
      let remove = ([...evt.changedTouches].some(changedTouch =>
        touch.identifier == changedTouch.identifier
      ));
      if (remove) {
        touches.splice(touches.indexOf(touch), 1);
        touch.origin.remove();
        touch.indicator.remove();

        if (touch.side == 'left') {
          setKey('hardDrop', false);
          setKey('softDrop', false);
          setKey('moveLeft', false);
          setKey('moveRight', false);
        } else {
          setKey('rotate180', false);
          setKey('hold', false);
          setKey('rotateCW', false);
          setKey('rotateCCW', false);
        }
      }
    }
  }

  function moveTouch(evt) {
    for (let changedTouch of [...evt.changedTouches]) {
      for (let touch of touches) {
        if (touch.identifier != changedTouch.identifier)
          continue;
        touch.x = changedTouch.pageX;
        touch.y = changedTouch.pageY;
        updateTouchElements(touch);

        if (touch.side == 'left') {
          setKey('hardDrop', touch.y < touch.originY - 100);
          setKey('softDrop', touch.y > touch.originY + 100);
          setKey('moveLeft', touch.x < touch.originX - 100);
          setKey('moveRight', touch.x > touch.originX + 100);
        } else {
          setKey('rotate180', touch.y < touch.originY - 100);
          setKey('hold', touch.y > touch.originY + 100);
          setKey('rotateCCW', touch.x < touch.originX - 100);
          setKey('rotateCW', touch.x > touch.originX + 100);
        }
      }
    }
  }

  function setKey(name, pressed) {
    if (keymap[name] != pressed) {
      keymap[name] = pressed;
      console.log('Touch:', name, pressed ? 'down' : 'up');
      let evt = new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
        bubbles: true,
        code: keyMap[name][0]
      });
      document.body.dispatchEvent(evt);
    }
  }

  window.addEventListener("touchstart", addTouch);
  window.addEventListener("touchend", removeTouch);
  window.addEventListener("touchcancel", removeTouch);
  window.addEventListener("touchmove", moveTouch);
})();
