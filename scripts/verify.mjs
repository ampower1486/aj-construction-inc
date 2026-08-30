/**
 * Verification sweep.
 *
 *   node scripts/verify.mjs [baseUrl]
 *
 * Loads every page at three viewports and checks the things that actually break
 * on a site like this: horizontal overflow, console errors, missing images,
 * untranslated strings after switching to Spanish, and the accessibility basics
 * (one h1, labelled controls, alt text).
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

import { PHOTOS, VIDEOS } from '../src/data/gallery-manifest.js';

const BASE = process.argv[2] || 'http://localhost:5199';
const SHOTS = 'verify-shots';

const PAGES = [
  ['home', '/'],
  ['services', '/services.html'],
  ['gallery', '/gallery.html'],
  ['story', '/story.html'],
  ['quote', '/quote.html'],
  ['privacy', '/privacy-policy.html'],
  ['terms', '/terms-conditions.html'],
];

const VIEWPORTS = [
  ['mobile', 390, 844],
  ['tablet', 768, 1024],
  ['desktop', 1440, 900],
];

let failures = 0;
const fail = (m) => {
  failures += 1;
  console.log(`  FAIL  ${m}`);
};
const pass = (m) => console.log(`  ok    ${m}`);

mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

/**
 * A context that has already "seen" the hero reel.
 *
 * While the reel plays it covers the middle of the hero, so any test that
 * clicks or hit-tests there would be measuring the reel instead of the site.
 * Every section except the reel's own uses this and starts as a returning
 * visitor. The reel section deliberately uses a raw context.
 */
async function newCtx(opts) {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('aj:reel-seen', '1');
    } catch {
      /* storage blocked — the reel simply autoplays */
    }
  });
  return ctx;
}

/* ------------------------------------------------------------------ *
 * 1. Layout, console, images, a11y basics across pages x viewports
 * ------------------------------------------------------------------ */
console.log('\n=== PAGES ===');

for (const [name, path] of PAGES) {
  for (const [vpName, width, height] of VIEWPORTS) {
    const ctx = await newCtx({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    const errors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));

    const badResponses = [];
    page.on('response', (r) => {
      if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const label = `${name} @ ${vpName}`;

    const metrics = await page.evaluate(() => {
      const de = document.documentElement;
      const overflowing = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > de.clientWidth + 2 || r.left < -2);
        })
        .slice(0, 4)
        .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);

      return {
        scrollW: de.scrollWidth,
        clientW: de.clientWidth,
        overflowing,
        h1Count: document.querySelectorAll('h1').length,
        imgsNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
        brokenImgs: [...document.querySelectorAll('img')]
          // An <img> with no src yet (the lightbox before it is opened) is not broken.
          .filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0)
          .map((i) => i.currentSrc || i.src),
        unlabelled: [...document.querySelectorAll('input:not([type=hidden]), select, textarea')]
          .filter((el) => {
            if (el.closest('.hp-field')) return false;
            if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
            if (el.id && document.querySelector(`label[for="${el.id}"]`)) return false;
            return !el.closest('label');
          }).length,
        title: document.title,
        hasCanonical: !!document.querySelector('link[rel=canonical]'),
        hasDesc: !!document.querySelector('meta[name=description]'),
      };
    });

    const problems = [];
    if (metrics.scrollW > metrics.clientW + 1) {
      problems.push(`h-scroll ${metrics.scrollW}>${metrics.clientW} [${metrics.overflowing.join(', ')}]`);
    }
    if (metrics.h1Count !== 1) problems.push(`h1 count = ${metrics.h1Count}`);
    if (metrics.imgsNoAlt) problems.push(`${metrics.imgsNoAlt} img without alt`);
    if (metrics.brokenImgs.length) problems.push(`broken img: ${metrics.brokenImgs[0]}`);
    if (metrics.unlabelled) problems.push(`${metrics.unlabelled} unlabelled field(s)`);
    if (!metrics.title) problems.push('no <title>');
    if (!metrics.hasCanonical) problems.push('no canonical');
    if (!metrics.hasDesc) problems.push('no meta description');
    if (errors.length) problems.push(`console: ${errors[0]}`);
    if (badResponses.length) problems.push(`http: ${badResponses[0]}`);

    if (problems.length) problems.forEach((p) => fail(`${label} — ${p}`));
    else pass(label);

    if (vpName !== 'tablet') {
      await page.screenshot({ path: `${SHOTS}/${name}-${vpName}.png`, fullPage: false });
    }
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ *
 * 2. Spanish toggle — no English left behind
 * ------------------------------------------------------------------ */
