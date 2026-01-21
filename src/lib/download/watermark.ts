// Watermark SVG generation for staged images
// Location: Bottom-left corner, 2% margin from edges
// Content: Home icon + "Virtually staged with AI"
// Style: Semi-transparent dark pill background

const BASE_WIDTH = 260;
const BASE_HEIGHT = 36;

export interface WatermarkConfig {
  imageWidth: number;
  imageHeight: number;
}

export function generateWatermarkSvg(config: WatermarkConfig): Buffer {
  // Scale watermark relative to image width (max 300px, min 150px)
  const targetWidth = Math.min(300, Math.max(150, config.imageWidth * 0.2));
  const scale = targetWidth / BASE_WIDTH;
  const scaledHeight = BASE_HEIGHT * scale;

  // Calculate position (2% margin from bottom-left)
  const marginX = Math.round(config.imageWidth * 0.02);
  const marginY = Math.round(config.imageHeight * 0.02);
  const posX = marginX;
  const posY = config.imageHeight - scaledHeight - marginY;

  const svg = `
<svg width="${config.imageWidth}" height="${config.imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${posX}, ${posY})">
    <rect rx="${18 * scale}" fill="rgba(0,0,0,0.6)" width="${targetWidth}" height="${scaledHeight}"/>
    <g transform="translate(${10 * scale}, ${8 * scale}) scale(${scale * 0.8})">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="9 22 9 12 15 12 15 22"
                fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="${38 * scale}" y="${(scaledHeight / 2) + (5 * scale)}" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="${13 * scale}" font-weight="500">
      Virtually staged with AI
    </text>
  </g>
</svg>
`.trim();

  return Buffer.from(svg);
}

// Generate a simpler watermark SVG buffer that can be composited
export function generateWatermarkBuffer(config: WatermarkConfig): Buffer {
  // Scale watermark relative to image width (max 300px, min 150px)
  const targetWidth = Math.min(300, Math.max(150, config.imageWidth * 0.2));
  const scale = targetWidth / BASE_WIDTH;
  const scaledHeight = Math.round(BASE_HEIGHT * scale);
  const scaledWidth = Math.round(targetWidth);

  const svg = `
<svg width="${scaledWidth}" height="${scaledHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect rx="${Math.round(18 * scale)}" fill="rgba(0,0,0,0.6)" width="${scaledWidth}" height="${scaledHeight}"/>
  <g transform="translate(${Math.round(10 * scale)}, ${Math.round(8 * scale)}) scale(${scale * 0.8})">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22"
              fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="${Math.round(38 * scale)}" y="${Math.round((scaledHeight / 2) + (5 * scale))}" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(13 * scale)}" font-weight="500">
    Virtually staged with AI
  </text>
</svg>
`.trim();

  return Buffer.from(svg);
}

export function getWatermarkPosition(imageWidth: number, imageHeight: number, watermarkWidth: number, watermarkHeight: number) {
  // 2% margin from bottom-left
  const marginX = Math.round(imageWidth * 0.02);
  const marginY = Math.round(imageHeight * 0.02);

  return {
    left: marginX,
    top: imageHeight - watermarkHeight - marginY,
  };
}

export function calculateWatermarkDimensions(imageWidth: number) {
  const targetWidth = Math.min(300, Math.max(150, imageWidth * 0.2));
  const scale = targetWidth / BASE_WIDTH;
  return {
    width: Math.round(targetWidth),
    height: Math.round(BASE_HEIGHT * scale),
  };
}
