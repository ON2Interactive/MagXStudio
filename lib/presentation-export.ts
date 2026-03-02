import PptxGenJS from "pptxgenjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { GeneratedSiteContract, PresentationAspectRatio } from "@/lib/types";

const canvasWidthPx = 1320;
const defaultCanvasTextWidthPx = 554;
const defaultCanvasTextHeightPx = 140;
const defaultCanvasImageWidthPx = 607;
const defaultCanvasImageHeightPx = 360;

type CanvasTextFrame = {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
  text: string;
  fontFace: string;
  fontSizePt: number;
  bold: boolean;
  colorHex: string;
  align: "left" | "center" | "right";
  lineHeightMultiple: number;
};

type CanvasImageFrame = {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
  src: string;
};

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseStyleMap(style: string): Record<string, string> {
  return style
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const sep = entry.indexOf(":");
      if (sep <= 0) return acc;
      const key = entry.slice(0, sep).trim().toLowerCase();
      const value = entry.slice(sep + 1).trim();
      if (!key) return acc;
      acc[key] = value;
      return acc;
    }, {});
}

function getAttr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return match?.[1]?.trim() ?? "";
}

function hasClass(tag: string, className: string): boolean {
  const classAttr = getAttr(tag, "class");
  if (!classAttr) return false;
  return classAttr.split(/\s+/).includes(className);
}

function findMatchingClosingDiv(
  html: string,
  fromIndex: number
): { closeStart: number; closeEnd: number } | null {
  const divTagRegex = /<\/?div\b[^>]*>/gi;
  divTagRegex.lastIndex = fromIndex;
  let depth = 1;
  while (true) {
    const match = divTagRegex.exec(html);
    if (!match) return null;
    const token = match[0];
    const isClose = token.startsWith("</");
    depth += isClose ? -1 : 1;
    if (depth === 0) {
      return {
        closeStart: match.index,
        closeEnd: divTagRegex.lastIndex
      };
    }
  }
}

function extractDivBlocksByClass(
  html: string,
  className: string
): Array<{ openTag: string; innerHtml: string }> {
  const blocks: Array<{ openTag: string; innerHtml: string }> = [];
  let scanIndex = 0;
  while (scanIndex < html.length) {
    const openStart = html.indexOf("<div", scanIndex);
    if (openStart < 0) break;
    const openEnd = html.indexOf(">", openStart);
    if (openEnd < 0) break;
    const openTag = html.slice(openStart, openEnd + 1);
    if (!hasClass(openTag, className)) {
      scanIndex = openEnd + 1;
      continue;
    }
    const closing = findMatchingClosingDiv(html, openEnd + 1);
    if (!closing) {
      scanIndex = openEnd + 1;
      continue;
    }
    blocks.push({
      openTag,
      innerHtml: html.slice(openEnd + 1, closing.closeStart)
    });
    scanIndex = closing.closeEnd;
  }
  return blocks;
}

