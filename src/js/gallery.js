/**
 * Gallery grid, category filter, and lightbox.
 *
 * Rendered from src/data/gallery-manifest.js so adding a photo is a one-line
 * change. Every image ships webp with a jpg fallback and explicit dimensions
 * to keep layout shift at zero.
 */

import { PHOTOS, CATEGORIES } from '../data/gallery-manifest.js';
import { icons } from './icons.js';
import { t, onLocaleChange } from './i18n.js';

const src = (slug, variant) => `/assets/gallery/${slug}${variant}`;

function photoMarkup(photo, index) {
  const tall = photo.tall ? ' gallery-item--tall' : '';
  return `
    <button class="gallery-item${tall}" type="button" data-index="${index}"
            data-categories="${photo.categories.join(' ')}"
            aria-label="${t(photo.titleKey)} — ${t('gal.openLabel')}">
      <picture>
        <source srcset="${src(photo.slug, '-thumb.webp')}" type="image/webp">
        <img src="${src(photo.slug, '-thumb.jpg')}" alt="${t(photo.captionKey)}"
             loading="lazy" decoding="async" width="800" height="800">
      </picture>
      <span class="gallery-item__overlay">
        <span class="gallery-item__cat">${t(`gal.${photo.categories[0]}`)}</span>
        <span class="gallery-item__title">${t(photo.titleKey)}</span>
      </span>
    </button>`;
}

function renderFilters(host, onChange) {
  host.innerHTML = CATEGORIES.map(
    (c, i) =>
      `<button type="button" data-filter="${c.id}" aria-pressed="${i === 0}">${t(c.key)}</button>`
  ).join('');

  host.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    host.querySelectorAll('[data-filter]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b === btn))
    );
    onChange(btn.dataset.filter);
  });
}

/* --- Lightbox ------------------------------------------------------------ */

function createLightbox(photos) {
  const el = document.createElement('div');
  el.className = 'lightbox';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', t('gal.lightboxLabel'));
  el.innerHTML = `
    <button class="lightbox__btn lightbox__close" type="button" aria-label="${t('gal.close')}">${icons.close}</button>
    <button class="lightbox__btn lightbox__prev" type="button" aria-label="${t('gal.prev')}">${icons.chevronLeft}</button>
    <button class="lightbox__btn lightbox__next" type="button" aria-label="${t('gal.next')}">${icons.chevronRight}</button>
    <figure class="lightbox__figure">
      <img alt="" decoding="async" hidden>
      <figcaption class="lightbox__caption"><strong></strong><span></span></figcaption>
    </figure>
    <p class="lightbox__count" aria-live="polite"></p>`;
  document.body.appendChild(el);

  const img = el.querySelector('img');
  const title = el.querySelector('.lightbox__caption strong');
  const caption = el.querySelector('.lightbox__caption span');
  const count = el.querySelector('.lightbox__count');

  let order = [];
  let cursor = 0;
  let lastFocus = null;

  function show(i) {
    cursor = (i + order.length) % order.length;
    const photo = photos[order[cursor]];
    img.src = src(photo.slug, '.jpg');
    img.hidden = false; // it ships without a src so the page never holds a broken image
    img.alt = t(photo.captionKey);
    title.textContent = t(photo.titleKey);
    caption.textContent = t(photo.captionKey);
    count.textContent = `${cursor + 1} / ${order.length}`;

    // Preload the neighbour so arrowing through feels instant.
    if (order.length > 1) {
      const next = photos[order[(cursor + 1) % order.length]];
      new Image().src = src(next.slug, '.jpg');
    }
  }

  function open(visibleOrder, index) {
    order = visibleOrder;
    lastFocus = document.activeElement;
    show(index);
    el.classList.add('is-open');
    document.body.classList.add('is-locked');
    el.querySelector('.lightbox__close').focus();
  }

  function close() {
    el.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    lastFocus?.focus();
  }

  el.querySelector('.lightbox__close').addEventListener('click', close);
  el.querySelector('.lightbox__prev').addEventListener('click', () => show(cursor - 1));
  el.querySelector('.lightbox__next').addEventListener('click', () => show(cursor + 1));
  el.addEventListener('click', (e) => {
    if (e.target === el) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!el.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(cursor + 1);
    else if (e.key === 'ArrowLeft') show(cursor - 1);
    else if (e.key === 'Tab') {
      // Trap focus inside the dialog.
      const focusable = [...el.querySelectorAll('button')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Swipe on touch devices.
  let touchX = null;
  el.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 55) show(cursor + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  return { open };
}

/* --- Entry point --------------------------------------------------------- */

export function initGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const filterHost = document.getElementById('gallery-filters');
  const emptyEl = document.getElementById('gallery-empty');
  const photos = PHOTOS;

  if (!photos.length) {
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  const draw = () => {
    grid.innerHTML = photos.map(photoMarkup).join('');
  };
  draw();

  const lightbox = createLightbox(photos);

  let active = 'all';
  const applyFilter = (cat) => {
    active = cat;
    let shown = 0;
    grid.querySelectorAll('.gallery-item').forEach((item) => {
      const match = cat === 'all' || item.dataset.categories.split(' ').includes(cat);
      item.hidden = !match;
      if (match) shown += 1;
    });
    if (emptyEl) emptyEl.hidden = shown > 0;
  };

  if (filterHost) renderFilters(filterHost, applyFilter);

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.gallery-item');
    if (!btn) return;

    // Only cycle through what is currently on screen.
    const visible = [...grid.querySelectorAll('.gallery-item')].filter((n) => !n.hidden);
    const order = visible.map((n) => Number(n.dataset.index));
    lightbox.open(order, order.indexOf(Number(btn.dataset.index)));
  });

  onLocaleChange(() => {
    draw();
    if (filterHost) renderFilters(filterHost, applyFilter);
    applyFilter(active);
  });
}

/* --- Facebook reel embeds ------------------------------------------------ */

/**
 * Reels stay as click-to-play posters until the visitor asks for them, so
 * Facebook's player (and its cookies) never loads on a plain page view.
 */
export function initVideos() {
  document.querySelectorAll('[data-reel]').forEach((card) => {
    const btn = card.querySelector('.video-card__play');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const url = `https://www.facebook.com/plugins/video.php?height=476&href=${encodeURIComponent(
        `https://www.facebook.com/reel/${card.dataset.reel}/`
      )}&show_text=false&autoplay=true`;

      const frame = document.createElement('iframe');
      frame.src = url;
      frame.title = t('gal.videoTitle');
      frame.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.loading = 'lazy';

      card.innerHTML = '';
      card.appendChild(frame);
    });
  });
}
