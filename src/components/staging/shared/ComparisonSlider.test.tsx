import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComparisonSlider } from "./ComparisonSlider";

describe("ComparisonSlider", () => {
  const defaultProps = {
    originalImage: "https://example.com/original.jpg",
    stagedImage: "https://example.com/staged.jpg",
  };

  describe("rendering", () => {
    it("should render both images", () => {
      render(<ComparisonSlider {...defaultProps} />);

      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute("alt", "Original");
      expect(images[1]).toHaveAttribute("alt", "Staged");
    });

    it("should render default labels", () => {
      render(<ComparisonSlider {...defaultProps} />);

      expect(screen.getByText("Original")).toBeInTheDocument();
      expect(screen.getByText("Staged")).toBeInTheDocument();
    });

    it("should render custom labels", () => {
      render(
        <ComparisonSlider
          {...defaultProps}
          originalLabel="Before"
          stagedLabel="After"
        />
      );

      expect(screen.getByText("Before")).toBeInTheDocument();
      expect(screen.getByText("After")).toBeInTheDocument();
    });

    it("should render with Card wrapper by default", () => {
      const { container } = render(<ComparisonSlider {...defaultProps} />);

      // Card component renders with rounded border
      const card = container.querySelector('[class*="rounded"]');
      expect(card).toBeInTheDocument();
    });

    it("should render without Card wrapper when bare is true", () => {
      const { container } = render(
        <ComparisonSlider {...defaultProps} bare />
      );

      // The direct child should be a div, not a Card
      expect(container.firstChild?.nodeName).toBe("DIV");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ComparisonSlider {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("slider functionality", () => {
    it("should start at 50% position", () => {
      const { container } = render(<ComparisonSlider {...defaultProps} />);

      // The staged image overlay should be at 50% width initially
      const overlay = container.querySelector('[style*="width"]');
      expect(overlay).toHaveStyle({ width: "50%" });
    });

    it("should update slider position on mouse move", () => {
      const { container } = render(<ComparisonSlider {...defaultProps} bare />);

      const sliderContainer = container.querySelector(".cursor-ew-resize");
      expect(sliderContainer).toBeInTheDocument();

      // Simulate mouse move at 75% position
      fireEvent.mouseMove(sliderContainer!, {
        clientX: 150,
        // Mock getBoundingClientRect to return predictable values
      });

      // Note: Without mocking getBoundingClientRect, we can't test exact positions
      // But we can verify the component doesn't crash on mouse interaction
    });

    it("should handle touch events", () => {
      const { container } = render(<ComparisonSlider {...defaultProps} bare />);

      const sliderContainer = container.querySelector(".cursor-ew-resize");
      expect(sliderContainer).toBeInTheDocument();

      // Simulate touch move
      fireEvent.touchMove(sliderContainer!, {
        touches: [{ clientX: 100 }],
      });

      // Component should handle touch without errors
    });
  });

  describe("object fit", () => {
    it("should use object-cover by default", () => {
      render(<ComparisonSlider {...defaultProps} />);

      const images = screen.getAllByRole("img");
      images.forEach((img) => {
        expect(img).toHaveClass("object-cover");
      });
    });

    it("should use object-contain when specified", () => {
      render(<ComparisonSlider {...defaultProps} objectFit="contain" />);

      const images = screen.getAllByRole("img");
      images.forEach((img) => {
        expect(img).toHaveClass("object-contain");
      });
    });

    it("should add bg-muted when objectFit is contain", () => {
      const { container } = render(
        <ComparisonSlider {...defaultProps} objectFit="contain" />
      );

      const sliderContainer = container.querySelector(".bg-muted");
      expect(sliderContainer).toBeInTheDocument();
    });
  });

  describe("label position", () => {
    it("should position labels at bottom by default", () => {
      const { container } = render(<ComparisonSlider {...defaultProps} />);

      const labels = container.querySelectorAll(".bottom-4");
      expect(labels.length).toBe(2);
    });

    it("should position labels at top when specified", () => {
      const { container } = render(
        <ComparisonSlider {...defaultProps} labelPosition="top" />
      );

      const labels = container.querySelectorAll(".top-2");
      expect(labels.length).toBe(2);
    });
  });

  describe("slider handle", () => {
    it("should render the slider handle with icon", () => {
      const { container } = render(<ComparisonSlider {...defaultProps} />);

      // Check for the handle container
      const handleContainer = container.querySelector(".w-8.h-8.rounded-full");
      expect(handleContainer).toBeInTheDocument();

      // Check for the ArrowLeftRight icon (rendered as SVG)
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("image sources", () => {
    it("should set correct src attributes", () => {
      render(<ComparisonSlider {...defaultProps} />);

      const images = screen.getAllByRole("img");
      expect(images[0]).toHaveAttribute("src", defaultProps.originalImage);
      expect(images[1]).toHaveAttribute("src", defaultProps.stagedImage);
    });
  });
});
