browser.runtime.onMessage.addListener(function(msg) {
  if (msg.type != 'setskin') return false;
  browser.storage.sync.set({ skin: msg.value });
  console.log("Set skin to " + msg.value);
  return true;
});

browser.webRequest.onBeforeRequest.addListener(
  request => {
    console.log("Filtering", request.url);

    let filter = browser.webRequest.filterResponseData(request.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    let originalData = [];
    filter.ondata = event => {
      let str = decoder.decode(event.data, {stream: true});
      originalData.push(str);
    }

    filter.onstop = evt => {
      console.log("Rewriting data");
      browser.storage.sync.get('skin').then(({ skin }) => {
        if (skin) {
          console.log("Writing custom skin");
          filter.write(encoder.encode(skin));
        } else {
          console.log("No custom skin, writing original buffer");
          for (let str of originalData) {
            console.log(str);
            filter.write(encoder.encode(str))
          }
        }
        filter.close();
      });
    }

    return {};
  },
  { urls: ["https://tetr.io/res/minos.svg"] },
  ["blocking"]
)
