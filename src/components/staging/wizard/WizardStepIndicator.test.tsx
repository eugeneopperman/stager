import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { WizardStepIndicator, type WizardStep } from "./WizardStepIndicator";

describe("WizardStepIndicator", () => {
  it("renders all 4 step labels", () => {
    render(<WizardStepIndicator currentStep="upload" />);

    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("Prepare")).toBeInTheDocument();
    expect(screen.getByText("Style")).toBeInTheDocument();
    expect(screen.getByText("Generate")).toBeInTheDocument();
  });

  it("marks first step as current when on upload", () => {
    const { container } = render(<WizardStepIndicator currentStep="upload" />);

    // First step should have current styling (ring-4)
    const stepIndicators = container.querySelectorAll(".rounded-full");
    expect(stepIndicators[0].className).toContain("ring-4");
  });

  it("marks previous steps as completed", () => {
    const { container } = render(<WizardStepIndicator currentStep="style" />);

    // Check marks should be present for completed steps (upload and prepare)
    const checkIcons = container.querySelectorAll('svg');
    // First two steps should show check icons
    expect(checkIcons.length).toBeGreaterThanOrEqual(2);
  });

  it("marks upcoming steps with muted styling", () => {
    const { container } = render(<WizardStepIndicator currentStep="upload" />);

    // Get step indicator containers
    const stepIndicators = container.querySelectorAll('[class*="rounded-full"][class*="border-2"]');

    // Steps 2, 3, 4 should have muted styling (border-border)
    expect(stepIndicators[1].className).toContain("border-border");
    expect(stepIndicators[2].className).toContain("border-border");
    expect(stepIndicators[3].className).toContain("border-border");
  });

  it("handles processing step correctly", () => {
    const { container } = render(<WizardStepIndicator currentStep="processing" />);

    // Processing is treated as step 4, so all steps should be completed
    const stepIndicators = container.querySelectorAll('[class*="rounded-full"][class*="border-2"]');

    // All 4 steps should show as completed (border-primary bg-primary)
    stepIndicators.forEach((indicator) => {
      expect(indicator.className).toContain("border-primary");
      expect(indicator.className).toContain("bg-primary");
    });
  });

  it("handles complete step correctly", () => {
    const { container } = render(<WizardStepIndicator currentStep="complete" />);

    // Complete is treated as step 4, so all steps should be completed
    const stepIndicators = container.querySelectorAll('[class*="rounded-full"][class*="border-2"]');

    stepIndicators.forEach((indicator) => {
      expect(indicator.className).toContain("border-primary");
      expect(indicator.className).toContain("bg-primary");
    });
  });

  it("renders connector lines between steps", () => {
    const { container } = render(<WizardStepIndicator currentStep="upload" />);

    // Should have 3 connector lines (between 4 steps)
    const connectors = container.querySelectorAll(".h-0\\.5");
    expect(connectors.length).toBe(3);
  });

  it("colors connector lines based on progress", () => {
    const { container } = render(<WizardStepIndicator currentStep="style" />);

    // With style as current (step 3), first connector should be fully colored
    const connectors = container.querySelectorAll(".h-0\\.5");

    // First connector (upload -> prepare) should be primary
    expect(connectors[0].className).toContain("bg-primary");

    // Second connector (prepare -> style) should be gradient (partially complete)
    expect(connectors[1].className).toContain("bg-gradient-to-r");

    // Third connector (style -> generate) should be border (incomplete)
    expect(connectors[2].className).toContain("bg-border");
  });

  it("applies custom className", () => {
    const { container } = render(
      <WizardStepIndicator currentStep="upload" className="my-custom-class" />
    );

    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  const steps: WizardStep[] = ["upload", "prepare", "style", "generate"];

  steps.forEach((step, index) => {
    it(`correctly identifies step ${index + 1} (${step}) as current`, () => {
      const { container } = render(<WizardStepIndicator currentStep={step} />);

      const stepIndicators = container.querySelectorAll('[class*="rounded-full"][class*="border-2"]');

      // Current step should have ring-4 styling
      expect(stepIndicators[index].className).toContain("ring-4");

      // Previous steps should be completed (not have ring)
      for (let i = 0; i < index; i++) {
        expect(stepIndicators[i].className).not.toContain("ring-4");
        expect(stepIndicators[i].className).toContain("bg-primary");
      }
    });
  });
});
