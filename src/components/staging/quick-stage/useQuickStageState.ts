"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useStagingSubmit } from "@/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  type RoomType,
  type FurnitureStyle,
  FURNITURE_STYLES,
  CREDITS_PER_STAGING,
} from "@/lib/constants";

export type StagingState = "upload" | "processing" | "complete" | "error";

export interface QuickStageStateResult {
  // State
  state: StagingState;
  selectedFile: File | null;
  preview: string | null;
  workingFile: File | null;
  workingPreview: string | null;
  maskDataUrl: string | null;
  roomType: RoomType | null;
  styles: FurnitureStyle[];
  propertyId: string | null;
  compareIndex: number;
  credits: number;
  requiredCredits: number;
  hasEnoughCredits: boolean;
  canStage: boolean;

  // From useStagingSubmit
  variations: ReturnType<typeof useStagingSubmit>["variations"];
  isProcessing: boolean;
  processingIndex: number;
  error: string | null;
  currentProvider: string | null;

  // Handlers
  setRoomType: (roomType: RoomType | null) => void;
  setStyles: (styles: FurnitureStyle[]) => void;
  setPropertyId: (id: string | null) => void;
  setCompareIndex: (index: number) => void;
  handleImageSelect: (file: File, previewUrl: string) => void;
  handleImageClear: () => void;
  handlePreprocessedImageUpdate: (file: File, previewUrl: string) => void;
  handleMaskUpdate: (mask: string | null) => void;
  handleStage: () => Promise<void>;
  handleReset: () => void;
  handleDownload: (variation: { style: FurnitureStyle; imageUrl: string | null }) => void;
  handleDownloadAll: () => void;
  getStyleLabel: (styleId: string) => string;
}

export function useQuickStageState(): QuickStageStateResult {
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get("property");
  const { credits } = useDashboard();

  const [state, setState] = useState<StagingState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [workingFile, setWorkingFile] = useState<File | null>(null);
  const [workingPreview, setWorkingPreview] = useState<string | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [styles, setStyles] = useState<FurnitureStyle[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(propertyIdParam);
  const [compareIndex, setCompareIndex] = useState(0);

  const {
    variations,
    isProcessing,
    processingIndex,
    error,
    setError,
    currentProvider,
    submitStaging,
    resetStaging,
  } = useStagingSubmit({
    onComplete: () => setState("complete"),
  });

  const requiredCredits = styles.length * CREDITS_PER_STAGING;
  const hasEnoughCredits = credits >= requiredCredits;
  const canStage =
    !!selectedFile && !!roomType && styles.length > 0 && !isProcessing && hasEnoughCredits;

  const handleImageSelect = useCallback(
    (file: File, previewUrl: string) => {
      setSelectedFile(file);
      setPreview(previewUrl);
      setError(null);
    },
    [setError]
  );

  const handleImageClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setWorkingFile(null);
    setWorkingPreview(null);
    setMaskDataUrl(null);
    setError(null);
  }, [setError]);

  const handlePreprocessedImageUpdate = useCallback(
    (file: File, previewUrl: string) => {
      setWorkingFile(file);
      setWorkingPreview(previewUrl);
    },
    []
  );

  const handleMaskUpdate = useCallback((mask: string | null) => {
    setMaskDataUrl(mask);
    console.log("[Stage] Mask updated:", mask ? "mask set" : "mask cleared");
  }, []);

  const handleStage = useCallback(async () => {
    if (!selectedFile || !roomType || styles.length === 0) {
      setError(
        "Please upload an image, select room type, and choose at least one style"
      );
      return;
    }

    if (!hasEnoughCredits) {
      setError(
        `Insufficient credits. You need ${requiredCredits} but have ${credits}.`
      );
      return;
    }

    setState("processing");
    await submitStaging({
      imageFile: selectedFile,
      roomType,
      styles,
      propertyId,
      maskDataUrl,
      workingFile,
    });
  }, [
    selectedFile,
    roomType,
    styles,
    hasEnoughCredits,
    requiredCredits,
    credits,
    propertyId,
    maskDataUrl,
    workingFile,
    setError,
    submitStaging,
  ]);

  const handleReset = useCallback(() => {
    resetStaging();
    setState("upload");
    setSelectedFile(null);
    setPreview(null);
    setWorkingFile(null);
    setWorkingPreview(null);
    setMaskDataUrl(null);
    setRoomType(null);
    setStyles([]);
    setCompareIndex(0);
  }, [resetStaging]);

  const handleDownload = useCallback(
    (variation: { style: FurnitureStyle; imageUrl: string | null }) => {
      if (variation.imageUrl) {
        const link = document.createElement("a");
        link.href = variation.imageUrl;
        link.download = `staged-${roomType}-${variation.style}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [roomType]
  );

  const handleDownloadAll = useCallback(() => {
    variations
      .filter((v) => v.status === "completed" && v.imageUrl)
      .forEach((v, i) => {
        setTimeout(() => handleDownload(v), i * 500);
      });
  }, [variations, handleDownload]);

  const getStyleLabel = useCallback((styleId: string) => {
    return FURNITURE_STYLES.find((s) => s.id === styleId)?.label || styleId;
  }, []);

  return {
    state,
    selectedFile,
    preview,
    workingFile,
    workingPreview,
    maskDataUrl,
    roomType,
    styles,
    propertyId,
    compareIndex,
    credits,
    requiredCredits,
    hasEnoughCredits,
    canStage,
    variations,
    isProcessing,
    processingIndex,
    error,
    currentProvider,
    setRoomType,
    setStyles,
    setPropertyId,
    setCompareIndex,
    handleImageSelect,
    handleImageClear,
    handlePreprocessedImageUpdate,
    handleMaskUpdate,
    handleStage,
    handleReset,
    handleDownload,
    handleDownloadAll,
    getStyleLabel,
  };
}
