import { create } from 'zustand';
import { signIn, signUp, signOut, getUser, getUserProfile, onAuthStateChange } from '@/lib/supabase/auth';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

interface AuthStore {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, metadata: { first_name: string; last_name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { user } = await signIn(email, password);
      const profile = await getUserProfile();
      set({ user, profile, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (email, password, metadata) => {
    set({ loading: true });
    try {
      const { user } = await signUp(email, password, metadata);
      set({
        user,
        profile: user ? {
          id: user.id,
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          phone: metadata.phone || null,
        } : null,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    await signOut();
    set({ user: null, profile: null });
  },

  loadUser: async () => {
    try {
      const user = await getUser();
      if (!user) {
        set({ user: null, profile: null });
        return;
      }

      // Ghost-session guard: Supabase's getUser() only validates the JWT
      // signature — if the user row in auth.users was deleted but the
      // session cookie is still signed correctly, we get a user object
      // whose id no longer exists in the DB. That produces silent bugs
      // everywhere (Commandes = 0, orphaned orders, FK violations on
      // new inserts). Verify against auth.users via a service-role
      // endpoint and force signOut if the id is orphaned.
      try {
        const res = await fetch(`/api/auth/verify?id=${user.id}`);
        const { exists } = (await res.json()) as { exists: boolean };

        if (!exists) {
          console.warn(
            `[auth] Ghost session detected — user.id ${user.id} no longer in auth.users. Signing out.`,
          );
          await signOut().catch(() => {
            // Best-effort — if signOut throws we still clear local state.
          });
          set({ user: null, profile: null });
          return;
        }
      } catch (err) {
        // Transient network / verify-endpoint failure → don't force
        // logout (would be annoying on flaky connections). Just trust
        // the JWT and carry on.
        console.warn('[auth] verify endpoint unreachable, skipping ghost check', err);
      }

      const profile = await getUserProfile();
      set({ user, profile });
    } catch {
      set({ user: null, profile: null });
    }
  },

  init: () => {
    // Load user on init
    get().loadUser().then(() => set({ initialized: true }));

    // Listen to auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user });
        getUserProfile().then((profile) => set({ profile }));
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null });
      }
    });

    return () => subscription.unsubscribe();
  },
}));
