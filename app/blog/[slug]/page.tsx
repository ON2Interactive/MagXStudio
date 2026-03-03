import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type Post = { title: string; content: string; created_at: string };

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
        .select("title, content, created_at")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (!post) notFound();

    const { title, content, created_at } = post as Post;
    const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Convert basic markdown to HTML (headings, bold, paragraphs)
    const toHtml = (md: string) =>
        md
            .replace(/^### (.+)$/gm, "<h3 class=\"text-lg font-semibold mt-8 mb-3\">$1</h3>")
            .replace(/^## (.+)$/gm, "<h2 class=\"text-2xl font-bold mt-10 mb-4\">$1</h2>")
            .replace(/^# (.+)$/gm, "<h1 class=\"text-3xl font-bold mt-10 mb-4\">$1</h1>")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/^- (.+)$/gm, "<li class=\"ml-5 list-disc\">$1</li>")
            .replace(/\n\n/g, "</p><p class=\"mb-4\">")
            .replace(/^(?!<[h|l])(.+)$/gm, "<p class=\"mb-4\">$1</p>");

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <Navbar />
            <main className="mx-auto max-w-3xl px-5 pt-40 pb-24">
                <p className="text-[11px] text-white/30 font-medium mb-4">{fmt(created_at)}</p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 leading-snug">{title}</h1>
                <article
                    className="prose-invert text-white/70 text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: toHtml(content) }}
                />
            </main>
            <Footer />
        </div>
    );
}
