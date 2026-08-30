/**
 * Gallery manifest.
 *
 * Every photo here is AJ Construction's own work, shot on their own job sites.
 * No stock photography — for a contractor, a portfolio that isn't yours is
 * worse than a small one.
 *
 * TO ADD A PHOTO
 *   1. Drop the original in  assets-src/gallery/my-photo.jpg
 *   2. Run                   npm run assets
 *   3. Add one entry below with slug: 'my-photo'
 *   4. Add gal.my-photo.title / .caption to src/data/i18n/{en,es}.js
 *
 * `slug` must match the filename. The build produces:
 *   /assets/gallery/<slug>.webp        (large, lightbox)
 *   /assets/gallery/<slug>-thumb.webp  (grid)
 * plus .jpg fallbacks for each.
 *
 * `tall: true` gives a portrait photo a double-height cell so the masonry grid
 * doesn't letterbox it. Order is display order — finished work leads, and
 * in-progress shots sit further down.
 */

export const CATEGORIES = [
  { id: 'all', key: 'gal.all' },
  { id: 'kitchens-baths', key: 'gal.kitchensBaths' },
  { id: 'decks', key: 'gal.decks' },
  { id: 'concrete', key: 'gal.concrete' },
  { id: 'roofing', key: 'gal.roofing' },
  { id: 'exterior', key: 'gal.exterior' },
];

const photo = (slug, categories, tall = false) => ({
  slug,
  categories,
  titleKey: `gal.${slug}.title`,
  captionKey: `gal.${slug}.caption`,
  ...(tall ? { tall: true } : {}),
});

export const PHOTOS = [
  /* --- Finished work leads --- */
  photo('kitchen-remodel-quartz-island', ['kitchens-baths']),
  photo('backyard-spa-walkway', ['concrete', 'exterior']),
  photo('bathroom-double-vanity-shower', ['kitchens-baths'], true),
  photo('redwood-deck-boulders', ['decks', 'exterior']),
  photo('covered-patio-lighting', ['decks', 'exterior']),
  photo('concrete-driveway-poured', ['concrete', 'exterior']),
  photo('bathroom-tile-tub-surround', ['kitchens-baths'], true),
  photo('poolside-patio-cover', ['decks', 'concrete', 'exterior']),
  photo('redwood-deck-multi-level', ['decks', 'exterior']),
  photo('shingle-roof-replacement', ['roofing', 'exterior'], true),
  photo('concrete-slab-finished', ['concrete']),
  photo('tile-floor-installation', ['kitchens-baths']),
  photo('cedar-fence-and-gate', ['exterior'], true),
  photo('block-retaining-wall', ['concrete', 'exterior']),
  photo('shingle-roof-aerial', ['roofing', 'exterior'], true),
  photo('concrete-steps-hillside', ['concrete', 'exterior'], true),

  /* --- Before / after --- */
  photo('fence-replacement-before', ['exterior']),
  photo('fence-replacement-after', ['exterior']),
  photo('ranch-home-exterior', ['exterior']),
  photo('poolside-home-roof-work', ['roofing', 'exterior']),

  /* --- Work in progress: framing, forms and crew --- */
  photo('hillside-deck-framing', ['decks'], true),
  photo('deck-joist-framing', ['decks']),
  photo('hillside-home-deck-framing', ['decks', 'exterior'], true),
  photo('poolside-addition-framing', ['exterior']),
  photo('stair-framing-retaining-wall', ['decks', 'concrete'], true),
  photo('concrete-forms-rebar', ['concrete']),
  photo('concrete-pour-in-progress', ['concrete'], true),
  photo('slab-prep-grading-crew', ['concrete']),
  photo('concrete-crew-mixer-truck', ['concrete']),
];

/**
 * Project videos, self-hosted so nothing loads from a third party and no
 * cookie banner is needed. Each one is click-to-play with preload="none", so
 * the only thing a visitor downloads up front is the poster still.
 *
 * TO ADD A VIDEO
 *   1. Put an H.264 .mp4 in public/assets/video/my-clip.mp4
 *   2. Put a still frame in assets-src/video-posters/my-clip.jpg
 *   3. Run npm run assets, then add an entry below
 */
export const VIDEOS = [
  { slug: 'roofing-crew', w: 576, h: 768, titleKey: 'gal.v.roofing-crew' },
  { slug: 'bathroom-remodel-finished', w: 360, h: 640, titleKey: 'gal.v.bathroom-remodel-finished' },
  { slug: 'deck-patio-cover', w: 576, h: 720, titleKey: 'gal.v.deck-patio-cover' },
  { slug: 'stairs-vinyl-plank-finished', w: 360, h: 640, titleKey: 'gal.v.stairs-vinyl-plank-finished' },
  { slug: 'concrete-slab-walkthrough', w: 576, h: 1024, titleKey: 'gal.v.concrete-slab-walkthrough' },
  { slug: 'concrete-walkway-finished', w: 360, h: 640, titleKey: 'gal.v.concrete-walkway-finished' },
];
