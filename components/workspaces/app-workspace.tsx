"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Download,
  Eye,
  FileText,
  Grid3X3,
  Image as ImageIcon,
  Loader2,
  MousePointer2,
  Plus,
  Redo2,
  Sticker,
  Square,
  Type,
  Trash2,
  Undo2,
  Upload
} from "lucide-react";
import {
  DynamicIcon,
  dynamicIconImports,
  iconNames,
  type IconName
} from "lucide-react/dynamic";
import { HexColorPicker } from "react-colorful";
import {
  PreviewTabs,
  buildPreviewSrcDoc,
  buildThumbnailSrcDoc,
  type PagesCanvasFormat,
  type SlidesCanvasFormat
} from "@/components/generator/preview-tabs";
import { ImageEngine } from "@/components/workspaces/image-engine";
import { ShapeEngine } from "@/components/workspaces/shape-engine";
import { TextEngine } from "@/components/workspaces/text-engine";
import { InspectorPanel } from "@/components/workspaces/inspector-panel";
import { PromptForm, type PromptFormValues } from "@/components/generator/prompt-form";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type {
  GeneratedSiteContract,
  PageKey,
  PresentationAspectRatio,
  PresentationDeckType,
  ReferenceImageInput,
  ThemeCategory,
  VisualTheme,
  VisualAspectRatio
} from "@/lib/types";
import { replaceReferenceTokens } from "@/lib/gemini";
import { usePagesLocalDraft } from "@/lib/hooks/use-pages-draft";

type WorkspaceKind = "websites" | "slides" | "pages" | "visuals";
type VisualMode = "text-to-image" | "image-to-image";
type NanoBananaAspectRatio = VisualAspectRatio;
type NanoBananaImageSize = "1K" | "2K" | "4K";
type NanoBananaAspectRatioSelection = NanoBananaAspectRatio | "";
type SlidesToolId =
  | "select"
  | "move"
  | "crop"
  | "frame"
  | "icons"
  | "text"
  | "vector"
  | "link"
  | "cut"
  | "hand"
  | "grid"
  | "circle"
  | "eraser"
  | "magic"
  | "paper"
  | "prompt"
  | "upload";
type LayerOrderDirection = "front" | "back";

type ShapeInsertId =
  | "rectangle"
  | "rounded-rectangle"
  | "square"
  | "circle"
  | "triangle"
  | "diamond"
  | "polygon"
  | "star"
  | "icon";
type ShapeFillMode = "color" | "gradient" | "image";
type ImageFilterPreset = "none" | "vivid" | "warm" | "cool" | "mono" | "sepia";
type ImageInsertOrigin = "upload" | "generated" | "edited";
type CanvasGridPreset = "2x2" | "3x3" | "4x4" | "6x6" | "8x8";

type FontWeightOption = {
  label: string;
  value: string;
};

type SystemFontEntry = {
  family: string;
  weights: FontWeightOption[];
};

type TextAlignValue = "left" | "center" | "right";
type TextDecorationStyleValue = "none" | "underline" | "italic" | "line-through";
type BulletListStyleValue = "none" | "disc" | "circle" | "square";
type NumberedListStyleValue =
  | "none"
  | "decimal"
  | "lower-alpha"
  | "upper-alpha"
  | "lower-roman"
  | "upper-roman";
type PagesDesignerContentType =
  | "book"
  | "research-paper"
  | "photobook"
  | "magazine"
  | "poster"
  | "report"
  | "brochure"
  | "newsletter";

const fallbackSystemFonts: SystemFontEntry[] = [
  {
    family: "Helvetica",
    weights: [
      { label: "Regular", value: "400" },
      { label: "Bold", value: "700" }
    ]
  }
];

const defaultSystemFont = fallbackSystemFonts[0]?.family ?? "Helvetica";
const defaultFontWeight = fallbackSystemFonts[0]?.weights[0]?.value ?? "400";
const minFontSizePt = 1;
const maxFontSizePt = 288;
const defaultFontSizePt = 24;
const defaultFontSize = String(defaultFontSizePt);
const defaultTextColor = "#101114";
const defaultCanvasColor = "#ffffff";
const defaultShapeFillColor = "#9ca3af";
const defaultIconFillColor = "none";
const defaultShapeFillMode: ShapeFillMode = "color";
const defaultShapeGradientStartColor = "#9ca3af";
const defaultShapeGradientEndColor = "#6b7280";
const defaultShapeGradientAngle = 135;
const defaultShapeImageFill = "";
const defaultShapeImageOffsetX = 0;
const defaultShapeImageOffsetY = 0;
const defaultShapeStrokeColor = "#6b7280";
const defaultShapeStrokeWidthPx = 2;
const defaultShapeOpacity = 100;
const defaultShapeFillRadius = 0;
const defaultShapeRotation = 0;
const defaultImageBrightness = 100;
const defaultImageSaturation = 100;
const defaultImageOffsetX = 0;
const defaultImageOffsetY = 0;
const defaultImageFilterPreset: ImageFilterPreset = "none";
const defaultShapeTriangleSides = 3;
const defaultShapePolygonSides = 5;
const defaultShapeStarSides = 5;
const minShapeSides = 3;
const maxShapeSides = 12;
const defaultTextAlign: TextAlignValue = "left";
const fontSizeOptions = Array.from({ length: maxFontSizePt }, (_, index) => String(index + minFontSizePt));
const lineHeightPercentOptions = ["80", "90", "100", "110", "120", "130", "140", "150", "160", "180", "200"];
const wordSpacingPxOptions = ["-5", "-2", "-1", "0", "1", "2", "3", "5", "8", "10", "15", "20"];
const characterSpacingPxOptions = ["-5", "-2", "-1", "0", "1", "2", "3", "5", "8", "10", "15", "20"];
const bulletListStyleOptions: Array<{ label: string; value: BulletListStyleValue }> = [
  { label: "None", value: "none" },
  { label: "Disc", value: "disc" },
  { label: "Circle", value: "circle" },
  { label: "Square", value: "square" }
];
const numberedListStyleOptions: Array<{ label: string; value: NumberedListStyleValue }> = [
  { label: "None", value: "none" },
  { label: "1, 2, 3", value: "decimal" },
  { label: "a, b, c", value: "lower-alpha" },
  { label: "A, B, C", value: "upper-alpha" },
  { label: "i, ii, iii", value: "lower-roman" },
  { label: "I, II, III", value: "upper-roman" }
];
const defaultLineHeight = "120";
const defaultWordSpacing = "0";
const defaultCharacterSpacing = "0";
const defaultTextDecorationStyle: TextDecorationStyleValue = "none";
const defaultBulletListStyle: BulletListStyleValue = "none";
const defaultNumberedListStyle: NumberedListStyleValue = "none";
const iconFlyoutPageSize = 120;
const defaultIconFrameSizePx = 168;
const allLucideIconNames = [...iconNames].sort((left, right) => left.localeCompare(right));
const commonShapeOptions: Array<{
  id: ShapeInsertId;
  label: string;
  width: number;
  height: number;
}> = [
    { id: "rectangle", label: "Rectangle", width: 260, height: 150 },
    { id: "rounded-rectangle", label: "Rounded", width: 260, height: 150 },
    { id: "square", label: "Square", width: 200, height: 200 },
    { id: "circle", label: "Circle", width: 200, height: 200 },
    { id: "triangle", label: "Triangle", width: 220, height: 190 },
    { id: "diamond", label: "Diamond", width: 210, height: 210 },
    { id: "polygon", label: "Polygon", width: 220, height: 220 },
    { id: "star", label: "Star", width: 240, height: 220 }
  ];

type SystemFontApiPayload = {
  fonts?: Array<{ family?: string; weights?: Array<{ label?: string; value?: string }> }>;
  defaultFamily?: string;
};

type ResolvedSystemFonts = {
  fonts: SystemFontEntry[];
  defaultFamily: string;
};

let sharedSystemFonts: ResolvedSystemFonts | null = null;
let sharedSystemFontsPromise: Promise<ResolvedSystemFonts | null> | null = null;
const canvasColorStartMarker = "/* fx-canvas-color:start */";
const canvasColorEndMarker = "/* fx-canvas-color:end */";

const normalizeCanvasColor = (value: string, fallback = defaultCanvasColor): string => {
  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : fallback;
};

const extractCanvasColorFromCss = (css: string): string => {
  const markerMatch = css.match(/--fx-canvas-color:\s*([^;]+);/i);
  if (markerMatch?.[1]) return normalizeCanvasColor(markerMatch[1], defaultCanvasColor);
  const genericHexMatch = css.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{6})\b/);
  if (genericHexMatch?.[1]) return normalizeCanvasColor(genericHexMatch[1], defaultCanvasColor);
  return defaultCanvasColor;
};

const stripCanvasColorOverride = (css: string): string => {
  const start = css.indexOf(canvasColorStartMarker);
  if (start < 0) return css;
  const end = css.indexOf(canvasColorEndMarker, start);
  if (end < 0) return css;
  const before = css.slice(0, start).trimEnd();
  const after = css.slice(end + canvasColorEndMarker.length).trimStart();
  if (!before) return after;
  if (!after) return before;
  return `${before}\n${after}`;
};

const buildCanvasColorOverride = (color: string): string => {
  const safeColor = normalizeCanvasColor(color, defaultCanvasColor);
  return `${canvasColorStartMarker}
:root{--fx-canvas-color:${safeColor};}
html,body{background:var(--fx-canvas-color) !important;}
body[data-preview-workspace^='slides'],body[data-preview-workspace^='pages']{background:var(--fx-canvas-color) !important;}
main{background:var(--fx-canvas-color) !important;}
${canvasColorEndMarker}`;
};

const upsertCanvasColorOverride = (css: string, color: string): string => {
  const baseCss = stripCanvasColorOverride(css).trim();
  const overrideCss = buildCanvasColorOverride(color);
  return baseCss ? `${baseCss}\n${overrideCss}` : overrideCss;
};

const parseSystemFontsPayload = (payload: SystemFontApiPayload): ResolvedSystemFonts | null => {
  const parsedFonts: SystemFontEntry[] = (payload.fonts ?? [])
    .map((font) => {
      const family = (font.family || "").trim();
      if (!family) return null;
      const weights = (font.weights ?? [])
        .map((weight) => ({
          label: (weight.label || "").trim() || "Regular",
          value: (weight.value || "").trim() || "400"
        }))
        .filter((weight) => /^\d{3}$/.test(weight.value));
      return {
        family,
        weights: weights.length ? weights : [{ label: "Regular", value: "400" }]
      };
    })
    .filter((entry): entry is SystemFontEntry => Boolean(entry))
    .sort((a, b) => a.family.localeCompare(b.family, undefined, { sensitivity: "base" }));

  if (!parsedFonts.length) return null;

  const defaultFamily =
    parsedFonts.find((entry) => entry.family === payload.defaultFamily)?.family ??
    parsedFonts.find((entry) => entry.family.toLowerCase() === "helvetica")?.family ??
    parsedFonts[0]?.family ??
    defaultSystemFont;

  return { fonts: parsedFonts, defaultFamily };
};

const loadSharedSystemFonts = async (): Promise<ResolvedSystemFonts | null> => {
  if (sharedSystemFonts) return sharedSystemFonts;
  if (sharedSystemFontsPromise) return sharedSystemFontsPromise;

  sharedSystemFontsPromise = (async () => {
    try {
      const response = await fetch("/api/system-fonts");
      if (!response.ok) return null;
      const payload = (await response.json()) as SystemFontApiPayload;
      const resolved = parseSystemFontsPayload(payload);
      if (resolved) {
        sharedSystemFonts = resolved;
      }
      return resolved;
    } catch {
      return null;
    } finally {
      sharedSystemFontsPromise = null;
    }
  })();

  return sharedSystemFontsPromise;
};

