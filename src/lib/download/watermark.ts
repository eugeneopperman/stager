// Watermark generation for staged images
// Location: Bottom-left corner, 2% margin from edges
// Content: Home icon + "Virtually staged with AI"
// Style: Semi-transparent dark pill background (40% opacity)

import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

// Cached watermark buffer
let cachedWatermark: Buffer | null = null;

export interface WatermarkConfig {
  imageWidth: number;
  imageHeight: number;
}

export async function generateWatermarkBuffer(config: WatermarkConfig): Promise<Buffer> {
  // Calculate target width based on image dimensions (max 300px, min 180px)
  const targetWidth = Math.min(300, Math.max(180, Math.round(config.imageWidth * 0.2)));

  // Load the pre-rendered watermark PNG from public folder
  if (!cachedWatermark) {
    const watermarkPath = path.join(process.cwd(), "public", "watermark.png");
    try {
      cachedWatermark = await fs.readFile(watermarkPath);
    } catch {
      // If file doesn't exist, create a fallback with just the icon
      console.warn("Watermark PNG not found, using fallback");
      return createFallbackWatermark(targetWidth);
    }
  }

  // Resize the watermark to target size
  const resizedWatermark = await sharp(cachedWatermark)
    .resize(targetWidth, null, { fit: "inside" })
    .png()
    .toBuffer();

  return resizedWatermark;
}

async function createFallbackWatermark(width: number): Promise<Buffer> {
  const height = Math.round(width * 0.14); // Approximate aspect ratio
  const cornerRadius = Math.round(height / 2);
  const iconScale = height / 36 * 0.75;

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect rx="${cornerRadius}" ry="${cornerRadius}" width="${width}" height="${height}" fill="rgba(0,0,0,0.4)"/>
  <g transform="translate(${height * 0.3}, ${height / 2 - 10 * iconScale}) scale(${iconScale})">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22"
              fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`.trim();

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function getWatermarkPosition(
  imageWidth: number,
  imageHeight: number,
  watermarkWidth: number,
  watermarkHeight: number
) {
  // 2% margin from bottom-left
  const marginX = Math.round(imageWidth * 0.02);
  const marginY = Math.round(imageHeight * 0.02);

  return {
    left: marginX,
    top: imageHeight - watermarkHeight - marginY,
  };
}
