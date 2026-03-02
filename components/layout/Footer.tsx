import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-black py-40 px-5 overflow-hidden border-t border-white/5">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-end">
                {/* Logo */}
                <Link href="/" className="mb-12 inline-block">
                    <Logo className="h-6 w-auto" />
                </Link>

                {/* Links */}
                <nav className="flex flex-col items-end gap-2 mb-24">
                    <Link href="/signup" className="text-base font-medium text-white/50 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300">Sign Up</Link>
                    <Link href="/pricing" className="text-base font-medium text-white/50 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300">Pricing</Link>
                    <Link href="/faqs" className="text-base font-medium text-white/50 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300">FAQs</Link>
                    <Link href="/help" className="text-base font-medium text-white/50 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300">Help</Link>
                    <Link href="/contact" className="text-base font-medium text-white/50 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300">Contact</Link>
                    <Link href="/privacy" className="text-base font-medium text-white/50 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300">Privacy</Link>
                    <Link href="/terms" className="text-base font-medium text-white/50 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300">Terms</Link>
                </nav>

                {/* Copyright */}
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                    © {currentYear} MagXStudio. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
