import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kipme001@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "MagXStudio@$@$";
const SESSION_TOKEN = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");

async function checkAuth() {
    const cookieStore = await cookies();
    return cookieStore.get("magx_admin_session")?.value === SESSION_TOKEN;
}

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET all posts
export async function GET() {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, status, created_at")
        .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: data });
}

// POST save/publish a post
export async function POST(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, slug, content, status, cover_image } = await req.json() as {
        title: string; slug: string; content: string; status: "draft" | "published"; cover_image?: string;
    };
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("blog_posts")
        .insert({ title, slug, content, status, cover_image: cover_image ?? null, created_at: new Date().toISOString() })
        .select("id")
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
}

// DELETE a post
export async function DELETE(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json() as { id: string };
    const supabase = getServiceClient();
    await supabase.from("blog_posts").delete().eq("id", id);
    return NextResponse.json({ ok: true });
}
