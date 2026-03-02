# Website Generator (Gemini 3.1 Pro)

A Next.js (App Router) + TypeScript + Tailwind app that generates a cohesive 6-page website JSON contract and exports a runnable multi-page Next.js project as a zip.

## Design Brief

### Brand vibe + audience + token direction
- Vibe: premium, modern SaaS utility with high contrast and technical polish.
- Audience: founders, marketers, and product teams that need fast website scaffolding.
- Token strategy: one source of truth for colors, type scale, radii, spacing, and shadows via CSS variables in `app/globals.css` and Tailwind token mapping in `tailwind.config.ts`.

### Information architecture (always 6 pages)
- Landing (`/`): hero, value props, proof, CTA.
- About (`/about`): story, principles, team, milestones.
- Services (`/services`): capability cards, process, deliverables, CTA.
- Pricing (`/pricing`): tier grid, feature comparison, FAQ.
- Blog (`/blog`): article index and optional post template (`/blog/[slug]`).
- Contact (`/contact`): form, contact channels, response expectations.

### Inspiration research references (live web)
- [Stripe](https://stripe.com/): modular section rhythm, strong product framing, trust-driven narrative.
- [Linear](https://linear.app/): dense but clean dark UI language, concise copy hierarchy, sharp typography.
- [Framer](https://www.framer.com/): visual momentum, polished feature storytelling, conversion-oriented CTA placement.
- [Webflow](https://webflow.com/): enterprise section architecture, clear segment messaging, scalable component framing.
- [Ramp](https://ramp.com/): practical benefit-led copy and outcomes-focused information flow.

## Core Features

- Mandatory 6-page generation contract enforced with Zod.
- Gemini generation with strict JSON output, parse + repair retry flow.
- Mandatory inspiration browsing instruction in the model prompt.
- Preview UI with page tabs (Landing/About/Services/Pricing/Blog/Contact).
- Inspiration sources panel with outbound links.
- Export API that builds a runnable Next.js project scaffold and downloads zip.
- Server-side key usage only (`GEMINI_API_KEY` in env).
- Input sanitization, max-length validation, timeout-limited model requests.
- Living UI pattern spec in `STYLE_GUIDE.md` (required reference for new UI objects).

## Project Structure

- `app/page.tsx`: main generator UI (left form, center preview tabs, right sources/thumbnails).
- `app/api/generate-site/route.ts`: Gemini call + repair + schema validation.
- `app/api/export-site/route.ts`: JSON -> file scaffold -> zip download.
- `lib/prompt.ts`: Gemini prompt template + regenerate prompt format.
- `lib/gemini.ts`: API client with timeout and strict parsing workflow.
- `lib/schemas.ts`: input/output contract validators.
- `lib/build-project.ts`: converts generated JSON into full Next.js output files.
- `components/generator/*`: form, preview, inspiration list UI modules.
- `components/sections/section-renderer.tsx`: reusable section preview renderer.
- `components/ui/*`: lightweight UI primitives.

## API Contract

### POST `/api/generate-site`
Input:

```json
{
  "userPrompt": "string",
  "brandName": "string (optional)",
  "industry": "string (optional)",
  "targetAudience": "string (optional)",
  "tone": "string (optional)",
  "pages": ["landing","about","services","pricing","blog","contact"],
  "inspiration": { "enabled": true, "maxSites": 6 }
}
```

Output:

```json
{
  "designBrief": { "...": "..." },
  "inspirationSources": [{ "title": "...", "url": "...", "notes": "..." }],
  "pages": {
    "landing": { "route": "/", "sections": [], "seo": {} },
    "about": { "route": "/about", "sections": [], "seo": {} },
    "services": { "route": "/services", "sections": [], "seo": {} },
    "pricing": { "route": "/pricing", "sections": [], "seo": {} },
    "blog": { "route": "/blog", "sections": [], "posts": [], "seo": {} },
    "contact": { "route": "/contact", "sections": [], "seo": {} }
  },
  "designSystem": {
    "colors": {},
    "type": {},
    "radii": {},
    "spacing": {}
  }
}
```

### POST `/api/export-site`
Input:

```json
{
  "generatedSite": { "...full generated JSON contract...": true }
}
```

Returns: `application/zip` with a full multi-page Next.js scaffold.

## How To Run

```bash
cd /Users/kistudioultra/Documents/Clients/MagXStudio
cp .env.example .env.local
# add GEMINI_API_KEY in .env.local
npm install
npm run dev
```

Open: `http://localhost:3000`

## Regenerate Prompt Format

Use this template for every generation request sent to Gemini 3.1 Pro:

```txt
You are Gemini 3.1 Pro acting as a senior product designer + frontend architect.
Return ONLY valid JSON (no markdown, no commentary).
Generate ALL 6 pages: landing, about, services, pricing, blog, contact.
Run web inspiration browsing for 3-6 relevant websites and include inspirationSources with title/url/notes.
Enforce one cohesive design system shared across pages.
Output must match the project JSON schema exactly.

INPUT
UserPrompt: <<userPrompt>>
BrandName: <<brandName>>
Industry: <<industry>>
TargetAudience: <<targetAudience>>
Tone: <<tone>>
```
