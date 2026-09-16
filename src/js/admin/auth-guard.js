/**
 * Every page under /admin/ except login.html and accept-invite.html calls
 * this before rendering anything that depends on who is signed in.
 */

import { supabase, isConfigured } from './supabase-client.js';

/**
 * Resolves to { session, profile } for a signed-in staff member, or redirects
 * to the login page and resolves to null.
 */
export async function requireSession() {
  if (!isConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    location.href = '/admin/login.html';
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', session.user.id)
    .single();

  // A profile row is created automatically the moment an invited account is
  // created (see supabase/schema.sql) — a signed-in user with no row is not
  // a state this app should ever produce, so treat it as a sign to sign out
  // rather than show a half-working page.
  if (error || !profile) {
    console.error('Signed in but no profile row exists for this user.', error);
    await supabase.auth.signOut();
    location.href = '/admin/login.html';
    return null;
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') location.href = '/admin/login.html';
  });

  return { session, profile };
}

export async function signOut() {
  await supabase.auth.signOut();
  location.href = '/admin/login.html';
}
