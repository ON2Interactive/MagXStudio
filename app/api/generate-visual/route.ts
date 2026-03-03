import { NextResponse } from "next/server";
import { checkCredits, deductCredit } from "@/lib/credits";

export const runtime = "nodejs";
export const maxDuration = 120;

type GenerateVisualRequest = {
  mode?: "text-to-image" | "image-to-image";
  prompt?: string;
  theme?: string;
  aspectRatio?: "auto" | "1:1" | "1:4" | "1:8" | "2:3" | "3:2" | "3:4" | "4:1" | "4:3" | "4:5" | "5:4" | "8:1" | "9:16" | "16:9" | "21:9";
  size?: "1K" | "2K" | "4K";
  imageSize?: "1K" | "2K" | "4K";
  sourceImageDataUri?: string | null;
  variationCount?: number;
};

const visualThemeMap: Record<string, string> = {
  "ad-creative": "Vibrant, optimized for marketing copy space with high commercial appeal.",
  "editorial": "High-fashion, moody, premium magazine layout with dramatic lighting.",
  "infographic": "Structured, diagrammatic, data-friendly with clear spatial organization.",
  "product-shot": "Studio lighting, clean background, macro details, and sharp focus.",
  "social-post": "Engaging, bold, colorful, and scroll-stopping composition.",
  "3d-render": "Octane render, Unreal Engine 5 style, highly polished with cinematic raytracing.",
  "cinematic": "Movie-like dramatic lighting, shallow depth of field, anamorphic lens flare.",
  "cyberpunk": "Neon-lit, futuristic, highly detailed, dystopian sci-fi aesthetic.",
  "illustration": "Flat digital art, modern vector style, clean shapes and bold colors.",
  "isometric": "3D angled architectural or tech concepts, miniature diorama feel.",
  "line-art": "Clean, continuous vector lines, minimalist monochrome drawing.",
  "minimalist": "Clean lines, empty negative space, simple subjects, entirely uncluttered.",
  "photorealistic": "Highly detailed, 8k resolution, lifelike textures and photography-grade lighting.",
  "vintage-polaroid": "Retro, grainy film, warm light leaks, nostalgic color grading.",
  "watercolor": "Soft, artistic, flowing paints, textured paper background."
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType?: string; data?: string };
        inline_data?: { mime_type?: string; data?: string };
      }>;
    };
  }>;
};

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Google Nano Banana 2 (Gemini 3.1 Flash Image) - Released Feb 26, 2026
// Fallback to Nano Banana Pro (Gemini 3 Pro Image) via custom ENV if needed.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";

const aspectRatioMap: Record<
  "auto" | "1:1" | "1:4" | "1:8" | "2:3" | "3:2" | "3:4" | "4:1" | "4:3" | "4:5" | "5:4" | "8:1" | "9:16" | "16:9" | "21:9",
  { googleAspectRatio: string; dims: { "1K": string; "2K": string; "4K": string } }
> = {
  "auto": { googleAspectRatio: "auto", dims: { "1K": "1024x1024", "2K": "2048x2048", "4K": "4096x4096" } },
  "1:1": { googleAspectRatio: "1:1", dims: { "1K": "1024x1024", "2K": "2048x2048", "4K": "4096x4096" } },
  "1:4": { googleAspectRatio: "1:4", dims: { "1K": "512x2048", "2K": "1024x4096", "4K": "2048x8192" } },
  "1:8": { googleAspectRatio: "1:8", dims: { "1K": "362x2896", "2K": "724x5792", "4K": "1448x11584" } },
  "2:3": { googleAspectRatio: "2:3", dims: { "1K": "848x1264", "2K": "1696x2528", "4K": "3392x5056" } },
  "3:2": { googleAspectRatio: "3:2", dims: { "1K": "1264x848", "2K": "2528x1696", "4K": "5056x3392" } },
  "3:4": { googleAspectRatio: "3:4", dims: { "1K": "896x1200", "2K": "1792x2400", "4K": "3584x4800" } },
  "4:1": { googleAspectRatio: "4:1", dims: { "1K": "2048x512", "2K": "4096x1024", "4K": "8192x2048" } },
  "4:3": { googleAspectRatio: "4:3", dims: { "1K": "1200x896", "2K": "2400x1792", "4K": "4800x3584" } },
  "4:5": { googleAspectRatio: "4:5", dims: { "1K": "928x1152", "2K": "1856x2304", "4K": "3712x4608" } },
  "5:4": { googleAspectRatio: "5:4", dims: { "1K": "1152x928", "2K": "2304x1856", "4K": "4608x3712" } },
  "8:1": { googleAspectRatio: "8:1", dims: { "1K": "2896x362", "2K": "5792x724", "4K": "11584x1448" } },
  "9:16": { googleAspectRatio: "9:16", dims: { "1K": "768x1376", "2K": "1536x2752", "4K": "3072x5504" } },
  "16:9": { googleAspectRatio: "16:9", dims: { "1K": "1376x768", "2K": "2752x1536", "4K": "5504x3072" } },
  "21:9": { googleAspectRatio: "21:9", dims: { "1K": "1584x672", "2K": "3168x1344", "4K": "6336x2688" } }
};

const imageSizeMap: Record<"1K" | "2K" | "4K", "1K" | "2K" | "4K"> = {
  "1K": "1K",
  "2K": "2K",
  "4K": "4K"
};

