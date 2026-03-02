import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 240;

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TEXT_MODEL = process.env.GEMINI_PAGES_TEXT_MODEL || "gemini-3.1-pro-preview";
const IMAGE_MODEL = process.env.GEMINI_PAGES_IMAGE_MODEL || "gemini-3-pro-image-preview";
const TEXT_CALL_TIMEOUT_MS = 7000;
const IMAGE_CALL_TIMEOUT_MS = 5000;
const MAX_ENDPOINT_TIME_MS = 20000;
const pagesContentTypes = [
  "book",
  "research-paper",
  "photobook",
  "magazine",
  "poster",
  "report",
  "brochure",
  "newsletter"
] as const;
type PagesContentType = (typeof pagesContentTypes)[number];

const contentTypeProfiles: Record<
  PagesContentType,
  { label: string; structureGuidance: string; toneGuidance: string; sectionRange: string }
> = {
  book: {
    label: "Book",
    structureGuidance:
      "Build chapter-like sections with coherent progression, explanatory depth, and narrative continuity.",
    toneGuidance: "Use thoughtful, explanatory, and durable prose.",
    sectionRange: "5-8 sections"
  },
  "research-paper": {
    label: "Research Paper",
    structureGuidance:
      "Prefer academic flow: abstract/summary, background, methodology or approach, findings, implications, and limitations.",
    toneGuidance: "Use evidence-oriented, precise, and neutral language.",
    sectionRange: "6-8 sections"
  },
  photobook: {
    label: "Photobook",
    structureGuidance:
      "Keep text concise with image-led storytelling, short contextual captions, and minimal but meaningful section copy.",
    toneGuidance: "Use evocative, descriptive, and visual-first language.",
    sectionRange: "4-6 sections"
  },
  magazine: {
    label: "Magazine",
    structureGuidance:
      "Use editorial structure with a compelling opener, thematic sections, pull-quote style bullets, and digestible pacing.",
    toneGuidance: "Use polished editorial voice with high readability.",
    sectionRange: "4-7 sections"
  },
  poster: {
    label: "Poster",
    structureGuidance:
      "Prioritize brevity, hierarchy, and scanability. Keep sections compact and visual communication dominant.",
    toneGuidance: "Use concise, high-impact, display-ready language.",
    sectionRange: "3-5 sections"
  },
  report: {
    label: "Report",
    structureGuidance:
      "Organize around executive summary, key findings, data-backed insights, recommendations, and next actions.",
    toneGuidance: "Use professional, analytical, decision-support language.",
    sectionRange: "5-7 sections"
  },
  brochure: {
    label: "Brochure",
    structureGuidance:
      "Focus on value propositions, feature highlights, trust signals, and clear calls to action.",
    toneGuidance: "Use persuasive but clear and factual marketing language.",
    sectionRange: "4-6 sections"
  },
  newsletter: {
    label: "Newsletter",
    structureGuidance:
      "Use short updates, highlights, and clear subsections that are easy to skim quickly.",
    toneGuidance: "Use friendly, informative, and concise editorial tone.",
    sectionRange: "4-6 sections"
  }
};

const requestSchema = z.object({
  topic: z.string().trim().min(8).max(1600),
  contentType: z.enum(pagesContentTypes).optional(),
  pageSize: z.string().trim().max(32).optional(),
  customWidthInches: z.number().positive().max(200).optional().nullable(),
  customHeightInches: z.number().positive().max(200).optional().nullable()
});

type GeminiTextResponse = {
  candidates?: Array<{
    groundingMetadata?: {
      webSearchQueries?: string[];
    };
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GeminiImageResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType?: string; data?: string };
        inline_data?: { mime_type?: string; data?: string };
      }>;
    };
  }>;
};

type PagePlan = {
  title: string;
  subtitle: string;
  summary: string;
  sections: Array<{
    heading: string;
    body: string;
    bullets: string[];
  }>;
  imagePrompts: string[];
};

type GeminiTextCallParams = {
  apiKey: string;
  model: string;
  prompt: string;
  systemInstruction: string;
  useGoogleSearchTool: boolean;
  timeoutMs?: number;
};

