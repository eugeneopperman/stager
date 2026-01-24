import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import { PlanCard } from "./PlanCard";
import type { Plan } from "@/lib/database.types";

const createMockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "1",
  slug: "starter",
  name: "Starter",
  description: "Perfect for individuals",
  price_cents: 999,
  credits_per_month: 50,
  features: ["Feature 1", "Feature 2"],
  stripe_price_id: "price_123",
  max_team_members: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("PlanCard", () => {
  it("renders plan name and description", () => {
    const plan = createMockPlan();
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Perfect for individuals")).toBeInTheDocument();
  });

  it("formats price correctly", () => {
    const plan = createMockPlan({ price_cents: 1999 });
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    expect(screen.getByText("$20")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("shows Free for zero price", () => {
    const plan = createMockPlan({ price_cents: 0, slug: "free" });
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.queryByText("/month")).not.toBeInTheDocument();
  });

  it("displays credits per month", () => {
    const plan = createMockPlan({ credits_per_month: 100 });
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("credits/month")).toBeInTheDocument();
  });

  it("renders all features", () => {
    const plan = createMockPlan({
      features: ["Unlimited access", "Priority support", "API access"],
    });
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    expect(screen.getByText("Unlimited access")).toBeInTheDocument();
    expect(screen.getByText("Priority support")).toBeInTheDocument();
    expect(screen.getByText("API access")).toBeInTheDocument();
  });

  it("calls onSelect when subscribe button is clicked", async () => {
    const handleSelect = vi.fn();
    const plan = createMockPlan();
    render(<PlanCard plan={plan} onSelect={handleSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(handleSelect).toHaveBeenCalledWith(plan);
  });

  it("shows Get Started for free plan", () => {
    const plan = createMockPlan({ price_cents: 0, slug: "free" });
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument();
  });

  it("shows Current Plan badge and disabled button when plan is current", () => {
    const plan = createMockPlan();
    render(<PlanCard plan={plan} currentPlanSlug="starter" onSelect={vi.fn()} />);

    // Both badge and button show "Current Plan", so getAllByText
    const currentPlanTexts = screen.getAllByText("Current Plan");
    expect(currentPlanTexts.length).toBe(2); // Badge + Button
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows Most Popular badge for professional plan", () => {
    const plan = createMockPlan({ slug: "professional" });
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("shows For Teams badge for enterprise plan", () => {
    const plan = createMockPlan({ slug: "enterprise" });
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    expect(screen.getByText("For Teams")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    const plan = createMockPlan();
    render(<PlanCard plan={plan} isLoading onSelect={vi.fn()} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("handles empty features array", () => {
    const plan = createMockPlan({ features: [] });
    render(<PlanCard plan={plan} onSelect={vi.fn()} />);

    // Should still render without errors
    expect(screen.getByText("Starter")).toBeInTheDocument();
  });
});
