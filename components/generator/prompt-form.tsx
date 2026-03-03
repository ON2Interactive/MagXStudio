"use client";

import { useRef } from "react";
import { ArrowUp, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  PresentationAspectRatio,
  PresentationDeckType,
  ReferenceImageInput,
  ThemeCategory,
  VisualAspectRatio,
  VisualCategory
} from "@/lib/types";

export type PromptFormValues = {
  userPrompt: string;
  brandName: string;
  industry: string;
  theme: ThemeCategory;
  visualCategory?: VisualCategory;
  visualAspectRatio?: VisualAspectRatio;
};

type PromptFormProps = {
  values: PromptFormValues;
  onChange: (next: PromptFormValues) => void;
  onSubmit: () => void;
  onAddImages: (images: ReferenceImageInput[]) => void;
  imageCount: number;
  loading: boolean;
  hasCredits?: boolean;
  presentationAspectRatio?: PresentationAspectRatio;
  onPresentationAspectRatioChange?: (next: PresentationAspectRatio) => void;
  presentationDeckType?: PresentationDeckType;
  onPresentationDeckTypeChange?: (next: PresentationDeckType) => void;
  showIndustryField?: boolean;
  showThemeField?: boolean;
  showVisualFields?: boolean;
};

const MAX_IMAGE_SIZE = 1024;
const COMPRESSION_QUALITY = 0.8;

