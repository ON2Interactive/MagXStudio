const SEO_SCHEMA = {
  type: "object",
  required: ["title", "description"],
  properties: {
    title: { type: "string" },
    description: { type: "string" }
  }
} as const;

const PAGE_SCHEMA = {
  type: "object",
  required: ["route", "seo", "html", "css"],
  properties: {
    route: { type: "string" },
    seo: SEO_SCHEMA,
    html: { type: "string" },
    css: { type: "string" },
    previewImage: { type: "string" }
  }
} as const;

export const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  required: ["designBrief", "inspirationSources", "designSystem", "pages"],
  properties: {
    designBrief: {
      type: "object",
      required: ["brandVibe", "audience", "tone", "visualDirection", "pageIA"],
      properties: {
        brandVibe: { type: "string" },
        audience: { type: "string" },
        tone: { type: "string" },
        visualDirection: { type: "string" },
        pageIA: {
          type: "object",
          additionalProperties: { type: "array", items: { type: "string" } }
        }
      }
    },
    inspirationSources: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        required: ["title", "url", "notes"],
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          notes: { type: "string" }
        }
      }
    },
    assets: {
      type: "object",
      properties: {
        imageMoodKeywords: { type: "array", items: { type: "string" } },
        heroImageSuggestions: { type: "array", items: { type: "string" } }
      }
    },
    designSystem: {
      type: "object",
      required: ["colors", "type", "radii", "spacing"],
      properties: {
        colors: { type: "object" },
        type: {
          type: "object",
          required: ["fontFamily", "scale"],
          properties: {
            fontFamily: { type: "string" },
            scale: { type: "object" }
          }
        },
        radii: { type: "object" },
        spacing: { type: "object" },
        interactionRules: { type: "object" }
      }
    },
    pages: {
      type: "object",
      additionalProperties: PAGE_SCHEMA
    }
  }
} as const;