const defaultSystemInstruction = `You are the Pages Document Designer model for MagXStudio.
Your job is to generate publication-quality structured page content for print-oriented layouts across many publication types.
You specialize in research papers, whitepapers, books, magazines, brochures, flyers, newsletters, reports, and poster layouts.

Core behavior:
- Write clear, accurate, and coherent long-form content for the requested topic.
- Use google_search grounding when needed for factual or current claims.
- Prefer verifiable, non-fabricated information.
- Return only strict JSON matching the provided schema.
- Keep language concise, premium, and editorial in tone.

Content quality requirements:
- Include a strong title, subtitle, and concise executive summary.
- Produce sectioned content with practical bullets where relevant.
- Avoid filler and repetition.
- Avoid markdown in output fields.

Image planning requirements:
- Produce 1-2 relevant image prompts that visually support the written content.
- Prompts should be descriptive, photographic/editorial, and safe for business publishing.
- Do not request logos, copyrighted characters, or trademarked brand marks.`;

function extractText(data: GeminiTextResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const joined = parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
  if (!joined) throw new Error("No text response from Gemini");
  return joined;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // Continue with fenced/embedded JSON fallback.
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]) as Record<string, unknown>;
    } catch {
      // Continue.
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const chunk = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(chunk) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePlan(raw: Record<string, unknown>): PagePlan {
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const sections = rawSections
    .map((section) => {
      if (!section || typeof section !== "object") return null;
      const sectionRecord = section as Record<string, unknown>;
      const heading = typeof sectionRecord.heading === "string" ? sectionRecord.heading.trim() : "";
      const body = typeof sectionRecord.body === "string" ? sectionRecord.body.trim() : "";
      const bullets = Array.isArray(sectionRecord.bullets)
        ? sectionRecord.bullets
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => item.trim())
            .slice(0, 6)
        : [];
      if (!heading && !body && bullets.length === 0) return null;
      return {
        heading: heading || "Section",
        body,
        bullets
      };
    })
    .filter((entry): entry is { heading: string; body: string; bullets: string[] } => Boolean(entry))
    .slice(0, 8);

  const rawPrompts = Array.isArray(raw.imagePrompts) ? raw.imagePrompts : [];
  const imagePrompts = rawPrompts
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 2);

  return {
    title:
      (typeof raw.title === "string" && raw.title.trim()) || "Generated Document",
    subtitle:
      (typeof raw.subtitle === "string" && raw.subtitle.trim()) || "Structured editorial draft",
    summary:
      (typeof raw.summary === "string" && raw.summary.trim()) ||
      "A concise, structured draft generated for this topic.",
    sections:
      sections.length > 0
        ? sections
        : [
            {
              heading: "Overview",
              body: "No sections were returned, so this fallback content was generated.",
              bullets: []
            }
          ],
    imagePrompts:
      imagePrompts.length > 0
        ? imagePrompts
        : ["Editorial documentary photo supporting the topic, clean composition, print ready"]
  };
}

function extractFirstInlineImageDataUri(data: GeminiImageResponse): string | null {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inlineCamel = part.inlineData;
    if (inlineCamel?.data && inlineCamel?.mimeType?.startsWith("image/")) {
      return `data:${inlineCamel.mimeType};base64,${inlineCamel.data}`;
    }
    const inlineSnake = part.inline_data;
    if (inlineSnake?.data && inlineSnake?.mime_type?.startsWith("image/")) {
      return `data:${inlineSnake.mime_type};base64,${inlineSnake.data}`;
    }
  }
  return null;
}

function buildCanvasHtml(plan: PagePlan, images: string[]): string {
  const imageBlocks = images
    .map(
      (image, index) =>
        `<figure class="pd-figure"><img src="${image}" alt="${escapeHtml(plan.imagePrompts[index] || "Supporting image")}" /></figure>`
    )
    .join("");
  const sectionBlocks = plan.sections
    .map((section) => {
      const bullets =
        section.bullets.length > 0
          ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : "";
      return `<section class="pd-section">
  <h2>${escapeHtml(section.heading)}</h2>
  ${section.body ? `<p>${escapeHtml(section.body)}</p>` : ""}
  ${bullets}
</section>`;
    })
    .join("");

  return `<main class="page-designer-doc">
  <article class="pd-shell">
    <header class="pd-header">
      <p class="pd-kicker">Page Designer Draft</p>
      <h1>${escapeHtml(plan.title)}</h1>
      <p class="pd-subtitle">${escapeHtml(plan.subtitle)}</p>
      <p class="pd-summary">${escapeHtml(plan.summary)}</p>
    </header>
    ${imageBlocks ? `<section class="pd-images">${imageBlocks}</section>` : ""}
    <section class="pd-content">${sectionBlocks}</section>
  </article>
</main>`;
}

