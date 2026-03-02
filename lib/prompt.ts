import type { GenerateSiteInput } from "@/lib/types";
import { getDesignSystem } from "@/lib/ui-ux-pro-max";

const OUTPUT_SCHEMA = `{
  "designBrief": {
    "brandVibe": "...",
    "audience": "...",
    "tone": "...",
    "visualDirection": "...",
    "pageIA": {
      "<pageKey>": ["..."]
    }
  },
  "inspirationSources": [
    { "title": "...", "url": "https://...", "notes": "..." }
  ],
  "assets": {
    "imageMoodKeywords": ["..."],
    "heroImageSuggestions": ["https://..."]
  },
  "designSystem": {
    "colors": { "background": "...", "text": "...", "primary": "...", "secondary": "..." },
    "type": { "fontFamily": "...", "scale": { "h1": "...", "body": "..." } },
    "radii": { "sm": "...", "md": "...", "lg": "..." },
    "spacing": { "sectionY": "...", "container": "..." }
  },
  "pages": {
    "<pageKey>": {
      "route": "/",
      "seo": { "title": "...", "description": "..." },
      "html": "<main>...</main>",
      "css": "body {...}",
      "previewImage": "https://..."
    }
  }
}`;

export function buildGeminiSystemInstruction(input?: GenerateSiteInput): string {
  const hasReferenceImages = Boolean(input?.referenceImages?.length);

  return [
    "You are a World-Class Senior Creative Technologist and Lead Frontend Engineer.",
    "You build high-fidelity, cinematic '1:1 Pixel Perfect' landing pages.",
    "Every site you produce should feel like a digital instrument — every scroll intentional, every animation weighted and professional.",
    "Eradicate all generic AI patterns.",
    "",
    "HARD REQUIREMENTS",
    "- Do not force a fixed number of pages. Generate only pages requested by user intent/context.",
    "- If no pages are explicitly requested, generate a landing page by default.",
    "- Return strict JSON only.",
    "- For each page, produce full design markup in html and css fields.",
    "- html must be semantic and production-quality.",
    "- css must include responsive behavior (mobile-first + desktop).",
    "- Use a dynamic design with rich aesthetics. Avoid simple, basic outputs.",
    "- Utilize standard HTML, CSS, and implement complex interactions using GSAP inside `<script>` tags if applicable.",
    "",
    "AESTHETIC & DESIGN SYSTEM REQUIREMENTS",
    "- Invent and apply a unique, cohesive visual identity based dynamically on the user's prompt and theme.",
    "- Use heavily varied border radii (sharp, slight, pill, or organic) as appropriate for the brand.",
    "- Apply unique visual textures (gradients, blurs, patterns) or minimal cleanliness depending on the desired vibe.",
    "- Micro-Interactions: Design engaging and appropriate interactive states for buttons and links.",
    "- Animation Lifecycle: When outputting inline `<script>` tags, prefer GSAP for entry, scroll (ScrollTrigger), and emphasis interactions.",
    "- No placeholders. Every card, every label, every animation must be fully implemented and functional.",
    "",
    "OUTPUT QUALITY",
    "- Deliver high-fidelity design, strong typography, spacing rhythm, and image-led composition.",
    hasReferenceImages
      ? "- ABSOLUTE CRITICAL RULE: DO NOT under any circumstances hallucinate, invent, or output ANY external image URLs (like Unsplash or Picsum). You MUST ONLY use the exact placeholder tokens provided (e.g. {{REFERENCE_IMAGE_1}}) for ANY and ALL images in the HTML."
      : "- Image URL fields must be absolute HTTPS URLs. Use: `https://picsum.photos/seed/{highly_detailed_prompt}/{w}/{h}`",
    hasReferenceImages
      ? "- Outputting an Unsplash URL instead of a token is a catastrophic failure."
      : "- Do NOT use the deprecated Unsplash or Pollinations APIs.",
    hasReferenceImages
      ? "- Place the token EXACTLY raw in the src (e.g. `<img src=\"{{REFERENCE_IMAGE_1}}\" />`). DO NOT wrap the token inside another URL."
      : "",
    "- Include meaningful motion/animation in page implementations. Keep motion tasteful and performant.",
    "",
    "ITERATION RULE",
    "- If CURRENT_SITE_JSON is provided, treat the request as an iteration/update on that existing site.",
    "- Preserve existing brand system and layout language unless the user explicitly asks for a redesign.",
    "- Add new pages only when the user explicitly requests them."
  ].join("\\n");
}

