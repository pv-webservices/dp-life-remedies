export const business = {
  name: 'DP Life Remedies',
  tagline: 'Health • Trust • Care',
  phone: '+91 79000 01029',
  tel: '+917900001029',
  email: 'dpliferemedies@gmail.com',
  gstin: '06HAEPK2214K1ZT',
  address:
    'Shop No. 2, Ground Floor, Near Dharamshala, Village Ramgarh, Distt. Panchkula - 134118, Haryana',
  addressLines: [
    'Shop No. 2, Ground Floor, Near Dharamshala',
    'Village Ramgarh, Distt. Panchkula',
    'Haryana - 134118',
  ],
  locality: 'Ramgarh, Panchkula, Haryana',
  maps: 'https://maps.app.goo.gl/dGivLHA5H6QAW2zo9',
};
export const whatsapp = (product = ''): string =>
  `https://wa.me/917900001029?text=${encodeURIComponent(`Hello DP Life Remedies, I would like product and wholesale information${product ? ` about ${product}` : ''}.`)}`;
export const audiences = [
  ['bottle', 'Pharmacies'],
  ['building', 'Hospitals'],
  ['cross', 'Clinics'],
  ['people', 'Trade partners'],
] as const;