function buildCanvasCss(): string {
  return `html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
main.page-designer-doc {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
  color: #101114;
}
.pd-shell {
  margin: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  overflow: hidden;
  padding: 44px 40px 48px;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  line-height: 1.45;
}
.pd-header h1 {
  margin: 8px 0 10px;
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.1;
}
.pd-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5c6068;
}
.pd-subtitle {
  margin: 0;
  font-size: clamp(16px, 2vw, 22px);
  color: #23262d;
}
.pd-summary {
  margin: 16px 0 0;
  font-size: 15px;
  color: #3a3e46;
}
.pd-images {
  display: grid;
  gap: 16px;
  margin-top: 24px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.pd-figure {
  margin: 0;
  border: 1px solid #e4e7ed;
  background: #f8fafc;
}
.pd-figure img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}
.pd-content {
  margin-top: 24px;
  display: grid;
  gap: 22px;
  overflow: hidden;
}
.pd-section h2 {
  margin: 0 0 8px;
  font-size: 22px;
}
.pd-section p {
  margin: 0;
  color: #1f2229;
}
.pd-section ul {
  margin: 10px 0 0;
  padding-left: 20px;
}
.pd-section li + li {
  margin-top: 6px;
}`;
}

async function callGeminiPagesText({
  apiKey,
  model,
  prompt,
  systemInstruction,
  useGoogleSearchTool,
  timeoutMs
}: GeminiTextCallParams): Promise<GeminiTextResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs ?? TEXT_CALL_TIMEOUT_MS));
  const response = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.45,
        topP: 0.9,
        maxOutputTokens: 8192
      },
      ...(useGoogleSearchTool ? { tools: [{ google_search: {} }] } : {})
    }),
    signal: controller.signal
  }).finally(() => clearTimeout(timer));

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Gemini text generation failed (${response.status}): ${bodyText.slice(0, 300)}`);
  }
  return (await response.json()) as GeminiTextResponse;
}

function buildFallbackPlan(
  topic: string,
  contentType: PagesContentType,
  profile: { label: string }
): PagePlan {
  const safeTopic = topic.trim() || "Untitled topic";
  const normalizedTopic = safeTopic.replace(/\s+/g, " ").trim();
  const topicTitle =
    normalizedTopic.length > 0
      ? normalizedTopic.charAt(0).toUpperCase() + normalizedTopic.slice(1)
      : "Untitled topic";
  const promptIsQuestion = /\?$/.test(normalizedTopic);

  const subtitleByType: Record<PagesContentType, string> = {
    book: "Chapter Draft",
    "research-paper": "Research Draft",
    photobook: "Photo Narrative Draft",
    magazine: "Feature Story",
    poster: "Poster Concept",
    report: "Report Draft",
    brochure: "Brochure Draft",
    newsletter: "Newsletter Draft"
  };

  const sectionHeadingsByType: Record<PagesContentType, [string, string, string, string]> = {
    book: [
      `${topicTitle}: Context`,
      `${topicTitle}: Main Narrative`,
      `${topicTitle}: Analysis`,
      `${topicTitle}: Closing Notes`
    ],
    "research-paper": [
      `${topicTitle}: Background`,
      `${topicTitle}: Approach`,
      `${topicTitle}: Findings`,
      `${topicTitle}: Implications`
    ],
    photobook: [
      `${topicTitle}: Visual Theme`,
      `${topicTitle}: Story Flow`,
      `${topicTitle}: Key Frames`,
      `${topicTitle}: Editorial Notes`
    ],
    magazine: [
      `${topicTitle}: Lead`,
      `${topicTitle}: Main Story`,
      `${topicTitle}: Voices & Angles`,
      `${topicTitle}: Why It Matters`
    ],
    poster: [
      `${topicTitle}: Headline Direction`,
      `${topicTitle}: Visual Motif`,
      `${topicTitle}: Layout Hierarchy`,
      `${topicTitle}: Production Notes`
    ],
    report: [
      `${topicTitle}: Executive Summary`,
      `${topicTitle}: Key Data`,
      `${topicTitle}: Insights`,
      `${topicTitle}: Recommendations`
    ],
    brochure: [
      `${topicTitle}: Overview`,
      `${topicTitle}: Value`,
      `${topicTitle}: Highlights`,
      `${topicTitle}: Call to Action`
    ],
    newsletter: [
      `${topicTitle}: Lead Update`,
      `${topicTitle}: Highlights`,
      `${topicTitle}: What Changed`,
      `${topicTitle}: Next Steps`
    ]
  };

  const [h1, h2, h3, h4] = sectionHeadingsByType[contentType];

  return {
    title: topicTitle,
    subtitle: subtitleByType[contentType],
    summary: promptIsQuestion
      ? `This ${profile.label.toLowerCase()} addresses: ${normalizedTopic}`
      : `A structured ${profile.label.toLowerCase()} draft focused on ${normalizedTopic}.`,
    sections: [
      {
        heading: h1,
        body: `Frame ${normalizedTopic} clearly for this ${profile.label.toLowerCase()} format and establish the editorial intent of the piece.`,
        bullets: ["Set scope", "Define audience", "Establish tone"]
      },
      {
        heading: h2,
        body: `Develop the core narrative around ${normalizedTopic} with concrete details, context, and readable structure.`,
        bullets: ["Primary narrative", "Supporting details", "Clear progression"]
      },
      {
        heading: h3,
        body: `Present additional perspectives, evidence, or examples that deepen understanding of ${normalizedTopic}.`,
        bullets: ["Alternative angle", "Evidence or examples", "Practical relevance"]
      },
      {
        heading: h4,
        body: `Conclude with concise takeaways and next-use guidance relevant to ${normalizedTopic}.`,
        bullets: ["Key takeaways", "Action points", "Final perspective"]
      }
    ],
    imagePrompts: [
      `Editorial publication visual for ${normalizedTopic}, clean composition, print-ready, no text overlay`
    ]
  };
}

function buildPosterFallbackImageDataUri(topic: string): string {
  const title = (topic || "Bauhaus Poster").trim().slice(0, 46);
  const escapedTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <rect width="1200" height="1600" fill="#f4f1e8"/>
  <rect x="72" y="72" width="1056" height="1456" fill="none" stroke="#111111" stroke-width="8"/>
  <circle cx="340" cy="410" r="220" fill="#e4372f"/>
  <rect x="560" y="220" width="420" height="240" fill="#2f63d8"/>
  <polygon points="210,960 560,560 760,1140" fill="#f0c735"/>
  <rect x="780" y="760" width="280" height="520" fill="#111111"/>
  <circle cx="950" cy="1250" r="80" fill="#f4f1e8"/>
  <text x="100" y="1320" fill="#111111" font-size="96" font-family="Helvetica, Arial, sans-serif" font-weight="700" letter-spacing="2">BAUHAUS</text>
  <text x="100" y="1420" fill="#111111" font-size="48" font-family="Helvetica, Arial, sans-serif" font-weight="500">${escapedTitle}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const startedAt = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const body = (await request.json()) as unknown;
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { topic, contentType, pageSize, customWidthInches, customHeightInches } = parsed.data;
    const resolvedContentType: PagesContentType = contentType ?? "magazine";
    const profile = contentTypeProfiles[resolvedContentType];
    const systemInstruction =
      process.env.GEMINI_PAGES_SYSTEM_INSTRUCTION?.trim() || defaultSystemInstruction;
    const prompt = [
      "Return ONLY strict JSON in this schema:",
      "{",
      '  "title": "string",',
      '  "subtitle": "string",',
      '  "summary": "string",',
      '  "sections": [',
      "    {",
      '      "heading": "string",',
      '      "body": "string",',
      '      "bullets": ["string"]',
      "    }",
      "  ],",
      '  "imagePrompts": ["string"]',
      "}",
      "",
      "Rules:",
      `- Create ${profile.sectionRange}.`,
      "- Keep body paragraphs clear and practical.",
      "- Keep bullets specific and concise.",
      "- Generate 1-2 imagePrompts only.",
      `- Content type: ${profile.label}.`,
      `- Structure guidance: ${profile.structureGuidance}`,
      `- Tone guidance: ${profile.toneGuidance}`,
      ...(resolvedContentType === "poster"
        ? [
            "- Poster mode: prioritize visual output and keep text minimal.",
            "- For poster, section copy must be compact and display-oriented."
          ]
        : []),
      "",
      `Topic: ${topic}`,
      `Page size preset: ${pageSize || "8.5x11"}`,
      `Custom size (in): ${customWidthInches && customHeightInches ? `${customWidthInches}x${customHeightInches}` : "none"}`
    ].join("\n");

    const textModelCandidates = [
      TEXT_MODEL,
      "gemini-2.5-pro"
    ].filter((model, index, all) => all.indexOf(model) === index);

    let textData: GeminiTextResponse | null = null;
    let plan: PagePlan | null = null;
    let lastTextError: Error | null = null;
    let usedFallbackPlan = false;

    for (const model of textModelCandidates) {
      for (const useGoogleSearchTool of [true, false]) {
        const elapsedMs = Date.now() - startedAt;
        const remainingMs = MAX_ENDPOINT_TIME_MS - elapsedMs;
        if (remainingMs <= 2500) {
          break;
        }
        try {
          textData = await callGeminiPagesText({
            apiKey,
            model,
            prompt,
            systemInstruction,
            useGoogleSearchTool,
            timeoutMs: Math.min(TEXT_CALL_TIMEOUT_MS, remainingMs - 1000)
          });
          const text = extractText(textData);
          const parsedJson = extractJsonObject(text);
          if (!parsedJson) {
            throw new Error("Gemini returned non-JSON content");
          }
          plan = normalizePlan(parsedJson);
          break;
        } catch (caught) {
          lastTextError = caught instanceof Error ? caught : new Error(String(caught));
          continue;
        }
      }
      if (plan) break;
    }

    if (!plan) {
      console.error("generate-pages text fallback", {
        message: lastTextError?.message || "Unknown Gemini text error",
        at: new Date().toISOString()
      });
      plan = buildFallbackPlan(topic, resolvedContentType, { label: profile.label });
      textData = null;
      usedFallbackPlan = true;
    }

    const imageDataUris: string[] = [];
    const eligibleImagePrompts = profile.label === "Poster" ? plan.imagePrompts.slice(0, 1) : plan.imagePrompts;
    if (!usedFallbackPlan) {
      for (const imagePrompt of eligibleImagePrompts) {
        const elapsedMs = Date.now() - startedAt;
        const remainingMs = MAX_ENDPOINT_TIME_MS - elapsedMs;
        if (remainingMs <= 2500) {
          break;
        }
        const imagePromptBody = [
          imagePrompt,
          "",
          "Output requirements:",
          "- Photorealistic editorial style",
          "- No text overlay or logos",
          "- Clean composition for print layout"
        ].join("\n");
        const imageController = new AbortController();
        const imageTimer = setTimeout(
          () => imageController.abort(),
          Math.max(1200, Math.min(IMAGE_CALL_TIMEOUT_MS, remainingMs - 1000))
        );
        try {
          const imageResponse = await fetch(`${API_BASE}/${IMAGE_MODEL}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: imagePromptBody }] }],
              generationConfig: {
                responseModalities: ["IMAGE"],
                imageConfig: {
                  aspectRatio: "4:3",
                  imageSize: "1K"
                }
              }
            }),
            signal: imageController.signal
          });
          if (!imageResponse.ok) continue;
          const imageData = (await imageResponse.json()) as GeminiImageResponse;
          const dataUri = extractFirstInlineImageDataUri(imageData);
          if (dataUri) imageDataUris.push(dataUri);
        } catch {
          // Image is optional for Pages generation; continue without failing the whole request.
        } finally {
          clearTimeout(imageTimer);
        }
      }
    } else {
      // Skip external image generation when we already fell back to local content to keep response fast.
    }

    if (resolvedContentType === "poster" && imageDataUris.length === 0) {
      imageDataUris.push(buildPosterFallbackImageDataUri(topic));
    }

    const html = buildCanvasHtml(plan, imageDataUris);
    const css = buildCanvasCss();
    const groundingQueries =
      textData?.candidates?.[0]?.groundingMetadata?.webSearchQueries?.slice(0, 8) ?? [];

    return NextResponse.json({
      data: {
        title: plan.title,
        subtitle: plan.subtitle,
        summary: plan.summary,
        sections: plan.sections,
        imagePrompts: plan.imagePrompts,
        images: imageDataUris,
        groundingQueries,
        html,
        css
      }
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unexpected server error";
    return NextResponse.json(
      {
        error: "Failed to generate page design",
        details: message
      },
      { status: 500 }
    );
  }
}
