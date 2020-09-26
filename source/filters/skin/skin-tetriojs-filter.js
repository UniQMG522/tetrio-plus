createRewriteFilter("Animated skins", "https://tetr.io/js/tetrio.js", {
  enabledFor: async (storage, request) => {
    let res = await storage.get('advancedSkinLoading');
    return res.advancedSkinLoading;
  },
  onStop: async (storage, url, src, callback) => {
    let res = await storage.get('skinAnimMeta');
    let { frames, frameWidth, frameHeight } = res.skinAnimMeta;

    // You're gonna want line wrap for this one
    const monster = /Object\.keys\((\w+)\.minoCanvases\)\.forEach\((\w+)\s*=>\s*{\s*(\w+)\[\2\]\s*=[^}]+}\),\s*Object\.keys\(\w+\.minoCanvasesShiny\)\.forEach\((\w+)\s*=>\s*{\s*(\w+)\[\4\]\s*=[^}]+}\),/;

    let outerTextureList = null;
    let outerShinyTextureList = null;
    src = src.replace(monster, (
      match,
      canvasesContainer,
      _forEachVar1,
      textureList,
      _forEachVar2,
      shinyTextureList
    ) => {
      outerTextureList = textureList;
      outerShinyTextureList = shinyTextureList;
      // Intercepts the mino canvas setup and replaces it with our own texture
      // generation, and also obtains the texture variable names it outputs to
      return `
        Object.keys(${ canvasesContainer }.minoCanvases).forEach((e, minoIndex) => {
          let {
            frames: frameCount, frameWidth, frameHeight
          } = ${b64Recode(res.skinAnimMeta)};

          let frames = [];
          // If only using one frame, might as well just load the svg version
          let baseUrl = frameCount > 1
            ? 'https://tetr.io/res/minos.png?animated'
            : 'https://tetr.io/res/minos.svg';
          let base = PIXI.BaseTexture.from(baseUrl);
          for (let i = 0; i < frameCount; i++) {
            let rect = new PIXI.Rectangle(
              minoIndex * frameWidth/12,
              i * frameHeight,
              frameWidth/12-1, // -1 for pixel gap
              frameHeight
            );
            let tex = new PIXI.Texture(base, rect);
            frames.push(tex);
          }

          let proxy = new Proxy(frames, {
            get(target, prop) {
              if (prop == 'ratio')
                return ${ canvasesContainer }.minoCanvases.z.height / frameHeight;
              if (/^\\d+|length$/.test(prop))
                return frames[prop];
              return frames[0][prop];
            },
            set(obj, prop, val) {
              for (let frame of frames)
                frame[prop] = val;
            }
          });

          ${ textureList }[e] = proxy;
          ${ shinyTextureList }[e] = proxy;
        });
      `;
    });
    if (!outerTextureList) {
      console.log('Animated skins hooks filter broke, stage 1/3');
      callback({ type: 'text/javascript', data: src, encoding: 'text' });
      return;
    }

    // Extracts a function that calculates the size of a mino relative to
    // its base size and the current canvas size.
    let scaleFunc = /function (\w+)\((\w+)\)\s*{\s*return\s*\2\s*\*\w+\s*}/;
    let match = scaleFunc.exec(src);
    console.log("scaleFunctionResult", match)
    if (!match) {
      console.log('Animated skins hooks filter broke, stage 2/3');
      callback({ type: 'text/javascript', data: src, encoding: 'text' });
      return;
    }
    let [_match, scaleFuncName, _arg] = match;


    // Replace anywhere using the previously captured texture variables with an
    // AnimatedSprite instead of a regular one, and also set up animation logic.
    let matches = 0;
    let spritemaker = new RegExp(`(new PIXI\\.Sprite\\()([^)]*${outerTextureList}[^)]*\\).*?)(;)`, 'g');
    src = src.replace(spritemaker, (match, _constructor, contents, postmatch) => {
      matches++;
      // Avoiding matching the trailing close paran is harder than really
      // necessary in regex-land, so just slice it off here.
      contents = contents.replace(/\)$/, '');
      return `
        (() => {
          let { frames, delay } = ${b64Recode(res.skinAnimMeta)};
          let sprite = new PIXI.AnimatedSprite(${contents});
          sprite.animationSpeed = 1/delay;
          sprite.scale.set(${scaleFuncName}(31/30), ${scaleFuncName}(1));

          let target = () => ~~(((PIXI.Ticker.shared.lastTime/1000) * 60 / delay) % frames);
          sprite.gotoAndStop(target());
          let int = setInterval(() => {
            sprite.gotoAndStop(target());
            if (!sprite.parent) clearInterval(int);
          }, 16);
          return sprite;
        })()${postmatch}
      `
    });
    if (matches !== 4) {
      // Warning only
      console.warn(`Animated skins stage 3/3 expected to match 4 times, but matched ${matches} times.`)
    }

    callback({
      type: 'text/javascript',
      data: src,
      encoding: 'text'
    });
  }
})
