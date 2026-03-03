import { createClient } from "@supabase/supabase-js";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BlogList } from "@/components/blog/BlogList";

type Post = {
    id: string;
    title: string;
    slug: string;
    cover_image?: string;
    content: string;
    created_at: string;
};

export const revalidate = 60;

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

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <Navbar />
            <main className="mx-auto max-w-[1200px] px-6 pt-40 pb-24">
                <BlogList posts={(posts ?? []) as Post[]} />
            </main>
            <Footer />
        </div>
    );
}
