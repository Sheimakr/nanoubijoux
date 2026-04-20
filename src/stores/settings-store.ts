import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

/**
 * Public-facing site settings consumed by client components (footer, contact
 * page, header, etc.).
 *
 * Data flow:
 *   1. Component mounts → calls fetchSettings() (once, guarded by `loaded`)
 *   2. fetchSettings() GETs /api/settings (service-role backed)
 *   3. On first fetch it ALSO opens a Supabase Realtime channel on the
 *      `settings` table; any UPDATE there re-runs the GET so the already-
 *      mounted UI reflects admin edits instantly, no page reload needed.
 *
 * Requirements for realtime to deliver events:
 *   - Table `settings` is in the supabase_realtime publication.
 *   - An RLS SELECT policy allows the anon role to see the row.
 *   Both are covered in the phase-4d-wiring migration.
 */

interface StoreSettings {
  store_name: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  primary_color: string;
  // Homepage hero slider images. Admins manage the list in /admin/settings.
  // Empty array → HeroSlider falls back to its built-in /images/hero-*.jpg.
  hero_images: string[];
  loaded: boolean;
}

/**
 * Defaults used before the first fetch completes (first paint) AND as a
 * fallback when the API returns a missing/null field. `store_name` keeps
 * the Nano Bijoux brand — per the "brand is source of truth" rule —
 * while everything else defaults to empty so the DB drives the values.
 */
const DEFAULTS: StoreSettings = {
  store_name: 'Nano Bijoux',
  phone: '',
  email: '',
  facebook: '',
  instagram: '',
  primary_color: '#B8860B',
  hero_images: [],
  loaded: false,
};

interface SettingsState extends StoreSettings {
  fetchSettings: () => Promise<void>;
}

// Module-level flag so we only ever open ONE realtime channel per tab,
// no matter how many components call fetchSettings().
let realtimeSubscribed = false;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,

  fetchSettings: async () => {
    try {
      // Cache-busting is handled server-side by revalidateTag('settings','max')
      // on admin save; no client-side query string needed.
      const res = await fetch('/api/settings');
      if (!res.ok) {
        set({ loaded: true });
        return;
      }
      const data = await res.json();

      // Coerce null / undefined → default, preserve real empty strings
      // as intentional "cleared" values.
      set({
        store_name: data.store_name || DEFAULTS.store_name,
        phone: data.phone ?? DEFAULTS.phone,
        email: data.email ?? DEFAULTS.email,
        facebook: data.facebook ?? DEFAULTS.facebook,
        instagram: data.instagram ?? DEFAULTS.instagram,
        primary_color: data.primary_color || DEFAULTS.primary_color,
        // hero_images comes back as a jsonb array; guard against nulls / non-arrays.
        hero_images: Array.isArray(data.hero_images) ? data.hero_images : [],
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }

    // Subscribe exactly once per tab. Any row-level change on `settings`
    // triggers a re-fetch, so admin edits become visible within ~100ms
    // without a page refresh.
    if (!realtimeSubscribed) {
      realtimeSubscribed = true;
      const supabase = createClient();
      supabase
        .channel('rt:settings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings' },
          () => {
            // Re-fetch from /api/settings instead of trusting the payload,
            // so we get the same field projection and default-merge logic.
            get().fetchSettings();
          },
        )
        .subscribe();
    }
  },
}));
