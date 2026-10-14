// Prepares optimised, responsive web assets from the full-resolution masters in source-files/.
// Masters are never published; nothing here is AI-generated or retouched.
// Output: public/media/{products,people,brand}, public/media/og and the favicon set in public/.
import sharp from 'sharp';
import { mkdir, rm, writeFile } from 'node:fs/promises';

const SRC = 'source-files';
const OUT = 'public/media';
for (const dir of ['products', 'people', 'brand', 'og'])
  await rm(`${OUT}/${dir}`, { recursive: true, force: true });
for (const dir of ['products', 'people', 'brand', 'og'])
  await mkdir(`${OUT}/${dir}`, { recursive: true });

// Clean white-background packshots → trimmed, centred 4:3 stages at every width the layout uses.
const PRODUCTS = [
  'dpgest-300-sr',
  'daybone',
  'daybone-d3',
  'dppro-dha',
  'dprun-xt',
  'dp-q10',
  'dpate-liv',
  'lacvac-fiber',
];
const PRODUCT_WIDTHS = [160, 320, 480, 640, 1080];
const STAGE_RATIO = 3 / 4;
const FILL = 0.84;
const OG = { width: 1200, height: 630 };

const trimmedPackshot = (slug) =>
  sharp(`${SRC}/products/${slug}-packshot.webp`)
    .trim({ background: '#ffffff', threshold: 12 })
    .toBuffer();

for (const slug of PRODUCTS) {
  const trimmed = await trimmedPackshot(slug);
  for (const width of PRODUCT_WIDTHS) {
    const height = Math.round(width * STAGE_RATIO);
    const inner = await sharp(trimmed)
      .resize(Math.round(width * FILL), Math.round(height * FILL), {
        fit: 'inside',
      })
      .toBuffer();
    await sharp({
      create: { width, height, channels: 3, background: '#ffffff' },
    })
      .composite([{ input: inner, gravity: 'centre' }])
      .webp({ quality: width > 700 ? 80 : 78 })
      .toFile(`${OUT}/products/${slug}-${width}.webp`);
  }
  // Open Graph card: packshot centred on white, 1200×630 JPEG (widest platform support).
  const ogInner = await sharp(trimmed)
    .resize(Math.round(OG.width * 0.8), Math.round(OG.height * 0.84), {
      fit: 'inside',
    })
    .toBuffer();
  await sharp({ create: { ...OG, channels: 3, background: '#ffffff' } })
    .composite([{ input: ogInner, gravity: 'centre' }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${OUT}/og/${slug}.jpg`);
}

// People photography cropped from the supplied brand creatives, clear of overlaid text.
const FAMILY_BOX = { left: 0, top: 302, width: 800, height: 527 };
const photos = [
  {
    name: 'family',
    src: `${SRC}/brand/brand-creative-family.jpeg`,
    box: FAMILY_BOX,
    widths: [480, 800],
  },
  {
    name: 'doctor',
    src: `${SRC}/brand/brand-creative-doctor.jpeg`,
    box: { left: 1050, top: 0, width: 486, height: 700 },
    widths: [360, 486],
  },
];
for (const { name, src, box, widths } of photos) {
  for (const width of widths) {
    const image = sharp(src).extract(box).resize(width);
    await image
      .clone()
      .webp({ quality: 74 })
      .toFile(`${OUT}/people/${name}-${width}.webp`);
    await image
      .clone()
      .avif({ quality: 52 })
      .toFile(`${OUT}/people/${name}-${width}.avif`);
  }
}

// Logo emblem: sized for the 44–62 px slots it fills (1x, 2x, 3x) plus a square schema logo.
const LOGO = `${SRC}/brand/dp-life-remedies-logo.jpeg`;
const EMBLEM = { left: 211, top: 385, width: 785, height: 564 };
for (const width of [64, 128, 192])
  await sharp(LOGO)
    .extract(EMBLEM)
    .resize(width)
    .webp({ quality: 90 })
    .toFile(`${OUT}/brand/logo-${width}.webp`);
await sharp(LOGO)
  .extract(EMBLEM)
  .resize(512, 512, { fit: 'contain', background: '#ffffff' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(`${OUT}/brand/logo-512.png`);

// Default social card: brand family photo, 1200×630.
await sharp(`${SRC}/brand/brand-creative-family.jpeg`)
  .extract(FAMILY_BOX)
  .resize(OG.width, OG.height, { fit: 'cover', position: 'top' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(`${OUT}/og/default.jpg`);

// Favicons: the "DP" emblem on a solid white square, padded so it stays legible at 16–48 px.
const ICON_BOX = { left: 270, top: 395, width: 680, height: 500 };
const iconPng = (size, pad = 0.08) =>
  sharp(LOGO)
    .extract(ICON_BOX)
    .resize(
      Math.round(size * (1 - pad * 2)),
      Math.round(size * (1 - pad * 2)),
      {
        fit: 'contain',
        background: '#ffffff',
      },
    )
    .extend({
      top: Math.round(size * pad),
      bottom: size - Math.round(size * (1 - pad * 2)) - Math.round(size * pad),
      left: Math.round(size * pad),
      right: size - Math.round(size * (1 - pad * 2)) - Math.round(size * pad),
      background: '#ffffff',
    })
    .flatten({ background: '#ffffff' })
    .png({ compressionLevel: 9, palette: size >= 180, quality: 90 })
    .toBuffer();

const icons = {
  'favicon-48x48.png': 48,
  'favicon-96x96.png': 96,
  'apple-touch-icon.png': 180,
  'web-app-manifest-192x192.png': 192,
  'web-app-manifest-512x512.png': 512,
};
for (const [file, size] of Object.entries(icons))
  await writeFile(`public/${file}`, await iconPng(size));

// favicon.ico: a single 48×48 PNG-encoded entry (valid ICO, supported by all current browsers).
const ico48 = await iconPng(48);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count
header.writeUInt8(48, 6); // width
header.writeUInt8(48, 7); // height
header.writeUInt8(0, 8); // palette
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(ico48.length, 14); // data size
header.writeUInt32LE(22, 18); // data offset
await writeFile('public/favicon.ico', Buffer.concat([header, ico48]));

// favicon.svg: the supplied logo is raster-only, so the SVG wraps a 96 px rendering (tab sizes are 16–32 px).
const svgPng = (await iconPng(96)).toString('base64');
await writeFile(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192"><rect width="192" height="192" fill="#ffffff"/><image width="192" height="192" href="data:image/png;base64,${svgPng}"/></svg>\n`,
);

console.log('Prepared product, people, brand, Open Graph and favicon assets.');
