// Watermark SVG generation for staged images
// Location: Bottom-left corner, 2% margin from edges
// Content: Home icon + "Virtually staged with AI"
// Style: Semi-transparent dark pill background (40% opacity)

const BASE_WIDTH = 260;
const BASE_HEIGHT = 36;

// Pre-rendered text paths for "Virtually staged with AI" to avoid font issues
// Generated at 14px font size, white fill
const TEXT_PATHS = `
<g fill="white" transform="translate(0, 0)">
  <!-- V -->
  <path d="M0 0h2.2l3.3 9.5 3.3-9.5h2.2l-4.4 12h-2.2z"/>
  <!-- i -->
  <path d="M12.5 0h2v1.8h-2zm0 3.5h2V12h-2z"/>
  <!-- r -->
  <path d="M16.5 3.5h2v1.5c.5-1 1.5-1.7 2.8-1.7v2.1c-1.8 0-2.8.8-2.8 2.5V12h-2z"/>
  <!-- t -->
  <path d="M23 1.5h2v2h2v1.7h-2v4.5c0 .7.3 1 1 1h1V12h-1.3c-1.7 0-2.7-.8-2.7-2.5V5.2h-1.5V3.5H23z"/>
  <!-- u -->
  <path d="M28.5 3.5h2v5.2c0 1.2.7 1.8 1.8 1.8s1.8-.6 1.8-1.8V3.5h2V12h-2v-1c-.5.8-1.4 1.2-2.5 1.2-2 0-3.1-1.2-3.1-3.2z"/>
  <!-- a -->
  <path d="M39 3.3c2 0 3.3 1 3.3 2.5v6.2h-2v-1c-.4.7-1.3 1.2-2.5 1.2-1.7 0-2.8-1-2.8-2.4 0-1.5 1.2-2.4 3.2-2.4h2v-.3c0-.8-.6-1.3-1.7-1.3-.8 0-1.6.3-2.2.8l-.8-1.4c.9-.6 2-1 3.5-1zm.8 5.7v-.8h-1.7c-1 0-1.5.4-1.5 1s.5 1 1.4 1c1 0 1.8-.5 1.8-1.2z"/>
  <!-- l -->
  <path d="M44.5 0h2v12h-2z"/>
  <!-- l -->
  <path d="M48.8 0h2v12h-2z"/>
  <!-- y -->
  <path d="M53 3.5h2.1l2 5.5 2-5.5h2.1l-3.5 9.2c-.6 1.5-1.5 2.3-3 2.3h-1v-1.7h.8c.8 0 1.2-.3 1.5-1l.2-.5z"/>
  <!-- space -->
  <!-- s -->
  <path d="M65 3.3c1.8 0 3.2.9 3.2 2.4 0 1.2-.8 1.9-2.3 2.2l-1.5.3c-.7.1-1 .4-1 .8 0 .5.5.8 1.3.8.9 0 1.6-.3 2.1-.9l1.2 1.2c-.7.9-1.9 1.4-3.4 1.4-1.9 0-3.2-.9-3.2-2.4 0-1.2.9-2 2.4-2.3l1.4-.3c.7-.1 1-.4 1-.8 0-.5-.5-.8-1.2-.8-.8 0-1.5.3-2 .9l-1.2-1.2c.8-.9 2-1.3 3.2-1.3z"/>
  <!-- t -->
  <path d="M70.5 1.5h2v2h2v1.7h-2v4.5c0 .7.3 1 1 1h1V12h-1.3c-1.7 0-2.7-.8-2.7-2.5V5.2h-1.5V3.5h1.5z"/>
  <!-- a -->
  <path d="M77 3.3c2 0 3.3 1 3.3 2.5v6.2h-2v-1c-.4.7-1.3 1.2-2.5 1.2-1.7 0-2.8-1-2.8-2.4 0-1.5 1.2-2.4 3.2-2.4h2v-.3c0-.8-.6-1.3-1.7-1.3-.8 0-1.6.3-2.2.8l-.8-1.4c.9-.6 2-1 3.5-1zm.8 5.7v-.8h-1.7c-1 0-1.5.4-1.5 1s.5 1 1.4 1c1 0 1.8-.5 1.8-1.2z"/>
  <!-- g -->
  <path d="M82.8 3.3c2.3 0 3.8 1.5 3.8 4.2v.5h-5.8c.2 1.2 1 1.8 2.2 1.8.9 0 1.6-.3 2.2-1l1.1 1.2c-.8 1-2 1.5-3.5 1.5-2.5 0-4.1-1.6-4.1-4.1 0-2.5 1.7-4.1 4.1-4.1zm-2 3.2h3.8c-.1-1.1-.8-1.7-1.9-1.7-1 0-1.7.6-1.9 1.7z"/>
  <!-- e -->
  <path d="M89.3 3.3c2.3 0 3.8 1.5 3.8 4.2v.5h-5.8c.2 1.2 1 1.8 2.2 1.8.9 0 1.6-.3 2.2-1l1.1 1.2c-.8 1-2 1.5-3.5 1.5-2.5 0-4.1-1.6-4.1-4.1 0-2.5 1.7-4.1 4.1-4.1zm-2 3.2h3.8c-.1-1.1-.8-1.7-1.9-1.7-1 0-1.7.6-1.9 1.7z"/>
  <!-- d -->
  <path d="M95.3 3.3c1.1 0 2 .5 2.5 1.2V0h2v12h-2v-1.1c-.5.8-1.4 1.3-2.5 1.3-2.1 0-3.6-1.7-3.6-4.1 0-2.5 1.5-4.1 3.6-4.1zm.5 6.5c1.1 0 2-.8 2-2.4 0-1.5-.9-2.4-2-2.4s-2 .9-2 2.4c0 1.6.9 2.4 2 2.4z"/>
  <!-- space -->
  <!-- w -->
  <path d="M105 3.5h2l1.5 5.5 1.7-5.5h1.8l1.7 5.5 1.5-5.5h2l-2.5 8.5h-2l-1.6-5.3-1.6 5.3h-2z"/>
  <!-- i -->
  <path d="M118.5 0h2v1.8h-2zm0 3.5h2V12h-2z"/>
  <!-- t -->
  <path d="M123 1.5h2v2h2v1.7h-2v4.5c0 .7.3 1 1 1h1V12h-1.3c-1.7 0-2.7-.8-2.7-2.5V5.2h-1.5V3.5h1.5z"/>
  <!-- h -->
  <path d="M128.5 0h2v5c.5-.9 1.5-1.5 2.7-1.5 2 0 3.1 1.2 3.1 3.2V12h-2V7.2c0-1.2-.6-1.8-1.7-1.8s-2 .7-2 2V12h-2z"/>
  <!-- space -->
  <!-- A -->
  <path d="M141 0h2.3l4 12h-2.3l-.8-2.5h-4.1l-.8 2.5H137zm2.6 7.7l-1.5-4.5-1.5 4.5z"/>
  <!-- I -->
  <path d="M149 0h2v12h-2z"/>
</g>
`;

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
    <rect rx="${18 * scale}" fill="rgba(0,0,0,0.4)" width="${targetWidth}" height="${scaledHeight}"/>
    <g transform="translate(${10 * scale}, ${8 * scale}) scale(${scale * 0.8})">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="9 22 9 12 15 12 15 22"
                fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(${38 * scale}, ${(scaledHeight / 2) - (6 * scale)}) scale(${scale * 0.9})">
      ${TEXT_PATHS}
    </g>
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
  <rect rx="${Math.round(18 * scale)}" fill="rgba(0,0,0,0.4)" width="${scaledWidth}" height="${scaledHeight}"/>
  <g transform="translate(${Math.round(10 * scale)}, ${Math.round(8 * scale)}) scale(${scale * 0.8})">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22"
              fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="translate(${Math.round(38 * scale)}, ${Math.round((scaledHeight / 2) - (6 * scale))}) scale(${scale * 0.9})">
    ${TEXT_PATHS}
  </g>
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
