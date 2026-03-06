"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type CreditsContextType = {
    credits: number | null;
    isAdmin: boolean;
    canGenerate: boolean;
    isLoading: boolean;
};

const CreditsContext = createContext<CreditsContextType>({
    credits: null,
    isAdmin: false,
    canGenerate: true,
    isLoading: true
});

export function CreditsProvider({ children }: { children: ReactNode }) {
    const [credits, setCredits] = useState<number | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        let userId: string | null = null;
        let isMounted = true;

        const syncCredits = async () => {
            try {
                const {
                    data: { session }
                } = await supabase.auth.getSession();
                const accessToken = session?.access_token;

                const res = await fetch("/api/user/sync", {
                    method: "POST",
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
                });
                if (!isMounted) return;
                if (res.ok) {
                    const syncData = await res.json();
                    if (!isMounted) return;
                    setCredits(syncData.credits ?? 0);
                } else {
                    setCredits(0);
                }
            } catch {
                if (isMounted) setCredits(0);
            }
        };

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }
            userId = user.id;

            // Admin bypass (reads from env if available, else standard fallback)
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "kipme001@gmail.com";
            if (user.email === adminEmail) {
                setIsAdmin(true);
            }

            await syncCredits();
            setIsLoading(false);
        };

        init();

        const intervalId = window.setInterval(syncCredits, 5000);
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                syncCredits();
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        const channel = supabase
            .channel("schema-db-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "subscriptions" },
                (payload) => {
                    const nextRow = payload.new as { credits?: unknown; user_id?: unknown } | null;
                    if (
                        nextRow &&
                        typeof nextRow.credits === "number" &&
                        nextRow.user_id === userId
                    ) {
                        setCredits(nextRow.credits);
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", onVisible);
            supabase.removeChannel(channel);
        };
    }, []);

    const canGenerate = useMemo(() => {
        return isAdmin || (typeof credits === "number" && credits > 0);
    }, [isAdmin, credits]);

    return (
        <CreditsContext.Provider value={{ credits, isAdmin, canGenerate, isLoading }}>
            {children}
        </CreditsContext.Provider>
    );
}

export function useCredits() {
    return useContext(CreditsContext);
}
