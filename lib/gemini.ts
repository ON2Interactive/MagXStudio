import {
  buildGeminiPrompt,
  buildGeminiSystemInstruction,
  buildJsonRepairPrompt
} from "@/lib/prompt";
import { generatedSiteSchema } from "@/lib/schemas";
import type { GenerateSiteInput, GeneratedSiteContract, ReferenceImageInput } from "@/lib/types";
import { safeJsonParse } from "@/lib/utils";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 180000;
const MODEL_ALIASES: Record<string, string> = {
  "gemini-3.1-pro": "gemini-3.1-pro-preview",
  "gemini-3-pro": "gemini-3-pro-preview",
  "gemini-3-flash": "gemini-3-flash-preview"
};

type GeminiResponse = {
  candidates?: Array<{
    groundingMetadata?: {
      webSearchQueries?: string[];
      searchEntryPoint?: unknown;
      groundingChunks?: unknown[];
    };
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
        inline_data?: { mime_type?: string; data?: string };
      }>;
    };
  }>;
};

type GeminiModelsResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
};

function firstObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (Array.isArray(value)) {
    const candidate = value.find(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    );
    return candidate ? (candidate as Record<string, unknown>) : null;
  }
  return null;
}

function normalizeGeneratedSiteShape(input: unknown): unknown {
  const root = firstObject(input);
  if (!root) return input;

  const next: Record<string, unknown> = { ...root };

  const designSystem = firstObject(next.designSystem);
  if (designSystem) next.designSystem = designSystem;

  const pages = next.pages;
  if (Array.isArray(pages)) {
    const mapped: Record<string, unknown> = {};
    for (const item of pages) {
      const obj = firstObject(item);
      if (!obj) continue;
      const key =
        (typeof obj.key === "string" && obj.key) ||
        (typeof obj.id === "string" && obj.id) ||
        (typeof obj.route === "string" && obj.route) ||
        `page-${Object.keys(mapped).length + 1}`;
      mapped[key] = obj;
    }
    next.pages = mapped;
  }

  if (Array.isArray(next.inspirationSources)) {
    next.inspirationSources = next.inspirationSources.filter(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    );
  }

  return next;
}

