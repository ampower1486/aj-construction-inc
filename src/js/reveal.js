/**
 * Scroll reveal. Elements marked [data-reveal] fade up once as they enter view.
 * Honours prefers-reduced-motion by simply showing everything immediately.
 */

export function initReveal(root = document) {
  const items = root.querySelectorAll('[data-reveal]:not(.is-visible)');
  if (!items.length) return;

  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Stagger siblings so a grid cascades instead of snapping in as a block.
        const delay = Number(entry.target.dataset.revealDelay || 0);
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  items.forEach((el) => observer.observe(el));
}
