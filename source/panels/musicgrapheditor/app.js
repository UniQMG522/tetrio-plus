import VisualEditor from './visual-editor.js';
import {
  events,
  eventValueStrings,
  eventValueExtendedModes,
  eventHasTarget
} from './events.js';
const html = arg => arg.join(''); // NOOP, for editor integration.


const app = new Vue({
  template: html`
    <div :class="{ 'split-pane': showVisualEditor }">
      <div class="node-editor">
        <div class="pane-header">
          <button @click="save">Save changes</button>
          <span :style="{ opacity: this.saveOpacity }">Saved!</span>
          <button @click="toggleVisualEditor()" style="float: right">
            Toggle visual editor
          </button>
        </div>
        <div>
          <fieldset v-for="node of nodes" :id="'node-' + node.id">
            <legend>
              <button @click="node.hidden = false" v-if="node.hidden == true">⮞</button>
              <button @click="node.hidden = true" v-else>⮟</button>
              <template v-if="node.type == 'root'">
                Root
              </template>
              <template v-else>
                <input type="text" v-model="node.name"/>
                <button @click="removeNode(node)">❌</button>
                <button @click="copyNode(node)">Copy</button>
                <button @click="shiftNode(node, -1)">🔼</button>
                <button @click="shiftNode(node, 1)">🔽</button>
              </template>
            </legend>

            <div v-show="!node.hidden">
              <div class="section" v-if="node.type != 'root'">
                Select audio:
                <select v-model="node.audio">
                  <option :value="null">None</option>
                  <option v-for="song of music" :value="song.id">
                    {{ song.filename }}
                  </option>
                </select>
                <div v-if="music.length == 0">
                  (Add music in the main tetrio+ menu)
                </div>
              </div>

              <div v-if="(reverseLinkLookupTable[node.id] || []).size > 0"
                   class="section">
                Linked from
                <span v-for="link of reverseLinkLookupTable[node.id]" class="linkback">
                  <a href="#" @click="focus(link)">{{ link.name }}</a>
                </span>
              </div>

              Triggers
              <div class="triggers section">
                <div class="trigger" v-for="(trigger, i) of node.triggers" :trigger-index="i">
                  <!-- <code>{{ trigger.anchor }}</code> -->
                  <div>
                    <b>Event</b>
                    <select v-model="trigger.event">
                      <option
                        v-for="evt of events"
                        :value="evt"
                        :disabled="trigger.mode == 'random' && evt == 'random-target'"
                      >{{evt}}</option>
                    </select>
                    <button @click="removeTrigger(node, trigger)">❌</button>
                    <button @click="copyTrigger(trigger)">Copy</button>
                    <button @click="shiftTrigger(node, trigger, -1)">🔼</button>
                    <button @click="shiftTrigger(node, trigger, 1)">🔽</button>
                  </div>
                  <div v-if="eventValueStrings[trigger.event]">
                    <b>{{ eventValueStrings[trigger.event] }}</b>
                    <select v-model="trigger.valueOperator"
                            v-if="eventValueExtendedModes[trigger.event]">
                      <option value="==" default>Equal to</option>
                      <option value="!=">Not equal to</option>
                      <option value=">">Greater than</option>
                      <option value="<">Less than</option>
                    </select>
                    <input type="number" v-model.number="trigger.value" min="0" />
                  </div>
                  <div>
                    <b>Mode</b>
                    <select v-model="trigger.mode">
                      <option value="fork">Create new node (fork)</option>
                      <option value="goto">Go to node (goto)</option>
                      <option value="kill">Stop executing (kill)</option>
                      <option value="random" :disabled="trigger.event == 'random-target'">
                        Run a random-target trigger (random)
                      </option>
                    </select>
                  </div>
                  <div v-if="hasTarget(trigger)">
                    <b>Target</b>
                    <select v-model="trigger.target">
                      <option :value="node.id" v-for="node of nodes">
                        {{ node.name }}
                      </option>
                    </select>
                    <a href="#" @click="focus(trigger.target)">jump</a>
                  </div>
                  <div v-if="hasTarget(trigger)">
                    <input type="checkbox" v-model="trigger.preserveLocation" />
                    Preserve location after jumping
                  </div>
                </div>
                <div>
                  <button @click="addTrigger(node)">
                    New trigger
                  </button>
                  <button @click="pasteTrigger(node)" :disabled="!copiedTrigger">
                    Paste trigger
                  </button>
                  <button @click="pasteNode(node)" :disabled="!copiedNode">
                    Paste node here
                  </button>
                  <button @click="moveNode(node)" :disabled="!copiedNode">
                    Move node here
                  </button>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
        <button @click="addNode()">Add node</button>
        <button @click="pasteNode()" :disabled="!copiedNode">Paste node</button>
        <div class="scroll-past-end"></div>
      </div>
      <visual-editor
        v-show="showVisualEditor"
        :nodes="nodes"
        @focus="focus"
      />
    </div>
  `,
  data: {
    events,
    eventValueStrings,
    eventValueExtendedModes,
    music: [],
    nodes: [{
      id: 0,
      type: 'root',
      name: 'root',
      audio: null,
      triggers: [],
      hidden: false,
      x: 0,
      y: 0
    }],
    maxId: 0,
    saveOpacity: 0,
    copiedNode: null,
    copiedTrigger: null,
    showVisualEditor: true
  },
  components: { VisualEditor },
  computed: {
    reverseLinkLookupTable() {
      let links = {};

      for (let node of this.nodes) {
        for (let trigger of node.triggers) {
          if (trigger.target == node.id) continue;
          if (!this.hasTarget(trigger)) continue;

          links[trigger.target] = links[trigger.target] || new Set();
          links[trigger.target].add(node);
        }
      }

      return links;
    }
  },
  methods: {
    addNode() {
      this.nodes.push({
        id: ++this.maxId,
        type: 'normal',
        name: 'new node ' + this.maxId,
        audio: null,
        triggers: [],
        hidden: false,
        x: 0,
        y: 0
      })
    },
    addTrigger(node) {
      node.triggers.push({
        mode: 'goto', // fork | goto | kill | random
        target: node.id, // target node
        event: 'node-end',
        preserveLocation: false,
        // seconds for time-passed, value for text-combo, text-b2b, text-spike
        value: 0,
        valueOperator: '==' // == != > <
      });
    },
    hasTarget(trigger) {
      return eventHasTarget[trigger.mode];
    },
    shiftNode(node, dir) {
      let index = this.nodes.indexOf(node);
      this.nodes.splice(index, 1);
      this.nodes.splice(index+dir, 0, node);
    },
    shiftTrigger(node, trigger, dir) {
      let index = node.triggers.indexOf(trigger);
      node.triggers.splice(index, 1);
      node.triggers.splice(index+dir, 0, trigger);
    },
    removeNode(node) {
      this.nodes.splice(this.nodes.indexOf(node), 1);
    },
    removeTrigger(node, trigger) {
      node.triggers.splice(node.triggers.indexOf(trigger), 1);
    },
    save() {
      browser.storage.local.set({
        musicGraph: JSON.stringify(this.nodes)
      });
      this.saveOpacity = 1.25;
      let timeout = setInterval(() => {
        this.saveOpacity -= 0.1;
        if (this.saveOpacity <= 0)
          clearTimeout(timeout);
      }, 50);
    },
    copyNode(node) {
      this.copiedNode = node;
    },
    copyTrigger(trigger) {
      this.copiedTrigger = trigger;
    },
    moveNode(nodeBefore) {
      this.pasteNode(nodeBefore);
      let index = this.nodes.indexOf(this.copiedNode);
      if (index !== -1) this.nodes.splice(index, 1);
    },
    pasteNode(nodeBefore) {
      if (!this.copiedNode) return;
      let index = this.nodes.indexOf(nodeBefore);
      if (index == -1) index = this.nodes.length;
      let copy = JSON.parse(JSON.stringify(this.copiedNode));
      this.nodes.splice(index, 0, copy);
    },
    pasteTrigger(target) {
      if (!this.copiedTrigger) return;
      let copy = JSON.parse(JSON.stringify(this.copiedTrigger));
      target.triggers.push(copy);
    },
    focus(node) {
      if (typeof node == 'number')
        node = { id: node };

      let target;

      if (node.id === undefined && node.event) { // is a trigger object
        let trigger = node;
        for (let inode of this.nodes) {
          let index = inode.triggers.indexOf(trigger);
          if (index == -1) continue;
          target = document
            .querySelector(`#node-${inode.id} [trigger-index="${index}"]`);
        }
      } else { // is a node object
        target = document.getElementById('node-' + node.id);
      }

      if (!target) return;

      target.scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center'
      });

      target.classList.add('highlighted');
      setTimeout(() => {
        target.classList.remove('highlighted');
      }, 1000);
    },
    toggleVisualEditor() {
      this.showVisualEditor = !this.showVisualEditor;
    }
  },
  mounted() {
    browser.storage.local.get([
      'music', 'musicGraph'
    ]).then(({ music, musicGraph }) => {
      console.log("Loaded", musicGraph);
      this.music = music || [];
      if (!musicGraph) return;
      this.nodes = JSON.parse(musicGraph);
      this.maxId = Math.max(...this.nodes.map(node => node.id));
    });
  }
});
app.$mount('#app');
window.app = app;
