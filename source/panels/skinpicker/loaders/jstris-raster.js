export const name = 'Jstris png/jpg';
export const desc = 'A raster image at a 9.0 aspect ratio with 9 blocks';
export const extrainputs = [];
export function test(files) {
  if (files.length != 1) return false;
  if (files[0].type == 'image/gif') return false;
  let aspect = files[0].image.width / files[0].image.height;
  return aspect == 9;
}
export function convertToTetrio(image) {
  let canvas = document.createElement('canvas');
  canvas.width = image.width * 12 / 9;
  canvas.height = image.height;
  let ctx = canvas.getContext('2d');

  // Jstris format: Garbage, Ghost, ROYGBIV
  // Tetrio format: ROYGBIV, Ghost, Garbage, Garbage 2, Dark garbage, Top-out warning
  let shuffle = [2, 3, 4, 5, 6, 7, 8, 1, 0, 0, 0, 0];
  let step = image.height;
  for (let i = 0; i < 12; i++) {
    ctx.drawImage(
      image,
      shuffle[i]*step, 0, step, step,
      i*step, 0, step, step
    )
  }

  return canvas;
}
import { load as loadtetrio } from './tetrio-raster.js';
export async function load(files) {
  let file = files[0];
  let image = convertToTetrio(file.image);
  let data = tetrio.toDataURL('image/png');
  await loadtetrio([{ ...file, image, data }]);
}