function parseCssSize(value: string, total: number): number | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  if (raw.endsWith("px")) {
    const parsed = Number.parseFloat(raw.slice(0, -2));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (raw.endsWith("%")) {
    const parsed = Number.parseFloat(raw.slice(0, -1));
    return Number.isFinite(parsed) ? (total * parsed) / 100 : null;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRectPx(rect: {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}): { leftPx: number; topPx: number; widthPx: number; heightPx: number } {
  const widthPx = Math.max(1, Math.min(canvasWidthPx, rect.widthPx));
  const leftPx = Math.max(0, Math.min(canvasWidthPx - widthPx, rect.leftPx));
  const heightPx = Math.max(1, rect.heightPx);
  const topPx = Math.max(0, rect.topPx);
  return { leftPx, topPx, widthPx, heightPx };
}

function resolveFrameRectPx(
  styleMap: Record<string, string>,
  canvasHeightPx: number,
  fallbackWidthPx: number,
  fallbackHeightPx: number
): { leftPx: number; topPx: number; widthPx: number; heightPx: number } {
  const widthPx = parseCssSize(styleMap.width || "", canvasWidthPx) ?? fallbackWidthPx;
  const heightPx = parseCssSize(styleMap.height || "", canvasHeightPx) ?? fallbackHeightPx;
  let leftPx = parseCssSize(styleMap.left || "", canvasWidthPx);
  let topPx = parseCssSize(styleMap.top || "", canvasHeightPx);
  if (leftPx === null) leftPx = (canvasWidthPx - widthPx) / 2;
  if (topPx === null) topPx = (canvasHeightPx - heightPx) / 2;

  const transform = (styleMap.transform || "").toLowerCase();
  if (transform.includes("translate(-50%") || transform.includes("translate(-50%, -50%")) {
    leftPx -= widthPx / 2;
    topPx -= heightPx / 2;
  }

  return normalizeRectPx({ leftPx, topPx, widthPx, heightPx });
}

function stripHtmlToText(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

function rgbToHex(raw: string): string | null {
  const match = raw.match(
    /rgba?\(\s*([0-9]{1,3})(?:\s*,|\s+)\s*([0-9]{1,3})(?:\s*,|\s+)\s*([0-9]{1,3})/i
  );
  if (!match) return null;
  const r = Math.max(0, Math.min(255, Number.parseInt(match[1], 10)));
  const g = Math.max(0, Math.min(255, Number.parseInt(match[2], 10)));
  const b = Math.max(0, Math.min(255, Number.parseInt(match[3], 10)));
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function normalizeHexColor(raw: string, fallback = "#D9DADF"): string {
  const color = raw.trim();
  const shortHex = color.match(/^#([0-9a-fA-F]{3})$/);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const fullHex = color.match(/^#([0-9a-fA-F]{6})$/);
  if (fullHex) return `#${fullHex[1].toUpperCase()}`;
  const rgbHex = rgbToHex(color);
  if (rgbHex) return rgbHex;
  return fallback;
}

function parsePtSize(raw: string, fallback: number): number {
  const match = raw.trim().match(/^(-?[0-9]+(?:\.[0-9]+)?)(pt|px)?$/i);
  if (!match) return fallback;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  if ((match[2] || "").toLowerCase() === "px") return value * 0.75;
  return value;
}

function parseLineHeight(raw: string): number {
  const value = raw.trim();
  if (!value) return 1.25;
  if (value.endsWith("%")) {
    const parsed = Number.parseFloat(value.slice(0, -1));
    if (Number.isFinite(parsed) && parsed > 0) return parsed / 100;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 1.25;
  if (numeric > 3) return numeric / 100;
  return numeric;
}

function extractCanvasColor(css: string): string {
  const markerMatch = css.match(/--fx-canvas-color:\s*([^;]+);/i);
  if (markerMatch?.[1]) return normalizeHexColor(markerMatch[1], "#0F0F10");
  const bodyMatch = css.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})\b/i);
  if (bodyMatch?.[1]) return normalizeHexColor(bodyMatch[1], "#0F0F10");
  return "#0F0F10";
}

function extractCanvasTextFrames(
  page: GeneratedSiteContract["pages"][string],
  canvasHeightPx: number
): CanvasTextFrame[] {
  const frames = extractDivBlocksByClass(page.html, "fx-text-frame");
  const parsed: CanvasTextFrame[] = [];
  for (const frame of frames) {
    const frameStyle = parseStyleMap(getAttr(frame.openTag, "style"));
    const rect = resolveFrameRectPx(
      frameStyle,
      canvasHeightPx,
      defaultCanvasTextWidthPx,
      defaultCanvasTextHeightPx
    );
    const contents = extractDivBlocksByClass(frame.innerHtml, "fx-text-content");
    if (!contents.length) continue;
    const contentBlock = contents[0];
    const contentTag = contentBlock.openTag;
    const contentStyle = parseStyleMap(getAttr(contentTag, "style"));
    const text = stripHtmlToText(contentBlock.innerHtml);
    if (!text) continue;
    const fontFace =
      getAttr(contentTag, "data-fx-font-family") ||
      contentStyle["font-family"] ||
      "Aptos";
    const fontWeightRaw =
      getAttr(contentTag, "data-fx-font-weight") || contentStyle["font-weight"] || "400";
    const fontWeight = Number.parseInt(fontWeightRaw, 10);
    const bold = Number.isFinite(fontWeight) ? fontWeight >= 600 : /bold/i.test(fontWeightRaw);
    const fontSizeRaw = getAttr(contentTag, "data-fx-font-size") || contentStyle["font-size"] || "24pt";
    const fontSizePt = parsePtSize(fontSizeRaw, 24);
    const colorRaw = getAttr(contentTag, "data-fx-text-color") || contentStyle.color || "#D9DADF";
    const colorHex = normalizeHexColor(colorRaw, "#D9DADF").replace("#", "");
    const alignRaw = (
      getAttr(contentTag, "data-fx-text-align") ||
      contentStyle["text-align"] ||
      "left"
    ).toLowerCase();
    const align: "left" | "center" | "right" =
      alignRaw === "center" ? "center" : alignRaw === "right" ? "right" : "left";
    const lineHeightRaw = getAttr(contentTag, "data-fx-line-height") || contentStyle["line-height"] || "125%";
    parsed.push({
      leftPx: rect.leftPx,
      topPx: rect.topPx,
      widthPx: rect.widthPx,
      heightPx: rect.heightPx,
      text,
      fontFace,
      fontSizePt: Math.max(8, Math.min(120, fontSizePt)),
      bold,
      colorHex,
      align,
      lineHeightMultiple: Math.max(1, Math.min(3, parseLineHeight(lineHeightRaw)))
    });
  }
  return parsed;
}

function extractCanvasImageFrames(
  page: GeneratedSiteContract["pages"][string],
  canvasHeightPx: number
): CanvasImageFrame[] {
  const frames = extractDivBlocksByClass(page.html, "fx-image-frame");
  const parsed: CanvasImageFrame[] = [];
  for (const frame of frames) {
    if (hasClass(frame.openTag, "fx-shape-frame")) continue;
    const styleMap = parseStyleMap(getAttr(frame.openTag, "style"));
    const rect = resolveFrameRectPx(
      styleMap,
      canvasHeightPx,
      defaultCanvasImageWidthPx,
      defaultCanvasImageHeightPx
    );
    const imgMatch = frame.innerHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
    const src = imgMatch?.[1]?.trim() ?? "";
    if (!src) continue;
    parsed.push({
      leftPx: rect.leftPx,
      topPx: rect.topPx,
      widthPx: rect.widthPx,
      heightPx: rect.heightPx,
      src
    });
  }
  return parsed;
}

function containsCanvasFrames(page: GeneratedSiteContract["pages"][string]): boolean {
  return (
    page.html.includes("fx-text-frame") ||
    page.html.includes("fx-image-frame") ||
    page.html.includes("fx-shape-frame")
  );
}

function buildSlideText(page: GeneratedSiteContract["pages"][string]): string {
  const body = htmlToPlainText(page.html);
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.slice(0, 14).join("\n");
}

function extractImageCandidates(page: GeneratedSiteContract["pages"][string]): string[] {
  const candidates: string[] = [];
  if (page.previewImage) candidates.push(page.previewImage);

  const imgSrcMatches = page.html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgSrcMatches) {
    const src = (match[1] || "").trim();
    if (src) candidates.push(src);
  }

  const cssUrlMatches = page.css.matchAll(/url\((['"]?)([^'")]+)\1\)/gi);
  for (const match of cssUrlMatches) {
    const src = (match[2] || "").trim();
    if (src) candidates.push(src);
  }

  return Array.from(new Set(candidates)).filter((src) => {
    if (!src) return false;
    if (src.startsWith("data:image/")) return true;
    return /^https?:\/\//i.test(src);
  });
}

async function toDataUri(source: string): Promise<string | null> {
  if (!source) return null;
  if (source.startsWith("data:image/")) return source;
  if (!/^https?:\/\//i.test(source)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(source, { signal: controller.signal });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function dataUriToBase64(dataUri: string): { mimeType: string; base64: string } | null {
  const match = dataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

export async function buildPresentationArtifacts(
  site: GeneratedSiteContract,
  aspectRatio: PresentationAspectRatio = "16:9"
): Promise<{
  pptxBytes: Uint8Array;
  pdfBytes: Uint8Array;
}> {
  const pages = Object.entries(site.pages);
  const slideWidthInches = 10;
  const slideHeightInches = aspectRatio === "4:3" ? 7.5 : 5.625;
  const canvasHeightPx = aspectRatio === "4:3" ? 990 : 742.5;
  const pxToInchesX = (px: number): number => (px / canvasWidthPx) * slideWidthInches;
  const pxToInchesY = (px: number): number => (px / canvasHeightPx) * slideHeightInches;

  const ppt = new PptxGenJS();
  ppt.layout = aspectRatio === "4:3" ? "LAYOUT_4x3" : "LAYOUT_16x9";
  ppt.author = "MagXStudio";
  ppt.company = site.designBrief.brandVibe || "Generated";
  ppt.subject = "Generated presentation";
  ppt.title = site.designBrief.visualDirection || "Presentation";

  for (const [, page] of pages) {
    const slide = ppt.addSlide();
    const title = page.seo.title || "Slide";
    const body = buildSlideText(page) || page.seo.description || "Generated content";
    const hasCanvasLayout = containsCanvasFrames(page);
    const imageData = await (async () => {
      const candidates = extractImageCandidates(page);
      for (const candidate of candidates) {
        const uri = await toDataUri(candidate);
        if (uri) return uri;
      }
      return null;
    })();

    if (hasCanvasLayout) {
      slide.background = { color: extractCanvasColor(page.css).replace("#", "") };
      const imageFrames = extractCanvasImageFrames(page, canvasHeightPx);
      for (const frame of imageFrames) {
        const imageUri = await toDataUri(frame.src);
        if (!imageUri) continue;
        slide.addImage({
          data: imageUri,
          x: pxToInchesX(frame.leftPx),
          y: pxToInchesY(frame.topPx),
          w: pxToInchesX(frame.widthPx),
          h: pxToInchesY(frame.heightPx)
        });
      }
      const textFrames = extractCanvasTextFrames(page, canvasHeightPx);
      for (const frame of textFrames) {
        slide.addText(frame.text, {
          x: pxToInchesX(frame.leftPx),
          y: pxToInchesY(frame.topPx),
          w: pxToInchesX(frame.widthPx),
          h: pxToInchesY(frame.heightPx),
          fontFace: frame.fontFace,
          fontSize: frame.fontSizePt,
          bold: frame.bold,
          color: frame.colorHex,
          align: frame.align,
          valign: "top",
          breakLine: true,
          margin: 0,
          paraSpaceAfter: 0,
          lineSpacingMultiple: frame.lineHeightMultiple
        });
      }
      if (!imageFrames.length && !textFrames.length && imageData) {
        slide.addImage({
          data: imageData,
          x: 0,
          y: 0,
          w: slideWidthInches,
          h: slideHeightInches
        });
      }
    } else {
      slide.background = { color: "0F0F10" };
      if (imageData) {
        slide.addImage({
          data: imageData,
          x: 0,
          y: 0,
          w: slideWidthInches,
          h: slideHeightInches
        });
        slide.addShape(ppt.ShapeType.rect, {
          x: 0,
          y: 0,
          w: slideWidthInches,
          h: slideHeightInches,
          fill: { color: "05070A", transparency: 34 },
          line: { transparency: 100 }
        });
      }
      const margin = 0.45;
      const contentWidth = slideWidthInches - margin * 2;
      slide.addText(title, {
        x: margin,
        y: 0.4,
        w: contentWidth,
        h: 0.7,
        fontFace: "Aptos",
        fontSize: 28,
        bold: true,
        color: "F7F7F8"
      });
      slide.addShape(ppt.ShapeType.line, {
        x: margin,
        y: 1.2,
        w: contentWidth,
        h: 0,
        line: { color: "2D2E32", pt: 1 }
      });
      slide.addText(body, {
        x: margin,
        y: 1.45,
        w: contentWidth,
        h: slideHeightInches - 1.95,
        fontFace: "Aptos",
        fontSize: 15,
        color: "D9DADF",
        valign: "top",
        breakLine: true
      });
    }
  }

  const pptBuffer = (await ppt.write({ outputType: "nodebuffer" })) as Buffer;
  const pptxBytes = new Uint8Array(pptBuffer);

  const pdf = await PDFDocument.create();
  const fontTitle = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontBody = await pdf.embedFont(StandardFonts.Helvetica);

  const pdfWidth = aspectRatio === "4:3" ? 1200 : 1600;
  const pdfHeight = 900;

  for (const [, page] of pages) {
    const pdfPage = pdf.addPage([pdfWidth, pdfHeight]);
    const title = page.seo.title || "Slide";
    const body = buildSlideText(page) || page.seo.description || "Generated content";
    const imageData = await (async () => {
      const candidates = extractImageCandidates(page);
      for (const candidate of candidates) {
        const uri = await toDataUri(candidate);
        if (uri) return uri;
      }
      return null;
    })();

    pdfPage.drawRectangle({
      x: 0,
      y: 0,
      width: pdfWidth,
      height: pdfHeight,
      color: rgb(0.06, 0.06, 0.07)
    });
    if (imageData) {
      const parsed = dataUriToBase64(imageData);
      if (parsed) {
        try {
          const imgBytes = Buffer.from(parsed.base64, "base64");
          const embedded =
            parsed.mimeType === "image/png"
              ? await pdf.embedPng(imgBytes)
              : await pdf.embedJpg(imgBytes);
          pdfPage.drawImage(embedded, {
            x: 0,
            y: 0,
            width: pdfWidth,
            height: pdfHeight
          });
          pdfPage.drawRectangle({
            x: 0,
            y: 0,
            width: pdfWidth,
            height: pdfHeight,
            color: rgb(0.03, 0.04, 0.07),
            opacity: 0.34
          });
        } catch {
          // Ignore image embed errors and keep text-only fallback.
        }
      }
    }
    pdfPage.drawText(title, {
      x: 56,
      y: pdfHeight - 66,
      size: 36,
      font: fontTitle,
      color: rgb(0.96, 0.97, 0.99)
    });
    pdfPage.drawRectangle({
      x: 56,
      y: pdfHeight - 82,
      width: pdfWidth - 112,
      height: 1,
      color: rgb(0.2, 0.2, 0.24)
    });
    pdfPage.drawText(body.slice(0, 3000), {
      x: 56,
      y: pdfHeight - 120,
      size: 18,
      lineHeight: 24,
      maxWidth: pdfWidth - 112,
      font: fontBody,
      color: rgb(0.85, 0.86, 0.9)
    });
  }

  const pdfBytes = await pdf.save();

  return {
    pptxBytes,
    pdfBytes
  };
}
