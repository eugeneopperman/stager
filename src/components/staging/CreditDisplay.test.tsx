import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { CreditDisplay } from "./CreditDisplay";

describe("CreditDisplay", () => {
  it("renders credits amount", () => {
    render(<CreditDisplay credits={50} creditsToUse={1} />);

    expect(screen.getByText("50 credits")).toBeInTheDocument();
  });

  it("shows credits to use when greater than 0", () => {
    render(<CreditDisplay credits={50} creditsToUse={5} />);

    expect(screen.getByText("Using 5 credits")).toBeInTheDocument();
  });

  it("shows singular 'credit' for 1 credit to use", () => {
    render(<CreditDisplay credits={50} creditsToUse={1} />);

    expect(screen.getByText("Using 1 credit")).toBeInTheDocument();
  });

  it("hides credits to use when 0", () => {
    render(<CreditDisplay credits={50} creditsToUse={0} />);

    expect(screen.queryByText(/Using/)).not.toBeInTheDocument();
  });

  it("shows insufficient credits message when not enough credits", () => {
    render(<CreditDisplay credits={2} creditsToUse={5} />);

    expect(screen.getByText("Need 5, have 2")).toBeInTheDocument();
  });

  it("applies destructive styling when insufficient credits", () => {
    const { container } = render(<CreditDisplay credits={2} creditsToUse={5} />);

    const creditsText = screen.getByText("2 credits");
    expect(creditsText.className).toContain("text-destructive");

    // Progress bar should also be destructive
    const progressBar = container.querySelector(".bg-destructive");
    expect(progressBar).toBeInTheDocument();
  });

  it("shows low credits warning when below threshold", () => {
    // LOW_CREDITS_THRESHOLD is typically 5
    render(<CreditDisplay credits={3} creditsToUse={1} />);

    const creditsText = screen.getByText("3 credits");
    expect(creditsText.className).toContain("text-amber");
  });

  it("applies primary styling when credits are sufficient", () => {
    const { container } = render(<CreditDisplay credits={100} creditsToUse={5} />);

    const progressBar = container.querySelector(".bg-primary");
    expect(progressBar).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <CreditDisplay credits={50} creditsToUse={1} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("calculates progress bar width correctly", () => {
    const { container } = render(<CreditDisplay credits={100} creditsToUse={25} />);

    // 25% used means 75% remaining
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: "75%" });
  });
});
