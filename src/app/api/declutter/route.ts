import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDecor8Provider } from "@/lib/providers";
import { validateRequest, declutterRequestSchema } from "@/lib/schemas";

/**
 * POST /api/declutter
 *
 * Remove furniture/objects from a room image.
 * Can optionally stage the decluttered room in one request.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(declutterRequestSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { image, mimeType, roomType, style, stageAfter } = validation.data;

    const decor8Provider = getDecor8Provider();

    if (stageAfter && roomType && style) {
      // Declutter then stage
      const result = await decor8Provider.declutterAndStage({
        imageBase64: image,
        mimeType,
        roomType,
        furnitureStyle: style,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Declutter and stage failed" },
          { status: 500 }
        );
      }

      // Return base64 data URL for immediate display
      const stagedImageUrl = `data:${result.mimeType};base64,${result.imageData}`;

      return NextResponse.json({
        success: true,
        declutteredAndStaged: true,
        stagedImageUrl,
        processingTimeMs: Date.now() - startTime,
      });
    } else {
      // Just declutter
      const result = await decor8Provider.declutterRoom({
        imageBase64: image,
        mimeType,
        roomType: roomType || "living-room",
        furnitureStyle: style || "modern",
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Declutter failed" },
          { status: 500 }
        );
      }

      const declutteredImageUrl = `data:${result.mimeType};base64,${result.imageData}`;

      return NextResponse.json({
        success: true,
        declutteredImageUrl,
        processingTimeMs: Date.now() - startTime,
      });
    }
  } catch (error) {
    console.error("[Declutter API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
