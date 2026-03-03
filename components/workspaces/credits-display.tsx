"use client";

import { Coins, Loader2 } from "lucide-react";
import { useCredits } from "./credits-provider";

export function CreditsDisplay({ onOpenSettings }: { onOpenSettings?: () => void }) {
    const { credits, isAdmin, isLoading } = useCredits();

    if (isLoading) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full text-xs font-medium text-white/30">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
        );
    }

    if (credits === 0 && !isAdmin) {
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
            title={`${isAdmin ? 'Unlimited' : credits} credits remaining`}
        >
            <Coins className="w-3.5 h-3.5 text-yellow-500/80" />
            {isAdmin ? "Admin" : credits}
        </div>
    );
}
