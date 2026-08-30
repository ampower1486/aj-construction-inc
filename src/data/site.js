/**
 * Single source of truth for AJ Construction Inc's business facts.
 *
 * Everything here was verified against the company's own Facebook page
 * (facebook.com/profile.php?id=61590028926285) and the CSLB licence record for
 * #1129358. If a fact changes, change it here — nothing else should hardcode it.
 */

export const SITE = {
  name: 'AJ Construction Inc',
  legalName: 'AJ Construction Inc',
  tagline: 'Built by family. Backed by a licence.',

  phone: {
    primary: { display: '(916) 532-3015', href: 'tel:+19165323015' },
    alternate: { display: '(530) 503-7343', href: 'tel:+15305037343' },
  },

  email: 'aj.construction.inc2@gmail.com',

  location: {
    city: 'Placerville',
    region: 'CA',
    regionName: 'California',
    postalCode: '95667',
    country: 'US',
    // Street address is deliberately withheld — it is a residential address.
    serviceAreas: [
      'Placerville',
      'El Dorado Hills',
      'Cameron Park',
      'Shingle Springs',
      'Diamond Springs',
      'Folsom',
      'Rescue',
      'Somerset',
      'Pollock Pines',
      'Greater Sacramento',
      'Northern California',
    ],
    geo: { lat: 38.7296, lng: -120.7985 },
  },

  licence: {
    number: '1129358',
    classification: 'B — General Building Contractor',
    authority: 'CSLB',
    authorityName: 'California State Licence Board',
    issued: '2024-11-19',
    expires: '2026-11-30',
    bond: '$25,000',
    bondSurety: 'Business Alliance Insurance Company',
    county: 'El Dorado',
    checkUrl: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/LicenseDetail.aspx?LicNum=1129358',
  },

  hours: 'Always open',

  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61590028926285',
    instagram: 'https://www.instagram.com/aj.construction.inc/',
  },

  /**
   * Where leads go. Set VITE_FORM_ENDPOINT in .env to a Formspree (or similar)
   * endpoint that forwards to the address above. Without it the form falls back
   * to opening the visitor's mail client — it never silently drops a lead.
   */
  formEndpoint: import.meta.env?.VITE_FORM_ENDPOINT || '',

  url: 'https://ajconstructioninc.com',
};

export const YEARS_EXPERIENCE = 13;
