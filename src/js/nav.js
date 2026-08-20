/** Header behaviour: active link, sticky shadow, mobile drawer. */

const BREAKPOINT = 1080;

function markActive() {
  const path = window.location.pathname.replace(/\/index\.html$/, '/');
  const page = document.body.dataset.page;

  document.querySelectorAll('[data-nav]').forEach((link) => {
    const isActive = page
      ? link.dataset.nav === page
      : new URL(link.href, location.origin).pathname.replace(/\/index\.html$/, '/') === path;

    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function stickyShadow() {
  const header = document.getElementById('site-header');
  if (!header) return;

  // The utility bar is pinned above the header, so the header pins at that
  // bar's height rather than at 0. Offsetting the observer by the same amount
  // makes the shadow appear exactly as the header comes to rest.
  const utilityHeight = document.querySelector('.utility-bar')?.offsetHeight || 0;

  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  header.parentNode.insertBefore(sentinel, header);

  new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-stuck', !entry.isIntersecting),
    { threshold: 0, rootMargin: `-${utilityHeight}px 0px 0px 0px` }
  ).observe(sentinel);
}

function mobileDrawer() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Any navigation closes the drawer.
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Resizing past the breakpoint must not leave the body scroll-locked.
  const mq = window.matchMedia(`(min-width: ${BREAKPOINT + 1}px)`);
  mq.addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

export function initNav() {
  markActive();
  stickyShadow();
  mobileDrawer();
}
