"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("kipme001@gmail.com");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                setError("Invalid email or password.");
                return;
            }
            router.push("/admin");
        } catch {
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
            <div className="w-full max-w-sm px-6">
                <h1 className="text-2xl font-bold mb-8">Admin Login</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-white/50">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-white/30"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-white/50">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-white/30"
                        />
                    </div>

                    {error && <p className="text-xs text-red-400">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 text-sm font-semibold text-white/80 hover:text-white transition-colors disabled:opacity-40"
                    >
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
