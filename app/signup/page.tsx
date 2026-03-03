"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignupInner() {
    const searchParams = useSearchParams();
    const hasError = searchParams.get("error") === "auth";

    const handleGoogleSignIn = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="flex h-[100dvh] w-full bg-black overflow-hidden font-sans selection:bg-white/20">
            {/* Left Side: Cinematic Abstract Asset */}
            <div className="relative hidden lg:block lg:w-1/2 h-full">
                <img
                    src="/Assets/Hero-Dark.png"
                    alt="MagXStudio Studio"
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black" />
            </div>

            {/* Right Side: Identity & Authentication */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 bg-black">
                <div className="flex flex-col items-start w-full max-w-[320px] gap-8">
                    <Link href="/" className="block transition-opacity hover:opacity-80">
                        <Logo className="h-12 w-auto" />
                    </Link>

                    <div className="w-full">
                        <h1 className="text-xl font-bold text-white tracking-tight mb-1">
                            Get started
                        </h1>
                        <p className="text-sm text-white/40 mb-8">
                            Sign up or sign in with your Google account.
                        </p>

                        {hasError && (
                            <p className="mb-4 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                                Something went wrong. Please try again.
                            </p>
                        )}

                        <button
                            onClick={handleGoogleSignIn}
                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
                        >
                            {/* Google Logo SVG */}
                            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <p className="text-xs text-white/25 leading-relaxed">
                        By continuing, you agree to the{" "}
                        <Link href="/terms" className="underline hover:text-white/60 transition-colors">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline hover:text-white/60 transition-colors">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense>
            <SignupInner />
        </Suspense>
    );
}
