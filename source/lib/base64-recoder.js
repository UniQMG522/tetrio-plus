// This is javascript's fault for not having a useful base64 encoding function
// Adapted from https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa#Unicode_strings
function b64Recode(value) {
  let string = JSON.stringify(value);
  let binary = String.fromCharCode(
    ...new Uint8Array(
      new Uint16Array(string.length).map((_,i) => {
        return string.charCodeAt(i);
      }).buffer
    )
  );
  let safeString = btoa(binary);

  return `JSON.parse(String.fromCharCode(...new Uint16Array(new Uint8Array([...atob("${safeString}")].map(v => v.charCodeAt(0))).buffer)))`;
}
