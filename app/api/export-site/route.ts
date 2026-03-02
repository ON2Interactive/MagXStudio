import JSZip from "jszip";
import { NextResponse } from "next/server";
import { generatedSiteSchema } from "@/lib/schemas";
import { buildGeneratedProjectFiles } from "@/lib/build-project";
import { buildPresentationArtifacts } from "@/lib/presentation-export";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      generatedSite?: unknown;
      workspace?: "websites" | "slides" | "pages" | "visuals";
      presentationAspectRatio?: "16:9" | "4:3";
    };

    const parsed = generatedSiteSchema.safeParse(body.generatedSite);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid generated site payload",
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    if (body.workspace === "pages") {
      const artifacts = await buildPresentationArtifacts(parsed.data, "16:9");
      const pagesZip = new JSZip();
      pagesZip.file("pages.pdf", artifacts.pdfBytes);
      pagesZip.file("exports/pages.pdf", artifacts.pdfBytes);
      const buffer = await pagesZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
      const bytes = new Uint8Array(buffer);
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": "attachment; filename=generated-pages.zip"
        }
      });
    }

    const zip = new JSZip();
    const files = buildGeneratedProjectFiles(parsed.data);

    for (const [filePath, content] of Object.entries(files)) {
      zip.file(filePath, content);
    }

    if (body.workspace === "slides") {
      const artifacts = await buildPresentationArtifacts(
        parsed.data,
        body.presentationAspectRatio === "4:3" ? "4:3" : "16:9"
      );
      zip.file("presentation.pptx", artifacts.pptxBytes);
      zip.file("presentation.pdf", artifacts.pdfBytes);
      zip.file("exports/presentation.pptx", artifacts.pptxBytes);
      zip.file("exports/presentation.pdf", artifacts.pdfBytes);
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const bytes = new Uint8Array(buffer);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${
          body.workspace === "slides" ? "generated-presentation.zip" : "generated-website.zip"
        }`
      }
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unexpected export error";

    return NextResponse.json(
      {
        error: "Failed to export project",
        details: message
      },
      { status: 500 }
    );
  }
}
