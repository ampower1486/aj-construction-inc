/**
 * Serverless function behind the Team page's "Send Invite" button.
 *
 * Only a super_admin or global_admin may invite anyone — that check happens
 * HERE, server-side, against the caller's verified identity, not just in the
 * UI. An admin-role user (or anyone else) calling this endpoint directly,
 * even with a valid logged-in session, is refused.
 *
 * Required env vars: VITE_SUPABASE_URL (the project URL isn't secret, so it
 * reuses the same variable the browser client uses) and, server-only, never
 * prefixed VITE_, never sent to the browser: SUPABASE_SERVICE_ROLE_KEY
 * (Settings → API in the Supabase dashboard).
 *
 * One manual dashboard step this function depends on: the redirect URL it
 * passes to inviteUserByEmail must be listed under Authentication → URL
 * Configuration → Redirect URLs in the Supabase project, or Supabase will
 * silently send the invitee to the project's default Site URL instead.
 */

import { createClient } from '@supabase/supabase-js';

const CAN_INVITE = ['super_admin', 'global_admin'];
const INVITABLE_ROLES = ['admin', 'super_admin'];

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, reason: 'method_not_allowed' });
  }

  const supabase = adminClient();
  if (!supabase) {
    return res.status(500).json({ ok: false, reason: 'unconfigured' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ ok: false, reason: 'missing_token' });
  }

  const {
    data: { user: caller },
    error: callerError,
  } = await supabase.auth.getUser(token);

  if (callerError || !caller) {
    return res.status(401).json({ ok: false, reason: 'invalid_token' });
  }

  const { data: callerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', caller.id)
    .single();

  if (profileError || !callerProfile || !CAN_INVITE.includes(callerProfile.role)) {
    return res.status(403).json({ ok: false, reason: 'forbidden' });
  }

  const { email, fullName, role } = req.body || {};
  if (!email || !fullName || !INVITABLE_ROLES.includes(role)) {
    return res.status(400).json({ ok: false, reason: 'bad_payload' });
  }

  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '');
  const redirectTo = origin ? `${origin}/admin/accept-invite.html` : undefined;

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role, invited_by: callerProfile.id },
    redirectTo,
  });

  if (inviteError) {
    console.error('inviteUserByEmail failed', inviteError);
    return res.status(502).json({ ok: false, reason: 'invite_failed', detail: inviteError.message });
  }

  return res.status(200).json({ ok: true });
}