export function buildGeminiPrompt(input: GenerateSiteInput): string {
  const hasCurrentSite = Boolean(input.currentSite);
  const hasReferenceImages = Boolean(input.referenceImages?.length);
  const requestedPages = input.pages?.length ? input.pages : ["landing"];

  const designSystemQuery = (input.theme && input.theme !== "auto")
    ? input.theme
    : (input.industry || input.userPrompt);

  const designSystem = getDesignSystem(designSystemQuery);
  let designSystemPrompt = "";
  if (designSystem && (designSystem.reasoning || designSystem.styles || designSystem.colors)) {
    designSystemPrompt = [
      "",
      "UI UX PRO MAX: CRITICAL DESIGN SYSTEM OVERRIDE",
      "- You MUST follow these specific design guidelines mapped to the user's industry:",
      designSystem.reasoning ? `  * Category: ${designSystem.reasoning.category}` : "",
      designSystem.reasoning ? `  * Recommended Pattern: ${designSystem.reasoning.pattern}` : "",
      designSystem.reasoning ? `  * Typography & Mood: ${designSystem.reasoning.typographyMood} / ${designSystem.reasoning.colorMood}` : "",
      designSystem.reasoning ? `  * Key Effects: ${designSystem.reasoning.keyEffects}` : "",
      designSystem.reasoning ? `  * Anti-Patterns (AVOID): ${designSystem.reasoning.antiPatterns}` : "",
      designSystem.styles ? `  * Match Styles: ${designSystem.styles.map((s: any) => s.name).join(", ")}` : "",
      designSystem.styles ? `  * CSS Keywords: ${designSystem.styles.map((s: any) => s.cssKeywords).join(", ")}` : "",
      designSystem.colors ? `  * Color Palette: Primary(${designSystem.colors.primary}), Secondary(${designSystem.colors.secondary}), Background(${designSystem.colors.background}), CTA(${designSystem.colors.cta}), Text(${designSystem.colors.text})` : "",
      "  * Instructions: Strictly implement the Color Palette Hex codes and match the requested 'Key Effects' and 'Typography & Mood' in the CSS and HTML output.",
      "  * LOOPHOLE OVERRIDE: If the UserPrompt explicitly requests specific colors (e.g., 'dark red', 'black background', 'neon green') or a specific mode (e.g., 'dark mode', 'light mode'), you MUST IGNORE the Pro Max Color Palette above and use the User's explicitly requested colors instead."
    ].filter(Boolean).join("\\n");
  }

  return [
    "TASK",
    hasCurrentSite
      ? "Iterate on the existing website design package."
      : "Generate a cohesive, cinematic website design package.",
    "",
    "OUTPUT JSON SCHEMA",
    OUTPUT_SCHEMA,
    designSystemPrompt,
    "",
    "INPUT",
    `UserPrompt: ${input.userPrompt}`,
    `RequestedPages: ${requestedPages.join(", ")}`,
    `BrandName: ${input.brandName ?? ""}`,
    "Instruction: You MUST use the exact BrandName provided above in the navigation bar, footer logo, and major headings of the generated HTML.",
    `ReferenceWebsite: ${input.industry ?? ""}`,
    "Instruction: If ReferenceWebsite is provided, use it as inspiration for structure and style while keeping output fully original.",
    `ReferenceImageCount: ${input.referenceImages?.length ?? 0}`,
    hasReferenceImages
      ? `ReferenceImagePlaceholders: ${(input.referenceImages ?? [])
        .map((_, index) => "{{REFERENCE_IMAGE_" + (index + 1) + "}}")
        .join(", ")}`
      : "",
    hasReferenceImages
      ? "Instruction: Use attached REFERENCE_IMAGES as visual guidance for style, color, composition, and art direction."
      : "",
    hasReferenceImages
      ? "Instruction: Treat uploaded REFERENCE_IMAGES as immutable by default. Use the provided placeholder tokens directly in img src or CSS background-image url(...) where images are needed."
      : "",
    hasReferenceImages
      ? `Instruction: CRITICAL: The user has uploaded exactly ${input.referenceImages?.length} REFERENCE_IMAGES. You MUST construct your HTML output to include EVERY SINGLE placeholder token from {{REFERENCE_IMAGE_1}} up to {{REFERENCE_IMAGE_${input.referenceImages?.length}}}. If there are more than 3 images attached, you MUST physically build dedicated HTML gallery sections, masonry grids, scrolling carousels, or multi-column flex layouts so that ALL ${input.referenceImages?.length} tokens are visibly rendered in the final markup. Leaving ANY token out is a hard failure.`
      : "",
    `TargetAudience: ${input.targetAudience ?? ""}`,
    `Tone: ${input.tone ?? ""}`,
    hasCurrentSite ? "CURRENT_SITE_JSON:" : "",
    hasCurrentSite ? JSON.stringify(input.currentSite) : ""
  ].join("\\n");
}

export function buildJsonRepairPrompt(raw: string): string {
  return [
    "Return ONLY valid JSON matching the exact schema from previous instruction.",
    "Do not include markdown fences.",
    "Repair and normalize this content into strict JSON:",
    raw
  ].join("\n\n");
}

export const REGENERATE_PROMPT_FORMAT = `You are a World-Class Senior Creative Technologist. Build high-fidelity, cinematic "1:1 Pixel Perfect" landing pages.\nReturn ONLY valid JSON.\nDo not force a fixed page count. Generate only requested pages.\nReturn full html and css per page with responsive behavior (mobile-first).\nUse GSAP for complex motion/animation.\nOutput must match the JSON schema exactly.\n\nINPUT\nUserPrompt: <<userPrompt>>\nRequestedPages: <<requestedPages_optional>>\nBrandName: <<brandName>>\nReferenceWebsite: <<industry>>\nTargetAudience: <<targetAudience>>\nTone: <<tone>>\nCURRENT_SITE_JSON: <<currentSiteJson_optional>>`;
