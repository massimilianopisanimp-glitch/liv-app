import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT  = 'C:/Users/Massi/Downloads/logo.png.jpeg';
const OUTPUT = path.resolve(__dirname, '../public/logo.png');

// Target colour #E8725C
const TR = 0xE8, TG = 0x72, TB = 0x5C;
const TOLERANCE = 40;

function dist(r, g, b) {
  return Math.sqrt((r - TR) ** 2 + (g - TG) ** 2 + (b - TB) ** 2);
}

(async () => {
  const image = sharp(INPUT).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // channels === 4 after ensureAlpha

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (dist(r, g, b) <= TOLERANCE) {
      // transparent
      data[i]     = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 0;
    } else {
      // white, fully opaque
      data[i]     = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }

  await sharp(Buffer.from(data), { raw: { width, height, channels } })
    .png()
    .toFile(OUTPUT);

  console.log('Saved:', OUTPUT);
})();