export function PromptForm({
  values,
  onChange,
  onSubmit,
  onAddImages,
  imageCount,
  loading,
  hasCredits = true,
  presentationAspectRatio,
  onPresentationAspectRatioChange,
  presentationDeckType,
  onPresentationDeckTypeChange,
  showIndustryField = true,
  showThemeField = false,
  showVisualFields = false
}: PromptFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const setField = (key: keyof PromptFormValues, value: string) => {
    onChange({ ...values, [key]: value });
  };
  const canSubmit =
    hasCredits &&
    values.brandName.trim().length > 0 &&
    values.userPrompt.trim().length >= 10 &&
    !loading;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files).slice(0, 14);
    const nextImages = await Promise.all(
      selected.map(
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
                resolve({
                  name: file.name,
                  mimeType: "image/jpeg",
                  data: base64
                });
              };
              img.onerror = () => reject(new Error("Failed to parse image for resizing"));
              img.src = String(e.target?.result ?? "");
            };
            reader.onerror = () => reject(new Error("Failed to read image file"));
            reader.readAsDataURL(file);
          })
      )
    );
    onAddImages(nextImages);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid gap-3">
        <Input
          placeholder="Site Name"
          required
          value={values.brandName}
          onChange={(event) => setField("brandName", event.target.value)}
        />
        {showIndustryField ? (
          <Input
            placeholder="URL or Example website"
            value={values.industry}
            onChange={(event) => setField("industry", event.target.value)}
          />
        ) : null}
        {showThemeField ? (
          <select
            value={values.theme}
            onChange={(event) => setField("theme", event.target.value)}
            className="w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]"
          >
            <option value="auto" className="bg-[#141414] text-white">Auto</option>
            <option value="agency" className="bg-[#141414] text-white">Agency</option>
            <option value="app" className="bg-[#141414] text-white">App</option>
            <option value="bauhaus" className="bg-[#141414] text-white">Bauhaus</option>
            <option value="bento" className="bg-[#141414] text-white">Bento Grid</option>
            <option value="brutalist" className="bg-[#141414] text-white">Brutalist</option>
            <option value="cafe" className="bg-[#141414] text-white">Cafe / Bakery</option>
            <option value="corporate" className="bg-[#141414] text-white">Corporate</option>
            <option value="crypto" className="bg-[#141414] text-white">Crypto</option>
            <option value="dashboard" className="bg-[#141414] text-white">Dashboard</option>
            <option value="destijl" className="bg-[#141414] text-white">De Stijl</option>
            <option value="ecommerce" className="bg-[#141414] text-white">E-Commerce</option>
            <option value="editorial" className="bg-[#141414] text-white">Editorial</option>
            <option value="event" className="bg-[#141414] text-white">Event / Conference</option>
            <option value="finance" className="bg-[#141414] text-white">Finance / Banking</option>
            <option value="fitness" className="bg-[#141414] text-white">Fitness / Gym</option>
            <option value="gaming" className="bg-[#141414] text-white">Gaming</option>
            <option value="glassmorphism" className="bg-[#141414] text-white">Glassmorphism</option>
            <option value="hero3cols" className="bg-[#141414] text-white">Hero + 3 Cols</option>
            <option value="interactive" className="bg-[#141414] text-white">Interactive</option>
            <option value="magazine" className="bg-[#141414] text-white">Magazine</option>
            <option value="medical" className="bg-[#141414] text-white">Medical / Health</option>
            <option value="minimal" className="bg-[#141414] text-white">Minimal</option>
            <option value="portfolio" className="bg-[#141414] text-white">Portfolio</option>
            <option value="product" className="bg-[#141414] text-white">Product</option>
            <option value="realestate" className="bg-[#141414] text-white">Real Estate</option>
            <option value="restaurant" className="bg-[#141414] text-white">Restaurant</option>
            <option value="saas" className="bg-[#141414] text-white">SaaS</option>
            <option value="typography" className="bg-[#141414] text-white">Typography</option>
            <option value="web3" className="bg-[#141414] text-white">Web3</option>
          </select>
        ) : null}
        {presentationAspectRatio && onPresentationAspectRatioChange ? (
          <select
            value={presentationAspectRatio}
            onChange={(event) =>
              onPresentationAspectRatioChange(event.target.value as PresentationAspectRatio)
            }
            className="w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]"
          >
            <option value="16:9" className="bg-[#141414] text-white">
              Landscape 16:9
            </option>
            <option value="4:3" className="bg-[#141414] text-white">
              Landscape 4:3
            </option>
          </select>
        ) : null}
        {presentationDeckType && onPresentationDeckTypeChange ? (
          <select
            value={presentationDeckType}
            onChange={(event) =>
              onPresentationDeckTypeChange(event.target.value as PresentationDeckType)
            }
            className="w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]"
          >
            <option value="pitch" className="bg-[#141414] text-white">
              Pitch Deck
            </option>
            <option value="sales" className="bg-[#141414] text-white">
              Sales Deck
            </option>
            <option value="workshop" className="bg-[#141414] text-white">
              Workshop Deck
            </option>
            <option value="exec-update" className="bg-[#141414] text-white">
              Exec Update
            </option>
          </select>
        ) : null}
        {showVisualFields ? (
          <>
            <select
              value={values.visualCategory || "social"}
              onChange={(event) => setField("visualCategory", event.target.value)}
              className="w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]"
            >
              <option value="ad" className="bg-[#141414] text-white">Digital Ad</option>
              <option value="social" className="bg-[#141414] text-white">Social Media Post</option>
              <option value="concept" className="bg-[#141414] text-white">Concept Art</option>
              <option value="product" className="bg-[#141414] text-white">Product Shot</option>
              <option value="minimal" className="bg-[#141414] text-white">Minimal Graphic</option>
            </select>
            <select
              value={values.visualAspectRatio || "1:1"}
              onChange={(event) => setField("visualAspectRatio", event.target.value)}
              className="w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]"
            >
              <option value="1:1" className="bg-[#141414] text-white">Square (1:1)</option>
              <option value="16:9" className="bg-[#141414] text-white">Landscape (16:9)</option>
              <option value="9:16" className="bg-[#141414] text-white">Portrait (9:16)</option>
              <option value="4:3" className="bg-[#141414] text-white">Standard (4:3)</option>
              <option value="3:4" className="bg-[#141414] text-white">Vertical (3:4)</option>
            </select>
          </>
        ) : null}
      </div>
      <Textarea
        rows={1}
        className="min-h-[60px] py-2 leading-5"
        placeholder={showThemeField ? "Build a polished B2B SaaS website for an AI operations platform with calm confidence, clear value props, and conversion-focused layout." : "Enter your full prompt for what you want to generate..."}
        required
        value={values.userPrompt}
        onChange={(event) => setField("userPrompt", event.target.value)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        style={{ display: "none" }}
        onChange={(event) => {
          void handleFiles(event.target.files);
        }}
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Upload reference images"
          title="Upload reference images"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#d4d9e2] transition hover:bg-[#262b36]"
          style={{ backgroundColor: "#1f232d" }}
        >
          <Plus className="h-[22px] w-[22px] stroke-[2.25]" />
        </button>
        <button
          type="button"
          aria-label="Generate site"
          title="Generate site"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#111111] transition hover:bg-[#f7f8fa] disabled:text-[#5a606d] disabled:opacity-100"
          style={{ backgroundColor: canSubmit ? "#eef1f5" : "#d8dde5" }}
        >
          {loading ? <Loader2 className="h-[25px] w-[25px] animate-spin" /> : <ArrowUp className="h-[25px] w-[25px] stroke-[2.5]" />}
        </button>
      </div>
      {imageCount > 0 ? <p className="text-right text-[11px] text-white/45">{imageCount} image{imageCount > 1 ? "s" : ""} attached</p> : null}
    </div>
  );
}
