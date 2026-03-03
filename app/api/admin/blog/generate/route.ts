import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kipme001@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "MagXStudio@$@$";
const SESSION_TOKEN = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const FALLBACK_MODELS = [
    "gemini-3.1-pro-preview",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-pro-latest",
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

    const { topic, tone, referenceUrl, customPrompt } = await req.json() as {
        topic: string;
        tone: string;
        referenceUrl?: string;
        customPrompt?: string;
    };

    console.log("Blog Generation Request Received:", { topic, tone, referenceUrl, customPrompt });

    const prompt = `You are a high-level content writer for MagXStudio. 
MagXStudio is an all-in-one creative workspace for building websites, presentations, and multi-page layouts. It is NOT just for web design.

MAIN TOPIC: "${topic}"
TONE: ${tone}

${referenceUrl ? `REFERENCE URL (Use this for research/context): ${referenceUrl}` : ""}

${customPrompt ? `SPECIFIC USER INSTRUCTIONS (HIGHEST PRIORITY):
${customPrompt}

(Note: You MUST follow these instructions strictly. If they contradict general web design advice, follow the user's instructions.)` : ""}

Requirements:
- Start with a compelling H1 title (use # heading)
- Write an engaging introduction paragraph
- Use ## H2 subheadings to structure the content logically
- Write 800–1200 words total for a deep, insightful post
- Include practical, non-generic insights
- Emphasize MagXStudio as a versatile creative tool (layouts, slides, visuals) where relevant
- End with a strong conclusion and CTA
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
                // Continue to next model on 404 (not found), 503 (overloaded), 429 (rate limited)
                if ([404, 503, 429].includes(res.status)) continue;
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
