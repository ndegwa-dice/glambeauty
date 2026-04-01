import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// On focus — refresh session silently
// Prevents stale tokens from breaking mid-flow
if (typeof window !== "undefined") {
  window.addEventListener("focus", async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      // Session is gone — clear storage silently
      await supabase.auth.signOut();
    }
  });
}