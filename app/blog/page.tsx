import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type Post = {
    id: string;
    title: string;
    slug: string;
    cover_image?: string;
    content: string;
    created_at: string;
};

export const revalidate = 60;

function excerpt(markdown: string, maxLen = 140): string {
    return markdown
        .replace(/^#{1,6}\s+.+$/gm, "")   // strip headings
        .replace(/\*\*?(.+?)\*\*?/g, "$1") // strip bold/italic
        .replace(/\[(.+?)\]\(.+?\)/g, "$1") // strip links
        .replace(/`+/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLen)
        .trimEnd() + "…";
}

export default async function BlogIndexPage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title, slug, cover_image, content, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <Navbar />
            <main className="mx-auto max-w-[1200px] px-6 pt-40 pb-24">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Blog</h1>
                <p className="text-white/40 text-sm mb-14">
                    Insights on AI-powered web design, creative workflows, and studio tools.
                </p>

                {(!posts || posts.length === 0) ? (
                    <p className="text-white/30 text-sm">No posts yet — check back soon.</p>
                ) : (
                    <div className="flex flex-col gap-6">
                        {(posts as Post[]).map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group flex gap-6 items-start bg-white/[0.02] border border-white/8 rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300"
                            >
                                {/* Square cover image */}
                                <div className="flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                    {post.cover_image ? (
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-2xl opacity-20">✦</span>
                                        </div>
                                    )}
                                </div>

                                {/* Text content */}
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <span className="text-[11px] text-white/30 font-medium">{fmt(post.created_at)}</span>
                                    <h2 className="text-lg font-semibold text-white group-hover:text-white/80 transition-colors leading-snug line-clamp-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-white/40 leading-relaxed line-clamp-2">
                                        {excerpt(post.content)}
                                    </p>
                                    <span className="text-xs font-medium text-white/40 group-hover:text-white/70 transition-colors mt-1">
                                        Read post →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
