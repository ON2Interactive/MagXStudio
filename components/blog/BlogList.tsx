"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";

type Post = {
    id: string;
    title: string;
    slug: string;
    cover_image?: string;
    content: string;
    created_at: string;
};

function excerpt(markdown: string, maxLen = 140): string {
    return markdown
        .replace(/^#{1,6}\s+.+$/gm, "")
        .replace(/\*\*?(.+?)\*\*?/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
        .replace(/`+/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLen)
        .trimEnd() + "…";
}

const PAGE_SIZE = 10;

export function BlogList({ posts }: { posts: Post[] }) {
    const [query, setQuery] = useState("");
    const [visible, setVisible] = useState(PAGE_SIZE);

    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const filtered = posts.filter((p) => {
        const q = query.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    });

    const shown = filtered.slice(0, visible);
    const hasMore = visible < filtered.length;

    return (
        <>
            {/* Search */}
            <div className="flex justify-center mb-12">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search posts…"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm pl-9 pr-4 py-2.5 rounded-full focus:outline-none focus:border-white/30 placeholder:text-white/50 transition-colors"
                    />
                </div>
            </div>

            {/* Post list */}
            {shown.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-12">No posts found.</p>
            ) : (
                <div className="flex flex-col">
                    {shown.map((post) => (
                        <div key={post.id}>
                            <Link
                                href={`/blog/${post.slug}`}
                                className="group flex gap-5 items-center py-5 hover:bg-white/[0.02] transition-colors -mx-4 px-4"
                            >
                                {/* Square cover image */}
                                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/[0.06]">
                                    {post.cover_image ? (
                                        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-xl opacity-20">✦</span>
                                        </div>
                                    )}
                                </div>

                                {/* Text */}
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <span className="text-[11px] text-white/30 font-medium">{fmt(post.created_at)}</span>
                                    <h2 className="text-[15px] font-semibold text-white/50 group-hover:text-white/80 transition-colors leading-snug line-clamp-1">
                                        {post.title}
                                    </h2>
                                    <p className="text-[15px] text-white/50 leading-relaxed line-clamp-2">
                                        {excerpt(post.content)}
                                    </p>
                                </div>

                                <span className="flex-shrink-0 text-xs font-medium text-white/30 group-hover:text-white/60 transition-colors hidden sm:block">
                                    Read →
                                </span>
                            </Link>
                            <div className="mt-5 border-b border-white/[0.05]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Load more */}
            {hasMore && (
                <div className="flex justify-center mt-10">
                    <button
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="text-sm font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/30 px-6 py-2.5 rounded-full transition-all duration-200"
                    >
                        Load more
                    </button>
                </div>
            )}
        </>
    );
}
