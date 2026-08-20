/**
 * Hero reel.
 *
 * The clip plays as a square inside the hero. While it runs the headline, the
 * buttons and the proof row step aside; when it finishes they come back. A
 * replay control repeats the cycle on demand. The header, the nav and the rest
 * of the page are never covered — this deliberately is not a modal.
 *
 * Autoplay happens once per visitor. After that the hero is immediate and the
 * clip is opt-in, because a returning customer looking for a phone number
 * should not have to wait ten seconds for it.
 * (To autoplay every time instead, drop the `hasSeen()` check in shouldAutoplay.)
 *
 * Guiding rule, same as everywhere else here: the copy must always come back.
 * Missing file, refused autoplay, stalled buffer, decode error — every failure
 * path ends with the hero readable.
 */

const SEEN_KEY = 'aj:reel-seen';
const START_TIMEOUT = 5000; // playback must actually begin within this
const STALL_TIMEOUT = 4000; // ...and must not freeze for this long

function hasSeen() {
  try {
    return !!localStorage.getItem(SEEN_KEY);
  } catch {
    return true; // storage blocked — treat as seen so the hero is never withheld
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* non-fatal */
  }
}

function autoplayAllowed() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  const conn = navigator.connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false;

  return !hasSeen();
}

export function initHeroReel() {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const reel = document.getElementById('hero-reel');
  const video = reel?.querySelector('.hero__reel-video');
  const replay = document.getElementById('hero-replay');
  const progress = reel?.querySelector('.hero__reel-progress');

  // Hand the headline back the moment this module is in charge; from here on
  // the class on .hero is what decides, not the pre-paint hint.
  root.classList.remove('reel-pending');

  if (!hero || !reel || !video) {
    replay?.remove();
    return;
  }

  // Required for autoplay: an unmuted video is refused, and iOS needs the
  // property set rather than just the attribute.
  video.muted = true;
  video.defaultMuted = true;

  let running = false;
  let startTimer = null;
  let stallTimer = null;

  function armStall() {
    clearTimeout(stallTimer);
    if (!running) return;
    stallTimer = setTimeout(() => stop(), STALL_TIMEOUT);
  }

  function stop({ returnFocus = false } = {}) {
    if (!running) return;
    running = false;

    clearTimeout(startTimer);
    clearTimeout(stallTimer);
    hero.classList.remove('is-reel-playing');

    try {
      video.pause();
    } catch {
      /* already stopped */
    }

    if (progress) progress.style.width = '0%';
    // Only pull focus when a person asked for the replay — doing it after an
    // autoplay would yank focus for someone already reading or tabbing.
    if (returnFocus) replay?.focus({ preventScroll: true });
  }

  function start({ userInitiated = false } = {}) {
    if (running) return;
    running = true;
    markSeen();

    hero.classList.add('is-reel-playing');
    video.preload = 'auto';

    try {
      video.currentTime = 0;
    } catch {
      /* not seekable yet — it will still play from the start */
    }

    const played = video.play();
    if (played?.catch) played.catch(() => stop({ returnFocus: userInitiated }));

    // Nothing on screen within a sensible window? Give the hero back.
    startTimer = setTimeout(() => {
      if (video.paused || video.currentTime === 0) stop({ returnFocus: userInitiated });
    }, START_TIMEOUT);

    armStall();
  }

  video.addEventListener('timeupdate', () => {
    if (progress && video.duration) {
      progress.style.width = `${(video.currentTime / video.duration) * 100}%`;
    }
    armStall();
  });

  video.addEventListener('ended', () => stop());
  video.addEventListener('error', () => stop());

  // Clicking the reel dismisses it early.
  reel.addEventListener('click', () => stop());

  document.addEventListener('keydown', (e) => {
    if (running && e.key === 'Escape') stop({ returnFocus: true });
  });

  replay?.addEventListener('click', () => {
    if (running) stop({ returnFocus: true });
    else start({ userInitiated: true });
  });

  // Never leave it playing to an empty room.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) stop();
  });

  if (autoplayAllowed()) start();
}
