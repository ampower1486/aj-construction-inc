/**
 * Icon set — hand-drawn on a 24px grid, 1.6px stroke, round caps/joins.
 *
 * Every mark is drawn from the trade: a trowel, a stud bay, a joist, a pour.
 * No emoji, no sparkles, no generic "AI assistant" glyphs anywhere on the site.
 */

const wrap = (paths, opts = {}) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${
    opts.w || 1.6
  }" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

/* --- Interface ----------------------------------------------------------- */

export const icons = {
  phone: wrap(
    '<path d="M6.3 3.5h3l1.5 3.8-1.9 1.4a11.3 11.3 0 0 0 5.4 5.4l1.4-1.9 3.8 1.5v3a1.8 1.8 0 0 1-2 1.8A16.5 16.5 0 0 1 4.5 5.5a1.8 1.8 0 0 1 1.8-2Z"/>'
  ),
  mail: wrap(
    '<rect x="2.8" y="5" width="18.4" height="14" rx="1.8"/><path d="m3.4 6.4 8.6 6 8.6-6"/>'
  ),
  mapPin: wrap(
    '<path d="M12 21.5s7-5.9 7-11a7 7 0 1 0-14 0c0 5.1 7 11 7 11Z"/><circle cx="12" cy="10.3" r="2.6"/>'
  ),
  clock: wrap('<circle cx="12" cy="12" r="8.8"/><path d="M12 6.8V12l3.4 2"/>'),
  shield: wrap(
    '<path d="M12 2.7 4.6 5.6v5.7c0 4.7 3.1 8.6 7.4 10 4.3-1.4 7.4-5.3 7.4-10V5.6Z"/><path d="m8.7 11.9 2.4 2.4 4.2-4.6"/>'
  ),
  check: wrap('<path d="m4.5 12.6 4.8 4.8L19.5 7.2"/>', { w: 2 }),
  checkCircle: wrap('<circle cx="12" cy="12" r="8.8"/><path d="m8.2 12.2 2.6 2.6 5-5.4"/>'),
  arrowRight: wrap('<path d="M4.5 12h15"/><path d="m13.2 5.7 6.3 6.3-6.3 6.3"/>'),
  chevronRight: wrap('<path d="m9.2 5.4 6.6 6.6-6.6 6.6"/>'),
  chevronLeft: wrap('<path d="M14.8 5.4 8.2 12l6.6 6.6"/>'),
  close: wrap('<path d="M6 6l12 12M18 6 6 18"/>', { w: 1.9 }),
  play: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,.16)" stroke="#fff" stroke-width="1.3"/><path d="M9.8 8.2 16 12l-6.2 3.8Z" fill="#fff"/></svg>`,
  send: wrap('<path d="M21 3 10.5 13.5"/><path d="M21 3 14.4 21l-3.9-7.5L3 9.6Z"/>'),
  alert: wrap('<circle cx="12" cy="12" r="8.8"/><path d="M12 7.8v4.8"/><path d="M12 16.1h.01"/>'),
  clipboard: wrap(
    '<path d="M9 4.4H7.3A1.8 1.8 0 0 0 5.5 6.2v13a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8v-13a1.8 1.8 0 0 0-1.8-1.8H15"/><rect x="9" y="2.6" width="6" height="3.6" rx="1"/><path d="M8.9 11.4h6.2M8.9 15.1h4"/>'
  ),
  star: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="m12 3.2 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.6l6.1-.8Z"/></svg>`,

  /* --- Social (brand marks, filled) --- */
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.03a.97.97 0 1 1-1.95 0 .97.97 0 0 1 1.95 0Z"/></svg>`,

  /* --- Differentiators --- */
  crew: wrap(
    '<path d="M8.4 11.2a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z"/><path d="M2.8 19.4a5.6 5.6 0 0 1 11.2 0"/><path d="M16.4 11a2.6 2.6 0 1 0-1.6-4.7"/><path d="M16.9 14.2a5.1 5.1 0 0 1 4.3 5.2"/>'
  ),
  hardHat: wrap(
    '<path d="M3.4 17.2h17.2"/><path d="M5.6 15.4v-2.6a6.4 6.4 0 0 1 12.8 0v2.6"/><path d="M9.9 9.4V5.8a1.3 1.3 0 0 1 1.3-1.3h1.6a1.3 1.3 0 0 1 1.3 1.3v3.6"/>'
  ),
  contract: wrap(
    '<path d="M14 2.9H7.2a1.9 1.9 0 0 0-1.9 1.9v14.4a1.9 1.9 0 0 0 1.9 1.9h9.6a1.9 1.9 0 0 0 1.9-1.9V7.6Z"/><path d="M14 2.9v4.7h4.7"/><path d="M8.6 12.6h6.8M8.6 16.2h4.4"/>'
  ),
  badge: wrap(
    '<circle cx="12" cy="9.4" r="5.4"/><path d="m9 14.1-1.3 6.4L12 18.4l4.3 2.1L15 14.1"/><path d="m10.2 9.3 1.3 1.4 2.4-2.6"/>'
  ),

  /* --- Trades --- */
  kitchen: wrap(
    '<rect x="3.2" y="3.4" width="17.6" height="17.2" rx="1.7"/><path d="M3.2 10.4h17.6"/><path d="M7.4 6.4h3.2"/><path d="M8.2 13.8v3.4"/><path d="M15.6 13.4a2.1 2.1 0 0 1 2.1 2.1v1.7h-4.2v-1.7a2.1 2.1 0 0 1 2.1-2.1Z"/>'
  ),
  bathroom: wrap(
    '<path d="M3.4 12.4h17.2v2.1a5.1 5.1 0 0 1-5.1 5.1H8.5a5.1 5.1 0 0 1-5.1-5.1Z"/><path d="M6.2 12.4V6.1a2 2 0 0 1 2-2h.5a2 2 0 0 1 2 2"/><path d="M8.6 7.6h3.6"/><path d="M6.9 19.6 6 21.4M17.1 19.6l.9 1.8"/>'
  ),
  wholeHome: wrap(
    '<path d="M3.4 10.6 12 3.6l8.6 7"/><path d="M5.6 12.4v7.4a.9.9 0 0 0 .9.9h11a.9.9 0 0 0 .9-.9v-7.4"/><path d="M9.9 20.7v-5.3h4.2v5.3"/>'
  ),
  addition: wrap(
    '<path d="M2.6 11.2 9.2 5.8l6.6 5.4"/><path d="M4.4 12.6v7.2a.8.8 0 0 0 .8.8h8"/><path d="M17.6 13.6v7M14.1 17.1h7"/>'
  ),
  newBuild: wrap(
    '<path d="M3.4 20.8h17.2"/><path d="M5.8 20.8V8.4l6.2-4.4 6.2 4.4v12.4"/><path d="M9.6 20.8v-4.6h4.8v4.6"/><path d="M9.6 10.4h1.8M12.6 10.4h1.8M9.6 13.4h4.8"/>'
  ),
  deck: wrap(
    '<path d="M2.6 9.8h18.8"/><path d="M4.4 9.8v9.8M9.2 9.8v9.8M14.8 9.8v9.8M19.6 9.8v9.8"/><path d="M2.6 14.2h18.8"/><path d="M4.4 6.2h15.2"/><path d="M6.6 6.2V3.6M17.4 6.2V3.6"/>'
  ),
  concrete: wrap(
    '<path d="M2.8 15.4h18.4v4.4H2.8Z"/><path d="M5.4 15.4V11a3.4 3.4 0 0 1 3.4-3.4h2.4"/><path d="M14.2 4.2h5.4v5.2a2.6 2.6 0 0 1-2.6 2.6h-.2a2.6 2.6 0 0 1-2.6-2.6Z"/><path d="M6.6 18h1.2M11 18h1.2M15.4 18h1.2"/>'
  ),
  roofing: wrap(
    '<path d="m2.4 12.6 9.6-7.8 9.6 7.8"/><path d="M5.2 14.8h13.6"/><path d="M6.8 17.6h10.4"/><path d="M8.4 20.4h7.2"/>'
  ),
  flooring: wrap(
    '<rect x="2.8" y="5.4" width="18.4" height="13.2" rx="1.3"/><path d="M2.8 9.8h18.4M2.8 14.2h18.4"/><path d="M8.6 5.4v4.4M14.4 9.8v4.4M8.6 14.2v4.4"/>'
  ),
  tile: wrap(
    '<rect x="3.2" y="3.4" width="7.4" height="7.4" rx="1"/><rect x="13.4" y="3.4" width="7.4" height="7.4" rx="1"/><rect x="3.2" y="13.2" width="7.4" height="7.4" rx="1"/><rect x="13.4" y="13.2" width="7.4" height="7.4" rx="1"/>'
  ),
  drywall: wrap(
    '<rect x="3" y="3.4" width="18" height="17.2" rx="1.3"/><path d="M12 3.4v17.2"/><path d="M3 12h18"/><path d="m14.8 6.4 3.4 3.4M15.6 15.4l2.6 2.6"/>'
  ),
  painting: wrap(
    '<rect x="6.2" y="2.8" width="11.6" height="5.2" rx="1.1"/><path d="M17.8 5.4h2a1.4 1.4 0 0 1 1.4 1.4v2.6a1.4 1.4 0 0 1-1.4 1.4h-7.4a1.4 1.4 0 0 0-1.4 1.4v1.6"/><rect x="9.6" y="14.2" width="4.8" height="7" rx="1.2"/>'
  ),
  electrical: wrap('<path d="M13.4 2.6 4.8 13.4h6.2l-1 8 8.6-10.8h-6.2Z"/>'),
  repair: wrap(
    '<path d="M14.9 6.1a3.9 3.9 0 0 0 5 5l-8 8a2.4 2.4 0 0 1-3.4-3.4Z"/><path d="m4.6 4.6 3.6 3.6"/><path d="M3.2 8.2 6.8 4.6"/>'
  ),
  ruler: wrap(
    '<rect x="2.4" y="8.6" width="19.2" height="6.8" rx="1.2" transform="rotate(-8 12 12)"/><path d="M6.4 10.2v2.6M9.8 9.7v3.6M13.2 9.2v2.6M16.6 8.7v3.6"/>'
  ),
  handshake: wrap(
    '<path d="m11 6.6-2.4 2.2a1.8 1.8 0 0 0 2.4 2.6l1.6-1.4 3.4 3a1.7 1.7 0 0 1-2.3 2.5"/><path d="m14.2 15.5.9.8a1.7 1.7 0 0 1-2.3 2.5l-.9-.8"/><path d="M2.8 8.4 6 6.2l3.4 1.4"/><path d="M21.2 8.4 18 6.2l-3.6 1.4-1.4.6"/><path d="M2.8 8.4v6.2h1.8M21.2 8.4v6.2h-1.8"/>'
  ),
};

/**
 * Render an icon at a given pixel size.
 * @param {keyof typeof icons} name
 */
export function icon(name, size) {
  const svg = icons[name];
  if (!svg) return '';
  if (!size) return svg;
  return svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
}
