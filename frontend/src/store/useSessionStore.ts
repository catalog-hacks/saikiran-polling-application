"use client";

import { create } from "zustand";
import { getSession } from "next-auth/react";

interface SessionState {
    user_id: string | null;
    email: string | null;
    status: "authenticated" | "loading" | "unauthenticated";
    setSession: (
        user_id: string | null,
        email: string | null,
        status: "authenticated" | "loading" | "unauthenticated"
    ) => void;
    clearSession: () => void;
    checkSession: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
    user_id: null,
    email: null,
    status: "loading",
    setSession: (user_id, email, status) => set({ user_id, email, status }),
    clearSession: () =>
        set({ user_id: null, email: null, status: "unauthenticated" }),
    checkSession: async () => {
        try {
            const session = await getSession();
            console.log(session);
            if (session?.user) {
                set({
                    user_id: session.user.id || null,
                    email: session.user.email || null,
                    status: "authenticated",
                });
            } else {
                set({
                    user_id: null,
                    email: null,
                    status: "unauthenticated",
                });
            }
        } catch (error) {
            console.error("Failed to check session:", error);
            set({
                user_id: null,
                email: null,
                status: "unauthenticated",
            });
        }
    },
}));
