import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { RoomTypeDropdown } from "./RoomTypeDropdown";

describe("RoomTypeDropdown", () => {
  it("renders with placeholder when no value selected", () => {
    render(<RoomTypeDropdown value={null} onChange={vi.fn()} />);

    expect(screen.getByText("Select room type")).toBeInTheDocument();
  });

  it("renders selected room type", () => {
    render(<RoomTypeDropdown value="living-room" onChange={vi.fn()} />);

    expect(screen.getByText("Living Room")).toBeInTheDocument();
  });

  it("renders combobox trigger", () => {
    render(<RoomTypeDropdown value={null} onChange={vi.fn()} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<RoomTypeDropdown value={null} onChange={vi.fn()} disabled />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
  });

  it("changes selected value when controlled", () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <RoomTypeDropdown value="living-room" onChange={handleChange} />
    );

    expect(screen.getByText("Living Room")).toBeInTheDocument();

    // Rerender with new value to simulate controlled component
    rerender(<RoomTypeDropdown value="kitchen" onChange={handleChange} />);

    expect(screen.getByText("Kitchen")).toBeInTheDocument();
  });

  it("displays master bedroom when selected", () => {
    render(<RoomTypeDropdown value="bedroom-master" onChange={vi.fn()} />);
    expect(screen.getByText("Master Bedroom")).toBeInTheDocument();
  });

  it("displays dining room when selected", () => {
    render(<RoomTypeDropdown value="dining-room" onChange={vi.fn()} />);
    expect(screen.getByText("Dining Room")).toBeInTheDocument();
  });

  it("displays home office when selected", () => {
    render(<RoomTypeDropdown value="home-office" onChange={vi.fn()} />);
    expect(screen.getByText("Home Office")).toBeInTheDocument();
  });
});
