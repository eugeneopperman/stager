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
    label: "Modern/Contemporary",
    description: "Clean lines, neutral colors, sleek furniture",
  },
  {
    id: "traditional",
    label: "Traditional/Classic",
    description: "Elegant, timeless pieces with rich woods and fabrics",
  },
  {
    id: "minimalist",
    label: "Minimalist",
    description: "Simple, functional, uncluttered spaces",
  },
  {
    id: "mid-century",
    label: "Mid-Century Modern",
    description: "Retro-inspired with organic curves and warm tones",
  },
  {
    id: "scandinavian",
    label: "Scandinavian",
    description: "Light woods, white walls, cozy textiles",
  },
  {
    id: "industrial",
    label: "Industrial",
    description: "Raw materials, exposed elements, urban feel",
  },
  {
    id: "coastal",
    label: "Coastal/Beach",
    description: "Light, airy, ocean-inspired colors and textures",
  },
  {
    id: "farmhouse",
    label: "Farmhouse/Rustic",
    description: "Warm, inviting, natural materials and vintage accents",
  },
  {
    id: "luxury",
    label: "Luxury/Glam",
    description: "Opulent, sophisticated, high-end finishes",
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

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_BATCH_SIZE = 10; // Maximum images per batch staging
