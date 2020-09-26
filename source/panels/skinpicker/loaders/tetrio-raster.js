export const name = 'Tetrio png/jpg';
export const desc = 'A raster image at a 12.4 aspect ratio with 12 blocks';
export const extrainputs = [];
export function test(files) {
  if (files.length != 1) return false;
  if (files[0].type == 'image/gif' || files[0].type == 'image/svg+xml')
    return false;
  let aspect = files[0].image.width / files[0].image.height;
  return aspect == 12.4;
}
export async function load(files) {
  let file = files[0];

  let placeholder = browser.extension.getURL('resources/template.svg');
  let template = await (await fetch(placeholder)).text();
  let svg = template.replace('<!--custom-image-embed-->', file.data);

  await browser.storage.local.set({
    skinSvg: svg,
    skinPng: file.data,
    skinAnim: file.data,
    skinAnimMeta: {
      frames: 1,
      frameWidth: file.image.width,
      frameHeight: file.image.height,
      delay: 60
    }
  });
}
