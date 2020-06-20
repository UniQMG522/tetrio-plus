try {
  (async function() {
    let {
      music, musicGraph, musicEnabled, musicGraphEnabled
    } = await browser.storage.local.get([
      'music', 'musicGraph', 'musicEnabled', 'musicGraphEnabled'
    ]);
    if (!musicEnabled || !musicGraphEnabled)
      return;

    const musicRoot = '/res/bgm/akai-tsuchi-wo-funde.mp3?song=';
    const context = new AudioContext();
    const audioBuffers = {};

    const graph = {};
    for (let src of JSON.parse(musicGraph)) {
      graph[src.id] = src;
      if (!src.audio) continue;
      if (audioBuffers[src.audio]) continue;

      let key = 'song-' + src.audio;
      let base64 = (await browser.storage.local.get(key))[key];
      let rawBuffer = await fetch(base64).then(res => res.arrayBuffer());
      // let rawBuffer = convertDataURIToArrayBuffer(base64);
      let decoded = await context.decodeAudioData(rawBuffer);
      audioBuffers[src.audio] = decoded;
    }

    // A list of events that use == != > < valueOperators
    const eventValueExtendedModes = [
      'text-spike',
      'text-combo',
      'board-height-player',
      'board-height-enemy'
    ];
    // A list of events that use the value field
    const eventValueEnabled = [
      'time-passed',
      'text-b2b-combo',
      ...eventValueExtendedModes
    ];

    const nodes = [];
    class Node {
      constructor() {
        // console.log("Created new node");
        this.audio = null;
        this.timeouts = [];
        this.startedAt = null;
      }

      setSource(source, startTime=0) {
        if (this.destroyed) return;
        // console.log(`Node ${this?.source?.name} -> ${source.name}`)
        this.source = source;

        for (let timeout of this.timeouts)
          clearTimeout(timeout);
        this.timeouts.length = 0;

        this.restartAudio(startTime);

        for (let trigger of this.source.triggers) {
          switch (trigger.event) {
            case 'time-passed':
              let timeout = setTimeout(() => {
                this.runTrigger(trigger);
              }, trigger.value*1000);
              this.timeouts.push(timeout);
              break;
          }
        }
      }

      restartAudio(startTime) {
        if (this.destroyed) return;
        if (!this.source.audio) {
          this.runTriggersByName('node-end');
          return;
        }

        let audioSource = context.createBufferSource();
        audioSource.buffer = audioBuffers[this.source.audio];
        audioSource.connect(context.destination);
        audioSource.onended = () => {
          if (this.audio != audioSource) return;
            this.runTriggersByName('node-end');
        };
        audioSource.start(0, startTime);
        this.startedAt = context.currentTime - startTime;

        if (this.audio) this.audio.stop();
        this.audio = audioSource;
      }

      get currentTime() {
        return context.currentTime - this.startedAt;
      }

      destroy() {
        this.destroyed = true;
        this.audio.stop();
        let index = nodes.indexOf(this);
        if (index !== -1)
          nodes.splice(index, 1);
      }

      runTriggersByName(name) {
        for (let trigger of this.source.triggers)
          if (trigger.event == name)
            this.runTrigger(trigger);
      }

      runTrigger(trigger) {
        // console.log(
        //   `Node ${this.source.name} running trigger ` +
        //   `${trigger.event} ${trigger.mode} ${trigger.target}`
        // );
        let startTime = trigger.preserveLocation
          ? this.currentTime
          : 0;
        switch (trigger.mode) {
          case 'fork':
            var src = graph[trigger.target];
            if (!src) {
              console.error("Tetr.io+ error: Unknown node #" + trigger.target);
              break;
            }
            var node = new Node();
            node.setSource(src, startTime);
            nodes.push(node);
            break;

          case 'goto':
            var src = graph[trigger.target];
            if (!src) {
              console.error("Tetr.io+ error: Unknown node #" + trigger.target);
              break;
            }
            this.setSource(src, startTime);
            break;

          case 'kill':
            this.destroy();
            break;

          case 'random':
            let triggers = this.source.triggers.filter(trigger =>
              trigger.event == 'random-target' && trigger.mode != 'random'
            );
            if (triggers.length == 0) break;
            this.runTrigger(triggers[
              Math.floor(Math.random() * triggers.length)
            ]);
            break;
        }
      }

      toString() {
        let debug = ['Node ', this.source.name];
        for (let trigger of this.source.triggers) {
          debug.push('\n​ ​ ​ ​ ');
          debug.push(trigger.event + ' ');
          debug.push(trigger.mode + ' ');
          if (eventValueExtendedModes.indexOf(trigger.event) > -1)
            debug.push(trigger.valueOperator + ' ');
          if (eventValueEnabled.indexOf(trigger.event) > -1)
            debug.push(trigger.value + ' ');
          debug.push('' + (graph[trigger.target] || {}).name);
        }
        return debug.join('');
      }
    }

    Object.values(graph)
      .filter(src => src.type == 'root')
      .map(src => {
        let node = new Node();
        node.setSource(src);
        return node;
      })
      .forEach(node => nodes.push(node));

    let recentEvents = [];

    let f8menu = document.getElementById('devbuildid');
    let f8menuActive = false;
    if (!f8menu) {
      console.log("[Tetr.io+] Can't find '#devbuildid'?")
    } else {
      let div = document.createElement('div');
      f8menu.parentNode.insertBefore(div, f8menu.nextSibling.nextSibling);
      div.style.fontFamily = 'monospace';
      setInterval(() => {
        f8menuActive = !f8menu.parentNode.classList.contains('off');
        if (!f8menuActive) return;

        div.innerText = [
          'Tetr.io+ music graph debug',
          'Recent events: ' + [...recentEvents].reverse().join(', '),
          ...nodes.map(node => node.toString())
        ].join('\n');
      }, 100);
    }

    function dispatchEvent(eventName, value) {
      if (f8menuActive) {
        let str = typeof value == 'number'
          ? `${eventName} (${value})`
          : eventName;

        let index = recentEvents.indexOf(str);
        if (index !== -1)
          recentEvents.splice(index, 1);

        recentEvents.push(str);

        if (recentEvents.length > 20)
          recentEvents = recentEvents.slice(-20);
      }

      for (let node of [...nodes]) {
        iterTriggers: for (let trigger of node.source.triggers) {
          if (trigger.event != eventName)
            continue;

          if (typeof value == 'number') {
            if (eventValueExtendedModes.indexOf(trigger.event) >= 0) {
              valueSwitcher: switch (trigger.valueOperator || '==') {
                case '==':
                  if (!(value == trigger.value)) continue iterTriggers;
                  break valueSwitcher;
                case '!=':
                  if (!(value != trigger.value)) continue iterTriggers;
                  break valueSwitcher;
                case '>':
                  if (!(value > trigger.value)) continue iterTriggers;
                  break valueSwitcher;
                case '<':
                  if (!(value < trigger.value)) continue iterTriggers;
                  break valueSwitcher;
              }
            } else {
              if (trigger.value != value && trigger.value != 0)
                continue;
            }
          }

          node.runTrigger(trigger);
        }
      }
    }

    document.addEventListener('tetrio-plus-actiontext', evt => {
      // console.log('IJ actiontext', evt.detail.type, evt.detail.text);

      switch (evt.detail.type) {
        case 'clear':
          dispatchEvent('text-clear-' + evt.detail.text.toLowerCase());
          break;

        case 'combo':
          dispatchEvent('text-combo', parseInt(evt.detail.text));
          break;

        case 'tspin':
          dispatchEvent('text-t-spin');
          break;

        case 'also':
          if (evt.detail.text == 'back-to-back')
            dispatchEvent('text-b2b-singleplayer');
          break;

        case 'spike':
          dispatchEvent('text-spike', parseInt(evt.detail.text));
          break;

        case 'also_permanent':
          if (evt.detail.text.startsWith('B2B')) {
            let number = parseInt(/\d+$/.exec(evt.detail.text)[0]);
            dispatchEvent('text-b2b-combo', number);
            dispatchEvent('text-b2b');
          }
          break;

        case 'also_failed':
          if (evt.detail.text.startsWith('B2B'))
            dispatchEvent('text-b2b-reset');
          break;
      }
    });
    document.addEventListener('tetrio-plus-actionsound', evt => {
      // arg 1: sound effect name
      // arg 2: 'full' for active board or general sfx, 'tiny' for other boards
      // arg 3: -0 for full sound effects, 0-1 for tiny ones. Possibly spatialization?
      // arg 4: 1 for full sound effects, 0-1 for tiny ones. Possibly volume?
      // arg 5: always false
      // arg 6: true on full, false on tiny
      // arg 7: always 1
      // console.log('IJ actionsound', ...evt.detail.args);
      let name = evt.detail.args[0];
      let type = evt.detail.args[1] == 'full' ? 'player' : 'enemy';
      dispatchEvent(`sfx-${name}-${type}`);
    });
    document.addEventListener('tetrio-plus-actionheight', evt => {
      // The 'height' is actually the *unfilled* portion of the board,
      // but we want the filled portion to pass for the event
      let height = 40 - evt.detail.height;
      let type = evt.detail.type == 'full' ? 'player' : 'enemy';
      dispatchEvent(`board-height-${type}`, height);
    });
  })().catch(console.error);

} catch(ex) { console.error(ex) }
