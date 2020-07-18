export const clipboard = {
  copiedTrigger: null,
  copiedNode: null
};

export const computed = {
  copiedTrigger: {
    get() { return clipboard.copiedTrigger; },
    set(val) { clipboard.copiedTrigger = val; }
  },
  copiedNode: {
    get() { return clipboard.copiedNode; },
    set(val) { clipboard.copiedNode = val; }
  }
};
