import VisualEditor from './visual-editor.js';
import NodeEditor from './node-editor.js';
import * as clipboard from './clipboard.js';
const html = arg => arg.join(''); // NOOP, for editor integration.


const app = new Vue({
  template: html`
    <div class="split-pane">
      <div class="node-editor">
        <div class="pane-header">
          <button @click="save">Save changes</button>
          <span :style="{ opacity: this.saveOpacity }">Saved!</span>
        </div>
        <div class="node-list">
          <node-editor
            v-for="node of nodes"
            :key="node.id"
            :nodes="nodes"
            :node="node"
            @pasteNode="pasteNode"
            @focus="focus"
          />
        </div>
        <button @click="addNode()">Add node</button>
        <button @click="pasteNode()" :disabled="!copiedNode">Paste node</button>
        <div class="scroll-past-end"></div>
      </div>
      <visual-editor :nodes="nodes" @focus="focus" />
    </div>
  `,
  data: {
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
    clipboard: clipboard.clipboard
  },
  components: { NodeEditor, VisualEditor },
  computed: {
    ...clipboard.computed
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
        effects: {
          volume: 1,
          speed: 1
        },
        x: 0,
        y: 0
      })
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
    pasteNode(nodeBefore) {
      if (!this.copiedNode) return;
      let index = this.nodes.indexOf(nodeBefore);
      if (index == -1) index = this.nodes.length;
      let copy = JSON.parse(JSON.stringify(this.copiedNode));
      copy.id = ++this.maxId;
      this.nodes.splice(index, 0, copy);
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
          let nodeEl = document.getElementById('node-' + inode.id);
          target = nodeEl.querySelector(`[trigger-index="${index}"]`);
          // fallback when collapsed with v-show: false (i.e. `display: none`)
          if (!target.offsetParent) target = nodeEl;
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
    }
  },
  mounted() {
    browser.storage.local.get('musicGraph').then(({ musicGraph }) => {
      console.log("Loaded", musicGraph);
      if (!musicGraph) return;
      this.nodes = JSON.parse(musicGraph);
      this.maxId = Math.max(...this.nodes.map(node => node.id));
    });
  }
});
app.$mount('#app');
window.app = app;
