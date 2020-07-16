import {
  events,
  eventValueStrings,
  eventValueExtendedModes,
  eventHasTarget
} from './events.js';
const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div ref="editor" class="visual-editor" :style="editorStyle">
      <template v-for="node of nodes">
        <div
          class="node"
          :node-id="node.id"
          :style="{
            '--x': (node.x + camera.x) + 'px',
            '--y': (node.y + camera.y) + 'px'
          }"
        >{{node.name}}</div>

        <template v-for="{ i, x1, y1, x2, y2 } of getLinks(node, node.triggers)">
          <div
            class="node-anchor origin"
            :node-id="node.id"
            :trigger-index="i"
            :style="{
              '--x': (x1 + camera.x) + 'px',
              '--y': (y1 + camera.y) + 'px'
            }"
          ></div>
          <div
            class="node-anchor target"
            :node-id="node.id"
            :trigger-index="i"
            :style="{
              '--x': (x2 + camera.x) + 'px',
              '--y': (y2 + camera.y) + 'px'
            }"
          ></div>
        </template>
      </template>

      <svg style="width: 100%; height: 100%;">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
              markerWidth="12" markerHeight="12"
              orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>

        <g :transform="svgTransform">
          <template v-for="node of nodes">
            <template v-for="{ trigger, label, i, x1, y1, x2, y2 } of getLinks(node, node.triggers)">
              <line
                :x1="x1" :y1="y1" :x2="x2" :y2="y2"
                stroke="black"
                marker-end="url(#arrow)"
              />
              <text
                :x="(x2+x1)/2"
                :y="(y2+y1)/2"
                :node-id="node.id"
                :trigger-index="i"
                :text-anchor="textAnchorFor(trigger)"
                :dominant-baseline="baselineFor(trigger)"
                :transform="transformFor(trigger)"
              >​{{ label }}</text>
            </template>
          </template>
        </g>
      </svg>
    </div>
  `,
  props: {
    nodes: { type: Array, default: [] }
  },
  data: () => {
    return {
      camera: { x: 0, y: 0 }
    }
  },
  computed: {
    editorStyle() {
      return {
        '--bg-x': this.camera.x + 'px',
        '--bg-y': this.camera.y + 'px'
      }
    },
    svgTransform() {
      return `translate(${this.camera.x}, ${this.camera.y})`
    }
  },
  methods: {
    round(val, step) {
      return Math.round(val / step) * step;
    },
    getNodeById(id) {
      return this.nodes.filter(node => node.id == id)[0];
    },
    getNodeFromElem(elem) {
      let nodeId = elem.getAttribute('node-id');
      return this.getNodeById(nodeId);
    },
    getLinks(node, triggers) {
      return triggers.map((trigger, i) => {
        let target = this.getNodeById(trigger.target);

        let label = trigger.event;
        if (eventValueExtendedModes[trigger.event])
          label += ` ${trigger.valueOperator} ${trigger.value}`;
        label += ' ' + trigger.mode;

        return {
          i,
          label,
          trigger,
          x1: node.x + trigger.anchor.origin.x,
          y1: node.y + trigger.anchor.origin.y,
          x2: target.x + trigger.anchor.target.x,
          y2: target.y + trigger.anchor.target.y
        }
      }).filter(({ trigger }) => {
        if (trigger.target == node.id) return false;
        return eventHasTarget[trigger.mode]
      });
    },
    getTargetedNodeElemFromTriggerElem(handle) {
      let node = this.getNodeFromElem(handle);

      if (this.getHandleTypeFromElem(handle) == 'origin')
        return this.getNodeElemFromNode(node);

      let trigger = this.getTriggerFromElem(handle);
      let target = this.getNodeById(trigger.target);
      return this.getNodeElemFromNode(target);
    },
    getTriggerFromElem(handleElem) {
      let node = this.getNodeFromElem(handleElem);
      let trigId = handleElem.getAttribute('trigger-index');
      let trigger = node.triggers[trigId];
      return trigger;
    },
    getHandleTypeFromElem(handleElem) {
      return handleElem.classList.contains('origin') ? 'origin' : 'target';
    },
    getNodeElemFromNode(node) {
      return document.querySelector(`.node[node-id="${node.id}"]`);
    },

    /* calculations for the <text> in the svg */
    textAnchorFor(trigger) {
      let x = (trigger.anchor.origin.x + trigger.anchor.target.x)/2;
      if (x < 1/3 * 200) return 'end';
      if (x < 2/3 * 200) return 'middle';
      return 'start';
    },
    baselineFor(trigger) {
      let y = (trigger.anchor.origin.y + trigger.anchor.target.y)/2;
      return y < 30 ? 'baseline' : 'hanging';
    },
    transformFor(trigger) {
      let x = (trigger.anchor.origin.x + trigger.anchor.target.x)/2;
      let y = (trigger.anchor.origin.y + trigger.anchor.target.y)/2;
      let tx = x < 1/3 * 200 ? -10 : x > 2/3 * 200 ? 10 : 0;
      let ty = y < 30 ? -5 : 5;
      return `translate(${tx}, ${ty})`;
    }
  },
  mounted() {
    // TODO: Write actual migrator
    function foo() {
      for (let node of this.nodes) {
        if (!node.x) this.$set(node, 'x', 0);
        if (!node.y) this.$set(node, 'y', 0);
        for (let trigger of node.triggers) {
          if (!trigger.anchor) {
            this.$set(trigger, 'anchor', {
              origin: { x: 100, y: 60 },
              target: { x: 100, y:  0 }
            });
          }
        }
      }
    }
    foo = foo.bind(this);
    setInterval(() => foo(), 100);
    foo();

    interact('.visual-editor svg text')
      .on('tap', event => {
        let trigger = this.getTriggerFromElem(event.target);
        this.$emit('focus', trigger);
      });

    interact('.visual-editor')
      .draggable({})
      .on('dragmove', event => {
        this.camera.x += event.dx;
        this.camera.y += event.dy;
      })

    interact('.visual-editor .node')
      .draggable({
        modifiers: [
          interact.modifiers.snap({
            targets: [
              interact.createSnapGrid({ x: 20, y: 20 })
            ],
            relativePoints: [{ x: 0, y: 0 }],
            offset: 'self'
          })
        ]
      })
      .on('dragmove', event => {
        let node = this.getNodeFromElem(event.target);
        node.x += event.dx;
        node.y += event.dy;
      })
      .on('dragend', event => {
        let node = this.getNodeFromElem(event.target);
        node.x = this.round(node.x, 20);
        node.y = this.round(node.y, 20);
      })
      .on('tap', event => {
        let node = this.getNodeFromElem(event.target);
        this.$emit('focus', node);
      });

    interact('.visual-editor .node-anchor')
      .draggable({
        modifiers: [
          interact.modifiers.snap({
            targets: [
              (x, y, interaction, offset, index) => {
                let handle = interaction.element;
                let nodeElem = this.getTargetedNodeElemFromTriggerElem(handle);
                let node = this.getNodeFromElem(nodeElem);
                let trigger = this.getTriggerFromElem(handle);

                let ax1 = node.x + this.camera.x
                let ay1 = node.y + this.camera.y
                let ax2 = ax1 + 200
                let ay2 = ay1 + 60

                let ax1o = Math.abs(ax1 - x);
                let ax2o = Math.abs(ax2 - x);
                let ay1o = Math.abs(ay1 - y);
                let ay2o = Math.abs(ay2 - y);

                switch (Math.min(ax1o, ax2o, ay1o, ay2o)) {
                  case ax1o:
                    if (y < ay1) y = ay1;
                    if (y > ay2) y = ay2;
                    return { x: ax1, y: y, range: Infinity };

                  case ax2o:
                    if (y < ay1) y = ay1;
                    if (y > ay2) y = ay2;
                    return { x: ax2, y: y, range: Infinity };

                  case ay1o:
                    if (x < ax1) x = ax1;
                    if (x > ax2) x = ax2;
                    return { y: ay1, x: x, range: Infinity };

                  case ay2o:
                    if (x < ax1) x = ax1;
                    if (x > ax2) x = ax2;
                    return { y: ay2, x: x, range: Infinity };
                }
              }
            ],
            relativePoints: [{ x: 0, y: 0 }],
            offset: 'parent'
          })
        ]
      })
      .on('dragmove', event => {
        let trigger = this.getTriggerFromElem(event.target);
        let coord = trigger.anchor[this.getHandleTypeFromElem(event.target)];
        coord.x += event.dx;
        coord.y += event.dy;
      })
      .on('dragend', event => {
        let trigger = this.getTriggerFromElem(event.target);
        let coord = trigger.anchor[this.getHandleTypeFromElem(event.target)];


        // let snapXoff =

        // coord.x = this.round(coord.x, 10);
        // coord.y = this.round(coord.y, 10);
      })
  }
}
