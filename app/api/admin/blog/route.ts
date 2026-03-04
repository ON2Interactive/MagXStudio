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

async function uploadImage(base64: string, slug: string) {
    if (!base64.startsWith("data:image")) return base64;

    const supabase = getServiceClient();
    const match = base64.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!match) return base64;

    const mimeType = `image/${match[1]}`;
    const buffer = Buffer.from(match[2], "base64");
    const fileName = `${slug}-${Date.now()}.${match[1] === "jpeg" ? "jpg" : match[1]}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("blog_images")
        .upload(fileName, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
        console.error("Upload error:", uploadError);
        return base64; // Fallback to base64 if upload fails
    }

    const { data: { publicUrl } } = supabase.storage
        .from("blog_images")
        .getPublicUrl(fileName);

    return publicUrl;
}

// GET all posts
export async function GET() {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, status, content, cover_image, created_at")
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

    // Upload image if it's base64
    const finalCoverImage = cover_image ? await uploadImage(cover_image, slug) : null;

    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("blog_posts")
        .insert({ title, slug, content, status, cover_image: finalCoverImage, created_at: new Date().toISOString() })
        .select("id")
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
}

// PATCH update a post
export async function PATCH(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, title, slug, content, status, cover_image } = await req.json() as {
        id: string; title: string; slug: string; content: string;
        status: "draft" | "published"; cover_image?: string;
    };

    // Upload image if it's base64
    const finalCoverImage = cover_image ? await uploadImage(cover_image, slug) : cover_image;

    const supabase = getServiceClient();
    const { error } = await supabase
        .from("blog_posts")
        .update({ title, slug, content, status, cover_image: finalCoverImage || null })
        .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}

// DELETE a post
export async function DELETE(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json() as { id: string };
    const supabase = getServiceClient();
    await supabase.from("blog_posts").delete().eq("id", id);
    return NextResponse.json({ ok: true });
}
