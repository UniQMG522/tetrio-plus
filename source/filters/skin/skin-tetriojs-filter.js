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
          console.log(frameCount, baseUrl);
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
      console.log('Animated skins hooks filter broke, stage 1/2');
      callback({ type: 'text/javascript', data: src, encoding: 'text' });
      return;
    }


    let matches = 0;
    let spritemaker = new RegExp(`(new PIXI\\.Sprite\\()([^)]*${outerTextureList}[^)]*\\).*?)(;)`, 'g');
    src = src.replace(spritemaker, (match, _constructor, contents, postmatch) => {
      matches++;
      // Avoiding matching the trailing close paran is harder than really
      // necessary in regex-land, so just slice it off here.
      contents = contents.replace(/\)$/, '');
      return `
        (() => {
          let { frames, delay, synchronized, loopStart } = ${b64Recode(res.skinAnimMeta)};
          let sprite = new PIXI.AnimatedSprite(${contents});
          sprite.animationSpeed = 1/delay;
          // 0.95 is an experimentally determined magic number
          // because I can't figure out how tetrio is scaling stuff
          // sprite.scale.set(${outerTextureList}.z.ratio * 0.95);
          sprite.scale.set(yt(1));
          sprite.play();

          let target = () => ~~(((Date.now()/1000) * 60 / delay) % frames);
          let looped = false;
          sprite.onFrameChange = function() {
            if (synchronized && (!loopStart || looped))
              try { sprite.gotoAndPlay(target()); } catch(ex) { console.error(target(), ex); }
          }
          sprite.onLoop = function() {
            sprite.gotoAndPlay(loopStart);
            looped = true;
          }
          return sprite;
        })()${postmatch}
      `
    });
    if (matches !== 4) {
      // Warning only
      console.warn(`Animated skins stage 2/2 expected to match 4 times, but matched ${matches} times.`)
    }

    callback({
      type: 'text/javascript',
      data: src,
      encoding: 'text'
    });
  }
})
