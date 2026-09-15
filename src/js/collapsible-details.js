/**
 * "Collapsed on phones, always open on tablet/desktop" behaviour, shared by
 * every block marked .mobile-collapse — currently the home page's "Why AJ
 * Construction" points and the "Four steps, no mystery" process steps.
 *
 * Each is a native <details>/<summary> so it works — collapsed, tap to read —
 * with zero JS. On tablet/desktop there is no scroll-length problem (these
 * blocks run in columns, not stacked full-width), so this keeps every
 * <details> forced open there, matching how they always looked before any of
 * this became collapsible on phones.
 */

const BREAKPOINT = 900;

export function initCollapsibleDetails() {
  const items = document.querySelectorAll('.mobile-collapse');
  if (!items.length) return;

  const mq = window.matchMedia(`(min-width: ${BREAKPOINT + 1}px)`);

  const sync = (isWide) => {
    items.forEach((el) => {
      el.open = isWide;
    });
  };

  sync(mq.matches);
  mq.addEventListener('change', (e) => sync(e.matches));

  // CSS disables pointer-events on the summary at this width so a mouse click
  // never registers, but a focused summary can still be toggled by keyboard
  // (Enter/Space) — that bypasses pointer-events entirely. Catch it here so
  // "always open on desktop" holds for every input method, not just the mouse.
  items.forEach((el) => {
    el.addEventListener('toggle', () => {
      if (mq.matches && !el.open) el.open = true;
    });
  });
}
