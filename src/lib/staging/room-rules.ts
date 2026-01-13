import type { RoomType } from "../constants";
import type { ControlNetWeights } from "../providers/types";

/**
 * Room-specific staging rules for virtual staging.
 * These rules ensure appropriate furniture selection and placement per room type.
 */
export interface RoomStagingRules {
  roomType: RoomType;

  // Display info
  label: string;

  // Furniture rules
  requiredItems: string[];      // Must include in staging
  optionalItems: string[];      // Can include if space allows
  forbiddenItems: string[];     // Never include in this room type
  maxItems: number;             // Maximum furniture pieces to prevent overcrowding

  // Placement guidance
  focalPoint: string;           // Primary furniture placement description
  clearanceZones: string[];     // Areas that must remain clear

  // ControlNet weights for structure preservation
  controlnetWeights: ControlNetWeights;

  // Mask generation settings
  maskSettings: {
    floorCoverage: number;      // 0-1, how much of floor to mask for furniture
    wallArtEnabled: boolean;    // Whether to include wall areas for art
    ceilingExcluded: boolean;   // Always true - never mask ceiling
  };

  // Prompt modifiers for this room type
  promptKeywords: string[];     // Additional keywords for this room
  negativeKeywords: string[];   // Room-specific things to avoid
}

/**
 * Comprehensive staging rules for all room types
 */
