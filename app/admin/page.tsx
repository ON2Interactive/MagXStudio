"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2, Save, X, RefreshCcw } from "lucide-react";

type AdminUser = {
    id: string;
    email: string;
    username: string;
    credits: number;
    status: string;
    created: string;
};

type EmailModal = {
    email: string;
    firstName: string;
} | null;

export default function AdminPage() {
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState("");
    const [edits, setEdits] = useState<Record<string, { username: string; credits: number }>>({});
    const [loading, setLoading] = useState(true);
    const [emailModal, setEmailModal] = useState<EmailModal>(null);
    const [emailSubject, setEmailSubject] = useState("MagXStudio Update");
    const [emailBody, setEmailBody] = useState("");

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (res.status === 401) { router.push("/adminlogin"); return; }
        const data = await res.json() as { users: AdminUser[] };
        setUsers(data.users);
        const initEdits: Record<string, { username: string; credits: number }> = {};
        data.users.forEach((u) => { initEdits[u.id] = { username: u.username, credits: u.credits }; });
        setEdits(initEdits);
        setLoading(false);
    }, [router]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSave = async (userId: string) => {
        const edit = edits[userId];
        if (!edit) return;
        await fetch("/api/admin/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId, username: edit.username, credits: edit.credits }),
        });
        await fetchUsers();
    };

    const handleDelete = async (userId: string, email: string) => {
        if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
        await fetch("/api/admin/users", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId }),
        });
        await fetchUsers();
    };

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/adminlogin");
    };

    const openEmailModal = (user: AdminUser) => {
        const firstName = user.username.split(" ")[0] || user.email.split("@")[0];
        setEmailSubject("MagXStudio Update");
        setEmailBody(`Hi ${firstName},\n\n`);
        setEmailModal({ email: user.email, firstName });
    };

    const handleSendEmail = () => {
        const mailto = `mailto:${emailModal?.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailto, "_blank");
        setEmailModal(null);
    };

    const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6">
                <h1 className="text-2xl font-bold">Admin</h1>
                <button onClick={handleLogout} className="text-sm text-white/50 hover:text-white transition-colors">
                    Log Out
                </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-12">
                {/* Search */}
                <div style={{ marginTop: "100px" }} className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by email or username…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-sm bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-white/30 placeholder:text-white/25"
                    />
                </div>

                {/* Table */}
                <div className="border border-white/10 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span className="text-sm font-semibold">Users</span>
                        <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                            <RefreshCcw className="h-3 w-3" />
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-sm text-white/30">Loading…</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-4 py-3 text-xs font-medium text-white/40">Email</th>
                                    <th className="px-4 py-3 text-xs font-medium text-white/40">Username</th>
                                    <th className="px-4 py-3 text-xs font-medium text-white/40">Credits</th>
                                    <th className="px-4 py-3 text-xs font-medium text-white/40">Status</th>
                                    <th className="px-4 py-3 text-xs font-medium text-white/40">Created</th>
                                    <th className="px-4 py-3 text-xs font-medium text-white/40">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users
                                    .filter((u) => {
                                        const q = search.toLowerCase();
                                        return u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                                    })
                                    .map((user) => (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-white/70 text-xs">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={edits[user.id]?.username ?? ""}
                                                    onChange={(e) => setEdits((prev) => ({ ...prev, [user.id]: { ...prev[user.id], username: e.target.value } }))}
                                                    className="w-36 bg-white/5 border border-white/10 text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-white/30"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={edits[user.id]?.credits ?? 0}
                                                    onChange={(e) => setEdits((prev) => ({ ...prev, [user.id]: { ...prev[user.id], credits: Number(e.target.value) } }))}
                                                    className="w-20 bg-white/5 border border-white/10 text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-white/30"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-medium ${user.status === "active" ? "text-green-400" : "text-white/30"}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-white/40">{fmt(user.created)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openEmailModal(user)} title="Send email" className="text-white/40 hover:text-white transition-colors">
                                                        <Mail className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleSave(user.id)} title="Save" className="text-xs text-white/50 hover:text-white transition-colors">
                                                        Save
                                                    </button>
                                                    <button onClick={() => handleDelete(user.id, user.email)} title="Delete user" className="text-white/30 hover:text-red-400 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Email Modal */}
            {emailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold">Send Email</h2>
                            <button onClick={() => setEmailModal(null)} className="text-white/40 hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-white/50">To</label>
                                <input
                                    type="email"
                                    value={emailModal.email}
                                    readOnly
                                    className="w-full bg-white/5 border border-white/10 text-white/70 text-sm px-3 py-2 rounded focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-white/50">Subject</label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-white/50">Message</label>
                                <textarea
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    rows={6}
                                    className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-blue-500/50 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSendEmail}
                                className="text-sm font-semibold text-white/80 hover:text-white transition-colors text-left"
                            >
                                Send Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
