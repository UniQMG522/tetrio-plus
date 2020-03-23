browser.webRequest.onBeforeRequest.addListener(
  request => {
    console.log("[SVG filter] Filtering", request.url);

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
      browser.storage.local.get('skin').then(({ skin }) => {
        if (skin) {
          console.log("Writing custom skin");
          filter.write(encoder.encode(skin));
        } else {
          console.log("No custom skin, writing original buffer");
          for (let str of originalData) {
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