function extractReferenceUrls(value: string | undefined): string[] {
  if (!value) return [];
  const matches = value.match(/https?:\/\/[^\s,]+/gi) ?? [];
  const normalized = matches
    .map((url) => url.trim().replace(/[)\].,;!?]+$/g, ""))
    .filter((url) => {
      try {
        // eslint-disable-next-line no-new
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

  return Array.from(new Set(normalized)).slice(0, 20);
}

function referenceToken(index: number): string {
  return `{{REFERENCE_IMAGE_${index + 1}}}`;
}

function toDataUri(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export function replaceReferenceTokens(
  site: GeneratedSiteContract,
  referenceImages: ReferenceImageInput[] | undefined
): GeneratedSiteContract {
  if (!referenceImages?.length) return site;
  const tokenMap = new Map(
    referenceImages.map((image, index) => [referenceToken(index), toDataUri(image.mimeType, image.data)])
  );

  const nextPages: GeneratedSiteContract["pages"] = {};
  for (const [pageKey, page] of Object.entries(site.pages)) {
    let html = page.html;
    let css = page.css;
    let previewImage = page.previewImage;
    for (const [token, uri] of tokenMap.entries()) {
      html = html.split(token).join(uri);
      css = css.split(token).join(uri);
      previewImage = previewImage ? previewImage.split(token).join(uri) : previewImage;
    }
    nextPages[pageKey] = {
      ...page,
      html,
      css,
      previewImage
    };
  }

  return {
    ...site,
    pages: nextPages
  };
}

function extractText(data: GeminiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part.text ?? "").join("\n").trim();
}

function extractFirstInlineImageDataUri(data: GeminiResponse): string | null {
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

function isRenderablePage(html: string, css: string): boolean {
  const htmlLower = html.toLowerCase();
  const hasStructuralTags =
    htmlLower.includes("<section") ||
    htmlLower.includes("<main") ||
    htmlLower.includes("<header") ||
    htmlLower.includes("<article") ||
    htmlLower.includes("<div");
  const looksPlaceholder =
    htmlLower === "content" ||
    htmlLower.includes(">content<") ||
    htmlLower.includes("lorem ipsum");

  return hasStructuralTags && !looksPlaceholder && css.trim().length > 80;
}

async function callGeminiRaw({
  apiKey,
  model,
  prompt,
  systemInstruction,
  timeoutMs,
  enableWebSearch,
  enforceJsonSchema,
  referenceImages,
  referenceWebsiteUrls,
  maxOutputTokens
}: {
  apiKey: string;
  model: string;
  prompt: string;
  systemInstruction?: string;
  timeoutMs?: number;
  enableWebSearch?: boolean;
  enforceJsonSchema?: boolean;
  referenceImages?: ReferenceImageInput[];
  referenceWebsiteUrls?: string[];
  maxOutputTokens?: number;
}): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const requestMeta = {
    model,
    enableWebSearch: Boolean(enableWebSearch),
    enableUrlContext: (referenceWebsiteUrls?.length ?? 0) > 0,
    referenceWebsiteUrlCount: referenceWebsiteUrls?.length ?? 0,
    referenceImageCount: referenceImages?.length ?? 0,
    enforceJsonSchema: Boolean(enforceJsonSchema)
  };

  console.info("gemini.request", {
    ...requestMeta,
    at: new Date().toISOString()
  });

  try {
    const parts: Array<
      { text: string } | { inline_data: { mime_type: string; data: string } }
    > = [
        { text: prompt }
      ];

    if (referenceImages && referenceImages.length > 0) {
      parts.push({ text: "\n\n--- UPLOADED REFERENCE IMAGES & TOKENS ---\nHere are the actual user-uploaded images. You MUST use their corresponding {{REFERENCE_IMAGE_X}} tokens in your HTML output exactly as shown below:\n" });
      referenceImages.forEach((image, index) => {
        parts.push({ text: `\n[Image for token: {{REFERENCE_IMAGE_${index + 1}}}]` });
        parts.push({
          inline_data: {
            mime_type: image.mimeType,
            data: image.data
          }
        });
      });
      parts.push({ text: "\n--- END OF UPLOADED IMAGES ---\n\n" });
    }

    const response = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // Use native Gemini tools (google_search + url_context) for grounding.
      body: JSON.stringify({
        ...(systemInstruction
          ? { system_instruction: { parts: [{ text: systemInstruction }] } }
          : {}),
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.95,
          topP: 0.9,
          maxOutputTokens: maxOutputTokens ?? 16384,
          ...(enableWebSearch
            ? {}
            : {
              responseMimeType: "application/json"
            })
        },
        ...(() => {
          const tools: Array<Record<string, Record<string, never>>> = [];
          if (enableWebSearch) tools.push({ google_search: {} });
          if ((referenceWebsiteUrls?.length ?? 0) > 0) tools.push({ url_context: {} });
          return tools.length ? { tools } : {};
        })()
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("gemini.response.error", {
        ...requestMeta,
        status: response.status,
        bodyPreview: body.slice(0, 300),
        at: new Date().toISOString()
      });
      throw new Error(`Gemini API failed (${response.status}): ${body.slice(0, 500)}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const grounding = data.candidates?.[0]?.groundingMetadata;
    console.info("gemini.response.ok", {
      ...requestMeta,
      hasGroundingMetadata: Boolean(grounding),
      groundingQueryCount: grounding?.webSearchQueries?.length ?? 0,
      groundingChunkCount: grounding?.groundingChunks?.length ?? 0,
      at: new Date().toISOString()
    });
    return extractText(data);
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiImageRaw({
  apiKey,
  model,
  prompt,
  aspectRatio,
  referenceImages
}: {
  apiKey: string;
  model: string;
  prompt: string;
  aspectRatio: "16:9" | "4:3";
  referenceImages?: ReferenceImageInput[];
}): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const parts: Array<
      { text: string } | { inline_data: { mime_type: string; data: string } }
    > = [{ text: prompt }];

    for (const image of referenceImages ?? []) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data
        }
      });
    }

    const response = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio
          }
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GeminiResponse;
    return extractFirstInlineImageDataUri(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function finalizeGeneratedSite(
  site: GeneratedSiteContract,
  input: GenerateSiteInput,
  apiKey: string
): Promise<GeneratedSiteContract> {
  // Do NOT replace the tokens here on the server. Return the tokens exactly as generated.
  // Replacing them with base64 bloats the JSON payload to Next.js API limits.
  return site;
}

async function listGenerateContentModels(apiKey: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}?key=${apiKey}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as GeminiModelsResponse;

  return (data.models ?? [])
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => model.name?.replace("models/", ""))
    .filter((name): name is string => Boolean(name));
}

export async function generateSiteWithGemini(
  input: GenerateSiteInput
): Promise<GeneratedSiteContract> {
  const apiKey = process.env.GEMINI_API_KEY;
  const rawRequestedModel = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";
  const requestedModel = MODEL_ALIASES[rawRequestedModel] || rawRequestedModel;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const firstPrompt = buildGeminiPrompt(input);
  const referenceWebsiteUrls = extractReferenceUrls(input.industry);
  const systemInstruction =
    process.env.GEMINI_SYSTEM_INSTRUCTION?.trim() || buildGeminiSystemInstruction(input);

  const discoveredModels = await listGenerateContentModels(apiKey);
  const fallbackPriority = [
    "gemini-3.1-pro-preview",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-pro-latest"
  ];

  const candidateModels = [
    requestedModel,
    ...fallbackPriority.filter((model) => model !== requestedModel),
    ...discoveredModels.filter(
      (model) => model !== requestedModel && !fallbackPriority.includes(model)
    )
  ];

  let rawFirst = "";
  let selectedModel = requestedModel;
  let lastError: Error | null = null;
  const targetOutputTokens = 16384;

  for (const model of candidateModels) {
    try {
      rawFirst = await callGeminiRaw({
        apiKey,
        model,
        prompt: firstPrompt,
        systemInstruction,
        enableWebSearch: input.inspiration.enabled,
        referenceImages: input.referenceImages,
        referenceWebsiteUrls,
        maxOutputTokens: targetOutputTokens
      });
      selectedModel = model;
      lastError = null;
      break;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      if (message.toLowerCase().includes("aborted")) {
        try {
          // Fallback pass: disable web tool + use shorter prompt so timeout doesn't hard-fail.
          const fallbackPrompt = [
            firstPrompt,
            "",
            "TIMEOUT FALLBACK MODE:",
            "Live browsing timed out. Continue with best-effort inspiration from known patterns,",
            "still return 3-6 inspirationSources, and explicitly note browsing limitation in notes."
          ].join("\n");

          rawFirst = await callGeminiRaw({
            apiKey,
            model,
            prompt: fallbackPrompt,
            systemInstruction,
            enableWebSearch: false,
            enforceJsonSchema: true,
            timeoutMs: DEFAULT_TIMEOUT_MS,
            referenceImages: input.referenceImages,
            referenceWebsiteUrls,
            maxOutputTokens: targetOutputTokens
          });
          selectedModel = model;
          lastError = null;
          break;
        } catch (fallbackCaught) {
          const fallbackMessage =
            fallbackCaught instanceof Error ? fallbackCaught.message : String(fallbackCaught);
          lastError =
            fallbackCaught instanceof Error ? fallbackCaught : new Error(fallbackMessage);
          continue;
        }
      }
      if (!message.includes("404")) {
        throw caught;
      }
      lastError = caught instanceof Error ? caught : new Error(message);
    }
  }

  if (!rawFirst) {
    throw new Error(
      `No compatible Gemini model found. Requested '${requestedModel}'.` +
      (lastError ? ` Last error: ${lastError.message}` : "")
    );
  }

  let parsed = safeJsonParse<GeneratedSiteContract>(rawFirst);
  if (parsed) {
    parsed = normalizeGeneratedSiteShape(parsed) as GeneratedSiteContract;
  }

  if (!parsed) {
    const repairPrompt = buildJsonRepairPrompt(rawFirst);
    const repairedRaw = await callGeminiRaw({
      apiKey,
      model: selectedModel,
      prompt: repairPrompt,
      systemInstruction: "Return strict JSON only. No markdown. No commentary.",
      enableWebSearch: false,
      enforceJsonSchema: true
    });

    parsed = safeJsonParse<GeneratedSiteContract>(repairedRaw);
    if (parsed) {
      parsed = normalizeGeneratedSiteShape(parsed) as GeneratedSiteContract;
    }

    if (!parsed) {
      const finalRepairRaw = await callGeminiRaw({
        apiKey,
        model: selectedModel,
        prompt:
          "Return only strict JSON. No markdown fences. No prose. Must match requested schema exactly.",
        systemInstruction: "Return strict JSON only. No markdown. No commentary.",
        enableWebSearch: false,
        enforceJsonSchema: true
      });

      parsed = safeJsonParse<GeneratedSiteContract>(finalRepairRaw);
      if (parsed) {
        parsed = normalizeGeneratedSiteShape(parsed) as GeneratedSiteContract;
      }
    }
  }

  if (!parsed) {
    throw new Error("Model output could not be parsed as JSON after repair attempt");
  }

  const validated = generatedSiteSchema.safeParse(parsed);

  if (!validated.success) {
    const flatten = validated.error.flatten();
    const validationHint = JSON.stringify(flatten.fieldErrors).slice(0, 1200);

    const schemaRepairPrompt = [
      "You previously returned JSON that failed validation.",
      "Return ONLY valid JSON matching the required schema.",
      "Fix empty strings, missing required fields, and invalid token/value shapes.",
      `Validation issues: ${validationHint}`,
      "Source JSON to repair:",
      JSON.stringify(parsed)
    ].join("\n\n");

    const repairedForSchemaRaw = await callGeminiRaw({
      apiKey,
      model: selectedModel,
      prompt: schemaRepairPrompt,
      systemInstruction: "Return strict JSON only. No markdown. No commentary.",
      enableWebSearch: false,
      enforceJsonSchema: true
    });

    const repairedForSchemaParsed = safeJsonParse<GeneratedSiteContract>(repairedForSchemaRaw);

    if (!repairedForSchemaParsed) {
      throw new Error(
        `Generated JSON failed schema validation: ${validationHint} (schema-repair parse failed)`
      );
    }

    const secondValidation = generatedSiteSchema.safeParse(
      normalizeGeneratedSiteShape(repairedForSchemaParsed)
    );
    if (!secondValidation.success) {
      const secondFlatten = secondValidation.error.flatten();
      throw new Error(
        `Generated JSON failed schema validation: ${JSON.stringify(secondFlatten.fieldErrors).slice(0, 1200)}`
      );
    }

    return finalizeGeneratedSite(
      secondValidation.data as GeneratedSiteContract,
      input,
      apiKey
    );
  }

  let candidate = normalizeGeneratedSiteShape(validated.data) as GeneratedSiteContract;

  const allPagesRenderable = Object.values(candidate.pages).every((page) =>
    isRenderablePage(page.html, page.css)
  );

  if (allPagesRenderable) {
    return finalizeGeneratedSite(candidate, input, apiKey);
  }

  const renderRepairPrompt = [
    "Return ONLY valid JSON matching the exact schema.",
    "The prior result had non-renderable page code.",
    "Regenerate only with high-fidelity html and css for all pages in the pages object.",
    "Requirements:",
    "- html must include semantic structure and multiple sections.",
    "- css must provide clear layout, typography, spacing, and responsive breakpoints.",
    "- no placeholders like 'Content'.",
    "Source JSON to repair:",
    JSON.stringify(candidate)
  ].join("\n");

  const repairedRenderRaw = await callGeminiRaw({
    apiKey,
    model: selectedModel,
    prompt: renderRepairPrompt,
    systemInstruction: "Return strict JSON only. No markdown. No commentary.",
    enableWebSearch: false,
    enforceJsonSchema: true
  });

  const repairedRenderParsed = safeJsonParse<GeneratedSiteContract>(repairedRenderRaw);
  if (!repairedRenderParsed) {
    throw new Error("Render-repair parse failed");
  }

  const repairedValidated = generatedSiteSchema.safeParse(
    normalizeGeneratedSiteShape(repairedRenderParsed)
  );
  if (!repairedValidated.success) {
    const flatten = repairedValidated.error.flatten();
    throw new Error(
      `Render-repair failed schema validation: ${JSON.stringify(flatten.fieldErrors).slice(0, 1200)}`
    );
  }

  return finalizeGeneratedSite(
    repairedValidated.data as GeneratedSiteContract,
    input,
    apiKey
  );
}
