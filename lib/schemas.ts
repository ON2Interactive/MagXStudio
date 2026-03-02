import { z } from "zod";
import type { GeneratedSiteContract } from "@/lib/types";

const nonEmptyString = z.string().trim().min(1);
const fallbackString = nonEmptyString.catch("Content");
const tokenValueSchema: z.ZodType<
  string | number | Record<string, string | number | Record<string, string | number>>
> = z.lazy(() =>
  z.union([
    nonEmptyString,
    z.number(),
    z.record(z.union([nonEmptyString, z.number(), z.record(z.union([nonEmptyString, z.number()]))]))
  ])
);

const seoSchema = z.object({
  title: fallbackString,
  description: fallbackString
});

const pageSchema = z.object({
  route: nonEmptyString,
  seo: seoSchema,
  html: z.string().trim().min(120),
  css: z.string().trim().min(80),
  previewImage: z
    .string()
    .trim()
    .refine((value) => /^https?:\/\//i.test(value) || /^data:image\//i.test(value), {
      message: "previewImage must be an absolute URL or data:image URI"
    })
    .optional()
});

function firstTextToken(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const nested = firstTextToken(item);
      if (nested) return nested;
    }
  }
  return "system-ui, sans-serif";
}

export const generateSiteInputSchema = z.object({
  workspace: z.enum(["websites", "slides", "pages", "visuals"]).optional(),
  presentationAspectRatio: z.enum(["16:9", "4:3"]).optional(),
  presentationDeckType: z.enum(["pitch", "sales", "workshop", "exec-update"]).optional(),
  userPrompt: z.string().min(10).max(4000),
  brandName: z.string().max(120).optional(),
  industry: z.string().max(320).optional(),
  targetAudience: z.string().max(160).optional(),
  tone: z.string().max(80).optional(),
  theme: z.enum(["auto", "agency", "app", "bauhaus", "bento", "brutalist", "cafe", "corporate", "crypto", "dashboard", "destijl", "ecommerce", "editorial", "event", "finance", "fitness", "gaming", "glassmorphism", "hero3cols", "interactive", "magazine", "medical", "minimal", "portfolio", "product", "realestate", "restaurant", "saas", "typography", "web3"]).optional(),
  visualCategory: z.enum(["ad", "social", "concept", "product", "minimal"]).optional(),
  visualAspectRatio: z.enum(["auto", "1:1", "1:4", "1:8", "2:3", "3:2", "3:4", "4:1", "4:3", "4:5", "5:4", "8:1", "9:16", "16:9", "21:9"]).optional(),
  referenceImages: z
    .array(
      z.object({
        name: z.string().max(200).optional(),
        mimeType: z.string().startsWith("image/"),
        data: z.string().min(16).max(8_000_000)
      })
    )
    .max(14)
    .optional(),
  currentSite: z.custom<GeneratedSiteContract>().optional(),
  pages: z.array(z.string().trim().min(1).max(80)).min(1).max(12).optional(),
  inspiration: z.object({
    enabled: z.boolean(),
    maxSites: z.number().int().min(3).max(6)
  })
});

export const generatedSiteSchema = z.object({
  designBrief: z.object({
    brandVibe: fallbackString,
    audience: fallbackString,
    tone: fallbackString,
    visualDirection: fallbackString,
    pageIA: z.record(z.array(fallbackString)).catch({})
  }),
  inspirationSources: z
    .array(
      z.object({
        title: fallbackString,
        url: z.string().url(),
        notes: fallbackString
      })
    )
    .min(3)
    .max(6)
    .catch([
      { title: "Reference One", url: "https://example.com", notes: "Fallback inspiration." },
      { title: "Reference Two", url: "https://example.org", notes: "Fallback inspiration." },
      { title: "Reference Three", url: "https://example.net", notes: "Fallback inspiration." }
    ]),
  designSystem: z.object({
    colors: z.record(tokenValueSchema),
    type: z.object({
      fontFamily: tokenValueSchema.transform((value) => firstTextToken(value)),
      scale: z.record(tokenValueSchema)
    }),
    radii: z.record(tokenValueSchema).catch({}),
    spacing: z.record(tokenValueSchema).catch({}),
    interactionRules: z.record(z.union([fallbackString, z.number(), z.record(z.unknown())])).optional().catch({})
  }).catch({
    colors: {}, type: { fontFamily: "system-ui, sans-serif", scale: {} }, radii: {}, spacing: {}
  }),
  assets: z
    .object({
      imageMoodKeywords: z.array(fallbackString).optional(),
      heroImageSuggestions: z.array(z.string().url()).optional()
    })
    .catch({})
    .optional(),
  pages: z.record(pageSchema).catch({
    "home": {
      route: "/",
      seo: { title: "Generated Site", description: "Created with MagXStudio" },
      html: "<div class='flex items-center justify-center h-screen'><h1>AI Generation formatting error. Please try generating again.</h1></div>",
      css: "body { font-family: sans-serif; }"
    }
  }).refine((pages) => Object.keys(pages).length > 0, {
    message: "At least one page must be generated"
  })
});

export type GenerateSiteInputSchema = z.infer<typeof generateSiteInputSchema>;
export type GeneratedSiteSchema = z.infer<typeof generatedSiteSchema>;
