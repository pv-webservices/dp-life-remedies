export const divisions = [
  {
    slug: 'tablets',
    name: 'Tablets',
    short: 'Tablets',
    icon: 'pill',
    text: 'Explore tablet formulations in our pharmaceutical and healthcare portfolio.',
  },
  {
    slug: 'softgel-capsules',
    name: 'Softgel Capsules',
    short: 'Softgels',
    icon: 'capsule',
    text: 'Discover our soft gelatin capsule portfolio and composition details.',
  },
  {
    slug: 'syrups',
    name: 'Syrups',
    short: 'Syrups',
    icon: 'bottle',
    text: 'Browse liquid formulations with product and pack information.',
  },
  {
    slug: 'oral-solutions',
    name: 'Oral Solutions',
    short: 'Oral Solutions',
    icon: 'drop',
    text: 'Explore oral solution products and their supplied specifications.',
  },
  {
    slug: 'protein-nutrition',
    name: 'Protein & Nutrition',
    short: 'Nutrition',
    icon: 'jar',
    text: 'Discover the nutrition portfolio, including protein powder with DHA.',
  },
] as const;
export type Product = {
  slug: string;
  name: string;
  division: string;
  segment: string;
  form: string;
  summary: string;
  pack: string;
  basis?: string;
  composition: [string, string][];
  color: string;
  note?: string;
  source: string;
};
export const products: Product[] = [
  {
    slug: 'dpgest-300-sr',
    name: 'DPGEST-300 SR',
    division: 'tablets',
    segment: 'Women’s Health',
    form: 'Sustained release tablets',
    summary: 'Natural Micronised Progesterone IP 300 mg',
    pack: '1 × 10 tablets',
    basis: 'Per tablet',
    composition: [
      ['Natural Micronised Progesterone IP (sustained release)', '300 mg'],
    ],
    color: 'pink',
    source: 'Product image-1.jpeg',
  },
  {
    slug: 'daybone',
    name: 'DAYBONE',
    division: 'tablets',
    segment: 'Bone & Joint Care',
    form: 'Tablets',
    summary: 'Calcium Aspartate, Magnesium, Zinc, Vitamin D3 & Cyanocobalamin',
    pack: '10 × 15 tablets',
    basis: 'Per tablet',
    composition: [
      ['Calcium Aspartate', '1200 mg'],
      ['Elemental Magnesium', '150 mg'],
      ['Elemental Zinc', '10 mg'],
      ['Vitamin D3', '1000 IU (25 mcg)'],
      ['Cyanocobalamin', '2.5 mcg'],
    ],
    color: 'green',
    source: 'Product image-2.jpeg',
  },
  {
    slug: 'daybone-d3',
    name: 'DAYbone D3',
    division: 'oral-solutions',
    segment: 'Bone & Joint Care',
    form: 'Oral solution',
    summary: 'Cholecalciferol (Vitamin D3) IP 60,000 IU',
    pack: '4 × 5 ml bottles',
    basis: 'Per 4–5 ml, as stated in supplied artwork',
    composition: [['Cholecalciferol (Vitamin D3) IP', '60,000 IU']],
    color: 'gold',
    source: 'Product image-3.jpeg',
  },
  {
    slug: 'dppro-dha',
    name: 'DPpro DHA',
    division: 'protein-nutrition',
    segment: 'Nutrition',
    form: 'Protein powder',
    summary: 'Protein powder with DHA, vitamins, minerals & prebiotic',
    pack: '200 g',
    basis: 'Selected ingredients per 200 g',
    composition: [
      ['Protein Concentrate & Milk Protein Isolate', '30 g'],
      ['DHA (Algal DHA)', '200 mg'],
      ['Choline Bitartrate', '250 mg'],
      ['Calcium Citrate', '500 mg'],
      ['Vitamin D3', '600 IU'],
      ['Magnesium', '100 mg'],
      ['FOS (Prebiotic)', '2 g'],
    ],
    color: 'green',
    note: 'Chocolate flavour is shown on the supplied packaging.',
    source: 'Product image-4.jpeg',
  },
  {
    slug: 'dprun-xt',
    name: 'DPrun XT',
    division: 'tablets',
    segment: 'Nutritional Supplements',
    form: 'Film-coated tablets',
    summary: 'Folic Acid, Zinc Sulphate & Vitamin B12',
    pack: '3 × 10 tablets',
    composition: [
      ['Folic Acid', ''],
      ['Zinc Sulphate', ''],
      ['Vitamin B12 (Cyanocobalamin)', ''],
    ],
    color: 'pink',
    note: 'Please contact our team for confirmed ingredient strengths and current pack details.',
    source: 'Product image-5.jpeg',
  },
  {
    slug: 'dp-q10',
    name: 'DP-Q10',
    division: 'softgel-capsules',
    segment: 'Nutritional Supplements',
    form: 'Softgel capsules',
    summary: 'Coenzyme Q10, Lycopene, Omega-3, vitamins & minerals',
    pack: '10 × 1 × 10 softgel capsules',
    basis: 'Per capsule (approximate values in supplied artwork)',
    composition: [
      ['Coenzyme Q10', '100 mg'],
      ['Lycopene', '10 mg'],
      ['Zinc', '17 mg'],
      ['Omega-3 Fatty Acid', '150 mg'],
      ['Selenium', '70 mcg'],
      ['Vitamin C', '80 mg'],
      ['Vitamin E', '15 IU'],
    ],
    color: 'blue',
    source: 'Product image-6.jpeg',
  },
  {
    slug: 'dpate-liv',
    name: 'DPATE LIV',
    division: 'syrups',
    segment: 'Nutraceuticals',
    form: 'Syrup',
    summary: 'Silymarin Extract, vitamins & other nutritional ingredients',
    pack: '200 ml',
    basis: 'Selected ingredients per 5 ml (approximate values)',
    composition: [
      ['Silymarin Extract', '140 mg'],
      ['Vitamin E', '200 IU'],
      ['L-Ornithine L-Aspartate', '150 mg'],
      ['L-Glutathione', '25 mg'],
      ['N-Acetyl L-Cysteine', '75 mg'],
      ['L-Carnitine Tartrate', '50 mg'],
      ['Co-Enzyme Q10', '2.5 mg'],
    ],
    color: 'pink',
    note: 'The supplied label describes this product as a nutraceutical, not for medicinal use.',
    source: 'Product image-7.webp',
  },
  {
    slug: 'lacvac-fiber',
    name: 'LACVAC FIBER',
    division: 'syrups',
    segment: 'Digestive Portfolio',
    form: 'Syrup',
    summary: 'Lactitol Monohydrate & Wheat Dextrin',
    pack: '200 ml',
    basis: 'Per 15 ml, as shown on the supplied carton',
    composition: [
      ['Lactitol Monohydrate', '10 g'],
      ['Wheat Dextrin (Resistant Dextrin)', '3.5 g'],
    ],
    color: 'green',
    note: 'Orange flavour is shown on the supplied packaging.',
    source: 'Product image-8.jpeg',
  },
];
export type Division = (typeof divisions)[number];
export const divisionFor = (slug: string): Division =>
  divisions.find((d) => d.slug === slug)!;
export const productsIn = (slug: string): Product[] =>
  products.filter((p) => p.division === slug);
export const segments: string[] = [...new Set(products.map((p) => p.segment))];
export const forms: string[] = [...new Set(products.map((p) => p.form))];
export type ImageWidth = 320 | 640 | 1080;
export const productImage = (slug: string, width: ImageWidth = 640): string =>
  `/media/products/${slug}-${width}.webp`;
export const productSrcset = (slug: string): string =>
  ([320, 640, 1080] as const)
    .map((w) => `${productImage(slug, w)} ${w}w`)
    .join(', ');
export const searchText = (p: Product): string =>
  [p.name, p.summary, p.segment, p.form, ...p.composition.map(([i]) => i)]
    .join(' ')
    .toLowerCase();
export const countLabel = (n: number): string =>
  `${n} ${n === 1 ? 'product' : 'products'}`;
export const relatedFor = (product: Product): Product[] =>
  products
    .filter(
      (p) =>
        p.slug !== product.slug &&
        (p.division === product.division || p.segment === product.segment),
    )
    .slice(0, 3);
