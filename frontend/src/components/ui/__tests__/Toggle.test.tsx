import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Toggle from "@/components/ui/Toggle";

afterEach(cleanup);

describe("Toggle", () => {
  it("renders label text", () => {
    render(<Toggle label="My Toggle" checked={false} onChange={() => {}} />);
    expect(screen.getByText("My Toggle")).toBeInTheDocument();
  });

  it("calls onChange with negated value on click", () => {
    const onChange = vi.fn();
    render(<Toggle label="Toggle" checked={false} onChange={onChange} />);

    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when currently checked", () => {
    const onChange = vi.fn();
    render(<Toggle label="Toggle" checked={true} onChange={onChange} />);

    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("reflects checked state via aria-checked attribute", () => {
    const { rerender } = render(
      <Toggle label="Toggle" checked={false} onChange={() => {}} />,
    );
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-checked", "false");

    rerender(<Toggle label="Toggle" checked={true} onChange={() => {}} />);
    expect(switchEl).toHaveAttribute("aria-checked", "true");
  });
});
