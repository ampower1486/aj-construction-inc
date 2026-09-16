import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../styles/admin.css';

import { supabase, isConfigured } from './supabase-client.js';
import { initPasswordToggles } from './password-toggle.js';

initPasswordToggles();

const lede = document.getElementById('lede');
const form = document.getElementById('invite-form');
const statusHost = document.getElementById('form-status');
const submitBtn = form.querySelector('[data-submit]');

function setStatus(kind, message) {
  if (!message) {
    statusHost.hidden = true;
    statusHost.innerHTML = '';
    return;
  }
  statusHost.hidden = false;
  statusHost.innerHTML = `<div class="portal-alert portal-alert--${kind}">${message}</div>`;
}

if (!isConfigured) {
  lede.textContent = 'This portal is not configured yet.';
} else {
  // Supabase's client parses the invite link's URL fragment and establishes
  // a session automatically (detectSessionInUrl). That can complete either
  // before or after this script attaches its listener, so check both a
  // one-time getSession() and the ongoing onAuthStateChange feed — an invite
  // link fires SIGNED_IN or PASSWORD_RECOVERY once the session is ready.
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    lede.textContent = 'Choose a password to continue.';
    form.hidden = false;
  };

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') reveal();
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) reveal();
    else lede.textContent = 'This link is invalid or has expired. Contact management for a new one.';
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isConfigured) return;

  setStatus(null);

  const password = form.password.value;
  const password2 = form.password2.value;

  if (password.length < 8) {
    setStatus('error', 'Password must be at least 8 characters.');
    return;
  }
  if (password !== password2) {
    setStatus('error', 'Passwords do not match.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    setStatus('error', 'Could not set your password. Try again, or contact management for a new link.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Set Password & Continue';
    return;
  }

  location.href = '/admin/index.html';
});
