/**
 * Image optimization utilities
 */

/**
 * Generic blur placeholder for images (10x10 gray gradient)
 * This is a tiny base64 image that creates a nice blur effect while loading
 */
export const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8+P/hfwYGBgZGRgZGBgYAFSQD/dkPqvkAAAAASUVORK5CYII=";

/**
 * Shimmer effect placeholder for a more dynamic loading state
 * Creates a gradient animation effect
 */
export const SHIMMER_PLACEHOLDER = `data:image/svg+xml;base64,${Buffer.from(`
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1">
          <animate attributeName="offset" values="-2;1" dur="2s" repeatCount="indefinite" />
        </stop>
        <stop offset="50%" style="stop-color:#e0e0e0;stop-opacity:1">
          <animate attributeName="offset" values="-1;2" dur="2s" repeatCount="indefinite" />
        </stop>
        <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1">
          <animate attributeName="offset" values="0;3" dur="2s" repeatCount="indefinite" />
        </stop>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#shimmer)" />
  </svg>
`).toString("base64")}`;

/**
 * Generate a solid color placeholder
 */
export function getColorPlaceholder(color: string = "#e5e7eb"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="100%" height="100%" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Common image sizes for responsive loading
 */
export const IMAGE_SIZES = {
  thumbnail: "(max-width: 768px) 100px, 150px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  gallery: "(max-width: 768px) 33vw, 150px",
  hero: "(max-width: 768px) 100vw, 50vw",
  full: "100vw",
} as const;

/**
 * Quality settings for different use cases
 */
export const IMAGE_QUALITY = {
  thumbnail: 60,
  preview: 75,
  standard: 85,
  high: 95,
} as const;

/**
 * Check if a URL is an external image (needs unoptimized prop)
 */
export function isExternalImage(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const appHost = appUrl ? new URL(appUrl).host : "";
    return urlObj.host !== appHost && !url.startsWith("/");
  } catch {
    return false;
  }
}

/**
 * Get optimized image props based on use case
 */
export function getImageProps(
  useCase: "thumbnail" | "card" | "gallery" | "hero" | "full" = "card"
) {
  return {
    sizes: IMAGE_SIZES[useCase],
    quality: useCase === "thumbnail" ? IMAGE_QUALITY.thumbnail : IMAGE_QUALITY.standard,
    placeholder: "blur" as const,
    blurDataURL: BLUR_PLACEHOLDER,
  };
}
