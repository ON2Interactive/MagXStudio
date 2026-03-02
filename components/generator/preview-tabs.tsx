"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedSiteContract, PageKey } from "@/lib/types";

type PreviewTabsProps = {
  site: GeneratedSiteContract | null;
  activePage: PageKey;
  workspaceId: string;
  canvasAspect?: CanvasFormat;
  customCanvasWidth?: number | null;
  customCanvasHeight?: number | null;
  showGridOverlay?: boolean;
  gridPreset?: string;
  activeSlidesTool?: string;
  clearSelectionSignal?: number;
  textFontRequest?: {
    token: number;
    textId: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: string;
    textColor: string;
    textAlign: "left" | "center" | "right";
    lineHeight: string;
    wordSpacing: string;
    characterSpacing: string;
    bulletListStyle: "none" | "disc" | "circle" | "square";
    numberedListStyle:
    | "none"
    | "decimal"
    | "lower-alpha"
    | "upper-alpha"
    | "lower-roman"
    | "upper-roman";
    textDecorationStyle?: "none" | "underline" | "italic" | "line-through";
  } | null;
  shapeStyleRequest?: {
    token: number;
    shapeId: string;
    route: string | null;
    fillMode: "color" | "gradient" | "image";
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
  } | null;
  imageStyleRequest?: {
    token: number;
    imageId: string;
    route: string | null;
    brightness: number;
    saturation: number;
    imageOffsetX: number;
    imageOffsetY: number;
    filterPreset: "none" | "vivid" | "warm" | "cool" | "mono" | "sepia";
    persistToSite: boolean;
  } | null;
  layerOrderCommand?: {
    token: number;
    direction: "front" | "back";
  } | null;
  referenceImages?: { data: string; mimeType: string; name?: string }[] | null;
};

export type SlidesCanvasFormat = "16:9" | "4:3" | "3:2";
export type PagesCanvasFormat =
  | "297x420"
  | "210x297"
  | "148x210"
  | "8.5x11"
  | "8.5x14"
  | "11x17"
  | "6x9"
  | "5.5x8.5"
  | "9x12"
  | "420x297"
  | "297x210"
  | "210x148"
  | "11x8.5"
  | "14x8.5"
  | "17x11"
  | "9x6"
  | "8.5x5.5"
  | "12x9"
  | "Custom";
export type CanvasFormat = SlidesCanvasFormat | PagesCanvasFormat;

const slideCanvasFormatDimensions: Record<SlidesCanvasFormat, { width: number; height: number }> = {
  "16:9": { width: 16, height: 9 },
  "4:3": { width: 4, height: 3 },
  "3:2": { width: 3, height: 2 }
};

