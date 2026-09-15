/* Fonts — self-hosted so no external CDN is contacted at runtime.
   Inter ships the weight axis only (no optical-size axis we do not use), and
   Barlow is limited to the Latin subset since the site is English/Spanish. */
import '@fontsource-variable/inter/wght.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/chat.css';
import './styles/hero-reel.css';

import { initI18n } from './js/i18n.js';
import { initHeroReel } from './js/hero-reel.js';
import { initNav } from './js/nav.js';
import { initReveal } from './js/reveal.js';
import { initGallery, initVideos } from './js/gallery.js';
import { initFeatureList } from './js/feature-list.js';
import { initQuoteForm } from './js/quote-form.js';
import { initChat } from './js/chat/chat-ui.js';

function boot() {
  // Language first: everything rendered afterwards asks it for its strings,
  // including the intro's Skip button.
  initI18n();

  // Then the hero reel, so the clip starts as early as possible.
  initHeroReel();

  initNav();
  initReveal();
  initGallery();
  initVideos();
  initFeatureList();
  initQuoteForm();

  // The assistant is the heaviest piece and never blocks first paint.
  if (document.body.dataset.chat !== 'off') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initChat(), { timeout: 2500 });
    } else {
      setTimeout(initChat, 1200);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
