import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../styles/admin.css';

import { supabase, isConfigured } from './supabase-client.js';
import { requireSession, signOut } from './auth-guard.js';

const ROLE_LABEL = { global_admin: 'Global Admin', super_admin: 'Super Admin', admin: 'Admin' };
const CAN_MANAGE_TEAM = ['super_admin', 'global_admin'];

document.getElementById('sign-out').addEventListener('click', signOut);

function setStatus(kind, message) {
  const host = document.getElementById('form-status');
  if (!message) {
    host.hidden = true;
    host.innerHTML = '';
    return;
  }
  host.hidden = false;
  host.innerHTML = `<div class="portal-alert portal-alert--${kind}">${message}</div>`;
}

async function renderTeam() {
  const { data: rows, error } = await supabase
    .from('profiles')
    .select('full_name, role, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    setStatus('error', 'Could not load the team list.');
    return;
  }

  document.getElementById('team-rows').innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.full_name)}</td>
        <td>${ROLE_LABEL[r.role] || r.role}</td>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
      </tr>`
    )
    .join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function boot() {
  if (!isConfigured) {
    document.getElementById('who-name').textContent = 'Portal not configured';
    return;
  }

  const auth = await requireSession();
  if (!auth) return; // requireSession already redirected to login

  const { session, profile } = auth;

  document.getElementById('who-name').textContent = profile.full_name;
  const roleBadge = document.getElementById('who-role');
  roleBadge.textContent = ROLE_LABEL[profile.role] || profile.role;
  roleBadge.hidden = false;

  if (!CAN_MANAGE_TEAM.includes(profile.role)) return;

  document.getElementById('team-section').hidden = false;
  await renderTeam();

  document.getElementById('invite-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(null);

    const form = e.target;
    const submitBtn = form.querySelector('[data-submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: form.email.value.trim(),
          fullName: form.fullName.value.trim(),
          role: form.role.value,
        }),
      });
      const result = await res.json();

      if (!result.ok) {
        setStatus('error', 'Could not send that invite. Check the email and try again.');
        return;
      }

      setStatus('success', `Invite sent to ${form.email.value.trim()}.`);
      form.reset();
      await renderTeam();
    } catch {
      setStatus('error', 'Could not reach the server. Try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Invite';
    }
  });
}

boot();
