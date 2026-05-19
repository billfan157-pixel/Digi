/**
 * User/profile service (frontend-safe)
 *
 * Demo CRUD + realtime subscription for `profiles` table:
 * - id
 * - user_id
 * - display_name
 * - avatar_url
 * - created_at
 *
 * Security & RLS:
 * - This file assumes you have enabled RLS on `public.profiles`.
 * - With only anon key, Supabase will enforce RLS policies.
 * - These functions never use `service_role` keys.
 *
 * Realtime:
 * - Subscribe to postgres changes on `public.profiles`
 * - Includes unsubscribe cleanup support.
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

function nowIso() {
  return new Date().toISOString();
}

/**
 * Example SQL schema (put into migrations, not into JS):
 *
 * -- public.profiles
 * create table if not exists public.profiles (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null unique references auth.users(id) on delete cascade,
 *   display_name text not null,
 *   avatar_url text,
 *   created_at timestamptz not null default now()
 * );
 *
 * -- Enable RLS
 * alter table public.profiles enable row level security;
 *
 * -- Allow users to view their own profile
 * create policy "profiles_select_own"
 * on public.profiles
 * for select
 * using (auth.uid() = user_id);
 *
 * -- Allow users to insert their own profile at signup time
 * create policy "profiles_insert_own"
 * on public.profiles
 * for insert
 * with check (auth.uid() = user_id);
 *
 * -- Allow users to update their own profile
 * create policy "profiles_update_own"
 * on public.profiles
 * for update
 * using (auth.uid() = user_id)
 * with check (auth.uid() = user_id);
 *
 * -- (Optional) Allow users to delete their own profile
 * create policy "profiles_delete_own"
 * on public.profiles
 * for delete
 * using (auth.uid() = user_id);
 */

export async function createProfile({
  userId,
  displayName,
  avatarUrl = null,
}) {
  // In most apps you can derive userId from session.
  // Keeping explicit param makes the function usable for backend jobs too,
  // but with anon key, RLS must still enforce auth.uid() = user_id.
  const { data, error } = await supabase.from("profiles").insert({
    user_id: userId,
    display_name: displayName,
    avatar_url: avatarUrl,
    // created_at default handles timestamps; included for clarity only
    // created_at: nowIso(),
  }).select("*").single();

  return {
    data: data ?? null,
    error: toError(error),
  };
}

export async function getProfileByUserId(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, display_name, avatar_url, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    data: data ?? null,
    error: toError(error),
  };
}

export async function updateProfile({
  userId,
  displayName,
  avatarUrl,
}) {
  const updates = {
    ...(displayName !== undefined ? { display_name: displayName } : {}),
    ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  return {
    data: data ?? null,
    error: toError(error),
  };
}

export async function deleteProfileByUserId(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .delete()
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  return {
    data: data ?? null,
    error: toError(error),
  };
}

/**
 * Realtime subscription for profiles changes.
 *
 * Usage:
 *   const channel = subscribeToProfilesChanges(payload => console.log(payload));
 *   // later: supabase.removeChannel(channel)
 *
 * IMPORTANT:
 * - Always unsubscribe/cleanup in React useEffect cleanup to avoid leaks.
 */
export function subscribeToProfilesChanges(onChange) {
  // With anon key, you can only listen to what RLS allows.
  const channel = supabase
    .channel("profiles-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
      },
      (payload) => {
        try {
          onChange?.(payload);
        } catch (e) {
          // avoid crashing the realtime callback
          console.error("profiles realtime callback error:", e);
        }
      }
    )
    .subscribe((status) => {
      // status: "SUBSCRIBED" | "CHANNEL_ERROR" | ...
      // Keep logging minimal in production.
      console.log("profiles realtime status:", status, "at", new Date().toISOString());
    });

  return channel;
}

/**
 * Helper to get the current user's id from the auth session.
 * Useful to avoid passing userId around in UI code.
 */
export async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return { data: null, error: toError(error) };
  return { data: user?.id ?? null, error: null };
}

/**
 * React-friendly helper (optional):
 * Returns a cleanup fn that unsubscribes from realtime channel.
 */
export function createProfilesRealtimeSubscription(onChange) {
  const channel = subscribeToProfilesChanges(onChange);

  return () => {
    // unsubscribe cleanup
    supabase.removeChannel(channel);
  };
}
