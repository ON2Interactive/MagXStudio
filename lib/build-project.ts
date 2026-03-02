import type { DesignTokenValue, GeneratedSiteContract } from "@/lib/types";

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function tokenToCssValue(token: DesignTokenValue | undefined, fallback: string): string {
  if (typeof token === "string" || typeof token === "number") return String(token);
  if (token && typeof token === "object") {
    const first = Object.values(token)[0];
    if (typeof first === "string" || typeof first === "number") return String(first);
  }
  return fallback;
}

function escTemplate(value: string): string {
  return value.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function pageFilePathFromRoute(route: string): string {
  const clean = route.trim();
  if (!clean || clean === "/") return "app/page.tsx";
  const segments = clean
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9-_]/g, ""))
    .filter(Boolean);

  if (!segments.length) return "app/page.tsx";
  return `app/${segments.join("/")}/page.tsx`;
}

function pageKeyFromRoute(route: string): string {
  if (!route || route === "/") return "landing";
  return route
    .split("/")
    .filter(Boolean)
    .join("-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase() || "page";
}

function htmlFileNameFromRoute(route: string): string {
  const clean = route.trim();
  if (!clean || clean === "/") return "index.html";
  const segments = clean
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9-_]/g, ""))
    .filter(Boolean);
  if (!segments.length) return "index.html";
  return `${segments.join("-").toLowerCase()}.html`;
}

function buildStaticHtmlFile(
  page: GeneratedSiteContract["pages"][string],
  routeToFileMap: Record<string, string>
): string {
  const safeTitle = escTemplate(page.seo.title || "Generated Page");
  const safeCss = escTemplate(page.css || "");
  const safeHtml = escTemplate(page.html || "");
  const routeMapJson = escTemplate(JSON.stringify(routeToFileMap));

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <style>${safeCss}</style>
  </head>
  <body>
    ${safeHtml}
    <script>
      (function () {
        const routeMap = ${routeMapJson};
        document.addEventListener("click", function (event) {
          const target = event.target;
          if (!target || !(target instanceof Element)) return;
          const link = target.closest("a[href]");
          if (!link) return;
          const href = link.getAttribute("href") || "";
          if (!href) return;
          if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
          if (/^https?:\\/\\//i.test(href)) return;
          const resolved = href.startsWith("/") ? href : "/" + href;
          const fileName = routeMap[resolved];
          if (fileName) {
            event.preventDefault();
            window.location.href = "./" + fileName;
          }
        });
      })();
    </script>
  </body>
</html>
`;
}

function buildHtmlPageFile(pageKey: string): string {
  const pageRef = JSON.stringify(pageKey);

  return `import { generatedSiteData } from "@/lib/generated-site-data";

export default function GeneratedPage() {
  const page = generatedSiteData.pages[${pageRef}];
  if (!page) return null;

  const srcDoc = ` + "`" + `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escTemplate("${page.seo.title}")}</title>
    <style>${escTemplate("${page.css}")}</style>
  </head>
  <body>${escTemplate("${page.html}")}</body>
</html>` + "`" + `;

  return (
    <main className="min-h-screen bg-black/80 p-4">
      <iframe title={${JSON.stringify(pageKey)}} srcDoc={srcDoc} className="h-[88vh] w-full rounded-xl border border-white/10 bg-white" sandbox="allow-same-origin" />
    </main>
  );
}
`;
}

export function buildGeneratedProjectFiles(site: GeneratedSiteContract): Record<string, string> {
  const files: Record<string, string> = {
    "package.json": stringify({
      name: "generated-website",
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start"
      },
      dependencies: {
        next: "^15.3.2",
        react: "^19.0.0",
        "react-dom": "^19.0.0"
      },
      devDependencies: {
        autoprefixer: "^10.4.20",
        postcss: "^8.5.3",
        tailwindcss: "^3.4.17",
        typescript: "^5.8.2",
        "@types/react": "^19.0.12",
        "@types/node": "^22.13.5"
      }
    }),
    "tsconfig.json": stringify({
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        strict: true,
        noEmit: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        jsx: "preserve"
      },
      include: ["**/*.ts", "**/*.tsx"]
    }),
    "next.config.mjs": `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nexport default nextConfig;\n`,
    "postcss.config.mjs": `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n`,
    "tailwind.config.ts": `import type { Config } from "tailwindcss";\n\nconst config: Config = {\n  content: ["./app/**/*.{ts,tsx}"],\n  theme: { extend: {} },\n  plugins: []\n};\n\nexport default config;\n`,
    "app/globals.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --color-bg: ${tokenToCssValue(site.designSystem.colors.background, "#0a0a0a")};\n  --color-text: ${tokenToCssValue(site.designSystem.colors.text, "#f9fafb")};\n}\n\nbody {\n  margin: 0;\n  background: var(--color-bg);\n  color: var(--color-text);\n  font-family: ${site.designSystem.type.fontFamily || "system-ui, sans-serif"};\n}\n`,
    "lib/generated-site-data.ts": `export const generatedSiteData = ${stringify(site)} as const;\n`
  };

  const pageEntries = Object.entries(site.pages);
  const routeToFileMap = pageEntries.reduce<Record<string, string>>((acc, [, page]) => {
    acc[page.route] = htmlFileNameFromRoute(page.route);
    return acc;
  }, {});
  const navLinks = pageEntries
    .map(([, page]) => `              <Link href=\"${page.route}\">${escTemplate(page.seo.title)}</Link>`)
    .join("\n");

  files["app/layout.tsx"] = `import "./globals.css";\nimport Link from "next/link";\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body>\n        <header className=\"border-b border-white/10\">\n          <nav className=\"mx-auto flex max-w-5xl items-center justify-between px-6 py-4\">\n            <strong>${escTemplate(site.designBrief.brandVibe)}</strong>\n            <div className=\"flex gap-4 text-sm\">\n${navLinks}\n            </div>\n          </nav>\n        </header>\n        {children}\n      </body>\n    </html>\n  );\n}\n`;

  for (const [key, page] of pageEntries) {
    const safeKey = key || pageKeyFromRoute(page.route);
    files[pageFilePathFromRoute(page.route)] = buildHtmlPageFile(safeKey);
    files[`html/${htmlFileNameFromRoute(page.route)}`] = buildStaticHtmlFile(page, routeToFileMap);
  }

  files["html/README.txt"] = `Static HTML Export\n\nThis folder contains plain HTML files for non-developers.\n\nOpen html/index.html in a browser to start.\n\nNotes:\n- Internal links between generated routes are mapped to local .html files.\n- External links work as normal.\n`;

  files["README.md"] = `# Generated Website\n\nThis zip includes two outputs:\n\n1) Next.js scaffold (developer workflow)\n2) Plain HTML files in /html (non-developer workflow)\n\nThis scaffold includes ${pageEntries.length} generated page(s).\n\n## Run (Next.js)\n\n\`npm install\`\n\`npm run dev\`\n\n## Plain HTML\n\nOpen \`html/index.html\` directly in a browser.\n`;

  return files;
}
