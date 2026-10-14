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

/** People photography cropped from the supplied brand creatives (AVIF + WebP). */
export interface Photo {
  src: string;
  srcset: string;
  avifSrcset: string;
  width: number;
  height: number;
  alt: string;
}
export const brand: Record<'family' | 'doctor', Photo> = {
  family: {
    src: '/media/people/family-800.webp',
    srcset:
      '/media/people/family-480.webp 480w, /media/people/family-800.webp 800w',
    avifSrcset:
      '/media/people/family-480.avif 480w, /media/people/family-800.avif 800w',
    width: 800,
    height: 527,
    alt: 'Smiling family embracing outdoors, from the DP Life Remedies brand creative',
  },
  doctor: {
    src: '/media/people/doctor-486.webp',
    srcset:
      '/media/people/doctor-360.webp 360w, /media/people/doctor-486.webp 486w',
    avifSrcset:
      '/media/people/doctor-360.avif 360w, /media/people/doctor-486.avif 486w',
    width: 486,
    height: 700,
    alt: 'Healthcare professional in a white coat with a stethoscope, from the DP Life Remedies brand creative',
  },
};
