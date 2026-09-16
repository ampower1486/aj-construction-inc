/**
 * The shared Supabase client for every /admin/*.html page.
 *
 * The anon/publishable key is safe to ship to the browser by design — it is
 * meant to be public. The real security boundary is the Row Level Security
 * policies in supabase/schema.sql, enforced by Postgres on every query
 * regardless of what this client is told to do. Never put the service_role
 * key anywhere under src/ — that one is a secret and lives only in
 * api/invite-user.js, read from a server-side environment variable.
 */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = Boolean(url && anonKey);

if (!isConfigured) {
  console.error(
    'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Constructing createClient() with an empty URL throws, so only build a real
// client when configured; every caller checks isConfigured first.
export const supabase = isConfigured ? createClient(url, anonKey) : null;
