import {
  events,
  eventValueStrings,
  eventValueExtendedModes,
  eventHasTarget
} from './events.js';
import * as clipboard from './clipboard.js';
const html = arg => arg.join(''); // NOOP, for editor integration.

export default {
  template: html`
    <div>
      <!-- <pre>{{ trigger }}</pre> -->
      <div>
        <b>Event</b>
        <select v-model="trigger.event">
          <option
            v-for="evt of events"
            :value="evt"
            :disabled="trigger.mode == 'random' && evt == 'random-target'"
          >{{evt}}</option>
        </select>
        <button @click="removeTrigger(node, trigger)" class="icon-button">
          ❌
        </button>
        <button @click="copyTrigger(trigger)">Copy</button>
        <button @click="shiftTrigger(node, trigger, -1)" class="icon-button">
          🔼
        </button>
        <button @click="shiftTrigger(node, trigger, 1)" class="icon-button">
          🔽
        </button>
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
      <template v-if="allowsPreserveLocation(trigger)">
        <div class="form-control">
          <input type="checkbox" v-model="trigger.preserveLocation" />
          Preserve location after jumping
        </div>
        <div class="form-control" v-if="trigger.preserveLocation">
          Length ratio <input
            type="number"
            v-model.number="trigger.locationMultiplier"
            step="0.001"
            min="0.001"
          />
          <span class="form-control-value-display">
            (target / source)
          </span>
        </div>
      </template>
      <template v-if="allowsCrossfade(trigger)">
        <div class="form-control">
          <input type="checkbox" v-model="trigger.crossfade" />
          Crossfade
        </div>
        <div class="form-control" v-if="trigger.crossfade">
          Crossfade duration <input
            type="number"
            v-model.number="trigger.crossfadeDuration"
            step="0.001"
            min="0"
          />s
        </div>
      </template>
    </div>
  `,
  props: ['nodes', 'node', 'trigger'],
  data: () => {
    return {
      events,
      eventValueStrings,
      eventValueExtendedModes,
      clipboard: clipboard.clipboard
    }
  },
  computed: {
    ...clipboard.computed
  },
  methods: {
    allowsCrossfade(trigger) {
      return (
        trigger.mode == 'goto' &&
        this.hasTarget(trigger) &&
        this.targetHasAudio(trigger)
      );
    },
    allowsPreserveLocation(trigger) {
      return (
        this.hasTarget(trigger) &&
        this.targetHasAudio(trigger)
      );
    },
    focus(node) {
      this.$emit('focus', node);
    },
    targetHasAudio(trigger) {
      let node = this.nodes.filter(node => node.id == trigger.target)[0];
      if (!node) return false;
      return !!node.audio;
    },
    hasTarget(trigger) {
      return eventHasTarget[trigger.mode];
    },
    shiftTrigger(node, trigger, dir) {
      let index = node.triggers.indexOf(trigger);
      node.triggers.splice(index, 1);
      node.triggers.splice(index+dir, 0, trigger);
    },
    removeTrigger(node, trigger) {
      node.triggers.splice(node.triggers.indexOf(trigger), 1);
    },
    copyTrigger(trigger) {
      this.copiedTrigger = trigger;
    }
  }
}
