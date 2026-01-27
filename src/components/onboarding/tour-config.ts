import type { Config, DriveStep } from "driver.js";

// ===========================================
// Main Product Tour Steps (sidebar navigation)
// ===========================================
export const TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-tour="stage-photo"]',
    popover: {
      title: "Stage Your First Photo",
      description:
        "Upload a room photo and transform it into a beautifully staged space in seconds. This is where the magic happens!",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="batch-stage"]',
    popover: {
      title: "Batch Staging",
      description:
        "Need to stage multiple photos? Upload up to 10 images at once and process them all together.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="properties"]',
    popover: {
      title: "Organize by Property",
      description:
        "Group your staging jobs by property address. Perfect for managing multiple listings.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="history"]',
    popover: {
      title: "Staging History",
      description:
        "View all your past staging jobs, download images, and remix with different styles.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="credits"]',
    popover: {
      title: "Your Credits",
      description: "Each staging costs 1 credit. You have {credits} free credits to start!",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="search"]',
    popover: {
      title: "Quick Search",
      description:
        "Find any property or staging job instantly. Search by address, room type, or style.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="notifications"]',
    popover: {
      title: "Stay Updated",
      description: "Get notified when your staging jobs complete. Click to view details.",
      side: "bottom",
      align: "end",
    },
  },
];

// Filtered steps for mobile (sidebar items not visible)
export const MOBILE_TOUR_STEPS: DriveStep[] = TOUR_STEPS.filter(
  (step) =>
    step.element === '[data-tour="search"]' ||
    step.element === '[data-tour="notifications"]'
);

export const DRIVER_CONFIG: Config = {
  showProgress: true,
  showButtons: ["next", "previous", "close"],
  progressText: "{{current}} of {{total}}",
  nextBtnText: "Next →",
  prevBtnText: "← Back",
  doneBtnText: "Get Started!",
  overlayOpacity: 0.6,
  stagePadding: 4,
  stageRadius: 8,
  allowClose: true,
  animate: true,
  smoothScroll: true,
};

// ===========================================
// Page-Specific Tour Steps
// ===========================================
export const PAGE_TOURS: Record<string, DriveStep[]> = {
  // Dashboard page tour
  dashboard: [
    {
      element: '[data-tour="dashboard-stats"]',
      popover: {
        title: "Activity Overview",
        description: "Track your staging activity at a glance - total stagings, properties, and completed jobs.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="dashboard-stage-cta"]',
      popover: {
        title: "Quick Start",
        description: "Jump straight into staging your first photo with a single click.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="dashboard-recent"]',
      popover: {
        title: "Recent Work",
        description: "Your latest staging jobs appear here for quick access.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="dashboard-credits"]',
      popover: {
        title: "Credit Status",
        description: "Alerts appear here when your credits are running low or empty.",
        side: "bottom",
        align: "center",
      },
    },
  ],

  // Stage Photo page tour
  stage: [
    {
      element: '[data-tour="stage-mode-toggle"]',
      popover: {
        title: "Choose Your Mode",
        description: "Guided mode walks you through each step. Quick mode is for power users who want speed.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="stage-batch-link"]',
      popover: {
        title: "Batch Staging",
        description: "Need to stage multiple rooms? Switch to batch mode to process up to 10 photos at once.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="stage-upload"]',
      popover: {
        title: "Upload Your Photo",
        description: "Drag & drop or click to select a room photo. Works best with empty or minimally furnished spaces.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="stage-styles"]',
      popover: {
        title: "Pick a Style",
        description: "Choose your preferred furniture style - from Modern to Farmhouse. Each creates a unique look.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="stage-room-type"]',
      popover: {
        title: "Room Type",
        description: "Select what type of room this is. This helps the AI place appropriate furniture.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="stage-generate"]',
      popover: {
        title: "Generate",
        description: "Once everything is set, click here to start the AI staging process.",
        side: "top",
        align: "center",
      },
    },
  ],

  // Batch Staging page tour
  "stage/batch": [
    {
      element: '[data-tour="batch-upload"]',
      popover: {
        title: "Upload Multiple Photos",
        description: "Add up to 10 room photos at once. Each will be staged with the same style.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="batch-room-types"]',
      popover: {
        title: "Room Types",
        description: "Set the room type for each photo individually. This ensures appropriate furniture placement.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="batch-style"]',
      popover: {
        title: "Single Style",
        description: "Choose one furniture style that will be applied to all photos in this batch.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="batch-credits"]',
      popover: {
        title: "Credit Cost",
        description: "See the total credits needed for this batch before processing.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="batch-process"]',
      popover: {
        title: "Start Processing",
        description: "Begin staging all photos. Progress is shown for each image.",
        side: "top",
        align: "center",
      },
    },
  ],

  // History page tour
  history: [
    {
      element: '[data-tour="history-stats"]',
      popover: {
        title: "Filter by Status",
        description: "Click these cards to quickly filter your jobs by completed, processing, or all.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="history-favorites"]',
      popover: {
        title: "Favorites",
        description: "Toggle to show only your favorite stagings. Star jobs you want to find quickly.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="history-view"]',
      popover: {
        title: "View Mode",
        description: "Switch between grid view for visual browsing and list view for details.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="history-sort"]',
      popover: {
        title: "Sort Order",
        description: "Sort your staging jobs by newest or oldest first.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="history-job"]',
      popover: {
        title: "Staging Job",
        description: "Hover over any job to see quick actions: download, compare before/after, or remix with a different style.",
        side: "top",
        align: "center",
      },
    },
  ],

  // Properties page tour
  properties: [
    {
      element: '[data-tour="properties-create"]',
      popover: {
        title: "Create Property",
        description: "Add a new property to organize your staging jobs by address.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="properties-search"]',
      popover: {
        title: "Search Properties",
        description: "Quickly find properties by address or description.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="properties-sort"]',
      popover: {
        title: "Sort Options",
        description: "Sort properties by date, name, or number of stagings.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="properties-view"]',
      popover: {
        title: "View Mode",
        description: "Switch between grid and list layouts to suit your preference.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="properties-card"]',
      popover: {
        title: "Property Card",
        description: "Click any property to view all its staging jobs and manage the property.",
        side: "top",
        align: "center",
      },
    },
  ],

  // Billing page tour
  billing: [
    {
      element: '[data-tour="billing-credits"]',
      popover: {
        title: "Credit Balance",
        description: "Your current available staging credits. Color indicates your credit status.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="billing-usage"]',
      popover: {
        title: "Usage Statistics",
        description: "Track your credit consumption - this month, all-time, and total stagings.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="billing-topup"]',
      popover: {
        title: "Buy Credits",
        description: "Need more credits? Purchase additional credits instantly without changing your plan.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="billing-plans"]',
      popover: {
        title: "Subscription Plans",
        description: "Compare available plans and upgrade or downgrade anytime.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="billing-history"]',
      popover: {
        title: "Usage History",
        description: "See your recent staging activity and credit usage.",
        side: "top",
        align: "center",
      },
    },
  ],

  // Settings page tour
  settings: [
    {
      element: '[data-tour="settings-theme"]',
      popover: {
        title: "Appearance",
        description: "Choose light, dark, or system theme to match your preference.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="settings-sidebar"]',
      popover: {
        title: "Sidebar Behavior",
        description: "Control whether the sidebar stays visible or auto-hides when not in use.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="settings-tour"]',
      popover: {
        title: "Product Tour",
        description: "Restart the main product walkthrough anytime from here.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="settings-profile"]',
      popover: {
        title: "Your Profile",
        description: "Update your name and company information.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="settings-danger"]',
      popover: {
        title: "Danger Zone",
        description: "Permanently delete your account and all data. Use with caution.",
        side: "top",
        align: "center",
      },
    },
  ],
};

/**
 * Get the tour steps for a specific page based on pathname
 * @param pathname - The current page pathname (e.g., "/dashboard", "/stage")
 * @returns Tour steps for the page, or null if no tour exists
 */
export function getPageTourSteps(pathname: string): DriveStep[] | null {
  // Remove leading slash and get the page key
  const pageKey = pathname.replace(/^\//, "");

  // Check for exact match first
  if (PAGE_TOURS[pageKey]) {
    return PAGE_TOURS[pageKey];
  }

  // Handle nested routes (e.g., /stage/batch -> stage/batch)
  // Also handle dashboard as empty string
  if (pageKey === "" && PAGE_TOURS["dashboard"]) {
    return PAGE_TOURS["dashboard"];
  }

  return null;
}

/**
 * Check if a page has a tour available
 * @param pathname - The current page pathname
 * @returns boolean indicating if a tour exists for this page
 */
export function hasPageTour(pathname: string): boolean {
  return getPageTourSteps(pathname) !== null;
}
