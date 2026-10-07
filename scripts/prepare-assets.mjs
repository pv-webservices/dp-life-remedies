// Prepares optimised, responsive WebP assets from the client-supplied source images.
// Original client files live in source-assets/ and are preserved; nothing here is AI-generated or retouched.
import sharp from 'sharp';
import { mkdir, rm } from 'node:fs/promises';

const OUT = 'public/media';
for (const dir of ['products', 'brand'])
  await rm(`${OUT}/${dir}`, { recursive: true, force: true });
await mkdir(`${OUT}/products`, { recursive: true });
await mkdir(`${OUT}/brand`, { recursive: true });

// Clean white-background packshots (Product image-Na.webp) → trimmed, centred 4:3 stages.
const products = [
  ['dpgest-300-sr', 1],
  ['daybone', 2],
  ['daybone-d3', 3],
  ['dppro-dha', 4],
  ['dprun-xt', 5],
  ['dp-q10', 6],
  ['dpate-liv', 7],
  ['lacvac-fiber', 8],
];
const PRODUCT_WIDTHS = [320, 640, 1080];
const STAGE_RATIO = 3 / 4;
const FILL = 0.84;

for (const [slug, n] of products) {
  const trimmed = await sharp(`source-assets/Product image-${n}a.webp`)
    .trim({ background: '#ffffff', threshold: 12 })
    .toBuffer({ resolveWithObject: true });
  for (const width of PRODUCT_WIDTHS) {
    const height = Math.round(width * STAGE_RATIO);
    const inner = await sharp(trimmed.data)
      .resize(Math.round(width * FILL), Math.round(height * FILL), {
        fit: 'inside',
      })
      .toBuffer();
    await sharp({
      create: { width, height, channels: 3, background: '#ffffff' },
    })
      .composite([{ input: inner, gravity: 'centre' }])
      .webp({ quality: width > 700 ? 82 : 84 })
      .toFile(`${OUT}/products/${slug}-${width}.webp`);
  }
}

// Brand photography from the supplied creatives, cropped clear of overlaid text and swooshes.
const photos = [
  {
    name: 'family',
    src: 'source-assets/wesbite image-1.jpeg',
    box: { left: 0, top: 302, width: 800, height: 527 },
    widths: [480, 800],
  },
  {
    name: 'doctor',
    src: 'source-assets/wesbite image-2.jpeg',
    box: { left: 1050, top: 0, width: 486, height: 700 },
    widths: [360, 486],
  },
];
for (const { name, src, box, widths } of photos) {
  for (const width of widths)
    await sharp(src)
      .extract(box)
      .resize(width)
      .webp({ quality: 84 })
      .toFile(`${OUT}/brand/${name}-${width}.webp`);
}

// Logo emblem (retina) and favicon.
const emblem = { left: 211, top: 385, width: 785, height: 564 };
for (const width of [160, 320])
  await sharp('source-assets/dp line remedies website logo.jpeg')
    .extract(emblem)
    .resize(width)
    .webp({ quality: 92 })
    .toFile(`${OUT}/brand/logo-${width}.webp`);
await sharp('source-assets/dp line remedies website logo.jpeg')
  .extract(emblem)
  .resize(64, 64, { fit: 'contain', background: '#ffffff' })
  .png()
  .toFile('public/favicon.png');
await sharp('source-assets/dp line remedies website logo.jpeg')
  .extract(emblem)
  .resize(180, 180, { fit: 'contain', background: '#ffffff' })
  .png()
  .toFile('public/apple-touch-icon.png');

// Social sharing image: brand family photo, 1200×630.
await sharp('source-assets/wesbite image-1.jpeg')
  .extract({ left: 0, top: 302, width: 800, height: 527 })
  .resize(1200, 630, { fit: 'cover', position: 'top' })
  .webp({ quality: 80 })
  .toFile(`${OUT}/brand/social.webp`);

console.log('Prepared product, brand and icon assets in public/media.');
