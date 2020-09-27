/* Added by Jabster28 | MIT Licensed */
/* Modified by UniQMG */
(async () => {
  let user = localStorage.userId
    ? (await (await fetch(`/api/users/${localStorage.userID}`, {
        headers: new Headers({
          Authorization: 'Bearer ' + localStorage.userToken,
        }),
      })).json()).user
    : { supporter: false, verified: false, staff: false };

  while (!window.emoteMap)
    await new Promise(res => setTimeout(res, 100));

  const emotes = window.emoteMap;
  const emoteList = [];

  function add(emotes, allowed) {
    for (let key of Object.keys(emotes))
      emoteList.push({ name: key, url: emotes[key], allowed });
  }
  add(emotes.base, true);
  add(emotes.supporter, user.supporter);
  add(emotes.verified, user.verified);
  add(emotes.staff, user.role == 'admin');

  const picker = document.createElement('div');
  picker.classList.add('tetrioplus-emote-picker');
  for (let { name, url, allowed } of emoteList) {
    let img = document.createElement('img');
    img.classList.toggle('disallowed', !allowed);
    picker.appendChild(img);
    if (allowed) {
      img.addEventListener('click', () => {
        chatbox.value += `:${name}:`;
      });
    }
    img.src = '/res/' + url;
  }

  const chat = document.getElementById('room_chat');
  const chatbox = document.getElementById('chat_input');
  chatbox.addEventListener('keydown', evt => {
    if (evt.key != 'Tab') return;
    evt.preventDefault();
    chat.appendChild(picker); // Gets removed when chat is cleared so replace it
    picker.classList.toggle('visible');
  });
})()
