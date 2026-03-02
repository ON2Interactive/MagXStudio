export type PageKey = string;
export type DesignTokenValue =
  | string
  | number
  | Record<string, string | number | Record<string, string | number>>;

export type ReferenceImageInput = {
  name?: string;
  mimeType: string;
  data: string;
};

export type GeneratorWorkspaceKind = "websites" | "slides" | "pages" | "visuals";
export type PresentationAspectRatio = "16:9" | "4:3";
export type PresentationDeckType = "pitch" | "sales" | "workshop" | "exec-update";
export type ThemeCategory = "auto" | "agency" | "app" | "bauhaus" | "bento" | "brutalist" | "cafe" | "corporate" | "crypto" | "dashboard" | "destijl" | "ecommerce" | "editorial" | "event" | "finance" | "fitness" | "gaming" | "glassmorphism" | "hero3cols" | "interactive" | "magazine" | "medical" | "minimal" | "portfolio" | "product" | "realestate" | "restaurant" | "saas" | "typography" | "web3";

export type VisualCategory = "ad" | "social" | "concept" | "product" | "minimal";
export type VisualTheme = "auto" | "ad-creative" | "infographic" | "product-shot" | "social-post" | "editorial" | "photorealistic" | "cinematic" | "3d-render" | "minimalist" | "illustration" | "isometric" | "cyberpunk" | "watercolor" | "line-art" | "vintage-polaroid";
export type VisualAspectRatio = "auto" | "1:1" | "1:4" | "1:8" | "2:3" | "3:2" | "3:4" | "4:1" | "4:3" | "4:5" | "5:4" | "8:1" | "9:16" | "16:9" | "21:9";

export type GenerateSiteInput = {
  workspace?: GeneratorWorkspaceKind;
  presentationAspectRatio?: PresentationAspectRatio;
  presentationDeckType?: PresentationDeckType;
  userPrompt: string;
  brandName?: string;
  industry?: string;
  targetAudience?: string;
  tone?: string;
  theme?: ThemeCategory;
  visualCategory?: VisualCategory;
  visualAspectRatio?: VisualAspectRatio;
  referenceImages?: ReferenceImageInput[];
  currentSite?: GeneratedSiteContract;
  pages?: PageKey[];
  inspiration: {
    enabled: boolean;
    maxSites: number;
  };
};

export type InspirationSource = {
  title: string;
  url: string;
  notes: string;
};

export type SectionData = {
  id: string;
  type: string;
  content: Record<string, unknown>;
};

export type PageData = {
  route: string;
  seo: {
    title: string;
    description: string;
  };
  html: string;
  css: string;
  previewImage?: string;
};

export type GeneratedSiteContract = {
  designBrief: {
    brandVibe: string;
    audience: string;
    tone: string;
    visualDirection: string;
    pageIA: Record<string, string[]>;
  };
  inspirationSources: InspirationSource[];
  designSystem: {
    colors: Record<string, DesignTokenValue>;
    type: {
      fontFamily: string;
      scale: Record<string, DesignTokenValue>;
    };
    radii: Record<string, DesignTokenValue>;
    spacing: Record<string, DesignTokenValue>;
    interactionRules?: Record<string, unknown>;
  };
  assets?: {
    imageMoodKeywords?: string[];
    heroImageSuggestions?: string[];
  };
  pages: Record<string, PageData>;
};
