/**
 * Bilingual layer (English / Spanish).
 *
 * Design note: the English copy lives in the HTML itself, not in a dictionary.
 * On boot we snapshot every translatable node, which means the page is fully
 * readable and crawlable before a single byte of JS runs — important for a
 * local business that lives or dies by local search. The Spanish dictionary
 * then overlays that snapshot, and switching back to English restores it.
 *
 * Strings that only ever exist in JavaScript (the assistant, gallery captions,
 * validation messages) are the exception: those ship in both dictionaries.
 *
 * Markup:
 *   data-i18n="key"                       -> textContent
 *   data-i18n-html="key"                  -> innerHTML (use for inline <em>)
 *   data-i18n-attr="placeholder:key;title:key2"
 */

import { EN } from '../data/i18n/en.js';
import { ES } from '../data/i18n/es.js';
import { ES_LEGAL } from '../data/i18n/es-legal.js';

const DICT = { en: EN, es: { ...ES, ...ES_LEGAL } };
const STORE_KEY = 'aj:lang';
const SUPPORTED = ['en', 'es'];

/** English strings recovered from the DOM at boot. */
const domEN = Object.create(null);

let locale = 'en';
const listeners = new Set();

function detectInitial() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {
    /* private browsing — fall through to the browser preference */
  }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return nav === 'es' ? 'es' : 'en';
}

function parseAttrSpec(spec) {
  return spec
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf(':');
      return [pair.slice(0, i).trim(), pair.slice(i + 1).trim()];
    });
}

/** Snapshot the English already present in the markup. */
function captureDOM(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!(key in domEN)) domEN[key] = el.textContent.trim();
  });

  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (!(key in domEN)) domEN[key] = el.innerHTML.trim();
  });

  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    parseAttrSpec(el.dataset.i18nAttr).forEach(([attr, key]) => {
      const cacheKey = `${key}@${attr}`;
      if (!(cacheKey in domEN)) domEN[cacheKey] = el.getAttribute(attr) || '';
    });
  });
}

/**
 * Resolve a key in the active locale.
 * Order: locale dictionary -> English captured from the DOM -> English
 * dictionary -> the key itself (so a missing string is obvious, never blank).
 */
export function t(key, fallback) {
  const dict = DICT[locale];
  if (dict && key in dict) return dict[key];
  if (locale === 'en' && key in domEN) return domEN[key];
  if (key in EN) return EN[key];
  if (key in domEN) return domEN[key];
  return fallback !== undefined ? fallback : key;
}

function resolveFor(key, attr) {
  const dict = DICT[locale];
  const dictKey = attr ? `${key}@${attr}` : key;

  if (dict && dictKey in dict) return dict[dictKey];
  if (dict && !attr && key in dict) return dict[key];

  const cacheKey = attr ? `${key}@${attr}` : key;
  if (cacheKey in domEN) return domEN[cacheKey];
  if (dictKey in EN) return EN[dictKey];
  if (key in EN) return EN[key];
  return null;
}

function applyDOM(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const val = resolveFor(el.dataset.i18n);
    if (val != null) el.textContent = val;
  });

  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const val = resolveFor(el.dataset.i18nHtml);
    if (val != null) el.innerHTML = val;
  });

  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    parseAttrSpec(el.dataset.i18nAttr).forEach(([attr, key]) => {
      const val = resolveFor(key, attr);
      if (val != null) el.setAttribute(attr, val);
    });
  });
}

export function getLocale() {
  return locale;
}

export function setLocale(next, { persist = true } = {}) {
  if (!SUPPORTED.includes(next) || next === locale) return;
  locale = next;

  document.documentElement.lang = locale;
  if (persist) {
    try {
      localStorage.setItem(STORE_KEY, locale);
    } catch {
      /* non-fatal */
    }
  }

  applyDOM();
  syncToggles();
  listeners.forEach((fn) => fn(locale));
}

/** Subscribe to locale changes. Returns an unsubscribe function. */
export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Re-apply translations to markup injected after boot. */
export function translateTree(root) {
  captureDOM(root);
  if (locale !== 'en') applyDOM(root);
}

function syncToggles() {
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.langBtn === locale));
  });
}

export function initI18n() {
  captureDOM();

  const initial = detectInitial();
  document.documentElement.lang = initial;
  if (initial !== 'en') {
    locale = initial;
    applyDOM();
    listeners.forEach((fn) => fn(locale));
  }
  syncToggles();

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lang-btn]');
    if (btn) setLocale(btn.dataset.langBtn);
  });
}
