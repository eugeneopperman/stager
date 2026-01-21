// Watermark generation for staged images
// Location: Bottom-left corner, 2% margin from edges
// Content: Home icon + "Virtually staged with AI"
// Style: Semi-transparent dark pill background (40% opacity)

import sharp from "sharp";

// Inter font subset (only characters needed for "Virtually staged with AI") embedded as base64
// This ensures text renders correctly on serverless environments without system fonts
const INTER_FONT_BASE64 = `data:font/woff2;base64,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`;

export interface WatermarkConfig {
  imageWidth: number;
  imageHeight: number;
}

export async function generateWatermarkBuffer(config: WatermarkConfig): Promise<Buffer> {
  // Calculate target size based on image dimensions
  const baseWidth = 260;
  const baseHeight = 36;

  // Scale watermark relative to image width (max 300px, min 180px)
  const scale = Math.min(1.15, Math.max(0.7, config.imageWidth / 1500));
  const width = Math.round(baseWidth * scale);
  const height = Math.round(baseHeight * scale);
  const cornerRadius = Math.round(height / 2);
  const fontSize = Math.round(13 * scale);
  const iconScale = scale * 0.75;

  // Create SVG with embedded font
  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Inter';
        src: url('${INTER_FONT_BASE64}') format('woff2');
        font-weight: 500;
        font-style: normal;
      }
    </style>
  </defs>

  <!-- Background pill -->
  <rect rx="${cornerRadius}" ry="${cornerRadius}" width="${width}" height="${height}" fill="rgba(0,0,0,0.4)"/>

  <!-- Home icon -->
  <g transform="translate(${10 * scale}, ${height / 2 - 10 * iconScale}) scale(${iconScale})">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22"
              fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Text -->
  <text x="${35 * scale}" y="${height / 2 + fontSize * 0.35}"
        fill="white"
        font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="${fontSize}"
        font-weight="500">Virtually staged with AI</text>
</svg>`.trim();

  // Convert SVG to PNG buffer using Sharp
  const watermarkBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return watermarkBuffer;
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