export const ROOM_STAGING_RULES: Record<RoomType, RoomStagingRules> = {
  "living-room": {
    roomType: "living-room",
    label: "Living Room",
    requiredItems: [
      "sofa or sectional",
      "coffee table",
      "area rug",
    ],
    optionalItems: [
      "accent chair",
      "side table",
      "floor lamp",
      "table lamp",
      "wall art",
      "throw pillows",
      "decorative objects",
      "indoor plant",
    ],
    forbiddenItems: [
      "bed",
      "office desk",
      "kitchen appliances",
      "bathroom fixtures",
      "outdoor furniture",
    ],
    maxItems: 8,
    focalPoint: "Sofa positioned against the longest wall or facing a focal point like fireplace or TV area",
    clearanceZones: ["doorways", "windows", "fireplace", "walkways", "HVAC vents"],
    controlnetWeights: {
      depth: 0.85,
      canny: 0.5,
      segmentation: 0.6,
    },
    maskSettings: {
      floorCoverage: 0.6,
      wallArtEnabled: true,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "living room furniture",
      "comfortable seating arrangement",
      "conversation area",
    ],
    negativeKeywords: [
      "bedroom furniture",
      "kitchen items",
      "office equipment",
    ],
  },

  "bedroom-master": {
    roomType: "bedroom-master",
    label: "Master Bedroom",
    requiredItems: [
      "queen or king bed with upholstered headboard",
      "matching nightstands on both sides",
      "coordinated bedding with pillows",
    ],
    optionalItems: [
      "dresser",
      "bench at foot of bed",
      "area rug under bed",
      "table lamps on nightstands",
      "wall art above bed",
      "accent chair",
      "full-length mirror",
    ],
    forbiddenItems: [
      "sofa",
      "dining table",
      "office desk",
      "kitchen items",
      "children's furniture",
    ],
    maxItems: 7,
    focalPoint: "Bed centered on the primary wall with headboard against wall, allowing space on both sides",
    clearanceZones: ["closet doors", "bathroom door", "windows", "both sides of bed for access"],
    controlnetWeights: {
      depth: 0.9,
      canny: 0.4,
      segmentation: 0.7,
    },
    maskSettings: {
      floorCoverage: 0.5,
      wallArtEnabled: true,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "master bedroom",
      "luxury bedding",
      "serene sleeping space",
      "hotel-style bedroom",
    ],
    negativeKeywords: [
      "living room furniture",
      "children's items",
      "office equipment",
    ],
  },

  "bedroom-guest": {
    roomType: "bedroom-guest",
    label: "Guest Bedroom",
    requiredItems: [
      "queen or full bed with headboard",
      "nightstand",
      "coordinated bedding",
    ],
    optionalItems: [
      "second nightstand",
      "dresser",
      "area rug",
      "table lamp",
      "wall art",
      "small desk or vanity",
    ],
    forbiddenItems: [
      "sofa",
      "dining furniture",
      "kitchen items",
      "oversized furniture",
    ],
    maxItems: 6,
    focalPoint: "Bed against primary wall, can be asymmetric with one nightstand",
    clearanceZones: ["closet door", "room entry", "windows"],
    controlnetWeights: {
      depth: 0.85,
      canny: 0.4,
      segmentation: 0.6,
    },
    maskSettings: {
      floorCoverage: 0.5,
      wallArtEnabled: true,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "guest bedroom",
      "welcoming guest room",
      "comfortable bed",
    ],
    negativeKeywords: [
      "master bedroom items",
      "children's furniture",
    ],
  },

  "bedroom-kids": {
    roomType: "bedroom-kids",
    label: "Kids Bedroom",
    requiredItems: [
      "twin or full bed with headboard",
      "nightstand",
      "cheerful bedding",
    ],
    optionalItems: [
      "small desk and chair",
      "bookshelf",
      "area rug",
      "toy storage",
      "wall art or decals",
      "floor lamp or table lamp",
    ],
    forbiddenItems: [
      "adult furniture",
      "king bed",
      "bar furniture",
      "office equipment",
    ],
    maxItems: 6,
    focalPoint: "Bed positioned to allow play space, desk near window if possible",
    clearanceZones: ["closet door", "room entry", "play area"],
    controlnetWeights: {
      depth: 0.8,
      canny: 0.4,
      segmentation: 0.5,
    },
    maskSettings: {
      floorCoverage: 0.4,
      wallArtEnabled: true,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "kids bedroom",
      "child-friendly furniture",
      "playful room",
    ],
    negativeKeywords: [
      "adult furniture",
      "bar items",
      "sharp edges",
    ],
  },

  "dining-room": {
    roomType: "dining-room",
    label: "Dining Room",
    requiredItems: [
      "dining table appropriately sized for the room",
      "dining chairs (4-8 depending on table size)",
      "area rug under table",
    ],
    optionalItems: [
      "sideboard or buffet",
      "chandelier or pendant light",
      "table centerpiece",
      "wall art or mirror",
      "bar cart",
    ],
    forbiddenItems: [
      "bed",
      "sofa",
      "office desk",
      "kitchen appliances",
    ],
    maxItems: 6,
    focalPoint: "Dining table centered in room, allowing chair clearance on all sides",
    clearanceZones: ["all chair positions for pulling out", "doorways", "buffet access"],
    controlnetWeights: {
      depth: 0.85,
      canny: 0.5,
      segmentation: 0.6,
    },
    maskSettings: {
      floorCoverage: 0.5,
      wallArtEnabled: true,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "dining room",
      "formal dining",
      "dinner party ready",
    ],
    negativeKeywords: [
      "bedroom furniture",
      "living room seating",
    ],
  },

  "kitchen": {
    roomType: "kitchen",
    label: "Kitchen",
    requiredItems: [
      "bar stools at island or counter if present",
    ],
    optionalItems: [
      "decorative fruit bowl",
      "small potted plant or herbs",
      "coordinated canisters",
      "cookbook display",
      "decorative tray with items",
    ],
    forbiddenItems: [
      "sofa",
      "bed",
      "large furniture",
      "office equipment",
      "bathroom items",
    ],
    maxItems: 4,
    focalPoint: "Bar stools at island/counter, minimal counter decor",
    clearanceZones: ["appliance doors", "cabinet access", "work triangle", "walkways"],
    controlnetWeights: {
      depth: 0.7,
      canny: 0.8,
      segmentation: 0.5,
    },
    maskSettings: {
      floorCoverage: 0.2,
      wallArtEnabled: false,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "kitchen staging",
      "counter accessories",
      "culinary space",
    ],
    negativeKeywords: [
      "large furniture",
      "bedroom items",
      "clutter",
    ],
  },

  "home-office": {
    roomType: "home-office",
    label: "Home Office",
    requiredItems: [
      "desk appropriately sized for the space",
      "ergonomic office chair",
    ],
    optionalItems: [
      "bookshelf or shelving unit",
      "desk lamp",
      "area rug",
      "wall art or board",
      "desk accessories",
      "indoor plant",
      "filing cabinet",
    ],
    forbiddenItems: [
      "bed",
      "dining table",
      "kitchen appliances",
      "bathroom fixtures",
    ],
    maxItems: 6,
    focalPoint: "Desk positioned for natural light, facing into room or toward window",
    clearanceZones: ["chair movement area", "doorway", "bookshelf access"],
    controlnetWeights: {
      depth: 0.8,
      canny: 0.5,
      segmentation: 0.5,
    },
    maskSettings: {
      floorCoverage: 0.4,
      wallArtEnabled: true,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "home office",
      "work from home",
      "productive workspace",
    ],
    negativeKeywords: [
      "bedroom furniture",
      "living room furniture",
    ],
  },

  "bathroom": {
    roomType: "bathroom",
    label: "Bathroom",
    requiredItems: [
      "coordinated towels on towel bar or hooks",
      "bath mat",
    ],
    optionalItems: [
      "countertop accessories (soap dispenser, tray)",
      "small plant",
      "decorative candles",
      "wall art (appropriate for bathroom)",
      "shower curtain if needed",
    ],
    forbiddenItems: [
      "furniture",
      "rugs (non-bath)",
      "fabric items that would get wet",
      "electronics",
    ],
    maxItems: 5,
    focalPoint: "Towels and accessories visible, countertop neat and styled",
    clearanceZones: ["toilet access", "shower/tub access", "vanity access"],
    controlnetWeights: {
      depth: 0.6,
      canny: 0.8,
      segmentation: 0.4,
    },
    maskSettings: {
      floorCoverage: 0.1,
      wallArtEnabled: false,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "bathroom staging",
      "spa-like bathroom",
      "clean and fresh",
    ],
    negativeKeywords: [
      "furniture",
      "electronics",
      "personal items",
    ],
  },

  "outdoor-patio": {
    roomType: "outdoor-patio",
    label: "Outdoor/Patio",
    requiredItems: [
      "outdoor seating (chairs, sofa, or dining set)",
      "outdoor table",
    ],
    optionalItems: [
      "potted plants and planters",
      "outdoor rug",
      "throw pillows and cushions",
      "lanterns or string lights",
      "side tables",
      "umbrella if appropriate",
    ],
    forbiddenItems: [
      "indoor furniture",
      "electronics",
      "indoor rugs",
      "indoor lighting fixtures",
    ],
    maxItems: 8,
    focalPoint: "Seating arrangement for conversation or dining, oriented to view",
    clearanceZones: ["walkways", "door access", "grill area if present"],
    controlnetWeights: {
      depth: 0.7,
      canny: 0.4,
      segmentation: 0.5,
    },
    maskSettings: {
      floorCoverage: 0.5,
      wallArtEnabled: false,
      ceilingExcluded: true,
    },
    promptKeywords: [
      "outdoor living",
      "patio furniture",
      "alfresco dining",
      "outdoor entertaining",
    ],
    negativeKeywords: [
      "indoor furniture",
      "indoor items",
    ],
  },
};