const pagesCanvasFormatDimensions: Record<PagesCanvasFormat, { width: number; height: number }> = {
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

function getCanvasMetrics(
  canvasAspect: CanvasFormat,
  customCanvasWidth?: number | null,
  customCanvasHeight?: number | null
): {
  aspectCss: string;
  previewCanvasHeight: number;
  previewRatio: number;
  previewCanvasWidthPx: number;
  previewCanvasHeightPx: number;
} {
  const inchesToPx = (inches: number) => inches * 96;
  const mmToPx = (mm: number) => (mm / 25.4) * 96;

  if (
    Number.isFinite(customCanvasWidth) &&
    Number.isFinite(customCanvasHeight) &&
    (customCanvasWidth ?? 0) > 0 &&
    (customCanvasHeight ?? 0) > 0
  ) {
    const width = customCanvasWidth as number;
    const height = customCanvasHeight as number;
    return {
      aspectCss: `${width} / ${height}`,
      previewCanvasHeight: height, // For custom sizes, height is native.
      previewRatio: width / height,
      previewCanvasWidthPx: width, // Custom dimensions are treated explicitly as pixels
      previewCanvasHeightPx: height
    };
  }

  const isPages = canvasAspect in pagesCanvasFormatDimensions;
  const dimensions = isPages
    ? pagesCanvasFormatDimensions[canvasAspect as PagesCanvasFormat]
    : slideCanvasFormatDimensions[canvasAspect as SlidesCanvasFormat];

  const { width, height } = dimensions;

  if (isPages) {
    // For Pages templates, the keys map to literal inches (<40) or literal mm (>40). 
    // We convert these template values into pure pixels.
    const widthPx = width > 40 ? Math.round(mmToPx(width)) : Math.round(inchesToPx(width));
    const heightPx = height > 40 ? Math.round(mmToPx(height)) : Math.round(inchesToPx(height));

    return {
      aspectCss: `${widthPx} / ${heightPx}`,
      previewCanvasHeight: heightPx, // Used natively within Pages
      previewRatio: widthPx / heightPx,
      previewCanvasWidthPx: widthPx,
      previewCanvasHeightPx: heightPx
    };
  } else {
    // For Slides, the dimensions denote an aspect ratio (e.g., 16x9), mapped to a 1320px base boundary.
    const computedHeight = (1320 * height) / width;
    return {
      aspectCss: `${width} / ${height}`,
      previewCanvasHeight: computedHeight,
      previewRatio: width / height,
      previewCanvasWidthPx: 1320,
      previewCanvasHeightPx: computedHeight
    };
  }
}

function escInlineScript(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

export function buildPreviewSrcDoc(
  page: GeneratedSiteContract["pages"][string],
  site?: GeneratedSiteContract,
  workspaceId?: string,
  enableInternalRouting = false,
  activeSlidesTool?: string,
  staticPreview = false,
  canvasAspect: CanvasFormat = "16:9",
  customCanvasWidth?: number | null,
  customCanvasHeight?: number | null,
  referenceImages?: { data: string; mimeType: string; name?: string }[] | null
) {
  let html = page.html || "";
  let css = page.css || "";

  if (referenceImages?.length) {
    const tokenMap = new Map(
      referenceImages.map((image, index) => [
        `{{REFERENCE_IMAGE_${index + 1}}}`,
        `data:${image.mimeType};base64,${image.data}`
      ])
    );
    for (const [token, uri] of tokenMap.entries()) {
      html = html.split(token).join(uri);
      css = css.split(token).join(uri);
    }
  }

  const {
    aspectCss: previewAspectCss,
    previewCanvasHeight,
    previewRatio,
    previewCanvasWidthPx,
    previewCanvasHeightPx
  } = getCanvasMetrics(
    canvasAspect,
    customCanvasWidth,
    customCanvasHeight
  );
  const baseCss = `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #141414; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    img { max-width: 100%; display: block; }
    body[data-preview-workspace^="slides"], body[data-preview-workspace^="pages"] { background: #141414; }
    body[data-preview-workspace^="slides"] #preview-root > *, body[data-preview-workspace^="pages"] #preview-root > * {
      width: 100% !important;
      min-height: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      border-radius: 0 !important;
    }
    body[data-preview-workspace^="slides"][data-preview-nav="false"] #preview-shell, body[data-preview-workspace^="pages"][data-preview-nav="false"] #preview-shell {
      position: relative;
      width: 100%;
      height: 100%;
    }
    body[data-preview-workspace^="slides"][data-preview-nav="false"] #preview-root, body[data-preview-workspace^="pages"][data-preview-nav="false"] #preview-root {
      width: 100%;
      height: 100%;
    }
    body[data-preview-workspace^="slides"][data-preview-nav="true"], body[data-preview-workspace^="pages"][data-preview-nav="true"] {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      overflow: auto;
    }
    body[data-preview-workspace^="slides"][data-preview-nav="true"] #preview-shell, body[data-preview-workspace^="pages"][data-preview-nav="true"] #preview-shell {
      position: relative;
      width: min(92vw, 1320px);
      aspect-ratio: ${previewAspectCss};
      background: #141414;
      overflow: hidden;
      box-shadow: none;
    }
    body[data-preview-workspace^="pages"][data-preview-nav="true"] #preview-shell {
      width: min(92vw, calc((100vh - 120px) * ${previewRatio.toFixed(6)}), ${Math.round(previewCanvasWidthPx)}px);
    }
    body[data-preview-workspace^="slides"][data-preview-nav="true"] #preview-root, body[data-preview-workspace^="pages"][data-preview-nav="true"] #preview-root {
      width: 100%;
      height: 100%;
    }
    .fx-selected {
      outline: 1px solid rgba(99, 102, 241, 0.92) !important;
      outline-offset: 0 !important;
    }
    .fx-text-frame {
      border-color: transparent !important;
    }
    .fx-image-frame .fx-handle,
    .fx-text-frame .fx-handle,
    .fx-shape-frame .fx-handle {
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .fx-image-frame:not(.fx-shape-frame) {
      max-width: none !important;
      max-height: none !important;
    }
    .fx-image-frame[data-fx-image-source="generated"] img {
      object-fit: cover !important;
    }
    .fx-text-frame.is-active,
    .fx-text-frame.fx-selected {
      border-color: rgba(99, 102, 241, 0.55) !important;
    }
    
    .fx-image-frame.is-active .fx-handle,
    .fx-image-frame.fx-selected .fx-handle,
    .fx-text-frame.is-active .fx-handle,
    .fx-text-frame.fx-selected .fx-handle,
    .fx-shape-frame.is-active .fx-handle,
    .fx-shape-frame.fx-selected .fx-handle {
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    .fx-shape-frame .fx-shape-fill {
      background: #9ca3af;
      border: 2px solid #6b7280;
      box-sizing: border-box;
      box-shadow: none;
    }
    .fx-shape-frame {
      min-width: 0 !important;
      min-height: 0 !important;
    }
    body[data-preview-static="true"] #preview-shell {
      box-shadow: none !important;
      filter: none !important;
      border: 0 !important;
      outline: 0 !important;
    }
    body[data-preview-static="true"] #preview-root,
    body[data-preview-static="true"] #preview-root * {
      -webkit-user-select: none !important;
      user-select: none !important;
    }
    body[data-preview-static="true"] #preview-root {
      pointer-events: none !important;
    }
    body[data-preview-static="true"] #preview-root [contenteditable="true"] {
      pointer-events: none !important;
      caret-color: transparent !important;
    }
    .fx-align-guide {
      position: absolute;
      z-index: 2147483646;
      pointer-events: none;
      background: rgba(99, 102, 241, 0.92);
      opacity: 0.95;
      display: none;
    }
    .fx-align-guide[data-axis="x"] {
      top: 0;
      bottom: 0;
      width: 1px;
      transform: translateX(-50%);
    }
    .fx-align-guide[data-axis="y"] {
      left: 0;
      right: 0;
      height: 1px;
      transform: translateY(-50%);
    }
  `;
  const staticPreviewOverridesCss = `
    html, body {
      background: #141414 !important;
    }
    body[data-preview-static="true"] {
      background: #141414 !important;
    }
    body[data-preview-static="true"] #preview-shell {
      box-shadow: none !important;
      filter: none !important;
      border: 0 !important;
      outline: 0 !important;
    }
  `;
  const allPages = site?.pages ?? { current: page };
  const initialRoute = page.route || "/";
  const previewWorkspaceId = workspaceId ?? "workspace";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${page.seo.title}</title>
    <style>${baseCss}\n${css}\n${staticPreview ? staticPreviewOverridesCss : ""}</style>
  </head>
  <body data-preview-route="${initialRoute}" data-preview-workspace="${previewWorkspaceId}" data-preview-nav="${String(enableInternalRouting)}" data-active-tool="${activeSlidesTool ?? ""}" data-preview-static="${String(staticPreview)}">
    <div id="preview-shell"><div id="preview-root">${html}</div></div>
    <script>
      (function () {
        const pages = ${escInlineScript(JSON.stringify(allPages))};
        const workspaceId = ${JSON.stringify(previewWorkspaceId)};
        const activeTool = ${JSON.stringify(activeSlidesTool ?? "")};
        const isSelectionTool =
          activeTool === "select" ||
          activeTool === "text" ||
          activeTool === "frame" ||
          activeTool === "icons";
        const isPresentationWorkspace =
          workspaceId.indexOf("slides") === 0 || workspaceId.indexOf("presentation") === 0;
        const isSlideCanvasWorkspace =
          isPresentationWorkspace || workspaceId.indexOf("pages") === 0;
        const isCanvasWorkspace =
          isPresentationWorkspace ||
          workspaceId.indexOf("pages") === 0 ||
          workspaceId.indexOf("websites") === 0;

        const previewCanvasHeight = ${JSON.stringify(previewCanvasHeight)};
        const normalizeRoute = function(route) {
          let raw = String(route || "/").trim() || "/";
          if (!raw.startsWith("/")) raw = "/" + raw;
          while (raw.length > 1 && raw.endsWith("/")) {
            raw = raw.slice(0, -1);
          }
          return raw || "/";
        };
        const pageList = Object.keys(pages)
          .map((key) => pages[key])
          .filter(Boolean)
          .map((item) => ({
            route: normalizeRoute(item.route || "/"),
            title: (item.seo && item.seo.title) || "Page"
          }))
          .sort((left, right) => {
            if (left.route === "/") return -1;
            if (right.route === "/") return 1;
            return left.route.localeCompare(right.route, undefined, { numeric: true });
          });
        const styleEl = document.createElement("style");
        styleEl.id = "generated-page-style";
        document.head.appendChild(styleEl);
        let prevButton = null;
        let nextButton = null;
        let currentIndex = -1;

        function routeToIndex(route) {
          const currentRoute = normalizeRoute(route || "/");
          return pageList.findIndex((item) => item.route === currentRoute);
        }

        function updateNavState() {
          if (!prevButton || !nextButton) return;
          const index = currentIndex >= 0 ? currentIndex : routeToIndex(document.body.getAttribute("data-preview-route") || "/");
          prevButton.disabled = index <= 0;
          nextButton.disabled = index < 0 || index >= pageList.length - 1;
          [prevButton, nextButton].forEach(function(button) {
            if (!(button instanceof HTMLButtonElement)) return;
            if (button.disabled) {
              button.style.opacity = "0.35";
              button.style.cursor = "default";
            } else {
              button.style.opacity = "1";
              button.style.cursor = "pointer";
            }
          });
        }

        function findPageByRoute(route) {
          const normalized = normalizeRoute(route || "/");
          for (const key in pages) {
            if (pages[key] && normalizeRoute(pages[key].route) === normalized) return pages[key];
          }
          return null;
        }

        function renderPageByRoute(route, push) {
          const pageData = findPageByRoute(route);
          if (!pageData) return false;
          document.title = pageData.seo?.title || "Preview";
          styleEl.textContent =
            ${JSON.stringify(baseCss)} +
            "\\n" +
            (pageData.css || "") +
            "\\n" +
            (${JSON.stringify(staticPreview)} ? ${JSON.stringify(staticPreviewOverridesCss)} : "");
          const root = document.getElementById("preview-root");
          if (root) root.innerHTML = pageData.html || "";
          initializeFrameInteractions();
          syncPreviewCanvasScale();
          const normalizedRoute = normalizeRoute(pageData.route || "/");
          currentIndex = routeToIndex(normalizedRoute);
          if (push) {
            try {
              history.pushState({ route: normalizedRoute }, "", normalizedRoute);
            } catch {
              // Ignore URL update failures in preview context.
            }
          }
          document.body.setAttribute("data-preview-route", normalizedRoute);
          updateNavState();
          return true;
        }

        function isNavPreviewMode() {
          return document.body.getAttribute("data-preview-nav") === "true";
        }

        function syncSlidesPreviewCanvasScale() {
          if (!isPresentationWorkspace) return;
          const root = document.getElementById("preview-root");
          const shell = document.getElementById("preview-shell");
          if (!(root instanceof HTMLElement) || !(shell instanceof HTMLElement)) return;
          
          const shellRect = shell.getBoundingClientRect();
          const targetWidth = 1320;
          const targetHeight = ${Math.round(previewCanvasHeight)};
          const scale = shellRect.width / targetWidth;

          root.style.position = "absolute";
          root.style.width = targetWidth + "px";
          root.style.height = targetHeight + "px";
          root.style.transformOrigin = "top left";
          root.style.transform = "scale(" + scale + ")";
          root.style.left = "0";
          root.style.top = "0";
        }

        function syncPagesPreviewCanvasScale() {
          const isPages = workspaceId.indexOf("pages") === 0;
          if (!isPages) return;
          const root = document.getElementById("preview-root");
          const shell = document.getElementById("preview-shell");
          if (!(root instanceof HTMLElement) || !(shell instanceof HTMLElement)) return;
          
          const shellRect = shell.getBoundingClientRect();
          const targetWidth = ${Math.round(previewCanvasWidthPx)};
          const targetHeight = ${Math.round(previewCanvasHeightPx)};
          const scale = shellRect.width / targetWidth;

          root.style.position = "absolute";
          root.style.width = targetWidth + "px";
          root.style.height = targetHeight + "px";
          root.style.transformOrigin = "top left";
          root.style.transform = "scale(" + scale + ")";
          root.style.left = "0";
          root.style.top = "0";
        }

        function syncPreviewCanvasScale() {
          syncSlidesPreviewCanvasScale();
          syncPagesPreviewCanvasScale();
        }

        function asElement(target) {
          if (target instanceof Element) return target;
          if (target && target.nodeType === Node.TEXT_NODE) {
            return target.parentElement || null;
          }
          return null;
        }

        function isPointerInsideRenderableShape(frame, clientX, clientY) {
          if (!(frame instanceof HTMLElement)) return false;
          if (!frame.classList.contains("fx-shape-frame")) return true;
          const rect = frame.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return false;
          const x = (clientX - rect.left) / rect.width;
          const y = (clientY - rect.top) / rect.height;
          if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
          if (x < 0 || x > 1 || y < 0 || y > 1) return false;
          return true;
        }

        function ensureAlignmentGuides(root) {
          const shell = document.getElementById("preview-shell");
          const host = shell instanceof HTMLElement ? shell : root;
          let vertical = host.querySelector('[data-fx-align-guide="vertical"]');
          if (!(vertical instanceof HTMLElement)) {
            vertical = document.createElement("div");
            vertical.className = "fx-align-guide";
            vertical.setAttribute("data-axis", "x");
            vertical.setAttribute("data-fx-align-guide", "vertical");
            host.appendChild(vertical);
          }
          let horizontal = host.querySelector('[data-fx-align-guide="horizontal"]');
          if (!(horizontal instanceof HTMLElement)) {
            horizontal = document.createElement("div");
            horizontal.className = "fx-align-guide";
            horizontal.setAttribute("data-axis", "y");
            horizontal.setAttribute("data-fx-align-guide", "horizontal");
            host.appendChild(horizontal);
          }
          return { host, vertical, horizontal };
        }

        function hideAlignmentGuides(guides) {
          if (!guides) return;
          if (guides.vertical instanceof HTMLElement) {
            guides.vertical.style.display = "none";
          }
          if (guides.horizontal instanceof HTMLElement) {
            guides.horizontal.style.display = "none";
          }
        }

        function collectAlignmentTargets(root, frame) {
          const rootRect = root.getBoundingClientRect();
          const scale = root.offsetWidth > 0 ? rootRect.width / root.offsetWidth : 1;
          const unscale = function(v) { return v / scale; };
          const verticalTargets = [root.offsetWidth / 2];
          const horizontalTargets = [root.offsetHeight / 2];
          const siblings = root.querySelectorAll(
            ".fx-image-frame,.fx-text-frame,.fx-shape-frame,[data-fx-shape]"
          );
          siblings.forEach(function(item) {
            if (!(item instanceof HTMLElement)) return;
            if (item === frame) return;
            const rect = item.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            const left = unscale(rect.left - rootRect.left);
            const top = unscale(rect.top - rootRect.top);
            const width = unscale(rect.width);
            const height = unscale(rect.height);
            verticalTargets.push(left, left + width / 2, left + width);
            horizontalTargets.push(top, top + height / 2, top + height);
          });
          return { verticalTargets, horizontalTargets };
        }

        function resolveSnap(rawPosition, size, targets, thresholdPx) {
          let best = null;
          targets.forEach(function(targetLine) {
            const leftDelta = Math.abs(rawPosition - targetLine);
            if (!best || leftDelta < best.distance) {
              best = { position: targetLine, line: targetLine, distance: leftDelta };
            }

            const centerPosition = targetLine - size / 2;
            const centerDelta = Math.abs(rawPosition + size / 2 - targetLine);
            if (!best || centerDelta < best.distance) {
              best = { position: centerPosition, line: targetLine, distance: centerDelta };
            }

            const rightPosition = targetLine - size;
            const rightDelta = Math.abs(rawPosition + size - targetLine);
            if (!best || rightDelta < best.distance) {
              best = { position: rightPosition, line: targetLine, distance: rightDelta };
            }
          });
          if (!best || best.distance > thresholdPx) return null;
          return best;
        }

        function createFxId() {
          return "fx-gen-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
        }

        function postPageUpdated() {
          const root = document.getElementById("preview-root");
          if (!root) return;
          
          // create a clean clone to send back
          const clone = root.cloneNode(true);
          
          // Clean up runtime states
          clone.querySelectorAll(".fx-selected").forEach(function(item) {
            item.classList.remove("fx-selected");
          });
          clone.querySelectorAll(".fx-image-frame.is-active, .fx-text-frame.is-active").forEach(function(item) {
            item.classList.remove("is-active");
          });
          clone.querySelectorAll("[data-fx-bound]").forEach(function(item) {
            item.removeAttribute("data-fx-bound");
          });
          clone.querySelectorAll("[contenteditable='true']").forEach(function(item) {
            // Keep contenteditable in the stored HTML so it stays editable
          });
          
          window.parent.postMessage({
            type: "preview-page-updated",
            workspaceId: workspaceId,
            route: document.body.getAttribute("data-preview-route") || "/",
            html: clone.innerHTML
          }, "*");
        }

        function initializeFrameInteractions() {
          const root = document.getElementById("preview-root");
          if (!root) return;
          if (${JSON.stringify(staticPreview)}) return;
          // Browser preview should render persisted layout only; rebinding frames there
          // mutates computed dimensions and can desync from editor canvas.
          if (${JSON.stringify(enableInternalRouting)}) return;
          if (!isCanvasWorkspace) return;
          if (!isSelectionTool) return;
          if (!root.hasAttribute("tabindex")) {
            root.setAttribute("tabindex", "0");
          }

          const frames = root.querySelectorAll(
            ".fx-image-frame,.fx-text-frame,.fx-shape-frame,[data-fx-shape]"
          );
          frames.forEach(function(frame) {
            if (!(frame instanceof HTMLElement)) return;
            if (frame.__fxBound === true) return;
            frame.__fxBound = true;

            const ensurePositioned = function() {
              const computed = window.getComputedStyle(frame);
              if (computed.transform && computed.transform !== "none") {
                const rect = frame.getBoundingClientRect();
                const rootRect = root.getBoundingClientRect();
                const scale = root.offsetWidth > 0 ? rootRect.width / root.offsetWidth : 1;
                const left = (rect.left - rootRect.left) / scale;
                const top = (rect.top - rootRect.top) / scale;
                frame.style.transform = "none";
                frame.style.left = left + "px";
                frame.style.top = top + "px";
                frame.style.width = (rect.width / scale) + "px";
                frame.style.height = (rect.height / scale) + "px";
              }
            };

            const setActive = function() {
                  root
                    .querySelectorAll(
                      ".fx-image-frame.is-active,.fx-text-frame.is-active,.fx-shape-frame.is-active,[data-fx-shape].is-active"
                    )
                    .forEach(function(item) {
                      item.classList.remove("is-active");
                    });
              frame.classList.add("is-active");
            };

            frame.addEventListener("pointerdown", function(event) {
              const targetEl = asElement(event.target);
              if (!targetEl) return;
              const handle = targetEl.closest(".fx-handle");
              if (!handle && !isPointerInsideRenderableShape(frame, event.clientX, event.clientY)) return;
              const isTextFrame = frame.classList.contains("fx-text-frame");
              const originalInlineStyle = frame.getAttribute("style") || "";
              setActive();
              if (isTextFrame && !handle && targetEl.closest(".fx-text-content")) {
                return;
              }
              ensurePositioned();
              let didMutate = (frame.getAttribute("style") || "") !== originalInlineStyle;

              const frameRect = frame.getBoundingClientRect();
              const rootRect = root.getBoundingClientRect();
              const scale = root.offsetWidth > 0 ? rootRect.width / root.offsetWidth : 1;
              const unscale = function(v) { return v / scale; };
              
              const dir = handle ? handle.getAttribute("data-dir") || "" : "";
              const mode = dir ? "resize" : "move";
              const alignmentGuides = ensureAlignmentGuides(root);
              const snapThresholdPx = 6 / scale;
              const alignmentTargets = null; // Disabled alignment guides
              const startX = event.clientX;
              const startY = event.clientY;
              const startLeft = unscale(frameRect.left - rootRect.left);
              const startTop = unscale(frameRect.top - rootRect.top);
              const startW = unscale(frameRect.width);
              const startH = unscale(frameRect.height);
              const isShapeFrame =
                frame.classList.contains("fx-shape-frame") ||
                Boolean(frame.getAttribute("data-fx-shape"));
              const isIconFrame = frame.classList.contains("fx-icon-frame");
              const minW = isIconFrame ? 16 : 120;
              const minH = isIconFrame ? 16 : 90;
              const frameShapeType = String(frame.getAttribute("data-fx-shape") || "")
                .trim()
                .toLowerCase();
              const useFreeResizeForShape =
                frameShapeType === "rectangle" || frameShapeType === "square";
              let isDragging = true;

              event.preventDefault();
              frame.setPointerCapture(event.pointerId);

              const onMove = function(moveEvent) {
                const dx = unscale(moveEvent.clientX - startX);
                const dy = unscale(moveEvent.clientY - startY);

                if (mode === "move") {
                  const frameWidth = frame.offsetWidth || startW;
                  const frameHeight = frame.offsetHeight || startH;
                  const rawLeft = Math.max(0, Math.min(startLeft + dx, root.offsetWidth - frameWidth));
                  const rawTop = Math.max(0, Math.min(startTop + dy, root.offsetHeight - frameHeight));
                  const snapX = alignmentTargets
                    ? resolveSnap(rawLeft, frameWidth, alignmentTargets.verticalTargets, snapThresholdPx)
                    : null;
                  const snapY = alignmentTargets
                    ? resolveSnap(rawTop, frameHeight, alignmentTargets.horizontalTargets, snapThresholdPx)
                    : null;
                  const nextLeft = Math.max(
                    0,
                    Math.min(
                      snapX ? snapX.position : rawLeft,
                      root.offsetWidth - frameWidth
                    )
                  );
                  const nextTop = Math.max(
                    0,
                    Math.min(
                      snapY ? snapY.position : rawTop,
                      root.offsetHeight - frameHeight
                    )
                  );
                  const nextLeftPx = nextLeft + "px";
                  const nextTopPx = nextTop + "px";
                  if (frame.style.left !== nextLeftPx || frame.style.top !== nextTopPx) {
                    didMutate = true;
                  }
                  frame.style.left = nextLeftPx;
                  frame.style.top = nextTopPx;

                  if (alignmentGuides.vertical instanceof HTMLElement) {
                    if (snapX) {
                      alignmentGuides.vertical.style.display = "block";
                      alignmentGuides.vertical.style.left =
                        String(Math.max(0, Math.min(root.offsetWidth, snapX.line))) + "px";
                    } else {
                      alignmentGuides.vertical.style.display = "none";
                    }
                  }
                  if (alignmentGuides.horizontal instanceof HTMLElement) {
                    if (snapY) {
                      alignmentGuides.horizontal.style.display = "block";
                      alignmentGuides.horizontal.style.top =
                        String(Math.max(0, Math.min(root.offsetHeight, snapY.line))) + "px";
                    } else {
                      alignmentGuides.horizontal.style.display = "none";
                    }
                  }
                  return;
                }

                let nextLeft = startLeft;
                let nextTop = startTop;
                let nextW = startW;
                let nextH = startH;

                if (dir.indexOf("e") >= 0) nextW = startW + dx;
                if (dir.indexOf("s") >= 0) nextH = startH + dy;
                if (dir.indexOf("w") >= 0) {
                  nextW = startW - dx;
                  nextLeft = startLeft + dx;
                }
                if (dir.indexOf("n") >= 0) {
                  nextH = startH - dy;
                  nextTop = startTop + dy;
                }
                if (isShapeFrame && !useFreeResizeForShape) {
                  const hasEast = dir.indexOf("e") >= 0;
                  const hasWest = dir.indexOf("w") >= 0;
                  const hasSouth = dir.indexOf("s") >= 0;
                  const hasNorth = dir.indexOf("n") >= 0;
                  const widthScale = hasWest
                    ? (startW - dx) / startW
                    : hasEast
                      ? (startW + dx) / startW
                      : 1;
                  const heightScale = hasNorth
                    ? (startH - dy) / startH
                    : hasSouth
                      ? (startH + dy) / startH
                      : 1;
                  let rawScale = 1;
                  if ((hasEast || hasWest) && (hasNorth || hasSouth)) {
                    rawScale =
                      Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale;
                  } else if (hasEast || hasWest) {
                    rawScale = widthScale;
                  } else if (hasNorth || hasSouth) {
                    rawScale = heightScale;
                  }

                  const minScale = Math.max(minW / startW, minH / startH);
                  const maxScaleX = hasWest
                    ? (startLeft + startW) / startW
                    : hasEast
                      ? (root.offsetWidth - startLeft) / startW
                      : Number.POSITIVE_INFINITY;
                  const maxScaleY = hasNorth
                    ? (startTop + startH) / startH
                    : hasSouth
                      ? (root.offsetHeight - startTop) / startH
                      : Number.POSITIVE_INFINITY;
                  const maxScale = Math.min(maxScaleX, maxScaleY);
                  const nextScale = Math.max(0.01, Math.min(maxScale, Math.max(minScale, rawScale)));

                  nextW = startW * nextScale;
                  nextH = startH * nextScale;
                  nextLeft = hasWest ? startLeft + (startW - nextW) : startLeft;
                  nextTop = hasNorth ? startTop + (startH - nextH) : startTop;
                  nextLeft = Math.max(0, Math.min(nextLeft, root.offsetWidth - nextW));
                  nextTop = Math.max(0, Math.min(nextTop, root.offsetHeight - nextH));
                } else {
                  nextW = Math.max(minW, nextW);
                  nextH = Math.max(minH, nextH);
                  nextLeft = Math.max(0, Math.min(nextLeft, root.offsetWidth - nextW));
                  nextTop = Math.max(0, Math.min(nextTop, root.offsetHeight - nextH));
                }

                const nextLeftPx = nextLeft + "px";
                const nextTopPx = nextTop + "px";
                const nextWPx = nextW + "px";
                const nextHPx = nextH + "px";
                if (
                  frame.style.left !== nextLeftPx ||
                  frame.style.top !== nextTopPx ||
                  frame.style.width !== nextWPx ||
                  frame.style.height !== nextHPx
                ) {
                  didMutate = true;
                }
                frame.style.left = nextLeftPx;
                frame.style.top = nextTopPx;
                frame.style.width = nextWPx;
                frame.style.height = nextHPx;
                hideAlignmentGuides(alignmentGuides);
              };

              const cleanupDrag = function(shouldPersist, releaseEvent) {
                if (!isDragging) return;
                isDragging = false;
                hideAlignmentGuides(alignmentGuides);
                frame.removeEventListener("pointermove", onMove);
                frame.removeEventListener("pointerup", onUp);
                frame.removeEventListener("pointercancel", onCancel);
                frame.removeEventListener("lostpointercapture", onLostPointerCapture);
                window.removeEventListener("pointerup", onWindowPointerUp);
                window.removeEventListener("pointercancel", onWindowPointerCancel);
                window.removeEventListener("blur", onWindowBlur);
                try {
                  if (frame.hasPointerCapture(event.pointerId)) {
                    frame.releasePointerCapture(event.pointerId);
                  }
                } catch (_) {}
                if (shouldPersist && didMutate) postPageUpdated();
                if (releaseEvent && typeof releaseEvent.preventDefault === "function") {
                  releaseEvent.preventDefault();
                }
              };

              const onUp = function(upEvent) {
                if (upEvent.pointerId !== event.pointerId) return;
                cleanupDrag(true, upEvent);
              };

              const onCancel = function(cancelEvent) {
                if (cancelEvent.pointerId !== event.pointerId) return;
                cleanupDrag(true, cancelEvent);
              };

              const onLostPointerCapture = function() {
                cleanupDrag(true);
              };

              const onWindowPointerUp = function(windowEvent) {
                if (windowEvent.pointerId !== event.pointerId) return;
                cleanupDrag(true, windowEvent);
              };

              const onWindowPointerCancel = function(windowEvent) {
                if (windowEvent.pointerId !== event.pointerId) return;
                cleanupDrag(true, windowEvent);
              };

              const onWindowBlur = function() {
                cleanupDrag(true);
              };

              frame.addEventListener("pointermove", onMove);
              frame.addEventListener("pointerup", onUp);
              frame.addEventListener("pointercancel", onCancel);
              frame.addEventListener("lostpointercapture", onLostPointerCapture);
              window.addEventListener("pointerup", onWindowPointerUp);
              window.addEventListener("pointercancel", onWindowPointerCancel);
              window.addEventListener("blur", onWindowBlur);
            });
          });
        }

        function clearSelection() {
          document.querySelectorAll(".fx-selected").forEach(function(item) {
            item.classList.remove("fx-selected");
          });
          document
            .querySelectorAll(".fx-image-frame.is-active,.fx-text-frame.is-active")
            .forEach(function(item) {
              item.classList.remove("is-active");
            });
        }

        function postTextSelection(
          textId,
          fontFamily,
          fontWeight,
          fontSize,
          textColor,
          textDecorationStyle,
          textAlign,
          lineHeight,
          wordSpacing,
          characterSpacing,
          bulletListStyle,
          numberedListStyle
        ) {
          window.parent.postMessage(
            {
              type: "preview-text-selected",
              workspaceId: workspaceId,
              route: document.body.getAttribute("data-preview-route") || "/",
              textId: textId || "",
              fontFamily: fontFamily || "",
              fontWeight: fontWeight || "",
              fontSize: fontSize || "",
              textColor: textColor || "",
              textDecorationStyle: textDecorationStyle || "",
              textAlign: textAlign || "",
              lineHeight: lineHeight || "",
              wordSpacing: wordSpacing || "",
              characterSpacing: characterSpacing || "",
              bulletListStyle: bulletListStyle || "none",
              numberedListStyle: numberedListStyle || "none"
            },
            "*"
          );
        }

        function postShapeSelection(
          shapeId,
          shapeType,
          fillMode,
          fillColor,
          fillGradientStartColor,
          fillGradientEndColor,
          fillGradientAngle,
          fillImageSrc,
          fillImageOffsetX,
          fillImageOffsetY,
          strokeColor,
          strokeWidth,
          shapeSides,
          fillOpacity,
          fillRadius,
          rotation,
          strokeOpacity
        ) {
          window.parent.postMessage(
            {
              type: "preview-shape-selected",
              workspaceId: workspaceId,
              route: document.body.getAttribute("data-preview-route") || "/",
              shapeId: shapeId || "",
              shapeType: shapeType || "",
              fillMode: fillMode || "color",
              fillColor: fillColor || "",
              fillGradientStartColor: fillGradientStartColor || "#9ca3af",
              fillGradientEndColor: fillGradientEndColor || "#6b7280",
              fillGradientAngle:
                fillGradientAngle === undefined || fillGradientAngle === null || fillGradientAngle === ""
                  ? 135
                  : Number(fillGradientAngle),
              fillImageSrc: fillImageSrc || "",
              fillImageOffsetX:
                fillImageOffsetX === undefined || fillImageOffsetX === null || fillImageOffsetX === ""
                  ? 0
                  : Number(fillImageOffsetX),
              fillImageOffsetY:
                fillImageOffsetY === undefined || fillImageOffsetY === null || fillImageOffsetY === ""
                  ? 0
                  : Number(fillImageOffsetY),
              strokeColor: strokeColor || "",
              strokeWidth:
                strokeWidth === undefined || strokeWidth === null || strokeWidth === ""
                  ? 2
                  : Number(strokeWidth),
              shapeSides:
                shapeSides === undefined || shapeSides === null || shapeSides === ""
                  ? 5
                  : Number(shapeSides),
              fillOpacity:
                fillOpacity === undefined || fillOpacity === null || fillOpacity === ""
                  ? 100
                  : Number(fillOpacity),
              fillRadius:
                fillRadius === undefined || fillRadius === null || fillRadius === ""
                  ? 0
                  : Number(fillRadius),
              rotation:
                rotation === undefined || rotation === null || rotation === ""
                  ? 0
                  : Number(rotation),
              strokeOpacity:
                strokeOpacity === undefined || strokeOpacity === null || strokeOpacity === ""
                  ? 100
                  : Number(strokeOpacity)
            },
            "*"
          );
        }

        function normalizeImageIntensity(value) {
          const parsed = Number.parseFloat(String(value ?? "").trim());
          if (!Number.isFinite(parsed)) return 100;
          return Math.max(0, Math.min(200, Math.round(parsed)));
        }

        function resolveImageTone(frame, image) {
          if (!(frame instanceof HTMLElement) || !(image instanceof HTMLElement)) {
            return {
              brightness: 100,
              saturation: 100,
              imageOffsetX: 0,
              imageOffsetY: 0,
              filterPreset: "none"
            };
          }
          const brightness = normalizeImageIntensity(
            frame.dataset.fxBrightness ||
              image.dataset.fxBrightness ||
              "100"
          );
          const saturation = normalizeImageIntensity(
            frame.dataset.fxSaturation ||
              image.dataset.fxSaturation ||
              "100"
          );
          const imageOffsetX = Math.max(
            -100,
            Math.min(
              100,
              Math.round(
                Number.parseFloat(
                  frame.dataset.fxImageX ||
                    image.dataset.fxImageX ||
                    "0"
                )
              ) || 0
            )
          );
          const imageOffsetY = Math.max(
            -100,
            Math.min(
              100,
              Math.round(
                Number.parseFloat(
                  frame.dataset.fxImageY ||
                    image.dataset.fxImageY ||
                    "0"
                )
              ) || 0
            )
          );
          const filterPresetRaw = (
            frame.dataset.fxFilterPreset ||
            image.dataset.fxFilterPreset ||
            "none"
          )
            .toString()
            .trim()
            .toLowerCase();
          const filterPreset =
            filterPresetRaw === "vivid" ||
            filterPresetRaw === "warm" ||
            filterPresetRaw === "cool" ||
            filterPresetRaw === "mono" ||
            filterPresetRaw === "sepia"
              ? filterPresetRaw
              : "none";
          return { brightness, saturation, imageOffsetX, imageOffsetY, filterPreset };
        }

        function resolveImageOrigin(frame, image) {
          const raw = (
            (frame instanceof HTMLElement ? frame.dataset.fxImageOrigin : "") ||
            (image instanceof HTMLElement ? image.dataset.fxImageOrigin : "") ||
            "upload"
          )
            .toString()
            .trim()
            .toLowerCase();
          if (raw === "generated" || raw === "edited") return raw;
          return "upload";
        }

        function postImageSelection(
          frameId,
          src,
          brightness,
          saturation,
          imageOffsetX,
          imageOffsetY,
          filterPreset,
          imageOrigin
        ) {
          window.parent.postMessage(
            {
              type: "preview-image-selected",
              workspaceId: workspaceId,
              route: document.body.getAttribute("data-preview-route") || "/",
              frameId: frameId || "",
              src: src || "",
              brightness:
                brightness === undefined || brightness === null || brightness === ""
                  ? 100
                  : Number(brightness),
              saturation:
                saturation === undefined || saturation === null || saturation === ""
                  ? 100
                  : Number(saturation),
              imageOffsetX:
                imageOffsetX === undefined || imageOffsetX === null || imageOffsetX === ""
                  ? 0
                  : Number(imageOffsetX),
              imageOffsetY:
                imageOffsetY === undefined || imageOffsetY === null || imageOffsetY === ""
                  ? 0
                  : Number(imageOffsetY),
              filterPreset:
                filterPreset === "vivid" ||
                filterPreset === "warm" ||
                filterPreset === "cool" ||
                filterPreset === "mono" ||
                filterPreset === "sepia"
                  ? filterPreset
                  : "none",
              imageOrigin:
                imageOrigin === "generated" || imageOrigin === "edited"
                  ? imageOrigin
                  : "upload"
            },
            "*"
          );
        }

        function normalizeBulletListStyle(value) {
          const raw = (value || "").trim().toLowerCase();
          if (raw === "disc" || raw === "circle" || raw === "square") return raw;
          return "none";
        }

        function normalizeNumberedListStyle(value) {
          const raw = (value || "").trim().toLowerCase();
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
        }

        function normalizeTextDecorationStyle(textDecorationStyle, fontStyle) {
          const decorationRaw = (textDecorationStyle || "").trim().toLowerCase();
          if (decorationRaw === "underline") return "underline";
          if (decorationRaw === "italic") return "italic";
          if (decorationRaw === "line-through" || decorationRaw === "strikethrough") return "line-through";
          if (decorationRaw.indexOf("line-through") >= 0) return "line-through";
          if (decorationRaw.indexOf("underline") >= 0) return "underline";
          if (decorationRaw.indexOf("italic") >= 0 || decorationRaw.indexOf("oblique") >= 0) return "italic";
          const fontRaw = (fontStyle || "").trim().toLowerCase();
          if (fontRaw.indexOf("italic") >= 0 || fontRaw.indexOf("oblique") >= 0) return "italic";
          return "none";
        }

        function normalizeShapeColor(value) {
          const rawSource = String(value || "").trim();
          const raw = rawSource.toLowerCase();
          if (!raw) return "";
          if (raw === "none" || raw === "transparent") return "none";
          const isExplicitBlack =
            raw === "#000" ||
            raw === "#000000" ||
            raw === "black" ||
            raw === "rgb(0,0,0)" ||
            raw === "rgb(0, 0, 0)" ||
            raw === "rgba(0,0,0,1)" ||
            raw === "rgba(0, 0, 0, 1)" ||
            raw === "rgba(0,0,0,1.0)" ||
            raw === "rgba(0, 0, 0, 1.0)";
          if (/^#[0-9a-f]{3}$/i.test(raw)) {
            return (
              "#" +
              raw
                .slice(1)
                .split("")
                .map(function(char) {
                  return char + char;
                })
                .join("")
            );
          }
          if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
          const rgba = raw.match(/^rgba?\(([^)]+)\)$/);
          if (rgba && rgba[1]) {
            const parts = rgba[1].split(",").map(function(part) {
              return part.trim();
            });
            const alpha = parts[3] ? Number.parseFloat(parts[3]) : 1;
            if (Number.isFinite(alpha) && alpha <= 0) return "none";
            const rgb = parts
              .slice(0, 3)
              .map(function(part) {
                return Number.parseFloat(part);
              })
              .map(function(part) {
                return Number.isFinite(part) ? Math.max(0, Math.min(255, Math.round(part))) : NaN;
              });
            if (rgb.some(function(part) { return !Number.isFinite(part); })) return "";
            return (
              "#" +
              rgb
                .map(function(part) {
                  return Number(part).toString(16).padStart(2, "0");
                })
                .join("")
            );
          }
          const probe = document.createElement("span");
          probe.style.color = "#000000";
          probe.style.color = rawSource;
          probe.style.position = "absolute";
          probe.style.opacity = "0";
          probe.style.pointerEvents = "none";
          probe.style.left = "-9999px";
          document.body.appendChild(probe);
          const resolved = (window.getComputedStyle(probe).color || "").trim().toLowerCase();
          probe.remove();
          const resolvedRgba = resolved.match(/^rgba?\(([^)]+)\)$/);
          if (!resolvedRgba || !resolvedRgba[1]) return "";
          const resolvedParts = resolvedRgba[1].split(",").map(function(part) {
            return part.trim();
          });
          const resolvedAlpha = resolvedParts[3] ? Number.parseFloat(resolvedParts[3]) : 1;
          if (Number.isFinite(resolvedAlpha) && resolvedAlpha <= 0) return "none";
          const resolvedRgb = resolvedParts
            .slice(0, 3)
            .map(function(part) {
              return Number.parseFloat(part);
            })
            .map(function(part) {
              return Number.isFinite(part) ? Math.max(0, Math.min(255, Math.round(part))) : NaN;
            });
          if (resolvedRgb.some(function(part) { return !Number.isFinite(part); })) return "";
          if (
            !isExplicitBlack &&
            resolvedRgb[0] === 0 &&
            resolvedRgb[1] === 0 &&
            resolvedRgb[2] === 0
          ) {
            return "";
          }
          return (
            "#" +
            resolvedRgb
              .map(function(part) {
                return Number(part).toString(16).padStart(2, "0");
              })
              .join("")
          );
        }

        function normalizeShapeFillMode(value) {
          const raw = String(value || "").trim().toLowerCase();
          if (raw === "gradient") return "gradient";
          if (raw === "image") return "image";
          return "color";
        }

        function normalizeShapeGradientAngle(value) {
          const numeric = Number.parseFloat(String(value || "").trim());
          if (!Number.isFinite(numeric)) return 135;
          return Math.max(0, Math.min(360, Math.round(numeric)));
        }

        function normalizeShapeImageOffset(value) {
          const numeric = Number.parseFloat(String(value || "").trim());
          if (!Number.isFinite(numeric)) return 0;
          return Math.max(-100, Math.min(100, Math.round(numeric)));
        }

        function normalizeShapeOpacity(value) {
          const numeric = Number.parseFloat(String(value || "").trim());
          if (!Number.isFinite(numeric)) return 100;
          return Math.max(0, Math.min(100, Math.round(numeric)));
        }

        function normalizeShapeStrokeWidth(value) {
          const numeric = Number.parseFloat(String(value || "").trim());
          if (!Number.isFinite(numeric)) return 2;
          return Math.max(0, Math.min(64, Math.round(numeric)));
        }

        function normalizeShapeRotation(value) {
          const raw = String(value || "").trim();
          const rotateMatch = raw.match(/rotate\(([-+]?\d*\.?\d+)deg\)/i);
          const numeric = rotateMatch
            ? Number.parseFloat(rotateMatch[1] || "")
            : Number.parseFloat(raw);
          if (!Number.isFinite(numeric)) return 0;
          return Math.max(-180, Math.min(180, Math.round(numeric)));
        }

        function normalizeShapeType(value) {
          const raw = String(value || "").trim().toLowerCase();
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
          return "";
        }

        function shapeSupportsCornerRadius(shapeType) {
          return shapeType === "rectangle" || shapeType === "square";
        }

        function getDefaultShapeRadius(shapeType) {
          if (shapeType === "rounded-rectangle") return 20;
          if (shapeType === "circle") return 999;
          return 0;
        }

        function normalizeShapeRadius(value) {
          const numeric = Number.parseFloat(String(value || "").trim());
          if (!Number.isFinite(numeric)) return 0;
          return Math.max(0, Math.min(999, Math.round(numeric)));
        }

        function resolveShapeFillRadius(shapeType, value) {
          if (!shapeType) return normalizeShapeRadius(value);
          if (shapeSupportsCornerRadius(shapeType)) return normalizeShapeRadius(value);
          return getDefaultShapeRadius(shapeType);
        }

        function shapeSupportsSides(shapeType) {
          return shapeType === "triangle" || shapeType === "polygon" || shapeType === "star";
        }

        function getDefaultShapeSides(shapeType) {
          if (shapeType === "triangle") return 3;
          if (shapeType === "polygon") return 5;
          if (shapeType === "star") return 5;
          return 5;
        }

        function normalizeShapeSides(shapeType, value) {
          const parsed = Number.parseFloat(String(value || "").trim());
          const fallback = getDefaultShapeSides(shapeType);
          const safe = Number.isFinite(parsed) ? parsed : fallback;
          return Math.max(3, Math.min(12, Math.round(safe)));
        }

        function resolveShapeSides(shapeType, value) {
          if (!shapeType) return normalizeShapeSides(shapeType, value);
          return normalizeShapeSides(shapeType, value);
        }

        function buildRegularPolygonClipPath(sides) {
          const safeSides = Math.max(3, Math.min(12, Math.round(sides)));
          const points = Array.from({ length: safeSides }, function(_, index) {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / safeSides;
            const x = 50 + Math.cos(angle) * 50;
            const y = 50 + Math.sin(angle) * 50;
            return String(x.toFixed(3)) + "% " + String(y.toFixed(3)) + "%";
          });
          return "polygon(" + points.join(",") + ")";
        }

        function buildStarClipPath(sides) {
          const safeSides = Math.max(3, Math.min(12, Math.round(sides)));
          const outerRadius = 50;
          const innerRadius = 21;
          const points = Array.from({ length: safeSides * 2 }, function(_, index) {
            const isOuter = index % 2 === 0;
            const radius = isOuter ? outerRadius : innerRadius;
            const angle = -Math.PI / 2 + (index * Math.PI) / safeSides;
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            return String(x.toFixed(3)) + "% " + String(y.toFixed(3)) + "%";
          });
          return "polygon(" + points.join(",") + ")";
        }

        function getShapeClipPath(shapeType, shapeSides) {
          if (shapeType === "triangle" || shapeType === "polygon") {
            return buildRegularPolygonClipPath(resolveShapeSides(shapeType, shapeSides));
          }
          if (shapeType === "star") {
            return buildStarClipPath(resolveShapeSides(shapeType, shapeSides));
          }
          if (shapeType === "diamond") {
            return "polygon(50% 0%,100% 50%,50% 100%,0% 50%)";
          }
          return "";
        }

        function buildRegularPolygonPoints(sides) {
          const safeSides = Math.max(3, Math.min(12, Math.round(sides)));
          return Array.from({ length: safeSides }, function(_, index) {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / safeSides;
            const x = 0.5 + Math.cos(angle) * 0.5;
            const y = 0.5 + Math.sin(angle) * 0.5;
            return { x: x, y: y };
          });
        }

        function buildStarPoints(sides) {
          const safeSides = Math.max(3, Math.min(12, Math.round(sides)));
          const outerRadius = 0.5;
          const innerRadius = 0.21;
          return Array.from({ length: safeSides * 2 }, function(_, index) {
            const isOuter = index % 2 === 0;
            const radius = isOuter ? outerRadius : innerRadius;
            const angle = -Math.PI / 2 + (index * Math.PI) / safeSides;
            const x = 0.5 + Math.cos(angle) * radius;
            const y = 0.5 + Math.sin(angle) * radius;
            return { x: x, y: y };
          });
        }

        function isPointInsidePolygon(x, y, points) {
          let inside = false;
          for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x;
            const yi = points[i].y;
            const xj = points[j].x;
            const yj = points[j].y;
            const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi;
            if (intersects) inside = !inside;
          }
          return inside;
        }

        function alphaFromColor(value) {
          const raw = String(value || "").trim().toLowerCase();
          if (!raw || raw === "transparent" || raw === "none") return 0;
          if (raw.startsWith("#")) {
            if (raw.length === 9) {
              const alphaHex = raw.slice(7, 9);
              const alpha = Number.parseInt(alphaHex, 16);
              if (Number.isFinite(alpha)) return alpha / 255;
            }
            return 1;
          }
          const rgba = raw.match(/^rgba?\(([^)]+)\)$/);
          if (!rgba || !rgba[1]) return 1;
          const parts = rgba[1].split(",").map(function(part) {
            return part.trim();
          });
          if (parts.length < 3) return 1;
          const alpha = parts[3] ? Number.parseFloat(parts[3]) : 1;
          return Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
        }

        function resolveRgbTuple(colorValue) {
          const raw = String(colorValue || "").trim();
          const hexMatch = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
          if (hexMatch && hexMatch[1]) {
            const expandedHex =
              hexMatch[1].length === 3
                ? hexMatch[1]
                    .split("")
                    .map(function(char) {
                      return char + char;
                    })
                    .join("")
                : hexMatch[1];
            return [
              Number.parseInt(expandedHex.slice(0, 2), 16),
              Number.parseInt(expandedHex.slice(2, 4), 16),
              Number.parseInt(expandedHex.slice(4, 6), 16)
            ];
          }
          const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i);
          if (rgbMatch && rgbMatch[1]) {
            const rgbParts = rgbMatch[1]
              .split(",")
              .slice(0, 3)
              .map(function(part) {
                const parsed = Number.parseFloat(part.trim());
                return Number.isFinite(parsed) ? Math.max(0, Math.min(255, Math.round(parsed))) : NaN;
              });
            if (!rgbParts.some(function(part) { return !Number.isFinite(part); })) {
              return [rgbParts[0], rgbParts[1], rgbParts[2]];
            }
          }
          const probe = document.createElement("span");
          probe.style.color = "#000000";
          probe.style.color = colorValue || "#000000";
          probe.style.position = "absolute";
          probe.style.opacity = "0";
          probe.style.pointerEvents = "none";
          probe.style.left = "-9999px";
          document.body.appendChild(probe);
          const computed = window.getComputedStyle(probe).color || "rgb(0, 0, 0)";
          probe.remove();
          const match = computed.match(/^rgba?\(([^)]+)\)$/);
          if (!match || !match[1]) return [0, 0, 0];
          const parts = match[1]
            .split(",")
            .slice(0, 3)
            .map(function(part) {
              const parsed = Number.parseFloat(part.trim());
              return Number.isFinite(parsed) ? Math.max(0, Math.min(255, Math.round(parsed))) : 0;
            });
          return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
        }

        function colorToRgba(colorValue, opacityPercent) {
          const normalizedColor = normalizeShapeColor(colorValue || "");
          if (!normalizedColor || normalizedColor === "none") return "rgba(0, 0, 0, 0)";
          const tuple = resolveRgbTuple(normalizedColor);
          const alpha = Math.max(0, Math.min(1, normalizeShapeOpacity(opacityPercent) / 100));
          return (
            "rgba(" +
            String(tuple[0]) +
            ", " +
            String(tuple[1]) +
            ", " +
            String(tuple[2]) +
            ", " +
            String(alpha) +
            ")"
          );
        }

        function applyShapeFillStyle(
          fillNode,
          fillMode,
          fillColor,
          fillOpacity,
          gradientStartColor,
          gradientEndColor,
          gradientAngle,
          fillImageSrc,
          fillImageOffsetX,
          fillImageOffsetY
        ) {
          if (!(fillNode instanceof HTMLElement)) return;
          const normalizedMode = normalizeShapeFillMode(fillMode);
          const normalizedFillColor = normalizeShapeColor(fillColor || "") || "#9ca3af";
          const normalizedFillOpacity = normalizeShapeOpacity(fillOpacity);
          const normalizedGradientStart = normalizeShapeColor(gradientStartColor || "") || "#9ca3af";
          const normalizedGradientEnd = normalizeShapeColor(gradientEndColor || "") || "#6b7280";
          const normalizedGradientAngle = normalizeShapeGradientAngle(gradientAngle);
          const normalizedImageSrc = String(fillImageSrc || "").trim();
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
            fillNode.style.backgroundImage = 'url("' + normalizedImageSrc.replace(/"/g, "%22") + '")';
            fillNode.style.backgroundSize = "cover";
            fillNode.style.backgroundPositionX = String(imagePositionX) + "%";
            fillNode.style.backgroundPositionY = String(imagePositionY) + "%";
            fillNode.style.backgroundPosition =
              String(imagePositionX) + "% " + String(imagePositionY) + "%";
            fillNode.style.backgroundRepeat = "no-repeat";
            return;
          }

          if (normalizedMode === "gradient") {
            const start = colorToRgba(normalizedGradientStart, normalizedFillOpacity);
            const end = colorToRgba(normalizedGradientEnd, normalizedFillOpacity);
            const gradient =
              "linear-gradient(" +
              String(normalizedGradientAngle) +
              "deg, " +
              start +
              " 0%, " +
              end +
              " 100%)";
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

          const fillRgba = colorToRgba(normalizedFillColor, normalizedFillOpacity);
          fillNode.style.background = fillRgba;
          fillNode.style.backgroundColor = fillRgba;
        }

        function postPageUpdated() {
          const root = document.getElementById("preview-root");
          if (!root) return;
          const snapshot = root.cloneNode(true);
          if (!(snapshot instanceof HTMLElement)) return;
          snapshot.querySelectorAll("[data-fx-bound]").forEach(function(node) {
            if (!(node instanceof HTMLElement)) return;
            node.removeAttribute("data-fx-bound");
          });
          snapshot.querySelectorAll(".fx-selected").forEach(function(node) {
            if (!(node instanceof HTMLElement)) return;
            node.classList.remove("fx-selected");
          });
          snapshot
            .querySelectorAll(".fx-image-frame.is-active,.fx-text-frame.is-active")
            .forEach(function(node) {
              if (!(node instanceof HTMLElement)) return;
              node.classList.remove("is-active");
            });
          window.parent.postMessage(
            {
              type: "preview-page-updated",
              workspaceId: workspaceId,
              route: document.body.getAttribute("data-preview-route") || "/",
              html: snapshot.innerHTML
            },
            "*"
          );
        }

        function ensureTextFrameId(frame) {
          if (!(frame instanceof HTMLElement)) return "";
          if (!frame.dataset.fxId) {
            frame.dataset.fxId =
              "fx-text-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
          }
          return frame.dataset.fxId || "";
        }

        function ensureShapeFrameId(frame) {
          if (!(frame instanceof HTMLElement)) return "";
          if (!frame.dataset.fxId) {
            frame.dataset.fxId =
              "fx-shape-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
          }
          return frame.dataset.fxId || "";
        }

        function ensureImageFrameId(frame) {
          if (!(frame instanceof HTMLElement)) return "";
          if (!frame.dataset.fxId) {
            frame.dataset.fxId =
              "fx-image-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
          }
          return frame.dataset.fxId || "";
        }

        function selectElement(element) {
          if (!(element instanceof HTMLElement)) return;
          clearSelection();
          element.classList.add("fx-selected");
          if (!element.classList.contains("fx-text-frame")) {
            const active = document.activeElement;
            if (active instanceof HTMLElement && active.isContentEditable) {
              active.blur();
            }
            postTextSelection("", "", "", "", "", "", "", "", "", "", "", "");
            if (element.classList.contains("fx-shape-frame")) {
              let shouldPersistMutation = !element.dataset.fxId;
              const shapeId = ensureShapeFrameId(element);
              const shapeType = normalizeShapeType(
                element.dataset.fxShape || element.getAttribute("data-fx-shape") || ""
              );
              const fillNode = element.querySelector(".fx-shape-fill");
              let fillMode = element.dataset.fxFillMode || "";
              let fillColor = normalizeShapeColor(element.dataset.fxFill || "");
              let fillGradientStartColor = normalizeShapeColor(
                element.dataset.fxFillGradientStart || ""
              );
              let fillGradientEndColor = normalizeShapeColor(
                element.dataset.fxFillGradientEnd || ""
              );
              let fillGradientAngle = element.dataset.fxFillGradientAngle || "";
              let fillImageSrc = element.dataset.fxFillImage || "";
              let fillImageOffsetX = element.dataset.fxFillImageX || "";
              let fillImageOffsetY = element.dataset.fxFillImageY || "";
              let strokeColor = normalizeShapeColor(element.dataset.fxStroke || "");
              let strokeWidth = element.dataset.fxStrokeWidth || "2";
              let shapeSides = element.dataset.fxShapeSides || "";
              let fillOpacity = element.dataset.fxFillOpacity || "";
              let fillRadius = element.dataset.fxFillRadius || "";
              let rotation = element.dataset.fxRotation || "";
              let strokeOpacity = element.dataset.fxStrokeOpacity || "";
              if (fillNode instanceof HTMLElement) {
                const computed = window.getComputedStyle(fillNode);
                if (!fillColor) {
                  fillColor = normalizeShapeColor(fillNode.dataset.fxFill || "");
                }
                if (!fillMode) {
                  fillMode = fillNode.dataset.fxFillMode || "";
                }
                if (!fillGradientStartColor) {
                  fillGradientStartColor = normalizeShapeColor(
                    fillNode.dataset.fxFillGradientStart || ""
                  );
                }
                if (!fillGradientEndColor) {
                  fillGradientEndColor = normalizeShapeColor(
                    fillNode.dataset.fxFillGradientEnd || ""
                  );
                }
                if (!fillGradientAngle) {
                  fillGradientAngle = fillNode.dataset.fxFillGradientAngle || "";
                }
                if (!fillImageSrc) {
                  fillImageSrc = fillNode.dataset.fxFillImage || "";
                }
                if (!fillImageOffsetX) {
                  fillImageOffsetX =
                    fillNode.dataset.fxFillImageX || element.dataset.fxFillImageX || "";
                }
                if (!fillImageOffsetY) {
                  fillImageOffsetY =
                    fillNode.dataset.fxFillImageY || element.dataset.fxFillImageY || "";
                }
                if (!strokeColor) {
                  strokeColor = normalizeShapeColor(fillNode.dataset.fxStroke || "");
                }
                if (!fillOpacity) {
                  fillOpacity =
                    fillNode.dataset.fxFillOpacity || element.dataset.fxFillOpacity || "";
                }
                if (!strokeOpacity) {
                  strokeOpacity =
                    fillNode.dataset.fxStrokeOpacity || element.dataset.fxStrokeOpacity || "";
                }
                if (!strokeWidth) {
                  const widthFromStyle = Number.parseFloat(
                    fillNode.style.borderWidth || computed.borderWidth || "2"
                  );
                  strokeWidth = Number.isFinite(widthFromStyle)
                    ? String(Math.max(0, Math.round(widthFromStyle)))
                    : "2";
                }
                if (!shapeSides) {
                  shapeSides =
                    fillNode.dataset.fxShapeSides || element.dataset.fxShapeSides || "";
                }
                if (!fillRadius) {
                  fillRadius =
                    fillNode.dataset.fxFillRadius ||
                    element.dataset.fxFillRadius ||
                    "0";
                }
                if (!rotation) {
                  rotation = fillNode.dataset.fxRotation || element.dataset.fxRotation || "0";
                }
                if (!fillNode.dataset.fxFill && fillColor) {
                  fillNode.dataset.fxFill = fillColor;
                  shouldPersistMutation = true;
                }
                if (!fillNode.dataset.fxStroke && strokeColor) {
                  fillNode.dataset.fxStroke = strokeColor;
                  shouldPersistMutation = true;
                }
              }

              const normalizedFillMode = normalizeShapeFillMode(
                fillMode ||
                  (String(fillImageSrc || "").trim()
                    ? "image"
                    : fillNode instanceof HTMLElement &&
                        (fillNode.style.backgroundImage ||
                          window.getComputedStyle(fillNode).backgroundImage ||
                          "").indexOf("gradient") >= 0
                      ? "gradient"
                      : "color")
              );
              fillColor = normalizeShapeColor(fillColor || "none");
              if (!fillColor && normalizedFillMode === "color") {
                fillColor = "#9ca3af";
              }
              const fillGradientStartColorValue =
                normalizeShapeColor(fillGradientStartColor || "") || "#9ca3af";
              const fillGradientEndColorValue =
                normalizeShapeColor(fillGradientEndColor || "") || "#6b7280";
              const fillGradientAngleValue = normalizeShapeGradientAngle(fillGradientAngle);
              const fillImageSrcValue = String(fillImageSrc || "").trim();
              const fillImageOffsetXValue = normalizeShapeImageOffset(fillImageOffsetX);
              const fillImageOffsetYValue = normalizeShapeImageOffset(fillImageOffsetY);
              strokeColor = normalizeShapeColor(strokeColor || "none");
              if (!fillColor) fillColor = "none";
              if (!strokeColor) strokeColor = "none";
              const fillOpacityValue = normalizeShapeOpacity(fillOpacity);
              const strokeOpacityValue = normalizeShapeOpacity(strokeOpacity);
              const strokeWidthPx = normalizeShapeStrokeWidth(strokeWidth);
              const shapeSidesValue = resolveShapeSides(shapeType, shapeSides);
              const fillRadiusValue = resolveShapeFillRadius(shapeType, fillRadius);
              const rotationValue = normalizeShapeRotation(rotation);
              const shapeClipPath = getShapeClipPath(shapeType, shapeSidesValue);

              if (element.dataset.fxFillMode !== normalizedFillMode) {
                element.dataset.fxFillMode = normalizedFillMode;
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFill !== fillColor) {
                element.dataset.fxFill = fillColor;
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFillGradientStart !== fillGradientStartColorValue) {
                element.dataset.fxFillGradientStart = fillGradientStartColorValue;
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFillGradientEnd !== fillGradientEndColorValue) {
                element.dataset.fxFillGradientEnd = fillGradientEndColorValue;
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFillGradientAngle !== String(fillGradientAngleValue)) {
                element.dataset.fxFillGradientAngle = String(fillGradientAngleValue);
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFillImage !== fillImageSrcValue) {
                element.dataset.fxFillImage = fillImageSrcValue;
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFillImageX !== String(fillImageOffsetXValue)) {
                element.dataset.fxFillImageX = String(fillImageOffsetXValue);
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFillImageY !== String(fillImageOffsetYValue)) {
                element.dataset.fxFillImageY = String(fillImageOffsetYValue);
                shouldPersistMutation = true;
              }
              if (element.dataset.fxStroke !== strokeColor) {
                element.dataset.fxStroke = strokeColor;
                shouldPersistMutation = true;
              }
              if (element.dataset.fxStrokeWidth !== String(strokeWidthPx)) {
                element.dataset.fxStrokeWidth = String(strokeWidthPx);
                shouldPersistMutation = true;
              }
              if (element.dataset.fxShapeSides !== String(shapeSidesValue)) {
                element.dataset.fxShapeSides = String(shapeSidesValue);
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFillOpacity !== String(fillOpacityValue)) {
                element.dataset.fxFillOpacity = String(fillOpacityValue);
                shouldPersistMutation = true;
              }
              if (element.dataset.fxStrokeOpacity !== String(strokeOpacityValue)) {
                element.dataset.fxStrokeOpacity = String(strokeOpacityValue);
                shouldPersistMutation = true;
              }
              if (element.dataset.fxFillRadius !== String(fillRadiusValue)) {
                element.dataset.fxFillRadius = String(fillRadiusValue);
                shouldPersistMutation = true;
              }
              if (element.dataset.fxRotation !== String(rotationValue)) {
                element.dataset.fxRotation = String(rotationValue);
                shouldPersistMutation = true;
              }

              if (fillNode instanceof HTMLElement) {
                fillNode.dataset.fxFillMode = normalizedFillMode;
                fillNode.dataset.fxFill = fillColor;
                fillNode.dataset.fxFillGradientStart = fillGradientStartColorValue;
                fillNode.dataset.fxFillGradientEnd = fillGradientEndColorValue;
                fillNode.dataset.fxFillGradientAngle = String(fillGradientAngleValue);
                fillNode.dataset.fxFillImage = fillImageSrcValue;
                fillNode.dataset.fxFillImageX = String(fillImageOffsetXValue);
                fillNode.dataset.fxFillImageY = String(fillImageOffsetYValue);
                fillNode.dataset.fxStroke = strokeColor;
                fillNode.dataset.fxFillOpacity = String(fillOpacityValue);
                fillNode.dataset.fxShapeSides = String(shapeSidesValue);
                fillNode.dataset.fxFillRadius = String(fillRadiusValue);
                fillNode.dataset.fxRotation = String(rotationValue);
                fillNode.dataset.fxStrokeOpacity = String(strokeOpacityValue);
                element.dataset.fxFillOpacity = String(fillOpacityValue);
                element.dataset.fxStrokeOpacity = String(strokeOpacityValue);
                applyShapeFillStyle(
                  fillNode,
                  normalizedFillMode,
                  fillColor,
                  fillOpacityValue,
                  fillGradientStartColorValue,
                  fillGradientEndColorValue,
                  fillGradientAngleValue,
                  fillImageSrcValue,
                  fillImageOffsetXValue,
                  fillImageOffsetYValue
                );
                fillNode.style.borderRadius = fillRadiusValue + "px";
                fillNode.style.transform = "rotate(" + String(rotationValue) + "deg)";
                fillNode.style.transformOrigin = "center center";
                if (shapeClipPath) {
                  fillNode.style.clipPath = shapeClipPath;
                } else {
                  fillNode.style.removeProperty("clip-path");
                }
              }
              if (shouldPersistMutation) postPageUpdated();
              postShapeSelection(
                shapeId,
                shapeType,
                normalizedFillMode,
                fillColor,
                fillGradientStartColorValue,
                fillGradientEndColorValue,
                fillGradientAngleValue,
                fillImageSrcValue,
                fillImageOffsetXValue,
                fillImageOffsetYValue,
                strokeColor,
                strokeWidthPx,
                shapeSidesValue,
                fillOpacityValue,
                fillRadiusValue,
                rotationValue,
                strokeOpacityValue
              );
              return;
            }
            if (element.classList.contains("fx-image-frame")) {
              const shouldPersistMutation = !element.dataset.fxId;
              const frameId = ensureImageFrameId(element);
              const image = element.querySelector("img");
              const src = image?.getAttribute("src") || image?.getAttribute("data-src") || "";
              const imageTone = resolveImageTone(element, image);
              const imageOrigin = resolveImageOrigin(element, image);
              if (shouldPersistMutation) postPageUpdated();
              postImageSelection(
                frameId,
                src,
                imageTone.brightness,
                imageTone.saturation,
                imageTone.imageOffsetX,
                imageTone.imageOffsetY,
                imageTone.filterPreset,
                imageOrigin
              );
              return;
            }
            postShapeSelection("", "", "color", "", "#9ca3af", "#6b7280", 135, "", 0, 0, "", 2, 5, 100, 0, 0, 100);
            return;
          }
          postShapeSelection("", "", "color", "", "#9ca3af", "#6b7280", 135, "", 0, 0, "", 2, 5, 100, 0, 0, 100);
          let shouldPersistMutation = !element.dataset.fxId;
          const textId = ensureTextFrameId(element);
          const content = element.querySelector(".fx-text-content");
          let fontFamily = "";
          let fontWeight = "";
          let fontSize = "";
          let textColor = "";
          let textDecorationStyle = "none";
          let textAlign = "";
          let lineHeight = "";
          let wordSpacing = "";
          let characterSpacing = "";
          let bulletListStyle = "none";
          let numberedListStyle = "none";
          if (content instanceof HTMLElement) {
            fontFamily =
              content.dataset.fxFontFamily ||
              content.style.fontFamily ||
              content.getAttribute("data-fx-font-family") ||
              "";
            if (!fontFamily) {
              fontFamily = window.getComputedStyle(content).fontFamily || "";
            }
            if (!content.dataset.fxFontFamily && fontFamily) {
              content.dataset.fxFontFamily = fontFamily;
              shouldPersistMutation = true;
            }
            fontWeight =
              content.dataset.fxFontWeight ||
              content.style.fontWeight ||
              content.getAttribute("data-fx-font-weight") ||
              "";
            if (!fontWeight) {
              fontWeight = window.getComputedStyle(content).fontWeight || "";
            }
            if (!content.dataset.fxFontWeight && fontWeight) {
              content.dataset.fxFontWeight = fontWeight;
              shouldPersistMutation = true;
            }
            fontSize =
              content.dataset.fxFontSize ||
              content.style.fontSize ||
              content.getAttribute("data-fx-font-size") ||
              "";
            if (!fontSize) {
              fontSize = window.getComputedStyle(content).fontSize || "";
            }
            if (!content.dataset.fxFontSize && fontSize) {
              content.dataset.fxFontSize = fontSize;
              shouldPersistMutation = true;
            }
            textColor =
              content.dataset.fxTextColor ||
              content.style.color ||
              content.getAttribute("data-fx-text-color") ||
              "";
            if (!textColor) {
              textColor = window.getComputedStyle(content).color || "";
            }
            if (!content.dataset.fxTextColor && textColor) {
              content.dataset.fxTextColor = textColor;
              shouldPersistMutation = true;
            }
            textDecorationStyle =
              content.dataset.fxTextDecorationStyle ||
              content.style.textDecorationLine ||
              content.getAttribute("data-fx-text-decoration-style") ||
              "";
            if (!textDecorationStyle) {
              textDecorationStyle = normalizeTextDecorationStyle(
                window.getComputedStyle(content).textDecorationLine || "",
                window.getComputedStyle(content).fontStyle || ""
              );
            } else {
              textDecorationStyle = normalizeTextDecorationStyle(
                textDecorationStyle,
                content.style.fontStyle || window.getComputedStyle(content).fontStyle || ""
              );
            }
            if (!content.dataset.fxTextDecorationStyle && textDecorationStyle) {
              content.dataset.fxTextDecorationStyle = textDecorationStyle;
              shouldPersistMutation = true;
            }
            textAlign =
              content.dataset.fxTextAlign ||
              content.style.textAlign ||
              content.getAttribute("data-fx-text-align") ||
              "";
            if (!textAlign) {
              textAlign = window.getComputedStyle(content).textAlign || "";
            }
            if (!content.dataset.fxTextAlign && textAlign) {
              content.dataset.fxTextAlign = textAlign;
              shouldPersistMutation = true;
            }
            lineHeight =
              content.dataset.fxLineHeight ||
              content.style.lineHeight ||
              content.getAttribute("data-fx-line-height") ||
              "";
            if (!lineHeight) {
              lineHeight = window.getComputedStyle(content).lineHeight || "";
            }
            if (!content.dataset.fxLineHeight && lineHeight) {
              content.dataset.fxLineHeight = lineHeight;
              shouldPersistMutation = true;
            }
            wordSpacing =
              content.dataset.fxWordSpacing ||
              content.style.wordSpacing ||
              content.getAttribute("data-fx-word-spacing") ||
              "";
            if (!wordSpacing) {
              wordSpacing = window.getComputedStyle(content).wordSpacing || "";
            }
            if (!content.dataset.fxWordSpacing && wordSpacing) {
              content.dataset.fxWordSpacing = wordSpacing;
              shouldPersistMutation = true;
            }
            characterSpacing =
              content.dataset.fxCharacterSpacing ||
              content.style.letterSpacing ||
              content.getAttribute("data-fx-character-spacing") ||
              "";
            if (!characterSpacing) {
              characterSpacing = window.getComputedStyle(content).letterSpacing || "";
            }
            if (!content.dataset.fxCharacterSpacing && characterSpacing) {
              content.dataset.fxCharacterSpacing = characterSpacing;
              shouldPersistMutation = true;
            }
            bulletListStyle =
              content.dataset.fxBulletListStyle ||
              content.getAttribute("data-fx-bullet-list-style") ||
              "";
            numberedListStyle =
              content.dataset.fxNumberedListStyle ||
              content.getAttribute("data-fx-numbered-list-style") ||
              "";
            const first = content.firstElementChild;
            const firstList =
              first instanceof HTMLUListElement || first instanceof HTMLOListElement ? first : null;
            const listNode = firstList ?? content.querySelector("ul,ol");
            if (listNode instanceof HTMLOListElement) {
              const orderedType = normalizeNumberedListStyle(
                listNode.style.listStyleType || window.getComputedStyle(listNode).listStyleType || ""
              );
              numberedListStyle = normalizeNumberedListStyle(numberedListStyle);
              numberedListStyle = numberedListStyle === "none" ? orderedType || "decimal" : numberedListStyle;
              bulletListStyle = "none";
            } else if (listNode instanceof HTMLUListElement) {
              const unorderedType = normalizeBulletListStyle(
                listNode.style.listStyleType || window.getComputedStyle(listNode).listStyleType || ""
              );
              bulletListStyle = normalizeBulletListStyle(bulletListStyle);
              bulletListStyle = bulletListStyle === "none" ? unorderedType || "disc" : bulletListStyle;
              numberedListStyle = "none";
            } else {
              bulletListStyle = normalizeBulletListStyle(bulletListStyle);
              numberedListStyle = normalizeNumberedListStyle(numberedListStyle);
            }
            if (content.dataset.fxBulletListStyle !== bulletListStyle) {
              content.dataset.fxBulletListStyle = bulletListStyle;
              shouldPersistMutation = true;
            }
            if (content.dataset.fxNumberedListStyle !== numberedListStyle) {
              content.dataset.fxNumberedListStyle = numberedListStyle;
              shouldPersistMutation = true;
            }
          }
          if (shouldPersistMutation) postPageUpdated();
          postTextSelection(
            textId,
            fontFamily,
            fontWeight,
            fontSize,
            textColor,
            textDecorationStyle,
            textAlign,
            lineHeight,
            wordSpacing,
            characterSpacing,
            bulletListStyle,
            numberedListStyle
          );
        }

        function resolveDeleteTarget(node, root) {
          if (!(node instanceof HTMLElement)) return null;
          const frame = node.closest(".fx-image-frame,.fx-text-frame");
          if (frame instanceof HTMLElement && root.contains(frame)) return frame;
          if (root.contains(node) && node !== root) return node;
          return null;
        }

        styleEl.textContent =
          ${JSON.stringify(baseCss)} +
          "\\n" +
          (${JSON.stringify(page.css)} || "") +
          "\\n" +
          (${JSON.stringify(staticPreview)} ? ${JSON.stringify(staticPreviewOverridesCss)} : "");
        initializeFrameInteractions();
        syncPreviewCanvasScale();
        window.addEventListener("resize", syncPreviewCanvasScale);

        (function initSelectionMove() {
          if (${JSON.stringify(enableInternalRouting)} && !isCanvasWorkspace) return;
          const root = document.getElementById("preview-root");
          if (!root) return;
          if (!isCanvasWorkspace) return;
          const selectableSelector = ".fx-image-frame,.fx-text-frame,img";

          root.addEventListener("pointerdown", function(event) {
            const targetEl = asElement(event.target);
            if (!targetEl) return;
            if (typeof root.focus === "function") {
              root.focus({ preventScroll: true });
            }
            const rawTarget = targetEl.closest(selectableSelector);
            const target =
              rawTarget instanceof HTMLElement
                ? rawTarget.closest(".fx-image-frame,.fx-text-frame") || rawTarget
                : null;
            const handle = targetEl.closest(".fx-handle");
            if (
              target instanceof HTMLElement &&
              target.classList.contains("fx-shape-frame") &&
              !handle &&
              !isPointerInsideRenderableShape(target, event.clientX, event.clientY)
            ) {
              clearSelection();
              postTextSelection("", "", "", "", "", "", "", "", "", "", "", "");
              postShapeSelection("", "", "color", "", "#9ca3af", "#6b7280", 135, "", 0, 0, "", 2, 5, 100, 0, 0, 100);
              return;
            }
            if (!target || !(target instanceof HTMLElement) || !root.contains(target)) {
              clearSelection();
              postTextSelection("", "", "", "", "", "", "", "", "", "", "", "");
              postShapeSelection("", "", "color", "", "#9ca3af", "#6b7280", 135, "", 0, 0, "", 2, 5, 100, 0, 0, 100);
              return;
            }
            if (!isSelectionTool) return;
            selectElement(target);
          });
        })();

        (function initSelectionDelete() {
          if (${JSON.stringify(enableInternalRouting)} && !isCanvasWorkspace) return;
          if (!isCanvasWorkspace) return;

          document.addEventListener("keydown", function(event) {
            if (event.key !== "Delete" && event.key !== "Backspace") return;
            const root = document.getElementById("preview-root");
            if (!root) return;
            const selected = Array.from(root.querySelectorAll(".fx-selected"));
            if (!selected.length) return;
            const active = document.activeElement;
            const isEditableActive =
              active &&
              (active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement ||
                (active instanceof HTMLElement && active.isContentEditable));
            if (isEditableActive) {
              const activeElement = active instanceof Element ? active : null;
              const activeInsideSelected = !!(
                activeElement &&
                selected.some(function(node) {
                  return node instanceof Element && node.contains(activeElement);
                })
              );
              if (activeInsideSelected) return;
            }

            const targets = [];
            selected.forEach(function(node) {
              const target = resolveDeleteTarget(node, root);
              if (!target) return;
              const duplicate = targets.some(function(existing) {
                return existing === target || existing.contains(target) || target.contains(existing);
              });
              if (!duplicate) targets.push(target);
            });
            if (!targets.length) return;

            event.preventDefault();
            let removedCount = 0;
            targets.forEach(function(target) {
              if (!target.parentElement) return;
              target.remove();
              removedCount += 1;
            });
            if (!removedCount) return;
            clearSelection();
            postPageUpdated();
            postTextSelection("", "", "", "", "", "", "", "", "", "", "", "");
            postShapeSelection("", "", "color", "", "#9ca3af", "#6b7280", 135, "", 0, 0, "", 2, 5, 100, 0, 0, 100);
          });
        })();

        if (${JSON.stringify(enableInternalRouting)}) {
          const nav = document.createElement("div");
          nav.setAttribute("aria-label", "Page navigation");
          nav.style.position = "fixed";
          nav.style.left = "50%";
          nav.style.transform = "translateX(-50%)";
          nav.style.bottom = "14px";
          nav.style.display = "flex";
          nav.style.gap = "8px";
          nav.style.zIndex = "2147483000";

          function buildButton(label) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.style.width = "38px";
            button.style.height = "38px";
            button.style.border = "0";
            button.style.background = "#eef1f5";
            button.style.color = "#1f232d";
            button.style.fontSize = "18px";
            button.style.cursor = "pointer";
            button.style.borderRadius = "999px";
            button.style.display = "inline-flex";
            button.style.alignItems = "center";
            button.style.justifyContent = "center";
            button.style.boxShadow = "none";
            button.style.opacity = "1";
            return button;
          }

          prevButton = buildButton("←");
          nextButton = buildButton("→");

          prevButton.addEventListener("click", function (event) {
            event.preventDefault();
            const index = currentIndex >= 0 ? currentIndex : routeToIndex(document.body.getAttribute("data-preview-route") || "/");
            if (index <= 0) return;
            const prev = pageList[index - 1];
            if (prev) renderPageByRoute(prev.route, true);
          });

          nextButton.addEventListener("click", function (event) {
            event.preventDefault();
            const index = currentIndex >= 0 ? currentIndex : routeToIndex(document.body.getAttribute("data-preview-route") || "/");
            if (index < 0 || index >= pageList.length - 1) return;
            const next = pageList[index + 1];
            if (next) renderPageByRoute(next.route, true);
          });

          if (${JSON.stringify(workspaceId)} !== "websites") {
            nav.appendChild(prevButton);
            nav.appendChild(nextButton);
          }
          function placeNavBelowShell() {
            const shell = document.getElementById("preview-shell");
            if (!shell) {
              nav.style.left = "50%";
              nav.style.top = "auto";
              nav.style.bottom = "14px";
              nav.style.transform = "translateX(-50%)";
              return;
            }
            const rect = shell.getBoundingClientRect();
            nav.style.left = rect.left + rect.width / 2 + "px";
            const preferredTop = rect.bottom + 14;
            const maxTop = Math.max(12, window.innerHeight - 52);
            nav.style.top = Math.min(preferredTop, maxTop) + "px";
            nav.style.bottom = "auto";
            nav.style.transform = "translateX(-50%)";
          }

          document.body.appendChild(nav);
          placeNavBelowShell();
          window.addEventListener("resize", placeNavBelowShell);
          window.addEventListener("scroll", placeNavBelowShell, { passive: true });
          updateNavState();
        }

        document.addEventListener("click", function (event) {
          const target = asElement(event.target);
          if (!target) return;
          if (${JSON.stringify(enableInternalRouting)}) {
            const link = target.closest("a[href]");
            if (!link) return;
            const href = link.getAttribute("href") || "";
            if (!href) return;
            if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
            try {
              const nextUrl = new URL(href, window.location.origin);
              if (nextUrl.origin !== window.location.origin) return;
              const handled = renderPageByRoute(normalizeRoute(nextUrl.pathname), true);
              if (handled) event.preventDefault();
            } catch {
              // ignore parse errors
            }
            return;
          }
          if (isSelectionTool) return;
          if (activeTool !== "upload") return;
          const image = target.closest("img");
          if (image) {
            event.preventDefault();
            event.stopPropagation();
            const frame =
              image.closest(".fx-image-frame") instanceof HTMLElement
                ? image.closest(".fx-image-frame")
                : null;
            const frameId = frame ? ensureImageFrameId(frame) : "";
            const imageTone = resolveImageTone(frame, image);
            const imageOrigin = resolveImageOrigin(frame, image);
            postImageSelection(
              frameId,
              image.getAttribute("src") || image.src || "",
              imageTone.brightness,
              imageTone.saturation,
              imageTone.imageOffsetX,
              imageTone.imageOffsetY,
              imageTone.filterPreset,
              imageOrigin
            );
            return;
          }
          const link = target.closest("a[href]");
          if (!link) return;
          event.preventDefault();
        });

        if (${JSON.stringify(enableInternalRouting)}) {
          window.addEventListener("popstate", function () {
            renderPageByRoute(normalizeRoute(window.location.pathname), false);
          });
        }
      })();
    </script>
  </body>
