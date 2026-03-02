import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type FontWeightOption = {
  label: string;
  value: string;
};

type SystemFontEntry = {
  family: string;
  weights: FontWeightOption[];
};

type SystemProfilerTypeface = {
  family?: string;
  style?: string;
};

type SystemProfilerFont = {
  typefaces?: SystemProfilerTypeface[];
};

type SystemProfilerPayload = {
  SPFontsDataType?: SystemProfilerFont[];
};

const execFileAsync = promisify(execFile);

const fallbackFonts: SystemFontEntry[] = [
  {
    family: "Helvetica",
    weights: [
      { label: "Regular", value: "400" },
      { label: "Bold", value: "700" }
    ]
  }
];

const weightRulebook: Array<{ label: string; value: string; test: RegExp }> = [
  { label: "Thin", value: "100", test: /\bthin\b/i },
  { label: "Extra Light", value: "200", test: /\b(extra|ultra)\s*light\b/i },
  { label: "Light", value: "300", test: /\blight\b/i },
  { label: "Regular", value: "400", test: /\b(regular|book|normal|roman|text)\b/i },
  { label: "Medium", value: "500", test: /\bmedium\b/i },
  { label: "Semibold", value: "600", test: /\b(semi|demi)\s*bold\b/i },
  { label: "Bold", value: "700", test: /\bbold\b/i },
  { label: "Extra Bold", value: "800", test: /\b(extra|ultra|heavy)\s*bold\b|\bheavy\b/i },
  { label: "Black", value: "900", test: /\b(black|poster)\b/i }
];

let cached:
  | {
      at: number;
      fonts: SystemFontEntry[];
      defaultFamily: string;
    }
  | null = null;

const CACHE_TTL_MS = 1000 * 60 * 60;

function mapStyleToWeight(style: string | undefined): FontWeightOption {
  const normalized = (style || "").trim();
  if (!normalized) return { label: "Regular", value: "400" };
  const numeric = normalized.match(/\b([1-9]00)\b/);
  if (numeric?.[1]) {
    const value = numeric[1];
    const label = weightRulebook.find((rule) => rule.value === value)?.label ?? "Regular";
    return { label, value };
  }
  for (const rule of weightRulebook) {
    if (rule.test.test(normalized)) return { label: rule.label, value: rule.value };
  }
  return { label: "Regular", value: "400" };
}

function sortWeightOptions(weights: FontWeightOption[]): FontWeightOption[] {
  return [...weights].sort((a, b) => {
    const av = Number.parseInt(a.value, 10);
    const bv = Number.parseInt(b.value, 10);
    if (Number.isFinite(av) && Number.isFinite(bv) && av !== bv) return av - bv;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
}

function selectDefaultFamily(fonts: SystemFontEntry[]): string {
  if (!fonts.length) return fallbackFonts[0]?.family ?? "Helvetica";
  const helvetica = fonts.find((entry) => entry.family.toLowerCase() === "helvetica");
  return helvetica?.family ?? fonts[0].family;
}

async function loadSystemFonts(): Promise<{ fonts: SystemFontEntry[]; defaultFamily: string }> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return { fonts: cached.fonts, defaultFamily: cached.defaultFamily };
  }

  const { stdout } = await execFileAsync("system_profiler", ["SPFontsDataType", "-json"], {
    maxBuffer: 128 * 1024 * 1024,
    timeout: 6000
  });
  const parsed = JSON.parse(stdout) as SystemProfilerPayload;
  const familyToWeights = new Map<string, Map<string, string>>();

  for (const font of parsed.SPFontsDataType ?? []) {
    for (const typeface of font.typefaces ?? []) {
      const family = (typeface.family || "").trim();
      if (!family || family.startsWith(".")) continue;
      const weight = mapStyleToWeight(typeface.style);
      const existing = familyToWeights.get(family) ?? new Map<string, string>();
      if (!existing.has(weight.value)) existing.set(weight.value, weight.label);
      familyToWeights.set(family, existing);
    }
  }

  const fonts = Array.from(familyToWeights.entries())
    .map(([family, weightMap]) => {
      const weights = Array.from(weightMap.entries()).map(([value, label]) => ({
        label,
        value
      }));
      const fallbackRegular =
        weights.length === 0 ? [{ label: "Regular", value: "400" }] : sortWeightOptions(weights);
      return {
        family,
        weights: fallbackRegular
      };
    })
    .sort((a, b) => a.family.localeCompare(b.family, undefined, { sensitivity: "base" }));

  const result = {
    fonts: fonts.length ? fonts : fallbackFonts,
    defaultFamily: selectDefaultFamily(fonts.length ? fonts : fallbackFonts)
  };

  cached = {
    at: now,
    fonts: result.fonts,
    defaultFamily: result.defaultFamily
  };

  return result;
}

export async function GET() {
  try {
    const { fonts, defaultFamily } = await loadSystemFonts();
    return NextResponse.json({ fonts, defaultFamily });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Failed to load system fonts";
    console.error("system-fonts error", { message, at: new Date().toISOString() });
    const defaultFamily = selectDefaultFamily(fallbackFonts);
    return NextResponse.json({ fonts: fallbackFonts, defaultFamily }, { status: 200 });
  }
}
