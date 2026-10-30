import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SliderField from "@/components/domain/SliderField";

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

describe("SliderField", () => {
  it("renders with label text and the display value", () => {
    render(<SliderField {...baseProps} />);
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByDisplayValue("$500")).toBeInTheDocument();
  });

  it("slider thumb exposes min, max and value", () => {
    render(<SliderField {...baseProps} />);
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "1000");
    expect(thumb).toHaveAttribute("aria-valuenow", "500");
  });

  it("slider thumb has aria-label and aria-valuetext", () => {
    render(<SliderField {...baseProps} />);
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-label", "Amount");
    expect(thumb).toHaveAttribute("aria-valuetext", "$500");
  });

  it("fires onChange stepped by `step` on keyboard input", () => {
    const onChange = vi.fn();
    render(<SliderField {...baseProps} onChange={onChange} />);
    const thumb = screen.getByRole("slider");
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(510);
    fireEvent.keyDown(thumb, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(1000);
  });

  it("commits a typed value, clamped to [min, max]", () => {
    const onChange = vi.fn();
    render(
      <SliderField
        {...baseProps}
        onChange={onChange}
        editable
        parseDisplay={(d) => Number(d.replace(/[^0-9.]/g, ""))}
      />,
    );
    const input = screen.getByDisplayValue("$500");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "5000" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(1000);
  });

  it("passes the accent colour down as --slider-accent", () => {
    const { container } = render(<SliderField {...baseProps} accent="red" />);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--slider-accent")).toBe("red");
  });
});
