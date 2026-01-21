// Watermark generation for staged images
// Location: Bottom-left corner, 2% margin from edges
// Style: Semi-transparent dark pill background (40% opacity) with home icon

import sharp from "sharp";

export interface WatermarkConfig {
  imageWidth: number;
  imageHeight: number;
}

// Create watermark with home icon only (text causes font issues on serverless)
export async function generateWatermarkBuffer(config: WatermarkConfig): Promise<Buffer> {
  // Calculate target size (max 50px height for icon-only, scales with image)
  const targetHeight = Math.min(50, Math.max(30, Math.round(config.imageHeight * 0.04)));
  const targetWidth = Math.round(targetHeight * 2.5); // Pill shape ratio
  const cornerRadius = Math.round(targetHeight / 2);

  // Create SVG with just the pill background and home icon
  const svg = `
<svg width="${targetWidth}" height="${targetHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect rx="${cornerRadius}" ry="${cornerRadius}" width="${targetWidth}" height="${targetHeight}" fill="rgba(0,0,0,0.4)"/>
  <g transform="translate(${targetWidth / 2 - 12}, ${targetHeight / 2 - 12}) scale(1)">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22"
              fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`.trim();

  // Convert SVG to PNG buffer using Sharp
  const watermarkBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return watermarkBuffer;
}

export async function getWatermarkMetadata(watermarkBuffer: Buffer): Promise<{ width: number; height: number }> {
  const metadata = await sharp(watermarkBuffer).metadata();
  return {
    width: metadata.width || 100,
    height: metadata.height || 40,
  };
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

export function calculateWatermarkDimensions(imageWidth: number, imageHeight: number) {
  const targetHeight = Math.min(50, Math.max(30, Math.round(imageHeight * 0.04)));
  const targetWidth = Math.round(targetHeight * 2.5);
  return {
    width: targetWidth,
    height: targetHeight,
  };
}
