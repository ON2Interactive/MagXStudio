import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kipme001@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "MagXStudio@$@$";
const SESSION_TOKEN = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");

async function checkAuth() {
    const cookieStore = await cookies();
    return cookieStore.get("magx_admin_session")?.value === SESSION_TOKEN;
}

export async function POST(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topic } = await req.json() as { topic: string };
    const apiKey = process.env.GEMINI_API_KEY!;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{
                    prompt: `A cinematic, editorial-style blog header image for an article about: "${topic}". Dark, modern aesthetic. No text overlay. 16:9 ratio.`,
                }],
                parameters: { sampleCount: 1 },
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json() as { predictions: { bytesBase64Encoded: string; mimeType: string }[] };
    const img = data.predictions?.[0];
    if (!img) return NextResponse.json({ error: "No image returned" }, { status: 500 });

    return NextResponse.json({
        dataUrl: `data:${img.mimeType};base64,${img.bytesBase64Encoded}`,
    });
}
