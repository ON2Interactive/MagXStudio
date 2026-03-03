import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type Post = { title: string; content: string; cover_image?: string; created_at: string };

export const revalidate = 60;

export async function generateStaticParams() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
        .from("blog_posts")
        .select("slug")
        .eq("status", "published");
    return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: post } = await supabase
        .from("blog_posts")
        .select("title, content, cover_image, created_at")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (!post) notFound();

    const { title, content, cover_image, created_at } = post as Post;
    const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Convert basic markdown to HTML
    const toHtml = (md: string) =>
        md
            .replace(/^# .+$/gm, "") // strip H1 from body (it's in the hero)
            .replace(/^### (.+)$/gm, "<h3 class=\"text-lg font-semibold mt-8 mb-3\">$1</h3>")
            .replace(/^## (.+)$/gm, "<h2 class=\"text-2xl font-bold mt-10 mb-4\">$1</h2>")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            // Markdown links [text](url) → <a>
            .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-white underline underline-offset-2 hover:text-white/70 transition-colors\">$1</a>")
            // Internal/relative links [text](/path) → <a>
            .replace(/\[(.+?)\]\((\/?[^)]+)\)/g, "<a href=\"$2\" class=\"text-white underline underline-offset-2 hover:text-white/70 transition-colors\">$1</a>")
            // Bare CTA text like [Start Building with MagXStudio] with no URL → link to /signup
            .replace(/\[([^\]]*MagXStudio[^\]]*)\]/gi, "<a href=\"/signup\" class=\"text-white font-semibold underline underline-offset-2 hover:text-white/70 transition-colors\">$1</a>")
            .replace(/^- (.+)$/gm, "<li class=\"ml-5 list-disc mb-1\">$1</li>")
            .replace(/\n\n/g, "</p><p class=\"mb-5\">")
            .replace(/^(?!<[h|l])(.+)$/gm, "<p class=\"mb-5\">$1</p>");

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <Navbar />

            {/* Hero */}
            <div
                className="relative w-full flex items-end min-h-[480px] md:min-h-[600px] max-h-[800px]"
                style={{
                    height: cover_image ? "55vw" : "400px",
                    background: cover_image
                        ? `url(${cover_image}) center/cover no-repeat`
                        : "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
                }}
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)" }} />

                {/* Title block */}
                <div className="relative z-10 w-full mx-auto max-w-[1200px] px-6 pb-12 pt-32 flex flex-col items-center text-center">
                    <p className="text-xs text-white/40 font-medium mb-3 tracking-wide">{fmt(created_at)}</p>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight max-w-3xl">
                        {title}
                    </h1>
                </div>
            </div>

            {/* Article body */}
            <main className="mx-auto max-w-[760px] px-6 pt-14 pb-24">
                <article
                    className="text-white/70 text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: toHtml(content) }}
                />
            </main>

            <Footer />
        </div>
    );
}