/**
 * Get staging rules for a specific room type
 */
export function getRoomRules(roomType: RoomType): RoomStagingRules {
  return ROOM_STAGING_RULES[roomType] || ROOM_STAGING_RULES["living-room"];
}

/**
 * Get furniture list for a room type formatted for prompts
 */
export function getRoomFurniturePrompt(roomType: RoomType, styleLabel: string): string {
  const rules = getRoomRules(roomType);
  const required = rules.requiredItems.map(item => `${styleLabel} ${item}`).join(", ");
  const optional = rules.optionalItems.slice(0, 3).join(", "); // Limit optional items

  return `${required}, optionally ${optional}`;
}

/**
 * Get negative prompt additions for a room type
 */
export function getRoomNegativePrompt(roomType: RoomType): string {
  const rules = getRoomRules(roomType);
  return [...rules.forbiddenItems, ...rules.negativeKeywords].join(", ");
}

/**
 * Get ControlNet weights for a room type
 */
export function getRoomControlNetWeights(roomType: RoomType): ControlNetWeights {
  const rules = getRoomRules(roomType);
  return rules.controlnetWeights;
}

/**
 * Get placement guidance for a room type (focalPoint + clearanceZones)
 * This helps AI understand WHERE to place furniture, not just WHAT to place
 */
export function getRoomPlacementPrompt(roomType: RoomType): string {
  const rules = getRoomRules(roomType);
  const clearanceList = rules.clearanceZones.join(", ");

  return `Placement: ${rules.focalPoint}. Keep clear: ${clearanceList}`;
}

/**
 * Get the maximum number of furniture items for a room type
 */
export function getRoomMaxItems(roomType: RoomType): number {
  const rules = getRoomRules(roomType);
  return rules.maxItems;
}
