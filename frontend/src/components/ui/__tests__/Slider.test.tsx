import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Slider from "@/components/ui/Slider";

afterEach(cleanup);

const baseProps = {
  label: "Amount",
  value: 500,
  display: "$500",
  min: 0,
  max: 1000,
  step: 10,
  onChange: vi.fn(),
};

describe("Slider", () => {
  it("renders with label text", () => {
    render(<Slider {...baseProps} />);
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("range input has correct min, max, and value", () => {
    render(<Slider {...baseProps} />);
    const range = screen.getByRole("slider");
    expect(range).toHaveAttribute("min", "0");
    expect(range).toHaveAttribute("max", "1000");
    expect(range).toHaveValue("500");
  });

  it("range input has aria-label and aria-valuetext", () => {
    render(<Slider {...baseProps} />);
    const range = screen.getByRole("slider");
    expect(range).toHaveAttribute("aria-label", "Amount");
    expect(range).toHaveAttribute("aria-valuetext", "$500");
  });

  it("fires onChange callback when range input changes", () => {
    const onChange = vi.fn();
    render(<Slider {...baseProps} onChange={onChange} />);
    const range = screen.getByRole("slider");

    fireEvent.change(range, { target: { value: "600" } });
    expect(onChange).toHaveBeenCalledWith(600);
  });

  it("compact variant renders label and value side by side", () => {
    const { container } = render(
      <Slider {...baseProps} variant="compact" />,
    );

    // In compact mode the label and display are siblings inside a flex row
    const row = container.querySelector(".flex.items-center.justify-between");
    expect(row).toBeInTheDocument();

    // Label and value both present in that row
    expect(row?.textContent).toContain("Amount");
    expect(row?.textContent).toContain("$500");
  });
});
