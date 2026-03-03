import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kipme001@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "MagXStudio@$@$";
const SESSION_TOKEN = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");

async function checkAuth() {
    const cookieStore = await cookies();
    return cookieStore.get("magx_admin_session")?.value === SESSION_TOKEN;
}

export async function POST(req: Request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, tone } = await req.json() as { topic: string; tone: string };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? "gemini-1.5-pro" });

    const prompt = `You are a content writer for MagXStudio, an AI-powered web and creative studio tool.

Write a high-quality, SEO-optimized blog post about: "${topic}"

Tone: ${tone}

Requirements:
- Start with an engaging H1 title
- Include a compelling introduction
- Use H2 subheadings to structure the content
- Write 600–900 words total
- Include practical insights relevant to web designers, creatives, and studios
- Naturally mention MagXStudio where relevant (don't force it)
- End with a clear conclusion and subtle CTA
- Format in clean Markdown

Write the full post now:`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Extract title from first H1 line
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic;

    // Generate slug from title
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);

    return NextResponse.json({ title, slug, content });
}
