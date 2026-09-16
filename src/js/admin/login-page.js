import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../styles/admin.css';

import { supabase, isConfigured } from './supabase-client.js';
import { initPasswordToggles } from './password-toggle.js';

initPasswordToggles();

const form = document.getElementById('login-form');
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
  setStatus('error', 'This portal is not configured yet.');
  submitBtn.disabled = true;
}

// Already signed in? Skip straight past the login form.
if (isConfigured) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) location.href = '/admin/index.html';
  });
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isConfigured) return;

  setStatus(null);
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in…';

  const email = form.email.value.trim();
  const password = form.password.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    setStatus('error', 'That email and password combination was not recognized.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
    return;
  }

  location.href = '/admin/index.html';
});
