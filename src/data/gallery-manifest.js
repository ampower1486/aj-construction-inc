/**
 * Gallery manifest.
 *
 * Every photo here is AJ Construction's own work, taken from their Facebook
 * page. No stock photography — for a contractor, a portfolio that isn't yours
 * is worse than a small one.
 *
 * TO ADD A PHOTO
 *   1. Drop the original in  assets-src/gallery/my-photo.jpg
 *   2. Run                   npm run assets
 *   3. Add one entry below with slug: 'my-photo'
 *
 * `slug` must match the filename. The build produces:
 *   /assets/gallery/<slug>.webp        (large, lightbox)
 *   /assets/gallery/<slug>-thumb.webp  (grid)
 * plus .jpg fallbacks for each.
 */

export const CATEGORIES = [
  { id: 'all', key: 'gal.all' },
  { id: 'decks', key: 'gal.decks' },
  { id: 'concrete', key: 'gal.concrete' },
  { id: 'exterior', key: 'gal.exterior' },
];

export const PHOTOS = [
  {
    slug: 'deck-walkway-complete',
    categories: ['decks', 'concrete', 'exterior'],
    titleKey: 'gal.p1.title',
    captionKey: 'gal.p1.caption',
  },
  {
    slug: 'wraparound-deck-complete',
    categories: ['decks', 'exterior'],
    titleKey: 'gal.p2.title',
    captionKey: 'gal.p2.caption',
  },
  {
    slug: 'concrete-slab-fence',
    categories: ['concrete', 'exterior'],
    titleKey: 'gal.p3.title',
    captionKey: 'gal.p3.caption',
    tall: true,
  },
  {
    slug: 'deck-substructure',
    categories: ['decks'],
    titleKey: 'gal.p4.title',
    captionKey: 'gal.p4.caption',
  },
  {
    slug: 'deck-framing-forms',
    categories: ['decks', 'concrete'],
    titleKey: 'gal.p5.title',
    captionKey: 'gal.p5.caption',
  },
];
