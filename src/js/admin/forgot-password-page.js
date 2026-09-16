import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../styles/admin.css';

import { supabase, isConfigured } from './supabase-client.js';

const form = document.getElementById('reset-form');
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isConfigured) return;

  setStatus(null);
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const redirectTo = `${location.origin}/admin/accept-invite.html`;
  const { error } = await supabase.auth.resetPasswordForEmail(form.email.value.trim(), { redirectTo });

  // Deliberately the same message whether or not the address is a real
  // account — confirming which emails exist in the system is not something
  // a public-facing form should reveal.
  if (error) console.error('resetPasswordForEmail failed', error);

  setStatus(
    'success',
    'If that email has an account, a reset link is on its way. Check your inbox.'
  );
  submitBtn.disabled = false;
  submitBtn.textContent = 'Send Reset Link';
});
