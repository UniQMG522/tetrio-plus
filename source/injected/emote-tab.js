/* Added by Jabster28 | MIT Licensed */
(async () => {

  var get = await fetch(`/api/users/${localStorage.userID}`, {
    headers: new Headers({
      Authorization: 'Bearer ' + localStorage.userToken,
    }),
  });
  var { user } = await get.json();


  var emotes = window.emoteMap;
  var cycle = '';
  var cyclenum = 0;
  var emote = document.querySelector('#chat_input');

  var emoteChecker = () => {
    var text = emote.value.split(' ').pop();
    if (text && /^:\w*$/.exec(text)) return text;
    else return undefined;
  };
  
  window.addEventListener('keydown', (e) => {
    if (e.key == 'Tab') {
      var results, text;
      if (!cycle) {
        text = emoteChecker();
        if (text) {
          results = fuzzball.extract(text, [
            ...Object.keys(emotes.base),
            ...(user.supporter ? Object.keys(emotes.supporter) : []),
            ...(user.verified ? Object.keys(emotes.verified) : []),
            ...(user.role == 'admin' ? Object.keys(emotes.staff) : []),
          ]);
          if (results[0][1] < 50) return;
          var oldtext = emote.value.split(' ');
          oldtext.pop();
          emote.value = [...oldtext, ':' + results[0][0] + ':'].join(' ');
          cycle = text;
          cyclenum = 1;
        }
      } else {
        results = fuzzball.extract(cycle, [
          ...Object.keys(emotes.base),
          ...(user.supporter ? Object.keys(emotes.supporter) : []),
          ...(user.verified ? Object.keys(emotes.verified) : []),
          ...(user.role == 'admin' ? Object.keys(emotes.staff) : []),
        ]);
        if (results[cyclenum][1] < 50) {
          cyclenum = 0;
          text = emoteChecker();
          if (text) {
            results = fuzzball.extract(text, [
              ...Object.keys(emotes.base),
              ...(user.supporter ? Object.keys(emotes.supporter) : []),
              ...(user.verified ? Object.keys(emotes.verified) : []),
              ...(user.role == 'admin' ? Object.keys(emotes.staff) : []),
            ]);
            if (results[0][1] < 50) return;
            oldtext = emote.value.split(' ');
            oldtext.pop();
            emote.value = [...oldtext, ':' + results[0][0] + ':'].join(' ');
            cycle = text;
            cyclenum = 1;
          }
          return;
        }
        if (cyclenum >= results.length || cyclenum >= 10) cyclenum = 0;
        oldtext = emote.value.split(' ');
        oldtext.pop();
        emote.value = [...oldtext, ':' + results[cyclenum][0] + ':'].join(' ');
        cyclenum++;
      }
    } else {
      cycle = '';
      cyclenum = 0;
    }
  });
})()
