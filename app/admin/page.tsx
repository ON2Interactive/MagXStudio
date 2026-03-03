"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2, X, RefreshCcw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminUser = { id: string; email: string; username: string; credits: number; status: string; created: string };
type EmailModal = { email: string; firstName: string } | null;
type BlogPost = { id: string; title: string; slug: string; status: string; content: string; cover_image?: string; created_at: string };
type Tab = "users" | "blog";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("users");

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/adminlogin");
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Header */}
            <div className="mx-auto max-w-[1200px] px-6">
                <div className="flex items-center justify-between py-6">
                    <div className="flex items-center gap-6">
                        <h1 className="text-2xl font-bold">Admin</h1>
                        <div className="flex items-center gap-1">
                            {(["users", "blog"] as Tab[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-sm text-white/50 hover:text-white transition-colors">
                        Log Out
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-[1200px] px-6 pb-12">
                {tab === "users" ? <UsersTab /> : <BlogTab />}
            </div>
        </div>
    );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
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
        await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId, ...edit }) });
        await fetchUsers();
    };

    const handleDelete = async (userId: string, email: string) => {
        if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
        await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId }) });
        await fetchUsers();
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
    const filtered = users.filter((u) => { const q = search.toLowerCase(); return u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q); });

    return (
        <>
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

            <div className="border border-white/10 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-sm font-semibold">Users</span>
                    <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                        <RefreshCcw className="h-3 w-3" />Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-white/30">Loading…</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                {["Email", "Username", "Credits", "Status", "Created", "Actions"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-xs font-medium text-white/40">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 text-white/70 text-xs">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <input type="text" value={edits[user.id]?.username ?? ""} onChange={(e) => setEdits((p) => ({ ...p, [user.id]: { ...p[user.id], username: e.target.value } }))}
                                            className="w-36 bg-white/5 border border-white/10 text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-white/30" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input type="number" value={edits[user.id]?.credits ?? 0} onChange={(e) => setEdits((p) => ({ ...p, [user.id]: { ...p[user.id], credits: Number(e.target.value) } }))}
                                            className="w-20 bg-white/5 border border-white/10 text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-white/30" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium ${user.status === "active" ? "text-green-400" : "text-white/30"}`}>{user.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-white/40">{fmt(user.created)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEmailModal(user)} className="text-white/40 hover:text-white transition-colors"><Mail className="h-4 w-4" /></button>
                                            <button onClick={() => handleSave(user.id)} className="text-xs text-white/50 hover:text-white transition-colors">Save</button>
                                            <button onClick={() => handleDelete(user.id, user.email)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Email Modal */}
            {emailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold">Send Email</h2>
                            <button onClick={() => setEmailModal(null)} className="text-white/40 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-white/70">To</label>
                                <input type="email" value={emailModal.email} readOnly className="w-full bg-white/5 border border-white/10 text-white/70 text-sm px-3 py-2 rounded" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-white/70">Subject</label>
                                <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-blue-500/50" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-white/70">Message</label>
                                <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-blue-500/50 resize-none" />
                            </div>
                            <button onClick={handleSendEmail} className="text-sm font-semibold text-white/80 hover:text-white transition-colors text-left">Send Email</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Blog Tab ─────────────────────────────────────────────────────────────────

const TONES = ["Informative", "Technical", "Marketing", "Casual"];

function BlogTab() {
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState("Informative");
    const [generating, setGenerating] = useState(false);
    const [generateError, setGenerateError] = useState("");
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [generatingImage, setGeneratingImage] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [referenceUrl, setReferenceUrl] = useState("");
    const [customPrompt, setCustomPrompt] = useState("");
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    const fetchPosts = async () => {
        setLoadingPosts(true);
        const res = await fetch("/api/admin/blog");
        const data = await res.json() as { posts: BlogPost[] };
        setPosts(data.posts ?? []);
        setLoadingPosts(false);
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setGenerating(true);
        setContent("");
        setGenerateError("");
        try {
            const res = await fetch("/api/admin/blog/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, tone, referenceUrl, customPrompt }),
            });
            const data = await res.json() as { title: string; slug: string; content: string; error?: string };
            if (!res.ok || data.error) {
                setGenerateError(data.error ?? `Error ${res.status}`);
            } else {
                setTitle(data.title);
                setSlug(data.slug);
                setContent(data.content);
            }
        } catch (e) {
            setGenerateError(e instanceof Error ? e.message : "Network error");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async (status: "draft" | "published") => {
        if (!title || !content) return;
        setSaving(true);
        setSaveError("");
        try {
            const res = editingId
                ? await fetch("/api/admin/blog", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editingId, title, slug, content, status, cover_image: coverImage || null }),
                })
                : await fetch("/api/admin/blog", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, slug, content, status, cover_image: coverImage || null }),
                });

            const data = await res.json() as { error?: string };
            if (!res.ok) {
                setSaveError(data.error ?? `Save failed (${res.status})`);
                return; // keep form content intact
            }

            // Success — clear the form
            setEditingId(null);
            setTopic(""); setTitle(""); setSlug(""); setContent(""); setCoverImage("");
            await fetchPosts();
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : "Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (post: BlogPost) => {
        setEditingId(post.id);
        setTitle(post.title);
        setSlug(post.slug);
        setContent(post.content);
        setCoverImage(post.cover_image ?? "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle(""); setSlug(""); setContent(""); setCoverImage("");
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm("Delete this post?")) return;
        await fetch("/api/admin/blog", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        await fetchPosts();
    };

    const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="flex flex-col gap-12 w-full">
            {/* Generator */}
            <div className="flex flex-col gap-6">
                <h2 className="text-sm font-semibold text-white/90">Generate Blog Post</h2>

                <Input
                    placeholder="Topic / Title (e.g. How AI is changing web design)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />

                <Input
                    type="url"
                    placeholder="Reference URL (Optional inspiration link)"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                />

                <Textarea
                    placeholder="Specific Instructions / Context (Optional)..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={1}
                    className="min-h-[40px]"
                />

                <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Tone</label>
                    <div className="flex flex-wrap gap-2">
                        {TONES.map((t) => (
                            <button key={t} onClick={() => setTone(t)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${tone === t ? "bg-white text-black" : "text-white/40 hover:text-white bg-white/5"}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <button onClick={handleGenerate} disabled={generating || !topic.trim()}
                        className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors disabled:opacity-40">
                        {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                        {generating ? "Generating…" : "Generate →"}
                    </button>
                    {generateError && (
                        <p className="text-xs text-red-400">{generateError}</p>
                    )}
                </div>
            </div>

            {/* Editor (shows when content exists or editing) */}
            {(content || editingId) && (
                <div className="border border-white/10 rounded-lg p-6 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">{editingId ? "Edit Post" : "Edit & Publish"}</h2>
                        {editingId && (
                            <button onClick={handleCancelEdit} className="text-xs text-white/30 hover:text-white transition-colors">Cancel</button>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-white/70">Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-white/30" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-white/70">Slug</label>
                        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white/60 text-xs px-3 py-2 rounded focus:outline-none focus:border-white/30 font-mono" />
                    </div>

                    {/* Cover Image */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-white/70">Cover Image</label>
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer text-xs text-white/50 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded">
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setCoverImage(ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                }} />
                            </label>
                            <button
                                onClick={async () => {
                                    if (!topic) return;
                                    setGeneratingImage(true);
                                    try {
                                        const res = await fetch("/api/admin/blog/generate-image", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ topic: title || topic }),
                                        });
                                        if (res.ok) {
                                            const { dataUrl } = await res.json() as { dataUrl: string };
                                            setCoverImage(dataUrl);
                                        }
                                    } finally {
                                        setGeneratingImage(false);
                                    }
                                }}
                                disabled={generatingImage}
                                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded disabled:opacity-40"
                            >
                                {generatingImage && <Loader2 className="h-3 w-3 animate-spin" />}
                                {generatingImage ? "Generating…" : "Generate with AI"}
                            </button>
                            {coverImage && (
                                <button onClick={() => setCoverImage("")} className="text-xs text-white/30 hover:text-red-400 transition-colors">Remove</button>
                            )}
                        </div>
                        {coverImage && (
                            <img src={coverImage} alt="Cover preview" className="mt-2 w-full max-h-48 object-cover rounded-lg border border-white/10" />
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-white/70">Content (Markdown)</label>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20}
                            className="w-full bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-white/30 resize-y font-mono leading-relaxed" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <button onClick={() => handleSave("draft")} disabled={saving}
                                className="text-xs font-medium text-white/50 hover:text-white transition-colors disabled:opacity-40">
                                {editingId ? "Save Draft" : "Save as Draft"}
                            </button>
                            <button onClick={() => handleSave("published")} disabled={saving}
                                className="text-sm font-semibold text-white hover:text-white/70 transition-colors disabled:opacity-40">
                                {saving ? "Saving…" : editingId ? "Update →" : "Publish →"}
                            </button>
                        </div>
                        {saveError && (
                            <p className="text-xs text-red-400">{saveError}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Post List */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-sm font-semibold">Posts</span>
                    <button onClick={fetchPosts} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                        <RefreshCcw className="h-3 w-3" />Refresh
                    </button>
                </div>
                {loadingPosts ? (
                    <div className="py-10 text-center text-sm text-white/30">Loading…</div>
                ) : posts.length === 0 ? (
                    <div className="py-10 text-center text-sm text-white/20">No posts yet.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                {["Title", "Slug", "Status", "Created", ""].map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-xs font-medium text-white/40">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 text-white/80 text-xs max-w-[220px] truncate">{post.title}</td>
                                    <td className="px-4 py-3 text-white/30 text-xs font-mono max-w-[160px] truncate">{post.slug}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium ${post.status === "published" ? "text-green-400" : "text-white/30"}`}>{post.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-white/40">{fmt(post.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="text-xs text-white/30 hover:text-white transition-colors">View</a>
                                            <button onClick={() => handleEdit(post)} className="text-xs text-white/40 hover:text-white transition-colors">Edit</button>
                                            <button onClick={() => handleDeletePost(post.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
