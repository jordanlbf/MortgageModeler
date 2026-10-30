import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

afterEach(cleanup);

/** The labelled row used by tax/AdvancedColumn (was ui/Toggle `reverse`). */
function Row({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Label variant="bare" className="flex w-full cursor-pointer items-center justify-between">
      <span>My Toggle</span>
      <Switch variant="accent" checked={checked} onCheckedChange={onChange} />
    </Label>
  );
}

describe("Switch variant=accent", () => {
  it("renders label text and names the switch after it", () => {
    render(<Row checked={false} onChange={() => {}} />);
    expect(screen.getByText("My Toggle")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "My Toggle" })).toBeInTheDocument();
  });

  it("calls onCheckedChange with true on click when unchecked", () => {
    const onChange = vi.fn();
    render(<Row checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onCheckedChange with false when currently checked", () => {
    const onChange = vi.fn();
    render(<Row checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("toggles when the label text is clicked", () => {
    const onChange = vi.fn();
    render(<Row checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByText("My Toggle"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("reflects checked state via aria-checked and data-state", () => {
    const { rerender } = render(<Row checked={false} onChange={() => {}} />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-checked", "false");
    expect(switchEl).toHaveAttribute("data-state", "unchecked");

    rerender(<Row checked={true} onChange={() => {}} />);
    expect(switchEl).toHaveAttribute("aria-checked", "true");
    expect(switchEl).toHaveAttribute("data-state", "checked");
  });

  it("uses the accent track size, not the stock one", () => {
    render(<Row checked={false} onChange={() => {}} />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveClass("h-[20px]", "w-[36px]");
    expect(switchEl).toHaveAttribute("data-variant", "accent");
  });
});
