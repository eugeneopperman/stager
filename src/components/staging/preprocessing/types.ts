/**
 * Preprocessing types for staging image tools
 */

export type PreprocessingTool = "crop-rotate" | "adjustments" | "declutter" | "masking";

export interface ImageAdjustments {
  brightness: number; // -100 to 100, default 0
  contrast: number; // -100 to 100, default 0
}

export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
}

export type AspectRatio = "free" | "4:3" | "16:9" | "1:1";

export interface MaskData {
  dataUrl: string | null; // B/W mask image
  mode: "include" | "exclude"; // Areas to stage vs preserve
  brushSize: number; // 10-100 pixels
}

export interface PreprocessingState {
  // The working image (modified version)
  workingImageUrl: string | null;
  workingImageFile: File | null;

  // Original for reset
  originalImageUrl: string;
  originalImageFile: File;

  // Tool states
  activeTool: PreprocessingTool | null;
  isProcessing: boolean;

  // Settings per tool
  adjustments: ImageAdjustments;
  cropSettings: CropSettings | null;
  maskData: MaskData | null;

  // History for undo (stack of data URLs)
  history: string[];
  historyIndex: number;
}

export interface PreprocessingToolbarProps {
  imageUrl: string;
  imageFile: File;
  onImageUpdate: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

export interface ToolPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Default values
export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
};

export const DEFAULT_MASK_DATA: MaskData = {
  dataUrl: null,
  mode: "include",
  brushSize: 30,
};
