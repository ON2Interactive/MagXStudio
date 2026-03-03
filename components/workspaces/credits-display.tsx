"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Coins, Loader2 } from "lucide-react";

export function CreditsDisplay({ onOpenSettings }: { onOpenSettings?: () => void }) {
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        const supabase = createClient();
        let userId: string | null = null;

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            userId = user.id;

            const { data } = await supabase
                .from("users")
                .select("credits")
                .eq("id", user.id)
                .single();

            if (data) setCredits(data.credits);
        };

        init();

        // Subscribe to realtime updates for the users table
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

    if (credits === null) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full text-xs font-medium text-white/30">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
        );
    }

    if (credits === 0) {
        return (
            <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-xs font-medium text-white transition-colors"
                title="Get more credits"
            >
                <Coins className="w-3.5 h-3.5" />
                Buy Credits
            </button>
        );
    }

    return (
        <div
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/70"
            title={`${credits} credits remaining`}
        >
            <Coins className="w-3.5 h-3.5 text-yellow-500/80" />
            {credits}
        </div>
    );
}
