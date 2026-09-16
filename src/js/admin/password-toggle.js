/**
 * Show/hide toggle for password fields — hand-drawn eye / eye-slash on the
 * same 24px grid and 1.6px stroke as the rest of the site's icons.
 */

const EYE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>';

const EYE_OFF =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6.8 7.3A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6M10.6 5.7A10.4 10.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.4 4.2"/><path d="M9.5 9.6a3 3 0 0 0 4.2 4.2"/><path d="M4.2 4.2l15.6 15.6"/></svg>';

/**
 * Wires every [data-toggle-password] button to the password input it sits
 * next to inside the same .portal-field__input-wrap.
 */
export function initPasswordToggles(root = document) {
  root.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    const input = btn.closest('.portal-field__input-wrap')?.querySelector('input');
    if (!input) return;

    btn.innerHTML = EYE;
    btn.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.innerHTML = showing ? EYE : EYE_OFF;
      btn.setAttribute('aria-pressed', String(!showing));
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });
}
