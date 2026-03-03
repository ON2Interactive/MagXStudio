import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type Post = { id: string; title: string; slug: string; status: string; created_at: string };

export const revalidate = 60; // ISR every 60 seconds

export default async function BlogIndexPage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title, slug, status, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <Navbar />
            <main className="mx-auto max-w-3xl px-5 pt-40 pb-24">
                <h1 className="text-4xl font-bold tracking-tight mb-3">Blog</h1>
                <p className="text-white/40 text-sm mb-16">Insights on AI-powered web design, creative workflows, and studio tools.</p>

                {(!posts || posts.length === 0) ? (
                    <p className="text-white/30 text-sm">No posts yet.</p>
                ) : (
                    <div className="flex flex-col divide-y divide-white/10">
                        {(posts as Post[]).map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="flex flex-col gap-1 py-6 group"
                            >
                                <span className="text-[11px] text-white/30 font-medium">{fmt(post.created_at)}</span>
                                <h2 className="text-lg font-semibold text-white group-hover:text-white/70 transition-colors leading-snug">{post.title}</h2>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
