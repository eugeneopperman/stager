import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDecor8Provider } from "@/lib/providers";
import { type RoomType, type FurnitureStyle } from "@/lib/constants";

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

    // Parse request body
    const body = await request.json();
    const {
      image,
      mimeType,
      roomType,
      style,
      stageAfter = false, // If true, stage the decluttered room
    } = body as {
      image: string;
      mimeType: string;
      roomType?: RoomType;
      style?: FurnitureStyle;
      stageAfter?: boolean;
    };

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: image, mimeType" },
        { status: 400 }
      );
    }

    // If stageAfter is true, we need roomType and style
    if (stageAfter && (!roomType || !style)) {
      return NextResponse.json(
        { error: "roomType and style required when stageAfter is true" },
        { status: 400 }
      );
    }

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
