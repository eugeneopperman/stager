// Main staging components
export { ImageUploader } from "./ImageUploader";
export { BatchImageUploader } from "./BatchImageUploader";
export { BatchImageCard } from "./BatchImageCard";
export { RoomTypeDropdown } from "./RoomTypeDropdown";
export { StyleGallery } from "./StyleGallery";
export { StyleSelector } from "./StyleSelector";
export { PropertySelector } from "./PropertySelector";
export { CreditDisplay } from "./CreditDisplay";
export { QuickStageLayout } from "./QuickStageLayout";
export { StagingResult } from "./StagingResult";

// Remix components
export { RemixButton } from "./RemixButton";
export { RemixDialog } from "./RemixDialog";

// Version components
export { VersionBadge } from "./VersionBadge";
export { VersionThumbnailStrip } from "./VersionThumbnailStrip";

// Shared components
export * from "./shared";

// Wizard components
export { StagingWizard } from "./wizard/StagingWizard";
export { WizardStepIndicator, type WizardStep } from "./wizard/WizardStepIndicator";
export { WizardNavigation } from "./wizard/WizardNavigation";
export { UploadStep } from "./wizard/UploadStep";
export { PrepareStep } from "./wizard/PrepareStep";
export { StyleStep } from "./wizard/StyleStep";
export { GenerateStep } from "./wizard/GenerateStep";

// Preprocessing (re-export from preprocessing index)
export { PreprocessingToolbar } from "./preprocessing";
