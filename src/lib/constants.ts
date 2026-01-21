export const ROOM_TYPES = [
  { id: "living-room", label: "Living Room", icon: "sofa" },
  { id: "bedroom-master", label: "Master Bedroom", icon: "bed" },
  { id: "bedroom-guest", label: "Guest Bedroom", icon: "bed" },
  { id: "bedroom-kids", label: "Kids Bedroom", icon: "baby" },
  { id: "dining-room", label: "Dining Room", icon: "utensils" },
  { id: "kitchen", label: "Kitchen", icon: "cooking-pot" },
  { id: "home-office", label: "Home Office", icon: "briefcase" },
  { id: "bathroom", label: "Bathroom", icon: "bath" },
  { id: "outdoor-patio", label: "Outdoor/Patio", icon: "trees" },
] as const;

export const FURNITURE_STYLES = [
  {
    id: "modern",
    label: "Modern",
    description: "Clean lines, neutral colors, sleek furniture",
    image: "/styles/modern.svg",
  },
  {
    id: "traditional",
    label: "Traditional",
    description: "Elegant, timeless pieces with rich woods",
    image: "/styles/traditional.svg",
  },
  {
    id: "minimalist",
    label: "Minimalist",
    description: "Simple, functional, uncluttered spaces",
    image: "/styles/minimalist.svg",
  },
  {
    id: "mid-century",
    label: "Mid-Century",
    description: "Retro-inspired with organic curves",
    image: "/styles/mid-century.svg",
  },
  {
    id: "scandinavian",
    label: "Scandinavian",
    description: "Light woods, white walls, cozy textiles",
    image: "/styles/scandinavian.svg",
  },
  {
    id: "industrial",
    label: "Industrial",
    description: "Raw materials, exposed elements, urban feel",
    image: "/styles/industrial.svg",
  },
  {
    id: "coastal",
    label: "Coastal",
    description: "Light, airy, ocean-inspired colors",
    image: "/styles/coastal.svg",
  },
  {
    id: "farmhouse",
    label: "Farmhouse",
    description: "Warm, inviting, natural materials",
    image: "/styles/farmhouse.svg",
  },
  {
    id: "luxury",
    label: "Luxury",
    description: "Opulent, sophisticated, high-end finishes",
    image: "/styles/luxury.svg",
  },
] as const;

export type RoomType = (typeof ROOM_TYPES)[number]["id"];
export type FurnitureStyle = (typeof FURNITURE_STYLES)[number]["id"];

export const STAGING_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type StagingStatus = (typeof STAGING_STATUS)[keyof typeof STAGING_STATUS];

export const DEFAULT_CREDITS = 10;
export const CREDITS_PER_STAGING = 1;
export const LOW_CREDITS_THRESHOLD = 3; // Show warning when credits fall to this level or below

// Time estimates for user feedback
export const STAGING_TIME_ESTIMATE = "15-30 seconds";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_BATCH_SIZE = 10; // Maximum images per batch staging

// Remix and version control constants
export const FREE_REMIXES_PER_IMAGE = 2; // Number of free remixes per original image
export const CREDITS_PER_REMIX = 1; // Credits charged after free remixes
export const VERSION_WARNING_THRESHOLD = 5; // Warn user when creating 6th+ version
