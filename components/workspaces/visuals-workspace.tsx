"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Download, Eye, SendHorizontal, Loader2, Plus, Wand2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ReferenceImageInput, VisualTheme, VisualAspectRatio } from "@/lib/types";
import { useWorkspaceDraft } from "@/lib/hooks/use-workspace-draft";
import { CreditsDisplay } from "@/components/workspaces/credits-display";

type VisualsWorkspaceProps = {
  active: boolean;
  userName: string;
  onSendToPages: (image: ReferenceImageInput) => void;
  onOpenSettings?: () => void;
};

type VisualMode = "text-to-image" | "image-to-image";

type VisualAsset = {
  id: string;
  previewSrc: string;
  referenceImage: ReferenceImageInput;
  label: string;
  loading?: boolean;
  remixPrompt?: string;
  showRemixInput?: boolean;
};

const defaultVisualPrompt =
  "High-end monochrome hero visual with subtle gradients, soft glow, and premium editorial composition.";

const aspectRatios: VisualAspectRatio[] = [
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

function stringToSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash || 1;
}

function colorFromSeed(seed: number): string {
  const hue = seed % 360;
  return `hsl(${hue} 24% 18%)`;
}

function accentFromSeed(seed: number): string {
  const hue = (seed * 7) % 360;
  return `hsl(${hue} 70% 72%)`;
}

function encodeSvgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function buildGeneratedSvgDataUri(prompt: string, variant: number): string {
  const seed = stringToSeed(`${prompt}-${variant}`);
  const bgA = colorFromSeed(seed);
  const bgB = colorFromSeed(seed + 57);
  const accent = accentFromSeed(seed);
  const safePrompt = prompt.replace(/[<>&"]/g, "").slice(0, 72);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${bgA}" />
<stop offset="100%" stop-color="${bgB}" />
</linearGradient>
</defs>
<rect width="1400" height="900" fill="url(#g)" />
<circle cx="${230 + variant * 180}" cy="${240 + variant * 84}" r="${280 + variant * 18}" fill="${accent}" opacity="0.23" />
<circle cx="${1120 - variant * 120}" cy="${660 - variant * 70}" r="${340 - variant * 26}" fill="#ffffff" opacity="0.09" />
<text x="80" y="820" fill="#f5f7fb" font-size="34" font-family="Inter, Arial, sans-serif" opacity="0.84">${safePrompt}</text>
</svg>`;
  return encodeSvgToDataUri(svg);
}

function dataUriToReferenceImage(dataUri: string, name: string): ReferenceImageInput {
  const [meta, data = ""] = dataUri.split(",");
  const mimeType = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  return {
    name,
    mimeType,
    data
  };
}

export function VisualsWorkspace({ active, userName, onSendToPages, onOpenSettings }: VisualsWorkspaceProps) {
  const [mode, setMode] = useState<VisualMode>("text-to-image");
  const [theme, setTheme] = useState<VisualTheme>("auto");
  const [aspectRatio, setAspectRatio] = useState<VisualAspectRatio | "">("");
  const [prompt, setPrompt] = useState("");
  const [sourceImage, setSourceImage] = useState<VisualAsset | null>(null);
  const [assets, setAssets] = useState<VisualAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const visualsDraft = useWorkspaceDraft<{
    assets: VisualAsset[];
    prompt: string;
    theme: VisualTheme;
    aspectRatio: VisualAspectRatio | "";
    mode: VisualMode;
  }>("magx-visuals-draft");
  const [draftRestoredAt, setDraftRestoredAt] = useState<number | null>(null);

  // Restore on mount
  useEffect(() => {
    const saved = visualsDraft.loadDraft();
    if (!saved || !saved.data.assets.length) return;
    // Strip transient UI state
    setAssets(saved.data.assets.map((a) => ({ ...a, loading: false, showRemixInput: false })));
    setPrompt(saved.data.prompt);
    setTheme(saved.data.theme);
    setAspectRatio(saved.data.aspectRatio);
    setMode(saved.data.mode);
    setDraftRestoredAt(saved.savedAt);
    const timer = setTimeout(() => setDraftRestoredAt(null), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save when assets change (debounced 1.5s)
  // base64 images can be large — QuotaExceededError is caught silently in the hook
  useEffect(() => {
    if (!assets.length) return;
    const saveableAssets = assets.map(
      ({ loading: _l, showRemixInput: _s, ...rest }) => rest as VisualAsset
    );
    visualsDraft.saveDraft({ assets: saveableAssets, prompt, theme, aspectRatio, mode });
  }, [assets, prompt, theme, aspectRatio, mode]);

  const resetWorkspace = () => {
    setAssets([]);
    setSourceImage(null);
    setPrompt("");
    setMode("text-to-image");
    setShowValidation(false);
    visualsDraft.clearDraft();
    if (fileRef.current) fileRef.current.value = "";
  };


  const canGenerate = useMemo(() => {
    return !loading;
  }, [loading]);

  const isTechnicallyValid = () => {
    const hasPrompt = prompt.trim().length >= 8;
    const hasRatio = aspectRatio !== "";
    if (mode === "text-to-image") return hasPrompt && hasRatio;
    return hasPrompt && hasRatio && Boolean(sourceImage);
  };

  const generateAssets = async () => {
    setShowValidation(true);
    if (!isTechnicallyValid()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt,
          aspectRatio: aspectRatio as VisualAspectRatio,
          theme,
          variationCount: 3,
          size: "1K", // Default to 1K for standard visuals
          sourceImageDataUri: mode === "image-to-image" ? sourceImage?.previewSrc : null
        })
      });

      const json = (await response.json()) as {
        error?: string;
        details?: string;
        imageDataUris?: string[]
      };

      if (!response.ok || !json.imageDataUris || json.imageDataUris.length === 0) {
        throw new Error([json.error || "Generation failed", json.details].filter(Boolean).join(": "));
      }

      const timestamp = Date.now();
      const nextAssets: VisualAsset[] = json.imageDataUris.map((uri, index) => ({
        id: `gen-${timestamp}-${index}`,
        previewSrc: uri,
        referenceImage: dataUriToReferenceImage(uri, `visual-${timestamp}-${index}.png`),
        label: `Variation ${index + 1}`
      }));

      // In visuals workspace, we show all generated variants
      setAssets(nextAssets);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error during generation");
    } finally {
      setLoading(false);
    }
  };

  const handleSourceUpload = async (file: File | null) => {
    if (!file) return;
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read source image"));
      reader.readAsDataURL(file);
    });
    setSourceImage({
      id: `source-${Date.now()}`,
      previewSrc: dataUri,
      referenceImage: dataUriToReferenceImage(dataUri, file.name || "source-image"),
      label: "Source"
    });
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const downloadAsset = (asset: VisualAsset) => {
    const link = document.createElement("a");
    link.href = asset.previewSrc;
    link.download = `${asset.label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewAssetInNewTab = (asset: VisualAsset) => {
    const win = window.open();
    if (win) {
      win.document.write(`
        <html>
          <head><title>${asset.label}</title></head>
          <body style="margin:0; background:#000; display:flex; align-items:center; justify-content:center; height:100vh;">
            <img src="${asset.previewSrc}" style="max-width:100%; max-height:100%; object-fit:contain;" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const remixAsset = async (asset: VisualAsset, customPrompt?: string) => {
    if (asset.loading) return;

    console.info("[Visuals] Triggering Magic Wand Remix for asset:", asset.id, "Prompt:", customPrompt || "Global");
    setError(null);
    // Set individual loading state
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, loading: true } : a));

    // Auto-collapse the input field on generation start
    toggleRemixInput(asset.id);

    try {
      const response = await fetch("/api/generate-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "image-to-image",
          prompt: customPrompt || prompt || defaultVisualPrompt,
          aspectRatio: aspectRatio as VisualAspectRatio,
          theme,
          variationCount: 1,
          sourceImageDataUri: asset.previewSrc
        })
      });

      const json = await response.json();
      if (!response.ok || !json.imageDataUris?.[0]) {
        console.error("[Visuals] Remix API error:", json.error || "No image returned");
        throw new Error(json.error || "Remix failed");
      }

      console.info("[Visuals] Remix success for asset:", asset.id);
      const newUri = json.imageDataUris[0];
      const timestamp = Date.now();

      setAssets(prev => prev.map(a => a.id === asset.id ? {
        ...a,
        previewSrc: newUri,
        referenceImage: dataUriToReferenceImage(newUri, `remix-${timestamp}.png`),
        loading: false
      } : a));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Remix failed");
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, loading: false } : a));
    }
  };

  const toggleRemixInput = (id: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, showRemixInput: !a.showRemixInput } : a));
  };

  const updateRemixPrompt = (id: string, text: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, remixPrompt: text } : a));
  };

  return (
    <section className={active ? "block" : "hidden"}>
      {draftRestoredAt !== null && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 rounded-full border border-white/10 bg-[#0e0e0e]/90 px-5 py-2 text-xs text-white/70 shadow-xl backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <span className="font-mono">
            Draft restored &mdash;{" "}
            {Math.round((Date.now() - draftRestoredAt) / 60000) < 2
              ? "just now"
              : `${Math.round((Date.now() - draftRestoredAt) / 60000)}m ago`}
          </span>
          <button
            type="button"
            onClick={() => {
              visualsDraft.clearDraft();
              setAssets([]);
              setDraftRestoredAt(null);
            }}
            className="text-white/40 underline underline-offset-2 transition hover:text-white/90"
          >
            Discard
          </button>
        </div>
      )}

      <div className="flex h-11 w-full items-center justify-between border-b border-black/70 bg-[#0b0b0b] px-5 md:px-7">
        <CreditsDisplay onOpenSettings={onOpenSettings} />
        <div className="flex items-center gap-4">
          {assets.length > 0 && (
            <button
              type="button"
              aria-label="Start over"
              title="Start over"
              onClick={resetWorkspace}
              className="inline-flex h-5 w-5 items-center justify-center text-white/75 transition hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-6 pt-5 md:px-7">
        {assets.length === 0 ? (
          <div className="flex min-h-[calc(100vh-180px)] items-center">
            <div className="mx-auto w-full max-w-[960px]">
              <p className={`mb-5 text-center text-[24px] leading-tight text-white/75 ${loading ? "animate-pulse" : ""}`}>Hello {userName}</p>
              <Card className="w-full p-4 md:p-5">
                <div className="mb-4 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode("text-to-image")}
                    className={`px-0 py-1 transition ${mode === "text-to-image" ? "text-white" : "text-white/50 hover:text-white/80"
                      }`}
                  >
                    Text to Image
                  </button>
                  <span className="text-white/30">|</span>
                  <button
                    type="button"
                    onClick={() => setMode("image-to-image")}
                    className={`px-0 py-1 transition ${mode === "image-to-image" ? "text-white" : "text-white/50 hover:text-white/80"
                      }`}
                  >
                    Image to Image
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1 block">
                      <select
                        value={theme}
                        onChange={(event) => setTheme(event.target.value as VisualTheme)}
                        className="h-10 w-full border-0 border-b border-[#5c626f] bg-transparent px-0 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]"
                      >
                        <option value="auto" className="bg-[#141414] text-white">Auto</option>
                        <optgroup label="Formats" className="bg-[#141414] text-white/60">
                          <option value="ad-creative" className="bg-[#141414] text-white">Ad Creative</option>
                          <option value="editorial" className="bg-[#141414] text-white">Editorial</option>
                          <option value="infographic" className="bg-[#141414] text-white">Infographic</option>
                          <option value="product-shot" className="bg-[#141414] text-white">Product Shot</option>
                          <option value="social-post" className="bg-[#141414] text-white">Social Media Post</option>
                        </optgroup>
                        <optgroup label="Art Styles" className="bg-[#141414] text-white/60">
                          <option value="3d-render" className="bg-[#141414] text-white">3D Render</option>
                          <option value="cinematic" className="bg-[#141414] text-white">Cinematic</option>
                          <option value="cyberpunk" className="bg-[#141414] text-white">Cyberpunk</option>
                          <option value="illustration" className="bg-[#141414] text-white">Illustration</option>
                          <option value="isometric" className="bg-[#141414] text-white">Isometric</option>
                          <option value="line-art" className="bg-[#141414] text-white">Line Art</option>
                          <option value="minimalist" className="bg-[#141414] text-white">Minimalist</option>
                          <option value="photorealistic" className="bg-[#141414] text-white">Photorealistic</option>
                          <option value="vintage-polaroid" className="bg-[#141414] text-white">Vintage Polaroid</option>
                          <option value="watercolor" className="bg-[#141414] text-white">Watercolor</option>
                        </optgroup>
                      </select>
                    </label>
                    <label className="space-y-1 block">
                      <select
                        value={aspectRatio}
                        onChange={(event) => setAspectRatio(event.target.value as VisualAspectRatio)}
                        className={`h-10 w-full border-0 border-b bg-transparent px-0 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0] transition-colors ${showValidation && aspectRatio === "" ? "border-red-500" : "border-[#5c626f]"
                          }`}
                      >
                        <option value="" disabled className="bg-[#141414] text-white/40">Select Aspect Ratio</option>
                        {aspectRatios.map((ratio) => (
                          <option key={ratio} value={ratio} className="bg-[#141414] text-white">
                            {ratio === "auto" ? "Auto" : ratio}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="relative">
                    <Textarea
                      rows={4}
                      className={`min-h-[140px] resize-none border-0 border-b bg-transparent px-0 py-2 text-[14px] leading-relaxed text-white placeholder:text-white/20 focus-visible:ring-0 transition-colors ${showValidation && prompt.trim().length < 8 ? "border-red-500" : "border-[#5c626f]"
                        }`}
                      placeholder={defaultVisualPrompt}
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                      {error}
                    </p>
                  )}

                  {mode === "image-to-image" ? (
                    <div className="space-y-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        hidden
                        style={{ display: "none" }}
                        onChange={(event) => {
                          void handleSourceUpload(event.target.files?.[0] ?? null);
                        }}
                      />
                      {sourceImage ? (
                        <img src={sourceImage.previewSrc} alt="Source visual" className="h-24 w-full object-cover" />
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-2">
                    {mode === "image-to-image" ? (
                      <button
                        type="button"
                        aria-label="Upload source image"
                        title="Upload source image"
                        onClick={() => {
                          fileRef.current?.click();
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
                        void generateAssets();
                      }}
                      disabled={!canGenerate}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#111111] transition hover:bg-[#f7f8fa] disabled:text-[#5a606d] disabled:opacity-100"
                      style={{ backgroundColor: canGenerate ? "#eef1f5" : "#d8dde5" }}
                    >
                      {loading ? (
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
        ) : (
          <div className="grid min-h-[80vh] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
            <Card className="w-full p-4">
              <div className="mb-4 flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("text-to-image")}
                  className={`px-0 py-1 transition ${mode === "text-to-image" ? "text-white" : "text-white/50 hover:text-white/80"
                    }`}
                >
                  Text to Image
                </button>
                <span className="text-white/30">|</span>
                <button
                  type="button"
                  onClick={() => setMode("image-to-image")}
                  className={`px-0 py-1 transition ${mode === "image-to-image" ? "text-white" : "text-white/50 hover:text-white/80"
                    }`}
                >
                  Image to Image
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 block">
                    <select
                      value={theme}
                      onChange={(event) => setTheme(event.target.value as VisualTheme)}
                      className="h-10 w-full border-0 border-b border-[#5c626f] bg-transparent px-0 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]"
                    >
                      <option value="auto" className="bg-[#141414] text-white">Auto</option>
                      <optgroup label="Formats" className="bg-[#141414] text-white/60">
                        <option value="ad-creative" className="bg-[#141414] text-white">Ad Creative</option>
                        <option value="editorial" className="bg-[#141414] text-white">Editorial</option>
                        <option value="infographic" className="bg-[#141414] text-white">Infographic</option>
                        <option value="product-shot" className="bg-[#141414] text-white">Product Shot</option>
                        <option value="social-post" className="bg-[#141414] text-white">Social Media Post</option>
                      </optgroup>
                      <optgroup label="Art Styles" className="bg-[#141414] text-white/60">
                        <option value="3d-render" className="bg-[#141414] text-white">3D Render</option>
                        <option value="cinematic" className="bg-[#141414] text-white">Cinematic</option>
                        <option value="cyberpunk" className="bg-[#141414] text-white">Cyberpunk</option>
                        <option value="illustration" className="bg-[#141414] text-white">Illustration</option>
                        <option value="isometric" className="bg-[#141414] text-white">Isometric</option>
                        <option value="line-art" className="bg-[#141414] text-white">Line Art</option>
                        <option value="minimalist" className="bg-[#141414] text-white">Minimalist</option>
                        <option value="photorealistic" className="bg-[#141414] text-white">Photorealistic</option>
                        <option value="vintage-polaroid" className="bg-[#141414] text-white">Vintage Polaroid</option>
                        <option value="watercolor" className="bg-[#141414] text-white">Watercolor</option>
                      </optgroup>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <select
                      value={aspectRatio}
                      onChange={(event) => setAspectRatio(event.target.value as VisualAspectRatio)}
                      className="h-10 w-full border-0 border-b border-[#5c626f] bg-transparent px-0 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]"
                    >
                      {aspectRatios.map((ratio) => (
                        <option key={ratio} value={ratio} className="bg-[#141414] text-white">
                          {ratio === "auto" ? "Auto" : ratio}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <Textarea
                  rows={4}
                  className="min-h-[120px] py-2 leading-5"
                  placeholder={defaultVisualPrompt}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />

                {error && (
                  <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                    {error}
                  </p>
                )}

                {mode === "image-to-image" ? (
                  <div className="space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      style={{ display: "none" }}
                      onChange={(event) => {
                        void handleSourceUpload(event.target.files?.[0] ?? null);
                      }}
                    />
                    {sourceImage ? (
                      <img src={sourceImage.previewSrc} alt="Source visual" className="h-24 w-full object-cover" />
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-2">
                  {mode === "image-to-image" ? (
                    <button
                      type="button"
                      aria-label="Upload source image"
                      title="Upload source image"
                      onClick={() => {
                        fileRef.current?.click();
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
                      void generateAssets();
                    }}
                    disabled={!canGenerate}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#111111] transition hover:bg-[#f7f8fa] disabled:text-[#5a606d] disabled:opacity-100"
                    style={{ backgroundColor: canGenerate ? "#eef1f5" : "#d8dde5" }}
                  >
                    {loading ? (
                      <Loader2 className="h-[25px] w-[25px] animate-spin" />
                    ) : (
                      <ArrowUp className="h-[25px] w-[25px] stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => (
                  <article key={asset.id} className="group flex flex-col bg-[#111214] p-3 transition hover:bg-[#16171a]">
                    <div
                      className="relative mb-3 w-full overflow-hidden rounded-xl bg-[#0d0f13] shadow-lg"
                      style={{ aspectRatio: aspectRatio === "auto" ? "auto" : aspectRatio.replace(":", " / ") }}
                    >
                      <img
                        src={asset.previewSrc}
                        alt={asset.label}
                        className={`h-full w-full object-contain transition-opacity duration-300 ${asset.loading ? "opacity-30" : "opacity-100"}`}
                      />
                      {asset.loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                        </div>
                      )}
                    </div>


                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => downloadAsset(asset)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => previewAssetInNewTab(asset)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRemixInput(asset.id)}
                            disabled={asset.loading}
                            className={`flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-white/10 disabled:opacity-30 ${asset.showRemixInput ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                            title="Remix with Magic Wand"
                          >
                            <Wand2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteAsset(asset.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSendToPages(asset.referenceImage)}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/40 transition hover:bg-white/15 hover:text-white"
                          title="Send to Pages"
                        >
                          <SendHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {asset.showRemixInput && (
                        <div className="mt-1 flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-2">
                          <div className="relative">
                            <Textarea
                              placeholder="Edit instructions..."
                              value={asset.remixPrompt || ""}
                              onChange={(e) => updateRemixPrompt(asset.id, e.target.value)}
                              className="min-h-[80px] w-full resize-none border-0 bg-transparent px-2 pr-10 py-1 text-[13px] leading-relaxed text-white placeholder:text-white/20 focus-visible:ring-0"
                            />
                            <button
                              type="button"
                              onClick={() => remixAsset(asset, asset.remixPrompt)}
                              disabled={asset.loading || !asset.remixPrompt?.trim()}
                              className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:opacity-30"
                            >
                              {asset.loading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