function parseDataUri(dataUri: string): { mimeType: string; data: string } | null {
  if (!dataUri || !dataUri.startsWith("data:")) return null;
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex === -1) return null;
  const meta = dataUri.substring(0, commaIndex);
  const data = dataUri.substring(commaIndex + 1);
  const mimeMatch = meta.match(/data:(.*?);base64/);
  if (!mimeMatch || !data) return null;
  const mimeType = mimeMatch[1];
  return { mimeType, data };
}

function extractAllInlineImageDataUris(data: GeminiResponse): string[] {
  const allUris: string[] = [];
  const candidates = data.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      const inlineCamel = part.inlineData;
      if (inlineCamel?.data && inlineCamel?.mimeType?.startsWith("image/")) {
        allUris.push(`data:${inlineCamel.mimeType};base64,${inlineCamel.data}`);
      }
      const inlineSnake = part.inline_data;
      if (inlineSnake?.data && inlineSnake?.mime_type?.startsWith("image/")) {
        allUris.push(`data:${inlineSnake.mime_type};base64,${inlineSnake.data}`);
      }
    }
  }
  return allUris;
}

export async function POST(request: Request) {
  try {
    const creditCheck = await checkCredits();
    if (!creditCheck.allowed) {
      return NextResponse.json({ error: "Insufficient credits or unauthorized" }, { status: 402 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Missing GEMINI_API_KEY"
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as GenerateVisualRequest;
    const mode = body.mode === "image-to-image" ? "image-to-image" : "text-to-image";
    const prompt = String(body.prompt || "").trim();
    const aspectRatioInput = String(body.aspectRatio || "1:1").trim() as keyof typeof aspectRatioMap;
    const sizeInput = String(body.size || body.imageSize || "1K").trim() as keyof typeof imageSizeMap;
    const aspectRatioConfig = aspectRatioMap[aspectRatioInput];
    // This modal is intentionally fixed to 1K output.
    const imageSize: "1K" = imageSizeMap[sizeInput] ? "1K" : "1K";

    if (prompt.length < 8) {
      return NextResponse.json(
        {
          error: "Prompt is too short"
        },
        { status: 400 }
      );
    }

    if (!aspectRatioConfig) {
      return NextResponse.json(
        {
          error: "Unsupported aspect ratio"
        },
        { status: 400 }
      );
    }
    const variationCount = Math.max(1, Math.min(4, Number(body.variationCount) || 3));
    const visualThemePrompt = body.theme && body.theme !== "auto" && visualThemeMap[body.theme] ? visualThemeMap[body.theme] : "";

    const googleAspectRatio = aspectRatioConfig.googleAspectRatio;
    const targetDimensions = aspectRatioConfig.dims[imageSize];
    console.info(`[API] Received visual generation request: mode=${mode}, variations=${variationCount}`);

    const remixInstruction = mode === "image-to-image"
      ? "This is a REMIX of the provided image. Preserve the core composition, layout, and subjects precisely, but REVOLVE and REFINE the details, lighting, and textures to be more premium and artistic. Follow this direction: "
      : "";

    const promptWithOutputConstraints = `${remixInstruction}${prompt}

Output requirements:
- Aspect ratio: ${googleAspectRatio}
- Size: ${targetDimensions}${visualThemePrompt ? `\n\nAesthetic override: ${visualThemePrompt}` : ""}`;

    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [];

    if (mode === "image-to-image") {
      const parsedSource = body.sourceImageDataUri ? parseDataUri(body.sourceImageDataUri) : null;
      if (!parsedSource) {
        return NextResponse.json(
          {
            error: "Missing or invalid source image"
          },
          { status: 400 }
        );
      }
      // Put image context BEFORE the prompt for better model adherence
      parts.push({
        inline_data: {
          mime_type: parsedSource.mimeType,
          data: parsedSource.data
        }
      });
      console.info(`[API] Added image context for Remix (MIME: ${parsedSource.mimeType})`);
    }

    parts.push({ text: promptWithOutputConstraints });

    const fetchVariation = async () => {
      const resp = await fetch(`${API_BASE}/${IMAGE_MODEL}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generation_config: {
            // gemini-3.1-flash-image-preview only supports candidate_count: 1
            candidate_count: 1,
            response_modalities: ["IMAGE"],
            image_config: {
              aspect_ratio: googleAspectRatio,
              image_size: imageSize
            }
          }
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Variation failed: ${resp.status} - ${errText.slice(0, 200)}`);
      }

      const variationData = (await resp.json()) as GeminiResponse;
      return extractAllInlineImageDataUris(variationData);
    };

    // variationCount is already defined at line 144
    // Parallelize requests to simulate 'candidate_count'
    const variationResults = await Promise.allSettled(
      Array.from({ length: variationCount }, () => fetchVariation())
    );


    const imageDataUris: string[] = [];
    let lastError: string | null = null;

    for (const result of variationResults) {
      if (result.status === "fulfilled") {
        imageDataUris.push(...result.value);
      } else {
        lastError = result.reason?.message || "Unknown variation error";
      }
    }

    if (imageDataUris.length === 0) {
      return NextResponse.json(
        {
          error: "Gemini image generation failed for all variations",
          details: lastError || "No images returned"
        },
        { status: 502 }
      );
    }

    if (!creditCheck.isAdmin && creditCheck.userId) {
      await deductCredit(creditCheck.userId);
    }

    return NextResponse.json({ imageDataUris, aspectRatio: googleAspectRatio, size: imageSize });

  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unexpected server error";
    return NextResponse.json(
      {
        error: "Failed to generate visual",
        details: message
      },
      { status: 500 }
    );
  }
}
