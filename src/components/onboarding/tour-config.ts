import type { Config, DriveStep } from "driver.js";

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
