"use client";

import { ResultsView, StagingErrorAlert } from "@/components/staging/shared";
import {
  useQuickStageState,
  QuickStageImagePanel,
  QuickStageControlPanel,
} from "./quick-stage";

export function QuickStageLayout() {
  const {
    state,
    selectedFile,
    preview,
    workingFile,
    workingPreview,
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
  } = useQuickStageState();

  // Complete view with comparison slider
  if (state === "complete" && variations.length > 0 && preview) {
    return (
      <ResultsView
        variations={variations}
        originalPreview={preview}
        compareIndex={compareIndex}
        onCompareIndexChange={setCompareIndex}
        onDownload={handleDownload}
        onDownloadAll={handleDownloadAll}
        onReset={handleReset}
      />
    );
  }

  // Main staging interface - Two-panel layout
  return (
    <div>
      <StagingErrorAlert
        error={
          error ||
          (state === "error"
            ? "An unexpected error occurred. Please try again."
            : null)
        }
        onRetry={handleReset}
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickStageImagePanel
          preview={preview}
          workingPreview={workingPreview}
          selectedFile={selectedFile}
          workingFile={workingFile}
          isProcessing={isProcessing}
          variations={variations}
          processingIndex={processingIndex}
          currentProvider={currentProvider}
          onImageSelect={handleImageSelect}
          onImageClear={handleImageClear}
          onPreprocessedImageUpdate={handlePreprocessedImageUpdate}
          onMaskUpdate={handleMaskUpdate}
          getStyleLabel={getStyleLabel}
        />

        <QuickStageControlPanel
          roomType={roomType}
          styles={styles}
          propertyId={propertyId}
          credits={credits}
          requiredCredits={requiredCredits}
          hasEnoughCredits={hasEnoughCredits}
          canStage={canStage}
          isProcessing={isProcessing}
          selectedFile={selectedFile}
          onRoomTypeChange={setRoomType}
          onStylesChange={setStyles}
          onPropertyChange={setPropertyId}
          onStage={handleStage}
        />
      </div>
    </div>
  );
}
