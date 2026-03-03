"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const TOP_UP_PRICE_ID = "price_1T6wtsPKoJ7Z0f639J0RogcH";

type SettingsModalProps = {
    open: boolean;
    onClose: () => void;
};

type MenuAction = {
    label: string;
    onClick: () => void;
};

export function SettingsModal({ open, onClose }: SettingsModalProps) {
    if (!open) return null;

    const handleSubscribe = async () => {
        const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
        if (!priceId) return;
        const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priceId }),
        });
        if (res.status === 401) {
            onClose();
            window.location.href = "/signup";
            return;
        }
        const { url } = await res.json() as { url: string };
        if (url) window.location.href = url;
    };

    const handleManage = async () => {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        if (res.status === 401) {
            onClose();
            window.location.href = "/signup";
            return;
        }
        if (res.status === 404) {
            // No subscription — send to pricing
            onClose();
            window.location.href = "/pricing";
            return;
        }
        const { url } = await res.json() as { url: string };
        if (url) window.location.href = url;
    };

    const handleBuyCredits = async () => {
        const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priceId: TOP_UP_PRICE_ID }),
        });
        if (res.status === 401) {
            onClose();
            window.location.href = "/signup?next=/workspace";
            return;
        }
        const { url } = await res.json() as { url: string };
        if (url) window.location.href = url;
    };

    const actions: MenuAction[] = [
        {
            label: "Subscribe",
            onClick: handleSubscribe,
        },
        {
            label: "Manage Plan",
            onClick: handleManage,
        },
        {
            label: "Add Credits ($10)",
            onClick: handleBuyCredits,
        },
        {
            label: "Help",
            onClick: () => window.open("/help", "_blank"),
        },
        {
            label: "Contact",
            onClick: () => window.open("/contact", "_blank"),
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex bg-black font-sans selection:bg-white/20">
            {/* Close Button */}
            <button
                onClick={onClose}
                aria-label="Close settings"
                className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
            >
                <X className="h-5 w-5" />
            </button>

            {/* Left — Cinematic Image */}
            <div className="relative hidden lg:block lg:w-1/2 h-full">
                <img
                    src="/Assets/Hero-Dark.png"
                    alt="MagXStudio Studio"
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black" />
            </div>

            {/* Right — Settings Panel */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 bg-black">
                <div className="flex flex-col items-start w-full max-w-[320px] gap-10">
                    {/* Logo */}
                    <Link href="/" className="block transition-opacity hover:opacity-80">
                        <Logo className="h-12 w-auto" />
                    </Link>

                    {/* Menu Items */}
                    <nav className="flex flex-col w-full gap-1">
                        {actions.map((action) => (
                            <button
                                key={action.label}
                                onClick={action.onClick}
                                className="group flex items-start w-full rounded-xl px-4 py-3 text-left transition-all duration-200 hover:bg-white/5 active:scale-[0.98]"
                            >
                                <span className="text-[18px] font-semibold text-white/90 group-hover:text-white transition-colors">
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </nav>

                    {/* Legal */}
                    <p className="text-xs text-white/20 leading-relaxed">
                        <Link href="/terms" className="underline hover:text-white/50 transition-colors">
                            Terms
                        </Link>
                        {" · "}
                        <Link href="/privacy" className="underline hover:text-white/50 transition-colors">
                            Privacy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
