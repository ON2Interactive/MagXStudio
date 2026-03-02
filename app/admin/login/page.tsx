"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Lock, User, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-obsidian text-ivory flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center py-40 px-8">
                <div className="w-full max-w-md bg-surface rounded-[3rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />

                    <div className="text-center mb-12">
                        <h1 className="tight-tracking mb-2 text-3xl font-bold">Admin Portal</h1>
                        <p className="text-muted/60 text-xs uppercase tracking-widest font-bold">Restricted Access</p>
                    </div>

                    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Administrator ID</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
                                <input type="text" placeholder="admin_user_01" className="w-full rounded-xl bg-obsidian/50 border border-white/10 p-4 pl-12 text-sm text-ivory focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all font-mono" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Secure Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
                                <input type="password" placeholder="••••••••••••" className="w-full rounded-xl bg-obsidian/50 border border-white/10 p-4 pl-12 text-sm text-ivory focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all font-mono" />
                            </div>
                        </div>

                        <button className="magnetic-button mt-4 flex items-center justify-center gap-2 rounded-full bg-accent py-5 font-bold text-obsidian shadow-xl shadow-accent/10">
                            <span>Authorize Session</span>
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </form>

                    <p className="mt-12 text-center text-[10px] text-muted/40 uppercase tracking-tighter">
                        Encryption: AES-256-GCM / Protocol 4.1
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
