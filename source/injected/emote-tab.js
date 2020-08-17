/* Added by Jabster28 | MIT Licensed */
(() => {
  // i used typescript to write this initally, so there will be some polyfills
  // the 'document ===  null || etc' stuff are the aftermaths of non-null 
  // assertions, i'll keep them cause why not

  // cross-browser array spreading
  var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };

  var emotes = window.emoteMap
  var supporter = false;
  var cycle = '';
  var cyclenum = 0;
  var emote = document === null || document === void 0 ? void 0 : document.querySelector('#chat_input');
  var emoteChecker = function () {
    var _a;
    var text = (_a = emote === null || emote === void 0 ? void 0 : emote.value) === null || _a === void 0 ? void 0 : _a.split(' ').pop();
    if (text && /^:\w*$/.exec(text))
      return text;
    else
      return undefined;
  };
  window.addEventListener('keydown', function (e) {
    var _a;
    if (e.key == 'Tab') {
      if ((_a = document === null || document === void 0 ? void 0 : document.querySelector('#me_supporter')) === null || _a === void 0 ? void 0 : _a.offsetParent)
        supporter = true;
      if (!cycle) {
        var text = emoteChecker();
        if (text) {
          var results = fuzzball.extract(text, __spreadArrays(Object.keys(emotes.base), (supporter ? Object.keys(emotes.supporter) : [])));
          if (results[0][1] < 50)
            return;
          var oldtext = emote.value.split(' ');
          oldtext.pop();
          emote.value = __spreadArrays(oldtext, [':' + results[0][0] + ':']).join(' ');
          cycle = text;
          cyclenum = 1;
        }
      }
      else {
        var results = fuzzball.extract(cycle, __spreadArrays(Object.keys(emotes.base), (supporter ? Object.keys(emotes.supporter) : [])));
        if (results[cyclenum][1] < 50) {
          cyclenum = 0;
          var text = emoteChecker();
          if (text) {
            var results_1 = fuzzball.extract(text, __spreadArrays(Object.keys(emotes.base), (supporter ? Object.keys(emotes.supporter) : [])));
            if (results_1[0][1] < 50)
              return;
            var oldtext_1 = emote.value.split(' ');
            oldtext_1.pop();
            emote.value = __spreadArrays(oldtext_1, [':' + results_1[0][0] + ':']).join(' ');
            cycle = text;
            cyclenum = 1;
          }
          return;
        }
        if (cyclenum >= results.length || cyclenum >= 10)
          cyclenum = 0;
        var oldtext = emote.value.split(' ');
        oldtext.pop();
        emote.value = __spreadArrays(oldtext, [':' + results[cyclenum][0] + ':']).join(' ');
        cyclenum++;
      }
    }
    else {
      cycle = '';
      cyclenum = 0;
    }
  });
})()
