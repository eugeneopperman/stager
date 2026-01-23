import { describe, it, expect } from "vitest";
import {
  formatRoomType,
  formatStyle,
  formatShortDate,
  formatFullDate,
} from "./formatters";

describe("formatters", () => {
  describe("formatRoomType", () => {
    it("converts hyphenated room type to title case", () => {
      expect(formatRoomType("living-room")).toBe("Living Room");
      expect(formatRoomType("master-bedroom")).toBe("Master Bedroom");
      expect(formatRoomType("home-office")).toBe("Home Office");
    });

    it("handles single word room types", () => {
      expect(formatRoomType("kitchen")).toBe("Kitchen");
      expect(formatRoomType("bathroom")).toBe("Bathroom");
    });

    it("handles multi-hyphen room types", () => {
      expect(formatRoomType("kids-play-room")).toBe("Kids Play Room");
    });
  });

  describe("formatStyle", () => {
    it("converts hyphenated style to title case", () => {
      expect(formatStyle("mid-century-modern")).toBe("Mid Century Modern");
      expect(formatStyle("art-deco")).toBe("Art Deco");
    });

    it("handles single word styles", () => {
      expect(formatStyle("modern")).toBe("Modern");
      expect(formatStyle("scandinavian")).toBe("Scandinavian");
    });
  });

  describe("formatShortDate", () => {
    it("formats date to short format", () => {
      const result = formatShortDate("2024-01-15T10:30:00Z");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
    });

    it("handles different months", () => {
      // Use noon UTC to avoid timezone edge cases
      expect(formatShortDate("2024-06-20T12:00:00Z")).toContain("Jun");
      expect(formatShortDate("2024-12-15T12:00:00Z")).toContain("Dec");
    });
  });

  describe("formatFullDate", () => {
    it("formats date with time", () => {
      const result = formatFullDate("2024-01-15T14:30:00Z");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });

    it("includes time component", () => {
      // Note: Exact format depends on locale, but should include time
      const result = formatFullDate("2024-01-15T14:30:00Z");
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
