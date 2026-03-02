import type { GenerateSiteInput } from "@/lib/types";

const stripUnsafe = (value: string) =>
  value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function sanitizeGenerateSiteInput(input: Partial<GenerateSiteInput>): GenerateSiteInput {
  const currentSite =
    input.currentSite && typeof input.currentSite === "object"
      ? (input.currentSite as GenerateSiteInput["currentSite"])
      : undefined;
  const referenceImages = (input.referenceImages ?? [])
    .filter((image): image is NonNullable<GenerateSiteInput["referenceImages"]>[number] => {
      return Boolean(
        image &&
        typeof image === "object" &&
        typeof image.mimeType === "string" &&
        image.mimeType.startsWith("image/") &&
        typeof image.data === "string" &&
        image.data.trim().length > 0
      );
    })
    .slice(0, 14)
    .map((image) => ({
      name: image.name ? stripUnsafe(image.name) : undefined,
      mimeType: stripUnsafe(image.mimeType),
      data: image.data.replace(/\s+/g, "")
    }));

  const pages =
    input.pages && Array.isArray(input.pages)
      ? input.pages
        .map((page) => stripUnsafe(String(page ?? "")))
        .filter((page) => page.length > 0)
        .slice(0, 12)
      : ["landing"];

  const workspace =
    input.workspace === "websites" ||
      input.workspace === "slides" ||
      input.workspace === "pages" ||
      input.workspace === "visuals"
      ? input.workspace
      : "websites";
  const presentationAspectRatio =
    input.presentationAspectRatio === "4:3" || input.presentationAspectRatio === "16:9"
      ? input.presentationAspectRatio
      : "16:9";
  const presentationDeckType =
    input.presentationDeckType === "pitch" ||
      input.presentationDeckType === "sales" ||
      input.presentationDeckType === "workshop" ||
      input.presentationDeckType === "exec-update"
      ? input.presentationDeckType
      : "pitch";

  return {
    workspace,
    presentationAspectRatio,
    presentationDeckType,
    userPrompt: stripUnsafe(input.userPrompt ?? ""),
    brandName: input.brandName ? stripUnsafe(input.brandName) : undefined,
    industry: input.industry ? stripUnsafe(input.industry) : undefined,
    targetAudience: input.targetAudience ? stripUnsafe(input.targetAudience) : undefined,
    tone: input.tone ? stripUnsafe(input.tone) : undefined,
    theme: input.theme,
    visualCategory: input.visualCategory,
    visualAspectRatio: input.visualAspectRatio,
    referenceImages: referenceImages.length ? referenceImages : undefined,
    currentSite,
    pages,
    inspiration: {
      enabled: true,
      maxSites: Math.min(6, Math.max(3, input.inspiration?.maxSites ?? 6))
    }
  };
}
