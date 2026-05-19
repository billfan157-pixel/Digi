/**
 * Auth service (frontend-safe)
 *
 * Security:
 * - Never use `service_role` keys in frontend.
 * - Uses only anon public key configured in src/lib/supabase.js.
 *
 * Returns structured responses: { data, error }
 */

import { supabase } from "../lib/supabase";

function toError(error) {
  if (!error) return null;
  return {
    message: error.message,
    status: error.status,
    name: error.name,
    details: error.details,
    hint: error.hint,
  };
}

export async function signUp({ email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    data: data ?? null,
    error: toError(error),
  };
}

export async function loginWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    data: data ?? null,
    error: toError(error),
  };
}

/**
 * Google OAuth login
 * - `redirectTo` should be your app route that handles the OAuth callback.
 * - For production, set redirectTo explicitly (avoid relying on defaults).
 */
export async function loginWithGoogle({ redirectTo } = {}) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo || window.location.origin,
    },
  });

  return {
    data: data ?? null,
    error: toError(error),
  };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  return {
    data: null,
    error: toError(error),
  };
}