console.log('\n=== SPANISH ===');
{
  const ctx = await newCtx({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.click('[data-lang-btn="es"]');
    await page.waitForTimeout(250);

    const result = await page.evaluate(() => {
      const untranslated = [];
      document.querySelectorAll('[data-i18n], [data-i18n-html]').forEach((el) => {
        const key = el.dataset.i18n || el.dataset.i18nHtml;
        const txt = (el.textContent || '').trim();
        if (txt === key) untranslated.push(key);
      });
      return { lang: document.documentElement.lang, untranslated: untranslated.slice(0, 5) };
    });

    if (result.lang !== 'es') fail(`${name} — <html lang> is "${result.lang}"`);
    else if (result.untranslated.length) fail(`${name} — raw keys shown: ${result.untranslated.join(', ')}`);
    else pass(`${name} switches to Spanish`);
  }

  // Preference must survive navigation.
  await page.goto(BASE + '/services.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  const stillEs = await page.evaluate(() => document.documentElement.lang);
  stillEs === 'es' ? pass('language persists across pages') : fail(`language reset to "${stillEs}"`);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 2b. Mobile drawer
 *
 * A backdrop-filter on the header once made it the containing block for the
 * position:fixed drawer, collapsing it to the height of the header bar. These
 * assertions exist so that cannot come back unnoticed.
 * ------------------------------------------------------------------ */
console.log('\n=== MOBILE MENU ===');
{
  const ctx = await newCtx({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.click('#nav-toggle');
  await page.waitForTimeout(600);

  const drawer = await page.evaluate(() => {
    const nav = document.getElementById('site-nav');
    const r = nav.getBoundingClientRect();
    const links = [...nav.querySelectorAll('a')];
    return {
      height: Math.round(r.height),
      top: Math.round(r.top),
      viewportH: window.innerHeight,
      linkCount: links.length,
      linksInside: links.filter((a) => {
        const lr = a.getBoundingClientRect();
        return lr.bottom <= r.bottom + 1 && lr.top >= r.top - 1;
      }).length,
      headerVisible: document.querySelector('.site-header').getBoundingClientRect().top >= 0,
      // The toggle lives in the pinned utility bar, which must stay on top of
      // the open drawer rather than being covered by it.
      langUsable: (() => {
        const btn = document.querySelector('.utility-bar [data-lang-btn]');
        if (!btn) return false;
        const r = btn.getBoundingClientRect();
        if (r.width === 0) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return btn.contains(hit) || hit === btn;
      })(),
      launcherHidden: getComputedStyle(document.querySelector('.chat-launcher')).visibility === 'hidden',
    };
  });

  drawer.height >= drawer.viewportH - 1
    ? pass(`drawer fills the viewport (${drawer.height}px)`)
    : fail(`drawer is only ${drawer.height}px tall, viewport is ${drawer.viewportH}px`);

  drawer.linksInside === drawer.linkCount
    ? pass(`all ${drawer.linkCount} drawer links sit inside it`)
    : fail(`${drawer.linkCount - drawer.linksInside} drawer link(s) overflow the panel`);

  drawer.headerVisible ? pass('header stays visible above the drawer') : fail('header is covered');
  drawer.langUsable
    ? pass('language toggle stays clickable with the menu open')
    : fail('language toggle is covered while the menu is open');
  drawer.launcherHidden ? pass('chat launcher hides behind the menu') : fail('chat launcher floats over the menu');

  await page.screenshot({ path: `${SHOTS}/mobile-menu.png` });

  // Closing restores scrolling.
  await page.click('#nav-toggle');
  await page.waitForTimeout(400);
  const unlocked = await page.evaluate(() => !document.body.classList.contains('is-locked'));
  unlocked ? pass('closing unlocks page scroll') : fail('body left scroll-locked');
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 2c. Pinned chrome — the utility bar must never scroll away, so the
 *     language toggle is reachable from anywhere on the page.
 * ------------------------------------------------------------------ */
console.log('\n=== PINNED CHROME ===');
for (const [vpName, width, height] of [['mobile', 390, 844], ['desktop', 1440, 900]]) {
  const ctx = await newCtx({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const barH = await page.evaluate(() => document.querySelector('.utility-bar').offsetHeight);

  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(500);

  const pinned = await page.evaluate(() => {
    const bar = document.querySelector('.utility-bar').getBoundingClientRect();
    const head = document.querySelector('.site-header').getBoundingClientRect();
    const btn = document.querySelector('.utility-bar [data-lang-btn="es"]');
    const r = btn.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      barTop: Math.round(bar.top),
      barH: Math.round(bar.height),
      headTop: Math.round(head.top),
      langClickable: btn.contains(hit) || hit === btn,
      scrolled: Math.round(window.scrollY),
    };
  });

  const label = `${vpName}`;
  pinned.scrolled > 500 ? null : fail(`${label} — page did not scroll`);
  pinned.barTop === 0
    ? pass(`${label} — utility bar stays pinned at top after scrolling`)
    : fail(`${label} — utility bar drifted to ${pinned.barTop}px`);
  pinned.headTop === pinned.barH
    ? pass(`${label} — header pins directly below it (${pinned.headTop}px)`)
    : fail(`${label} — header at ${pinned.headTop}px, expected ${pinned.barH}px (gap or overlap)`);
  pinned.langClickable
    ? pass(`${label} — language toggle clickable mid-page`)
    : fail(`${label} — language toggle not clickable mid-page`);
  pinned.barH === barH
    ? pass(`${label} — bar height stable at ${barH}px`)
    : fail(`${label} — bar height changed ${barH} -> ${pinned.barH}`);

  // An in-page anchor must not land under the pinned chrome.
  await page.goto(BASE + '/terms-conditions.html', { waitUntil: 'networkidle' });
  await page.click('a[href="#lien"]');
  await page.waitForTimeout(700);
  const anchor = await page.evaluate(() => {
    const chrome =
      document.querySelector('.utility-bar').offsetHeight +
      document.querySelector('.site-header').offsetHeight;
    const h = document.querySelector('#lien h2').getBoundingClientRect();
    return { headingTop: Math.round(h.top), chrome: Math.round(chrome) };
  });
  anchor.headingTop >= anchor.chrome
    ? pass(`${label} — anchor links clear the pinned chrome`)
    : fail(`${label} — anchor heading at ${anchor.headingTop}px is under ${anchor.chrome}px of chrome`);

  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 2d. Hero
 * ------------------------------------------------------------------ */
console.log('\n=== HERO ===');
{
  const ctx = await newCtx({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const bad = [];
  page.on('response', (r) => {
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  const hero = await page.evaluate(() => {
    const img = document.querySelector('.hero__media img');
    const h1 = document.querySelector('.hero h1');
    return {
      photoLoaded: !!img && img.naturalWidth > 0,
      headlineVisible: !!h1 && h1.getBoundingClientRect().height > 0,
      heroHeight: Math.round(document.querySelector('.hero').getBoundingClientRect().height),
    };
  });

  hero.photoLoaded ? pass('hero photo loads') : fail('hero photo missing');
  hero.headlineVisible ? pass('hero headline renders') : fail('hero headline missing');
  hero.heroHeight > 500 ? pass(`hero fills the fold (${hero.heroHeight}px)`) : fail(`hero only ${hero.heroHeight}px tall`);
  bad.length === 0 ? pass('no failed requests on the homepage') : fail(`failed request: ${bad[0]}`);

  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 2e. Hero reel
 *
 * The clip plays inside the hero, not over the page. The load-bearing
 * guarantees: the headline always comes back, and the site stays usable
 * throughout — the header visible, the page scrollable, nothing modal.
 * ------------------------------------------------------------------ */
console.log('\n=== HERO REEL ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  const hasReel = await page.evaluate(() => !!document.getElementById('hero-reel'));

  if (!hasReel) {
    const clean = await page.evaluate(() => ({
      copyVisible: getComputedStyle(document.getElementById('hero-copy')).opacity === '1',
      pending: document.documentElement.classList.contains('reel-pending'),
      noReplay: !document.getElementById('hero-replay'),
    }));
    clean.copyVisible && !clean.pending && clean.noReplay
      ? pass('no clip supplied — hero renders normally, reel markup stripped')
      : fail(`reel absent but hero state wrong: ${JSON.stringify(clean)}`);
    await ctx.close();
  } else {
    const playing = await page.evaluate(() => {
      const v = document.querySelector('.hero__reel-video');
      const r = v.getBoundingClientRect();
      return {
        isPlaying: document.querySelector('.hero').classList.contains('is-reel-playing'),
        copyHidden: getComputedStyle(document.getElementById('hero-copy')).opacity === '0',
        square: Math.abs(r.width - r.height) < 2,
        muted: v.muted,
        advancing: v.currentTime > 0.3,
        headerVisible: document.querySelector('.site-header').getBoundingClientRect().top >= 0,
        scrollable: getComputedStyle(document.body).overflow !== 'hidden',
      };
    });
    playing.isPlaying ? pass('reel autoplays on first visit') : fail('reel never started');
    playing.advancing ? pass('clip is advancing') : fail('clip loaded but is not playing');
    playing.copyHidden ? pass('hero copy steps aside while it plays') : fail('hero copy still visible during reel');
    playing.square ? pass('reel frame is square (clip is never cropped)') : fail('reel frame is not square');
    playing.muted ? pass('reel is muted') : fail('reel is NOT muted — autoplay will be blocked');
    playing.headerVisible ? pass('header stays visible — not a modal') : fail('header covered by the reel');
    playing.scrollable ? pass('page stays scrollable during the reel') : fail('page scroll was locked');

    // The site must genuinely be usable mid-reel.
    await page.click('.site-nav a[data-nav="services"]');
    await page.waitForLoadState('domcontentloaded');
    (page.url().includes('services'))
      ? pass('can navigate away while the reel plays')
      : fail('navigation blocked during the reel');

    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Returning visitor: hero immediately, nothing downloaded.
    const vidReqs = [];
    page.on('request', (r) => {
      if (/intro\.(mp4|webm)/.test(r.url())) vidReqs.push(r.url());
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ret = await page.evaluate(() => ({
      copyVisible: getComputedStyle(document.getElementById('hero-copy')).opacity === '1',
      notPlaying: !document.querySelector('.hero').classList.contains('is-reel-playing'),
    }));
    ret.copyVisible && ret.notPlaying
      ? pass('returning visitor gets the headline immediately')
      : fail('reel replayed for a returning visitor');
    vidReqs.length === 0 ? pass('returning visitor downloads no video') : fail('video re-downloaded');

    // Replay restarts the cycle.
    await page.click('#hero-replay');
    await page.waitForTimeout(1800);
    const replayed = await page.evaluate(() => ({
      playing: document.querySelector('.hero').classList.contains('is-reel-playing'),
      copyHidden: getComputedStyle(document.getElementById('hero-copy')).opacity === '0',
      time: document.querySelector('.hero__reel-video').currentTime,
    }));
    replayed.playing && replayed.copyHidden && replayed.time > 0.3
      ? pass('replay button restarts the cycle')
      : fail(`replay did not restart: ${JSON.stringify(replayed)}`);

    // Clicking the reel ends it early and restores the hero.
    await page.click('#hero-reel', { position: { x: 640, y: 300 } });
    await page.waitForTimeout(900);
    const dismissed = await page.evaluate(() => ({
      stopped: !document.querySelector('.hero').classList.contains('is-reel-playing'),
      copyVisible: getComputedStyle(document.getElementById('hero-copy')).opacity === '1',
    }));
    dismissed.stopped && dismissed.copyVisible
      ? pass('clicking the reel ends it and restores the hero')
      : fail(`dismiss failed: ${JSON.stringify(dismissed)}`);
    await ctx.close();

    // Reduced motion: no autoplay, no download, hero readable.
    const rm = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
    });
    const rmPage = await rm.newPage();
    const rmReqs = [];
    rmPage.on('request', (r) => {
      if (/intro\.(mp4|webm)/.test(r.url())) rmReqs.push(r.url());
    });
    await rmPage.goto(BASE + '/', { waitUntil: 'networkidle' });
    await rmPage.waitForTimeout(1000);
    const rmState = await rmPage.evaluate(
      () => getComputedStyle(document.getElementById('hero-copy')).opacity === '1'
    );
    rmState && rmReqs.length === 0
      ? pass('reduced-motion visitors get the hero, never the autoplay')
      : fail('reduced-motion visitor was shown or served the reel');
    await rm.close();
  }

  if (errs.length) fail(`hero reel JS error: ${errs[0]}`);

  const other = await newCtx({ viewport: { width: 1280, height: 900 } });
  const otherPage = await other.newPage();
  await otherPage.goto(BASE + '/gallery.html', { waitUntil: 'networkidle' });
  (await otherPage.evaluate(() => !document.getElementById('hero-reel')))
    ? pass('interior pages carry no reel')
    : fail('reel markup leaked onto an interior page');
  await other.close();
}

/* ------------------------------------------------------------------ *
 * 3. The assistant — three branches
 * ------------------------------------------------------------------ */
console.log('\n=== ASSISTANT ===');
{
  const runFlow = async (label, steps) => {
    const ctx = await newCtx({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#chat-launcher', { timeout: 5000 });
    await page.click('#chat-launcher');
    await page.waitForTimeout(900);

    for (const step of steps) {
      if (step.chip) {
        const chip = page.locator(`.chat-chip:has-text("${step.chip}")`).first();
        await chip.waitFor({ state: 'visible', timeout: 6000 });
        await chip.click();
      } else {
        await page.fill('#chat-input', step.type);
        await page.press('#chat-input', 'Enter');
      }
      // The assistant plays a typing indicator of up to ~900ms per message
      // before rendering the next prompt, so give each turn room to land.
      await page.waitForTimeout(step.wait || 1500);
    }

    const state = await page.evaluate(() => ({
      messages: document.querySelectorAll('.msg').length,
      hasSummary: !!document.querySelector('.msg--summary'),
      hasAlert: !!document.querySelector('.msg--alert'),
      lastBot: document.querySelector('.msg--bot:last-of-type')?.textContent?.slice(0, 70),
      chips: [...document.querySelectorAll('.chat-chip')].map((c) => c.textContent),
    }));

    if (errors.length) fail(`${label} — JS error: ${errors[0]}`);
    else pass(`${label} — ${state.messages} messages, summary=${state.hasSummary}, alert=${state.hasAlert}`);

    await page.screenshot({ path: `${SHOTS}/chat-${label.replace(/\W+/g, '-')}.png` });
    await ctx.close();
    return state;
  };

  // A. Bathroom, all the way to the summary.
  await runFlow('bathroom-full', [
    { chip: 'Bathroom Remodeling' },
    { chip: '2' },
    { chip: 'Full gut and rebuild' },
    { chip: 'No' },
    { chip: 'My own home' },
    { chip: 'Within a month' },
    { chip: '$15,000' },
    { chip: 'Placerville' },
    { chip: 'Skip this' },
    { type: 'Maria Gonzalez' },
    { type: '9165550123' },
    { chip: 'No email, thanks' },
    { chip: 'Call me' },
  ]);

  // B. Urgency escalation.
  await runFlow('urgent-leak', [
    { chip: 'Bathroom Remodeling' },
    { chip: '1' },
    { chip: 'Full gut and rebuild' },
    { type: 'yes there is a bad leak and the floor is soft' },
  ]);

  // C. Phone validation must reject a short number.
  const validation = await runFlow('phone-validation', [
    { chip: 'Concrete' },
    { chip: 'Driveway' },
    { chip: '300' },
    { chip: 'Yes' },
    { chip: 'My own home' },
    { chip: 'As soon as possible' },
    { chip: 'Not sure yet' },
    { chip: 'Placerville' },
    { chip: 'Skip this' },
    { type: 'Test Person' },
    { type: '123' },
  ]);
  /Please enter a 10-digit/i.test(validation.lastBot || '')
    ? pass('phone validation rejects a short number')
    : fail(`phone validation did not fire — last bot said: "${validation.lastBot}"`);
}

/* ------------------------------------------------------------------ *
 * 4. Quote form — validation, preset, draft, submit fallback
 * ------------------------------------------------------------------ */
console.log('\n=== QUOTE FORM ===');
{
  const ctx = await newCtx({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  // Blocks an empty step.
  await page.goto(BASE + '/quote.html', { waitUntil: 'networkidle' });
  await page.click('.step.is-active [data-step-next]');
  await page.waitForTimeout(300);
  const blocked = await page.evaluate(
    () => !!document.querySelector('.step.is-active .field__error.is-shown')
  );
  blocked ? pass('step 1 blocks with no selection') : fail('step 1 advanced without a selection');

  // ?service= preset jumps to step 2.
  await page.goto(BASE + '/quote.html?service=deck', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const preset = await page.evaluate(() => ({
    checked: document.querySelector('input[name=projectType]:checked')?.value,
    step: [...document.querySelectorAll('.step')].findIndex((s) => s.classList.contains('is-active')),
  }));
  preset.checked === 'Deck / Outdoor Living' && preset.step === 1
    ? pass('?service=deck preselects and advances')
    : fail(`?service preset wrong: ${JSON.stringify(preset)}`);

  // Full run to the review step.
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/quote.html', { waitUntil: 'networkidle' });
  await page.click('.step.is-active label.option:has-text("Bathroom Remodeling")');
  await page.waitForTimeout(500);
  await page.click('.step.is-active label.option:has-text("My own home")');
  await page.fill('#details', 'Guest bathroom, 1970s house, tub to shower.');
  await page.fill('#city', 'Placerville');
  await page.click('.step.is-active [data-step-next]');
  await page.waitForTimeout(400);
  await page.click('.step.is-active label.option:has-text("Within a month")');
  await page.click('.step.is-active label.option:has-text("$15,000")');
  await page.click('.step.is-active [data-step-next]');
  await page.waitForTimeout(400);

  await page.fill('#name', 'Maria Gonzalez');
  await page.fill('#phone', '9165550123');
  const formatted = await page.inputValue('#phone');
  formatted === '(916) 555-0123'
    ? pass('phone formats as you type')
    : fail(`phone formatting produced "${formatted}"`);

  await page.fill('#email', 'not-an-email');
  await page.click('.step.is-active label.option:has-text("Call me")');
  await page.click('.step.is-active [data-step-next]');
  await page.waitForTimeout(300);
  const emailBlocked = await page.evaluate(
    () => !!document.querySelector('#email[aria-invalid="true"]')
  );
  emailBlocked ? pass('bad email is rejected') : fail('bad email passed validation');

  await page.fill('#email', 'maria@example.com');
  await page.click('.step.is-active [data-step-next]');
  await page.waitForTimeout(500);

  const review = await page.evaluate(() => ({
    onReview: !!document.querySelector('.step[data-review="true"].is-active'),
    rows: document.querySelectorAll('#review-list div').length,
    text: document.getElementById('review-list')?.textContent || '',
  }));
  review.onReview && review.rows >= 7
    ? pass(`review step lists ${review.rows} answers`)
    : fail(`review step wrong: ${JSON.stringify({ ...review, text: undefined })}`);

  // Draft survives a reload.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const restored = await page.inputValue('#name');
  restored === 'Maria Gonzalez'
    ? pass('draft survives a reload')
    : fail(`draft not restored — name was "${restored}"`);

  // Submitting with no endpoint must offer the mailto fallback, not fail silently.
  // Walk the real flow rather than forcing the last step into view — the form
  // validates whichever step it believes is current, so a faked DOM state would
  // simply be rejected and prove nothing.
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/quote.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.click('.step.is-active label.option:has-text("Concrete")');
  await page.waitForTimeout(600);
  await page.click('.step.is-active label.option:has-text("My own home")');
  await page.fill('#city', 'Placerville');
  await page.click('.step.is-active [data-step-next]');
  await page.waitForTimeout(400);
  await page.click('.step.is-active label.option:has-text("As soon as possible")');
  await page.click('.step.is-active label.option:has-text("Not sure yet")');
  await page.click('.step.is-active [data-step-next]');
  await page.waitForTimeout(400);
  await page.fill('#name', 'Test Person');
  await page.fill('#phone', '9165550199');
  await page.click('.step.is-active label.option:has-text("Call me")');
  await page.click('.step.is-active [data-step-next]');
  // Clear the "filled in suspiciously fast" spam gate so this exercises the
  // real delivery path rather than the bot rejection.
  await page.waitForTimeout(4000);

  await page.click('.step.is-active [data-submit]');
  await page.waitForTimeout(1200);
  const fallback = await page.evaluate(() => {
    const host = document.getElementById('form-status');
    return { shown: host && !host.hidden, mailto: !!host?.querySelector('a[href^="mailto:"]') };
  });
  fallback.shown && fallback.mailto
    ? pass('unconfigured submit offers a mailto fallback')
    : fail(`no fallback offered: ${JSON.stringify(fallback)}`);

  if (errors.length) fail(`quote form JS error: ${errors[0]}`);
  await page.screenshot({ path: `${SHOTS}/quote-review.png`, fullPage: false });
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 5. Gallery lightbox + keyboard
 * ------------------------------------------------------------------ */
console.log('\n=== GALLERY ===');
{
  const ctx = await newCtx({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/gallery.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const count = await page.locator('.gallery-item').count();
  count === PHOTOS.length
    ? pass(`${count} gallery items rendered`)
    : fail(`expected ${PHOTOS.length} items, got ${count}`);

  await page.click('.gallery-item');
  await page.waitForTimeout(400);
  let lb = await page.evaluate(() => {
    const el = document.querySelector('.lightbox');
    return { open: el?.classList.contains('is-open'), count: document.querySelector('.lightbox__count')?.textContent };
  });
  lb.open ? pass(`lightbox opens (${lb.count})`) : fail('lightbox did not open');

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.querySelector('.lightbox__count')?.textContent);
  after !== lb.count ? pass(`arrow key advances (${after})`) : fail('arrow key did not advance');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() => !document.querySelector('.lightbox').classList.contains('is-open'));
  closed ? pass('Escape closes the lightbox') : fail('Escape did not close the lightbox');

  // Filter narrows the grid. Checked by actual rendering (getBoundingClientRect),
  // not the `hidden` DOM property — a `display` rule on `.gallery-item` once
  // outranked the browser's [hidden] default, so items stayed visible on screen
  // while `.hidden` correctly read true. The property alone would not catch that.
  await page.click('[data-filter="concrete"]');
  await page.waitForTimeout(300);
  const filterResult = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.gallery-item')];
    const onScreen = items.filter((i) => i.getBoundingClientRect().width > 0);
    const flaggedHidden = items.filter((i) => i.hidden);
    const visibleButFlaggedHidden = onScreen.filter((i) => i.hidden);
    return { onScreenCount: onScreen.length, flaggedHiddenCount: flaggedHidden.length, leaked: visibleButFlaggedHidden.length };
  });
  const expectConcrete = PHOTOS.filter((p) => p.categories.includes('concrete')).length;
  if (filterResult.leaked > 0) {
    fail(`concrete filter: ${filterResult.leaked} item(s) marked hidden but still rendered on screen`);
  } else if (filterResult.onScreenCount !== expectConcrete) {
    fail(`concrete filter shows ${filterResult.onScreenCount} on screen, expected ${expectConcrete}`);
  } else {
    pass(`concrete filter shows ${filterResult.onScreenCount} on screen`);
  }

  // Videos are click-to-play: the poster is all a plain page view downloads.
  const cards = await page.locator('.video-card').count();
  cards === VIDEOS.length
    ? pass(`${cards} video cards rendered`)
    : fail(`expected ${VIDEOS.length} video cards, got ${cards}`);

  const mp4s = [];
  page.on('request', (r) => {
    if (/\.mp4(\?|$)/.test(r.url()) && !/intro\.mp4/.test(r.url())) mp4s.push(r.url());
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  mp4s.length === 0
    ? pass('no project video downloads before play is pressed')
    : fail(`video fetched on load: ${mp4s[0]}`);

  // Nothing on the page may reach a third party any more.
  const thirdParty = await page.evaluate(() =>
    [...document.querySelectorAll('[src],[href]')]
      .map((el) => el.getAttribute('src') || el.getAttribute('href'))
      .filter((u) => u && /facebook|fbcdn/.test(u) && !/facebook\.com\/profile/.test(u))
  );
  thirdParty.length === 0
    ? pass('gallery embeds nothing from Facebook')
    : fail(`Facebook embed still present: ${thirdParty[0]}`);

  await page.click('.video-card__play');
  await page.waitForTimeout(1200);
  const playing = await page.evaluate(() => {
    const v = document.querySelector('.video-card video');
    return v ? { has: true, src: v.currentSrc, t: v.currentTime } : { has: false };
  });
  playing.has ? pass(`video plays on click (t=${playing.t.toFixed(1)}s)`) : fail('play button produced no <video>');

  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 6. Footer + logo integrity
 * ------------------------------------------------------------------ */
console.log('\n=== FOOTER & LOGO ===');
{
  const ctx = await newCtx({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const footer = await page.evaluate(() => {
    const bar = document.querySelector('.powered-bar');
    const inner = document.querySelector('.powered-bar__inner');
    const img = document.querySelector('.powered-bar__chip img');
    const cs = getComputedStyle(bar);
    const cis = getComputedStyle(inner);
    return {
      bg: cs.backgroundColor,
      pad: cs.paddingTop,
      color: cis.color,
      fontSize: cis.fontSize,
      logoSrc: img?.getAttribute('src'),
      logoH: img?.getBoundingClientRect().height,
      chipBg: getComputedStyle(document.querySelector('.powered-bar__chip')).backgroundColor,
      text: document.querySelector('.powered-bar__inner')?.innerText.replace(/\n+/g, ' | '),
      links: [...document.querySelectorAll('.powered-bar__legal a')].map((a) => a.getAttribute('href')),
    };
  });

  const checks = [
    [footer.bg === 'rgb(26, 26, 26)', `bar background ${footer.bg} (expect rgb(26,26,26))`],
    [footer.pad === '24px', `bar padding ${footer.pad} (expect 24px)`],
    [footer.color === 'rgb(163, 163, 163)', `text colour ${footer.color} (expect rgb(163,163,163))`],
    [footer.fontSize === '12px', `font-size ${footer.fontSize} (expect 12px)`],
    [Math.round(footer.logoH) === 14, `Conect-R logo height ${footer.logoH} (expect 14)`],
    [footer.chipBg === 'rgb(255, 255, 255)', `chip background ${footer.chipBg}`],
    [footer.links.join(',') === '/privacy-policy.html,/terms-conditions.html', `legal links ${footer.links}`],
  ];
  checks.forEach(([ok, msg]) => (ok ? pass(msg) : fail(msg)));
  console.log(`  info  footer reads: ${footer.text}`);

  const logo = await page.evaluate(() => {
    const a = document.querySelector('.brand');
    const img = a.querySelector('img');
    return {
      src: img.getAttribute('src'),
      boxW: a.getBoundingClientRect().width,
      boxH: a.getBoundingClientRect().height,
      imgW: img.getBoundingClientRect().width,
      natural: `${img.naturalWidth}x${img.naturalHeight}`,
    };
  });
  logo.src === '/assets/logo/aj-logo.jpg' && logo.natural === '1024x1024'
    ? pass(`header uses the unmodified master (${logo.natural}), cropped to ${Math.round(logo.boxW)}x${Math.round(logo.boxH)}`)
    : fail(`header logo wrong: ${JSON.stringify(logo)}`);

  await page.screenshot({ path: `${SHOTS}/footer.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
  await ctx.close();
}

await browser.close();

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURE(S)`}\n`);
process.exit(failures === 0 ? 0 : 1);
