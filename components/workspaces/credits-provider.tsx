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

            const { data } = await supabase
                .from("users")
                .select("credits")
                .eq("id", user.id)
                .single();

            if (data && typeof data.credits === "number") {
                setCredits(data.credits);
            } else {
                setCredits(0);
            }
            setIsLoading(false);
        };

        init();

        const channel = supabase
            .channel("schema-db-changes")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "users" },
                (payload) => {
                    if (payload.new && typeof payload.new.credits === "number" && payload.new.id === userId) {
                        setCredits(payload.new.credits);
                    }
                }
            )
            .subscribe();

        return () => {
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
