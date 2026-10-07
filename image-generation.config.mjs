// Central configuration for server-side OpenAI image generation.
// Change model names, quality levels or sizes here — the generator reads everything from this file.
// The API key is never stored here: it is read from the OPENAI_API_KEY environment variable.

export const imageConfig = {
  endpoint: 'https://api.openai.com/v1/images',
  models: {
    // Default: fast, cost-efficient model for routine website imagery.
    standard: process.env.OPENAI_IMAGE_MODEL_STANDARD || 'gpt-image-2.5-flare',
    // Premium: precision model for hero, people, interiors, reference-based or detail-sensitive assets.
    premium: process.env.OPENAI_IMAGE_MODEL_PREMIUM || 'gpt-image-2.5-sunburst',
  },
  quality: {
    default: 'medium',
    premium: 'high',
  },
  sizes: {
    square: '1024x1024',
    landscape: '1536x1024',
    portrait: '1024x1536',
  },
  outputFormat: 'png',
  // Traits that justify the premium model. One "strong" trait is enough; otherwise two premium traits are needed.
  routing: {
    strongTraits: [
      'reference-image',
      'appearance-preservation',
      'product-consistency',
      'person-consistency',
      'precise-brand-placement',
      'precise-product-placement',
      'architecture',
      'interior',
      'industrial-machinery',
      'multiple-subjects',
    ],
    premiumTraits: [
      'hero',
      'photorealistic',
      'people',
      'complex-composition',
      'complex-lighting',
      'commercial-scene',
      'complex-product',
      'detail-sensitive',
    ],
    highQualityPriorities: ['critical', 'high'],
  },
  // Optimisation of generated rasters for the website.
  output: {
    dir: 'public/media/generated',
    manifest: 'src/data/generated-media.json',
    widths: {
      landscape: [768, 1536],
      portrait: [512, 1024],
      square: [512, 1024],
    },
    webpQuality: 80,
  },
  requestTimeoutMs: 180_000,
};
