// Optional AI-generated imagery produced server-side by `npm run images`.
// Each slot falls back to authentic client imagery until its asset exists.
import manifest from './generated-media.json';

export interface GeneratedFile {
  src: string;
  width: number;
  height: number;
}
export interface GeneratedImage {
  alt: string;
  orientation: 'landscape' | 'portrait' | 'square';
  files: GeneratedFile[];
}

const assets = manifest as unknown as Record<string, GeneratedImage>;

export const generated = (id: string): GeneratedImage | undefined =>
  assets[id]?.files?.length ? assets[id] : undefined;

export const generatedSrcset = (image: GeneratedImage): string =>
  image.files.map((f) => `${f.src} ${f.width}w`).join(', ');

export const largest = (image: GeneratedImage): GeneratedFile =>
  image.files[image.files.length - 1];

export const brand = {
  family: {
    src: '/media/brand/family-800.webp',
    srcset:
      '/media/brand/family-480.webp 480w, /media/brand/family-800.webp 800w',
    width: 800,
    height: 527,
    alt: 'Smiling family embracing outdoors, from the DP Life Remedies brand creative',
  },
  doctor: {
    src: '/media/brand/doctor-486.webp',
    srcset:
      '/media/brand/doctor-360.webp 360w, /media/brand/doctor-486.webp 486w',
    width: 486,
    height: 700,
    alt: 'Healthcare professional in a white coat with a stethoscope, from the DP Life Remedies brand creative',
  },
} as const;
