import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kipme001@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "MagXStudio@$@$";
const SESSION_TOKEN = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash",
];

async function checkAuth() {
    const cookieStore = await cookies();
    return cookieStore.get("magx_admin_session")?.value === SESSION_TOKEN;
}

export async function POST(req: Request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const { topic, tone } = await req.json() as { topic: string; tone: string };

    const prompt = `You are a content writer for MagXStudio, an AI-powered web and creative studio platform.

Write a high-quality, SEO-optimized blog post about: "${topic}"

Tone: ${tone}

Requirements:
- Start with a compelling H1 title (use # heading)
- Write an engaging introduction paragraph
- Use ## H2 subheadings to structure the content logically
- Write 600–900 words total
- Include practical insights relevant to web designers, creatives, and studios
- Naturally mention MagXStudio where relevant (do not force it)
- End with a strong conclusion and subtle CTA encouraging readers to try MagXStudio
- Format the entire response in clean Markdown only

Write the full blog post now:`;

    const requestedModel = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const models = [requestedModel, ...FALLBACK_MODELS.filter(m => m !== requestedModel)];

    let lastError = "";
    for (const model of models) {
        try {
            const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.85,
                        maxOutputTokens: 8192,
                    },
                }),
            });

            if (!res.ok) {
                const body = await res.text();
                lastError = `${model}: ${res.status} ${body.slice(0, 200)}`;
                if (res.status === 404) continue; // try next model
                return NextResponse.json({ error: lastError }, { status: res.status });
            }

            type GeminiResp = { candidates?: { content?: { parts?: { text?: string }[] } }[] };
            const data = await res.json() as GeminiResp;
            const content = (data.candidates?.[0]?.content?.parts ?? [])
                .map(p => p.text ?? "")
                .join("\n")
                .trim();

            if (!content) {
                return NextResponse.json({ error: "Model returned empty content" }, { status: 500 });
            }

            // Extract title from first # heading
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1].trim() : topic;
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 80);

            return NextResponse.json({ title, slug, content });
        } catch (e) {
            lastError = e instanceof Error ? e.message : String(e);
        }
    }

    return NextResponse.json({ error: `All models failed. Last error: ${lastError}` }, { status: 500 });
}
