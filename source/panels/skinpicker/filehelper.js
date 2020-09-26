export default async function readfiles(input) {
  let files = [];

  for (let file of input.files) {
    var reader = new FileReader();
    reader.readAsDataURL(file, "UTF-8");

    reader.onerror = function (evt) {
      alert("Failed to load image");
    }

    await new Promise(res => {
      reader.onload = evt => {
        files.push({
          name: file.name,
          type: file.type,
          data: evt.target.result
        });
        res();
      };
    });
  }

  return files;
}
