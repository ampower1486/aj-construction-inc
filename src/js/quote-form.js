/**
 * Multi-step quote form.
 *
 * Driven by the markup in quote.html — each `.step` is one screen, and every
 * control that carries `name` becomes part of the lead. Answers are mirrored to
 * localStorage as they are entered so a refresh, a phone call, or an accidental
 * back-swipe does not cost the visitor their work.
 */

import { validators, formatPhone, buildLead, submitLead, labelFor } from './lead-service.js';
import { t, onLocaleChange } from './i18n.js';

const DRAFT_KEY = 'aj:quote-draft';
const MIN_FILL_MS = 3500; // anything faster than this is a bot, not a customer

export function initQuoteForm() {
  const form = document.getElementById('quote-form');
  if (!form) return;

  const steps = [...form.querySelectorAll('.step')];
  const bar = form.querySelector('#progress-bar');
  const stepNow = form.querySelector('#progress-now');
  const stepTotal = form.querySelector('#progress-total');
  const stepLabel = form.querySelector('#progress-label');
  const reviewHost = form.querySelector('#review-list');
  // Deliberately document-scoped: the status banner sits above the <form>, not
  // inside it, so form.querySelector would find nothing and every error message
  // would silently do nothing.
  const statusHost = document.getElementById('form-status');
  const openedAt = Date.now();

  let index = 0;
  if (stepTotal) stepTotal.textContent = String(steps.length);

  /* --- Draft persistence -------------------------------------------------- */

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(collect()));
    } catch {
      /* storage blocked — the form still works, it just won't survive a reload */
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* non-fatal */
    }
  };

  const loadDraft = () => {
    let draft;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    } catch {
      return;
    }
    if (!draft) return;

    Object.entries(draft).forEach(([name, value]) => {
      const fields = form.elements[name];
      if (!fields) return;

      if (fields instanceof RadioNodeList || fields.length > 1) {
        [...fields].forEach((f) => {
          if (f.type === 'radio') f.checked = f.value === value;
        });
      } else if (fields.type !== 'radio') {
        fields.value = value;
      } else {
        fields.checked = fields.value === value;
      }
    });
  };

  /* --- Values ------------------------------------------------------------- */

  function collect() {
    const data = {};
    new FormData(form).forEach((value, key) => {
      if (key.startsWith('_')) return;
      const v = String(value).trim();
      if (v) data[key] = v;
    });
    return data;
  }

  /* --- Validation --------------------------------------------------------- */

  function fieldError(el, messageKey) {
    const wrap = el.closest('.field') || el.closest('.fieldset');
    const box = wrap?.querySelector('.field__error');
    if (!box) return;

    if (messageKey) {
      box.textContent = t(messageKey);
      box.classList.add('is-shown');
      el.setAttribute('aria-invalid', 'true');
    } else {
      box.classList.remove('is-shown');
      el.removeAttribute('aria-invalid');
    }
  }

  function validateStep(stepEl) {
    let firstBad = null;

    stepEl.querySelectorAll('[data-validate]').forEach((el) => {
      const rules = el.dataset.validate.split(' ');
      let problem = null;

      for (const rule of rules) {
        const fn = validators[rule];
        if (!fn) continue;
        problem = fn(el.value, { required: rules.includes('required') });
        if (problem) break;
      }

      fieldError(el, problem);
      if (problem && !firstBad) firstBad = el;
    });

    // Radio groups marked required must have a selection.
    stepEl.querySelectorAll('[data-required-group]').forEach((group) => {
      const name = group.dataset.requiredGroup;
      const chosen = form.querySelector(`input[name="${name}"]:checked`);
      const box = group.querySelector('.field__error');

      if (!chosen) {
        if (box) {
          box.textContent = t('err.choose');
          box.classList.add('is-shown');
        }
        if (!firstBad) firstBad = group.querySelector('input');
      } else if (box) {
        box.classList.remove('is-shown');
      }
    });

    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.closest('.field, .fieldset')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return false;
    }
    return true;
  }

  /* --- Step navigation ---------------------------------------------------- */

  function show(next) {
    index = Math.max(0, Math.min(steps.length - 1, next));

    steps.forEach((s, i) => s.classList.toggle('is-active', i === index));

    if (bar) bar.style.width = `${((index + 1) / steps.length) * 100}%`;
    if (stepNow) stepNow.textContent = String(index + 1);
    if (stepLabel) {
      const key = steps[index].dataset.label;
      if (key) stepLabel.textContent = t(key);
    }

    if (steps[index].dataset.review === 'true') renderReview();

    const heading = steps[index].querySelector('h2');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });

    form.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function renderReview() {
    if (!reviewHost) return;
    const data = collect();

    const rows = Object.entries(data)
      .filter(([, v]) => v)
      .map(
        ([key, value]) =>
          `<div><dt>${escapeHtml(labelFor(key))}</dt><dd>${escapeHtml(value)}</dd></div>`
      )
      .join('');

    reviewHost.innerHTML = rows || `<p>${escapeHtml(t('quote.reviewEmpty'))}</p>`;
  }

  form.addEventListener('click', (e) => {
    const next = e.target.closest('[data-step-next]');
    const prev = e.target.closest('[data-step-prev]');

    if (next) {
      e.preventDefault();
      if (validateStep(steps[index])) {
        saveDraft();
        show(index + 1);
      }
    } else if (prev) {
      e.preventDefault();
      show(index - 1);
    }
  });

  /* --- Input behaviour ---------------------------------------------------- */

  form.addEventListener('input', (e) => {
    const el = e.target;

    if (el.dataset.format === 'phone') {
      const pos = el.selectionStart === el.value.length;
      el.value = formatPhone(el.value);
      if (pos) el.setSelectionRange(el.value.length, el.value.length);
    }

    // Clear an error as soon as the visitor starts fixing it.
    if (el.getAttribute('aria-invalid') === 'true') fieldError(el, null);
    saveDraft();
  });

  form.addEventListener('change', saveDraft);

  // Selecting a project type on step one advances immediately — one fewer tap.
  form.querySelectorAll('input[name="projectType"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      saveDraft();
      if (index === 0) setTimeout(() => show(1), 180);
    });
  });

  /* --- Submit ------------------------------------------------------------- */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(steps[index])) return;

    // Spam gates: an untouched honeypot and a plausible amount of time on task.
    if (form.elements._company?.value) return;
    if (Date.now() - openedAt < MIN_FILL_MS) {
      status('error', t('err.tooFast'));
      return;
    }

    const submitBtn = form.querySelector('[data-submit]');
    const original = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t('quote.sending');
    }
    status(null);

    const lead = buildLead(collect(), 'quote-form');
    const result = await submitLead(lead);

    if (result.ok) {
      clearDraft();
      showSuccess();
    } else {
      status(
        'error',
        result.reason === 'unconfigured' ? t('quote.errUnconfigured') : t('quote.errNetwork'),
        result.fallback
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    }
  });

  function status(kind, message, fallbackHref) {
    if (!statusHost) return;

    if (!kind) {
      statusHost.innerHTML = '';
      statusHost.hidden = true;
      return;
    }

    const link = fallbackHref
      ? ` <a href="${fallbackHref}">${escapeHtml(t('quote.errFallbackLink'))}</a>`
      : '';

    statusHost.hidden = false;
    statusHost.innerHTML = `<div class="alert alert--${kind}" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.8"/><path d="M12 7.8v4.8"/><path d="M12 16.1h.01"/></svg>
      <span>${escapeHtml(message)}${link}</span>
    </div>`;
    statusHost.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function showSuccess() {
    const panel = document.getElementById('quote-success');
    if (!panel) return;

    const summary = panel.querySelector('#success-summary');
    if (summary) {
      const data = collect();
      summary.innerHTML = Object.entries(data)
        .filter(([, v]) => v)
        .map(
          ([k, v]) => `<div><dt>${escapeHtml(labelFor(k))}</dt><dd>${escapeHtml(v)}</dd></div>`
        )
        .join('');
    }

    form.hidden = true;
    panel.hidden = false;
    panel.querySelector('h2')?.setAttribute('tabindex', '-1');
    panel.querySelector('h2')?.focus({ preventScroll: true });
    panel.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* --- Boot --------------------------------------------------------------- */

  loadDraft();
  show(0);

  // A ?service=bathroom link from the services page preselects that trade.
  const preset = new URLSearchParams(location.search).get('service');
  if (preset) {
    const match = form.querySelector(`input[name="projectType"][data-service="${preset}"]`);
    if (match) {
      match.checked = true;
      saveDraft();
      show(1);
    }
  }

  onLocaleChange(() => {
    if (steps[index]?.dataset.review === 'true') renderReview();
    if (stepLabel && steps[index]?.dataset.label) {
      stepLabel.textContent = t(steps[index].dataset.label);
    }
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}
