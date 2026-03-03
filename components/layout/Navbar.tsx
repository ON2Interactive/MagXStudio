"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

export function Navbar() {
    const pathname = usePathname();

    // The high-fidelity "Main Menu" style for all marketing, support, and legal pages
    const isMarketingPage = pathname === "/" ||
        pathname === "/pricing" ||
        pathname === "/faqs" ||
        pathname === "/help" ||
        pathname === "/contact" ||
        pathname === "/privacy" ||
        pathname === "/terms" ||
        pathname === "/signup";

    if (isMarketingPage) {
        return (
            <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-black/95 px-5 py-6 backdrop-blur-sm border-b border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <Logo className="h-4 md:h-5 w-auto" />
                </Link>

                <div className="flex items-center gap-8">
                    <Link
                        href="/pricing"
                        className={`text-base font-medium transition-all duration-300 hover:text-white ${pathname === "/pricing" ? "text-white" : "text-white/60"
                            }`}
                    >
                        Pricing
                    </Link>
                    <Link
                        href="/signup"
                        className="text-base font-semibold text-white/90 transition-all duration-300 hover:text-white hover:scale-105 active:scale-95"
                    >
                        Try It Now
                    </Link>
                </div>
            </nav>
        );
    }

    // Workspace/App Navbar (Floating Pill)
    return (
        <nav className="fixed left-1/2 top-6 z-50 flex w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 items-center justify-between rounded-full glass-island px-6 py-3 shadow-lg shadow-black/20">
            <Link href="/" className="flex items-center gap-2">
                <Logo className="h-5 md:h-6 w-auto" />
            </Link>

            <div className="hidden items-center gap-10 md:flex">
                <Link href="/pricing" className="text-base font-medium text-white/60 hover:text-white transition-all duration-300">Pricing</Link>
                <Link href="/faqs" className="text-base font-medium text-white/60 hover:text-white transition-all duration-300">FAQs</Link>
                <Link href="/contact" className="text-base font-medium text-white/60 hover:text-white transition-all duration-300">Contact</Link>
            </div>

            <button
                className="magnetic-button rounded-full bg-white px-8 py-3 text-base font-bold text-black shadow-xl hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/signup'}
            >
                Get Started
            </button>
        </nav>
    );
}