</html>`;
}

export function buildThumbnailSrcDoc(page: GeneratedSiteContract["pages"][string]) {
  const baseCss = `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; overflow: hidden; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    img { max-width: 100%; display: block; }
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
  `;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${page.seo.title}</title>
    <style>${baseCss}\n${page.css}</style>
  </head>
  <body>
    ${page.html}
  </body>
</html>`;
}

export function PreviewTabs({
  site,
  activePage,
  workspaceId,
  canvasAspect = "16:9",
  customCanvasWidth = null,
  customCanvasHeight = null,
  showGridOverlay = false,
  gridPreset = "3x3",
  activeSlidesTool,
  clearSelectionSignal = 0,
  textFontRequest = null,
  shapeStyleRequest = null,
  imageStyleRequest = null,
  layerOrderCommand = null,
  referenceImages = null
}: PreviewTabsProps) {
  const currentPage = useMemo(() => (site ? site.pages[activePage] ?? null : null), [site, activePage]);
  const { aspectCss: canvasAspectCss, previewCanvasHeight, previewCanvasWidthPx } = getCanvasMetrics(
    canvasAspect,
    customCanvasWidth,
    customCanvasHeight
  );
  const isSlidesWorkspace = workspaceId === "slides";
  const isPagesWorkspace = workspaceId === "pages";
  const isCanvasWorkspace = isSlidesWorkspace || isPagesWorkspace;
  const gridPresetMatch = gridPreset.match(/^(\d+)x(\d+)$/i);
  const gridCols = Math.max(1, Number.parseInt(gridPresetMatch?.[1] ?? "3", 10) || 3);
  const gridRows = Math.max(1, Number.parseInt(gridPresetMatch?.[2] ?? "3", 10) || 3);
  const gridOverlayStyle = {
    backgroundImage:
      "linear-gradient(to right, rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.2) 1px, transparent 1px)",
    backgroundSize: `${100 / gridCols}% 100%, 100% ${100 / gridRows}%`
  } as const;
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const [slidesFitSize, setSlidesFitSize] = useState<{ width: number; height: number }>({
    width: 1320,
    height: previewCanvasHeight
  });
  const clearRuntimeSelection = (): boolean => {
    const frame = previewFrameRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return false;
    doc.querySelectorAll(".fx-selected").forEach((item) => {
      item.classList.remove("fx-selected");
    });
    doc.querySelectorAll(".fx-image-frame.is-active,.fx-text-frame.is-active").forEach((item) => {
      item.classList.remove("is-active");
    });
    return true;
  };

  useEffect(() => {
    if (!clearSelectionSignal) return;
    if (clearRuntimeSelection()) return;
    const frame = previewFrameRef.current;
    if (!frame) return;
    const onLoad = () => {
      clearRuntimeSelection();
    };
    frame.addEventListener("load", onLoad, { once: true });
    return () => frame.removeEventListener("load", onLoad);
  }, [clearSelectionSignal]);

  useEffect(() => {
    if (!layerOrderCommand) return;
    const applyLayerOrder = (): boolean => {
      const frame = previewFrameRef.current;
      const doc = frame?.contentDocument;
      if (!doc) return false;
      const root = doc.getElementById("preview-root");
      if (!root) return false;

      const resolveLayerTarget = (node: Element): HTMLElement | null => {
        const frameTarget = node.closest(".fx-image-frame,.fx-text-frame");
        if (frameTarget instanceof HTMLElement && root.contains(frameTarget)) return frameTarget;
        if (node instanceof HTMLElement && root.contains(node)) return node;
        return null;
      };

      const selectedNodes = [
        ...Array.from(root.querySelectorAll(".fx-selected")),
        ...Array.from(
          root.querySelectorAll(
            ".fx-image-frame.is-active,.fx-text-frame.is-active,.fx-shape-frame.is-active,[data-fx-shape].is-active"
          )
        )
      ];
      const layerTargets: HTMLElement[] = [];
      selectedNodes.forEach((node) => {
        const target = resolveLayerTarget(node);
        if (!target) return;
        const duplicate = layerTargets.some((existing) => existing === target);
        if (duplicate) return;
        const containedByExisting = layerTargets.some((existing) => existing.contains(target));
        if (containedByExisting) return;
        for (let index = layerTargets.length - 1; index >= 0; index -= 1) {
          const existing = layerTargets[index];
          if (target.contains(existing)) {
            layerTargets.splice(index, 1);
          }
        }
        layerTargets.push(target);
      });
      if (!layerTargets.length) return false;

      const groupedByParent = new Map<HTMLElement, HTMLElement[]>();
      layerTargets.forEach((target) => {
        const parent = target.parentElement;
        if (!(parent instanceof HTMLElement)) return;
        const grouped = groupedByParent.get(parent) ?? [];
        grouped.push(target);
        groupedByParent.set(parent, grouped);
      });

      groupedByParent.forEach((targets, parent) => {
        if (layerOrderCommand.direction === "front") {
          targets.forEach((target) => {
            parent.appendChild(target);
          });
          return;
        }
        for (let index = targets.length - 1; index >= 0; index -= 1) {
          const target = targets[index];
          parent.insertBefore(target, parent.firstChild);
        }
      });

      window.parent.postMessage(
        {
          type: "preview-page-updated",
          workspaceId,
          route: doc.body.getAttribute("data-preview-route") || "/",
          html: root.innerHTML
        },
        "*"
      );
      return true;
    };

    if (applyLayerOrder()) return;
    const frame = previewFrameRef.current;
    if (!frame) return;
    const onLoad = () => {
      applyLayerOrder();
    };
    frame.addEventListener("load", onLoad, { once: true });
    return () => frame.removeEventListener("load", onLoad);
  }, [layerOrderCommand, workspaceId]);

  useEffect(() => {
    if (!isCanvasWorkspace) return;
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const baseWidth = isPagesWorkspace ? Math.round(previewCanvasWidthPx) : 1320;
    const baseHeight = previewCanvasHeight;
    const updateFitSize = () => {
      const availableWidth = Math.max(1, viewport.clientWidth);
      const availableHeight = Math.max(1, viewport.clientHeight);
      const scale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight);
      const nextWidth = Math.max(1, Math.floor(baseWidth * scale));
      const nextHeight = Math.max(1, Math.floor(baseHeight * scale));
      setSlidesFitSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
    };
    updateFitSize();
    const observer = new ResizeObserver(() => updateFitSize());
    observer.observe(viewport);
    window.addEventListener("resize", updateFitSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateFitSize);
    };
  }, [isCanvasWorkspace, previewCanvasHeight]);

  useEffect(() => {
    if (!textFontRequest) return;
    const frame = previewFrameRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;

    const frames = Array.from(doc.querySelectorAll(".fx-text-frame"));
    const target = frames.find(
      (node) => node instanceof HTMLElement && node.dataset.fxId === textFontRequest.textId
    );
    if (!(target instanceof HTMLElement)) return;
    const content = target.querySelector(".fx-text-content");
    if (!(content instanceof HTMLElement)) return;

    const normalizeBulletListStyle = (value: string | undefined): "none" | "disc" | "circle" | "square" => {
      const raw = (value || "").trim().toLowerCase();
      if (raw === "disc" || raw === "circle" || raw === "square") return raw;
      return "none";
    };

    const normalizeNumberedListStyle = (
      value: string | undefined
    ): "none" | "decimal" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman" => {
      const raw = (value || "").trim().toLowerCase();
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

    const normalizeTextDecorationStyle = (
      textDecorationStyle: string | undefined,
      fontStyle?: string
    ): "none" | "underline" | "italic" | "line-through" => {
      const decorationRaw = (textDecorationStyle || "").trim().toLowerCase();
      if (decorationRaw === "underline") return "underline";
      if (decorationRaw === "italic") return "italic";
      if (decorationRaw === "line-through" || decorationRaw === "strikethrough") return "line-through";
      if (decorationRaw.includes("line-through")) return "line-through";
      if (decorationRaw.includes("underline")) return "underline";
      if (decorationRaw.includes("italic") || decorationRaw.includes("oblique")) return "italic";
      const fontStyleRaw = (fontStyle || "").trim().toLowerCase();
      if (fontStyleRaw.includes("italic") || fontStyleRaw.includes("oblique")) return "italic";
      return "none";
    };

    const readTextLines = (node: HTMLElement): string[] => {
      const first = node.firstElementChild;
      const firstList =
        first instanceof HTMLUListElement || first instanceof HTMLOListElement ? first : null;
      const existing = firstList ?? node.querySelector("ul,ol");
      if (existing && (existing.tagName === "UL" || existing.tagName === "OL")) {
        const listItems = Array.from(existing.children)
          .filter((item): item is HTMLLIElement => item instanceof HTMLLIElement)
          .map((item) => (item.textContent || "").replace(/\u00A0/g, " ").trim())
          .filter((item) => item.length > 0);
        if (listItems.length) return listItems;
      }
      const lines = (node.innerText || node.textContent || "")
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (lines.length) return lines;
      return ["List item"];
    };

    const applyListStyle = (
      node: HTMLElement,
      bulletStyle: "none" | "disc" | "circle" | "square",
      numberedStyle: "none" | "decimal" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman"
    ) => {
      const normalizedBullet = normalizeBulletListStyle(bulletStyle);
      const normalizedNumbered = normalizeNumberedListStyle(numberedStyle);
      const isOrdered = normalizedNumbered !== "none";
      const isUnordered = !isOrdered && normalizedBullet !== "none";
      const first = node.firstElementChild;
      const firstList =
        first instanceof HTMLUListElement || first instanceof HTMLOListElement ? first : null;
      const existing = firstList ?? node.querySelector("ul,ol");
      const existingList =
        existing && (existing.tagName === "UL" || existing.tagName === "OL")
          ? (existing as HTMLUListElement | HTMLOListElement)
          : null;

      if (!isOrdered && !isUnordered) {
        if (existingList) {
          const lines = Array.from(existingList.children)
            .filter((item): item is HTMLLIElement => item instanceof HTMLLIElement)
            .map((item) => (item.textContent || "").replace(/\u00A0/g, " ").trim())
            .filter((line) => line.length > 0);
          node.textContent = lines.join("\n") || "Edit text";
        }
        node.dataset.fxBulletListStyle = "none";
        node.dataset.fxNumberedListStyle = "none";
        return;
      }

      const desiredTag = isOrdered ? "ol" : "ul";
      const desiredType = isOrdered ? normalizedNumbered : normalizedBullet;
      const lines = readTextLines(node);
      let listEl: HTMLUListElement | HTMLOListElement;
      if (existingList && existingList.tagName.toLowerCase() === desiredTag) {
        listEl = existingList;
        listEl.classList.add("fx-text-list");
      } else {
        listEl = desiredTag === "ol" ? doc.createElement("ol") : doc.createElement("ul");
        listEl.className = "fx-text-list";
        lines.forEach((line) => {
          const li = doc.createElement("li");
          li.textContent = line;
          listEl.appendChild(li);
        });
        if (!listEl.children.length) {
          const li = doc.createElement("li");
          li.textContent = "List item";
          listEl.appendChild(li);
        }
        node.innerHTML = "";
        node.appendChild(listEl);
      }

      listEl.style.listStyleType = desiredType;
      listEl.style.margin = "0";
      listEl.style.paddingInlineStart = "1.25em";
      node.dataset.fxBulletListStyle = isUnordered ? normalizedBullet : "none";
      node.dataset.fxNumberedListStyle = isOrdered ? normalizedNumbered : "none";
    };

    const normalizedBulletListStyle = normalizeBulletListStyle(textFontRequest.bulletListStyle);
    const normalizedNumberedListStyle = normalizeNumberedListStyle(textFontRequest.numberedListStyle);
    const normalizedTextDecorationStyle = normalizeTextDecorationStyle(
      textFontRequest.textDecorationStyle ||
      content.dataset.fxTextDecorationStyle ||
      content.style.textDecorationLine ||
      window.getComputedStyle(content).textDecorationLine ||
      "",
      content.style.fontStyle || window.getComputedStyle(content).fontStyle || ""
    );
    content.style.fontFamily = textFontRequest.fontFamily;
    content.style.fontWeight = textFontRequest.fontWeight;
    content.style.fontSize = textFontRequest.fontSize ? `${textFontRequest.fontSize}pt` : "";
    content.style.color = textFontRequest.textColor;
    content.style.fontStyle = normalizedTextDecorationStyle === "italic" ? "italic" : "normal";
    content.style.textDecorationLine =
      normalizedTextDecorationStyle === "underline"
        ? "underline"
        : normalizedTextDecorationStyle === "line-through"
          ? "line-through"
          : "none";
    content.style.textAlign = textFontRequest.textAlign;
    content.style.lineHeight = textFontRequest.lineHeight
      ? `${Number.parseFloat(textFontRequest.lineHeight) / 100}`
      : "";
    content.style.wordSpacing = textFontRequest.wordSpacing ? `${textFontRequest.wordSpacing}px` : "";
    content.style.letterSpacing = textFontRequest.characterSpacing
      ? `${textFontRequest.characterSpacing}px`
      : "";
    content.dataset.fxFontFamily = textFontRequest.fontFamily;
    content.dataset.fxFontWeight = textFontRequest.fontWeight;
    content.dataset.fxFontSize = textFontRequest.fontSize;
    content.dataset.fxTextColor = textFontRequest.textColor;
    content.dataset.fxTextDecorationStyle = normalizedTextDecorationStyle;
    content.dataset.fxTextAlign = textFontRequest.textAlign;
    content.dataset.fxLineHeight = textFontRequest.lineHeight;
    content.dataset.fxWordSpacing = textFontRequest.wordSpacing;
    content.dataset.fxCharacterSpacing = textFontRequest.characterSpacing;
    applyListStyle(content, normalizedBulletListStyle, normalizedNumberedListStyle);
    const root = doc.getElementById("preview-root");
    if (!root) return;
    window.parent.postMessage(
      {
        type: "preview-page-updated",
        workspaceId,
        route: doc.body.getAttribute("data-preview-route") || "/",
        html: root.innerHTML
      },
      "*"
    );
    window.parent.postMessage(
      {
        type: "preview-text-selected",
        workspaceId,
        route: doc.body.getAttribute("data-preview-route") || "/",
        textId: textFontRequest.textId,
        fontFamily: textFontRequest.fontFamily,
        fontWeight: textFontRequest.fontWeight,
        fontSize: textFontRequest.fontSize,
        textColor: textFontRequest.textColor,
        textDecorationStyle: normalizedTextDecorationStyle,
        textAlign: textFontRequest.textAlign,
        lineHeight: textFontRequest.lineHeight,
        wordSpacing: textFontRequest.wordSpacing,
        characterSpacing: textFontRequest.characterSpacing,
        bulletListStyle: normalizedBulletListStyle,
        numberedListStyle: normalizedNumberedListStyle
      },
      "*"
    );
  }, [textFontRequest, workspaceId]);

  useEffect(() => {
    if (!shapeStyleRequest) return;
    const applyShapeStyleRequest = (): boolean => {
      const frame = previewFrameRef.current;
      const doc = frame?.contentDocument;
      if (!doc?.body) return false;
      const runtimeRoute = doc.body.getAttribute("data-preview-route") || "/";

      const shapeFrames = Array.from(doc.querySelectorAll(".fx-shape-frame"));
      const byId = shapeFrames.find(
        (node) => node instanceof HTMLElement && node.dataset.fxId === shapeStyleRequest.shapeId
      );
      const bySelection = doc.querySelector(".fx-shape-frame.fx-selected,.fx-shape-frame.is-active");
      const target = byId ?? bySelection;
      if (!(target instanceof HTMLElement)) return false;
      if (shapeStyleRequest.route && shapeStyleRequest.route !== runtimeRoute && !byId) return false;
      const fillNode = target.querySelector(".fx-shape-fill");
      if (!(fillNode instanceof HTMLElement)) return false;

      const normalizeShapeColor = (
        value: string | undefined,
        fallback: string
      ): string => {
        const rawSource = String(value || "").trim();
        const raw = rawSource.toLowerCase();
        if (!raw) return fallback;
        if (raw === "none" || raw === "transparent") return "none";
        const parseRgbParts = (source: string): number[] | "none" | null => {
          const normalized = String(source || "")
            .trim()
            .replace(/\s*\/\s*/g, ",");
          const rawParts =
            normalized.indexOf(",") >= 0
              ? normalized.split(",")
              : normalized.split(/\s+/);
          const parts = rawParts.map((part) => part.trim());
          if (parts.length < 3) return null;
          const alphaRaw = parts[3] || "";
          const alpha = alphaRaw ? Number.parseFloat(alphaRaw) : 1;
          if (Number.isFinite(alpha) && alpha <= 0) return "none";
          const rgb = parts.slice(0, 3).map((part) => {
            if (part.endsWith("%")) {
              const percent = Number.parseFloat(part);
              if (!Number.isFinite(percent)) return NaN;
              return Math.round((Math.max(0, Math.min(100, percent)) / 100) * 255);
            }
            const numeric = Number.parseFloat(part);
            if (!Number.isFinite(numeric)) return NaN;
            return Math.max(0, Math.min(255, Math.round(numeric)));
          });
          if (rgb.some((part) => !Number.isFinite(part))) return null;
          return rgb;
        };
        const isExplicitBlack =
          raw === "#000" ||
          raw === "#000000" ||
          raw === "black" ||
          raw === "rgb(0,0,0)" ||
          raw === "rgb(0, 0, 0)" ||
          raw === "rgba(0,0,0,1)" ||
          raw === "rgba(0, 0, 0, 1)" ||
          raw === "rgba(0,0,0,1.0)" ||
          raw === "rgba(0, 0, 0, 1.0)";
        if (/^#[0-9a-f]{3}$/i.test(raw)) {
          return `#${raw
            .slice(1)
            .split("")
            .map((char) => `${char}${char}`)
            .join("")}`;
        }
        if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;

        const rgba = raw.match(/^rgba?\(([^)]+)\)$/);
        if (rgba?.[1]) {
          const rgb = parseRgbParts(rgba[1]);
          if (rgb === "none") return "none";
          if (rgb) {
            return `#${rgb
              .map((part) => Number(part).toString(16).padStart(2, "0"))
              .join("")}`;
          }
        }

        const probe = doc.createElement("span");
        probe.style.color = "#000000";
        probe.style.color = rawSource;
        probe.style.position = "absolute";
        probe.style.opacity = "0";
        probe.style.pointerEvents = "none";
        probe.style.left = "-9999px";
        doc.body.appendChild(probe);
        const resolved = (doc.defaultView?.getComputedStyle(probe).color || "").trim().toLowerCase();
        probe.remove();
        const resolvedRgba = resolved.match(/^rgba?\(([^)]+)\)$/);
        if (!resolvedRgba?.[1]) return fallback;
        const resolvedRgb = parseRgbParts(resolvedRgba[1]);
        if (resolvedRgb === "none") return "none";
        if (!resolvedRgb) return fallback;
        if (
          !isExplicitBlack &&
          resolvedRgb[0] === 0 &&
          resolvedRgb[1] === 0 &&
          resolvedRgb[2] === 0
        ) {
          return fallback;
        }
        return `#${resolvedRgb
          .map((part) => Number(part).toString(16).padStart(2, "0"))
          .join("")}`;
      };

      const normalizeShapeFillMode = (
        value: string | undefined
      ): "color" | "gradient" | "image" => {
        const raw = (value || "").trim().toLowerCase();
        if (raw === "gradient") return "gradient";
        if (raw === "image") return "image";
        return "color";
      };

      const normalizeShapeGradientAngle = (value: string | number | undefined): number => {
        const parsed = Number.parseFloat(String(value ?? "").trim());
        if (!Number.isFinite(parsed)) return 135;
        return Math.max(0, Math.min(360, Math.round(parsed)));
      };

      const normalizeShapeImageOffset = (value: string | number | undefined): number => {
        const parsed = Number.parseFloat(String(value ?? "").trim());
        if (!Number.isFinite(parsed)) return 0;
        return Math.max(-100, Math.min(100, Math.round(parsed)));
      };

      const normalizeShapeOpacity = (value: string | number | undefined): number => {
        const parsed = Number.parseFloat(String(value ?? "").trim());
        if (!Number.isFinite(parsed)) return 100;
        return Math.max(0, Math.min(100, Math.round(parsed)));
      };

      const normalizeShapeStrokeWidth = (value: string | number | undefined): number => {
        const parsed = Number.parseFloat(String(value ?? "").trim());
        if (!Number.isFinite(parsed)) return 2;
        return Math.max(0, Math.min(64, Math.round(parsed)));
      };

      const normalizeShapeRotation = (value: string | number | undefined): number => {
        const raw = String(value ?? "").trim();
        const rotateMatch = raw.match(/rotate\(([-+]?\d*\.?\d+)deg\)/i);
        const parsed = rotateMatch
          ? Number.parseFloat(rotateMatch[1] || "")
          : Number.parseFloat(raw);
        if (!Number.isFinite(parsed)) return 0;
        return Math.max(-180, Math.min(180, Math.round(parsed)));
      };

      const normalizeShapeType = (value: string | undefined): string => {
        const raw = (value || "").trim().toLowerCase();
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
        return "";
      };

      const shapeSupportsCornerRadius = (shapeType: string): boolean =>
        shapeType === "rectangle" || shapeType === "square";

      const getDefaultShapeRadius = (shapeType: string): number => {
        if (shapeType === "rounded-rectangle") return 20;
        if (shapeType === "circle") return 999;
        return 0;
      };

      const normalizeShapeRadius = (value: string | number | undefined): number => {
        const parsed = Number.parseFloat(String(value ?? "").trim());
        if (!Number.isFinite(parsed)) return 0;
        return Math.max(0, Math.min(999, Math.round(parsed)));
      };

      const resolveShapeFillRadius = (shapeType: string, value: string | number | undefined): number => {
        if (!shapeType) return normalizeShapeRadius(value);
        if (shapeSupportsCornerRadius(shapeType)) return normalizeShapeRadius(value);
        return getDefaultShapeRadius(shapeType);
      };

      const getDefaultShapeSides = (shapeType: string): number => {
        if (shapeType === "triangle") return 3;
        if (shapeType === "polygon") return 5;
        if (shapeType === "star") return 5;
        return 5;
      };

      const normalizeShapeSides = (shapeType: string, value: string | number | undefined): number => {
        const parsed = Number.parseFloat(String(value ?? "").trim());
        const fallback = getDefaultShapeSides(shapeType);
        const safe = Number.isFinite(parsed) ? parsed : fallback;
        return Math.max(3, Math.min(12, Math.round(safe)));
      };

      const resolveShapeSides = (shapeType: string, value: string | number | undefined): number => {
        if (!shapeType) return normalizeShapeSides(shapeType, value);
        return normalizeShapeSides(shapeType, value);
      };

      const buildRegularPolygonClipPath = (sides: number): string => {
        const safeSides = Math.max(3, Math.min(12, Math.round(sides)));
        const points = Array.from({ length: safeSides }, (_, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / safeSides;
          const x = 50 + Math.cos(angle) * 50;
          const y = 50 + Math.sin(angle) * 50;
          return `${x.toFixed(3)}% ${y.toFixed(3)}%`;
        });
        return `polygon(${points.join(",")})`;
      };

      const buildStarClipPath = (sides: number): string => {
        const safeSides = Math.max(3, Math.min(12, Math.round(sides)));
        const outerRadius = 50;
        const innerRadius = 21;
        const points = Array.from({ length: safeSides * 2 }, (_, index) => {
          const isOuter = index % 2 === 0;
          const radius = isOuter ? outerRadius : innerRadius;
          const angle = -Math.PI / 2 + (index * Math.PI) / safeSides;
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          return `${x.toFixed(3)}% ${y.toFixed(3)}%`;
        });
        return `polygon(${points.join(",")})`;
      };

      const getShapeClipPath = (shapeType: string, shapeSides: number): string => {
        if (shapeType === "triangle" || shapeType === "polygon") {
          return buildRegularPolygonClipPath(shapeSides);
        }
        if (shapeType === "star") {
          return buildStarClipPath(shapeSides);
        }
        if (shapeType === "diamond") {
          return "polygon(50% 0%,100% 50%,50% 100%,0% 50%)";
        }
        return "";
      };

      const resolveRgbTuple = (colorValue: string): [number, number, number] => {
        const parseHex = (input: string): [number, number, number] | null => {
          const raw = String(input || "").trim().toLowerCase();
          const match = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
          if (!match?.[1]) return null;
          const hex =
            match[1].length === 3
              ? match[1]
                .split("")
                .map((char) => `${char}${char}`)
                .join("")
              : match[1];
          return [
            Number.parseInt(hex.slice(0, 2), 16),
            Number.parseInt(hex.slice(2, 4), 16),
            Number.parseInt(hex.slice(4, 6), 16)
          ];
        };
        const parseRgb = (input: string): [number, number, number] | null => {
          const raw = String(input || "").trim().toLowerCase();
          const match = raw.match(/^rgba?\(([^)]+)\)$/i);
          if (!match?.[1]) return null;
          const normalized = match[1].trim().replace(/\s*\/\s*/g, ",");
          const rawParts =
            normalized.indexOf(",") >= 0
              ? normalized.split(",")
              : normalized.split(/\s+/);
          const parts = rawParts.map((part) => part.trim());
          if (parts.length < 3) return null;
          const rgb = parts.slice(0, 3).map((part) => {
            if (part.endsWith("%")) {
              const percent = Number.parseFloat(part);
              if (!Number.isFinite(percent)) return NaN;
              return Math.round((Math.max(0, Math.min(100, percent)) / 100) * 255);
            }
            const numeric = Number.parseFloat(part);
            if (!Number.isFinite(numeric)) return NaN;
            return Math.max(0, Math.min(255, Math.round(numeric)));
          });
          if (rgb.some((part) => !Number.isFinite(part))) return null;
          return [rgb[0], rgb[1], rgb[2]];
        };
        const parseSrgb = (input: string): [number, number, number] | null => {
          const raw = String(input || "").trim().toLowerCase();
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
        const parsedDirect = parseHex(colorValue) || parseRgb(colorValue) || parseSrgb(colorValue);
        if (parsedDirect) return parsedDirect;
        const probe = doc.createElement("span");
        probe.style.color = "#000000";
        probe.style.color = colorValue || "#000000";
        probe.style.position = "absolute";
        probe.style.opacity = "0";
        probe.style.pointerEvents = "none";
        probe.style.left = "-9999px";
        doc.body.appendChild(probe);
        const computed = (doc.defaultView?.getComputedStyle(probe).color || "rgb(0, 0, 0)").trim();
        probe.remove();
        const parsedComputed = parseHex(computed) || parseRgb(computed) || parseSrgb(computed);
        if (parsedComputed) return parsedComputed;
        return [0, 0, 0];
      };

      const colorToRgba = (colorValue: string, opacityPercent: number): string => {
        if (colorValue === "none") return "rgba(0, 0, 0, 0)";
        const [r, g, b] = resolveRgbTuple(colorValue);
        const alpha = Math.max(0, Math.min(1, normalizeShapeOpacity(opacityPercent) / 100));
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const applyShapeFillStyle = (
        fillMode: "color" | "gradient" | "image",
        fillColor: string,
        fillOpacity: number,
        gradientStartColor: string,
        gradientEndColor: string,
        gradientAngle: number,
        fillImageSrc: string,
        fillImageOffsetX: number,
        fillImageOffsetY: number
      ) => {
        const normalizedMode = normalizeShapeFillMode(fillMode);
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
          fillNode.style.setProperty("background", "transparent", "important");
          fillNode.style.setProperty("background-color", "transparent", "important");
          fillNode.style.setProperty(
            "background-image",
            `url("${normalizedImageSrc.replace(/"/g, "%22")}")`,
            "important"
          );
          fillNode.style.setProperty("background-size", "cover", "important");
          fillNode.style.setProperty("background-position-x", `${imagePositionX}%`, "important");
          fillNode.style.setProperty("background-position-y", `${imagePositionY}%`, "important");
          fillNode.style.setProperty(
            "background-position",
            `${imagePositionX}% ${imagePositionY}%`,
            "important"
          );
          fillNode.style.setProperty("background-repeat", "no-repeat", "important");
          return;
        }

        if (normalizedMode === "gradient") {
          const start = colorToRgba(gradientStartColor, fillOpacity);
          const end = colorToRgba(gradientEndColor, fillOpacity);
          const gradient = `linear-gradient(${gradientAngle}deg, ${start} 0%, ${end} 100%)`;
          fillNode.style.setProperty("background", gradient, "important");
          fillNode.style.setProperty("background-color", "transparent", "important");
          fillNode.style.setProperty("background-image", gradient, "important");
          return;
        }

        fillNode.style.removeProperty("background-image");
        if (fillColor === "none") {
          fillNode.style.setProperty("background", "transparent", "important");
          fillNode.style.setProperty("background-color", "transparent", "important");
        } else {
          const fillRgba = colorToRgba(fillColor, fillOpacity);
          fillNode.style.setProperty("background", fillRgba, "important");
          fillNode.style.setProperty("background-color", fillRgba, "important");
        }
      };

      const normalizedFillMode = normalizeShapeFillMode(shapeStyleRequest.fillMode);
      const normalizedFillColor = normalizeShapeColor(shapeStyleRequest.fillColor, "#9ca3af");
      const normalizedFillGradientStartColor = normalizeShapeColor(
        shapeStyleRequest.fillGradientStartColor,
        "#9ca3af"
      );
      const normalizedFillGradientEndColor = normalizeShapeColor(
        shapeStyleRequest.fillGradientEndColor,
        "#6b7280"
      );
      const normalizedFillGradientAngle = normalizeShapeGradientAngle(
        shapeStyleRequest.fillGradientAngle
      );
      const normalizedFillImageSrc = (shapeStyleRequest.fillImageSrc || "").trim();
      const normalizedFillImageOffsetX = normalizeShapeImageOffset(shapeStyleRequest.fillImageOffsetX);
      const normalizedFillImageOffsetY = normalizeShapeImageOffset(shapeStyleRequest.fillImageOffsetY);
      const normalizedStrokeColor = normalizeShapeColor(shapeStyleRequest.strokeColor, "#6b7280");
      const normalizedFillOpacity = normalizeShapeOpacity(shapeStyleRequest.fillOpacity);
      const normalizedStrokeOpacity = normalizeShapeOpacity(shapeStyleRequest.strokeOpacity);
      const normalizedStrokeWidth = normalizeShapeStrokeWidth(shapeStyleRequest.strokeWidth);
      const shapeType = normalizeShapeType(target.dataset.fxShape || target.getAttribute("data-fx-shape") || "");
      const normalizedShapeSides = resolveShapeSides(shapeType, shapeStyleRequest.shapeSides);
      const normalizedFillRadius = resolveShapeFillRadius(shapeType, shapeStyleRequest.fillRadius);
      const normalizedRotation = normalizeShapeRotation(shapeStyleRequest.rotation);
      const shapeClipPath = getShapeClipPath(shapeType, normalizedShapeSides);

      target.dataset.fxFillMode = normalizedFillMode;
      target.dataset.fxFill = normalizedFillColor;
      target.dataset.fxFillGradientStart = normalizedFillGradientStartColor;
      target.dataset.fxFillGradientEnd = normalizedFillGradientEndColor;
      target.dataset.fxFillGradientAngle = String(normalizedFillGradientAngle);
      target.dataset.fxFillImage = normalizedFillImageSrc;
      target.dataset.fxFillImageX = String(normalizedFillImageOffsetX);
      target.dataset.fxFillImageY = String(normalizedFillImageOffsetY);
      target.dataset.fxStroke = normalizedStrokeColor;
      target.dataset.fxStrokeWidth = String(normalizedStrokeWidth);
      target.dataset.fxShapeSides = String(normalizedShapeSides);
      target.dataset.fxFillOpacity = String(normalizedFillOpacity);
      target.dataset.fxFillRadius = String(normalizedFillRadius);
      target.dataset.fxRotation = String(normalizedRotation);
      target.dataset.fxStrokeOpacity = String(normalizedStrokeOpacity);
      fillNode.dataset.fxFillMode = normalizedFillMode;
      fillNode.dataset.fxFill = normalizedFillColor;
      fillNode.dataset.fxFillGradientStart = normalizedFillGradientStartColor;
      fillNode.dataset.fxFillGradientEnd = normalizedFillGradientEndColor;
      fillNode.dataset.fxFillGradientAngle = String(normalizedFillGradientAngle);
      fillNode.dataset.fxFillImage = normalizedFillImageSrc;
      fillNode.dataset.fxFillImageX = String(normalizedFillImageOffsetX);
      fillNode.dataset.fxFillImageY = String(normalizedFillImageOffsetY);
      fillNode.dataset.fxStroke = normalizedStrokeColor;
      fillNode.dataset.fxShapeSides = String(normalizedShapeSides);
      fillNode.dataset.fxFillOpacity = String(normalizedFillOpacity);
      fillNode.dataset.fxFillRadius = String(normalizedFillRadius);
      fillNode.dataset.fxRotation = String(normalizedRotation);
      fillNode.dataset.fxStrokeOpacity = String(normalizedStrokeOpacity);
      applyShapeFillStyle(
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

      if (normalizedStrokeColor === "none" || normalizedStrokeWidth <= 0) {
        fillNode.style.setProperty("border", "0px solid transparent", "important");
        fillNode.style.setProperty("box-shadow", "none", "important");
      } else {
        const strokeRgba = colorToRgba(normalizedStrokeColor, normalizedStrokeOpacity);
        fillNode.style.setProperty(
          "border",
          `${normalizedStrokeWidth}px solid ${strokeRgba}`,
          "important"
        );
        fillNode.style.setProperty(
          "box-shadow",
          `inset 0 0 0 ${normalizedStrokeWidth}px ${strokeRgba}`,
          "important"
        );
      }
      if (target.classList.contains("fx-icon-frame")) {
        const iconStrokeColor =
          normalizedStrokeColor === "none"
            ? "transparent"
            : colorToRgba(normalizedStrokeColor, normalizedStrokeOpacity);
        fillNode.style.setProperty("color", iconStrokeColor, "important");
        fillNode.style.setProperty("border", "0px solid transparent", "important");
        fillNode.style.setProperty("box-shadow", "none", "important");
        const iconSvg = fillNode.querySelector(".fx-lucide-icon");
        if (iconSvg instanceof SVGElement) {
          iconSvg.style.setProperty("stroke-width", String(Math.max(0, normalizedStrokeWidth)));
          iconSvg.style.setProperty("stroke", "currentColor");
          iconSvg.style.setProperty("fill", "none");
        }
      }
      fillNode.style.setProperty("box-sizing", "border-box");
      fillNode.style.setProperty("border-radius", `${normalizedFillRadius}px`, "important");
      fillNode.style.setProperty("transform", `rotate(${normalizedRotation}deg)`, "important");
      fillNode.style.setProperty("transform-origin", "center center", "important");
      if (shapeClipPath) {
        fillNode.style.setProperty("clip-path", shapeClipPath, "important");
      } else {
        fillNode.style.removeProperty("clip-path");
      }
      return true;
    };

    if (applyShapeStyleRequest()) return;
    const frame = previewFrameRef.current;
    if (!frame) return;
    const onLoad = () => {
      applyShapeStyleRequest();
    };
    frame.addEventListener("load", onLoad, { once: true });
    return () => frame.removeEventListener("load", onLoad);
  }, [shapeStyleRequest, workspaceId]);

  useEffect(() => {
    if (!imageStyleRequest) return;
    const applyImageStyleRequest = (): boolean => {
      const frame = previewFrameRef.current;
      const doc = frame?.contentDocument;
      if (!doc?.body) return false;
      const runtimeRoute = doc.body.getAttribute("data-preview-route") || "/";

      const imageFrames = Array.from(doc.querySelectorAll(".fx-image-frame"));
      const byId = imageFrames.find(
        (node) => node instanceof HTMLElement && node.dataset.fxId === imageStyleRequest.imageId
      );
      const bySelection = doc.querySelector(".fx-image-frame.fx-selected,.fx-image-frame.is-active");
      const target = byId ?? bySelection;
      if (!(target instanceof HTMLElement)) return false;
      if (imageStyleRequest.route && imageStyleRequest.route !== runtimeRoute && !byId) return false;
      const image = target.querySelector("img");
      if (!(image instanceof HTMLImageElement)) return false;

      const normalizeImageIntensity = (value: string | number | undefined): number => {
        const parsed = Number.parseFloat(String(value ?? "").trim());
        if (!Number.isFinite(parsed)) return 100;
        return Math.max(0, Math.min(200, Math.round(parsed)));
      };
      const normalizeImageOffset = (value: string | number | undefined): number => {
        const parsed = Number.parseFloat(String(value ?? "").trim());
        if (!Number.isFinite(parsed)) return 0;
        return Math.max(-100, Math.min(100, Math.round(parsed)));
      };
      const normalizeFilterPreset = (
        value: string | undefined
      ): "none" | "vivid" | "warm" | "cool" | "mono" | "sepia" => {
        const raw = (value || "").trim().toLowerCase();
        if (raw === "vivid") return "vivid";
        if (raw === "warm") return "warm";
        if (raw === "cool") return "cool";
        if (raw === "mono") return "mono";
        if (raw === "sepia") return "sepia";
        return "none";
      };
      const buildImageFilterValue = (
        preset: "none" | "vivid" | "warm" | "cool" | "mono" | "sepia",
        brightness: number,
        saturation: number
      ): string => {
        const baseByPreset = {
          none: "",
          vivid: "contrast(112%) saturate(120%)",
          warm: "sepia(20%) hue-rotate(-8deg)",
          cool: "hue-rotate(12deg) contrast(105%)",
          mono: "grayscale(100%)",
          sepia: "sepia(85%)"
        };
        const base = baseByPreset[preset];
        const tone = `brightness(${brightness}%) saturate(${saturation}%)`;
        return `${base} ${tone}`.trim();
      };

      const brightness = normalizeImageIntensity(imageStyleRequest.brightness);
      const saturation = normalizeImageIntensity(imageStyleRequest.saturation);
      const imageOffsetX = normalizeImageOffset(imageStyleRequest.imageOffsetX);
      const imageOffsetY = normalizeImageOffset(imageStyleRequest.imageOffsetY);
      const filterPreset = normalizeFilterPreset(imageStyleRequest.filterPreset);
      const objectPositionX = Math.max(0, Math.min(100, 50 + imageOffsetX));
      const objectPositionY = Math.max(0, Math.min(100, 50 + imageOffsetY));
      const filterValue = buildImageFilterValue(filterPreset, brightness, saturation);

      target.dataset.fxBrightness = String(brightness);
      target.dataset.fxSaturation = String(saturation);
      target.dataset.fxImageX = String(imageOffsetX);
      target.dataset.fxImageY = String(imageOffsetY);
      target.dataset.fxFilterPreset = filterPreset;
      image.dataset.fxBrightness = String(brightness);
      image.dataset.fxSaturation = String(saturation);
      image.dataset.fxImageX = String(imageOffsetX);
      image.dataset.fxImageY = String(imageOffsetY);
      image.dataset.fxFilterPreset = filterPreset;
      image.style.setProperty("filter", filterValue, "important");
      image.style.setProperty("object-position", `${objectPositionX}% ${objectPositionY}%`, "important");
      return true;
    };

    if (applyImageStyleRequest()) return;
    const frame = previewFrameRef.current;
    if (!frame) return;
    const onLoad = () => {
      applyImageStyleRequest();
    };
    frame.addEventListener("load", onLoad, { once: true });
    return () => frame.removeEventListener("load", onLoad);
  }, [imageStyleRequest, workspaceId]);

  if (!site || !currentPage) {
    if (workspaceId === "slides" || workspaceId === "pages") {
      return (
        <div className="relative h-[78vh] w-full overflow-hidden bg-[#0f1012]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className={`absolute inset-0 ${isCanvasWorkspace ? "p-3 md:p-6 xl:p-8" : "p-8"}`}>
            <div ref={isCanvasWorkspace ? canvasViewportRef : undefined} className="grid h-full w-full place-items-center">
              {isCanvasWorkspace ? (
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: `${slidesFitSize.width}px`,
                    height: `${slidesFitSize.height}px`,
                    background: "#ffffff",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.08)"
                  }}
                >
                  {showGridOverlay ? (
                    <div className="pointer-events-none absolute inset-0 z-10" style={gridOverlayStyle} />
                  ) : null}
                </div>
              ) : (
                <div
                  className="h-full w-auto max-w-full overflow-hidden"
                  style={{
                    aspectRatio: canvasAspectCss,
                    background: "#ffffff",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.08)"
                  }}
                />
              )}
            </div>
          </div>
        </div>
      );
    }
    return <p className="text-sm text-muted">Generate a site to preview pages.</p>;
  }

  if (workspaceId === "slides" || workspaceId === "pages") {
    return (
      <div className="relative h-[78vh] w-full overflow-hidden bg-[#0f1012]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className={`absolute inset-0 ${isCanvasWorkspace ? "p-3 md:p-6 xl:p-8" : "p-8"}`}>
          <div ref={isCanvasWorkspace ? canvasViewportRef : undefined} className="grid h-full w-full place-items-center">
            {isCanvasWorkspace ? (
              <div
                className="relative overflow-hidden bg-white"
                style={{
                  width: `${slidesFitSize.width}px`,
                  height: `${slidesFitSize.height}px`,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.08)"
                }}
              >
                {showGridOverlay ? (
                  <div className="pointer-events-none absolute inset-0 z-10" style={gridOverlayStyle} />
                ) : null}
                <iframe
                  ref={previewFrameRef}
                  title={`${activePage}-preview`}
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts"
                  onLoad={() => {
                    if (!clearSelectionSignal) return;
                    clearRuntimeSelection();
                  }}
                  srcDoc={buildPreviewSrcDoc(
                    currentPage,
                    site,
                    workspaceId,
                    false,
                    activeSlidesTool,
                    false,
                    canvasAspect,
                    customCanvasWidth,
                    customCanvasHeight,
                    referenceImages
                  )}
                />
              </div>
            ) : (
              <div
                className="h-full w-auto max-w-full overflow-hidden bg-white"
                style={{
                  aspectRatio: canvasAspectCss,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.08)"
                }}
              >
                <iframe
                  ref={previewFrameRef}
                  title={`${activePage}-preview`}
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts"
                  onLoad={() => {
                    if (!clearSelectionSignal) return;
                    clearRuntimeSelection();
                  }}
                  srcDoc={buildPreviewSrcDoc(
                    currentPage,
                    site,
                    workspaceId,
                    false,
                    activeSlidesTool,
                    false,
                    canvasAspect,
                    customCanvasWidth,
                    customCanvasHeight,
                    referenceImages
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <iframe
        ref={previewFrameRef}
        title={`${activePage}-preview`}
        className="h-[78vh] w-full border-0 bg-white"
        sandbox="allow-same-origin allow-scripts"
        onLoad={() => {
          if (!clearSelectionSignal) return;
          clearRuntimeSelection();
        }}
        srcDoc={buildPreviewSrcDoc(
          currentPage,
          site,
          workspaceId,
          false,
          activeSlidesTool,
          false,
          canvasAspect,
          customCanvasWidth,
          customCanvasHeight,
          referenceImages
        )}
      />
    </div>
  );
}
