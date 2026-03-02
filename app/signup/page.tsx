"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/**
 * SignupPage
 * 
 * A split-screen sign-up experience featuring a cinematic abstract visual
 * on the left and the MagXStudio identity with Google OAuth placeholder on the right.
 */
export default function SignupPage() {
    return (
        <div className="flex h-[100dvh] w-full bg-black overflow-hidden font-sans selection:bg-white/20">
            {/* Left Side: Cinematic Abstract Asset */}
            <div className="relative hidden lg:block lg:w-1/2 h-full">
                <img
                    src="/Assets/Hero-Dark.png"
                    alt="MagXStudio Studio"
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
                {/* Subtle gradient overlay to blend into the right panel */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black" />
            </div>

            {/* Right Side: Identity & Authentication Interface */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 bg-black">
                <div className="flex flex-col items-start w-full max-w-[320px]">
                    <Link href="/" className="mb-10 block transition-opacity hover:opacity-80">
                        <Logo className="h-12 w-auto" />
                    </Link>

                    <button
                        className="text-base font-medium text-white/40 hover:text-white transition-all duration-300 tracking-tight cursor-pointer"
                        onClick={() => {/* Mock Google OAuth for future implementation */ }}
                    >
                        SignUp with Google
                    </button>
                </div>
            </div>
        </div>
    );
}
