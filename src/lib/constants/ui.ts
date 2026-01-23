import {
  Sofa,
  Bed,
  Baby,
  UtensilsCrossed,
  CookingPot,
  Briefcase,
  Bath,
  Trees,
  type LucideIcon,
} from "lucide-react";

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

/**
 * Icon mapping for room types - centralized to avoid duplication
 */
export const ROOM_TYPE_ICONS: Record<string, LucideIcon> = {
  sofa: Sofa,
  bed: Bed,
  baby: Baby,
  utensils: UtensilsCrossed,
  "cooking-pot": CookingPot,
  briefcase: Briefcase,
  bath: Bath,
  trees: Trees,
};

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