const formatIconLabel = (iconName: string): string =>
  iconName
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const escapeHtmlAttribute = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const buildLucideSvgMarkup = async (iconName: IconName): Promise<string | null> => {
  const loadIcon = dynamicIconImports[iconName];
  if (!loadIcon) return null;
  const iconModule = await loadIcon();
  const iconNode = iconModule.__iconNode as Array<[string, Record<string, string>]>;
  const nodeMarkup = iconNode
    .map(([tagName, attrs]) => {
      const attributes = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, rawValue]) => `${key}="${escapeHtmlAttribute(String(rawValue))}"`)
        .join(" ");
      return `<${tagName}${attributes ? ` ${attributes}` : ""}></${tagName}>`;
    })
    .join("");
  if (!nodeMarkup) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="fx-lucide-icon">${nodeMarkup}</svg>`;
};

const getDefaultShapeRadiusById = (shapeId: ShapeInsertId): number => {
  if (shapeId === "rounded-rectangle") return 20;
  if (shapeId === "circle") return 999;
  return defaultShapeFillRadius;
};

const isSideCountAdjustableShape = (
  shapeId: ShapeInsertId | null | undefined
): shapeId is "triangle" | "polygon" | "star" =>
  shapeId === "triangle" || shapeId === "polygon" || shapeId === "star";

const getDefaultShapeSidesById = (shapeId: ShapeInsertId): number => {
  if (shapeId === "triangle") return defaultShapeTriangleSides;
  if (shapeId === "polygon") return defaultShapePolygonSides;
  if (shapeId === "star") return defaultShapeStarSides;
  return defaultShapePolygonSides;
};

const normalizeShapeSidesForType = (
  shapeId: ShapeInsertId | null | undefined,
  sides: string | number | undefined
): number => {
  const raw = typeof sides === "number" ? sides : Number.parseFloat(String(sides ?? "").trim());
  const fallback = shapeId ? getDefaultShapeSidesById(shapeId) : defaultShapePolygonSides;
  if (!Number.isFinite(raw)) {
    return Math.max(minShapeSides, Math.min(maxShapeSides, Math.round(fallback)));
  }
  return Math.max(minShapeSides, Math.min(maxShapeSides, Math.round(raw)));
};

const buildRegularPolygonClipPath = (sides: number): string => {
  const safeSides = Math.max(minShapeSides, Math.min(maxShapeSides, Math.round(sides)));
  const points = Array.from({ length: safeSides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / safeSides;
    const x = 50 + Math.cos(angle) * 50;
    const y = 50 + Math.sin(angle) * 50;
    return `${x.toFixed(3)}% ${y.toFixed(3)}%`;
  });
  return `polygon(${points.join(",")})`;
};

const buildStarClipPath = (points: number): string => {
  const safePoints = Math.max(minShapeSides, Math.min(maxShapeSides, Math.round(points)));
  const outerRadius = 50;
  const innerRadius = 21;
  const vertices = Array.from({ length: safePoints * 2 }, (_, index) => {
    const isOuter = index % 2 === 0;
    const radius = isOuter ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (index * Math.PI) / safePoints;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    return `${x.toFixed(3)}% ${y.toFixed(3)}%`;
  });
  return `polygon(${vertices.join(",")})`;
};

const getShapeClipPath = (
  shapeId: ShapeInsertId | null | undefined,
  shapeSides: string | number | undefined
): string | null => {
  if (!shapeId) return null;
  if (shapeId === "triangle" || shapeId === "polygon") {
    return buildRegularPolygonClipPath(normalizeShapeSidesForType(shapeId, shapeSides));
  }
  if (shapeId === "star") {
    return buildStarClipPath(normalizeShapeSidesForType(shapeId, shapeSides));
  }
  if (shapeId === "diamond") {
    return "polygon(50% 0%,100% 50%,50% 100%,0% 50%)";
  }
  return null;
};

const normalizeShapeInsertId = (shapeId: string | null | undefined): ShapeInsertId | null => {
  const raw = (shapeId || "").trim().toLowerCase();
  if (
    raw === "rectangle" ||
    raw === "rounded-rectangle" ||
    raw === "square" ||
    raw === "circle" ||
    raw === "triangle" ||
    raw === "diamond" ||
    raw === "polygon" ||
    raw === "star" ||
    raw === "icon"
  ) {
    return raw;
  }
  return null;
};

const isCornerRadiusAdjustableShape = (
  shapeId: ShapeInsertId | null | undefined
): shapeId is "rectangle" | "square" => shapeId === "rectangle" || shapeId === "square";

function ShapeLineIcon({ shapeId, className }: { shapeId: ShapeInsertId; className?: string }) {
  const sharedProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  if (shapeId === "rounded-rectangle") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <rect x="2.5" y="4.5" width="15" height="11" rx="2.8" {...sharedProps} />
      </svg>
    );
  }
  if (shapeId === "square") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <rect x="4" y="4" width="12" height="12" {...sharedProps} />
      </svg>
    );
  }
  if (shapeId === "circle") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <circle cx="10" cy="10" r="6.4" {...sharedProps} />
      </svg>
    );
  }
  if (shapeId === "triangle") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <polygon points="10,3.5 16.2,16.5 3.8,16.5" {...sharedProps} />
      </svg>
    );
  }
  if (shapeId === "diamond") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <polygon points="10,3.5 16.5,10 10,16.5 3.5,10" {...sharedProps} />
      </svg>
    );
  }
  if (shapeId === "polygon") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <polygon points="10,3.2 16.1,7.6 13.7,14.8 6.3,14.8 3.9,7.6" {...sharedProps} />
      </svg>
    );
  }
  if (shapeId === "star") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <polygon points="10,3 12.3,7.4 17.2,8 13.6,11.5 14.5,16.8 10,14.4 5.5,16.8 6.4,11.5 2.8,8 7.7,7.4" {...sharedProps} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" {...sharedProps} />
    </svg>
  );
}

const initialByWorkspace: Record<WorkspaceKind, PromptFormValues> = {
  websites: {
    userPrompt: "",
    brandName: "",
    industry: "",
    theme: "auto"
  },
  slides: {
    userPrompt: "",
    brandName: "",
    industry: "",
    theme: "auto"
  },
  pages: {
    userPrompt: "",
    brandName: "",
    industry: "",
    theme: "auto"
  },
  visuals: {
    userPrompt: "",
    brandName: "",
    industry: "",
    theme: "auto",
    visualCategory: "social",
    visualAspectRatio: "1:1"
  }
};

const slideTitleTemplatesByDeckType: Record<PresentationDeckType, string[]> = {
  pitch: [
    "Cover",
    "Problem",
    "Solution",
    "Product",
    "Market",
    "Business Model",
    "Traction",
    "Go-To-Market",
    "Roadmap",
    "Team",
    "Financials",
    "Ask"
  ],
  sales: [
    "Cover",
    "Buyer Challenges",
    "Solution Overview",
    "Capabilities",
    "Differentiators",
    "Proof",
    "Implementation",
    "Pricing",
    "ROI",
    "Next Steps"
  ],
  workshop: [
    "Cover",
    "Agenda",
    "Objectives",
    "Context",
    "Framework",
    "Exercise",
    "Examples",
    "Discussion",
    "Recap",
    "Action Items"
  ],
  "exec-update": [
    "Cover",
    "Executive Summary",
    "Key Metrics",
    "Wins",
    "Risks",
    "Decisions Needed",
    "Timeline",
    "Owners",
    "Next Steps"
  ]
};

const toolShortcutById: Partial<Record<SlidesToolId, string>> = {
  select: "V",
  text: "T",
  upload: "U",
  magic: "I",
  frame: "F",
  grid: "G"
};

type AppWorkspaceProps = {
  kind: WorkspaceKind;
  userName: string;
  active: boolean;
  incomingReferenceImage?: ReferenceImageInput | null;
  incomingReferenceImageVersion?: number;
};

type WorkspaceHistorySnapshot = {
  site: GeneratedSiteContract | null;
  activePage: PageKey;
};

const workspaceHistoryLimit = 120;

const resolveSnapshotActivePage = (
  snapshotSite: GeneratedSiteContract | null,
  preferredPage: PageKey
): PageKey => {
  if (!snapshotSite) return "landing";
  if (snapshotSite.pages[preferredPage]) return preferredPage;
  return (Object.keys(snapshotSite.pages)[0] ?? "landing") as PageKey;
};

function inferSlidesPageKeysFromPrompt(prompt: string): string[] {
  const normalized = prompt.toLowerCase();
  const explicit = normalized.match(/(\d+)\s*[-\s]?(?:slide|slides)\b/);
  const countFromPrompt = explicit ? Number.parseInt(explicit[1] ?? "1", 10) : 1;
  const count = Number.isFinite(countFromPrompt)
    ? Math.max(1, Math.min(20, countFromPrompt))
    : 1;
  return Array.from({ length: count }, (_, index) => `slide-${index + 1}`);
}

const defaultVisualPrompt = "";
const defaultPagesDesignerTopic = "";
const defaultPagesDesignerContentType: PagesDesignerContentType = "magazine";
const pagesDesignerContentTypeOptions: Array<{ value: PagesDesignerContentType; label: string }> = [
  { value: "book", label: "Book" },
  { value: "research-paper", label: "Research Paper" },
  { value: "photobook", label: "Photobook" },
  { value: "magazine", label: "Magazine" },
  { value: "poster", label: "Poster" },
  { value: "report", label: "Report" },
  { value: "brochure", label: "Brochure" },
  { value: "newsletter", label: "Newsletter" }
];
const magicPromptPlaceholder =
  "High-end monochrome hero visual with subtle gradients, soft glow, and premium editorial composition.";
const letterPageArea = 8.5 * 11;
const pagesCanvasAreaByFormat: Record<PagesCanvasFormat, { width: number; height: number }> = {
  "297x420": { width: 297, height: 420 },
  "210x297": { width: 210, height: 297 },
  "148x210": { width: 148, height: 210 },
  "8.5x11": { width: 8.5, height: 11 },
  "8.5x14": { width: 8.5, height: 14 },
  "11x17": { width: 11, height: 17 },
  "6x9": { width: 6, height: 9 },
  "5.5x8.5": { width: 5.5, height: 8.5 },
  "9x12": { width: 9, height: 12 },
  "420x297": { width: 420, height: 297 },
  "297x210": { width: 297, height: 210 },
  "210x148": { width: 210, height: 148 },
  "11x8.5": { width: 11, height: 8.5 },
  "14x8.5": { width: 14, height: 8.5 },
  "17x11": { width: 17, height: 11 },
  "9x6": { width: 9, height: 6 },
  "8.5x5.5": { width: 8.5, height: 5.5 },
  "12x9": { width: 12, height: 9 },
  "Custom": { width: 0, height: 0 }
};

const escapeHtmlText = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const canvasColorSwatches = [
  "#ffffff",
  "#f5f5f5",
  "#e5e7eb",
  "#d4d4d8",
  "#9ca3af",
  "#111827",
  "#000000",
  "#fef3c7",
  "#fde68a",
  "#fdba74",
  "#f97316",
  "#ea580c",
  "#fee2e2",
  "#fecaca",
  "#fca5a5",
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#ffedd5",
  "#fed7aa",
  "#fb923c",
  "#f59e0b",
  "#d97706",
  "#92400e",
  "#ecfccb",
  "#bef264",
  "#84cc16",
  "#65a30d",
  "#4d7c0f",
  "#365314",
  "#dcfce7",
  "#86efac",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#14532d",
  "#cffafe",
  "#67e8f9",
  "#06b6d4",
  "#0891b2",
  "#0e7490",
  "#164e63",
  "#dbeafe",
  "#93c5fd",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e3a8a",
  "#ede9fe",
  "#c4b5fd",
  "#8b5cf6",
  "#7c3aed",
  "#6d28d9",
  "#4c1d95",
  "#fce7f3",
  "#f9a8d4",
  "#ec4899",
  "#db2777",
  "#be185d",
  "#831843"
] as const;
const defaultMagicResolution: NanoBananaImageSize = "1K";
const slidesCanvasAspectOptions: Array<{ value: SlidesCanvasFormat; label: string }> = [
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
  { value: "3:2", label: "3:2" }
];
const pagesCanvasSizePortraitOptions: Array<{ value: PagesCanvasFormat; label: string }> = [
  { value: "297x420", label: "▯ A3 (297 x 420 mm)" },
  { value: "210x297", label: "▯ A4 (210 x 297 mm)" },
  { value: "148x210", label: "▯ A5 (148 x 210 mm)" },
  { value: "8.5x11", label: "▯ Letter (8.5 x 11 in)" },
  { value: "8.5x14", label: "▯ Legal (8.5 x 14 in)" },
  { value: "11x17", label: "▯ Ledger (11 x 17 in)" },
  { value: "6x9", label: "▯ US Trade Paperback (6 x 9 in)" },
  { value: "5.5x8.5", label: "▯ Half Letter (5.5 x 8.5 in)" },
  { value: "9x12", label: "▯ Oversize Magazine (9 x 12 in)" }
];
const pagesCanvasSizeLandscapeOptions: Array<{ value: PagesCanvasFormat; label: string }> = [
  { value: "420x297", label: "▭ A3 (420 x 297 mm)" },
  { value: "297x210", label: "▭ A4 (297 x 210 mm)" },
  { value: "210x148", label: "▭ A5 (210 x 148 mm)" },
  { value: "11x8.5", label: "▭ Letter (11 x 8.5 in)" },
  { value: "14x8.5", label: "▭ Legal (14 x 8.5 in)" },
  { value: "17x11", label: "▭ Ledger (17 x 11 in)" },
  { value: "9x6", label: "▭ US Trade Paperback (9 x 6 in)" },
  { value: "8.5x5.5", label: "▭ Half Letter (8.5 x 5.5 in)" },
  { value: "12x9", label: "▭ Oversize Magazine (12 x 9 in)" }
];
const pagesCanvasSizeGroups: Array<{
  label: string;
  options: Array<{ value: PagesCanvasFormat; label: string }>;
}> = [
    { label: "Portrait", options: pagesCanvasSizePortraitOptions },
    { label: "Landscape", options: pagesCanvasSizeLandscapeOptions }
  ];
const canvasGridPresetOptions: Array<{ value: CanvasGridPreset; label: string }> = [
  { value: "2x2", label: "2x2" },
  { value: "3x3", label: "3x3" },
  { value: "4x4", label: "4x4" },
  { value: "6x6", label: "6x6" },
  { value: "8x8", label: "8x8" }
];
const nanoBananaProAspectRatios: NanoBananaAspectRatio[] = [
  "auto",
  "1:1",
  "1:4",
  "1:8",
  "2:3",
  "3:2",
  "3:4",
  "4:1",
  "4:3",
  "4:5",
  "5:4",
  "8:1",
  "9:16",
  "16:9",
  "21:9"
];
const magicAspectRatioToApi: Record<NanoBananaAspectRatio, NanoBananaAspectRatio> = {
  "auto": "auto",
  "1:1": "1:1",
  "1:4": "1:4",
  "1:8": "1:8",
  "2:3": "2:3",
  "3:2": "3:2",
  "3:4": "3:4",
  "4:1": "4:1",
  "4:3": "4:3",
  "4:5": "4:5",
  "5:4": "5:4",
  "8:1": "8:1",
  "9:16": "9:16",
  "16:9": "16:9",
  "21:9": "21:9"
};

function ratioToNumber(ratio: NanoBananaAspectRatio): number {
  if (ratio === "auto") return 1;
  const [wRaw, hRaw] = ratio.split(":");
  const w = Number.parseFloat(wRaw);
  const h = Number.parseFloat(hRaw);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 1;
  return w / h;
}

function getCanvasImageFrameSize(ratio: NanoBananaAspectRatio): { width: number; height: number } {
  const ratioValue = ratioToNumber(ratio);
  let width = 640;
  let height = Math.round(width / ratioValue);
  const maxHeight = 420;
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * ratioValue);
  }
  return { width: Math.max(220, width), height: Math.max(140, height) };
}

export function AppWorkspace({
  kind,
  userName,
  active,
  incomingReferenceImage,
  incomingReferenceImageVersion
}: AppWorkspaceProps) {
  const isSlidesWorkspace = kind === "slides";
  const isPagesWorkspace = kind === "pages";
  const isMagXStudioWorkspace = kind === "slides" || kind === "pages";
  const pagesDraft = usePagesLocalDraft();
  const [draftRestoredAt, setDraftRestoredAt] = useState<number | null>(null);
  const [values, setValues] = useState<PromptFormValues>(initialByWorkspace[kind]);
  const [site, setSite] = useState<GeneratedSiteContract | null>(null);
  const [referenceImages, setReferenceImages] = useState<ReferenceImageInput[]>([]);
  const [presentationAspectRatio, setPresentationAspectRatio] =
    useState<PresentationAspectRatio>("16:9");
  const [presentationDeckType, setPresentationDeckType] =
    useState<PresentationDeckType>("pitch");
  const [slidesCanvasAspect, setSlidesCanvasAspect] = useState<SlidesCanvasFormat>("16:9");
  const [pagesCanvasSize, setPagesCanvasSize] = useState<PagesCanvasFormat>("8.5x11");
  const [canvasColor, setCanvasColor] = useState(defaultCanvasColor);
  const [canvasColorDraft, setCanvasColorDraft] = useState(defaultCanvasColor);
  const [showCanvasColorPicker, setShowCanvasColorPicker] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("landing");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<{ route: string; src: string } | null>(null);
  const [selectedImageFrameId, setSelectedImageFrameId] = useState<string | null>(null);
  const [selectedImageRoute, setSelectedImageRoute] = useState<string | null>(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedImageOrigin, setSelectedImageOrigin] = useState<ImageInsertOrigin>("upload");
  const [imageBrightness, setImageBrightness] = useState<number>(defaultImageBrightness);
  const [imageSaturation, setImageSaturation] = useState<number>(defaultImageSaturation);
  const [imageOffsetX, setImageOffsetX] = useState<number>(defaultImageOffsetX);
  const [imageOffsetY, setImageOffsetY] = useState<number>(defaultImageOffsetY);
  const [imageFilterPreset, setImageFilterPreset] = useState<ImageFilterPreset>(defaultImageFilterPreset);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showSlidesPromptModal, setShowSlidesPromptModal] = useState(false);
  const [showVisualsMagicModal, setShowVisualsMagicModal] = useState(false);
  const [showPagesGenerationModal, setShowPagesGenerationModal] = useState(false);
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [magicMode, setMagicMode] = useState<VisualMode>("text-to-image");
  const [magicPrompt, setMagicPrompt] = useState(defaultVisualPrompt);
  const [magicAspectRatio, setMagicAspectRatio] = useState<NanoBananaAspectRatioSelection>("");
  const [magicTheme, setMagicTheme] = useState<VisualTheme>("auto");
  const [magicSourceImage, setMagicSourceImage] = useState<string | null>(null);
  const [magicGenerating, setMagicGenerating] = useState(false);
  const [magicPromptTouched, setMagicPromptTouched] = useState(false);
  const [magicAspectTouched, setMagicAspectTouched] = useState(false);
  const [magicSubmitAttempted, setMagicSubmitAttempted] = useState(false);
  const [pagesDesignerTopic, setPagesDesignerTopic] = useState(defaultPagesDesignerTopic);
  const [pagesDesignerContentType, setPagesDesignerContentType] = useState<PagesDesignerContentType>(
    defaultPagesDesignerContentType
  );
  const [pagesDesignerSubmitAttempted, setPagesDesignerSubmitAttempted] = useState(false);
  const [activeSlidesTool, setActiveSlidesTool] = useState<SlidesToolId>("select");
  const [showShapeFlyout, setShowShapeFlyout] = useState(false);
  const [showIconFlyout, setShowIconFlyout] = useState(false);
  const [iconFlyoutQuery, setIconFlyoutQuery] = useState("");
  const [iconFlyoutVisibleCount, setIconFlyoutVisibleCount] = useState(iconFlyoutPageSize);
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);
  const [characterPanelPosition, setCharacterPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCharacterPanelVisible, setIsCharacterPanelVisible] = useState(false);
  const [shapePanelPosition, setShapePanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isShapePanelVisible, setIsShapePanelVisible] = useState(true);
  const [imagePanelPosition, setImagePanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isImagePanelVisible, setIsImagePanelVisible] = useState(false);
  const [iconPanelPosition, setIconPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isIconPanelVisible, setIsIconPanelVisible] = useState(true);
  const [inspectorPanelPosition, setInspectorPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [isInspectorPanelVisible, setIsInspectorPanelVisible] = useState(kind === "pages");
  const [customCanvasWidth, setCustomCanvasWidth] = useState("");
  const [customCanvasHeight, setCustomCanvasHeight] = useState("");
  const [showCanvasGrid, setShowCanvasGrid] = useState(false);
  const [canvasGridPreset, setCanvasGridPreset] = useState<CanvasGridPreset>("3x3");
  const [thumbnailTitleDrafts, setThumbnailTitleDrafts] = useState<Record<string, string>>({});
  const [selectedTextFrameId, setSelectedTextFrameId] = useState<string | null>(null);
  const [selectedTextRoute, setSelectedTextRoute] = useState<string | null>(null);
  const [selectedShapeFrameId, setSelectedShapeFrameId] = useState<string | null>(null);
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeInsertId | null>(null);
  const [selectedShapeRoute, setSelectedShapeRoute] = useState<string | null>(null);
  const [fontCatalog, setFontCatalog] = useState<SystemFontEntry[]>(fallbackSystemFonts);
  const [characterFontFamily, setCharacterFontFamily] = useState<string>(defaultSystemFont);
  const [characterFontWeight, setCharacterFontWeight] = useState<string>(defaultFontWeight);
  const [characterFontSize, setCharacterFontSize] = useState<string>(defaultFontSize);
  const [characterTextColor, setCharacterTextColor] = useState<string>(defaultTextColor);
  const [characterTextDecorationStyle, setCharacterTextDecorationStyle] =
    useState<TextDecorationStyleValue>(defaultTextDecorationStyle);
  const [characterTextAlign, setCharacterTextAlign] = useState<TextAlignValue>(defaultTextAlign);
  const [characterLineHeight, setCharacterLineHeight] = useState<string>(defaultLineHeight);
  const [characterWordSpacing, setCharacterWordSpacing] = useState<string>(defaultWordSpacing);
  const [characterSpacing, setCharacterSpacing] = useState<string>(defaultCharacterSpacing);
  const [characterBulletListStyle, setCharacterBulletListStyle] =
    useState<BulletListStyleValue>(defaultBulletListStyle);
  const [characterNumberedListStyle, setCharacterNumberedListStyle] =
    useState<NumberedListStyleValue>(defaultNumberedListStyle);
  const [textFontRequest, setTextFontRequest] = useState<{
    token: number;
    textId: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: string;
    textColor: string;
    textAlign: TextAlignValue;
    lineHeight: string;
    wordSpacing: string;
    characterSpacing: string;
    bulletListStyle: BulletListStyleValue;
    numberedListStyle: NumberedListStyleValue;
    textDecorationStyle?: TextDecorationStyleValue;
  } | null>(null);
  const [shapeFillColor, setShapeFillColor] = useState<string>(defaultShapeFillColor);
  const [shapeFillMode, setShapeFillMode] = useState<ShapeFillMode>(defaultShapeFillMode);
  const [shapeGradientStartColor, setShapeGradientStartColor] = useState<string>(
    defaultShapeGradientStartColor
  );
  const [shapeGradientEndColor, setShapeGradientEndColor] = useState<string>(
    defaultShapeGradientEndColor
  );
  const [shapeGradientAngle, setShapeGradientAngle] = useState<number>(defaultShapeGradientAngle);
  const [shapeFillImageSrc, setShapeFillImageSrc] = useState<string>(defaultShapeImageFill);
  const [shapeFillImageOffsetX, setShapeFillImageOffsetX] = useState<number>(defaultShapeImageOffsetX);
  const [shapeFillImageOffsetY, setShapeFillImageOffsetY] = useState<number>(defaultShapeImageOffsetY);
  const [shapeStrokeColor, setShapeStrokeColor] = useState<string>(defaultShapeStrokeColor);
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState<number>(defaultShapeStrokeWidthPx);
  const [shapeSides, setShapeSides] = useState<number>(defaultShapePolygonSides);
  const [shapeFillOpacity, setShapeFillOpacity] = useState<number>(defaultShapeOpacity);
  const [shapeFillRadius, setShapeFillRadius] = useState<number>(defaultShapeFillRadius);
  const [shapeRotation, setShapeRotation] = useState<number>(defaultShapeRotation);
  const [shapeStrokeOpacity, setShapeStrokeOpacity] = useState<number>(defaultShapeOpacity);
  const [shapeStyleRequest, setShapeStyleRequest] = useState<{
    token: number;
    shapeId: string;
    route: string | null;
    fillMode: ShapeFillMode;
    fillColor: string;
    fillGradientStartColor: string;
    fillGradientEndColor: string;
    fillGradientAngle: number;
    fillImageSrc: string;
    fillImageOffsetX: number;
    fillImageOffsetY: number;
    strokeColor: string;
    strokeWidth: number;
    shapeSides: number;
    fillOpacity: number;
    fillRadius: number;
    rotation: number;
    strokeOpacity: number;
  } | null>(null);
  const [imageStyleRequest, setImageStyleRequest] = useState<{
    token: number;
    imageId: string;
    route: string | null;
    brightness: number;
    saturation: number;
    imageOffsetX: number;
    imageOffsetY: number;
    filterPreset: ImageFilterPreset;
    persistToSite: boolean;
  } | null>(null);
  const [layerOrderCommand, setLayerOrderCommand] = useState<{
    token: number;
    direction: LayerOrderDirection;
  } | null>(null);
  const inspectorPanelDefaultOffset = 16;
  const inspectorPanelWidth = 332;
  const canvasUploadInputRef = useRef<HTMLInputElement | null>(null);
  const referenceUploadInputRef = useRef<HTMLInputElement | null>(null);
  const canvasInsertUploadInputRef = useRef<HTMLInputElement | null>(null);
  const canvasReplaceUploadInputRef = useRef<HTMLInputElement | null>(null);
  const canvasColorPopoverRef = useRef<HTMLDivElement | null>(null);
  const canvasColorPickerDraggingRef = useRef(false);
  const magicSourceUploadInputRef = useRef<HTMLInputElement | null>(null);
  const canvasWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const shapeFlyoutRef = useRef<HTMLDivElement | null>(null);
  const iconFlyoutRef = useRef<HTMLDivElement | null>(null);
  const historyPastRef = useRef<WorkspaceHistorySnapshot[]>([]);
  const historyFutureRef = useRef<WorkspaceHistorySnapshot[]>([]);
  const historySkipNextCommitRef = useRef(false);
  const imagePreviewRafRef = useRef<number | null>(null);
  const pendingImagePreviewRef = useRef<{
    imageId: string;
    route: string | null;
    brightness: number;
    saturation: number;
    imageOffsetX: number;
    imageOffsetY: number;
    filterPreset: ImageFilterPreset;
  } | null>(null);
  const previousSnapshotRef = useRef<WorkspaceHistorySnapshot>({ site: null, activePage });
  const previousSnapshotSignatureRef = useRef<string>(JSON.stringify(null));
  const [historyRevision, setHistoryRevision] = useState(0);
  const isToolAvailableForWorkspace = (tool: SlidesToolId): boolean => {
    if (tool === "icons") return isSlidesWorkspace || isPagesWorkspace;
    if (tool === "grid") return !isSlidesWorkspace;
    if (tool === "paper") return isPagesWorkspace;
    return (
      tool === "select" ||
      tool === "text" ||
      tool === "upload" ||
      tool === "magic" ||
      tool === "frame"
    );
  };

  const pagesPreview = useMemo(() => {
    if (!site) return [];
    return Object.entries(site.pages).map(([key, page]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      title: page.seo.title,
      srcDoc: buildThumbnailSrcDoc(page)
    }));
  }, [site, kind]);

  const normalizedIconFlyoutQuery = iconFlyoutQuery.trim().toLowerCase();
  const filteredLucideIconNames = useMemo(() => {
    if (!normalizedIconFlyoutQuery) return allLucideIconNames;
    return allLucideIconNames.filter((iconName) =>
      iconName.includes(normalizedIconFlyoutQuery)
    );
  }, [normalizedIconFlyoutQuery]);
  const visibleLucideIconNames = useMemo(
    () => filteredLucideIconNames.slice(0, iconFlyoutVisibleCount),
    [filteredLucideIconNames, iconFlyoutVisibleCount]
  );
  const hasMoreLucideIcons = visibleLucideIconNames.length < filteredLucideIconNames.length;

  const getThumbnailDisplayTitle = (pageKey: string, pageTitle: string, fallbackLabel: string): string =>
    thumbnailTitleDrafts[pageKey] ?? pageTitle ?? fallbackLabel;

  const updateThumbnailTitleDraft = (pageKey: string, value: string) => {
    setThumbnailTitleDrafts((current) => ({ ...current, [pageKey]: value }));
  };

  const commitThumbnailTitleDraft = (pageKey: string, fallbackLabel: string, value?: string) => {
    const draft = value ?? thumbnailTitleDrafts[pageKey];
    if (draft === undefined) return;
    const nextTitle = draft.trim() || fallbackLabel;

    setSite((existing) => {
      if (!existing) return existing;
      const page = existing.pages[pageKey];
      if (!page) return existing;
      if (page.seo.title === nextTitle) return existing;
      return {
        ...existing,
        pages: {
          ...existing.pages,
          [pageKey]: {
            ...page,
            seo: {
              ...page.seo,
              title: nextTitle
            }
          }
        }
      };
    });

    setThumbnailTitleDrafts((current) => {
      if (!(pageKey in current)) return current;
      const next = { ...current };
      delete next[pageKey];
      return next;
    });
  };

  const discardThumbnailTitleDraft = (pageKey: string) => {
    setThumbnailTitleDrafts((current) => {
      if (!(pageKey in current)) return current;
      const next = { ...current };
      delete next[pageKey];
      return next;
    });
  };

  useEffect(() => {
    setThumbnailTitleDrafts((current) => {
      if (!Object.keys(current).length) return current;
      if (!site) return {};
      const pageKeys = new Set(Object.keys(site.pages));
      let changed = false;
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(current)) {
        if (!pageKeys.has(key)) {
          changed = true;
          continue;
        }
        next[key] = value;
      }
      return changed ? next : current;
    });
  }, [site]);

  useEffect(() => {
    const nextSiteSignature = JSON.stringify(site ?? null);
    if (historySkipNextCommitRef.current) {
      historySkipNextCommitRef.current = false;
      previousSnapshotRef.current = { site, activePage };
      previousSnapshotSignatureRef.current = nextSiteSignature;
      return;
    }
    if (nextSiteSignature !== previousSnapshotSignatureRef.current) {
      historyPastRef.current = [
        ...historyPastRef.current.slice(-(workspaceHistoryLimit - 1)),
        previousSnapshotRef.current
      ];
      historyFutureRef.current = [];
      setHistoryRevision((value) => value + 1);
    }
    previousSnapshotRef.current = { site, activePage };
    previousSnapshotSignatureRef.current = nextSiteSignature;
  }, [site, activePage]);

  // Pages draft — restore on mount
  useEffect(() => {
    if (!isPagesWorkspace) return;
    const saved = pagesDraft.loadDraft();
    if (!saved) return;
    historySkipNextCommitRef.current = true;
    setSite(saved.site);
    setActivePage(saved.activePage);
    setCanvasColor(saved.canvasColor);
    setPagesCanvasSize(saved.pagesCanvasSize);
    setDraftRestoredAt(saved.savedAt);
    // Auto-dismiss the banner after 6 seconds
    const timer = setTimeout(() => setDraftRestoredAt(null), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pages draft — auto-save on site change (debounced 1.5s)
  useEffect(() => {
    if (!isPagesWorkspace || !site) return;
    pagesDraft.saveDraft({ site, activePage, canvasColor, pagesCanvasSize });
  }, [site, activePage, canvasColor, pagesCanvasSize, isPagesWorkspace]);

  const addReferenceImages = (nextImages: ReferenceImageInput[]) => {
    setReferenceImages((existing) => [...existing, ...nextImages].slice(0, 14));
  };

  const getWeightOptionsForFamily = (family: string): FontWeightOption[] => {
    const matched = fontCatalog.find((entry) => entry.family === family);
    return matched?.weights?.length ? matched.weights : fallbackSystemFonts[0]?.weights ?? [];
  };

  const getRuntimeDefaultFamily = (): string =>
    fontCatalog.find((entry) => entry.family.toLowerCase() === "helvetica")?.family ??
    fontCatalog[0]?.family ??
    defaultSystemFont;

  const getRuntimeDefaultWeight = (family: string): string =>
    getWeightOptionsForFamily(family)[0]?.value ?? defaultFontWeight;

  const normalizeFontFamily = (fontFamily: string | undefined): string => {
    const rawPrimary = (fontFamily || "").split(",")[0]?.trim() || "";
    const primary = rawPrimary.replace(/^['"]|['"]$/g, "");
    const exact = fontCatalog.find((entry) => entry.family.toLowerCase() === primary.toLowerCase());
    if (exact) return exact.family;
    const fuzzy = fontCatalog.find((entry) => {
      const candidate = entry.family.toLowerCase();
      const token = primary.toLowerCase();
      return candidate.startsWith(token) || token.startsWith(candidate);
    });
    return fuzzy?.family ?? defaultSystemFont;
  };

  const normalizeFontWeight = (fontWeight: string | undefined, family: string): string => {
    const options = getWeightOptionsForFamily(family);
    if (!options.length) return defaultFontWeight;
    const raw = (fontWeight || "").trim().toLowerCase();
    if (!raw) return options[0]?.value ?? defaultFontWeight;

    const numeric = raw.match(/\b([1-9]00)\b/);
    if (numeric?.[1]) {
      if (options.some((option) => option.value === numeric[1])) return numeric[1];
      const target = Number.parseInt(numeric[1], 10);
      const nearest = options.reduce((best, option) => {
        const value = Number.parseInt(option.value, 10);
        if (!Number.isFinite(value)) return best;
        if (!best) return option;
        const bestValue = Number.parseInt(best.value, 10);
        return Math.abs(value - target) < Math.abs(bestValue - target) ? option : best;
      }, null as FontWeightOption | null);
      if (nearest?.value) return nearest.value;
    }

    if (raw === "normal" && options.some((option) => option.value === "400")) return "400";
    if (raw === "bold" && options.some((option) => option.value === "700")) return "700";

    const byLabel = options.find((option) => {
      const label = option.label.toLowerCase();
      return label === raw || label.includes(raw) || raw.includes(label);
    });
    return byLabel?.value ?? options[0]?.value ?? defaultFontWeight;
  };

  const normalizeFontSize = (fontSize: string | undefined): string => {
    const raw = (fontSize || "").trim().toLowerCase();
    if (!raw) return defaultFontSize;
    const matched = raw.match(/(\d+(?:\.\d+)?)/);
    const parsed = matched ? Number.parseFloat(matched[1] ?? "") : Number.NaN;
    if (!Number.isFinite(parsed)) return defaultFontSize;
    const unit = raw.includes("px")
      ? "px"
      : raw.includes("pt")
        ? "pt"
        : "unitless";
    const ptValue = unit === "px" ? (parsed * 72) / 96 : parsed;
    const rounded = Math.round(ptValue);
    const clamped = Math.min(maxFontSizePt, Math.max(minFontSizePt, rounded));
    return String(clamped);
  };

  const normalizeTextColor = (textColor: string | undefined): string => {
    const raw = (textColor || "").trim();
    if (!raw) return defaultTextColor;

    const normalizeHex = (value: string): string | null => {
      const hex = value.replace("#", "").trim();
      if (/^[0-9a-f]{3}$/i.test(hex)) {
        return `#${hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
          .toLowerCase()}`;
      }
      if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex.toLowerCase()}`;
      return null;
    };

    const rgbToHex = (input: string): string | null => {
      const match = input.match(/rgba?\(([^)]+)\)/i);
      if (!match?.[1]) return null;
      const parts = match[1]
        .split(",")
        .map((part) => Number.parseFloat(part.trim()))
        .slice(0, 3);
      if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
      const [r, g, b] = parts.map((part) => Math.min(255, Math.max(0, Math.round(part))));
      return `#${[r, g, b]
        .map((part) => part.toString(16).padStart(2, "0"))
        .join("")}`;
    };

    if (raw.startsWith("#")) {
      return normalizeHex(raw) ?? defaultTextColor;
    }

    const rgbDirect = rgbToHex(raw);
    if (rgbDirect) return rgbDirect;

    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = defaultTextColor;
        context.fillStyle = raw;
        const resolved = context.fillStyle;
        if (typeof resolved === "string") {
          if (resolved.startsWith("#")) {
            return normalizeHex(resolved) ?? defaultTextColor;
          }
          const rgbResolved = rgbToHex(resolved);
          if (rgbResolved) return rgbResolved;
        }
      }
    }

    return defaultTextColor;
  };

  const normalizeShapeColor = (color: string | undefined, fallback: string): string => {
    const raw = (color || "").trim();
    if (!raw) return fallback;
    const lowered = raw.toLowerCase();
    if (lowered === "none" || lowered === "transparent") return "none";

    const normalizeHex = (value: string): string | null => {
      const hex = value.replace("#", "").trim();
      if (/^[0-9a-f]{3}$/i.test(hex)) {
        return `#${hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
          .toLowerCase()}`;
      }
      if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex.toLowerCase()}`;
      return null;
    };

    const rgbToHex = (input: string): string | null => {
      const value = String(input || "").trim().toLowerCase();
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match?.[1]) return null;
      const normalized = match[1].trim().replace(/\s*\/\s*/g, ",");
      const rawParts =
        normalized.indexOf(",") >= 0 ? normalized.split(",") : normalized.split(/\s+/);
      const parts = rawParts.map((part) => part.trim());
      if (parts.length < 3) return null;
      const alpha = parts[3] ? Number.parseFloat(parts[3]) : 1;
      if (Number.isFinite(alpha) && alpha <= 0) return "none";
      const rgb = parts
        .slice(0, 3)
        .map((part) => {
          if (part.endsWith("%")) {
            const percent = Number.parseFloat(part);
            if (!Number.isFinite(percent)) return NaN;
            return Math.round((Math.max(0, Math.min(100, percent)) / 100) * 255);
          }
          const numeric = Number.parseFloat(part);
          if (!Number.isFinite(numeric)) return NaN;
          return Math.min(255, Math.max(0, Math.round(numeric)));
        });
      if (rgb.some((part) => !Number.isFinite(part))) return null;
      return `#${rgb
        .map((part) => part.toString(16).padStart(2, "0"))
        .join("")}`;
    };

    if (raw.startsWith("#")) {
      return normalizeHex(raw) ?? fallback;
    }

    const rgbDirect = rgbToHex(raw);
    if (rgbDirect) return rgbDirect;

    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = fallback;
        context.fillStyle = raw;
        const resolved = context.fillStyle;
        if (typeof resolved === "string") {
          if (resolved === "transparent") return "none";
          if (resolved.startsWith("#")) {
            return normalizeHex(resolved) ?? fallback;
          }
          const rgbResolved = rgbToHex(resolved);
          if (rgbResolved) return rgbResolved;
        }
      }
    }

    return fallback;
  };

  const normalizeShapeFillMode = (mode: string | undefined): ShapeFillMode => {
    const raw = (mode || "").trim().toLowerCase();
    if (raw === "gradient") return "gradient";
    if (raw === "image") return "image";
    return "color";
  };

  const normalizeShapeGradientAngle = (angle: string | number | undefined): number => {
    const raw =
      typeof angle === "number" ? angle : Number.parseFloat(String(angle ?? "").trim());
    if (!Number.isFinite(raw)) return defaultShapeGradientAngle;
    return Math.max(0, Math.min(360, Math.round(raw)));
  };

  const normalizeShapeImageOffset = (offset: string | number | undefined): number => {
    const raw =
      typeof offset === "number" ? offset : Number.parseFloat(String(offset ?? "").trim());
    if (!Number.isFinite(raw)) return 0;
    return Math.max(-100, Math.min(100, Math.round(raw)));
  };

  const normalizeShapeOpacity = (opacity: string | number | undefined): number => {
    const raw =
      typeof opacity === "number" ? opacity : Number.parseFloat(String(opacity ?? "").trim());
    if (!Number.isFinite(raw)) return defaultShapeOpacity;
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  const normalizeImageIntensity = (value: string | number | undefined): number => {
    const raw =
      typeof value === "number" ? value : Number.parseFloat(String(value ?? "").trim());
    if (!Number.isFinite(raw)) return 100;
    return Math.max(0, Math.min(200, Math.round(raw)));
  };

  const normalizeImageOffset = (value: string | number | undefined): number => {
    const raw =
      typeof value === "number" ? value : Number.parseFloat(String(value ?? "").trim());
    if (!Number.isFinite(raw)) return 0;
    return Math.max(-100, Math.min(100, Math.round(raw)));
  };

  const normalizeImageFilterPreset = (value: string | undefined): ImageFilterPreset => {
    const raw = (value || "").trim().toLowerCase();
    if (raw === "vivid") return "vivid";
    if (raw === "warm") return "warm";
    if (raw === "cool") return "cool";
    if (raw === "mono") return "mono";
    if (raw === "sepia") return "sepia";
    return "none";
  };

  const normalizeImageInsertOrigin = (value: string | undefined): ImageInsertOrigin => {
    const raw = (value || "").trim().toLowerCase();
    if (raw === "generated") return "generated";
    if (raw === "edited") return "edited";
    return "upload";
  };

  const buildImageFilterValue = (
    preset: ImageFilterPreset,
    brightness: number,
    saturation: number
  ): string => {
    const normalizedBrightness = normalizeImageIntensity(brightness);
    const normalizedSaturation = normalizeImageIntensity(saturation);
    const baseByPreset: Record<ImageFilterPreset, string> = {
      none: "",
      vivid: "contrast(112%) saturate(120%)",
      warm: "sepia(20%) hue-rotate(-8deg)",
      cool: "hue-rotate(12deg) contrast(105%)",
      mono: "grayscale(100%)",
      sepia: "sepia(85%)"
    };
    const base = baseByPreset[preset];
    const tone = `brightness(${normalizedBrightness}%) saturate(${normalizedSaturation}%)`;
    return `${base} ${tone}`.trim();
  };

  const normalizeShapeStrokeWidth = (strokeWidth: string | number | undefined): number => {
    const raw =
      typeof strokeWidth === "number"
        ? strokeWidth
        : Number.parseFloat(String(strokeWidth ?? "").trim());
    if (!Number.isFinite(raw)) return defaultShapeStrokeWidthPx;
    return Math.max(0, Math.min(64, Math.round(raw)));
  };

  const normalizeShapeRotation = (rotation: string | number | undefined): number => {
    const parsedFromString = () => {
      const value = String(rotation ?? "").trim();
      const rotateMatch = value.match(/rotate\(([-+]?\d*\.?\d+)deg\)/i);
      if (rotateMatch?.[1]) return Number.parseFloat(rotateMatch[1]);
      return Number.parseFloat(value);
    };
    const raw = typeof rotation === "number" ? rotation : parsedFromString();
    if (!Number.isFinite(raw)) return defaultShapeRotation;
    return Math.max(-180, Math.min(180, Math.round(raw)));
  };

  const resolveShapeSides = (
    shapeType: ShapeInsertId | null | undefined,
    requestedSides: string | number | undefined
  ): number => {
    if (!shapeType) return normalizeShapeSidesForType(shapeType, requestedSides);
    return normalizeShapeSidesForType(shapeType, requestedSides);
  };

  const normalizeShapeRadius = (radius: string | number | undefined): number => {
    const raw =
      typeof radius === "number" ? radius : Number.parseFloat(String(radius ?? "").trim());
    if (!Number.isFinite(raw)) return defaultShapeFillRadius;
    return Math.max(0, Math.min(999, Math.round(raw)));
  };

  const resolveShapeFillRadius = (
    shapeType: ShapeInsertId | null | undefined,
    requestedRadius: string | number | undefined
  ): number => {
    const normalizedRequestedRadius = normalizeShapeRadius(requestedRadius);
    if (!shapeType) return normalizedRequestedRadius;
    if (isCornerRadiusAdjustableShape(shapeType)) return normalizedRequestedRadius;
    return getDefaultShapeRadiusById(shapeType);
  };

  const resolveRgbTupleFromColor = (
    color: string,
    fallbackHex: string
  ): [number, number, number] => {
    const parseHex = (value: string): [number, number, number] | null => {
      const hex = value.replace("#", "").trim();
      if (/^[0-9a-f]{6}$/i.test(hex)) {
        return [
          Number.parseInt(hex.slice(0, 2), 16),
          Number.parseInt(hex.slice(2, 4), 16),
          Number.parseInt(hex.slice(4, 6), 16)
        ];
      }
      return null;
    };
    const parseRgb = (value: string): [number, number, number] | null => {
      const raw = String(value || "").trim().toLowerCase();
      const match = raw.match(/rgba?\(([^)]+)\)/i);
      if (!match?.[1]) return null;
      const normalized = match[1].trim().replace(/\s*\/\s*/g, ",");
      const rawParts =
        normalized.indexOf(",") >= 0 ? normalized.split(",") : normalized.split(/\s+/);
      const parts = rawParts
        .slice(0, 3)
        .map((part) => {
          const token = part.trim();
          if (token.endsWith("%")) {
            const percent = Number.parseFloat(token);
            if (!Number.isFinite(percent)) return NaN;
            return Math.round((Math.max(0, Math.min(100, percent)) / 100) * 255);
          }
          const numeric = Number.parseFloat(token);
          return Number.isFinite(numeric)
            ? Math.max(0, Math.min(255, Math.round(numeric)))
            : NaN;
        });
      if (parts.some((part) => !Number.isFinite(part))) return null;
      return [parts[0], parts[1], parts[2]];
    };
    const parseSrgb = (value: string): [number, number, number] | null => {
      const raw = String(value || "").trim().toLowerCase();
      const match = raw.match(/^color\(\s*srgb\s+([^)]+)\)$/i);
      if (!match?.[1]) return null;
      const body = match[1].trim();
      const withoutAlpha = body.split("/")[0]?.trim() ?? body;
      const parts = withoutAlpha.split(/\s+/).filter(Boolean);
      if (parts.length < 3) return null;
      const rgb = parts.slice(0, 3).map((part) => {
        if (part.endsWith("%")) {
          const percent = Number.parseFloat(part);
          if (!Number.isFinite(percent)) return NaN;
          return Math.round((Math.max(0, Math.min(100, percent)) / 100) * 255);
        }
        const numeric = Number.parseFloat(part);
        if (!Number.isFinite(numeric)) return NaN;
        return Math.round(Math.max(0, Math.min(1, numeric)) * 255);
      });
      if (rgb.some((part) => !Number.isFinite(part))) return null;
      return [rgb[0], rgb[1], rgb[2]];
    };

    const fromHex = parseHex(color);
    if (fromHex) return fromHex;
    const fromRgb = parseRgb(color);
    if (fromRgb) return fromRgb;
    const fromSrgb = parseSrgb(color);
    if (fromSrgb) return fromSrgb;

    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = fallbackHex;
        context.fillStyle = color;
        const resolved = context.fillStyle;
        if (typeof resolved === "string") {
          const resolvedHex = parseHex(resolved);
          if (resolvedHex) return resolvedHex;
          const resolvedRgb = parseRgb(resolved);
          if (resolvedRgb) return resolvedRgb;
          const resolvedSrgb = parseSrgb(resolved);
          if (resolvedSrgb) return resolvedSrgb;
        }
      }
    }

    return parseHex(fallbackHex) ?? [0, 0, 0];
  };

  const shapeColorToRgba = (color: string, opacity: number, fallbackHex: string): string => {
    if (color === "none") return "rgba(0, 0, 0, 0)";
    const [r, g, b] = resolveRgbTupleFromColor(color, fallbackHex);
    const alpha = Math.max(0, Math.min(1, normalizeShapeOpacity(opacity) / 100));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const applyFillStyleToShapeNode = (
    fillNode: HTMLElement,
    fillMode: ShapeFillMode,
    fillColor: string,
    fillOpacity: number,
    fillGradientStartColor: string,
    fillGradientEndColor: string,
    fillGradientAngle: number,
    fillImageSrc: string,
    fillImageOffsetX: number,
    fillImageOffsetY: number
  ) => {
    const normalizedMode = normalizeShapeFillMode(fillMode);
    const normalizedFillColor = normalizeShapeColor(fillColor, defaultShapeFillColor);
    const normalizedFillOpacity = normalizeShapeOpacity(fillOpacity);
    const normalizedGradientStart = normalizeShapeColor(
      fillGradientStartColor,
      defaultShapeGradientStartColor
    );
    const normalizedGradientEnd = normalizeShapeColor(
      fillGradientEndColor,
      defaultShapeGradientEndColor
    );
    const normalizedGradientAngle = normalizeShapeGradientAngle(fillGradientAngle);
    const normalizedImageSrc = (fillImageSrc || "").trim();
    const normalizedImageOffsetX = normalizeShapeImageOffset(fillImageOffsetX);
    const normalizedImageOffsetY = normalizeShapeImageOffset(fillImageOffsetY);

    fillNode.style.backgroundBlendMode = "";
    fillNode.style.backgroundSize = "";
    fillNode.style.backgroundPosition = "";
    fillNode.style.backgroundPositionX = "";
    fillNode.style.backgroundPositionY = "";
    fillNode.style.backgroundRepeat = "";

    if (normalizedMode === "image" && normalizedImageSrc) {
      const imagePositionX = Math.max(0, Math.min(100, 50 + normalizedImageOffsetX));
      const imagePositionY = Math.max(0, Math.min(100, 50 + normalizedImageOffsetY / 2));
      fillNode.style.background = "transparent";
      fillNode.style.backgroundColor = "transparent";
      fillNode.style.backgroundImage = `url("${normalizedImageSrc.replace(/"/g, "%22")}")`;
      fillNode.style.backgroundSize = "cover";
      fillNode.style.backgroundPositionX = `${imagePositionX}%`;
      fillNode.style.backgroundPositionY = `${imagePositionY}%`;
      fillNode.style.backgroundPosition = `${imagePositionX}% ${imagePositionY}%`;
      fillNode.style.backgroundRepeat = "no-repeat";
      return;
    }

    if (normalizedMode === "gradient") {
      const startColor = shapeColorToRgba(
        normalizedGradientStart,
        normalizedFillOpacity,
        defaultShapeGradientStartColor
      );
      const endColor = shapeColorToRgba(
        normalizedGradientEnd,
        normalizedFillOpacity,
        defaultShapeGradientEndColor
      );
      const gradient = `linear-gradient(${normalizedGradientAngle}deg, ${startColor} 0%, ${endColor} 100%)`;
      fillNode.style.background = gradient;
      fillNode.style.backgroundColor = "transparent";
      fillNode.style.backgroundImage = gradient;
      return;
    }

    fillNode.style.backgroundImage = "";
    if (normalizedFillColor === "none") {
      fillNode.style.background = "transparent";
      fillNode.style.backgroundColor = "transparent";
      return;
    }

    const fillRgba = shapeColorToRgba(
      normalizedFillColor,
      normalizedFillOpacity,
      defaultShapeFillColor
    );
    fillNode.style.background = fillRgba;
    fillNode.style.backgroundColor = fillRgba;
  };

  const normalizeTextAlign = (textAlign: string | undefined): TextAlignValue => {
    const raw = (textAlign || "").trim().toLowerCase();
    if (raw === "center") return "center";
    if (raw === "right" || raw === "end") return "right";
    if (raw === "left" || raw === "start") return "left";
    return defaultTextAlign;
  };

  const normalizeTextDecorationStyle = (
    textDecorationStyle: string | undefined,
    fontStyle?: string
  ): TextDecorationStyleValue => {
    const decorationRaw = (textDecorationStyle || "").trim().toLowerCase();
    if (decorationRaw === "underline") return "underline";
    if (decorationRaw === "italic") return "italic";
    if (decorationRaw === "line-through" || decorationRaw === "strikethrough") return "line-through";
    if (decorationRaw.includes("line-through")) return "line-through";
    if (decorationRaw.includes("underline")) return "underline";
    if (decorationRaw.includes("italic") || decorationRaw.includes("oblique")) return "italic";

    const fontStyleRaw = (fontStyle || "").trim().toLowerCase();
    if (fontStyleRaw.includes("italic") || fontStyleRaw.includes("oblique")) return "italic";
    return defaultTextDecorationStyle;
  };

  const nearestOptionValue = (options: readonly string[], input: number, fallback: string): string => {
    if (!Number.isFinite(input)) return fallback;
    let nearest = fallback;
    let nearestDelta = Number.POSITIVE_INFINITY;
    for (const option of options) {
      const parsed = Number.parseFloat(option);
      if (!Number.isFinite(parsed)) continue;
      const delta = Math.abs(parsed - input);
      if (delta < nearestDelta) {
        nearest = option;
        nearestDelta = delta;
      }
    }
    return nearest;
  };

  const normalizeLineHeight = (lineHeight: string | undefined, fontSize: string | undefined): string => {
    const raw = (lineHeight || "").trim().toLowerCase();
    if (!raw || raw === "normal") return defaultLineHeight;

    const directPercent = raw.match(/(-?\d+(?:\.\d+)?)\s*%/);
    if (directPercent?.[1]) {
      const parsed = Number.parseFloat(directPercent[1]);
      return nearestOptionValue(lineHeightPercentOptions, parsed, defaultLineHeight);
    }

    const directUnitless = raw.match(/^-?\d+(?:\.\d+)?$/);
    if (directUnitless?.[0]) {
      const parsed = Number.parseFloat(directUnitless[0]);
      const asPercent = parsed <= 10 ? parsed * 100 : parsed;
      return nearestOptionValue(lineHeightPercentOptions, asPercent, defaultLineHeight);
    }

    const pxMatch = raw.match(/(-?\d+(?:\.\d+)?)\s*px/);
    if (pxMatch?.[1]) {
      const px = Number.parseFloat(pxMatch[1]);
      const sizePt = Number.parseFloat((fontSize || "").trim());
      const sizePx = Number.isFinite(sizePt) ? (sizePt * 96) / 72 : 0;
      if (sizePx > 0) {
        const asPercent = (px / sizePx) * 100;
        return nearestOptionValue(lineHeightPercentOptions, asPercent, defaultLineHeight);
      }
    }

    return defaultLineHeight;
  };

  const normalizeWordSpacing = (wordSpacing: string | undefined, fontSize: string | undefined): string => {
    const raw = (wordSpacing || "").trim().toLowerCase();
    if (!raw || raw === "normal") return defaultWordSpacing;

    const unitless = raw.match(/^-?\d+(?:\.\d+)?$/);
    if (unitless?.[0]) {
      const parsed = Number.parseFloat(unitless[0]);
      return nearestOptionValue(wordSpacingPxOptions, parsed, defaultWordSpacing);
    }

    const px = raw.match(/(-?\d+(?:\.\d+)?)\s*px/);
    if (px?.[1]) {
      const parsed = Number.parseFloat(px[1]);
      return nearestOptionValue(wordSpacingPxOptions, parsed, defaultWordSpacing);
    }

    const pt = raw.match(/(-?\d+(?:\.\d+)?)\s*pt/);
    if (pt?.[1]) {
      const parsed = Number.parseFloat(pt[1]);
      return nearestOptionValue(wordSpacingPxOptions, (parsed * 96) / 72, defaultWordSpacing);
    }

    const em = raw.match(/(-?\d+(?:\.\d+)?)\s*em/);
    if (em?.[1]) {
      const parsed = Number.parseFloat(em[1]);
      const sizePt = Number.parseFloat((fontSize || "").trim());
      const sizePx = Number.isFinite(sizePt) ? (sizePt * 96) / 72 : 0;
      if (sizePx > 0) {
        return nearestOptionValue(wordSpacingPxOptions, parsed * sizePx, defaultWordSpacing);
      }
    }

    return defaultWordSpacing;
  };

  const normalizeCharacterSpacing = (
    characterSpacing: string | undefined,
    fontSize: string | undefined
  ): string => {
    const raw = (characterSpacing || "").trim().toLowerCase();
    if (!raw || raw === "normal") return defaultCharacterSpacing;

    const unitless = raw.match(/^-?\d+(?:\.\d+)?$/);
    if (unitless?.[0]) {
      const parsed = Number.parseFloat(unitless[0]);
      return nearestOptionValue(characterSpacingPxOptions, parsed, defaultCharacterSpacing);
    }

    const px = raw.match(/(-?\d+(?:\.\d+)?)\s*px/);
    if (px?.[1]) {
      const parsed = Number.parseFloat(px[1]);
      return nearestOptionValue(characterSpacingPxOptions, parsed, defaultCharacterSpacing);
    }

    const pt = raw.match(/(-?\d+(?:\.\d+)?)\s*pt/);
    if (pt?.[1]) {
      const parsed = Number.parseFloat(pt[1]);
      return nearestOptionValue(characterSpacingPxOptions, (parsed * 96) / 72, defaultCharacterSpacing);
    }

    const em = raw.match(/(-?\d+(?:\.\d+)?)\s*em/);
    if (em?.[1]) {
      const parsed = Number.parseFloat(em[1]);
      const sizePt = Number.parseFloat((fontSize || "").trim());
      const sizePx = Number.isFinite(sizePt) ? (sizePt * 96) / 72 : 0;
      if (sizePx > 0) {
        return nearestOptionValue(characterSpacingPxOptions, parsed * sizePx, defaultCharacterSpacing);
      }
    }

    return defaultCharacterSpacing;
  };

  const normalizeBulletListStyle = (listStyle: string | undefined): BulletListStyleValue => {
    const raw = (listStyle || "").trim().toLowerCase();
    if (raw === "disc" || raw === "circle" || raw === "square") return raw;
    return "none";
  };

  const normalizeNumberedListStyle = (listStyle: string | undefined): NumberedListStyleValue => {
    const raw = (listStyle || "").trim().toLowerCase();
    if (
      raw === "decimal" ||
      raw === "lower-alpha" ||
      raw === "upper-alpha" ||
      raw === "lower-roman" ||
      raw === "upper-roman"
    ) {
      return raw;
    }
    return "none";
  };

  const readTextLinesFromContent = (content: HTMLElement): string[] => {
    const first = content.firstElementChild;
    const firstList =
      first instanceof HTMLUListElement || first instanceof HTMLOListElement ? first : null;
    const anyList = firstList ?? content.querySelector("ul,ol");
    if (anyList && (anyList.tagName === "UL" || anyList.tagName === "OL")) {
      const items = Array.from(anyList.children)
        .filter((node): node is HTMLLIElement => node instanceof HTMLLIElement)
        .map((item) => (item.textContent || "").replace(/\u00A0/g, " ").trim())
        .filter((item) => item.length > 0);
      if (items.length) return items;
    }

    const lines = (content.innerText || content.textContent || "")
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length) return lines;
    return ["List item"];
  };

  const applyListStyleToTextContent = (
    content: HTMLElement,
    bulletListStyle: BulletListStyleValue,
    numberedListStyle: NumberedListStyleValue
  ) => {
    const normalizedBullet = normalizeBulletListStyle(bulletListStyle);
    const normalizedNumbered = normalizeNumberedListStyle(numberedListStyle);
    const hasOrdered = normalizedNumbered !== "none";
    const hasUnordered = !hasOrdered && normalizedBullet !== "none";

    const first = content.firstElementChild;
    const firstList =
      first instanceof HTMLUListElement || first instanceof HTMLOListElement ? first : null;
    const currentList = firstList ?? content.querySelector("ul,ol");
    const existingList =
      currentList && (currentList.tagName === "UL" || currentList.tagName === "OL")
        ? (currentList as HTMLUListElement | HTMLOListElement)
        : null;

    if (!hasOrdered && !hasUnordered) {
      if (existingList) {
        const lines = Array.from(existingList.children)
          .filter((node): node is HTMLLIElement => node instanceof HTMLLIElement)
          .map((item) => (item.textContent || "").replace(/\u00A0/g, " ").trim())
          .filter((line) => line.length > 0);
        content.textContent = lines.join("\n") || "Edit text";
      }
      content.setAttribute("data-fx-bullet-list-style", "none");
      content.setAttribute("data-fx-numbered-list-style", "none");
      return;
    }

    const desiredTag = hasOrdered ? "ol" : "ul";
    const desiredType = hasOrdered ? normalizedNumbered : normalizedBullet;
    const lines = readTextLinesFromContent(content);
    let targetList: HTMLUListElement | HTMLOListElement;

    if (existingList && existingList.tagName.toLowerCase() === desiredTag) {
      targetList = existingList;
      if (!targetList.children.length) {
        const listItem = document.createElement("li");
        listItem.textContent = lines[0] ?? "List item";
        targetList.appendChild(listItem);
      }
      targetList.classList.add("fx-text-list");
    } else {
      targetList =
        desiredTag === "ol" ? document.createElement("ol") : document.createElement("ul");
      targetList.className = "fx-text-list";
      lines.forEach((line) => {
        const listItem = document.createElement("li");
        listItem.textContent = line;
        targetList.appendChild(listItem);
      });
      if (!targetList.children.length) {
        const listItem = document.createElement("li");
        listItem.textContent = "List item";
        targetList.appendChild(listItem);
      }
      content.innerHTML = "";
      content.appendChild(targetList);
    }

    targetList.style.listStyleType = desiredType;
    targetList.style.margin = "0";
    targetList.style.paddingInlineStart = "1.25em";
    content.setAttribute("data-fx-bullet-list-style", hasUnordered ? normalizedBullet : "none");
    content.setAttribute("data-fx-numbered-list-style", hasOrdered ? normalizedNumbered : "none");
  };

  const createTextFrameId = () =>
    `fx-text-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const createImageFrameId = () =>
    `fx-image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const createShapeFrameId = () =>
    `fx-shape-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const createIconFrameId = () =>
    `fx-icon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const applyTextStyleToTextFrameInSite = (
    textId: string,
    fontFamily: string,
    fontWeight: string,
    fontSize: string,
    textColor: string,
    textDecorationStyle: TextDecorationStyleValue,
    textAlign: TextAlignValue,
    lineHeight: string,
    wordSpacing: string,
    characterSpacing: string,
    bulletListStyle: BulletListStyleValue,
    numberedListStyle: NumberedListStyleValue
  ) => {
    setSite((existing) => {
      if (!existing) return existing;
      const nextPages = { ...existing.pages };
      const byRoute = selectedTextRoute
        ? Object.entries(nextPages).find(([, page]) => page.route === selectedTextRoute)?.[0]
        : undefined;
      const byTextId =
        Object.entries(nextPages).find(([, page]) => page.html.includes(`data-fx-id="${textId}"`))?.[0] ??
        undefined;
      const targetKey = byRoute ?? byTextId ?? activePage;
      const targetPage = nextPages[targetKey];
      if (!targetPage) return existing;

      const template = document.createElement("template");
      template.innerHTML = targetPage.html;
      const content = template.content.querySelector(
        `.fx-text-frame[data-fx-id="${textId}"] .fx-text-content`
      );
      if (!(content instanceof HTMLElement)) return existing;

      content.style.fontFamily = fontFamily;
      content.style.fontWeight = fontWeight;
      content.style.fontSize = `${fontSize}pt`;
      content.style.color = textColor;
      content.style.fontStyle = textDecorationStyle === "italic" ? "italic" : "normal";
      content.style.textDecorationLine =
        textDecorationStyle === "underline"
          ? "underline"
          : textDecorationStyle === "line-through"
            ? "line-through"
            : "none";
      content.style.textAlign = textAlign;
      content.style.lineHeight = `${Number.parseFloat(lineHeight) / 100}`;
      content.style.wordSpacing = `${wordSpacing}px`;
      content.style.letterSpacing = `${characterSpacing}px`;
      applyListStyleToTextContent(content, bulletListStyle, numberedListStyle);
      content.setAttribute("data-fx-font-family", fontFamily);
      content.setAttribute("data-fx-font-weight", fontWeight);
      content.setAttribute("data-fx-font-size", fontSize);
      content.setAttribute("data-fx-text-color", textColor);
      content.setAttribute("data-fx-text-decoration-style", textDecorationStyle);
      content.setAttribute("data-fx-text-align", textAlign);
      content.setAttribute("data-fx-line-height", lineHeight);
      content.setAttribute("data-fx-word-spacing", wordSpacing);
      content.setAttribute("data-fx-character-spacing", characterSpacing);
      content.setAttribute("data-fx-bullet-list-style", bulletListStyle);
      content.setAttribute("data-fx-numbered-list-style", numberedListStyle);

      nextPages[targetKey] = {
        ...targetPage,
        html: template.innerHTML
      };
      return {
        ...existing,
        pages: nextPages
      };
    });
  };

  const applyShapeStyleToShapeFrameInSite = (
    shapeId: string,
    fillMode: ShapeFillMode,
    fillColor: string,
    fillGradientStartColor: string,
    fillGradientEndColor: string,
    fillGradientAngle: number,
    fillImageSrc: string,
    fillImageOffsetX: number,
    fillImageOffsetY: number,
    strokeColor: string,
    fillOpacity: number,
    shapeSides: number,
    fillRadius: number,
    rotation: number,
    strokeOpacity: number,
    strokeWidth: number
  ) => {
    setSite((existing) => {
      if (!existing) return existing;
      const nextPages = { ...existing.pages };
      const byRoute = selectedShapeRoute
        ? Object.entries(nextPages).find(([, page]) => page.route === selectedShapeRoute)?.[0]
        : undefined;
      const byShapeId =
        Object.entries(nextPages).find(([, page]) => page.html.includes(`data-fx-id="${shapeId}"`))?.[0] ??
        undefined;
      const candidateKeys = [
        byRoute,
        byShapeId,
        activePage,
        ...Object.keys(nextPages)
      ].filter((key, index, arr): key is string => Boolean(key) && arr.indexOf(key) === index);
      let resolvedKey: string | null = null;
      let frame: HTMLElement | null = null;
      let fillNode: HTMLElement | null = null;
      let template: HTMLTemplateElement | null = null;

      for (const key of candidateKeys) {
        const page = nextPages[key];
        if (!page) continue;
        const nextTemplate = document.createElement("template");
        nextTemplate.innerHTML = page.html;
        const nextFrame = nextTemplate.content.querySelector(`.fx-shape-frame[data-fx-id="${shapeId}"]`);
        if (!(nextFrame instanceof HTMLElement)) continue;
        const nextFillNode = nextFrame.querySelector(".fx-shape-fill");
        if (!(nextFillNode instanceof HTMLElement)) continue;
        resolvedKey = key;
        frame = nextFrame;
        fillNode = nextFillNode;
        template = nextTemplate;
        break;
      }

      if (!resolvedKey || !frame || !fillNode || !template) return existing;
      const targetPage = nextPages[resolvedKey];
      if (!targetPage) return existing;

      const frameShapeType = normalizeShapeInsertId(frame.getAttribute("data-fx-shape"));
      const normalizedFillMode = normalizeShapeFillMode(fillMode);
      const normalizedFillColor = normalizeShapeColor(fillColor, defaultShapeFillColor);
      const normalizedFillGradientStartColor = normalizeShapeColor(
        fillGradientStartColor,
        defaultShapeGradientStartColor
      );
      const normalizedFillGradientEndColor = normalizeShapeColor(
        fillGradientEndColor,
        defaultShapeGradientEndColor
      );
      const normalizedFillGradientAngle = normalizeShapeGradientAngle(fillGradientAngle);
      const normalizedFillImageSrc = (fillImageSrc || "").trim();
      const normalizedFillImageOffsetX = normalizeShapeImageOffset(fillImageOffsetX);
      const normalizedFillImageOffsetY = normalizeShapeImageOffset(fillImageOffsetY);
      const normalizedStrokeColor = normalizeShapeColor(strokeColor, defaultShapeStrokeColor);
      const normalizedFillOpacity = normalizeShapeOpacity(fillOpacity);
      const normalizedShapeSides = resolveShapeSides(frameShapeType, shapeSides);
      const normalizedFillRadius = resolveShapeFillRadius(frameShapeType, fillRadius);
      const normalizedRotation = normalizeShapeRotation(rotation);
      const normalizedStrokeOpacity = normalizeShapeOpacity(strokeOpacity);
      const normalizedStrokeWidth = normalizeShapeStrokeWidth(strokeWidth);
      const shapeClipPath = getShapeClipPath(frameShapeType, normalizedShapeSides);

      frame.setAttribute("data-fx-fill-mode", normalizedFillMode);
      frame.setAttribute("data-fx-fill", normalizedFillColor);
      frame.setAttribute("data-fx-fill-gradient-start", normalizedFillGradientStartColor);
      frame.setAttribute("data-fx-fill-gradient-end", normalizedFillGradientEndColor);
      frame.setAttribute("data-fx-fill-gradient-angle", String(normalizedFillGradientAngle));
      frame.setAttribute("data-fx-fill-image", normalizedFillImageSrc);
      frame.setAttribute("data-fx-fill-image-x", String(normalizedFillImageOffsetX));
      frame.setAttribute("data-fx-fill-image-y", String(normalizedFillImageOffsetY));
      frame.setAttribute("data-fx-stroke", normalizedStrokeColor);
      frame.setAttribute("data-fx-fill-opacity", String(normalizedFillOpacity));
      frame.setAttribute("data-fx-shape-sides", String(normalizedShapeSides));
      frame.setAttribute("data-fx-fill-radius", String(normalizedFillRadius));
      frame.setAttribute("data-fx-rotation", String(normalizedRotation));
      frame.setAttribute("data-fx-stroke-opacity", String(normalizedStrokeOpacity));
      frame.setAttribute("data-fx-stroke-width", String(normalizedStrokeWidth));
      fillNode.setAttribute("data-fx-fill-mode", normalizedFillMode);
      fillNode.setAttribute("data-fx-fill", normalizedFillColor);
      fillNode.setAttribute("data-fx-fill-gradient-start", normalizedFillGradientStartColor);
      fillNode.setAttribute("data-fx-fill-gradient-end", normalizedFillGradientEndColor);
      fillNode.setAttribute("data-fx-fill-gradient-angle", String(normalizedFillGradientAngle));
      fillNode.setAttribute("data-fx-fill-image", normalizedFillImageSrc);
      fillNode.setAttribute("data-fx-fill-image-x", String(normalizedFillImageOffsetX));
      fillNode.setAttribute("data-fx-fill-image-y", String(normalizedFillImageOffsetY));
      fillNode.setAttribute("data-fx-stroke", normalizedStrokeColor);
      fillNode.setAttribute("data-fx-fill-opacity", String(normalizedFillOpacity));
      fillNode.setAttribute("data-fx-shape-sides", String(normalizedShapeSides));
      fillNode.setAttribute("data-fx-fill-radius", String(normalizedFillRadius));
      fillNode.setAttribute("data-fx-rotation", String(normalizedRotation));
      fillNode.setAttribute("data-fx-stroke-opacity", String(normalizedStrokeOpacity));
      applyFillStyleToShapeNode(
        fillNode,
        normalizedFillMode,
        normalizedFillColor,
        normalizedFillOpacity,
        normalizedFillGradientStartColor,
        normalizedFillGradientEndColor,
        normalizedFillGradientAngle,
        normalizedFillImageSrc,
        normalizedFillImageOffsetX,
        normalizedFillImageOffsetY
      );
      fillNode.style.transform = `rotate(${normalizedRotation}deg)`;
      fillNode.style.transformOrigin = "center center";

      const isIconFrame = frame.classList.contains("fx-icon-frame");
      if (normalizedStrokeColor === "none" || normalizedStrokeWidth <= 0) {
        fillNode.style.border = "0px solid transparent";
        fillNode.style.boxShadow = "none";
      } else {
        const strokeRgba = shapeColorToRgba(
          normalizedStrokeColor,
          normalizedStrokeOpacity,
          defaultShapeStrokeColor
        );
        fillNode.style.border = `${normalizedStrokeWidth}px solid ${strokeRgba}`;
        fillNode.style.boxShadow = `inset 0 0 0 ${normalizedStrokeWidth}px ${strokeRgba}`;
      }
      if (isIconFrame) {
        const iconStrokeColor =
          normalizedStrokeColor === "none"
            ? "transparent"
            : shapeColorToRgba(normalizedStrokeColor, normalizedStrokeOpacity, defaultShapeStrokeColor);
        fillNode.style.color = iconStrokeColor;
        fillNode.style.border = "0px solid transparent";
        fillNode.style.boxShadow = "none";
        const iconSvg = fillNode.querySelector(".fx-lucide-icon");
        if (iconSvg instanceof SVGElement) {
          iconSvg.style.strokeWidth = String(Math.max(0, normalizedStrokeWidth));
          iconSvg.style.stroke = "currentColor";
          iconSvg.style.fill = "none";
        }
      }
      fillNode.style.borderRadius = `${normalizedFillRadius}px`;
      if (shapeClipPath) {
        fillNode.style.clipPath = shapeClipPath;
      } else {
        fillNode.style.removeProperty("clip-path");
      }
      fillNode.style.boxSizing = "border-box";

      nextPages[resolvedKey] = {
        ...targetPage,
        html: template.innerHTML
      };
      return {
        ...existing,
        pages: nextPages
      };
    });
  };

  const applyImageStyleToImageFrameInSite = (
    imageId: string,
    brightness: number,
    saturation: number,
    offsetX: number,
    offsetY: number,
    filterPreset: ImageFilterPreset
  ) => {
    setSite((existing) => {
      if (!existing) return existing;
      const nextPages = { ...existing.pages };
      const byRoute = selectedImageRoute
        ? Object.entries(nextPages).find(([, page]) => page.route === selectedImageRoute)?.[0]
        : undefined;
      const byImageId =
        Object.entries(nextPages).find(([, page]) => page.html.includes(`data-fx-id="${imageId}"`))?.[0] ??
        undefined;
      const targetKey = byRoute ?? byImageId ?? activePage;
      const targetPage = nextPages[targetKey];
      if (!targetPage) return existing;

      const template = document.createElement("template");
      template.innerHTML = targetPage.html;

      let frame: HTMLElement | null = null;
      let image: HTMLImageElement | null = null;

      const frameEl = template.content.querySelector(`.fx-image-frame[data-fx-id="${imageId}"]`);
      if (frameEl instanceof HTMLElement) {
        frame = frameEl;
        const imgEl = frame.querySelector("img");
        if (imgEl instanceof HTMLImageElement) {
          image = imgEl;
        }
      } else {
        const rawImgEl = template.content.querySelector(`img[data-fx-id="${imageId}"]`);
        if (rawImgEl instanceof HTMLImageElement) {
          image = rawImgEl;
          // For raw images, we apply styles directly to the img tag
          frame = rawImgEl;
        }
      }

      if (!frame || !image) return existing;

      const normalizedBrightness = normalizeImageIntensity(brightness);
      const normalizedSaturation = normalizeImageIntensity(saturation);
      const normalizedOffsetX = normalizeImageOffset(offsetX);
      const normalizedOffsetY = normalizeImageOffset(offsetY);
      const normalizedFilterPreset = normalizeImageFilterPreset(filterPreset);
      const objectPositionX = Math.max(0, Math.min(100, 50 + normalizedOffsetX));
      const objectPositionY = Math.max(0, Math.min(100, 50 + normalizedOffsetY));
      frame.dataset.fxBrightness = String(normalizedBrightness);
      frame.dataset.fxSaturation = String(normalizedSaturation);
      frame.dataset.fxImageX = String(normalizedOffsetX);
      frame.dataset.fxImageY = String(normalizedOffsetY);
      frame.dataset.fxFilterPreset = normalizedFilterPreset;
      image.dataset.fxBrightness = String(normalizedBrightness);
      image.dataset.fxSaturation = String(normalizedSaturation);
      image.dataset.fxImageX = String(normalizedOffsetX);
      image.dataset.fxImageY = String(normalizedOffsetY);
      image.dataset.fxFilterPreset = normalizedFilterPreset;
      image.style.filter = buildImageFilterValue(
        normalizedFilterPreset,
        normalizedBrightness,
        normalizedSaturation
      );
      image.style.objectPosition = `${objectPositionX}% ${objectPositionY}%`;

      nextPages[targetKey] = {
        ...targetPage,
        html: template.innerHTML
      };
      return {
        ...existing,
        pages: nextPages
      };
    });
  };

  const sanitizeRuntimeCanvasMarkers = (rawHtml: string): string => {
    const template = document.createElement("template");
    template.innerHTML = rawHtml;
    template.content.querySelectorAll("[data-fx-bound]").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.removeAttribute("data-fx-bound");
    });
    template.content.querySelectorAll(".fx-selected").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.classList.remove("fx-selected");
    });
    template.content
      .querySelectorAll(".fx-image-frame.is-active,.fx-text-frame.is-active")
      .forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.classList.remove("is-active");
      });
    return template.innerHTML;
  };

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const applyResolvedFonts = (resolved: ResolvedSystemFonts) => {
      setFontCatalog(resolved.fonts);
      setCharacterFontFamily((currentFamily) => {
        const nextFamily = resolved.fonts.some((entry) => entry.family === currentFamily)
          ? currentFamily
          : resolved.defaultFamily;
        const nextWeights =
          resolved.fonts.find((entry) => entry.family === nextFamily)?.weights ??
          fallbackSystemFonts[0]?.weights ??
          [];
        setCharacterFontWeight((currentWeight) =>
          nextWeights.some((weight) => weight.value === currentWeight)
            ? currentWeight
            : (nextWeights[0]?.value ?? defaultFontWeight)
        );
        return nextFamily;
      });
    };

    const loadSystemFonts = async () => {
      if (sharedSystemFonts) {
        if (!cancelled) applyResolvedFonts(sharedSystemFonts);
        return;
      }
      const resolved = await loadSharedSystemFonts();
      if (cancelled || !resolved) return;
      applyResolvedFonts(resolved);
    };

    void loadSystemFonts();
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!isMagXStudioWorkspace) return;
    if (typeof window === "undefined") return;
    if (kind === "pages") {
      setActiveSlidesTool("select");
      return;
    }
    const storedTool = window.localStorage.getItem(`magx:last-tool:${kind}`) as SlidesToolId | null;
    if (!storedTool) return;
    if (storedTool === "upload" || storedTool === "magic" || storedTool === "icons") {
      setActiveSlidesTool("select");
      return;
    }
    if (!isToolAvailableForWorkspace(storedTool)) return;
    setActiveSlidesTool(storedTool);
  }, [isMagXStudioWorkspace, kind]);

  useEffect(() => {
    if (!isMagXStudioWorkspace) return;
    if (typeof window === "undefined") return;
    if (!isToolAvailableForWorkspace(activeSlidesTool)) return;
    window.localStorage.setItem(`magx:last-tool:${kind}`, activeSlidesTool);
  }, [activeSlidesTool, isMagXStudioWorkspace, kind]);

  useEffect(() => {
    if (!isMagXStudioWorkspace || !site) {
      setCanvasColor(defaultCanvasColor);
      return;
    }
    const fallbackKey = Object.keys(site.pages)[0];
    const resolvedPage = site.pages[activePage] ?? (fallbackKey ? site.pages[fallbackKey] : undefined);
    if (!resolvedPage) {
      setCanvasColor(defaultCanvasColor);
      return;
    }
    setCanvasColor(extractCanvasColorFromCss(resolvedPage.css));
  }, [activePage, isMagXStudioWorkspace, site]);

  useEffect(() => {
    if (!showCanvasColorPicker) return;
    const onPointerDown = (event: PointerEvent) => {
      const popover = canvasColorPopoverRef.current;
      if (!popover) return;
      const target = event.target;
      if (target instanceof Node && popover.contains(target)) return;
      setShowCanvasColorPicker(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCanvasColorPicker(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [showCanvasColorPicker]);

  const createBlankSlidePage = (route: string, title: string): GeneratedSiteContract["pages"][string] => ({
    route,
    seo: {
      title,
      description: title
    },
    html: "<main></main>",
    css: upsertCanvasColorOverride(
      "html,body{margin:0;width:100%;height:100%;} body[data-preview-workspace^='slides'],body[data-preview-workspace^='pages']{background:#ffffff !important;} main{position:relative;width:100%;height:100%;overflow:hidden;}",
      defaultCanvasColor
    ),
    previewImage: undefined
  });

  const buildBlankSlideSite = (existing?: GeneratedSiteContract | null): GeneratedSiteContract => {
    if (existing) return existing;
    return {
      designBrief: {
        brandVibe: "Presentation workspace",
        audience: "General audience",
        tone: "Clear and concise",
        visualDirection: "Slide-first canvas workflow",
        pageIA: { "slide-1": ["slide"] }
      },
      inspirationSources: [],
      designSystem: {
        colors: {
          background: "#0f1012",
          text: "#ffffff",
          primary: "#ffffff",
          secondary: "#9ca3af"
        },
        type: {
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          scale: {
            h1: "56px",
            body: "18px"
          }
        },
        radii: {
          sm: "4px",
          md: "8px",
          lg: "12px"
        },
        spacing: {
          sectionY: "48px",
          container: "1200px"
        }
      },
      pages: {
        "slide-1": createBlankSlidePage("/", slideTitleTemplatesByDeckType[presentationDeckType][0] ?? "Cover")
      }
    };
  };

  const getNextSlideIndex = (pages: GeneratedSiteContract["pages"]): number => {
    let maxIndex = 0;
    for (const key of Object.keys(pages)) {
      const match = key.match(/^slide-(\d+)$/i);
      const parsed = match ? Number.parseInt(match[1] ?? "0", 10) : 0;
      if (Number.isFinite(parsed) && parsed > maxIndex) maxIndex = parsed;
    }
    return maxIndex + 1;
  };

  const nextSlideTitle = (slideIndexOneBased: number): string => {
    const template = slideTitleTemplatesByDeckType[presentationDeckType] ?? slideTitleTemplatesByDeckType.pitch;
    const candidate = template[slideIndexOneBased - 1];
    return candidate || `Slide ${slideIndexOneBased}`;
  };

  const buildBlankPagesSite = (existing?: GeneratedSiteContract | null): GeneratedSiteContract => {
    const base = existing ? { ...existing, pages: { ...existing.pages } } : buildBlankSlideSite(existing);
    const existingEntries =
      base.pages && Object.keys(base.pages).length > 0
        ? Object.entries(base.pages)
          .filter(([, page]) => Boolean(page))
          .sort((left, right) => {
            const leftRoute = left[1]?.route || "/";
            const rightRoute = right[1]?.route || "/";
            if (leftRoute === "/") return -1;
            if (rightRoute === "/") return 1;
            return leftRoute.localeCompare(rightRoute, undefined, { numeric: true });
          })
        : [];
    const normalizedPages =
      existingEntries.length > 0
        ? existingEntries.reduce<GeneratedSiteContract["pages"]>((acc, [, page], index) => {
          const key = `page-${index + 1}`;
          const route = index === 0 ? "/" : `/page-${index + 1}`;
          acc[key] = {
            ...page,
            route,
            seo: {
              title: page.seo?.title || `Page ${index + 1}`,
              description: page.seo?.description || page.seo?.title || `Page ${index + 1}`
            }
          };
          return acc;
        }, {})
        : null;
    return {
      ...base,
      pages:
        normalizedPages ??
        {
          "page-1": createBlankSlidePage("/", "Page 1")
        }
    };
  };

  const getNextPageIndex = (pages: GeneratedSiteContract["pages"]): number => {
    let maxIndex = 0;
    for (const key of Object.keys(pages)) {
      const match = key.match(/^page-(\d+)$/i);
      const parsed = match ? Number.parseInt(match[1] ?? "0", 10) : 0;
      if (Number.isFinite(parsed) && parsed > maxIndex) maxIndex = parsed;
    }
    return maxIndex + 1;
  };

  const appendPage = () => {
    if (!isPagesWorkspace) return;
    const base = buildBlankPagesSite(site);
    const nextPages = { ...base.pages };
    const nextIndex = getNextPageIndex(nextPages);
    const nextKey = `page-${nextIndex}`;
    const nextRoute = nextIndex === 1 ? "/" : `/page-${nextIndex}`;
    nextPages[nextKey] = createBlankSlidePage(nextRoute, `Page ${nextIndex}`);
    setSite({
      ...base,
      pages: nextPages
    });
    setActivePage(nextKey);
  };

  const appendSlidePage = () => {
    if (!isSlidesWorkspace) return;
    const base = buildBlankSlideSite(site);
    const nextPages = { ...base.pages };
    const nextIndex = getNextSlideIndex(nextPages);
    const nextKey = `slide-${nextIndex}`;
    const nextRoute = nextIndex === 1 ? "/" : `/slide-${nextIndex}`;
    nextPages[nextKey] = createBlankSlidePage(nextRoute, nextSlideTitle(nextIndex));
    setSite({
      ...base,
      pages: nextPages
    });
    setActivePage(nextKey);
  };

  const deleteSlidePage = (pageKey: string) => {
    if (!site || !isMagXStudioWorkspace) return;
    const nextPages = { ...site.pages };
    delete nextPages[pageKey];

    const remainingKeys = Object.keys(nextPages);
    if (remainingKeys.length === 0) {
      const blank = isSlidesWorkspace ? buildBlankSlideSite() : buildBlankPagesSite();
      setSite(blank);
      setActivePage(isSlidesWorkspace ? "slide-1" : "page-1");
      return;
    }

    setSite({
      ...site,
      pages: nextPages
    });

    if (activePage === pageKey) {
      setActivePage(remainingKeys[0] ?? "slide-1");
    }
  };

  const addReferenceImagesFromFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const allowed = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 14);
    const MAX_IMAGE_SIZE = 1024;
    const COMPRESSION_QUALITY = 0.8;
    const mapped = await Promise.all(
      allowed.map(
        (file) =>
          new Promise<ReferenceImageInput>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                  if (width > MAX_IMAGE_SIZE) {
                    height = Math.round((height * MAX_IMAGE_SIZE) / width);
                    width = MAX_IMAGE_SIZE;
                  }
                } else {
                  if (height > MAX_IMAGE_SIZE) {
                    width = Math.round((width * MAX_IMAGE_SIZE) / height);
                    height = MAX_IMAGE_SIZE;
                  }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  reject(new Error("Failed to get canvas context"));
                  return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL("image/jpeg", COMPRESSION_QUALITY);
                const base64 = dataUrl.split(",")[1] ?? "";
                if (!base64) {
                  reject(new Error(`Failed to load image: ${file.name}`));
                  return;
                }
                resolve({
                  name: file.name,
                  mimeType: "image/jpeg",
                  data: base64
                });
              };
              img.onerror = () => reject(new Error(`Failed to parse image: ${file.name}`));
              img.src = String(e.target?.result ?? "");
            };
            reader.onerror = () => reject(new Error(`Failed to read image: ${file.name}`));
            reader.readAsDataURL(file);
          })
      )
    );
    addReferenceImages(mapped);
  };

  const ensureCanvasObjectCss = (css: string): string => {
    let nextCss = css;
    if (!nextCss.includes(".fx-image-frame{")) {
      nextCss = `${nextCss}
.fx-image-frame{
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  width:min(46vw,640px);
  height:min(32vw,360px);
  overflow:visible;
  min-width:220px;
  min-height:140px;
  max-width:94%;
  max-height:92%;
  border:1px solid rgba(0,0,0,0.1);
  box-shadow:0 8px 24px rgba(0,0,0,0.16);
  background:#fff;
  cursor:move;
  touch-action:none;
}
.fx-image-frame img{
  width:100%;
  height:100%;
  display:block;
  object-fit:cover;
  user-select:none;
  pointer-events:none;
}
.fx-image-frame .fx-handle,.fx-text-frame .fx-handle,.fx-shape-frame .fx-handle{
  position:absolute;
  width:10px;
  height:10px;
  border-radius:999px;
  background:#ffffff;
  border:1px solid rgba(0,0,0,0.35);
  box-shadow:0 1px 3px rgba(0,0,0,0.25);
  z-index:3;
  opacity:0;
  pointer-events:none;
}
.fx-image-frame .fx-handle[data-dir="nw"],.fx-text-frame .fx-handle[data-dir="nw"]{left:-5px;top:-5px;cursor:nwse-resize;}
.fx-image-frame .fx-handle[data-dir="ne"],.fx-text-frame .fx-handle[data-dir="ne"]{right:-5px;top:-5px;cursor:nesw-resize;}
.fx-image-frame .fx-handle[data-dir="sw"],.fx-text-frame .fx-handle[data-dir="sw"]{left:-5px;bottom:-5px;cursor:nesw-resize;}
.fx-image-frame .fx-handle[data-dir="se"],.fx-text-frame .fx-handle[data-dir="se"]{right:-5px;bottom:-5px;cursor:nwse-resize;}
.fx-image-frame.is-active,.fx-text-frame.is-active{
  outline:1px solid rgba(99, 102, 241, 0.7);
  outline-offset:0;
}
.fx-image-frame.is-active .fx-handle,.fx-image-frame.fx-selected .fx-handle,.fx-text-frame.is-active .fx-handle,.fx-text-frame.fx-selected .fx-handle,.fx-shape-frame.is-active .fx-handle,.fx-shape-frame.fx-selected .fx-handle{
  opacity:1;
  pointer-events:auto;
}`;
    }
    if (!nextCss.includes(".fx-text-frame{")) {
      nextCss = `${nextCss}
.fx-text-frame{
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  width:min(42vw,560px);
  min-width:180px;
  min-height:68px;
  max-width:94%;
  max-height:92%;
  padding:8px 10px;
  border:1px dashed transparent;
  background:transparent;
  cursor:move;
  touch-action:none;
}
.fx-text-content{
  width:100%;
  height:100%;
  min-height:52px;
  outline:none;
  border:0;
  color:${defaultTextColor};
  font-family:${defaultSystemFont},Arial,sans-serif;
  font-weight:${defaultFontWeight};
  font-size:${defaultFontSizePt}pt;
  line-height:${Number.parseFloat(defaultLineHeight) / 100};
  word-spacing:${defaultWordSpacing}px;
  letter-spacing:${defaultCharacterSpacing}px;
  white-space:pre-wrap;
  overflow-wrap:anywhere;
  cursor:text;
}
.fx-text-content .fx-text-list{
  margin:0;
  padding-inline-start:1.25em;
}
.fx-text-content .fx-text-list li{
  margin:0;
}
.fx-text-frame .fx-handle{
  opacity:0;
  pointer-events:none;
}
.fx-text-frame.is-active .fx-handle,.fx-text-frame.fx-selected .fx-handle{
  opacity:1;
  pointer-events:auto;
}
.fx-text-frame.is-active,.fx-text-frame.fx-selected{
  border-color:rgba(99,102,241,0.55);
}`;
    }
    if (!nextCss.includes(".fx-shape-frame{")) {
      nextCss = `${nextCss}
.fx-shape-frame{
  background:transparent;
  border:0;
  box-shadow:none;
  overflow:visible;
  min-width:0;
  min-height:0;
}
.fx-shape-frame .fx-shape-fill{
  width:100%;
  height:100%;
  background:#9ca3af;
  border:${defaultShapeStrokeWidthPx}px solid ${defaultShapeStrokeColor};
  box-sizing:border-box;
  box-shadow:none;
  pointer-events:none;
}
.fx-shape-frame[data-fx-shape="rounded-rectangle"] .fx-shape-fill{
  border-radius:20px;
}
.fx-shape-frame[data-fx-shape="circle"] .fx-shape-fill{
  border-radius:999px;
}
.fx-shape-frame[data-fx-shape="triangle"] .fx-shape-fill{
  clip-path:polygon(50% 0%,0% 100%,100% 100%);
}
.fx-shape-frame[data-fx-shape="diamond"] .fx-shape-fill{
  clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);
}
.fx-shape-frame[data-fx-shape="polygon"] .fx-shape-fill{
  clip-path:polygon(50% 0%,97.553% 34.549%,79.389% 90.451%,20.611% 90.451%,2.447% 34.549%);
}
.fx-shape-frame[data-fx-shape="star"] .fx-shape-fill{
  clip-path:polygon(50% 0%,62.343% 33.011%,97.553% 34.549%,69.972% 56.489%,79.389% 90.451%,50% 69%,20.611% 90.451%,30.028% 56.489%,2.447% 34.549%,37.657% 33.011%);
}`;
    }
    if (!nextCss.includes("/* fx-shape-flat-fill */")) {
      nextCss = `${nextCss}
/* fx-shape-flat-fill */
.fx-shape-frame .fx-shape-fill{
  background:#9ca3af;
  border:${defaultShapeStrokeWidthPx}px solid ${defaultShapeStrokeColor};
  box-shadow:none;
}`;
    }
    if (!nextCss.includes("/* fx-shape-min-size-reset */")) {
      nextCss = `${nextCss}
/* fx-shape-min-size-reset */
.fx-shape-frame{
  min-width:0 !important;
  min-height:0 !important;
}`;
    }
    if (!nextCss.includes(".fx-icon-frame{")) {
      nextCss = `${nextCss}
.fx-icon-frame{
  background:transparent;
  border:0;
  box-shadow:none;
  overflow:visible;
  min-width:0 !important;
  min-height:0 !important;
}
.fx-icon-frame .fx-shape-fill,
.fx-icon-frame .fx-icon-wrap{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:8px;
  box-sizing:border-box;
  pointer-events:none;
  color:${defaultShapeStrokeColor};
}
.fx-icon-frame .fx-shape-fill .fx-lucide-icon,
.fx-icon-frame .fx-lucide-icon{
  width:100%;
  height:100%;
  display:block;
  stroke:currentColor;
  fill:none;
}`;
    }
    if (!nextCss.includes("/* fx-handle-visibility */")) {
      nextCss = `${nextCss}
/* fx-handle-visibility */
.fx-image-frame .fx-handle,.fx-text-frame .fx-handle,.fx-shape-frame .fx-handle{
  opacity:0;
  pointer-events:none;
}
.fx-image-frame.is-active .fx-handle,.fx-image-frame.fx-selected .fx-handle,.fx-text-frame.is-active .fx-handle,.fx-text-frame.fx-selected .fx-handle,.fx-shape-frame.is-active .fx-handle,.fx-shape-frame.fx-selected .fx-handle{
  opacity:1;
  pointer-events:auto;
}`;
    }
    if (!nextCss.includes("/* fx-image-frame-clean */")) {
      nextCss = `${nextCss}
/* fx-image-frame-clean */
.fx-image-frame{
  border:0 !important;
  box-shadow:none !important;
  background:transparent !important;
}
.fx-image-frame img{
  box-shadow:none !important;
}
.fx-image-frame[data-fx-image-source="generated"] img{
  object-fit:cover !important;
}
/* fx-image-handle-visibility */
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame)[data-fx-image-source="generated"] .fx-handle{
  opacity:0 !important;
  pointer-events:none !important;
}
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame)[data-fx-image-source="generated"].is-active .fx-handle[data-dir="se"],
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame)[data-fx-image-source="generated"].fx-selected .fx-handle[data-dir="se"]{
  opacity:1 !important;
  pointer-events:auto !important;
  width:18px !important;
  height:18px !important;
  right:0 !important;
  bottom:0 !important;
  transform:translate(50%,50%) !important;
  border:0 !important;
  border-radius:0 !important;
  background:#000000 !important;
  box-shadow:none !important;
}
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame)[data-fx-image-source="generated"] .fx-handle[data-dir="nw"],
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame)[data-fx-image-source="generated"] .fx-handle[data-dir="ne"],
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame)[data-fx-image-source="generated"] .fx-handle[data-dir="sw"]{
  display:none !important;
}
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame):not([data-fx-image-source="generated"]) .fx-handle{
  display:block !important;
  width:10px !important;
  height:10px !important;
  border-radius:999px !important;
  border:1px solid rgba(0,0,0,0.35) !important;
  background:#ffffff !important;
  box-shadow:0 1px 3px rgba(0,0,0,0.25) !important;
  transform:none !important;
  opacity:0 !important;
  pointer-events:none !important;
}
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame):not([data-fx-image-source="generated"]).is-active .fx-handle,
body:not([data-preview-static="true"]) .fx-image-frame:not(.fx-shape-frame):not([data-fx-image-source="generated"]).fx-selected .fx-handle{
  opacity:1 !important;
  pointer-events:auto !important;
}
body[data-preview-static="true"] .fx-image-frame:not(.fx-shape-frame) .fx-handle{
  opacity:0 !important;
  pointer-events:none !important;
}
/* keep text handles conditional */
.fx-text-frame .fx-handle{
  opacity:0;
  pointer-events:none;
}
.fx-text-frame.is-active .fx-handle,.fx-text-frame.fx-selected .fx-handle{
  opacity:1;
  pointer-events:auto;
}`;
    }
    if (!nextCss.includes("/* fx-image-frame-full-bleed */")) {
      nextCss = `${nextCss}
/* fx-image-frame-full-bleed */
.fx-image-frame:not(.fx-shape-frame){
  max-width:none !important;
  max-height:none !important;
}`;
    }
    return nextCss;
  };

  const insertImageIntoActiveCanvas = async (
    file: File,
    options?: {
      aspectRatio?: NanoBananaAspectRatio | null;
      source?: "upload" | "generated";
      origin?: ImageInsertOrigin;
    }
  ) => {
    if (!isMagXStudioWorkspace) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read uploaded image"));
      reader.readAsDataURL(file);
    });
    if (!dataUrl) return;

    const base = buildBlankSlideSite(site);
    const nextPages = { ...base.pages };
    const activeExists = nextPages[activePage];
    const targetKey = activeExists ? activePage : Object.keys(nextPages)[0] ?? "slide-1";
    const targetPage = nextPages[targetKey];
    if (!targetPage) return;

    const ratio = options?.aspectRatio ?? null;
    const source = options?.source ?? "upload";
    const origin = options?.origin ?? "upload";
    const imageFrameId = createImageFrameId();
    const frameSize = ratio ? getCanvasImageFrameSize(ratio) : null;
    const styleAttr = frameSize ? ` style="width:${frameSize.width}px;height:${frameSize.height}px;"` : "";
    const imageMarkup = `<div class="fx-image-frame" data-fx-id="${imageFrameId}" data-fx-image-source="${source}" data-fx-image-origin="${origin}" data-fx-brightness="${defaultImageBrightness}" data-fx-saturation="${defaultImageSaturation}" data-fx-image-x="${defaultImageOffsetX}" data-fx-image-y="${defaultImageOffsetY}" data-fx-filter-preset="${defaultImageFilterPreset}"${styleAttr}><img src="${dataUrl}" alt="Uploaded image" data-fx-image-origin="${origin}" data-fx-brightness="${defaultImageBrightness}" data-fx-saturation="${defaultImageSaturation}" data-fx-image-x="${defaultImageOffsetX}" data-fx-image-y="${defaultImageOffsetY}" data-fx-filter-preset="${defaultImageFilterPreset}" style="filter:${buildImageFilterValue(defaultImageFilterPreset, defaultImageBrightness, defaultImageSaturation)};object-position:50% 50%;" /><span class="fx-handle" data-dir="nw"></span><span class="fx-handle" data-dir="ne"></span><span class="fx-handle" data-dir="sw"></span><span class="fx-handle" data-dir="se"></span></div>`;
    let nextHtml = targetPage.html;
    if (nextHtml.includes("</main>")) {
      nextHtml = nextHtml.replace("</main>", `${imageMarkup}</main>`);
    } else {
      nextHtml = `${nextHtml}${imageMarkup}`;
    }

    nextPages[targetKey] = {
      ...targetPage,
      html: nextHtml,
      css: ensureCanvasObjectCss(targetPage.css)
    };

    setSite({
      ...base,
      pages: nextPages
    });
    setActivePage(targetKey);
    setSelectedImageSrc(dataUrl);
    setSelectedImageOrigin(origin);
    setSelectedImageFrameId(imageFrameId);
    setSelectedImageRoute(targetPage.route || "/");
    setImageBrightness(defaultImageBrightness);
    setImageSaturation(defaultImageSaturation);
    setImageOffsetX(defaultImageOffsetX);
    setImageOffsetY(defaultImageOffsetY);
    setImageFilterPreset(defaultImageFilterPreset);
    setImageStyleRequest(null);
    setIsImagePanelVisible(true);
    setActiveSlidesTool("select");
  };

  const closeVisualsMagicModal = () => {
    setShowVisualsMagicModal(false);
    setMagicGenerating(false);
    setMagicMode("text-to-image");
    setMagicPrompt(defaultVisualPrompt);
    setMagicAspectRatio("");
    setMagicSourceImage(null);
    setMagicPromptTouched(false);
    setMagicAspectTouched(false);
    setMagicSubmitAttempted(false);
    if (magicSourceUploadInputRef.current) {
      magicSourceUploadInputRef.current.value = "";
    }
    setActiveSlidesTool("select");
  };

  const closePagesGenerationModal = () => {
    setShowPagesGenerationModal(false);
    setMagicGenerating(false);
    setMagicMode("text-to-image");
    setMagicPrompt(defaultVisualPrompt);
    setMagicAspectRatio("");
    setMagicSourceImage(null);
    setMagicPromptTouched(false);
    setMagicAspectTouched(false);
    setMagicSubmitAttempted(false);
    if (magicSourceUploadInputRef.current) {
      magicSourceUploadInputRef.current.value = "";
    }
    setPagesDesignerTopic(defaultPagesDesignerTopic);
    setPagesDesignerContentType(defaultPagesDesignerContentType);
    setPagesDesignerSubmitAttempted(false);
    setActiveSlidesTool("select");
  };

  const closeImageEditModal = () => {
    setShowImageEditModal(false);
    setMagicGenerating(false);
    setMagicMode("text-to-image");
    setMagicPrompt(defaultVisualPrompt);
    setMagicAspectRatio("");
    setMagicSourceImage(null);
    setMagicPromptTouched(false);
    setMagicAspectTouched(false);
    setMagicSubmitAttempted(false);
    if (magicSourceUploadInputRef.current) {
      magicSourceUploadInputRef.current.value = "";
    }
    setActiveSlidesTool("select");
  };

  const handleMagicSourceUpload = async (file: File | null) => {
    if (!file) return;
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read source image"));
      reader.readAsDataURL(file);
    });
    setMagicSourceImage(dataUri || null);
  };

  const insertGeneratedDataUriIntoCanvas = async (
    dataUri: string,
    name: string,
    options?: { aspectRatio?: NanoBananaAspectRatio | null; origin?: ImageInsertOrigin }
  ) => {
    const [meta, data = ""] = dataUri.split(",");
    const mimeType = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png";
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const ext =
      mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
    const safeName = name.includes(".") ? name : `${name}.${ext}`;
    const file = new File([bytes], safeName, { type: mimeType });
    await insertImageIntoActiveCanvas(file, {
      ...options,
      source: "upload",
      origin: options?.origin ?? "generated"
    });
  };

  const generateMagicVisualAndInsert = async () => {
    if (!isMagXStudioWorkspace) return;
    if (!canGenerateMagicVisual) {
      setMagicSubmitAttempted(true);
      return;
    }
    setError(null);
    setMagicSubmitAttempted(true);
    setMagicGenerating(true);
    try {
      const mappedAspectRatio = magicAspectRatio
        ? magicAspectRatioToApi[magicAspectRatio]
        : undefined;
      if (!mappedAspectRatio) {
        throw new Error("Aspect ratio is required");
      }
      const response = await fetch("/api/generate-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: magicMode,
          prompt: magicPrompt,
          aspectRatio: mappedAspectRatio,
          size: defaultMagicResolution,
          theme: magicTheme,
          sourceImageDataUri: magicMode === "image-to-image" ? magicSourceImage : null
        })
      });
      const json = (await response.json()) as { error?: string; details?: string; imageDataUri?: string };
      if (!response.ok || !json.imageDataUri) {
        throw new Error([json.error || "Image generation failed", json.details].filter(Boolean).join(": "));
      }
      await insertGeneratedDataUriIntoCanvas(json.imageDataUri, "visual-magic", {
        aspectRatio: mappedAspectRatio,
        origin: showImageEditModal || magicMode === "image-to-image" ? "edited" : "generated"
      });
      if (showImageEditModal) {
        closeImageEditModal();
      } else if (showPagesGenerationModal) {
        closePagesGenerationModal();
      } else {
        closeVisualsMagicModal();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown image generation error");
    } finally {
      setMagicGenerating(false);
    }
  };

  const resolvePagesCanvasDimensions = (): { width: number; height: number } => {
    if (
      isPagesWorkspace &&
      pagesCanvasSize === "Custom" &&
      resolvedCustomCanvasSize &&
      resolvedCustomCanvasSize.width > 0 &&
      resolvedCustomCanvasSize.height > 0
    ) {
      return {
        width: resolvedCustomCanvasSize.width,
        height: resolvedCustomCanvasSize.height
      };
    }
    return pagesCanvasAreaByFormat[pagesCanvasSize];
  };

  const estimatePagesAreaScale = (): number => {
    const dims = resolvePagesCanvasDimensions();
    const area = dims.width * dims.height;
    return Math.max(0.45, Math.min(3.2, area / letterPageArea));
  };

  const buildPagedDesignerHtml = ({
    title,
    subtitle,
    summary,
    sections,
    images,
    imagePrompts,
    pageIndex,
    totalPages
  }: {
    title: string;
    subtitle: string;
    summary: string;
    sections: Array<{ heading: string; body: string; bullets: string[] }>;
    images: string[];
    imagePrompts: string[];
    pageIndex: number;
    totalPages: number;
  }): string => {
    const sectionBlocks = sections
      .map((section) => {
        const bullets =
          section.bullets.length > 0
            ? `<ul>${section.bullets.map((item) => `<li>${escapeHtmlText(item)}</li>`).join("")}</ul>`
            : "";
        return `<section class="pd-section">
  <h2>${escapeHtmlText(section.heading)}</h2>
  ${section.body ? `<p>${escapeHtmlText(section.body)}</p>` : ""}
  ${bullets}
</section>`;
      })
      .join("");

    const imageBlocks =
      pageIndex === 0
        ? images
          .map(
            (image, index) =>
              `<figure class="pd-figure"><img src="${image}" alt="${escapeHtmlText(
                imagePrompts[index] || "Supporting image"
              )}" /></figure>`
          )
          .join("")
        : "";

    return `<main class="page-designer-doc">
  <article class="pd-shell">
    <header class="pd-header">
      <p class="pd-kicker">Page Designer Draft • ${pageIndex + 1}/${totalPages}</p>
      ${pageIndex === 0 ? `<h1>${escapeHtmlText(title)}</h1>` : `<h1>${escapeHtmlText(`${title} (Continued)`)}</h1>`}
      ${pageIndex === 0 ? `<p class="pd-subtitle">${escapeHtmlText(subtitle)}</p>` : ""}
      ${pageIndex === 0 ? `<p class="pd-summary">${escapeHtmlText(summary)}</p>` : ""}
    </header>
    ${imageBlocks ? `<section class="pd-images">${imageBlocks}</section>` : ""}
    <section class="pd-content">${sectionBlocks || '<section class="pd-section"><p>Content continues.</p></section>'}</section>
  </article>
</main>`;
  };

  const doesPagedDesignerHtmlOverflow = (html: string, css: string): boolean => {
    if (typeof document === "undefined") return false;
    const dims = resolvePagesCanvasDimensions();
    const safeWidth = Math.max(1, dims.width);
    const safeHeight = Math.max(1, dims.height);
    const measurementHeight = 1100;
    const measurementWidth = Math.max(
      760,
      Math.round(measurementHeight * (safeWidth / safeHeight))
    );

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-20000px";
    host.style.top = "0";
    host.style.width = `${measurementWidth}px`;
    host.style.height = `${measurementHeight}px`;
    host.style.visibility = "hidden";
    host.style.pointerEvents = "none";
    host.style.overflow = "hidden";
    host.style.zIndex = "-1";
    const root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `<style>${css}</style>${html}`;
    document.body.appendChild(host);
    try {
      const main = root.querySelector("main.page-designer-doc");
      const shell = root.querySelector(".pd-shell");
      if (!(main instanceof HTMLElement) || !(shell instanceof HTMLElement)) return false;
      return shell.scrollHeight > main.clientHeight + 1;
    } finally {
      host.remove();
    }
  };

  const pagesTextFrameBaseCss = `
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#ffffff;}
main.page-designer-flow{position:relative;width:100%;height:100%;overflow:hidden;background:#ffffff;color:#111318;}
.pd-meta{position:absolute;left:5%;top:3.4%;font:600 11px/1.2 "Helvetica Neue",Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;}
.pd-head{position:absolute;left:5%;right:5%;top:7.2%;overflow:hidden;}
.pd-head h1{margin:0 0 8px;font:700 40px/1.08 "Helvetica Neue",Arial,sans-serif;color:#111318;}
.pd-head p{margin:0 0 8px;font:400 15px/1.42 "Helvetica Neue",Arial,sans-serif;color:#2b2f36;}
.fx-text-frame{position:absolute;border:1px dashed transparent;background:transparent;overflow:hidden;}
.fx-text-content{width:100%;height:100%;overflow:hidden;padding:8px 10px;outline:none;font-family:"Helvetica Neue",Arial,sans-serif;color:#111318;line-height:1.35;word-break:break-word;}
.fx-text-content[data-cols="2"]{column-count:2;column-gap:28px;column-fill:auto;}
.fx-text-content h2{margin:0 0 8px;font-size:22px;line-height:1.2;font-weight:700;break-inside:avoid;}
.fx-text-content p{margin:0 0 10px;font-size:15px;line-height:1.5;break-inside:avoid;}
.fx-text-content ul{margin:0 0 10px;padding-left:18px;}
.fx-text-content li{margin:0 0 6px;font-size:14px;line-height:1.45;break-inside:avoid;}
`;

  type FlowBlock = { kind: "h2" | "p" | "li"; text: string };
  const renderFlowBlock = (block: FlowBlock): string => {
    if (block.kind === "h2") return `<h2>${escapeHtmlText(block.text)}</h2>`;
    if (block.kind === "li") return `<ul><li>${escapeHtmlText(block.text)}</li></ul>`;
    return `<p>${escapeHtmlText(block.text)}</p>`;
  };

  const splitFlowBlock = (block: FlowBlock): [FlowBlock, FlowBlock] | null => {
    if (block.kind === "h2") return null;
    const words = block.text
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (words.length < 14) return null;
    const midpoint = Math.max(6, Math.floor(words.length / 2));
    return [
      { ...block, text: words.slice(0, midpoint).join(" ") },
      { ...block, text: words.slice(midpoint).join(" ") }
    ];
  };

  const buildTextFrameFlowPageHtml = ({
    title,
    subtitle,
    summary,
    pageIndex,
    totalPages,
    preset,
    frameContent
  }: {
    title: string;
    subtitle: string;
    summary: string;
    pageIndex: number;
    totalPages: number;
    preset: "1-col" | "2-col";
    frameContent: string;
  }): string => {
    const headerMarkup =
      pageIndex === 0
        ? `<header class="pd-head"><h1>${escapeHtmlText(title)}</h1><p>${escapeHtmlText(subtitle)}</p><p>${escapeHtmlText(summary)}</p></header>`
        : "";
    const frameTop = pageIndex === 0 ? 24 : 7;
    const frameHeight = pageIndex === 0 ? 70 : 87;
    const cols = preset === "2-col" ? "2" : "1";
    return `<main class="page-designer-flow"><p class="pd-meta">Page ${pageIndex + 1} / ${totalPages}</p>${headerMarkup}<div class="fx-text-frame" data-fx-id="pd-frame-${pageIndex + 1}-body" style="left:5%;top:${frameTop}%;width:90%;height:${frameHeight}%;"><div class="fx-text-content" data-cols="${cols}" data-frame-key="body" data-fx-font-family="Helvetica" data-fx-font-weight="400" data-fx-font-size="16" data-fx-text-color="#101114" data-fx-text-decoration-style="none" data-fx-text-align="left" data-fx-line-height="135" data-fx-word-spacing="0" data-fx-character-spacing="0" data-fx-bullet-list-style="none" data-fx-numbered-list-style="none" style="font-family:Helvetica,Arial,sans-serif;font-weight:400;font-size:16pt;color:#101114;line-height:1.35;word-spacing:0px;letter-spacing:0px;" contenteditable="true" spellcheck="false">${frameContent || "<p></p>"}</div><span class="fx-handle" data-dir="nw"></span><span class="fx-handle" data-dir="ne"></span><span class="fx-handle" data-dir="sw"></span><span class="fx-handle" data-dir="se"></span></div></main>`;
  };

  const generatePagesDesignAndInsert = async () => {
    if (!isPagesWorkspace) return;
    const topic = pagesDesignerTopic.trim();
    if (!topic || topic.length < 8) {
      setPagesDesignerSubmitAttempted(true);
      return;
    }

    setError(null);
    setPagesDesignerSubmitAttempted(true);
    setMagicGenerating(true);
    let requestTimeout: number | null = null;
    try {
      const controller = new AbortController();
      requestTimeout = window.setTimeout(() => controller.abort(), 45000);
      const response = await fetch("/api/generate-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          contentType: pagesDesignerContentType,
          pageSize: pagesCanvasSize,
          customWidth: resolvedCustomCanvasSize?.width ?? null,
          customHeight: resolvedCustomCanvasSize?.height ?? null
        }),
        signal: controller.signal
      });
      if (requestTimeout !== null) {
        window.clearTimeout(requestTimeout);
        requestTimeout = null;
      }

      const json = (await response.json()) as {
        error?: string;
        details?: string;
        data?: {
          title?: string;
          subtitle?: string;
          summary?: string;
          sections?: Array<{ heading?: string; body?: string; bullets?: string[] }>;
          imagePrompts?: string[];
          images?: string[];
          html?: string;
          css?: string;
        };
      };

      if (!response.ok || !json.data?.html || !json.data?.css) {
        throw new Error([json.error || "Pages generation failed", json.details].filter(Boolean).join(": "));
      }

      const normalizedSections = (json.data.sections ?? [])
        .map((section) => ({
          heading: String(section.heading || "").trim(),
          body: String(section.body || "").trim(),
          bullets: (section.bullets ?? [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
            .slice(0, 6)
        }))
        .filter((section) => section.heading || section.body || section.bullets.length > 0);
      const title = String(json.data.title || "Generated Document").trim() || "Generated Document";
      const subtitle = String(json.data.subtitle || "Structured editorial draft").trim();
      const summary =
        String(json.data.summary || "A concise, structured draft generated for this topic.").trim();
      const imagePrompts = (json.data.imagePrompts ?? [])
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 2);
      const images = (json.data.images ?? [])
        .map((item) => String(item || "").trim())
        .filter((item) => item.startsWith("data:image/"));

      // Keep Pages behavior aligned with Slides: apply generated output directly to the active page.
      const base = buildBlankPagesSite(site);
      const nextPages = { ...base.pages };
      const fallbackKey = Object.keys(nextPages)[0] ?? "page-1";
      const targetKey = nextPages[activePage] ? activePage : fallbackKey;
      const targetPage = nextPages[targetKey];
      if (!targetPage) {
        throw new Error("No target page available for insertion");
      }

      nextPages[targetKey] = {
        ...targetPage,
        seo: {
          title: title || targetPage.seo.title,
          description: subtitle || summary || targetPage.seo.description
        },
        html: json.data.html,
        css: upsertCanvasColorOverride(json.data.css, canvasColor)
      };

      setSite({
        ...base,
        pages: nextPages
      });
      setActivePage(targetKey);
      closePagesGenerationModal();
      return;

    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unknown pages generation error";
      setError(
        message.toLowerCase().includes("aborted")
          ? "Page generation timed out. Please retry."
          : message
      );
    } finally {
      if (requestTimeout !== null) {
        window.clearTimeout(requestTimeout);
      }
      setMagicGenerating(false);
    }
  };

  const insertShapeIntoActiveCanvas = (
    shapeId: ShapeInsertId
  ): { shapeFrameId: string; route: string } | null => {
    if (!isMagXStudioWorkspace) return null;
    const shape = commonShapeOptions.find((option) => option.id === shapeId);
    if (!shape) return null;

    const base = buildBlankSlideSite(site);
    const nextPages = { ...base.pages };
    const activeExists = nextPages[activePage];
    const targetKey = activeExists ? activePage : Object.keys(nextPages)[0] ?? "slide-1";
    const targetPage = nextPages[targetKey];
    if (!targetPage) return null;

    const shapeFrameId = createShapeFrameId();
    const defaultShapeRadius = getDefaultShapeRadiusById(shape.id);
    const defaultShapeSides = getDefaultShapeSidesById(shape.id);
    const defaultShapeClipPath = getShapeClipPath(shape.id, defaultShapeSides);
    const shapeClipPathStyle = defaultShapeClipPath ? `clip-path:${defaultShapeClipPath};` : "";
    const shapeMarkup = `<div class="fx-image-frame fx-shape-frame" data-fx-id="${shapeFrameId}" data-fx-shape="${shape.id}" data-fx-fill-mode="${defaultShapeFillMode}" data-fx-fill="${defaultShapeFillColor}" data-fx-fill-gradient-start="${defaultShapeGradientStartColor}" data-fx-fill-gradient-end="${defaultShapeGradientEndColor}" data-fx-fill-gradient-angle="${defaultShapeGradientAngle}" data-fx-fill-image="" data-fx-fill-image-x="${defaultShapeImageOffsetX}" data-fx-fill-image-y="${defaultShapeImageOffsetY}" data-fx-stroke="${defaultShapeStrokeColor}" data-fx-stroke-width="${defaultShapeStrokeWidthPx}" data-fx-fill-opacity="${defaultShapeOpacity}" data-fx-shape-sides="${defaultShapeSides}" data-fx-fill-radius="${defaultShapeRadius}" data-fx-rotation="${defaultShapeRotation}" data-fx-stroke-opacity="${defaultShapeOpacity}" style="width:${shape.width}px;height:${shape.height}px;"><div class="fx-shape-fill" data-fx-fill-mode="${defaultShapeFillMode}" data-fx-fill="${defaultShapeFillColor}" data-fx-fill-gradient-start="${defaultShapeGradientStartColor}" data-fx-fill-gradient-end="${defaultShapeGradientEndColor}" data-fx-fill-gradient-angle="${defaultShapeGradientAngle}" data-fx-fill-image="" data-fx-fill-image-x="${defaultShapeImageOffsetX}" data-fx-fill-image-y="${defaultShapeImageOffsetY}" data-fx-stroke="${defaultShapeStrokeColor}" data-fx-fill-opacity="${defaultShapeOpacity}" data-fx-shape-sides="${defaultShapeSides}" data-fx-fill-radius="${defaultShapeRadius}" data-fx-rotation="${defaultShapeRotation}" data-fx-stroke-opacity="${defaultShapeOpacity}" aria-hidden="true" style="background:${defaultShapeFillColor};border:${defaultShapeStrokeWidthPx}px solid ${defaultShapeStrokeColor};border-radius:${defaultShapeRadius}px;transform:rotate(${defaultShapeRotation}deg);transform-origin:center center;${shapeClipPathStyle}box-sizing:border-box;"></div><span class="fx-handle" data-dir="nw"></span><span class="fx-handle" data-dir="ne"></span><span class="fx-handle" data-dir="sw"></span><span class="fx-handle" data-dir="se"></span></div>`;
    let nextHtml = targetPage.html;
    if (nextHtml.includes("</main>")) {
      nextHtml = nextHtml.replace("</main>", `${shapeMarkup}</main>`);
    } else {
      nextHtml = `${nextHtml}${shapeMarkup}`;
    }

    nextPages[targetKey] = {
      ...targetPage,
      html: nextHtml,
      css: ensureCanvasObjectCss(targetPage.css)
    };

    setSite({
      ...base,
      pages: nextPages
    });
    setActivePage(targetKey);
    return { shapeFrameId, route: targetPage.route || "/" };
  };

  const insertIconIntoActiveCanvas = async (
    iconName: IconName
  ): Promise<{ iconFrameId: string; route: string } | null> => {
    if (!isMagXStudioWorkspace) return null;
    const iconSvgMarkup = await buildLucideSvgMarkup(iconName);
    if (!iconSvgMarkup) return null;

    const base = buildBlankSlideSite(site);
    const nextPages = { ...base.pages };
    const activeExists = nextPages[activePage];
    const targetKey = activeExists ? activePage : Object.keys(nextPages)[0] ?? "slide-1";
    const targetPage = nextPages[targetKey];
    if (!targetPage) return null;

    const iconFrameId = createIconFrameId();
    const safeIconName = escapeHtmlAttribute(iconName);
    const iconMarkup = `<div class="fx-image-frame fx-shape-frame fx-icon-frame" data-fx-id="${iconFrameId}" data-fx-shape="icon" data-fx-icon="${safeIconName}" data-fx-fill-mode="${defaultShapeFillMode}" data-fx-fill="${defaultIconFillColor}" data-fx-fill-gradient-start="${defaultShapeGradientStartColor}" data-fx-fill-gradient-end="${defaultShapeGradientEndColor}" data-fx-fill-gradient-angle="${defaultShapeGradientAngle}" data-fx-fill-image="" data-fx-fill-image-x="${defaultShapeImageOffsetX}" data-fx-fill-image-y="${defaultShapeImageOffsetY}" data-fx-stroke="${defaultShapeStrokeColor}" data-fx-stroke-width="${defaultShapeStrokeWidthPx}" data-fx-fill-opacity="${defaultShapeOpacity}" data-fx-shape-sides="${defaultShapePolygonSides}" data-fx-fill-radius="${defaultShapeFillRadius}" data-fx-rotation="${defaultShapeRotation}" data-fx-stroke-opacity="${defaultShapeOpacity}" style="width:${defaultIconFrameSizePx}px;height:${defaultIconFrameSizePx}px;"><div class="fx-shape-fill fx-icon-wrap" data-fx-icon="${safeIconName}" data-fx-fill-mode="${defaultShapeFillMode}" data-fx-fill="${defaultIconFillColor}" data-fx-fill-gradient-start="${defaultShapeGradientStartColor}" data-fx-fill-gradient-end="${defaultShapeGradientEndColor}" data-fx-fill-gradient-angle="${defaultShapeGradientAngle}" data-fx-fill-image="" data-fx-fill-image-x="${defaultShapeImageOffsetX}" data-fx-fill-image-y="${defaultShapeImageOffsetY}" data-fx-stroke="${defaultShapeStrokeColor}" data-fx-fill-opacity="${defaultShapeOpacity}" data-fx-shape-sides="${defaultShapePolygonSides}" data-fx-fill-radius="${defaultShapeFillRadius}" data-fx-rotation="${defaultShapeRotation}" data-fx-stroke-opacity="${defaultShapeOpacity}" aria-hidden="true" style="background:transparent;border:0;border-radius:${defaultShapeFillRadius}px;transform:rotate(${defaultShapeRotation}deg);transform-origin:center center;box-sizing:border-box;color:${defaultShapeStrokeColor};">${iconSvgMarkup}</div><span class="fx-handle" data-dir="nw"></span><span class="fx-handle" data-dir="ne"></span><span class="fx-handle" data-dir="sw"></span><span class="fx-handle" data-dir="se"></span></div>`;
    let nextHtml = targetPage.html;
    if (nextHtml.includes("</main>")) {
      nextHtml = nextHtml.replace("</main>", `${iconMarkup}</main>`);
    } else {
      nextHtml = `${nextHtml}${iconMarkup}`;
    }

    nextPages[targetKey] = {
      ...targetPage,
      html: nextHtml,
      css: ensureCanvasObjectCss(targetPage.css)
    };

    setSite({
      ...base,
      pages: nextPages
    });
    setActivePage(targetKey);
    return { iconFrameId, route: targetPage.route || "/" };
  };

  const insertTextIntoActiveCanvas = () => {
    if (!isMagXStudioWorkspace) return;
    const base = buildBlankSlideSite(site);
    const nextPages = { ...base.pages };
    const activeExists = nextPages[activePage];
    const targetKey = activeExists ? activePage : Object.keys(nextPages)[0] ?? "slide-1";
    const targetPage = nextPages[targetKey];
    if (!targetPage) return;

    const textFrameId = createTextFrameId();
    const textMarkup = `<div class="fx-text-frame" data-fx-id="${textFrameId}"><div class="fx-text-content" data-fx-font-family="${characterFontFamily}" data-fx-font-weight="${characterFontWeight}" data-fx-font-size="${characterFontSize}" data-fx-text-color="${characterTextColor}" data-fx-text-decoration-style="${characterTextDecorationStyle}" data-fx-text-align="${characterTextAlign}" data-fx-line-height="${characterLineHeight}" data-fx-word-spacing="${characterWordSpacing}" data-fx-character-spacing="${characterSpacing}" data-fx-bullet-list-style="${characterBulletListStyle}" data-fx-numbered-list-style="${characterNumberedListStyle}" style="font-family:${characterFontFamily},Arial,sans-serif;font-weight:${characterFontWeight};font-size:${characterFontSize}pt;color:${characterTextColor};font-style:${characterTextDecorationStyle === "italic" ? "italic" : "normal"};text-decoration-line:${characterTextDecorationStyle === "underline" ? "underline" : characterTextDecorationStyle === "line-through" ? "line-through" : "none"};text-align:${characterTextAlign};line-height:${Number.parseFloat(characterLineHeight) / 100};word-spacing:${characterWordSpacing}px;letter-spacing:${characterSpacing}px;" contenteditable="true" spellcheck="false">Edit text</div><span class="fx-handle" data-dir="nw"></span><span class="fx-handle" data-dir="ne"></span><span class="fx-handle" data-dir="sw"></span><span class="fx-handle" data-dir="se"></span></div>`;
    let nextHtml = targetPage.html;
    if (nextHtml.includes("</main>")) {
      nextHtml = nextHtml.replace("</main>", `${textMarkup}</main>`);
    } else {
      nextHtml = `${nextHtml}${textMarkup}`;
    }

    nextPages[targetKey] = {
      ...targetPage,
      html: nextHtml,
      css: ensureCanvasObjectCss(targetPage.css)
    };

    setSite({
      ...base,
      pages: nextPages
    });
    setActivePage(targetKey);
    setSelectedTextFrameId(textFrameId);
    setSelectedTextRoute(targetPage.route || "/");
  };

  useEffect(() => {
    if (!incomingReferenceImage) return;

    if (kind === "websites") {
      addReferenceImages([incomingReferenceImage]);
    } else if (kind === "pages") {
      // For Pages, reconstruct the full Data URI and insert it onto the canvas
      const dataUri = `data:${incomingReferenceImage.mimeType};base64,${incomingReferenceImage.data}`;
      void insertGeneratedDataUriIntoCanvas(
        dataUri,
        incomingReferenceImage.name || "visual-asset",
        { origin: "generated" }
      );
    }
  }, [kind, incomingReferenceImage, incomingReferenceImageVersion]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | {
          type?: string;
          workspaceId?: string;
          route?: string;
          src?: string;
          brightness?: number | string;
          saturation?: number | string;
          imageOffsetX?: number | string;
          imageOffsetY?: number | string;
          filterPreset?: string;
          imageOrigin?: string;
          frameId?: string;
          textId?: string;
          fontFamily?: string;
          fontWeight?: string;
          fontSize?: string;
          textColor?: string;
          textDecorationStyle?: string;
          textAlign?: string;
          lineHeight?: string;
          wordSpacing?: string;
          characterSpacing?: string;
          bulletListStyle?: string;
          numberedListStyle?: string;
          shapeId?: string;
          shapeType?: string;
          fillMode?: string;
          fillColor?: string;
          fillGradientStartColor?: string;
          fillGradientEndColor?: string;
          fillGradientAngle?: number | string;
          fillImageSrc?: string;
          fillImageOffsetX?: number | string;
          fillImageOffsetY?: number | string;
          strokeColor?: string;
          strokeWidth?: number | string;
          shapeSides?: number | string;
          fillOpacity?: number | string;
          fillRadius?: number | string;
          rotation?: number | string;
          strokeOpacity?: number | string;
          html?: string;
          text?: string;
          path?: number[];
        }
        | undefined;
      if (!data) return;
      if (data.workspaceId !== kind) return;
      if (data.type === "preview-image-selected") {
        const src = data.src ?? "";
        const route = data.route ?? "/";
        const frameId = data.frameId ?? "";
        const brightness = normalizeImageIntensity(data.brightness);
        const saturation = normalizeImageIntensity(data.saturation);
        const nextImageOffsetX = normalizeImageOffset(data.imageOffsetX);
        const nextImageOffsetY = normalizeImageOffset(data.imageOffsetY);
        const nextImageFilterPreset = normalizeImageFilterPreset(data.filterPreset);
        const nextImageOrigin = normalizeImageInsertOrigin(data.imageOrigin);
        setSelectedTextFrameId(null);
        setSelectedTextRoute(null);
        setSelectedShapeFrameId(null);
        setSelectedShapeType(null);
        setSelectedShapeRoute(null);
        const isReplaceFlow = activeSlidesTool === "upload";
        if (isReplaceFlow && src) {
          setSelectedPreviewImage({ route, src });
        } else {
          setSelectedPreviewImage(null);
        }
        setSelectedImageSrc(src || null);
        setSelectedImageOrigin(nextImageOrigin);
        setSelectedImageFrameId(frameId || null);
        setSelectedImageRoute(route || null);
        setImageBrightness(brightness);
        setImageSaturation(saturation);
        setImageOffsetX(nextImageOffsetX);
        setImageOffsetY(nextImageOffsetY);
        setImageFilterPreset(nextImageFilterPreset);
        setImageStyleRequest(null);
        return;
      }
      if (data.type === "preview-text-selected") {
        const textId = data.textId ?? "";
        if (!textId) {
          const fallbackFamily = getRuntimeDefaultFamily();
          setSelectedPreviewImage(null);
          setSelectedImageFrameId(null);
          setSelectedImageRoute(null);
          setSelectedImageSrc(null);
          setSelectedImageOrigin("upload");
          setImageBrightness(defaultImageBrightness);
          setImageSaturation(defaultImageSaturation);
          setImageOffsetX(defaultImageOffsetX);
          setImageOffsetY(defaultImageOffsetY);
          setImageFilterPreset(defaultImageFilterPreset);
          setImageStyleRequest(null);
          setSelectedTextFrameId(null);
          setSelectedTextRoute(null);
          setSelectedShapeFrameId(null);
          setSelectedShapeType(null);
          setSelectedShapeRoute(null);
          setShapeStyleRequest(null);
          setShapeFillMode(defaultShapeFillMode);
          setShapeFillColor(defaultShapeFillColor);
          setShapeGradientStartColor(defaultShapeGradientStartColor);
          setShapeGradientEndColor(defaultShapeGradientEndColor);
          setShapeGradientAngle(defaultShapeGradientAngle);
          setShapeFillImageSrc(defaultShapeImageFill);
          setShapeFillImageOffsetX(defaultShapeImageOffsetX);
          setShapeFillImageOffsetY(defaultShapeImageOffsetY);
          setShapeStrokeColor(defaultShapeStrokeColor);
          setShapeStrokeWidth(defaultShapeStrokeWidthPx);
          setShapeSides(defaultShapePolygonSides);
          setShapeFillOpacity(defaultShapeOpacity);
          setShapeFillRadius(defaultShapeFillRadius);
          setShapeRotation(defaultShapeRotation);
          setShapeStrokeOpacity(defaultShapeOpacity);
          setCharacterFontFamily(fallbackFamily);
          setCharacterFontWeight(getRuntimeDefaultWeight(fallbackFamily));
          setCharacterFontSize(defaultFontSize);
          setCharacterTextColor(defaultTextColor);
          setCharacterTextDecorationStyle(defaultTextDecorationStyle);
          setCharacterTextAlign(defaultTextAlign);
          setCharacterLineHeight(defaultLineHeight);
          setCharacterWordSpacing(defaultWordSpacing);
          setCharacterSpacing(defaultCharacterSpacing);
          setCharacterBulletListStyle(defaultBulletListStyle);
          setCharacterNumberedListStyle(defaultNumberedListStyle);
          return;
        }
        const nextFamily = normalizeFontFamily(data.fontFamily);
        const nextSize = normalizeFontSize(data.fontSize);
        setSelectedPreviewImage(null);
        setSelectedImageFrameId(null);
        setSelectedImageRoute(null);
        setSelectedImageSrc(null);
        setSelectedImageOrigin("upload");
        setImageBrightness(defaultImageBrightness);
        setImageSaturation(defaultImageSaturation);
        setImageOffsetX(defaultImageOffsetX);
        setImageOffsetY(defaultImageOffsetY);
        setImageFilterPreset(defaultImageFilterPreset);
        setImageStyleRequest(null);
        setSelectedTextFrameId(textId);
        setSelectedTextRoute(data.route ?? null);
        setSelectedShapeFrameId(null);
        setSelectedShapeType(null);
        setSelectedShapeRoute(null);
        setShapeStyleRequest(null);
        setShapeFillMode(defaultShapeFillMode);
        setShapeFillColor(defaultShapeFillColor);
        setShapeGradientStartColor(defaultShapeGradientStartColor);
        setShapeGradientEndColor(defaultShapeGradientEndColor);
        setShapeGradientAngle(defaultShapeGradientAngle);
        setShapeFillImageSrc(defaultShapeImageFill);
        setShapeFillImageOffsetX(defaultShapeImageOffsetX);
        setShapeFillImageOffsetY(defaultShapeImageOffsetY);
        setShapeStrokeColor(defaultShapeStrokeColor);
        setShapeStrokeWidth(defaultShapeStrokeWidthPx);
        setShapeSides(defaultShapePolygonSides);
        setShapeFillOpacity(defaultShapeOpacity);
        setShapeFillRadius(defaultShapeFillRadius);
        setShapeRotation(defaultShapeRotation);
        setShapeStrokeOpacity(defaultShapeOpacity);
        setIsCharacterPanelVisible(true);
        setCharacterFontFamily(nextFamily);
        setCharacterFontWeight(normalizeFontWeight(data.fontWeight, nextFamily));
        setCharacterFontSize(nextSize);
        setCharacterTextColor(normalizeTextColor(data.textColor));
        setCharacterTextDecorationStyle(normalizeTextDecorationStyle(data.textDecorationStyle));
        setCharacterTextAlign(normalizeTextAlign(data.textAlign));
        setCharacterLineHeight(normalizeLineHeight(data.lineHeight, nextSize));
        setCharacterWordSpacing(normalizeWordSpacing(data.wordSpacing, nextSize));
        setCharacterSpacing(normalizeCharacterSpacing(data.characterSpacing, nextSize));
        setCharacterBulletListStyle(normalizeBulletListStyle(data.bulletListStyle));
        setCharacterNumberedListStyle(normalizeNumberedListStyle(data.numberedListStyle));
        return;
      }
      if (data.type === "preview-shape-selected") {
        const shapeId = data.shapeId ?? "";
        if (!shapeId) {
          setSelectedShapeFrameId(null);
          setSelectedShapeType(null);
          setSelectedShapeRoute(null);
          setShapeStyleRequest(null);
          setShapeFillMode(defaultShapeFillMode);
          setShapeFillColor(defaultShapeFillColor);
          setShapeGradientStartColor(defaultShapeGradientStartColor);
          setShapeGradientEndColor(defaultShapeGradientEndColor);
          setShapeGradientAngle(defaultShapeGradientAngle);
          setShapeFillImageSrc(defaultShapeImageFill);
          setShapeFillImageOffsetX(defaultShapeImageOffsetX);
          setShapeFillImageOffsetY(defaultShapeImageOffsetY);
          setShapeStrokeColor(defaultShapeStrokeColor);
          setShapeStrokeWidth(defaultShapeStrokeWidthPx);
          setShapeSides(defaultShapePolygonSides);
          setShapeFillOpacity(defaultShapeOpacity);
          setShapeFillRadius(defaultShapeFillRadius);
          setShapeRotation(defaultShapeRotation);
          setShapeStrokeOpacity(defaultShapeOpacity);
          return;
        }
        const nextShapeType = normalizeShapeInsertId(data.shapeType);
        setSelectedPreviewImage(null);
        setSelectedImageFrameId(null);
        setSelectedImageRoute(null);
        setSelectedImageSrc(null);
        setSelectedImageOrigin("upload");
        setImageBrightness(defaultImageBrightness);
        setImageSaturation(defaultImageSaturation);
        setImageOffsetX(defaultImageOffsetX);
        setImageOffsetY(defaultImageOffsetY);
        setImageFilterPreset(defaultImageFilterPreset);
        setImageStyleRequest(null);
        setSelectedShapeFrameId(shapeId);
        setSelectedShapeType(nextShapeType);
        setSelectedShapeRoute(data.route ?? null);
        if (nextShapeType === "icon") {
          setIsIconPanelVisible(true);
        } else {
          setIsShapePanelVisible(true);
        }
        setShapeFillMode(normalizeShapeFillMode(data.fillMode));
        setShapeFillColor(normalizeShapeColor(data.fillColor, defaultShapeFillColor));
        setShapeGradientStartColor(
          normalizeShapeColor(data.fillGradientStartColor, defaultShapeGradientStartColor)
        );
        setShapeGradientEndColor(
          normalizeShapeColor(data.fillGradientEndColor, defaultShapeGradientEndColor)
        );
        setShapeGradientAngle(normalizeShapeGradientAngle(data.fillGradientAngle));
        setShapeFillImageSrc((data.fillImageSrc || "").trim());
        setShapeFillImageOffsetX(normalizeShapeImageOffset(data.fillImageOffsetX));
        setShapeFillImageOffsetY(normalizeShapeImageOffset(data.fillImageOffsetY));
        setShapeStrokeColor(normalizeShapeColor(data.strokeColor, defaultShapeStrokeColor));
        setShapeStrokeWidth(normalizeShapeStrokeWidth(data.strokeWidth));
        setShapeSides(resolveShapeSides(nextShapeType, data.shapeSides));
        setShapeFillOpacity(normalizeShapeOpacity(data.fillOpacity));
        setShapeFillRadius(resolveShapeFillRadius(nextShapeType, data.fillRadius));
        setShapeRotation(normalizeShapeRotation(data.rotation));
        setShapeStrokeOpacity(normalizeShapeOpacity(data.strokeOpacity));
        return;
      }
      if (data.type === "preview-page-updated") {
        const route = data.route ?? "/";
        const html = data.html ?? "";
        if (!html) return;
        const sanitizedHtml = sanitizeRuntimeCanvasMarkers(html);
        setSite((existing) => {
          if (!existing) return existing;
          const nextPages = { ...existing.pages };
          const targetEntry = Object.entries(nextPages).find(([, page]) => page.route === route);
          if (!targetEntry) return existing;
          const [targetKey, targetPage] = targetEntry;
          nextPages[targetKey] = {
            ...targetPage,
            html: sanitizedHtml
          };
          return {
            ...existing,
            pages: nextPages
          };
        });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [activeSlidesTool, kind, fontCatalog]);

  useEffect(() => {
    if (activeSlidesTool !== "text") return;
    if (characterPanelPosition) return;
    const host = canvasWorkspaceRef.current;
    if (!host) {
      setCharacterPanelPosition({ x: 16, y: 16 });
      return;
    }
    const defaultX = Math.max(8, host.clientWidth - 332 - 16);
    setCharacterPanelPosition({ x: defaultX, y: 16 });
  }, [activeSlidesTool, characterPanelPosition]);

  useEffect(() => {
    if (
      activeSlidesTool !== "upload" &&
      activeSlidesTool !== "magic" &&
      !selectedImageFrameId
    ) {
      return;
    }
    if (imagePanelPosition) return;
    const host = canvasWorkspaceRef.current;
    if (!host) {
      setImagePanelPosition({ x: 16, y: 16 });
      return;
    }
    const defaultX = Math.max(8, host.clientWidth - 332 - 16);
    setImagePanelPosition({ x: defaultX, y: 16 });
  }, [activeSlidesTool, selectedImageFrameId, imagePanelPosition]);

  useEffect(() => {
    if (activeSlidesTool !== "frame" && (!selectedShapeFrameId || selectedShapeType === "icon")) return;
    if (shapePanelPosition) return;
    const host = canvasWorkspaceRef.current;
    if (!host) {
      setShapePanelPosition({ x: 16, y: 16 });
      return;
    }
    const defaultX = Math.max(8, host.clientWidth - 332 - 16);
    setShapePanelPosition({ x: defaultX, y: 16 });
  }, [activeSlidesTool, selectedShapeFrameId, selectedShapeType, shapePanelPosition]);

  useEffect(() => {
    if (activeSlidesTool !== "icons" && selectedShapeType !== "icon") return;
    if (iconPanelPosition) return;
    const host = canvasWorkspaceRef.current;
    if (!host) {
      setIconPanelPosition({ x: 16, y: 16 });
      return;
    }
    const defaultX = Math.max(8, host.clientWidth - 332 - 16);
    setIconPanelPosition({ x: defaultX, y: 16 });
  }, [activeSlidesTool, selectedShapeType, iconPanelPosition]);

  useEffect(() => {
    if (!showShapeFlyout) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (shapeFlyoutRef.current?.contains(target)) return;
      setShowShapeFlyout(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showShapeFlyout]);

  useEffect(() => {
    if (!showIconFlyout) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (iconFlyoutRef.current?.contains(target)) return;
      setShowIconFlyout(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showIconFlyout]);

  useEffect(() => {
    if (activeSlidesTool === "frame") return;
    setShowShapeFlyout(false);
  }, [activeSlidesTool]);

  useEffect(() => {
    if (activeSlidesTool === "icons") return;
    setShowIconFlyout(false);
  }, [activeSlidesTool]);

  useEffect(() => {
    setIconFlyoutVisibleCount(iconFlyoutPageSize);
  }, [iconFlyoutQuery]);

  useEffect(() => {
    const options = getWeightOptionsForFamily(characterFontFamily);
    if (!options.length) return;
    if (options.some((weight) => weight.value === characterFontWeight)) return;
    setCharacterFontWeight(options[0]?.value ?? defaultFontWeight);
  }, [characterFontFamily, characterFontWeight, fontCatalog]);

  useEffect(() => {
    if (activeSlidesTool === "text") return;
    const fallbackFamily = getRuntimeDefaultFamily();
    setSelectedTextFrameId(null);
    setSelectedTextRoute(null);
    setCharacterFontFamily(fallbackFamily);
    setCharacterFontWeight(getRuntimeDefaultWeight(fallbackFamily));
    setCharacterFontSize(defaultFontSize);
    setCharacterTextColor(defaultTextColor);
    setCharacterTextDecorationStyle(defaultTextDecorationStyle);
    setCharacterTextAlign(defaultTextAlign);
    setCharacterLineHeight(defaultLineHeight);
    setCharacterWordSpacing(defaultWordSpacing);
    setCharacterSpacing(defaultCharacterSpacing);
    setCharacterBulletListStyle(defaultBulletListStyle);
    setCharacterNumberedListStyle(defaultNumberedListStyle);
  }, [activeSlidesTool, fontCatalog]);

  const clearCanvasSelection = () => {
    const fallbackFamily = getRuntimeDefaultFamily();
    setClearSelectionSignal((count) => count + 1);
    setSelectedPreviewImage(null);
    setSelectedImageFrameId(null);
    setSelectedImageRoute(null);
    setSelectedImageSrc(null);
    setSelectedImageOrigin("upload");
    setImageBrightness(defaultImageBrightness);
    setImageSaturation(defaultImageSaturation);
    setImageOffsetX(defaultImageOffsetX);
    setImageOffsetY(defaultImageOffsetY);
    setImageFilterPreset(defaultImageFilterPreset);
    setSelectedTextFrameId(null);
    setSelectedTextRoute(null);
    setSelectedShapeFrameId(null);
    setSelectedShapeType(null);
    setSelectedShapeRoute(null);
    setTextFontRequest(null);
    setShapeStyleRequest(null);
    setImageStyleRequest(null);
    setShapeFillMode(defaultShapeFillMode);
    setShapeFillColor(defaultShapeFillColor);
    setShapeGradientStartColor(defaultShapeGradientStartColor);
    setShapeGradientEndColor(defaultShapeGradientEndColor);
    setShapeGradientAngle(defaultShapeGradientAngle);
    setShapeFillImageSrc(defaultShapeImageFill);
    setShapeFillImageOffsetX(defaultShapeImageOffsetX);
    setShapeFillImageOffsetY(defaultShapeImageOffsetY);
    setShapeStrokeColor(defaultShapeStrokeColor);
    setShapeStrokeWidth(defaultShapeStrokeWidthPx);
    setShapeSides(defaultShapePolygonSides);
    setShapeFillOpacity(defaultShapeOpacity);
    setShapeFillRadius(defaultShapeFillRadius);
    setShapeRotation(defaultShapeRotation);
    setShapeStrokeOpacity(defaultShapeOpacity);
    setCharacterFontFamily(fallbackFamily);
    setCharacterFontWeight(getRuntimeDefaultWeight(fallbackFamily));
    setCharacterFontSize(defaultFontSize);
    setCharacterTextColor(defaultTextColor);
    setCharacterTextDecorationStyle(defaultTextDecorationStyle);
    setCharacterTextAlign(defaultTextAlign);
    setCharacterLineHeight(defaultLineHeight);
    setCharacterWordSpacing(defaultWordSpacing);
    setCharacterSpacing(defaultCharacterSpacing);
    setCharacterBulletListStyle(defaultBulletListStyle);
    setCharacterNumberedListStyle(defaultNumberedListStyle);
  };

  const undoCanvasChange = () => {
    if (historyPastRef.current.length === 0) return;
    const previousSnapshot = historyPastRef.current[historyPastRef.current.length - 1];
    const currentSnapshot: WorkspaceHistorySnapshot = {
      site,
      activePage: resolveSnapshotActivePage(site, activePage)
    };
    historyPastRef.current = historyPastRef.current.slice(0, -1);
    historyFutureRef.current = [
      ...historyFutureRef.current.slice(-(workspaceHistoryLimit - 1)),
      currentSnapshot
    ];
    historySkipNextCommitRef.current = true;
    setSite(previousSnapshot.site);
    setActivePage(resolveSnapshotActivePage(previousSnapshot.site, previousSnapshot.activePage));
    clearCanvasSelection();
    setHistoryRevision((value) => value + 1);
  };

  const redoCanvasChange = () => {
    if (historyFutureRef.current.length === 0) return;
    const nextSnapshot = historyFutureRef.current[historyFutureRef.current.length - 1];
    const currentSnapshot: WorkspaceHistorySnapshot = {
      site,
      activePage: resolveSnapshotActivePage(site, activePage)
    };
    historyFutureRef.current = historyFutureRef.current.slice(0, -1);
    historyPastRef.current = [
      ...historyPastRef.current.slice(-(workspaceHistoryLimit - 1)),
      currentSnapshot
    ];
    historySkipNextCommitRef.current = true;
    setSite(nextSnapshot.site);
    setActivePage(resolveSnapshotActivePage(nextSnapshot.site, nextSnapshot.activePage));
    clearCanvasSelection();
    setHistoryRevision((value) => value + 1);
  };

  useEffect(() => {
    if (!active) return;
    const onUndoRedoKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      }
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redoCanvasChange();
          return;
        }
        undoCanvasChange();
        return;
      }
      if (key === "y") {
        event.preventDefault();
        redoCanvasChange();
      }
    };
    window.addEventListener("keydown", onUndoRedoKeyDown);
    return () => window.removeEventListener("keydown", onUndoRedoKeyDown);
  }, [active, undoCanvasChange, redoCanvasChange]);

  const onCharacterFontChange = (fontFamily: string) => {
    const normalized = normalizeFontFamily(fontFamily);
    const normalizedWeight = normalizeFontWeight(characterFontWeight, normalized);
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    setCharacterFontFamily(normalized);
    setCharacterFontWeight(normalizedWeight);
    setCharacterFontSize(normalizedSize);
    setCharacterTextColor(normalizedColor);
    setCharacterTextAlign(normalizedAlign);
    setCharacterLineHeight(normalizedLineHeight);
    setCharacterWordSpacing(normalizedWordSpacing);
    setCharacterSpacing(normalizedCharacterSpacing);
    if (!selectedTextFrameId) return;
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      normalized,
      normalizedWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: normalized,
      fontWeight: normalizedWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterFontWeightChange = (fontWeight: string) => {
    const normalizedWeight = normalizeFontWeight(fontWeight, characterFontFamily);
    setCharacterFontWeight(normalizedWeight);
    if (!selectedTextFrameId) return;
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      normalizedWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: normalizedWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterFontSizeChange = (fontSize: string) => {
    const normalizedSize = normalizeFontSize(fontSize);
    setCharacterFontSize(normalizedSize);
    if (!selectedTextFrameId) return;
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    setCharacterLineHeight(normalizedLineHeight);
    setCharacterWordSpacing(normalizedWordSpacing);
    setCharacterSpacing(normalizedCharacterSpacing);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterTextColorChange = (textColor: string) => {
    const normalizedColor = normalizeTextColor(textColor);
    setCharacterTextColor(normalizedColor);
    if (!selectedTextFrameId) return;
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterTextColorReset = () => {
    onCharacterTextColorChange(defaultTextColor);
  };

  const onCharacterTextDecorationStyleChange = (style: TextDecorationStyleValue) => {
    const normalizedDecorationStyle = normalizeTextDecorationStyle(style);
    setCharacterTextDecorationStyle(normalizedDecorationStyle);
    if (!selectedTextFrameId) return;
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      normalizedDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: normalizedDecorationStyle
    });
  };

  const onCharacterTextAlignChange = (textAlign: TextAlignValue) => {
    const normalizedAlign = normalizeTextAlign(textAlign);
    setCharacterTextAlign(normalizedAlign);
    if (!selectedTextFrameId) return;
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterLineHeightChange = (lineHeight: string) => {
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedLineHeight = normalizeLineHeight(lineHeight, normalizedSize);
    setCharacterLineHeight(normalizedLineHeight);
    if (!selectedTextFrameId) return;
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterWordSpacingChange = (wordSpacing: string) => {
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedWordSpacing = normalizeWordSpacing(wordSpacing, normalizedSize);
    setCharacterWordSpacing(normalizedWordSpacing);
    if (!selectedTextFrameId) return;
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterSpacingChange = (characterSpacingValue: string) => {
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacingValue, normalizedSize);
    setCharacterSpacing(normalizedCharacterSpacing);
    if (!selectedTextFrameId) return;
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      characterBulletListStyle,
      characterNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: characterBulletListStyle,
      numberedListStyle: characterNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterBulletListStyleChange = (listStyle: BulletListStyleValue) => {
    const normalizedBullet = normalizeBulletListStyle(listStyle);
    const normalizedNumbered = normalizedBullet === "none" ? characterNumberedListStyle : "none";
    setCharacterBulletListStyle(normalizedBullet);
    setCharacterNumberedListStyle(normalizedNumbered);
    if (!selectedTextFrameId) return;
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      normalizedBullet,
      normalizedNumbered
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: normalizedBullet,
      numberedListStyle: normalizedNumbered,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterNumberedListStyleChange = (listStyle: NumberedListStyleValue) => {
    const normalizedNumbered = normalizeNumberedListStyle(listStyle);
    const normalizedBullet = normalizedNumbered === "none" ? characterBulletListStyle : "none";
    setCharacterNumberedListStyle(normalizedNumbered);
    setCharacterBulletListStyle(normalizedBullet);
    if (!selectedTextFrameId) return;
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      normalizedBullet,
      normalizedNumbered
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: normalizedBullet,
      numberedListStyle: normalizedNumbered,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const onCharacterBulletListClear = () => {
    setCharacterBulletListStyle(defaultBulletListStyle);
    setCharacterNumberedListStyle(defaultNumberedListStyle);
    if (!selectedTextFrameId) return;
    const normalizedSize = normalizeFontSize(characterFontSize);
    const normalizedColor = normalizeTextColor(characterTextColor);
    const normalizedAlign = normalizeTextAlign(characterTextAlign);
    const normalizedLineHeight = normalizeLineHeight(characterLineHeight, normalizedSize);
    const normalizedWordSpacing = normalizeWordSpacing(characterWordSpacing, normalizedSize);
    const normalizedCharacterSpacing = normalizeCharacterSpacing(characterSpacing, normalizedSize);
    applyTextStyleToTextFrameInSite(
      selectedTextFrameId,
      characterFontFamily,
      characterFontWeight,
      normalizedSize,
      normalizedColor,
      characterTextDecorationStyle,
      normalizedAlign,
      normalizedLineHeight,
      normalizedWordSpacing,
      normalizedCharacterSpacing,
      defaultBulletListStyle,
      defaultNumberedListStyle
    );
    setTextFontRequest({
      token: Date.now(),
      textId: selectedTextFrameId,
      fontFamily: characterFontFamily,
      fontWeight: characterFontWeight,
      fontSize: normalizedSize,
      textColor: normalizedColor,
      textAlign: normalizedAlign,
      lineHeight: normalizedLineHeight,
      wordSpacing: normalizedWordSpacing,
      characterSpacing: normalizedCharacterSpacing,
      bulletListStyle: defaultBulletListStyle,
      numberedListStyle: defaultNumberedListStyle,
      textDecorationStyle: characterTextDecorationStyle
    });
  };

  const queueShapeStyleRequest = (
    nextFillColor: string,
    nextStrokeColor: string,
    nextStrokeWidth: number,
    nextShapeSides: number,
    nextFillOpacity: number,
    nextFillRadius: number,
    nextStrokeOpacity: number,
    persistToSite = false,
    fillOptions?: Partial<{
      fillMode: ShapeFillMode;
      fillGradientStartColor: string;
      fillGradientEndColor: string;
      fillGradientAngle: number;
      fillImageSrc: string;
      fillImageOffsetX: number;
      fillImageOffsetY: number;
      rotation: number;
    }>
  ) => {
    if (!selectedShapeFrameId) return;
    const normalizedFillMode = normalizeShapeFillMode(fillOptions?.fillMode ?? shapeFillMode);
    const normalizedFillColor = normalizeShapeColor(nextFillColor, defaultShapeFillColor);
    const normalizedFillGradientStartColor = normalizeShapeColor(
      fillOptions?.fillGradientStartColor ?? shapeGradientStartColor,
      defaultShapeGradientStartColor
    );
    const normalizedFillGradientEndColor = normalizeShapeColor(
      fillOptions?.fillGradientEndColor ?? shapeGradientEndColor,
      defaultShapeGradientEndColor
    );
    const normalizedFillGradientAngle = normalizeShapeGradientAngle(
      fillOptions?.fillGradientAngle ?? shapeGradientAngle
    );
    const normalizedFillImageSrc = (fillOptions?.fillImageSrc ?? shapeFillImageSrc ?? "").trim();
    const normalizedFillImageOffsetX = normalizeShapeImageOffset(
      fillOptions?.fillImageOffsetX ?? shapeFillImageOffsetX
    );
    const normalizedFillImageOffsetY = normalizeShapeImageOffset(
      fillOptions?.fillImageOffsetY ?? shapeFillImageOffsetY
    );
    const normalizedStrokeColor = normalizeShapeColor(nextStrokeColor, defaultShapeStrokeColor);
    const normalizedStrokeWidth = normalizeShapeStrokeWidth(nextStrokeWidth);
    const normalizedShapeSides = resolveShapeSides(selectedShapeType, nextShapeSides);
    const normalizedFillOpacity = normalizeShapeOpacity(nextFillOpacity);
    const normalizedFillRadius = resolveShapeFillRadius(selectedShapeType, nextFillRadius);
    const normalizedShapeRotation = normalizeShapeRotation(fillOptions?.rotation ?? shapeRotation);
    const normalizedStrokeOpacity = normalizeShapeOpacity(nextStrokeOpacity);

    if (persistToSite) {
      applyShapeStyleToShapeFrameInSite(
        selectedShapeFrameId,
        normalizedFillMode,
        normalizedFillColor,
        normalizedFillGradientStartColor,
        normalizedFillGradientEndColor,
        normalizedFillGradientAngle,
        normalizedFillImageSrc,
        normalizedFillImageOffsetX,
        normalizedFillImageOffsetY,
        normalizedStrokeColor,
        normalizedFillOpacity,
        normalizedShapeSides,
        normalizedFillRadius,
        normalizedShapeRotation,
        normalizedStrokeOpacity,
        normalizedStrokeWidth
      );
    }

    setShapeStyleRequest({
      token: Date.now(),
      shapeId: selectedShapeFrameId,
      route: selectedShapeRoute,
      fillMode: normalizedFillMode,
      fillColor: normalizedFillColor,
      fillGradientStartColor: normalizedFillGradientStartColor,
      fillGradientEndColor: normalizedFillGradientEndColor,
      fillGradientAngle: normalizedFillGradientAngle,
      fillImageSrc: normalizedFillImageSrc,
      fillImageOffsetX: normalizedFillImageOffsetX,
      fillImageOffsetY: normalizedFillImageOffsetY,
      strokeColor: normalizedStrokeColor,
      strokeWidth: normalizedStrokeWidth,
      shapeSides: normalizedShapeSides,
      fillOpacity: normalizedFillOpacity,
      fillRadius: normalizedFillRadius,
      rotation: normalizedShapeRotation,
      strokeOpacity: normalizedStrokeOpacity
    });
  };

  const onShapeFillColorChange = (color: string) => {
    const normalizedFillColor = normalizeShapeColor(color, defaultShapeFillColor);
    setShapeFillColor(normalizedFillColor);
    queueShapeStyleRequest(
      normalizedFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true
    );
  };

  const onShapeFillModeChange = (mode: ShapeFillMode) => {
    const normalizedFillMode = normalizeShapeFillMode(mode);
    setShapeFillMode(normalizedFillMode);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true,
      {
        fillMode: normalizedFillMode
      }
    );
  };

  const onShapeGradientStartColorChange = (color: string) => {
    const normalizedGradientStartColor = normalizeShapeColor(
      color,
      defaultShapeGradientStartColor
    );
    setShapeGradientStartColor(normalizedGradientStartColor);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true,
      {
        fillMode: "gradient",
        fillGradientStartColor: normalizedGradientStartColor
      }
    );
  };

  const onShapeGradientEndColorChange = (color: string) => {
    const normalizedGradientEndColor = normalizeShapeColor(
      color,
      defaultShapeGradientEndColor
    );
    setShapeGradientEndColor(normalizedGradientEndColor);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true,
      {
        fillMode: "gradient",
        fillGradientEndColor: normalizedGradientEndColor
      }
    );
  };

  const onShapeGradientAngleChange = (angle: number) => {
    const normalizedGradientAngle = normalizeShapeGradientAngle(angle);
    setShapeGradientAngle(normalizedGradientAngle);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      false,
      {
        fillMode: "gradient",
        fillGradientAngle: normalizedGradientAngle
      }
    );
  };

  const onShapeGradientAngleCommit = (angle: number) => {
    const normalizedGradientAngle = normalizeShapeGradientAngle(angle);
    setShapeGradientAngle(normalizedGradientAngle);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true,
      {
        fillMode: "gradient",
        fillGradientAngle: normalizedGradientAngle
      }
    );
  };

  const onShapeFillImageUpload = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Failed to read shape fill image"));
        reader.readAsDataURL(file);
      });
      if (!imageData) return;
      setShapeFillMode("image");
      setShapeFillImageSrc(imageData);
      setShapeFillImageOffsetX(defaultShapeImageOffsetX);
      setShapeFillImageOffsetY(defaultShapeImageOffsetY);
      queueShapeStyleRequest(
        shapeFillColor,
        shapeStrokeColor,
        shapeStrokeWidth,
        shapeSides,
        shapeFillOpacity,
        shapeFillRadius,
        shapeStrokeOpacity,
        true,
        {
          fillMode: "image",
          fillImageSrc: imageData,
          fillImageOffsetX: defaultShapeImageOffsetX,
          fillImageOffsetY: defaultShapeImageOffsetY
        }
      );
    } catch {
      // Keep current fill settings when image read fails.
    }
  };

  const onShapeFillImageClear = () => {
    setShapeFillImageSrc(defaultShapeImageFill);
    setShapeFillImageOffsetX(defaultShapeImageOffsetX);
    setShapeFillImageOffsetY(defaultShapeImageOffsetY);
    setShapeFillMode(defaultShapeFillMode);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true,
      {
        fillMode: defaultShapeFillMode,
        fillImageSrc: defaultShapeImageFill,
        fillImageOffsetX: defaultShapeImageOffsetX,
        fillImageOffsetY: defaultShapeImageOffsetY
      }
    );
  };

  const onShapeFillImageOffsetXChange = (offsetX: number) => {
    const normalizedFillImageOffsetX = normalizeShapeImageOffset(offsetX);
    setShapeFillImageOffsetX(normalizedFillImageOffsetX);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      false,
      {
        fillMode: "image",
        fillImageOffsetX: normalizedFillImageOffsetX
      }
    );
  };

  const onShapeFillImageOffsetXCommit = (offsetX: number) => {
    const normalizedFillImageOffsetX = normalizeShapeImageOffset(offsetX);
    setShapeFillImageOffsetX(normalizedFillImageOffsetX);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true,
      {
        fillMode: "image",
        fillImageOffsetX: normalizedFillImageOffsetX
      }
    );
  };

  const onShapeFillImageOffsetYChange = (offsetY: number) => {
    const normalizedFillImageOffsetY = normalizeShapeImageOffset(offsetY);
    setShapeFillImageOffsetY(normalizedFillImageOffsetY);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      false,
      {
        fillMode: "image",
        fillImageOffsetY: normalizedFillImageOffsetY
      }
    );
  };

  const onShapeFillImageOffsetYCommit = (offsetY: number) => {
    const normalizedFillImageOffsetY = normalizeShapeImageOffset(offsetY);
    setShapeFillImageOffsetY(normalizedFillImageOffsetY);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true,
      {
        fillMode: "image",
        fillImageOffsetY: normalizedFillImageOffsetY
      }
    );
  };

  const onShapeStrokeColorChange = (color: string) => {
    const normalizedStrokeColor = normalizeShapeColor(color, defaultShapeStrokeColor);
    setShapeStrokeColor(normalizedStrokeColor);
    queueShapeStyleRequest(
      shapeFillColor,
      normalizedStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true
    );
  };

  const onShapeStrokeWidthChange = (strokeWidth: number) => {
    const normalizedStrokeWidth = normalizeShapeStrokeWidth(strokeWidth);
    setShapeStrokeWidth(normalizedStrokeWidth);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      normalizedStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity
    );
  };

  const onShapeStrokeWidthCommit = (strokeWidth: number) => {
    const normalizedStrokeWidth = normalizeShapeStrokeWidth(strokeWidth);
    setShapeStrokeWidth(normalizedStrokeWidth);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      normalizedStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true
    );
  };

  const onShapeSidesChange = (sides: number) => {
    const normalizedShapeSides = resolveShapeSides(selectedShapeType, sides);
    setShapeSides(normalizedShapeSides);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      normalizedShapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity
    );
  };

  const onShapeSidesCommit = (sides: number) => {
    const normalizedShapeSides = resolveShapeSides(selectedShapeType, sides);
    setShapeSides(normalizedShapeSides);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      normalizedShapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true
    );
  };

  const onShapeFillOpacityChange = (opacity: number) => {
    const normalizedFillOpacity = normalizeShapeOpacity(opacity);
    setShapeFillOpacity(normalizedFillOpacity);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      normalizedFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity
    );
  };

  const onShapeFillOpacityCommit = (opacity: number) => {
    const normalizedFillOpacity = normalizeShapeOpacity(opacity);
    setShapeFillOpacity(normalizedFillOpacity);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      normalizedFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true
    );
  };

  const onShapeFillRadiusChange = (radius: number) => {
    const normalizedFillRadius = resolveShapeFillRadius(selectedShapeType, radius);
    setShapeFillRadius(normalizedFillRadius);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      normalizedFillRadius,
      shapeStrokeOpacity
    );
  };

  const onShapeFillRadiusCommit = (radius: number) => {
    const normalizedFillRadius = resolveShapeFillRadius(selectedShapeType, radius);
    setShapeFillRadius(normalizedFillRadius);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      normalizedFillRadius,
      shapeStrokeOpacity,
      true
    );
  };

  const onShapeRotationChange = (rotation: number) => {
    const normalizedShapeRotation = normalizeShapeRotation(rotation);
    setShapeRotation(normalizedShapeRotation);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      false,
      {
        rotation: normalizedShapeRotation
      }
    );
  };

  const onShapeRotationCommit = (rotation: number) => {
    const normalizedShapeRotation = normalizeShapeRotation(rotation);
    setShapeRotation(normalizedShapeRotation);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      shapeStrokeOpacity,
      true,
      {
        rotation: normalizedShapeRotation
      }
    );
  };

  const onShapeStrokeOpacityChange = (opacity: number) => {
    const normalizedStrokeOpacity = normalizeShapeOpacity(opacity);
    setShapeStrokeOpacity(normalizedStrokeOpacity);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      normalizedStrokeOpacity
    );
  };

  const onShapeStrokeOpacityCommit = (opacity: number) => {
    const normalizedStrokeOpacity = normalizeShapeOpacity(opacity);
    setShapeStrokeOpacity(normalizedStrokeOpacity);
    queueShapeStyleRequest(
      shapeFillColor,
      shapeStrokeColor,
      shapeStrokeWidth,
      shapeSides,
      shapeFillOpacity,
      shapeFillRadius,
      normalizedStrokeOpacity,
      true
    );
  };

  const queueImageStyleRequest = (
    nextBrightness: number,
    nextSaturation: number,
    nextOffsetX: number,
    nextOffsetY: number,
    nextFilterPreset: ImageFilterPreset,
    persistToSite = false
  ) => {
    if (!selectedImageFrameId) return;
    const normalizedBrightness = normalizeImageIntensity(nextBrightness);
    const normalizedSaturation = normalizeImageIntensity(nextSaturation);
    const normalizedImageOffsetX = normalizeImageOffset(nextOffsetX);
    const normalizedImageOffsetY = normalizeImageOffset(nextOffsetY);
    const normalizedFilterPreset = normalizeImageFilterPreset(nextFilterPreset);
    if (persistToSite) {
      if (imagePreviewRafRef.current !== null) {
        window.cancelAnimationFrame(imagePreviewRafRef.current);
        imagePreviewRafRef.current = null;
      }
      pendingImagePreviewRef.current = null;
      applyImageStyleToImageFrameInSite(
        selectedImageFrameId,
        normalizedBrightness,
        normalizedSaturation,
        normalizedImageOffsetX,
        normalizedImageOffsetY,
        normalizedFilterPreset
      );
      setImageStyleRequest({
        token: Date.now(),
        imageId: selectedImageFrameId,
        route: selectedImageRoute,
        brightness: normalizedBrightness,
        saturation: normalizedSaturation,
        imageOffsetX: normalizedImageOffsetX,
        imageOffsetY: normalizedImageOffsetY,
        filterPreset: normalizedFilterPreset,
        persistToSite: true
      });
      return;
    }

    pendingImagePreviewRef.current = {
      imageId: selectedImageFrameId,
      route: selectedImageRoute,
      brightness: normalizedBrightness,
      saturation: normalizedSaturation,
      imageOffsetX: normalizedImageOffsetX,
      imageOffsetY: normalizedImageOffsetY,
      filterPreset: normalizedFilterPreset
    };
    if (imagePreviewRafRef.current !== null) return;
    imagePreviewRafRef.current = window.requestAnimationFrame(() => {
      imagePreviewRafRef.current = null;
      const pending = pendingImagePreviewRef.current;
      pendingImagePreviewRef.current = null;
      if (!pending) return;
      setImageStyleRequest({
        token: Date.now(),
        imageId: pending.imageId,
        route: pending.route,
        brightness: pending.brightness,
        saturation: pending.saturation,
        imageOffsetX: pending.imageOffsetX,
        imageOffsetY: pending.imageOffsetY,
        filterPreset: pending.filterPreset,
        persistToSite: false
      });
    });
  };

  const onImageBrightnessChange = (value: number) => {
    const normalized = normalizeImageIntensity(value);
    setImageBrightness(normalized);
    queueImageStyleRequest(
      normalized,
      imageSaturation,
      imageOffsetX,
      imageOffsetY,
      imageFilterPreset,
      false
    );
  };

  const onImageBrightnessCommit = (value: number) => {
    const normalized = normalizeImageIntensity(value);
    setImageBrightness(normalized);
    queueImageStyleRequest(
      normalized,
      imageSaturation,
      imageOffsetX,
      imageOffsetY,
      imageFilterPreset,
      true
    );
  };

  const onImageSaturationChange = (value: number) => {
    const normalized = normalizeImageIntensity(value);
    setImageSaturation(normalized);
    queueImageStyleRequest(
      imageBrightness,
      normalized,
      imageOffsetX,
      imageOffsetY,
      imageFilterPreset,
      false
    );
  };

  const onImageSaturationCommit = (value: number) => {
    const normalized = normalizeImageIntensity(value);
    setImageSaturation(normalized);
    queueImageStyleRequest(
      imageBrightness,
      normalized,
      imageOffsetX,
      imageOffsetY,
      imageFilterPreset,
      true
    );
  };

  const onImageOffsetXChange = (value: number) => {
    const normalized = normalizeImageOffset(value);
    setImageOffsetX(normalized);
    queueImageStyleRequest(
      imageBrightness,
      imageSaturation,
      normalized,
      imageOffsetY,
      imageFilterPreset,
      false
    );
  };

  const onImageOffsetXCommit = (value: number) => {
    const normalized = normalizeImageOffset(value);
    setImageOffsetX(normalized);
    queueImageStyleRequest(
      imageBrightness,
      imageSaturation,
      normalized,
      imageOffsetY,
      imageFilterPreset,
      true
    );
  };

  const onImageOffsetYChange = (value: number) => {
    const normalized = normalizeImageOffset(value);
    setImageOffsetY(normalized);
    queueImageStyleRequest(
      imageBrightness,
      imageSaturation,
      imageOffsetX,
      normalized,
      imageFilterPreset,
      false
    );
  };

  const onImageOffsetYCommit = (value: number) => {
    const normalized = normalizeImageOffset(value);
    setImageOffsetY(normalized);
    queueImageStyleRequest(
      imageBrightness,
      imageSaturation,
      imageOffsetX,
      normalized,
      imageFilterPreset,
      true
    );
  };

  const onImageFilterPresetChange = (value: ImageFilterPreset) => {
    const normalized = normalizeImageFilterPreset(value);
    setImageFilterPreset(normalized);
    queueImageStyleRequest(
      imageBrightness,
      imageSaturation,
      imageOffsetX,
      imageOffsetY,
      normalized,
      true
    );
  };

  useEffect(() => {
    return () => {
      if (imagePreviewRafRef.current !== null) {
        window.cancelAnimationFrame(imagePreviewRafRef.current);
      }
    };
  }, []);

  const replaceSelectedImage = async (file: File) => {
    if (!site || !selectedPreviewImage) return;
    const readDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Failed to read replacement image"));
        reader.readAsDataURL(file);
      });

    const dataUrl = await readDataUrl();
    if (!dataUrl) return;

    const nextPages = { ...site.pages };
    const targetEntry =
      Object.entries(nextPages).find(([, page]) => page.route === selectedPreviewImage.route) ??
      Object.entries(nextPages).find(([key]) => key === activePage);

    if (targetEntry) {
      const [targetKey, targetPage] = targetEntry;
      nextPages[targetKey] = {
        ...targetPage,
        html: targetPage.html.split(selectedPreviewImage.src).join(dataUrl),
        css: targetPage.css.split(selectedPreviewImage.src).join(dataUrl),
        previewImage:
          targetPage.previewImage === selectedPreviewImage.src ? dataUrl : targetPage.previewImage
      };
      setSite({
        ...site,
        pages: nextPages
      });
    }

    setSelectedPreviewImage(null);
    if (canvasUploadInputRef.current) {
      canvasUploadInputRef.current.value = "";
    }
  };

  const replaceSelectedCanvasImage = async (file: File) => {
    if (!selectedImageFrameId) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read replacement image"));
      reader.readAsDataURL(file);
    });
    if (!dataUrl) return;

    setSite((existing) => {
      if (!existing) return existing;
      const nextPages = { ...existing.pages };
      const targetEntry =
        selectedImageRoute
          ? Object.entries(nextPages).find(([, page]) => page.route === selectedImageRoute)
          : null;
      const targetKey =
        targetEntry?.[0] ??
        (nextPages[activePage] ? activePage : Object.keys(nextPages)[0]);
      if (!targetKey) return existing;
      const targetPage = nextPages[targetKey];
      if (!targetPage) return existing;

      const template = document.createElement("template");
      template.innerHTML = targetPage.html;
      const frame = template.content.querySelector(
        `.fx-image-frame[data-fx-id="${selectedImageFrameId}"]`
      );
      if (!(frame instanceof HTMLElement)) return existing;
      const image = frame.querySelector("img");
      if (!(image instanceof HTMLImageElement)) return existing;

      image.src = dataUrl;
      if (image.parentElement?.classList.contains("fx-image-frame")) {
        image.parentElement.dataset.fxImageOrigin = "upload";
      }
      image.dataset.fxImageOrigin = "upload";
      nextPages[targetKey] = {
        ...targetPage,
        html: template.innerHTML
      };
      return {
        ...existing,
        pages: nextPages
      };
    });

    setSelectedImageSrc(dataUrl);
    setSelectedImageOrigin("upload");
    if (canvasReplaceUploadInputRef.current) {
      canvasReplaceUploadInputRef.current.value = "";
    }
  };

  const downloadSelectedCanvasImage = async () => {
    if (!selectedImageSrc) return;
    if (selectedImageOrigin !== "generated" && selectedImageOrigin !== "edited") return;
    try {
      let blob: Blob;
      if (selectedImageSrc.startsWith("data:")) {
        const [meta, data = ""] = selectedImageSrc.split(",");
        const mime = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png";
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        blob = new Blob([bytes], { type: mime });
      } else {
        const response = await fetch(selectedImageSrc);
        blob = await response.blob();
      }
      const mime = blob.type || "image/png";
      const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `magx-${selectedImageOrigin}-${Date.now()}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to download image");
    }
  };

  const generate = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace: kind,
          presentationAspectRatio,
          presentationDeckType,
          ...values,
          referenceImages,
          currentSite: site ?? undefined,
          pages: site
            ? Object.keys(site.pages)
            : isMagXStudioWorkspace
              ? inferSlidesPageKeysFromPrompt(values.userPrompt)
              : ["landing"],
          inspiration: isSlidesWorkspace ? { enabled: false, maxSites: 3 } : { enabled: true, maxSites: 6 }
        })
      });

      const json = (await response.json()) as {
        error?: string;
        details?: string;
        data?: GeneratedSiteContract;
      };

      if (!response.ok || !json.data) {
        throw new Error([json.error || "Generation failed", json.details].filter(Boolean).join(": "));
      }

      const processedData = referenceImages.length > 0
        ? replaceReferenceTokens(json.data, referenceImages)
        : json.data;

      if (isSlidesWorkspace) {
        const firstEntry = Object.entries(processedData.pages)[0];
        if (firstEntry) {
          const [firstKey, firstPage] = firstEntry;
          const trimmedSite: GeneratedSiteContract = {
            ...processedData,
            pages: {
              [firstKey]: firstPage
            }
          };
          setSite(trimmedSite);
          setActivePage(firstKey);
        } else {
          setSite(buildBlankSlideSite());
          setActivePage("slide-1");
        }
      } else {
        setSite(processedData);
      }
      if (isMagXStudioWorkspace) setShowSlidesPromptModal(false);
      if (!isSlidesWorkspace) {
        const nextActivePage = Object.keys(processedData.pages)[0] ?? "landing";
        setActivePage(nextActivePage);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown generation error");
    } finally {
      setLoading(false);
    }
  };

  const exportZip = async () => {
    if (!site) return;

    setExporting(true);
    setError(null);

    try {
      const response = await fetch("/api/export-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generatedSite: site,
          workspace: kind,
          presentationAspectRatio
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Export failed");
      }

      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = kind === "pages" ? "pages-generated.zip" : `${kind}-generated.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown export error");
    } finally {
      setExporting(false);
    }
  };

  const resetWorkspace = () => {
    setError(null);
    setSite(null);
    setReferenceImages([]);
    setActivePage("landing");
    if (isMagXStudioWorkspace) setShowSlidesPromptModal(false);
    if (isPagesWorkspace) pagesDraft.clearDraft();
  };

  const createNewCanvas = () => {
    setError(null);
    setSite(null);
    setActivePage("landing");
    setShowSlidesPromptModal(false);
    if (isPagesWorkspace) pagesDraft.clearDraft();
  };

  const openPreviewInNewTab = () => {
    if (!site) return;
    const previewSite = isPagesWorkspace ? buildBlankPagesSite(site) : site;
    const orderedPageKeys = Object.keys(previewSite.pages).sort((left, right) => {
      const leftRoute = previewSite.pages[left]?.route || "/";
      const rightRoute = previewSite.pages[right]?.route || "/";
      if (leftRoute === "/") return -1;
      if (rightRoute === "/") return 1;
      return leftRoute.localeCompare(rightRoute, undefined, { numeric: true });
    });
    const previewKey = isPagesWorkspace ? (orderedPageKeys[0] ?? activePage) : activePage;
    const page = previewSite.pages[previewKey];
    if (!page) return;
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) return;
    previewWindow.opener = null;
    previewWindow.document.open();
    previewWindow.document.write(
      buildPreviewSrcDoc(
        page,
        previewSite,
        kind,
        true,
        activeSlidesTool,
        isMagXStudioWorkspace,
        isSlidesWorkspace ? slidesCanvasAspect : kind === "pages" ? pagesCanvasSize : "16:9",
        isPagesWorkspace ? resolvedCustomCanvasSize?.width ?? null : null,
        isPagesWorkspace ? resolvedCustomCanvasSize?.height ?? null : null,
        referenceImages
      )
    );
    previewWindow.document.close();
  };

  const commitActiveCanvasColor = (rawColor: string) => {
    const nextColor = normalizeCanvasColor(rawColor, canvasColor);
    setCanvasColor(nextColor);
    setCanvasColorDraft(nextColor);
    setSite((existing) => {
      if (!existing) return existing;
      const nextPages = { ...existing.pages };
      const fallbackKey = Object.keys(nextPages)[0];
      const targetKey = nextPages[activePage] ? activePage : fallbackKey;
      if (!targetKey) return existing;
      const targetPage = nextPages[targetKey];
      if (!targetPage) return existing;
      const nextCss = upsertCanvasColorOverride(targetPage.css, nextColor);
      if (nextCss === targetPage.css) return existing;
      nextPages[targetKey] = { ...targetPage, css: nextCss };
      return { ...existing, pages: nextPages };
    });
  };

  const previewActiveCanvasColor = (rawColor: string) => {
    const nextColor = normalizeCanvasColor(rawColor, canvasColor);
    setCanvasColor(nextColor);
    setCanvasColorDraft(nextColor);
  };

  useEffect(() => {
    setCanvasColorDraft(canvasColor);
  }, [canvasColor]);

  const onCanvasColorDraftChange = (value: string) => {
    setCanvasColorDraft(value);
    const normalized = normalizeCanvasColor(value, "");
    if (!normalized) return;
    setCanvasColor(normalized);
  };

  const commitCanvasColorDraft = () => {
    const normalized = normalizeCanvasColor(canvasColorDraft, "");
    if (!normalized) {
      setCanvasColorDraft(canvasColor);
      return;
    }
    commitActiveCanvasColor(normalized);
  };

  useEffect(() => {
    if (!showCanvasColorPicker) {
      canvasColorPickerDraggingRef.current = false;
      return;
    }
    const onPointerUp = () => {
      if (!canvasColorPickerDraggingRef.current) return;
      canvasColorPickerDraggingRef.current = false;
      commitCanvasColorDraft();
    };
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [showCanvasColorPicker, canvasColorDraft, canvasColor]);

  const reorderSelectedCanvasElements = (direction: LayerOrderDirection) => {
    setSite((existing) => {
      if (!existing || !isMagXStudioWorkspace) return existing;
      const nextPages = { ...existing.pages };
      const byRouteKey =
        selectedShapeRoute
          ? Object.entries(nextPages).find(([, page]) => page.route === selectedShapeRoute)?.[0]
          : selectedTextRoute
            ? Object.entries(nextPages).find(([, page]) => page.route === selectedTextRoute)?.[0]
            : selectedImageRoute
              ? Object.entries(nextPages).find(([, page]) => page.route === selectedImageRoute)?.[0]
              : undefined;
      const targetKey = byRouteKey ?? (nextPages[activePage] ? activePage : Object.keys(nextPages)[0]);
      if (!targetKey) return existing;
      const targetPage = nextPages[targetKey];
      if (!targetPage) return existing;

      const template = document.createElement("template");
      template.innerHTML = targetPage.html;
      const root = template.content.querySelector("main");
      if (!(root instanceof HTMLElement)) return existing;

      const targets: HTMLElement[] = [];
      const textTarget = selectedTextFrameId
        ? root.querySelector(`.fx-text-frame[data-fx-id="${selectedTextFrameId}"]`)
        : null;
      if (textTarget instanceof HTMLElement) targets.push(textTarget);

      const shapeTarget = selectedShapeFrameId
        ? root.querySelector(`.fx-shape-frame[data-fx-id="${selectedShapeFrameId}"]`)
        : null;
      if (shapeTarget instanceof HTMLElement && !targets.includes(shapeTarget)) targets.push(shapeTarget);

      const imageTarget = selectedImageFrameId
        ? root.querySelector(`.fx-image-frame[data-fx-id="${selectedImageFrameId}"]`)
        : null;
      if (imageTarget instanceof HTMLElement && !targets.includes(imageTarget)) targets.push(imageTarget);

      if (!targets.length) return existing;

      if (direction === "front") {
        targets.forEach((target) => root.appendChild(target));
      } else {
        for (let index = targets.length - 1; index >= 0; index -= 1) {
          const target = targets[index];
          root.insertBefore(target, root.firstChild);
        }
      }

      nextPages[targetKey] = {
        ...targetPage,
        html: template.innerHTML
      };
      return {
        ...existing,
        pages: nextPages
      };
    });
    setLayerOrderCommand({ token: Date.now(), direction });
  };

  const canUndo = useMemo(() => historyPastRef.current.length > 0, [historyRevision]);
  const canRedo = useMemo(() => historyFutureRef.current.length > 0, [historyRevision]);
  const isMagicPromptValid = useMemo(() => magicPrompt.trim().length >= 8, [magicPrompt]);
  const isMagicAspectRatioValid = useMemo(() => Boolean(magicAspectRatio), [magicAspectRatio]);
  const isMagicSourceImageValid = useMemo(
    () => magicMode === "text-to-image" || Boolean(magicSourceImage),
    [magicMode, magicSourceImage]
  );
  const canGenerateMagicVisual = useMemo(
    () =>
      !magicGenerating && isMagicPromptValid && isMagicAspectRatioValid && isMagicSourceImageValid,
    [magicGenerating, isMagicPromptValid, isMagicAspectRatioValid, isMagicSourceImageValid]
  );
  const isPagesDesignerTopicValid = useMemo(
    () => pagesDesignerTopic.trim().length >= 8,
    [pagesDesignerTopic]
  );
  const canGeneratePagesDesignerContent = useMemo(
    () => !magicGenerating && isPagesDesignerTopicValid,
    [magicGenerating, isPagesDesignerTopicValid]
  );
  const showMagicPromptInvalid = (magicPromptTouched || magicSubmitAttempted) && !isMagicPromptValid;
  const showMagicAspectInvalid = (magicAspectTouched || magicSubmitAttempted) && !isMagicAspectRatioValid;
  const showPagesDesignerTopicInvalid = pagesDesignerSubmitAttempted && !isPagesDesignerTopicValid;
  const showWorkspaceLayout = isMagXStudioWorkspace || Boolean(site);
  const currentFontWeightOptions = getWeightOptionsForFamily(characterFontFamily);
  const currentFontSizeOptions = fontSizeOptions;
  const currentLineHeightOptions = lineHeightPercentOptions;
  const currentWordSpacingOptions = wordSpacingPxOptions;
  const currentCharacterSpacingOptions = characterSpacingPxOptions;
  const currentBulletListStyleOptions = bulletListStyleOptions;
  const currentNumberedListStyleOptions = numberedListStyleOptions;
  const showCharacterPanel =
    isCharacterPanelVisible && (activeSlidesTool === "text" || Boolean(selectedTextFrameId));
  const isIconSelection = selectedShapeType === "icon";
  const showShapePanel =
    isShapePanelVisible &&
    ((activeSlidesTool === "frame" && !isIconSelection) ||
      (Boolean(selectedShapeFrameId) && !isIconSelection));
  const showImagePanel = isImagePanelVisible;
  const canDownloadSelectedImage =
    Boolean(selectedImageFrameId) &&
    (selectedImageOrigin === "generated" || selectedImageOrigin === "edited");
  const showIconPanel =
    isIconPanelVisible &&
    (activeSlidesTool === "icons" || (Boolean(selectedShapeFrameId) && isIconSelection));
  const showInspectorPanel = isPagesWorkspace && isInspectorPanelVisible;
  const customCanvasWidthValue = Number.parseFloat(customCanvasWidth);
  const customCanvasHeightValue = Number.parseFloat(customCanvasHeight);
  const resolvedCustomCanvasSize =
    Number.isFinite(customCanvasWidthValue) &&
      Number.isFinite(customCanvasHeightValue) &&
      customCanvasWidthValue > 0 &&
      customCanvasHeightValue > 0
      ? { width: customCanvasWidthValue, height: customCanvasHeightValue }
      : null;

  useEffect(() => {
    if (!active || !isPagesWorkspace || !isInspectorPanelVisible || inspectorPanelPosition) return;
    const frame = window.requestAnimationFrame(() => {
      const bounds = canvasWorkspaceRef.current;
      if (!bounds) return;
      const nextX = Math.max(
        inspectorPanelDefaultOffset,
        bounds.clientWidth - inspectorPanelWidth - inspectorPanelDefaultOffset
      );
      setInspectorPanelPosition({ x: nextX, y: inspectorPanelDefaultOffset });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, isPagesWorkspace, isInspectorPanelVisible, inspectorPanelPosition]);
  const canAdjustSelectedShapeCornerRadius = isCornerRadiusAdjustableShape(selectedShapeType);
  const canAdjustSelectedShapeSides = isSideCountAdjustableShape(selectedShapeType);
  const defaultSelectedShapeSides = getDefaultShapeSidesById(selectedShapeType ?? "polygon");
  const defaultSelectedShapeRadius = getDefaultShapeRadiusById(selectedShapeType ?? "rectangle");
  const slidesTopTools: Array<{ id: SlidesToolId; label: string; icon: typeof MousePointer2 }> = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "text", label: "Text", icon: Type },
    { id: "frame", label: "Shapes", icon: Square },
    { id: "upload", label: "Upload image", icon: Upload },
    { id: "magic", label: "AI Image", icon: ImageIcon },
    ...(isPagesWorkspace ? [{ id: "paper" as const, label: "Paper", icon: FileText }] : []),
    ...((isSlidesWorkspace || isPagesWorkspace)
      ? [{ id: "icons" as const, label: "Icons", icon: Sticker }]
      : []),
    ...(!isSlidesWorkspace ? [{ id: "grid" as const, label: "Grid", icon: Grid3X3 }] : [])
  ];
  const slidesActionTools: Array<{ id: SlidesToolId; label: string; icon: typeof MousePointer2 }> = [];

  const onShapeFlyoutOptionClick = (shapeId: ShapeInsertId) => {
    const insertedShape = insertShapeIntoActiveCanvas(shapeId);
    if (insertedShape) {
      setSelectedShapeFrameId(insertedShape.shapeFrameId);
      setSelectedShapeType(shapeId);
      setSelectedShapeRoute(insertedShape.route);
      setShapeFillMode(defaultShapeFillMode);
      setShapeFillColor(defaultShapeFillColor);
      setShapeGradientStartColor(defaultShapeGradientStartColor);
      setShapeGradientEndColor(defaultShapeGradientEndColor);
      setShapeGradientAngle(defaultShapeGradientAngle);
      setShapeFillImageSrc(defaultShapeImageFill);
      setShapeFillImageOffsetX(defaultShapeImageOffsetX);
      setShapeFillImageOffsetY(defaultShapeImageOffsetY);
      setShapeStrokeColor(defaultShapeStrokeColor);
      setShapeStrokeWidth(defaultShapeStrokeWidthPx);
      setShapeSides(getDefaultShapeSidesById(shapeId));
      setShapeFillOpacity(defaultShapeOpacity);
      setShapeFillRadius(getDefaultShapeRadiusById(shapeId));
      setShapeRotation(defaultShapeRotation);
      setShapeStrokeOpacity(defaultShapeOpacity);
    }
    setShowShapeFlyout(false);
    setActiveSlidesTool("frame");
    setIsShapePanelVisible(true);
  };

  const onIconFlyoutOptionClick = async (iconName: IconName) => {
    const insertedIcon = await insertIconIntoActiveCanvas(iconName);
    if (insertedIcon) {
      setSelectedShapeFrameId(insertedIcon.iconFrameId);
      setSelectedShapeType("icon");
      setSelectedShapeRoute(insertedIcon.route);
      setShapeStyleRequest(null);
      setShapeFillMode(defaultShapeFillMode);
      setShapeFillColor(defaultIconFillColor);
      setShapeGradientStartColor(defaultShapeGradientStartColor);
      setShapeGradientEndColor(defaultShapeGradientEndColor);
      setShapeGradientAngle(defaultShapeGradientAngle);
      setShapeFillImageSrc(defaultShapeImageFill);
      setShapeFillImageOffsetX(defaultShapeImageOffsetX);
      setShapeFillImageOffsetY(defaultShapeImageOffsetY);
      setShapeStrokeColor(defaultShapeStrokeColor);
      setShapeStrokeWidth(defaultShapeStrokeWidthPx);
      setShapeSides(defaultShapePolygonSides);
      setShapeFillOpacity(defaultShapeOpacity);
      setShapeFillRadius(defaultShapeFillRadius);
      setShapeRotation(defaultShapeRotation);
      setShapeStrokeOpacity(defaultShapeOpacity);
    }
    setShowIconFlyout(false);
    setActiveSlidesTool("icons");
    setIsIconPanelVisible(true);
  };

  const activateSlidesTool = (tool: SlidesToolId) => {
    if (tool !== "frame") {
      setShowShapeFlyout(false);
    }
    if (tool !== "icons") {
      setShowIconFlyout(false);
    }
    if (tool === "move") {
      setActiveSlidesTool("select");
      return;
    }
    if (tool === "frame") {
      const nextOpen = !showShapeFlyout;
      setShowShapeFlyout(nextOpen);
      setShowIconFlyout(false);
      setActiveSlidesTool(nextOpen ? "frame" : "select");
      if (nextOpen) {
        setIsShapePanelVisible(true);
      }
      return;
    }
    if (tool === "icons") {
      const nextOpen = !showIconFlyout;
      setShowIconFlyout(nextOpen);
      setShowShapeFlyout(false);
      setActiveSlidesTool(nextOpen ? "icons" : "select");
      if (nextOpen) {
        setIsIconPanelVisible(true);
      } else {
        setIsIconPanelVisible(false);
      }
      return;
    }
    if (tool === "text") {
      setSelectedShapeFrameId(null);
      setSelectedShapeType(null);
      setSelectedShapeRoute(null);
      setShapeStyleRequest(null);
      setShapeFillMode(defaultShapeFillMode);
      setShapeFillColor(defaultShapeFillColor);
      setShapeGradientStartColor(defaultShapeGradientStartColor);
      setShapeGradientEndColor(defaultShapeGradientEndColor);
      setShapeGradientAngle(defaultShapeGradientAngle);
      setShapeFillImageSrc(defaultShapeImageFill);
      setShapeFillImageOffsetX(defaultShapeImageOffsetX);
      setShapeFillImageOffsetY(defaultShapeImageOffsetY);
      setShapeStrokeColor(defaultShapeStrokeColor);
      setShapeStrokeWidth(defaultShapeStrokeWidthPx);
      setShapeSides(defaultShapePolygonSides);
      setShapeFillOpacity(defaultShapeOpacity);
      setShapeFillRadius(defaultShapeFillRadius);
      setShapeRotation(defaultShapeRotation);
      setShapeStrokeOpacity(defaultShapeOpacity);
      insertTextIntoActiveCanvas();
      setActiveSlidesTool("text");
      setIsCharacterPanelVisible(true);
      return;
    }
    if (tool === "prompt") {
      setShowSlidesPromptModal(true);
      return;
    }
    if (tool === "upload") {
      canvasInsertUploadInputRef.current?.click();
      return;
    }
    if (tool === "grid" && isPagesWorkspace) {
      setShowCanvasGrid((current) => {
        const next = !current;
        if (next && activeSlidesTool !== "select") {
          setActiveSlidesTool("select");
        }
        return next;
      });
      setIsInspectorPanelVisible(true);
      return;
    }
    if (tool === "magic") {
      setShowVisualsMagicModal(true);
      setActiveSlidesTool("magic");
      return;
    }
    if (tool === "paper" && isPagesWorkspace) {
      setShowPagesGenerationModal(true);
      setActiveSlidesTool("paper");
      return;
    }
    setActiveSlidesTool(tool);
  };

  const onSlidesToolClick = (tool: SlidesToolId) => {
    activateSlidesTool(tool);
  };

  useEffect(() => {
    if (!active || !isMagXStudioWorkspace) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (
          target.isContentEditable ||
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          tag === "BUTTON"
        ) {
          return;
        }
      }
      if (showVisualsMagicModal || showPagesGenerationModal || showImageEditModal || showSlidesPromptModal) return;
      const key = event.key.toLowerCase();
      const mappedTool: SlidesToolId | null =
        key === "v"
          ? "select"
          : key === "t"
            ? "text"
            : key === "u"
              ? "upload"
              : key === "i"
                ? "magic"
                : key === "f"
                  ? "frame"
                  : key === "g"
                    ? "grid"
                    : null;
      if (!mappedTool || !isToolAvailableForWorkspace(mappedTool)) return;
      event.preventDefault();
      activateSlidesTool(mappedTool);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, isMagXStudioWorkspace, showVisualsMagicModal, showPagesGenerationModal, showImageEditModal, showSlidesPromptModal, isSlidesWorkspace]);

  return (
    <section className={active ? "block" : "hidden"}>
      {isPagesWorkspace && draftRestoredAt !== null && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 rounded-full border border-white/10 bg-[#0e0e0e]/90 px-5 py-2 text-xs text-white/70 shadow-xl backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <span className="font-mono">
            Draft restored &mdash;{" "}
            {Math.max(1, Math.round((Date.now() - draftRestoredAt) / 60000)) < 2
              ? "just now"
              : `${Math.round((Date.now() - draftRestoredAt) / 60000)}m ago`}
          </span>
          <button
            type="button"
            onClick={() => {
              pagesDraft.clearDraft();
              setSite(null);
              setActivePage("landing");
              setDraftRestoredAt(null);
            }}
            className="text-white/40 underline underline-offset-2 transition hover:text-white/90"
          >
            Discard
          </button>
        </div>
      )}

      <div className="flex h-11 w-full items-center justify-end border-b border-black/70 bg-[#0b0b0b] px-5 md:px-7">
        <div className="flex items-center gap-4">
          {isSlidesWorkspace ? (
            <select
              aria-label="Canvas size"
              title="Canvas size"
              value={slidesCanvasAspect}
              onChange={(event) => {
                const next = event.target.value as SlidesCanvasFormat;
                setSlidesCanvasAspect(next);
                // PPT export/generation supports 16:9 and 4:3; map 3:2 canvas to 16:9 pipeline.
                setPresentationAspectRatio(next === "4:3" ? "4:3" : "16:9");
              }}
              className="h-7 min-w-[180px] border-0 bg-transparent px-0 text-xs text-white/85 focus-visible:outline-none"
            >
              {slidesCanvasAspectOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#141414] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          {isMagXStudioWorkspace ? (
            <div ref={canvasColorPopoverRef} className="relative">
              <button
                type="button"
                aria-label="Canvas color"
                title="Canvas color"
                onClick={() => setShowCanvasColorPicker((current) => !current)}
                disabled={!site}
                className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-white/30 transition hover:border-white/55 disabled:opacity-35"
              >
                <span
                  className="h-3 w-3 rounded-[2px] border border-black/20"
                  style={{ backgroundColor: canvasColor }}
                />
              </button>
              {showCanvasColorPicker && site ? (
                <div className="absolute right-0 top-8 z-50 w-[220px] border border-white/15 bg-[#0f1116] p-2 shadow-[0_14px_32px_rgba(0,0,0,0.48)]">
                  <div
                    className="magx-color-picker mb-2"
                    onPointerDown={() => {
                      canvasColorPickerDraggingRef.current = true;
                    }}
                  >
                    <HexColorPicker color={canvasColor} onChange={previewActiveCanvasColor} />
                  </div>
                  <input
                    type="text"
                    value={canvasColorDraft}
                    onChange={(event) => onCanvasColorDraftChange(event.target.value)}
                    onBlur={commitCanvasColorDraft}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      commitCanvasColorDraft();
                    }}
                    aria-label="Canvas color hex"
                    title="Canvas color hex"
                    className="mb-2 h-7 w-full border border-white/15 bg-[#0a0c10] px-2 text-xs uppercase text-white/90 placeholder:text-white/45 focus-visible:outline-none"
                    placeholder="#FFFFFF"
                  />
                  <div className="grid grid-cols-8 gap-1">
                    {canvasColorSwatches.map((swatch) => {
                      const selected = canvasColor.toLowerCase() === swatch.toLowerCase();
                      return (
                        <button
                          key={swatch}
                          type="button"
                          aria-label={`Set canvas color ${swatch}`}
                          title={swatch}
                          onClick={() => commitActiveCanvasColor(swatch)}
                          className={`h-5 w-5 border transition ${selected ? "border-white" : "border-black/25 hover:border-white/50"
                            }`}
                          style={{ backgroundColor: swatch }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            aria-label="Undo"
            title="Undo"
            onClick={undoCanvasChange}
            disabled={!canUndo}
            className="inline-flex h-5 w-5 items-center justify-center text-white/75 transition hover:text-white disabled:opacity-35"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            title="Redo"
            onClick={redoCanvasChange}
            disabled={!canRedo}
            className="inline-flex h-5 w-5 items-center justify-center text-white/75 transition hover:text-white disabled:opacity-35"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          {isSlidesWorkspace || isPagesWorkspace || site ? (
            <button
              aria-label={
                isSlidesWorkspace ? "Add slide" :
                  isPagesWorkspace ? "Add page" :
                    "Start over"
              }
              title={
                isSlidesWorkspace ? "Add slide" :
                  isPagesWorkspace ? "Add page" :
                    "Start over"
              }
              onClick={() => {
                if (kind === "slides") {
                  appendSlidePage();
                  return;
                }
                if (kind === "pages") {
                  appendPage();
                  return;
                }
                resetWorkspace();
              }}
              className="inline-flex h-5 w-5 items-center justify-center text-white/75 transition hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : null}
          {isMagXStudioWorkspace ? (
            <>
              <button
                aria-label="Send to back"
                title="Send to back"
                onClick={() => reorderSelectedCanvasElements("back")}
                disabled={!site}
                className="inline-flex h-5 w-5 items-center justify-center text-white/75 transition hover:text-white disabled:opacity-35"
              >
                <span className="text-sm leading-none">↓</span>
              </button>
              <button
                aria-label="Bring to front"
                title="Bring to front"
                onClick={() => reorderSelectedCanvasElements("front")}
                disabled={!site}
                className="inline-flex h-5 w-5 items-center justify-center text-white/75 transition hover:text-white disabled:opacity-35"
              >
                <span className="text-sm leading-none">↑</span>
              </button>
            </>
          ) : null}
          <button
            aria-label="Open preview in new tab"
            title="Open preview in new tab"
            onClick={openPreviewInNewTab}
            disabled={!site}
            className="inline-flex h-5 w-5 items-center justify-center text-white/75 transition hover:text-white disabled:opacity-35"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            aria-label="Export zip"
            title="Export zip"
            onClick={exportZip}
            disabled={!site || exporting}
            className="inline-flex h-5 w-5 items-center justify-center text-white/75 transition hover:text-white disabled:opacity-35"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-6 pt-5 md:px-7">
        <input
          ref={canvasUploadInputRef}
          type="file"
          accept="image/*"
          hidden
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void replaceSelectedImage(file);
          }}
        />
        <input
          ref={referenceUploadInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          style={{ display: "none" }}
          onChange={(event) => {
            void addReferenceImagesFromFiles(event.target.files);
            if (referenceUploadInputRef.current) {
              referenceUploadInputRef.current.value = "";
            }
          }}
        />
        <input
          ref={canvasInsertUploadInputRef}
          type="file"
          accept="image/*"
          hidden
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void insertImageIntoActiveCanvas(file);
            if (canvasInsertUploadInputRef.current) {
              canvasInsertUploadInputRef.current.value = "";
            }
          }}
        />
        <input
          ref={canvasReplaceUploadInputRef}
          type="file"
          accept="image/*"
          hidden
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void replaceSelectedCanvasImage(file);
          }}
        />
        <input
          ref={magicSourceUploadInputRef}
          type="file"
          accept="image/*"
          hidden
          style={{ display: "none" }}
          onChange={(event) => {
            void handleMagicSourceUpload(event.target.files?.[0] ?? null);
          }}
        />
        {selectedPreviewImage ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
            <div className="w-full max-w-[560px] bg-[#17181b] p-5">
              <p className="mb-3 text-sm text-white/75">Replace selected image</p>
              <div className="mb-4 max-h-[220px] overflow-hidden bg-black/40">
                <img src={selectedPreviewImage.src} alt="Selected preview" className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPreviewImage(null)}
                  className="px-3 py-2 text-xs text-white/70 transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => canvasUploadInputRef.current?.click()}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-[#eef1f5] px-4 text-xs font-medium text-[#111111] transition hover:bg-[#f7f8fa]"
                >
                  Upload replacement
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {isMagXStudioWorkspace && showVisualsMagicModal ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#121317] p-4">
            <button
              type="button"
              aria-label="Close modal"
              title="Close"
              onClick={closeVisualsMagicModal}
              disabled={magicGenerating}
              className={`absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center transition ${magicGenerating
                ? "cursor-not-allowed text-white/25"
                : "text-white/65 hover:text-white"
                }`}
            >
              X
            </button>
            <div className="w-full max-w-[960px]">
              <Card className="relative w-full bg-[#121317] p-4 md:p-5">
                <p
                  className={`mb-5 text-center text-[24px] leading-tight text-white/85 ${magicGenerating ? "animate-pulse" : ""
                    }`}
                >
                  Generate AI Visuals
                </p>
                <div className="mb-4 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMagicMode("text-to-image")}
                    className={`px-0 py-1 transition ${magicMode === "text-to-image" ? "text-white" : "text-white/50 hover:text-white/80"
                      }`}
                  >
                    Text to Image
                  </button>
                  <span className="text-white/30">|</span>
                  <button
                    type="button"
                    onClick={() => setMagicMode("image-to-image")}
                    className={`px-0 py-1 transition ${magicMode === "image-to-image" ? "text-white" : "text-white/50 hover:text-white/80"
                      }`}
                  >
                    Image to Image
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="space-y-1">
                      <select
                        value={magicAspectRatio}
                        onChange={(event) =>
                          setMagicAspectRatio(event.target.value as NanoBananaAspectRatioSelection)
                        }
                        onBlur={() => setMagicAspectTouched(true)}
                        required
                        className={`h-10 w-full border-0 border-b bg-transparent px-0 text-sm text-white/92 focus-visible:outline-none ${showMagicAspectInvalid
                          ? "border-red-500 focus-visible:border-red-500"
                          : "border-[#5c626f] focus-visible:border-[#8a92a0]"
                          }`}
                      >
                        <option value="" className="bg-[#0d0f13] text-white/60">
                          Select aspect ratio
                        </option>
                        {nanoBananaProAspectRatios.map((ratio) => (
                          <option key={ratio} value={ratio} className="bg-[#0d0f13] text-white">
                            {ratio === "auto" ? "Auto" : ratio}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <Textarea
                    rows={4}
                    className={`min-h-[120px] py-2 leading-5 ${showMagicPromptInvalid
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-[#5c626f] focus-visible:border-[#8a92a0]"
                      }`}
                    placeholder={magicPromptPlaceholder}
                    value={magicPrompt}
                    onChange={(event) => setMagicPrompt(event.target.value)}
                    onBlur={() => setMagicPromptTouched(true)}
                    required
                  />
                  {magicMode === "image-to-image" ? (
                    <div className="space-y-2">
                      {magicSourceImage ? (
                        <img
                          src={magicSourceImage}
                          alt="Source visual"
                          className="h-24 w-full object-cover"
                        />
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-end gap-2">
                    {magicMode === "image-to-image" ? (
                      <button
                        type="button"
                        aria-label="Upload source image"
                        title="Upload source image"
                        onClick={() => {
                          magicSourceUploadInputRef.current?.click();
                        }}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#d4d9e2] transition hover:bg-[#262b36]"
                        style={{ backgroundColor: "#1f232d" }}
                      >
                        <Plus className="h-[22px] w-[22px] stroke-[2.25]" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label="Generate visuals"
                      title="Generate visuals"
                      onClick={() => {
                        void generateMagicVisualAndInsert();
                      }}
                      disabled={!canGenerateMagicVisual}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#111111] transition hover:bg-[#f7f8fa] disabled:text-[#5a606d] disabled:opacity-100"
                      style={{ backgroundColor: canGenerateMagicVisual ? "#eef1f5" : "#d8dde5" }}
                    >
                      {magicGenerating ? (
                        <Loader2 className="h-[25px] w-[25px] animate-spin" />
                      ) : (
                        <ArrowUp className="h-[25px] w-[25px] stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
        {isMagXStudioWorkspace && showPagesGenerationModal ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#121317] p-4">
            <button
              type="button"
              aria-label="Close modal"
              title="Close"
              onClick={closePagesGenerationModal}
              disabled={magicGenerating}
              className={`absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center transition ${magicGenerating
                ? "cursor-not-allowed text-white/25"
                : "text-white/65 hover:text-white"
                }`}
            >
              X
            </button>
            <div className="w-full max-w-[960px]">
              <Card className="relative w-full bg-[#121317] p-4 md:p-5">
                <p
                  className={`mb-5 text-center text-[24px] leading-tight text-white/85 ${magicGenerating ? "animate-pulse" : ""
                    }`}
                >
                  Page Designer
                </p>
                <div className="space-y-4">
                  <label className="space-y-1">
                    <span className="block text-xs text-white/70">Content type</span>
                    <select
                      value={pagesDesignerContentType}
                      onChange={(event) =>
                        setPagesDesignerContentType(event.target.value as PagesDesignerContentType)
                      }
                      className="h-10 w-full border-0 border-b border-[#5c626f] bg-transparent px-0 text-sm text-white/92 focus-visible:border-[#8a92a0] focus-visible:outline-none"
                    >
                      {pagesDesignerContentTypeOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[#0d0f13] text-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Textarea
                    rows={6}
                    className={`min-h-[120px] py-2 leading-5 ${showPagesDesignerTopicInvalid
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-[#5c626f] focus-visible:border-[#8a92a0]"
                      }`}
                    placeholder="What should this page be about? Example: A research-backed 2026 overview of AI agents in healthcare with practical implementation guidance."
                    value={pagesDesignerTopic}
                    onChange={(event) => setPagesDesignerTopic(event.target.value)}
                    required
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      aria-label="Generate page design"
                      title="Generate page design"
                      onClick={() => {
                        void generatePagesDesignAndInsert();
                      }}
                      disabled={!canGeneratePagesDesignerContent}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#111111] transition hover:bg-[#f7f8fa] disabled:text-[#5a606d] disabled:opacity-100"
                      style={{ backgroundColor: canGeneratePagesDesignerContent ? "#eef1f5" : "#d8dde5" }}
                    >
                      {magicGenerating ? (
                        <Loader2 className="h-[25px] w-[25px] animate-spin" />
                      ) : (
                        <ArrowUp className="h-[25px] w-[25px] stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
        {isMagXStudioWorkspace && showImageEditModal ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#121317] p-4">
            <button
              type="button"
              aria-label="Close modal"
              title="Close"
              onClick={closeImageEditModal}
              disabled={magicGenerating}
              className={`absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center transition ${magicGenerating
                ? "cursor-not-allowed text-white/25"
                : "text-white/65 hover:text-white"
                }`}
            >
              X
            </button>
            <div className="w-full max-w-[960px]">
              <Card className="relative w-full bg-[#121317] p-4 md:p-5">
                <p
                  className={`mb-5 text-center text-[24px] leading-tight text-white/85 ${magicGenerating ? "animate-pulse" : ""
                    }`}
                >
                  AI Edit
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="space-y-1">
                      <select
                        value={magicAspectRatio}
                        onChange={(event) =>
                          setMagicAspectRatio(event.target.value as NanoBananaAspectRatioSelection)
                        }
                        onBlur={() => setMagicAspectTouched(true)}
                        required
                        className={`h-10 w-full border-0 border-b bg-transparent px-0 text-sm text-white/92 focus-visible:outline-none ${showMagicAspectInvalid
                          ? "border-red-500 focus-visible:border-red-500"
                          : "border-[#5c626f] focus-visible:border-[#8a92a0]"
                          }`}
                      >
                        <option value="" className="bg-[#0d0f13] text-white/60">
                          Select aspect ratio
                        </option>
                        {nanoBananaProAspectRatios.map((ratio) => (
                          <option key={ratio} value={ratio} className="bg-[#0d0f13] text-white">
                            {ratio}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <Textarea
                    rows={4}
                    className={`min-h-[120px] py-2 leading-5 ${showMagicPromptInvalid
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-[#5c626f] focus-visible:border-[#8a92a0]"
                      }`}
                    placeholder="Describe your edit (e.g., remove the background and brighten the subject)."
                    value={magicPrompt}
                    onChange={(event) => setMagicPrompt(event.target.value)}
                    onBlur={() => setMagicPromptTouched(true)}
                    required
                  />
                  <div className="space-y-2">
                    {magicSourceImage ? (
                      <img
                        src={magicSourceImage}
                        alt="Source visual"
                        className="h-24 w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      aria-label="Generate visuals"
                      title="Generate visuals"
                      onClick={() => {
                        void generateMagicVisualAndInsert();
                      }}
                      disabled={!canGenerateMagicVisual}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#111111] transition hover:bg-[#f7f8fa] disabled:text-[#5a606d] disabled:opacity-100"
                      style={{ backgroundColor: canGenerateMagicVisual ? "#eef1f5" : "#d8dde5" }}
                    >
                      {magicGenerating ? (
                        <Loader2 className="h-[25px] w-[25px] animate-spin" />
                      ) : (
                        <ArrowUp className="h-[25px] w-[25px] stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
        {isMagXStudioWorkspace && showSlidesPromptModal ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
            <div className="w-full max-w-[980px] bg-[#121214] p-4 md:p-5">
              <PromptForm
                values={values}
                onChange={setValues}
                onSubmit={async () => {
                  await generate();
                }}
                onAddImages={addReferenceImages}
                imageCount={referenceImages.length}
                loading={loading}
                presentationAspectRatio={undefined}
                onPresentationAspectRatioChange={
                  undefined
                }
                presentationDeckType={isSlidesWorkspace ? presentationDeckType : undefined}
                onPresentationDeckTypeChange={
                  isSlidesWorkspace ? setPresentationDeckType : undefined
                }
                showIndustryField={false}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSlidesPromptModal(false)}
                  className="px-3 py-1.5 text-xs text-white/70 transition hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>
        ) : null}

        {!showWorkspaceLayout ? (
          <div className="flex min-h-[calc(100vh-180px)] items-center">
            <div className="mx-auto w-full max-w-[960px]">
              <p className={`mb-5 text-center text-[24px] leading-tight text-white/75 ${loading ? "animate-pulse" : ""}`}>Hello ({userName})</p>
              <Card className="p-4 md:p-5">
                <PromptForm
                  values={values}
                  onChange={setValues}
                  onSubmit={generate}
                  onAddImages={addReferenceImages}
                  imageCount={referenceImages.length}
                  loading={loading}
                  showIndustryField
                  showThemeField={kind === "websites" || kind === "visuals"}
                  showVisualFields={kind === "visuals"}
                />
              </Card>
            </div>
          </div>
        ) : isMagXStudioWorkspace ? (
          <div
            className={`grid min-h-[80vh] grid-cols-1 gap-4 ${isSlidesWorkspace || isPagesWorkspace
              ? "md:grid-cols-[44px_1fr] xl:grid-cols-[44px_1fr_250px]"
              : "lg:grid-cols-[44px_1fr_250px]"
              }`}
          >
            <div
              className="flex h-full flex-col items-center justify-between py-2"
              onPointerDownCapture={() => {
                clearCanvasSelection();
              }}
            >
              <div className="flex flex-col items-center gap-3">
                {slidesTopTools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive =
                    tool.id === "upload"
                      ? false
                      : tool.id === "grid"
                        ? showCanvasGrid
                        : activeSlidesTool === tool.id;
                  const buttonClass = `inline-flex h-7 w-7 items-center justify-center transition ${isActive ? "text-white" : "text-white/55 hover:text-white/92"
                    }`;
                  if (tool.id === "frame") {
                    return (
                      <div key={tool.id} className="relative" ref={shapeFlyoutRef}>
                        <button
                          type="button"
                          aria-label={tool.label}
                          title={`${tool.label}${toolShortcutById[tool.id] ? ` (${toolShortcutById[tool.id]})` : ""}`}
                          onClick={() => onSlidesToolClick(tool.id)}
                          className={buttonClass}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                        {showShapeFlyout ? (
                          <div className="absolute left-9 top-1/2 z-30 w-12 -translate-y-1/2 rounded-xl border border-white/10 bg-[#0f1116]/95 p-1 shadow-[0_14px_32px_rgba(0,0,0,0.48)] backdrop-blur">
                            <div className="flex flex-col items-center gap-1">
                              {commonShapeOptions.map((shape) => (
                                <button
                                  key={shape.id}
                                  type="button"
                                  aria-label={`Add ${shape.label}`}
                                  title={`Add ${shape.label}`}
                                  onClick={() => onShapeFlyoutOptionClick(shape.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white"
                                >
                                  <ShapeLineIcon shapeId={shape.id} className="h-4 w-4" />
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  if (tool.id === "icons") {
                    return (
                      <div key={tool.id} className="relative" ref={iconFlyoutRef}>
                        <button
                          type="button"
                          aria-label={tool.label}
                          title={`${tool.label}${toolShortcutById[tool.id] ? ` (${toolShortcutById[tool.id]})` : ""}`}
                          onClick={() => onSlidesToolClick(tool.id)}
                          className={buttonClass}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                        {showIconFlyout ? (
                          <div className="absolute left-9 top-1/2 z-30 w-[260px] -translate-y-1/2 rounded-xl border border-white/10 bg-[#0f1116]/95 p-2 shadow-[0_14px_32px_rgba(0,0,0,0.48)] backdrop-blur">
                            <div className="mb-2 flex items-center gap-2">
                              <input
                                type="text"
                                value={iconFlyoutQuery}
                                onChange={(event) => {
                                  setIconFlyoutQuery(event.target.value);
                                  setIconFlyoutVisibleCount(iconFlyoutPageSize);
                                }}
                                placeholder="Search icons"
                                aria-label="Search Lucide icons"
                                title="Search Lucide icons"
                                className="h-8 w-full rounded-md border border-white/10 bg-[#0a0c10] px-2 text-[11px] text-white/85 placeholder:text-white/35 focus-visible:outline-none"
                              />
                            </div>
                            <p className="mb-2 text-[10px] text-white/45">
                              {visibleLucideIconNames.length}/{filteredLucideIconNames.length}
                            </p>
                            <div className="max-h-[310px] overflow-y-auto pr-1">
                              <div className="grid grid-cols-5 gap-1">
                                {visibleLucideIconNames.map((iconName) => {
                                  const iconLabel = formatIconLabel(iconName);
                                  return (
                                    <button
                                      key={iconName}
                                      type="button"
                                      aria-label={`Add ${iconLabel}`}
                                      title={`Add ${iconLabel}`}
                                      onClick={() => {
                                        void onIconFlyoutOptionClick(iconName);
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white"
                                    >
                                      <DynamicIcon name={iconName} className="h-4 w-4" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            {hasMoreLucideIcons ? (
                              <button
                                type="button"
                                aria-label="Load more icons"
                                title="Load more icons"
                                onClick={() =>
                                  setIconFlyoutVisibleCount(
                                    (count) => count + iconFlyoutPageSize
                                  )
                                }
                                className="mt-2 inline-flex h-7 w-full items-center justify-center rounded-md border border-white/10 text-[11px] text-white/72 transition hover:bg-white/10 hover:text-white"
                              >
                                Load more
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      aria-label={tool.label}
                      title={`${tool.label}${toolShortcutById[tool.id] ? ` (${toolShortcutById[tool.id]})` : ""}`}
                      onClick={() => onSlidesToolClick(tool.id)}
                      className={buttonClass}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col items-center gap-2">
                {slidesActionTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      aria-label={tool.label}
                      title={`${tool.label}${toolShortcutById[tool.id] ? ` (${toolShortcutById[tool.id]})` : ""}`}
                      onClick={() => onSlidesToolClick(tool.id)}
                      className="inline-flex h-7 w-7 items-center justify-center text-white/55 transition hover:text-white/92"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
                <div className="text-[10px] text-white/40">
                  {referenceImages.length > 0 ? `${referenceImages.length} img` : ""}
                </div>
              </div>
            </div>

            <div className="relative" ref={canvasWorkspaceRef}>
              <Card
                className="min-h-[80vh] overflow-hidden bg-[#0f1114] p-0"
                onPointerDownCapture={(event) => {
                  if (event.target instanceof HTMLIFrameElement) return;
                  clearCanvasSelection();
                }}
              >
                <PreviewTabs
                  site={site}
                  activePage={activePage}
                  workspaceId={kind}
                  canvasAspect={isSlidesWorkspace ? slidesCanvasAspect : pagesCanvasSize}
                  customCanvasWidth={isPagesWorkspace ? resolvedCustomCanvasSize?.width ?? null : null}
                  customCanvasHeight={isPagesWorkspace ? resolvedCustomCanvasSize?.height ?? null : null}
                  showGridOverlay={isPagesWorkspace && showCanvasGrid}
                  gridPreset={canvasGridPreset}
                  activeSlidesTool={activeSlidesTool}
                  clearSelectionSignal={clearSelectionSignal}
                  textFontRequest={textFontRequest}
                  shapeStyleRequest={shapeStyleRequest}
                  imageStyleRequest={imageStyleRequest}
                  layerOrderCommand={layerOrderCommand}
                  referenceImages={referenceImages}
                />
              </Card>
              <ImageEngine
                visible={showImagePanel}
                onClose={() => {
                  setIsImagePanelVisible(false);
                  setActiveSlidesTool("select");
                }}
                position={imagePanelPosition ?? { x: 16, y: 16 }}
                onPositionChange={setImagePanelPosition}
                boundsRef={canvasWorkspaceRef}
                selectedImageSrc={selectedImageSrc}
                brightness={imageBrightness}
                saturation={imageSaturation}
                imageOffsetX={imageOffsetX}
                imageOffsetY={imageOffsetY}
                filterPreset={imageFilterPreset}
                onBrightnessChange={onImageBrightnessChange}
                onBrightnessCommit={onImageBrightnessCommit}
                onSaturationChange={onImageSaturationChange}
                onSaturationCommit={onImageSaturationCommit}
                onImageOffsetXChange={onImageOffsetXChange}
                onImageOffsetXCommit={onImageOffsetXCommit}
                onImageOffsetYChange={onImageOffsetYChange}
                onImageOffsetYCommit={onImageOffsetYCommit}
                onFilterPresetChange={onImageFilterPresetChange}
                onReplaceClick={() => canvasReplaceUploadInputRef.current?.click()}
                onImageEditClick={() => {
                  setMagicMode("image-to-image");
                  setMagicSourceImage(selectedImageSrc);
                  setMagicPromptTouched(false);
                  setMagicAspectTouched(false);
                  setMagicSubmitAttempted(false);
                  setShowImageEditModal(true);
                }}
                onDownloadClick={() => {
                  void downloadSelectedCanvasImage();
                }}
                canDownload={canDownloadSelectedImage}
                controlsDisabled={!selectedImageFrameId}
              />
              <ShapeEngine
                visible={showShapePanel}
                onClose={() => {
                  setIsShapePanelVisible(false);
                  setShowShapeFlyout(false);
                  setActiveSlidesTool("select");
                }}
                panelTitle="Shapes"
                position={shapePanelPosition ?? { x: 16, y: 16 }}
                onPositionChange={setShapePanelPosition}
                boundsRef={canvasWorkspaceRef}
                fillMode={shapeFillMode}
                fillColor={shapeFillColor}
                gradientStartColor={shapeGradientStartColor}
                gradientEndColor={shapeGradientEndColor}
                gradientAngle={shapeGradientAngle}
                fillImageSrc={shapeFillImageSrc}
                fillImageOffsetX={shapeFillImageOffsetX}
                fillImageOffsetY={shapeFillImageOffsetY}
                strokeColor={shapeStrokeColor}
                strokeWidth={shapeStrokeWidth}
                shapeSides={shapeSides}
                fillOpacity={shapeFillOpacity}
                fillRadius={shapeFillRadius}
                rotation={shapeRotation}
                strokeOpacity={shapeStrokeOpacity}
                onFillModeChange={onShapeFillModeChange}
                onFillColorChange={onShapeFillColorChange}
                onGradientStartColorChange={onShapeGradientStartColorChange}
                onGradientEndColorChange={onShapeGradientEndColorChange}
                onGradientAngleChange={onShapeGradientAngleChange}
                onGradientAngleCommit={onShapeGradientAngleCommit}
                onFillImageUpload={onShapeFillImageUpload}
                onFillImageClear={onShapeFillImageClear}
                onFillImageOffsetXChange={onShapeFillImageOffsetXChange}
                onFillImageOffsetXCommit={onShapeFillImageOffsetXCommit}
                onFillImageOffsetYChange={onShapeFillImageOffsetYChange}
                onFillImageOffsetYCommit={onShapeFillImageOffsetYCommit}
                onStrokeColorChange={onShapeStrokeColorChange}
                onStrokeWidthChange={onShapeStrokeWidthChange}
                onShapeSidesChange={onShapeSidesChange}
                onShapeSidesCommit={onShapeSidesCommit}
                onFillOpacityChange={onShapeFillOpacityChange}
                onFillOpacityCommit={onShapeFillOpacityCommit}
                onFillRadiusChange={onShapeFillRadiusChange}
                onFillRadiusCommit={onShapeFillRadiusCommit}
                onRotationChange={onShapeRotationChange}
                onRotationCommit={onShapeRotationCommit}
                onStrokeWidthCommit={onShapeStrokeWidthCommit}
                onStrokeOpacityChange={onShapeStrokeOpacityChange}
                onStrokeOpacityCommit={onShapeStrokeOpacityCommit}
                controlsDisabled={!selectedShapeFrameId || isIconSelection}
                radiusDisabled={!canAdjustSelectedShapeCornerRadius}
                sidesDisabled={!canAdjustSelectedShapeSides}
                sidesVisible={canAdjustSelectedShapeSides}
                defaultFillRadius={defaultSelectedShapeRadius}
                defaultShapeSides={defaultSelectedShapeSides}
              />
              <ShapeEngine
                visible={showIconPanel}
                onClose={() => {
                  setIsIconPanelVisible(false);
                  setShowIconFlyout(false);
                  setActiveSlidesTool("select");
                }}
                panelTitle="Icons"
                position={iconPanelPosition ?? { x: 16, y: 16 }}
                onPositionChange={setIconPanelPosition}
                boundsRef={canvasWorkspaceRef}
                fillMode={shapeFillMode}
                fillColor={shapeFillColor}
                gradientStartColor={shapeGradientStartColor}
                gradientEndColor={shapeGradientEndColor}
                gradientAngle={shapeGradientAngle}
                fillImageSrc={shapeFillImageSrc}
                fillImageOffsetX={shapeFillImageOffsetX}
                fillImageOffsetY={shapeFillImageOffsetY}
                strokeColor={shapeStrokeColor}
                strokeWidth={shapeStrokeWidth}
                shapeSides={shapeSides}
                fillOpacity={shapeFillOpacity}
                fillRadius={shapeFillRadius}
                rotation={shapeRotation}
                strokeOpacity={shapeStrokeOpacity}
                onFillModeChange={onShapeFillModeChange}
                onFillColorChange={onShapeFillColorChange}
                onGradientStartColorChange={onShapeGradientStartColorChange}
                onGradientEndColorChange={onShapeGradientEndColorChange}
                onGradientAngleChange={onShapeGradientAngleChange}
                onGradientAngleCommit={onShapeGradientAngleCommit}
                onFillImageUpload={onShapeFillImageUpload}
                onFillImageClear={onShapeFillImageClear}
                onFillImageOffsetXChange={onShapeFillImageOffsetXChange}
                onFillImageOffsetXCommit={onShapeFillImageOffsetXCommit}
                onFillImageOffsetYChange={onShapeFillImageOffsetYChange}
                onFillImageOffsetYCommit={onShapeFillImageOffsetYCommit}
                onStrokeColorChange={onShapeStrokeColorChange}
                onStrokeWidthChange={onShapeStrokeWidthChange}
                onShapeSidesChange={onShapeSidesChange}
                onShapeSidesCommit={onShapeSidesCommit}
                onFillOpacityChange={onShapeFillOpacityChange}
                onFillOpacityCommit={onShapeFillOpacityCommit}
                onFillRadiusChange={onShapeFillRadiusChange}
                onFillRadiusCommit={onShapeFillRadiusCommit}
                onRotationChange={onShapeRotationChange}
                onRotationCommit={onShapeRotationCommit}
                onStrokeWidthCommit={onShapeStrokeWidthCommit}
                onStrokeOpacityChange={onShapeStrokeOpacityChange}
                onStrokeOpacityCommit={onShapeStrokeOpacityCommit}
                controlsDisabled={!selectedShapeFrameId || !isIconSelection}
                radiusDisabled={!canAdjustSelectedShapeCornerRadius}
                sidesDisabled={!canAdjustSelectedShapeSides}
                sidesVisible={canAdjustSelectedShapeSides}
                defaultFillRadius={defaultSelectedShapeRadius}
                defaultShapeSides={defaultSelectedShapeSides}
              />
              <TextEngine
                visible={showCharacterPanel}
                onClose={() => {
                  setIsCharacterPanelVisible(false);
                  setActiveSlidesTool("select");
                }}
                position={characterPanelPosition ?? { x: 16, y: 16 }}
                onPositionChange={setCharacterPanelPosition}
                boundsRef={canvasWorkspaceRef}
                fontOptions={fontCatalog}
                selectedFont={characterFontFamily}
                onFontChange={onCharacterFontChange}
                selectedWeight={characterFontWeight}
                weightOptions={currentFontWeightOptions}
                onWeightChange={onCharacterFontWeightChange}
                selectedSize={characterFontSize}
                sizeOptions={currentFontSizeOptions}
                onSizeChange={onCharacterFontSizeChange}
                selectedColor={characterTextColor}
                onColorChange={onCharacterTextColorChange}
                onColorReset={onCharacterTextColorReset}
                selectedTextDecorationStyle={characterTextDecorationStyle}
                onTextDecorationStyleChange={onCharacterTextDecorationStyleChange}
                selectedAlignment={characterTextAlign}
                onAlignmentChange={onCharacterTextAlignChange}
                selectedLineHeight={characterLineHeight}
                lineHeightOptions={currentLineHeightOptions}
                onLineHeightChange={onCharacterLineHeightChange}
                selectedWordSpacing={characterWordSpacing}
                wordSpacingOptions={currentWordSpacingOptions}
                onWordSpacingChange={onCharacterWordSpacingChange}
                selectedCharacterSpacing={characterSpacing}
                characterSpacingOptions={currentCharacterSpacingOptions}
                onCharacterSpacingChange={onCharacterSpacingChange}
                selectedBulletListStyle={characterBulletListStyle}
                bulletListStyleOptions={currentBulletListStyleOptions}
                onBulletListStyleChange={onCharacterBulletListStyleChange}
                selectedNumberedListStyle={characterNumberedListStyle}
                numberedListStyleOptions={currentNumberedListStyleOptions}
                onNumberedListStyleChange={onCharacterNumberedListStyleChange}
                onBulletListClear={onCharacterBulletListClear}
                fontDisabled={!selectedTextFrameId}
              />
              <InspectorPanel
                visible={showInspectorPanel}
                onClose={() => setIsInspectorPanelVisible(false)}
                position={
                  inspectorPanelPosition ?? {
                    x: Math.max(
                      inspectorPanelDefaultOffset,
                      (canvasWorkspaceRef.current?.clientWidth ?? 0) -
                      inspectorPanelWidth -
                      inspectorPanelDefaultOffset
                    ),
                    y: inspectorPanelDefaultOffset
                  }
                }
                onPositionChange={setInspectorPanelPosition}
                boundsRef={canvasWorkspaceRef}
                canvasSize={pagesCanvasSize}
                canvasSizeGroups={pagesCanvasSizeGroups}
                onCanvasSizeChange={(size) => setPagesCanvasSize(size as PagesCanvasFormat)}
                customWidth={customCanvasWidth}
                customHeight={customCanvasHeight}
                onCustomWidthChange={setCustomCanvasWidth}
                onCustomHeightChange={setCustomCanvasHeight}
                gridPreset={canvasGridPreset}
                gridPresetOptions={canvasGridPresetOptions}
                onGridPresetChange={(preset) => setCanvasGridPreset(preset as CanvasGridPreset)}
              />
            </div>

            <Card
              className={`min-h-[80vh] space-y-2 bg-[#101216] p-4 ${isSlidesWorkspace || isPagesWorkspace ? "md:col-span-2 xl:col-span-1" : ""
                }`}
              onPointerDownCapture={() => {
                clearCanvasSelection();
              }}
            >
              {pagesPreview.length ? (
                <ul className="space-y-2">
                  {pagesPreview.map((page) => (
                    <li
                      key={page.key}
                      className={`cursor-pointer p-2 transition ${activePage === page.key ? "bg-white/10" : "bg-white/0"}`}
                      onClick={() => setActivePage(page.key)}
                    >
                      <div className="relative mb-2 overflow-hidden">
                        <iframe
                          title={`${page.key}-thumbnail`}
                          className="h-20 w-full border-0 bg-white pointer-events-none"
                          sandbox="allow-same-origin allow-scripts"
                          loading="lazy"
                          srcDoc={page.srcDoc}
                        />
                        {isMagXStudioWorkspace ? (
                          <button
                            type="button"
                            aria-label={`Delete ${page.label}`}
                            title={`Delete ${page.label}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteSlidePage(page.key);
                            }}
                            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center bg-black/55 text-white/85 transition hover:bg-black/80 hover:text-white"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3 shrink-0" />
                        <input
                          type="text"
                          aria-label={`Rename ${page.label}`}
                          title={`Rename ${page.label}`}
                          value={getThumbnailDisplayTitle(page.key, page.title, page.label)}
                          placeholder={page.label}
                          onChange={(event) => updateThumbnailTitleDraft(page.key, event.target.value)}
                          onBlur={(event) =>
                            commitThumbnailTitleDraft(page.key, page.label, event.currentTarget.value)
                          }
                          onClick={(event) => event.stopPropagation()}
                          onFocus={() => setActivePage(page.key)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitThumbnailTitleDraft(page.key, page.label, event.currentTarget.value);
                              event.currentTarget.blur();
                              return;
                            }
                            if (event.key === "Escape") {
                              event.preventDefault();
                              discardThumbnailTitleDraft(page.key);
                              event.currentTarget.blur();
                            }
                          }}
                          className="h-5 w-full border-0 bg-transparent p-0 text-xs font-medium text-white/90 placeholder:text-white/50 focus-visible:outline-none"
                        />
                      </div>
                      <p className="line-clamp-2 text-[10px] text-white/55">{page.label}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: isSlidesWorkspace || isPagesWorkspace ? 1 : 4 }).map((_, index) => (
                    <div key={`placeholder-slide-${index}`} className="bg-white/[0.04] p-2">
                      <div className="h-20 w-full bg-white/[0.06]" />
                      <div className="mt-2 h-2 w-1/2 bg-white/[0.08]" />
                      <div className="mt-1 h-2 w-2/3 bg-white/[0.06]" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="grid min-h-[80vh] grid-cols-1 gap-4 md:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_250px]">
            <div className="flex h-full items-end">
              <Card className="w-full p-4">
                <PromptForm
                  values={values}
                  onChange={setValues}
                  onSubmit={generate}
                  onAddImages={addReferenceImages}
                  imageCount={referenceImages.length}
                  loading={loading}
                  showIndustryField
                  showThemeField={kind === "websites" || kind === "visuals"}
                  showVisualFields={kind === "visuals"}
                />
              </Card>
            </div>

            <Card
              className="overflow-hidden p-0"
              onPointerDownCapture={(event) => {
                if (event.target instanceof HTMLIFrameElement) return;
                clearCanvasSelection();
              }}
            >
              <PreviewTabs
                site={site}
                activePage={activePage}
                workspaceId={kind}
                canvasAspect="16:9"
                activeSlidesTool={activeSlidesTool}
                shapeStyleRequest={shapeStyleRequest}
                imageStyleRequest={imageStyleRequest}
                layerOrderCommand={layerOrderCommand}
                referenceImages={referenceImages}
              />
            </Card>

            <Card className="space-y-2 p-4 md:col-span-2 xl:col-span-1">
              <ul className="space-y-2">
                {pagesPreview.map((page) => (
                  <li
                    key={page.key}
                    className={`cursor-pointer p-2 transition ${activePage === page.key ? "bg-white/10" : "bg-white/0"}`}
                    onClick={() => setActivePage(page.key)}
                  >
                    <div className="relative mb-2 overflow-hidden">
                      <iframe
                        title={`${page.key}-thumbnail`}
                        className="h-20 w-full border-0 bg-white pointer-events-none"
                        sandbox="allow-same-origin allow-scripts"
                        loading="lazy"
                        srcDoc={page.srcDoc}
                      />
                      {isMagXStudioWorkspace ? (
                        <button
                          type="button"
                          aria-label={`Delete ${page.label}`}
                          title={`Delete ${page.label}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteSlidePage(page.key);
                          }}
                          className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center bg-black/55 text-white/85 transition hover:bg-black/80 hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs font-medium">
                      <ImageIcon className="mr-1 inline h-3 w-3" />
                      {page.label}
                    </p>
                    <p className="line-clamp-2 text-[10px] text-white/55">{page.title}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
