// Resolution presets for image downloads
export const RESOLUTION_PRESETS = {
  original: {
    id: "original",
    label: "Original",
    description: "Full res",
    maxWidth: null, // No resize
    maxHeight: null,
    quality: 92,
  },
  mls: {
    id: "mls",
    label: "MLS-Ready",
    description: "2048px",
    maxWidth: 2048,
    maxHeight: 1536,
    quality: 90,
  },
  web: {
    id: "web",
    label: "Web-Optimized",
    description: "1200px",
    maxWidth: 1200,
    maxHeight: 900,
    quality: 85,
  },
} as const;

export type ResolutionPreset = keyof typeof RESOLUTION_PRESETS;
export type ResolutionConfig = (typeof RESOLUTION_PRESETS)[ResolutionPreset];

export function getResolutionConfig(preset: ResolutionPreset): ResolutionConfig {
  return RESOLUTION_PRESETS[preset];
}

export const RESOLUTION_OPTIONS = Object.values(RESOLUTION_PRESETS);
