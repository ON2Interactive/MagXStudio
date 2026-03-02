"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, SortAsc, RefreshCcw, Mail, Trash2, Save, User as UserIcon } from "lucide-react";
import { useState } from "react";

const MOCK_USERS = [
    { id: "1", email: "alex@example.com", username: "alex_design", credits: 450, created: "2026-02-20", lastSeen: "2026-03-01" },
    { id: "2", email: "sarah@studio.art", username: "sarah_p", credits: 1200, created: "2026-01-15", lastSeen: "2026-02-28" },
    { id: "3", email: "marc@creative.co", username: "m_creative", credits: 50, created: "2026-02-25", lastSeen: "2026-03-01" },
    { id: "4", email: "jenny@design.io", username: "j_studio", credits: 3200, created: "2025-12-10", lastSeen: "2026-02-25" },
];

export default function AdminPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="min-h-screen bg-obsidian text-ivory flex flex-col">
            <Navbar />

            <main className="flex-1 mx-auto max-w-7xl w-full px-8 py-40">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h1 className="tight-tracking mb-2 text-5xl font-bold md:text-7xl italic drama-serif">Admin.</h1>
                        <p className="text-muted/60 text-sm uppercase tracking-widest font-bold">System Management / Users</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40" />
                            <input
                                type="text"
                                placeholder="Search access..."
                                className="rounded-full bg-surface border border-white/5 p-4 pl-12 text-sm text-ivory focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all font-medium min-w-[300px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-white/5 text-muted/60 hover:text-accent transition-colors">
                            <RefreshCcw className="h-5 w-5" />
                        </button>
                        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-obsidian shadow-xl shadow-accent/20">
                            <SortAsc className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <div className="bg-surface rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted/40">Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted/40">Workspace</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted/40 text-center">Credits</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted/40">Timestamp</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted/40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {MOCK_USERS.filter(u => u.email.includes(searchTerm) || u.username.includes(searchTerm)).map((user) => (
                                    <tr key={user.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-accent/10 text-accent">
                                                    <UserIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-ivory group-hover:text-accent transition-colors">{user.username}</p>
                                                    <p className="text-xs text-muted/60">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-muted/40 uppercase tracking-widest border border-white/5">Personal</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="mono-data text-sm font-bold text-accent/80">{user.credits}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] text-muted/60">{user.created}</p>
                                            <p className="text-[10px] text-muted/40 italic">Active {user.lastSeen}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-muted/60 hover:text-ivory transition-colors">
                                                    <Mail className="h-4 w-4" />
                                                </button>
                                                <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-muted/60 hover:text-ivory transition-colors">
                                                    <Save className="h-4 w-4" />
                                                </button>
                                                <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500/60 hover:bg-red-500/20 hover:text-red-500 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
