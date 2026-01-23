import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import { ActionButton, HoverActionButton } from "./action-button";
import { Download, Star } from "lucide-react";

describe("ActionButton", () => {
  it("renders with icon and tooltip", async () => {
    render(<ActionButton icon={Download} tooltip="Download file" />);

    // Icon should be rendered
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    // Hover to see tooltip - Radix renders multiple copies for accessibility
    await userEvent.hover(button);
    const tooltips = await screen.findAllByText("Download file");
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    render(
      <ActionButton icon={Download} tooltip="Download" onClick={handleClick} />
    );

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows loading spinner when loading", () => {
    render(<ActionButton icon={Download} tooltip="Download" loading />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<ActionButton icon={Download} tooltip="Download" disabled />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies active styling when active", () => {
    render(<ActionButton icon={Star} tooltip="Favorite" active />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-accent");
  });

  it("applies custom className", () => {
    render(
      <ActionButton
        icon={Download}
        tooltip="Download"
        className="custom-class"
      />
    );

    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-class");
  });

  it("applies custom iconClassName", () => {
    const { container } = render(
      <ActionButton
        icon={Star}
        tooltip="Favorite"
        iconClassName="text-yellow-500"
      />
    );

    const svg = container.querySelector("svg");
    // SVG className is SVGAnimatedString, use classList or getAttribute
    expect(svg?.classList.contains("text-yellow-500")).toBe(true);
  });
});

describe("HoverActionButton", () => {
  it("renders with icon and tooltip", async () => {
    render(<HoverActionButton icon={Download} tooltip="Download file" />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    // Radix renders tooltip text in multiple places for accessibility
    await userEvent.hover(button);
    const tooltips = await screen.findAllByText("Download file");
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    render(
      <HoverActionButton
        icon={Download}
        tooltip="Download"
        onClick={handleClick}
      />
    );

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies active styling when active", () => {
    render(<HoverActionButton icon={Star} tooltip="Favorite" active />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-white/20");
  });

  it("applies destructive styling when destructive", () => {
    render(<HoverActionButton icon={Star} tooltip="Delete" destructive />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("hover:bg-red-500/50");
  });

  it("shows loading spinner when loading", () => {
    render(<HoverActionButton icon={Download} tooltip="Download" loading />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
