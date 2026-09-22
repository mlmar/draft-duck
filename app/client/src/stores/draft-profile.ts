import { draftProfileSchema, type DraftProfile } from '@draft-duck/core';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

// Saved DraftProfile under dd.draftProfile. Invalid JSON is dropped so the quiz restarts from defaults.

const STORAGE_KEY = 'dd.draftProfile';

type DraftProfileState = {
    profile: DraftProfile | null;
    setProfile: (profile: DraftProfile) => void;
    clearProfile: () => void;
};

function isBrowser() {
    return typeof window !== 'undefined';
}

// Persist the profile JSON itself, not Zustand's wrapper, so the key is easy to inspect.
const profileStorage: StateStorage = {
    getItem(name) {
        if (!isBrowser()) return null;
        const raw = localStorage.getItem(name);
        if (raw == null) return null;
        try {
            const parsed = draftProfileSchema.safeParse(JSON.parse(raw));
            if (!parsed.success) {
                localStorage.removeItem(name);
                return null;
            }
            return JSON.stringify({ state: { profile: parsed.data }, version: 0 });
        } catch {
            localStorage.removeItem(name);
            return null;
        }
    },
    setItem(name, value) {
        if (!isBrowser()) return;
        const wrapped = JSON.parse(value) as { state?: { profile?: unknown } };
        // Default store state is null. Do not wipe a saved profile during that write.
        if (wrapped.state?.profile == null) return;
        const parsed = draftProfileSchema.safeParse(wrapped.state.profile);
        if (!parsed.success) {
            localStorage.removeItem(name);
            return;
        }
        localStorage.setItem(name, JSON.stringify(parsed.data));
    },
    removeItem(name) {
        if (!isBrowser()) return;
        localStorage.removeItem(name);
    }
};

export const useDraftProfileStore = create<DraftProfileState>()(
    persist(
        (set) => ({
            profile: null,
            setProfile: (profile) => set({ profile }),
            clearProfile: () => {
                set({ profile: null });
                if (isBrowser()) localStorage.removeItem(STORAGE_KEY);
            }
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(() => profileStorage),
            partialize: (state) => ({ profile: state.profile }),
            // Prerender of /onboard must not touch localStorage.
            skipHydration: !isBrowser()
        }
    )
);
