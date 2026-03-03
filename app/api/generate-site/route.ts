import { NextResponse } from "next/server";
import { generateSiteWithGemini } from "@/lib/gemini";
import { generateSiteInputSchema } from "@/lib/schemas";
import { sanitizeGenerateSiteInput } from "@/lib/sanitize";
import { checkCredits, deductCredit } from "@/lib/credits";

export const runtime = "nodejs";
export const maxDuration = 240;

export async function POST(request: Request) {
  try {
    const creditCheck = await checkCredits();
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: "Insufficient credits or unauthorized" },
        { status: 402 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const sanitized = sanitizeGenerateSiteInput(body as never);

    const parsed = generateSiteInputSchema.safeParse(sanitized);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    console.log(`[generate-site] Received request with ${parsed.data.referenceImages?.length ?? 0} reference images.`);

    const data = await generateSiteWithGemini(parsed.data);

    if (!creditCheck.isAdmin && creditCheck.userId) {
      await deductCredit(creditCheck.userId);
    }

    return NextResponse.json({ data });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unexpected server error";

    console.error("generate-site error", {
      message,
      at: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: "Failed to generate site",
        details: message
      },
      { status: 500 }
    );
  }
}
