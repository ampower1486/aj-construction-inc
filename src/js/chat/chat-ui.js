/**
 * The assistant's presentation layer — rendering, focus, and persistence.
 *
 * Knows nothing about the conversation's content and nothing about how leads
 * are delivered. It asks the engine what to say next and hands the finished
 * lead to lead-service.js.
 */

import { createEngine, ScriptedEngine } from './chat-engine.js';
import { icons } from '../icons.js';
import { t, onLocaleChange, getLocale } from '../i18n.js';
import { buildLead, submitLead } from '../lead-service.js';

const STORE_KEY = 'aj:chat';
const TYPING_MIN = 260;
const TYPING_PER_CHAR = 7;
const TYPING_MAX = 900;

export function initChat() {
  if (document.getElementById('chat-panel')) return;

  const host = document.createElement('div');
  host.innerHTML = `
    <button class="chat-launcher" id="chat-launcher" type="button" aria-haspopup="dialog" aria-controls="chat-panel">
      ${icons.clipboard}
      <span data-i18n="chat.launcher">Start My Project</span>
      <i class="chat-launcher__dot" aria-hidden="true"></i>
    </button>

    <div class="chat-panel" id="chat-panel" role="dialog" aria-label="${t('chat.title')}" aria-hidden="true">
      <div class="chat-header">
        <span class="chat-header__avatar">${icons.clipboard}</span>
        <span class="chat-header__title">
          <strong data-i18n="chat.title">Project Assistant</strong>
          <span data-i18n="chat.subtitle">AJ Construction &middot; replies right away</span>
        </span>
        <button class="chat-close" id="chat-close" type="button" data-i18n-attr="aria-label:chat.close">
          ${icons.close}
        </button>
      </div>

      <div class="chat-log" id="chat-log" role="log" aria-live="polite" aria-atomic="false"></div>

      <div class="chat-foot">
        <div class="chat-chips" id="chat-chips"></div>
        <form class="chat-form" id="chat-form">
          <textarea class="chat-input" id="chat-input" rows="1"
                    data-i18n-attr="placeholder:chat.placeholder.type;aria-label:chat.inputLabel"
                    placeholder="Type your answer…" aria-label="Your message"></textarea>
          <button class="chat-send" type="submit" data-i18n-attr="aria-label:chat.send">${icons.send}</button>
        </form>
        <p class="chat-privacy">
          <span data-i18n="chat.privacy">Your details go straight to our project manager.</span>
          <a href="/privacy-policy.html" data-i18n="footer.privacy">Privacy Policy</a>
        </p>
      </div>
    </div>`;
  document.body.appendChild(host);

  const launcher = host.querySelector('#chat-launcher');
  const panel = host.querySelector('#chat-panel');
  const log = host.querySelector('#chat-log');
  const chips = host.querySelector('#chat-chips');
  const form = host.querySelector('#chat-form');
  const input = host.querySelector('#chat-input');
  const closeBtn = host.querySelector('#chat-close');

  let engine = createEngine();
  let started = false;
  let busy = false;
  let lastFocus = null;

  /* --- Rendering --------------------------------------------------------- */

  const scroll = () => {
    log.scrollTop = log.scrollHeight;
  };

  function bubble(msg) {
    const el = document.createElement('div');

    if (msg.kind === 'summary') {
      el.className = 'msg msg--bot msg--summary';
      const rows = msg.summary
        .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
        .join('');
      el.innerHTML = `<strong>${esc(t('chat.summaryTitle'))}</strong><dl>${rows}</dl>`;
    } else if (msg.kind === 'alert') {
      el.className = 'msg msg--alert';
      el.innerHTML = msg.html || esc(msg.text);
    } else if (msg.role === 'user') {
      el.className = 'msg msg--user';
      el.textContent = msg.text;
    } else {
      el.className = 'msg msg--bot';
      if (msg.html) el.innerHTML = msg.html;
      else el.textContent = msg.text;
    }

    log.appendChild(el);
    scroll();
    return el;
  }

  function typing() {
    const el = document.createElement('div');
    el.className = 'typing';
    el.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(el);
    scroll();
    return el;
  }

  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Play bot messages out one at a time so the panel reads as a conversation. */
  async function playMessages(messages) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (const msg of messages) {
      if (msg.role === 'user') {
        bubble(msg);
        continue;
      }
      if (reduce) {
        bubble(msg);
        continue;
      }

      const ind = typing();
      const len = (msg.text || msg.html || '').length;
      await pause(Math.min(TYPING_MAX, TYPING_MIN + len * TYPING_PER_CHAR));
      ind.remove();
      bubble(msg);
    }
  }

  function renderPrompt(prompt) {
    chips.innerHTML = '';

    if (!prompt) {
      form.classList.add('is-hidden');
      return;
    }

    const options = [...(prompt.options || [])];
    if (prompt.skip) options.push({ ...prompt.skip, muted: true });

    options.forEach((opt) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `chat-chip${opt.primary ? ' chat-chip--primary' : ''}`;
      b.textContent = opt.label;
      b.dataset.value = opt.value;
      chips.appendChild(b);
    });

    const wantsText = prompt.allowText !== false && prompt.type !== 'review';
    form.classList.toggle('is-hidden', !wantsText);

    if (wantsText) {
      input.placeholder = prompt.placeholder || t('chat.placeholder.type');
      // The composer is a <textarea> so answers can wrap — it has no `type`,
      // only an inputMode, which is what selects the right mobile keyboard.
      input.inputMode =
        prompt.type === 'phone' ? 'tel' : prompt.type === 'email' ? 'email' : 'text';
    }
    scroll();
  }

  /* --- Turn handling ----------------------------------------------------- */

  async function runTurn(turn, { echo } = {}) {
    busy = true;
    chips.innerHTML = '';
    if (echo) bubble({ role: 'user', text: echo });

    try {
      await playMessages(turn.messages);

      if (turn.done) {
        await deliver(turn.lead);
      } else {
        renderPrompt(turn.prompt);
      }
    } finally {
      // Whatever happens, the panel must not be left permanently unresponsive.
      busy = false;
      persist();
    }
  }

  async function deliver(leadFields) {
    const lead = buildLead(leadFields, 'assistant');
    const ind = typing();
    const result = await submitLead(lead);
    ind.remove();

    if (result.ok) {
      bubble({ role: 'bot', kind: 'alert', html: successHtml() });
    } else {
      bubble({ role: 'bot', kind: 'alert', html: fallbackHtml(result.fallback) });
    }

    chips.innerHTML = '';
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'chat-chip';
    again.textContent = t('chat.o.startOver');
    again.dataset.value = '__restart__';
    chips.appendChild(again);
    form.classList.add('is-hidden');

    clearStored();
  }

  function successHtml() {
    return `<strong>${esc(t('chat.sentTitle'))}</strong><br>${esc(t('chat.sentBody'))}
      <ul>
        <li><a href="tel:+19165323015">(916) 532-3015</a></li>
        <li><a href="tel:+15305037343">(530) 503-7343</a></li>
      </ul>`;
  }

  function fallbackHtml(mailto) {
    return `<strong>${esc(t('chat.fallbackTitle'))}</strong><br>${esc(t('chat.fallbackBody'))}
      <ul>
        <li><a href="${mailto}">${esc(t('chat.fallbackEmail'))}</a></li>
        <li><a href="tel:+19165323015">(916) 532-3015</a></li>
      </ul>`;
  }

  /* --- Persistence across pages ------------------------------------------ */

  function persist() {
    try {
      sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify({ engine: engine.serialize(), html: log.innerHTML, locale: getLocale() })
      );
    } catch {
      /* storage full or blocked — the conversation still works, it just won't
         survive a page change */
    }
  }

  function clearStored() {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* non-fatal */
    }
  }

  function restore() {
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
    } catch {
      return false;
    }
    if (!saved?.engine || saved.locale !== getLocale()) return false;

    try {
      engine = ScriptedEngine.deserialize(saved.engine);
    } catch {
      return false;
    }

    log.innerHTML = saved.html || '';
    renderPrompt(engine.currentPrompt());
    started = true;
    scroll();
    return true;
  }

  /* --- Open / close ------------------------------------------------------ */

  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.classList.add('is-hidden');

    if (!started) {
      started = true;
      runTurn(engine.start());
    }

    // On a phone the panel is full-screen; focusing the field opens the keyboard
    // over the greeting, so only pull focus on larger screens.
    if (window.matchMedia('(min-width: 561px)').matches) {
      setTimeout(() => input.focus(), 220);
    } else {
      closeBtn.focus();
    }
  }

  function close() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.classList.remove('is-hidden');
    document.body.classList.remove('is-locked');
    lastFocus?.focus?.();
  }

  /* --- Events ------------------------------------------------------------ */

  launcher.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
  });

  // Any element with data-chat-open launches the assistant.
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-chat-open]')) {
      e.preventDefault();
      open();
    }
  });

  chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.chat-chip');
    if (!btn || busy) return;

    const value = btn.dataset.value;
    if (value === '__restart__') {
      log.innerHTML = '';
      clearStored();
      runTurn(engine.restart());
      return;
    }

    const echo = value.startsWith('__') ? null : btn.textContent;
    runTurn(engine.send(value), { echo });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    input.style.height = 'auto';
    runTurn(engine.send(text), { echo: text });
  });

  // Enter sends, Shift+Enter makes a new line.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 108)}px`;
  });

  // Switching language mid-conversation restarts it rather than leaving a
  // half-English, half-Spanish transcript behind.
  onLocaleChange(() => {
    if (!started) return;
    log.innerHTML = '';
    clearStored();
    engine = createEngine();
    runTurn(engine.start());
  });

  restore();
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}
